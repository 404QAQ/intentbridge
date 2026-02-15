/**
 * Project Coordinator Service - v3.1.0
 *
 * Main coordination service for multi-project management
 * Handles port management, conflict detection, and multi-project orchestration
 */

import chalk from 'chalk';
import type {
  ProjectRuntimeConfig,
  PortStatus,
  PortConflict,
  ResourceUsage,
  GlobalStatus,
  SystemResources,
  ProjectResources,
  StartOptions,
  ProjectDependencyGraph,
  ProcessInfo,
} from '../models/types.js';
import {
  getProject,
  listProjects,
  updateProjectRuntime,
  getProjectRuntime,
  reservePorts,
  releasePorts,
  getReservedPorts,
  getCoordinationConfig,
  getProjectDependencies,
  getProjectDependents,
  getDependencyGraph,
  type ProjectMeta,
} from './global-store.js';
import { portScanner, PortScanner } from './port-scanner.js';
import { processMonitor, ProcessMonitor } from './process-monitor.js';

/**
 * Project Coordinator - Main coordination service
 */
export class ProjectCoordinator {
  private portScanner: PortScanner;
  private processMonitor: ProcessMonitor;

  constructor() {
    this.portScanner = portScanner;
    this.processMonitor = processMonitor;
  }

  /**
   * Check port availability
   */
  async checkPortAvailability(port: number): Promise<boolean> {
    const inUse = await this.portScanner.isPortInUse(port);
    if (inUse) {
      return false;
    }

    // Check if reserved by another project
    const reserved = getReservedPorts();
    const reservation = reserved.find(r => r.port === port);
    if (reservation) {
      return false;
    }

    return true;
  }

  /**
   * Find available port in range
   */
  async findAvailablePort(startPort: number, endPort: number): Promise<number | null> {
    return this.portScanner.findAvailablePort(startPort, endPort);
  }

  /**
   * Find available port by project type
   */
  async findAvailablePortByType(projectType: string): Promise<number | null> {
    const config = getCoordinationConfig();
    return this.portScanner.findAvailablePortByType(projectType, config.portRanges || {});
  }

  /**
   * Detect port conflicts
   */
  async detectPortConflicts(): Promise<PortConflict[]> {
    const conflicts: PortConflict[] = [];
    const reserved = getReservedPorts();
    const listeningPorts = await this.portScanner.getAllListeningPorts();

    for (const { port, project } of reserved) {
      const inUse = await this.portScanner.isPortInUse(port);

      if (inUse) {
        const processInfo = await this.portScanner.getProcessOnPort(port);

        // Check if the process belongs to the reserved project
        if (processInfo && processInfo.project !== project) {
          conflicts.push({
            port,
            conflictType: 'already_in_use',
            currentProcess: processInfo || undefined,
            requestedBy: project,
            suggestions: await this.getAlternativePorts(port, 3),
          });
        }
      }
    }

    // Check for overlapping reservations
    const portCounts = new Map<number, string[]>();
    for (const { port, project } of reserved) {
      if (!portCounts.has(port)) {
        portCounts.set(port, []);
      }
      portCounts.get(port)!.push(project);
    }

    for (const [port, projects] of portCounts) {
      if (projects.length > 1) {
        conflicts.push({
          port,
          conflictType: 'reserved',
          requestedBy: projects.join(', '),
          suggestions: await this.getAlternativePorts(port, projects.length),
        });
      }
    }

    return conflicts;
  }

  /**
   * Get alternative ports
   */
  private async getAlternativePorts(originalPort: number, count: number): Promise<number[]> {
    const alternatives: number[] = [];
    let port = originalPort + 1;

    while (alternatives.length < count && port < 65536) {
      const available = await this.checkPortAvailability(port);
      if (available) {
        alternatives.push(port);
      }
      port++;
    }

    return alternatives;
  }

  /**
   * Get all running projects
   */
  async getRunningProjects(): Promise<ProjectMeta[]> {
    const projects = listProjects();
    const running: ProjectMeta[] = [];

    for (const project of projects) {
      const runtime = getProjectRuntime(project.name);
      if (runtime && Object.keys(runtime.processes || {}).length > 0) {
        // Check if any of the tracked processes are still running
        let hasRunningProcess = false;
        for (const pid of Object.values(runtime.processes || {})) {
          try {
            process.kill(pid, 0);
            hasRunningProcess = true;
            break;
          } catch {
            // Process is dead
          }
        }

        if (hasRunningProcess) {
          running.push(project);
        }
      }
    }

    return running;
  }

  /**
   * Get project resource usage
   */
  async getResourceUsage(projectName: string): Promise<ResourceUsage | null> {
    const runtime = getProjectRuntime(projectName);
    if (!runtime || !runtime.processes) {
      return null;
    }

    let totalCpu = 0;
    let totalMemory = 0;
    let processCount = 0;

    for (const pid of Object.values(runtime.processes)) {
      const usage = await this.processMonitor.monitorProcess(pid);
      if (usage) {
        totalCpu += usage.cpu;
        totalMemory += usage.memory;
        processCount++;
      }
    }

    if (processCount === 0) {
      return null;
    }

    return {
      cpu: totalCpu,
      memory: totalMemory,
      memoryPercent: 0, // Would need system context
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Start project with coordination
   */
  async startProject(name: string, options?: StartOptions): Promise<{ success: boolean; message: string; ports?: Record<string, number>; pid?: number }> {
    const project = getProject(name);
    if (!project) {
      return { success: false, message: `Project "${name}" not found` };
    }

    const runtime = getProjectRuntime(name);
    if (!runtime?.commands?.start) {
      return { success: false, message: `No start command configured for project "${name}"` };
    }

    // Check dependencies if withDependencies is true
    if (options?.withDependencies) {
      const deps = getProjectDependencies(name);
      for (const dep of deps) {
        const depProject = getProject(dep);
        if (depProject) {
          const depRuntime = getProjectRuntime(dep);
          if (!depRuntime || Object.keys(depRuntime.processes || {}).length === 0) {
            // Start dependency first
            const result = await this.startProject(dep, { ...options, withDependencies: true });
            if (!result.success) {
              return { success: false, message: `Failed to start dependency "${dep}": ${result.message}` };
            }
          }
        }
      }
    }

    // Handle port assignment
    let ports: Record<string, number> = {};
    if (options?.autoPorts && runtime.ports) {
      for (const [serviceName, requestedPort] of Object.entries(runtime.ports)) {
        const available = await this.checkPortAvailability(requestedPort);
        if (!available) {
          // Find alternative port
          const alternative = await this.findAvailablePort(requestedPort + 1, requestedPort + 100);
          if (alternative) {
            ports[serviceName] = alternative;
          } else {
            return { success: false, message: `No available port for service "${serviceName}" (requested: ${requestedPort})` };
          }
        } else {
          ports[serviceName] = requestedPort;
        }
      }
    } else if (runtime.ports) {
      ports = { ...runtime.ports };
    }

    // Reserve ports
    const portValues = Object.values(ports);
    if (portValues.length > 0) {
      try {
        reservePorts(name, portValues);
      } catch (e: any) {
        return { success: false, message: e.message };
      }
    }

    // Build environment with ports
    const env: Record<string, string> = { ...options?.environment };
    for (const [serviceName, port] of Object.entries(ports)) {
      env[`${serviceName.toUpperCase()}_PORT`] = String(port);
      env[`PORT_${serviceName.toUpperCase()}`] = String(port);
    }

    // Dry run mode
    if (options?.dryRun) {
      return {
        success: true,
        message: `Dry run: Would start project "${name}"`,
        ports,
      };
    }

    // Start the process
    try {
      const processInfo = await this.processMonitor.startMonitoredProcess(
        runtime.commands.start,
        {
          cwd: project.path,
          env: { ...runtime.environment, ...env },
          detached: true,
          shell: true,
          timeout: options?.timeout ? options.timeout * 1000 : undefined,
        },
        name
      );

      // Update runtime with new process and ports
      updateProjectRuntime(name, {
        processes: {
          ...runtime.processes,
          main: processInfo.pid,
        },
        ports,
        lastStarted: new Date().toISOString(),
      });

      return {
        success: true,
        message: `Project "${name}" started successfully`,
        ports,
        pid: processInfo.pid,
      };
    } catch (e: any) {
      return { success: false, message: `Failed to start project: ${e.message}` };
    }
  }

  /**
   * Stop project
   */
  async stopProject(name: string): Promise<{ success: boolean; message: string }> {
    const project = getProject(name);
    if (!project) {
      return { success: false, message: `Project "${name}" not found` };
    }

    const runtime = getProjectRuntime(name);
    if (!runtime || !runtime.processes) {
      return { success: false, message: `Project "${name}" is not running` };
    }

    // Stop all tracked processes
    for (const [processName, pid] of Object.entries(runtime.processes)) {
      await this.processMonitor.stopProcess(pid);
    }

    // Release ports
    const portValues = Object.values(runtime.ports || {});
    if (portValues.length > 0) {
      releasePorts(name, portValues);
    }

    // Clear runtime
    updateProjectRuntime(name, {
      processes: {},
    });

    return { success: true, message: `Project "${name}" stopped successfully` };
  }

  /**
   * Restart project
   */
  async restartProject(name: string, options?: StartOptions): Promise<{ success: boolean; message: string; ports?: Record<string, number>; pid?: number }> {
    const stopResult = await this.stopProject(name);
    if (!stopResult.success) {
      return { success: false, message: stopResult.message };
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    return this.startProject(name, options);
  }

  /**
   * Get global status
   */
  async getGlobalStatus(): Promise<GlobalStatus> {
    const projects = listProjects();
    const system = await this.processMonitor.getSystemResources();
    const portConflicts = await this.detectPortConflicts();
    const reserved = getReservedPorts();

    const projectStatuses: GlobalStatus['projects'] = [];
    let totalProcesses = 0;
    let runningProjects = 0;

    for (const project of projects) {
      const runtime = getProjectRuntime(project.name);
      const processes = runtime?.processes || {};
      const ports = runtime?.ports || {};
      const portNumbers = Object.values(ports);

      let runningProcessCount = 0;
      let totalCpu = 0;
      let totalMemory = 0;

      for (const pid of Object.values(processes)) {
        try {
          process.kill(pid, 0);
          runningProcessCount++;
          const usage = await this.processMonitor.monitorProcess(pid);
          if (usage) {
            totalCpu += usage.cpu;
            totalMemory += usage.memory;
          }
        } catch {
          // Process is dead
        }
      }

      const status: 'running' | 'stopped' | 'error' | 'unknown' = runningProcessCount > 0 ? 'running' : 'stopped';
      if (status === 'running') {
        runningProjects++;
        totalProcesses += runningProcessCount;
      }

      projectStatuses.push({
        name: project.name,
        status,
        ports: portNumbers,
        processes: runningProcessCount,
        cpu: Math.round(totalCpu * 100) / 100,
        memory: Math.round(totalMemory * 100) / 100,
        uptime: runtime?.lastStarted ? this.calculateUptime(runtime.lastStarted) : undefined,
      });
    }

    return {
      projects: projectStatuses,
      system,
      portConflicts,
      resourceConflicts: [], // Would need more analysis
      summary: {
        totalProjects: projects.length,
        runningProjects,
        totalProcesses,
        totalPorts: reserved.length,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate uptime string
   */
  private calculateUptime(startDate: string): string {
    const start = new Date(startDate).getTime();
    const now = Date.now();
    const diff = Math.floor((now - start) / 1000);

    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get project resources
   */
  async getProjectResources(projectName: string): Promise<ProjectResources | null> {
    const project = getProject(projectName);
    if (!project) {
      return null;
    }

    const runtime = getProjectRuntime(projectName);
    const processes: ProcessInfo[] = [];
    const ports: PortStatus[] = [];

    if (runtime?.processes) {
      for (const [processName, pid] of Object.entries(runtime.processes)) {
        const processInfo = await this.processMonitor.getProcessDetails(pid);
        if (processInfo) {
          processes.push(processInfo);
        }
      }
    }

    if (runtime?.ports) {
      for (const [serviceName, port] of Object.entries(runtime.ports)) {
        const portStatus: PortStatus = {
          port,
          inUse: await this.portScanner.isPortInUse(port),
          project: projectName,
        };

        if (portStatus.inUse) {
          portStatus.process = await this.portScanner.getProcessOnPort(port) || undefined;
        }

        ports.push(portStatus);
      }
    }

    const resourceUsage = await this.getResourceUsage(projectName);

    return {
      projectName,
      status: processes.length > 0 ? 'running' : 'stopped',
      processes,
      ports,
      resourceUsage: resourceUsage || {
        cpu: 0,
        memory: 0,
        memoryPercent: 0,
        timestamp: new Date().toISOString(),
      },
      startedAt: runtime?.lastStarted,
      uptime: runtime?.lastStarted ? Math.floor((Date.now() - new Date(runtime.lastStarted).getTime()) / 1000) : undefined,
    };
  }

  /**
   * Get dependency graph
   */
  async getProjectDependencyGraph(): Promise<ProjectDependencyGraph> {
    const graph = getDependencyGraph();
    const status = await this.getGlobalStatus();

    // Update statuses
    for (const node of graph.nodes) {
      const projectStatus = status.projects.find(p => p.name === node.name);
      if (projectStatus) {
        node.status = projectStatus.status;
      }
    }

    return graph;
  }

  /**
   * Start multiple projects in dependency order
   */
  async startProjects(projects: string[], options?: StartOptions): Promise<Array<{ project: string; success: boolean; message: string }>> {
    const results: Array<{ project: string; success: boolean; message: string }> = [];
    const graph = await this.getProjectDependencyGraph();

    // Sort projects by dependency order
    const sortedProjects: string[] = [];
    for (const name of graph.startOrder) {
      if (projects.includes(name)) {
        sortedProjects.push(name);
      }
    }

    // Add any projects not in the graph
    for (const name of projects) {
      if (!sortedProjects.includes(name)) {
        sortedProjects.push(name);
      }
    }

    for (const name of sortedProjects) {
      const result = await this.startProject(name, options);
      results.push({
        project: name,
        success: result.success,
        message: result.message,
      });

      if (!result.success && !options?.withDependencies) {
        // Stop if a project fails (unless we're starting dependencies)
        break;
      }
    }

    return results;
  }

  /**
   * Stop multiple projects
   */
  async stopProjects(projects: string[]): Promise<Array<{ project: string; success: boolean; message: string }>> {
    const results: Array<{ project: string; success: boolean; message: string }> = [];

    // Stop in reverse dependency order
    const graph = await this.getProjectDependencyGraph();
    const stopOrder = [...graph.startOrder].reverse();

    for (const name of stopOrder) {
      if (projects.includes(name)) {
        const result = await this.stopProject(name);
        results.push({
          project: name,
          success: result.success,
          message: result.message,
        });
      }
    }

    // Stop any projects not in the graph
    for (const name of projects) {
      if (!results.find(r => r.project === name)) {
        const result = await this.stopProject(name);
        results.push({
          project: name,
          success: result.success,
          message: result.message,
        });
      }
    }

    return results;
  }

  /**
   * Start project with dependencies
   */
  async startWithDependencies(projectName: string, options?: StartOptions): Promise<Array<{ project: string; success: boolean; message: string }>> {
    const deps = getProjectDependencies(projectName);
    const allProjects = [...deps, projectName];
    return this.startProjects(allProjects, { ...options, withDependencies: true });
  }

  /**
   * Stop project with dependents
   */
  async stopWithDependents(projectName: string): Promise<Array<{ project: string; success: boolean; message: string }>> {
    const dependents = getProjectDependents(projectName);
    const allProjects = [...dependents, projectName];
    return this.stopProjects(allProjects);
  }

  /**
   * Display status dashboard
   */
  async displayDashboard(): Promise<void> {
    const status = await this.getGlobalStatus();

    console.log(chalk.bold('\n=== IntentBridge Multi-Project Dashboard ===\n'));

    // System status
    console.log(chalk.cyan('System Status:'));
    console.log(`  CPU: ${status.system.cpu.cores} cores, ${status.system.cpu.usage.toFixed(1)}% usage`);
    console.log(`  Memory: ${status.system.memory.used}MB / ${status.system.memory.total}MB (${status.system.memory.usagePercent.toFixed(1)}%)\n`);

    // Project summary
    console.log(chalk.cyan('Project Summary:'));
    console.log(`  Total: ${status.summary.totalProjects} | Running: ${status.summary.runningProjects} | Processes: ${status.summary.totalProcesses} | Ports: ${status.summary.totalPorts}\n`);

    // Project details
    console.log(chalk.cyan('Projects:'));

    for (const project of status.projects) {
      const statusIcon =
        project.status === 'running' ? chalk.green('●') :
        project.status === 'stopped' ? chalk.dim('○') :
        chalk.red('●');

      console.log(`  ${statusIcon} ${chalk.bold(project.name)} (${project.status})`);

      if (project.ports.length > 0) {
        console.log(`    Ports: ${project.ports.join(', ')}`);
      }

      if (project.status === 'running') {
        console.log(`    CPU: ${project.cpu.toFixed(1)}% | Memory: ${project.memory.toFixed(1)}MB | Processes: ${project.processes}`);
        if (project.uptime) {
          console.log(`    Uptime: ${project.uptime}`);
        }
      }

      console.log('');
    }

    // Port conflicts
    if (status.portConflicts.length > 0) {
      console.log(chalk.yellow('Port Conflicts:'));
      for (const conflict of status.portConflicts) {
        console.log(`  ${chalk.yellow('!')} Port ${conflict.port}: ${conflict.conflictType}`);
        if (conflict.currentProcess) {
          console.log(`    Process: ${conflict.currentProcess.command} (PID: ${conflict.currentProcess.pid})`);
        }
        if (conflict.suggestions && conflict.suggestions.length > 0) {
          console.log(`    Suggestions: ${conflict.suggestions.join(', ')}`);
        }
      }
      console.log('');
    }
  }
}

// Export singleton instance
export const projectCoordinator = new ProjectCoordinator();
