/**
 * Port Scanner Service - v3.1.0
 *
 * Provides port availability checking, scanning, and process detection
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { createConnection } from 'node:net';
import type { PortStatus, ProcessInfo } from '../models/types.js';

const execAsync = promisify(exec);

/**
 * Port Scanner - Check port availability and detect processes
 */
export class PortScanner {
  /**
   * Check if a port is in use
   */
  async isPortInUse(port: number, host: string = 'localhost'): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = createConnection({ port, host }, () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('error', () => {
        resolve(false);
      });

      socket.setTimeout(1000);
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Get process using a specific port
   */
  async getProcessOnPort(port: number): Promise<ProcessInfo | null> {
    try {
      const platform = process.platform;

      if (platform === 'darwin' || platform === 'linux') {
        return await this.getProcessOnPortUnix(port);
      } else if (platform === 'win32') {
        return await this.getProcessOnPortWindows(port);
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get process on port for Unix-based systems (macOS, Linux)
   */
  private async getProcessOnPortUnix(port: number): Promise<ProcessInfo | null> {
    try {
      // Use lsof to find process using the port
      const { stdout } = await execAsync(`lsof -i :${port} -P -n -t 2>/dev/null || true`);
      const pids = stdout.trim().split('\n').filter(Boolean);

      if (pids.length === 0) {
        return null;
      }

      const pid = parseInt(pids[0], 10);
      return await this.getProcessDetails(pid);
    } catch {
      return null;
    }
  }

  /**
   * Get process on port for Windows
   */
  private async getProcessOnPortWindows(port: number): Promise<ProcessInfo | null> {
    try {
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      const lines = stdout.trim().split('\n');

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const pid = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(pid) && pid > 0) {
            return await this.getProcessDetails(pid);
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get detailed process information by PID
   */
  async getProcessDetails(pid: number): Promise<ProcessInfo | null> {
    try {
      const platform = process.platform;

      if (platform === 'darwin' || platform === 'linux') {
        return await this.getProcessDetailsUnix(pid);
      } else if (platform === 'win32') {
        return await this.getProcessDetailsWindows(pid);
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get process details for Unix-based systems
   */
  private async getProcessDetailsUnix(pid: number): Promise<ProcessInfo | null> {
    try {
      // Get command and args
      const { stdout: cmdStdout } = await execAsync(`ps -p ${pid} -o command= 2>/dev/null || true`);
      const command = cmdStdout.trim();

      if (!command) {
        return null;
      }

      const parts = command.split(' ');
      const cmd = parts[0].split('/').pop() || parts[0];
      const args = parts.slice(1);

      // Get CPU and memory usage
      let cpu = 0;
      let memory = 0;

      try {
        const { stdout: statsStdout } = await execAsync(`ps -p ${pid} -o %cpu,%mem --no-headers 2>/dev/null || true`);
        const stats = statsStdout.trim().split(/\s+/);
        if (stats.length >= 2) {
          cpu = parseFloat(stats[0]) || 0;
          memory = parseFloat(stats[1]) || 0;
        }
      } catch {
        // Ignore stats errors
      }

      // Get start time
      let startTime: string | undefined;
      try {
        const { stdout: timeStdout } = await execAsync(`ps -p ${pid} -o lstart= 2>/dev/null || true`);
        startTime = timeStdout.trim() || undefined;
      } catch {
        // Ignore time errors
      }

      // Get ports used by this process
      let ports: number[] = [];
      try {
        const { stdout: portsStdout } = await execAsync(`lsof -p ${pid} -i -P -n 2>/dev/null | grep LISTEN || true`);
        const portLines = portsStdout.trim().split('\n').filter(Boolean);
        ports = portLines
          .map(line => {
            const match = line.match(/:(\d+)\s+\(LISTEN\)/);
            return match ? parseInt(match[1], 10) : null;
          })
          .filter((p): p is number => p !== null);
      } catch {
        // Ignore port errors
      }

      return {
        pid,
        command: cmd,
        args,
        cpu,
        memory,
        startTime,
        status: 'running',
        ports,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get process details for Windows
   */
  private async getProcessDetailsWindows(pid: number): Promise<ProcessInfo | null> {
    try {
      const { stdout } = await execAsync(`tasklist /FI "PID eq ${pid}" /V /FO CSV`);
      const lines = stdout.trim().split('\n');

      if (lines.length < 2) {
        return null;
      }

      // Parse CSV
      const values = this.parseCSVLine(lines[1]);

      if (values.length < 2) {
        return null;
      }

      const command = values[0].replace(/"/g, '');
      const memoryStr = values[4]?.replace(/"/g, '').replace(/,/g, '') || '0';
      const memory = parseInt(memoryStr, 10) / 1024 / 1024; // Convert to MB

      return {
        pid,
        command,
        memory,
        status: 'running',
      };
    } catch {
      return null;
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
   * Scan a range of ports
   */
  async scanPorts(start: number, end: number): Promise<PortStatus[]> {
    const results: PortStatus[] = [];
    const promises: Promise<void>[] = [];

    for (let port = start; port <= end; port++) {
      promises.push((async () => {
        const inUse = await this.isPortInUse(port);
        let process: ProcessInfo | null = null;

        if (inUse) {
          process = await this.getProcessOnPort(port);
        }

        results.push({
          port,
          inUse,
          process: process || undefined,
        });
      })());
    }

    await Promise.all(promises);

    return results.sort((a, b) => a.port - b.port);
  }

  /**
   * Find available ports
   */
  async findAvailablePorts(count: number, startPort: number = 3000, endPort: number = 9999): Promise<number[]> {
    const available: number[] = [];
    let port = startPort;

    while (available.length < count && port <= endPort) {
      const inUse = await this.isPortInUse(port);
      if (!inUse) {
        available.push(port);
      }
      port++;
    }

    return available;
  }

  /**
   * Find available port in a range
   */
  async findAvailablePort(startPort: number, endPort: number): Promise<number | null> {
    for (let port = startPort; port <= endPort; port++) {
      const inUse = await this.isPortInUse(port);
      if (!inUse) {
        return port;
      }
    }
    return null;
  }

  /**
   * Find available port by project type
   */
  async findAvailablePortByType(type: string, portRanges: Record<string, string>): Promise<number | null> {
    const range = portRanges[type];
    if (!range) {
      // Default to generic range
      return this.findAvailablePort(3000, 9999);
    }

    const [start, end] = range.split('-').map(n => parseInt(n.trim(), 10));
    return this.findAvailablePort(start, end);
  }

  /**
   * Kill process on port
   */
  async killProcessOnPort(port: number, force: boolean = false): Promise<boolean> {
    try {
      const processInfo = await this.getProcessOnPort(port);

      if (!processInfo) {
        return false;
      }

      return await this.killProcess(processInfo.pid, force);
    } catch {
      return false;
    }
  }

  /**
   * Kill a process by PID
   */
  async killProcess(pid: number, force: boolean = false): Promise<boolean> {
    try {
      const platform = process.platform;

      if (platform === 'win32') {
        const cmd = force ? `taskkill /F /PID ${pid}` : `taskkill /PID ${pid}`;
        await execAsync(cmd);
      } else {
        const signal = force ? 'SIGKILL' : 'SIGTERM';
        process.kill(pid, signal);
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all listening ports
   */
  async getAllListeningPorts(): Promise<PortStatus[]> {
    try {
      const platform = process.platform;
      let ports: number[] = [];

      if (platform === 'darwin' || platform === 'linux') {
        const { stdout } = await execAsync('lsof -i -P -n | grep LISTEN || true');
        const lines = stdout.trim().split('\n').filter(Boolean);

        for (const line of lines) {
          const match = line.match(/:(\d+)\s+\(LISTEN\)/);
          if (match) {
            ports.push(parseInt(match[1], 10));
          }
        }
      } else if (platform === 'win32') {
        const { stdout } = await execAsync('netstat -ano | findstr LISTENING');
        const lines = stdout.trim().split('\n');

        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 2) {
            const addr = parts[1];
            const colonIndex = addr.lastIndexOf(':');
            if (colonIndex !== -1) {
              const port = parseInt(addr.substring(colonIndex + 1), 10);
              if (!isNaN(port)) {
                ports.push(port);
              }
            }
          }
        }
      }

      // Get unique ports
      ports = [...new Set(ports)].sort((a, b) => a - b);

      // Get process info for each port
      const results: PortStatus[] = [];
      for (const port of ports) {
        const process = await this.getProcessOnPort(port);
        results.push({
          port,
          inUse: true,
          process: process || undefined,
        });
      }

      return results;
    } catch {
      return [];
    }
  }
}

// Export singleton instance
export const portScanner = new PortScanner();
