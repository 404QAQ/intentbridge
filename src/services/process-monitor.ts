/**
 * Process Monitor Service - v3.1.0
 *
 * Monitors running processes, tracks resource usage, and manages process lifecycle
 */

import { exec, spawn, ChildProcess } from 'node:child_process';
import { promisify } from 'node:util';
import { platform } from 'node:os';
import type { ProcessInfo, ResourceUsage, ProcessOptions, SystemResources } from '../models/types.js';
import { PortScanner } from './port-scanner.js';

const execAsync = promisify(exec);

/**
 * Process Monitor - Track and manage processes
 */
export class ProcessMonitor {
  private portScanner: PortScanner;
  private monitoredProcesses: Map<number, ChildProcess> = new Map();
  private processProjectMap: Map<number, string> = new Map();

  constructor() {
    this.portScanner = new PortScanner();
  }

  /**
   * Get all running processes
   */
  async getRunningProcesses(): Promise<ProcessInfo[]> {
    try {
      const pPlatform = platform();

      if (pPlatform === 'darwin' || pPlatform === 'linux') {
        return await this.getRunningProcessesUnix();
      } else if (pPlatform === 'win32') {
        return await this.getRunningProcessesWindows();
      }

      return [];
    } catch {
      return [];
    }
  }

  /**
   * Get running processes for Unix-based systems
   */
  private async getRunningProcessesUnix(): Promise<ProcessInfo[]> {
    try {
      const { stdout } = await execAsync('ps aux --no-headers');
      const lines = stdout.trim().split('\n');
      const processes: ProcessInfo[] = [];

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 11) continue;

        const pid = parseInt(parts[1], 10);
        const cpu = parseFloat(parts[2]);
        const memory = parseFloat(parts[3]);
        const command = parts[10];

        processes.push({
          pid,
          command,
          cpu,
          memory,
          status: 'running',
          project: this.processProjectMap.get(pid),
        });
      }

      return processes;
    } catch {
      return [];
    }
  }

  /**
   * Get running processes for Windows
   */
  private async getRunningProcessesWindows(): Promise<ProcessInfo[]> {
    try {
      const { stdout } = await execAsync('tasklist /V /FO CSV');
      const lines = stdout.trim().split('\n');
      const processes: ProcessInfo[] = [];

      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        if (values.length < 5) continue;

        const command = values[0].replace(/"/g, '');
        const pid = parseInt(values[1].replace(/"/g, ''), 10);
        const memoryStr = values[4]?.replace(/"/g, '').replace(/,/g, '') || '0';
        const memory = parseInt(memoryStr, 10) / 1024 / 1024;

        processes.push({
          pid,
          command,
          memory,
          status: 'running',
          project: this.processProjectMap.get(pid),
        });
      }

      return processes;
    } catch {
      return [];
    }
  }

  /**
   * Parse a CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  /**
   * Get processes by project
   */
  async getProjectProcesses(projectName: string): Promise<ProcessInfo[]> {
    const allProcesses = await this.getRunningProcesses();
    return allProcesses.filter(p => p.project === projectName);
  }

  /**
   * Get process details
   */
  async getProcessDetails(pid: number): Promise<ProcessInfo | null> {
    return this.portScanner.getProcessDetails(pid);
  }

  /**
   * Monitor process resource usage
   */
  async monitorProcess(pid: number): Promise<ResourceUsage | null> {
    try {
      const pPlatform = platform();

      if (pPlatform === 'darwin' || pPlatform === 'linux') {
        return await this.monitorProcessUnix(pid);
      } else if (pPlatform === 'win32') {
        return await this.monitorProcessWindows(pid);
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Monitor process on Unix-based systems
   */
  private async monitorProcessUnix(pid: number): Promise<ResourceUsage | null> {
    try {
      const { stdout } = await execAsync(`ps -p ${pid} -o %cpu,%mem,rss --no-headers 2>/dev/null || true`);
      const parts = stdout.trim().split(/\s+/);

      if (parts.length < 3) {
        return null;
      }

      const cpu = parseFloat(parts[0]) || 0;
      const memoryPercent = parseFloat(parts[1]) || 0;
      const rssKB = parseInt(parts[2], 10) || 0;
      const memory = rssKB / 1024; // Convert to MB

      return {
        cpu,
        memory,
        memoryPercent,
        timestamp: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  /**
   * Monitor process on Windows
   */
  private async monitorProcessWindows(pid: number): Promise<ResourceUsage | null> {
    try {
      const { stdout } = await execAsync(`typeperf "\\Process(${pid})\\% Processor Time" "\\Process(${pid})\\Working Set" -sc 1`);
      const lines = stdout.trim().split('\n');

      if (lines.length < 3) {
        return null;
      }

      const values = lines[2].split(',');
      const cpu = parseFloat(values[1].replace(/"/g, '')) || 0;
      const workingSet = parseInt(values[2].replace(/"/g, ''), 10) || 0;
      const memory = workingSet / 1024 / 1024; // Convert to MB

      return {
        cpu,
        memory,
        memoryPercent: 0, // Would need system memory info
        timestamp: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  /**
   * Start a monitored process
   */
  async startMonitoredProcess(
    command: string,
    options: ProcessOptions,
    projectName?: string
  ): Promise<ProcessInfo> {
    return new Promise((resolve, reject) => {
      const args = command.split(' ');
      const cmd = args.shift() || command;

      const childProcess = spawn(cmd, args, {
        cwd: options.cwd,
        env: { ...process.env, ...options.env },
        detached: options.detached ?? true,
        shell: options.shell ?? true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const pid = childProcess.pid;

      if (!pid) {
        reject(new Error('Failed to start process'));
        return;
      }

      // Track the process
      this.monitoredProcesses.set(pid, childProcess);
      if (projectName) {
        this.processProjectMap.set(pid, projectName);
      }

      // Handle process events
      childProcess.on('error', (err) => {
        this.monitoredProcesses.delete(pid);
        this.processProjectMap.delete(pid);
        reject(err);
      });

      childProcess.on('exit', () => {
        this.monitoredProcesses.delete(pid);
        this.processProjectMap.delete(pid);
      });

      // Resolve after a short delay to confirm process started
      setTimeout(async () => {
        const processInfo = await this.getProcessDetails(pid);
        if (processInfo) {
          resolve(processInfo);
        } else {
          resolve({
            pid,
            command: cmd,
            status: 'running',
            project: projectName,
          });
        }
      }, 500);
    });
  }

  /**
   * Stop a process
   */
  async stopProcess(pid: number, force: boolean = false): Promise<boolean> {
    try {
      // If it's a monitored process, kill it
      const childProcess = this.monitoredProcesses.get(pid);
      if (childProcess) {
        if (force) {
          childProcess.kill('SIGKILL');
        } else {
          childProcess.kill('SIGTERM');
        }
        this.monitoredProcesses.delete(pid);
        this.processProjectMap.delete(pid);
        return true;
      }

      // Otherwise use port scanner to kill
      return await this.portScanner.killProcess(pid, force);
    } catch {
      return false;
    }
  }

  /**
   * Restart a process
   */
  async restartProcess(
    pid: number,
    command: string,
    options: ProcessOptions,
    projectName?: string
  ): Promise<ProcessInfo | null> {
    // Stop existing process
    await this.stopProcess(pid);

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Start new process
    return this.startMonitoredProcess(command, options, projectName);
  }

  /**
   * Get system resources
   */
  async getSystemResources(): Promise<SystemResources> {
    try {
      const pPlatform = platform();

      if (pPlatform === 'darwin' || pPlatform === 'linux') {
        return await this.getSystemResourcesUnix();
      } else if (pPlatform === 'win32') {
        return await this.getSystemResourcesWindows();
      }

      return this.getDefaultSystemResources();
    } catch {
      return this.getDefaultSystemResources();
    }
  }

  /**
   * Get default system resources (fallback)
   */
  private getDefaultSystemResources(): SystemResources {
    return {
      cpu: {
        cores: 1,
        usage: 0,
      },
      memory: {
        total: 0,
        used: 0,
        free: 0,
        usagePercent: 0,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get system resources on Unix-based systems
   */
  private async getSystemResourcesUnix(): Promise<SystemResources> {
    try {
      // Get CPU info
      const { stdout: cpuCoresStdout } = await execAsync('nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 1');
      const cores = parseInt(cpuCoresStdout.trim(), 10) || 1;

      // Get CPU usage
      const { stdout: cpuUsageStdout } = await execAsync("top -l 1 | grep 'CPU usage' | awk '{print $3}' 2>/dev/null || echo 0");
      const cpuUsage = parseFloat(cpuUsageStdout.trim().replace('%', '')) || 0;

      // Get memory info
      const { stdout: memInfoStdout } = await execAsync('cat /proc/meminfo 2>/dev/null || vm_stat 2>/dev/null');
      let totalMemory = 0;
      let freeMemory = 0;

      if (memInfoStdout.includes('MemTotal')) {
        // Linux format
        const memTotalMatch = memInfoStdout.match(/MemTotal:\s+(\d+)/);
        const memFreeMatch = memInfoStdout.match(/MemAvailable:\s+(\d+)/) || memInfoStdout.match(/MemFree:\s+(\d+)/);

        if (memTotalMatch) totalMemory = parseInt(memTotalMatch[1], 10) / 1024; // Convert to MB
        if (memFreeMatch) freeMemory = parseInt(memFreeMatch[1], 10) / 1024; // Convert to MB
      } else {
        // macOS format
        const pageSize = 4096;
        const freePagesMatch = memInfoStdout.match(/free:\s+(\d+)/);
        const totalPagesMatch = memInfoStdout.match(/Pages free:\s+(\d+)/);

        if (freePagesMatch) freeMemory = (parseInt(freePagesMatch[1], 10) * pageSize) / 1024 / 1024;

        // Get total memory using sysctl
        const { stdout: totalMemStdout } = await execAsync('sysctl -n hw.memsize 2>/dev/null || echo 0');
        totalMemory = parseInt(totalMemStdout.trim(), 10) / 1024 / 1024; // Convert to MB
      }

      const usedMemory = totalMemory - freeMemory;
      const usagePercent = totalMemory > 0 ? (usedMemory / totalMemory) * 100 : 0;

      return {
        cpu: {
          cores,
          usage: cpuUsage,
        },
        memory: {
          total: Math.round(totalMemory),
          used: Math.round(usedMemory),
          free: Math.round(freeMemory),
          usagePercent: Math.round(usagePercent * 100) / 100,
        },
        timestamp: new Date().toISOString(),
      };
    } catch {
      return this.getDefaultSystemResources();
    }
  }

  /**
   * Get system resources on Windows
   */
  private async getSystemResourcesWindows(): Promise<SystemResources> {
    try {
      // Get CPU info
      const { stdout: cpuCoresStdout } = await execAsync('wmic cpu get NumberOfCores /value 2>nul | findstr NumberOfCores');
      const coresMatch = cpuCoresStdout.match(/NumberOfCores=(\d+)/);
      const cores = coresMatch ? parseInt(coresMatch[1], 10) : 1;

      // Get memory info
      const { stdout: memInfoStdout } = await execAsync('wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value 2>nul');
      const totalMatch = memInfoStdout.match(/TotalVisibleMemorySize=(\d+)/);
      const freeMatch = memInfoStdout.match(/FreePhysicalMemory=(\d+)/);

      const totalMemory = totalMatch ? parseInt(totalMatch[1], 10) / 1024 : 0; // Convert to MB
      const freeMemory = freeMatch ? parseInt(freeMatch[1], 10) / 1024 : 0;
      const usedMemory = totalMemory - freeMemory;
      const usagePercent = totalMemory > 0 ? (usedMemory / totalMemory) * 100 : 0;

      // CPU usage would require more complex WMI queries
      const cpuUsage = 0;

      return {
        cpu: {
          cores,
          usage: cpuUsage,
        },
        memory: {
          total: Math.round(totalMemory),
          used: Math.round(usedMemory),
          free: Math.round(freeMemory),
          usagePercent: Math.round(usagePercent * 100) / 100,
        },
        timestamp: new Date().toISOString(),
      };
    } catch {
      return this.getDefaultSystemResources();
    }
  }

  /**
   * Register a process to a project
   */
  registerProcessToProject(pid: number, projectName: string): void {
    this.processProjectMap.set(pid, projectName);
  }

  /**
   * Unregister a process from a project
   */
  unregisterProcessFromProject(pid: number): void {
    this.processProjectMap.delete(pid);
  }

  /**
   * Get monitored processes
   */
  getMonitoredProcesses(): number[] {
    return Array.from(this.monitoredProcesses.keys());
  }

  /**
   * Cleanup dead processes
   */
  cleanupDeadProcesses(): void {
    for (const [pid] of this.monitoredProcesses) {
      try {
        // Check if process is still alive
        process.kill(pid, 0);
      } catch {
        // Process is dead, remove from tracking
        this.monitoredProcesses.delete(pid);
        this.processProjectMap.delete(pid);
      }
    }
  }
}

// Export singleton instance
export const processMonitor = new ProcessMonitor();
