/**
 * Project Orchestration Commands - v3.1.0
 *
 * CLI commands for multi-project coordination
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import { projectCoordinator } from '../services/project-coordinator.js';
import { portScanner } from '../services/port-scanner.js';
import { processMonitor } from '../services/process-monitor.js';
import {
  getProject,
  listProjects,
  getProjectRuntime,
  updateProjectRuntime,
  reservePorts,
  releasePorts,
  getReservedPorts,
  getCoordinationConfig,
  getProjectDependencies,
  getProjectDependents,
  getDependencyGraph,
} from '../services/global-store.js';
import type { StartOptions, PortStatus } from '../models/types.js';

/**
 * ib project start <name>
 */
export async function projectStartCommand(
  projectName: string,
  options?: {
    autoPorts?: boolean;
    withDeps?: boolean;
    dryRun?: boolean;
    timeout?: string;
  }
): Promise<void> {
  const startOptions: StartOptions = {
    autoPorts: options?.autoPorts,
    withDependencies: options?.withDeps,
    dryRun: options?.dryRun,
    timeout: options?.timeout ? parseInt(options.timeout, 10) : undefined,
  };

  console.log(chalk.bold(`Starting project "${projectName}"...`));
  console.log('');

  if (options?.withDeps) {
    const results = await projectCoordinator.startWithDependencies(projectName, startOptions);

    for (const result of results) {
      const icon = result.success ? chalk.green('✓') : chalk.red('✗');
      console.log(`${icon} ${result.project}: ${result.message}`);
    }
  } else {
    const result = await projectCoordinator.startProject(projectName, startOptions);

    if (result.success) {
      console.log(chalk.green(`✓ ${result.message}`));

      if (result.ports) {
        console.log(chalk.dim('\nPorts:'));
        for (const [service, port] of Object.entries(result.ports)) {
          console.log(chalk.dim(`  ${service}: ${port}`));
        }
      }

      if (result.pid) {
        console.log(chalk.dim(`\nPID: ${result.pid}`));
      }
    } else {
      console.log(chalk.red(`✗ ${result.message}`));
    }
  }
}

/**
 * ib project stop <name>
 */
export async function projectStopCommand(
  projectName: string,
  options?: {
    withDependents?: boolean;
  }
): Promise<void> {
  console.log(chalk.bold(`Stopping project "${projectName}"...`));
  console.log('');

  if (options?.withDependents) {
    const results = await projectCoordinator.stopWithDependents(projectName);

    for (const result of results) {
      const icon = result.success ? chalk.green('✓') : chalk.red('✗');
      console.log(`${icon} ${result.project}: ${result.message}`);
    }
  } else {
    const result = await projectCoordinator.stopProject(projectName);

    if (result.success) {
      console.log(chalk.green(`✓ ${result.message}`));
    } else {
      console.log(chalk.red(`✗ ${result.message}`));
    }
  }
}

/**
 * ib project restart <name>
 */
export async function projectRestartCommand(
  projectName: string,
  options?: {
    autoPorts?: boolean;
    withDeps?: boolean;
    timeout?: string;
  }
): Promise<void> {
  const startOptions: StartOptions = {
    autoPorts: options?.autoPorts,
    withDependencies: options?.withDeps,
    timeout: options?.timeout ? parseInt(options.timeout, 10) : undefined,
  };

  console.log(chalk.bold(`Restarting project "${projectName}"...`));
  console.log('');

  const result = await projectCoordinator.restartProject(projectName, startOptions);

  if (result.success) {
    console.log(chalk.green(`✓ ${result.message}`));

    if (result.ports) {
      console.log(chalk.dim('\nPorts:'));
      for (const [service, port] of Object.entries(result.ports)) {
        console.log(chalk.dim(`  ${service}: ${port}`));
      }
    }

    if (result.pid) {
      console.log(chalk.dim(`\nPID: ${result.pid}`));
    }
  } else {
    console.log(chalk.red(`✗ ${result.message}`));
  }
}

/**
 * ib project start-all
 */
export async function projectStartAllCommand(options?: {
  autoPorts?: boolean;
  dryRun?: boolean;
}): Promise<void> {
  const projects = listProjects();
  const activeProjects = projects.filter(p => p.status === 'active');

  console.log(chalk.bold(`Starting all active projects (${activeProjects.length})...`));
  console.log('');

  const results = await projectCoordinator.startProjects(
    activeProjects.map(p => p.name),
    { autoPorts: options?.autoPorts, dryRun: options?.dryRun }
  );

  for (const result of results) {
    const icon = result.success ? chalk.green('✓') : chalk.red('✗');
    console.log(`${icon} ${result.project}: ${result.message}`);
  }
}

/**
 * ib project stop-all
 */
export async function projectStopAllCommand(): Promise<void> {
  const projects = listProjects();
  const runningProjects = [];

  for (const project of projects) {
    const runtime = getProjectRuntime(project.name);
    if (runtime && Object.keys(runtime.processes || {}).length > 0) {
      runningProjects.push(project.name);
    }
  }

  console.log(chalk.bold(`Stopping all running projects (${runningProjects.length})...`));
  console.log('');

  const results = await projectCoordinator.stopProjects(runningProjects);

  for (const result of results) {
    const icon = result.success ? chalk.green('✓') : chalk.red('✗');
    console.log(`${icon} ${result.project}: ${result.message}`);
  }
}

/**
 * ib project ports <name>
 */
export async function projectPortsCommand(projectName: string): Promise<void> {
  const project = getProject(projectName);

  if (!project) {
    console.log(chalk.red(`Project "${projectName}" not found.`));
    return;
  }

  const runtime = getProjectRuntime(projectName);
  const ports = runtime?.ports || {};

  console.log(chalk.bold(`Ports for project "${projectName}"`));
  console.log('');

  if (Object.keys(ports).length === 0) {
    console.log(chalk.dim('No ports configured.'));
    return;
  }

  const table = new Table({
    head: ['Service', 'Port', 'Status'],
    colWidths: [20, 10, 20],
  });

  for (const [service, port] of Object.entries(ports)) {
    const inUse = await portScanner.isPortInUse(port);
    const status = inUse ? chalk.green('In Use') : chalk.dim('Available');
    table.push([service, String(port), status]);
  }

  console.log(table.toString());
}

/**
 * ib project ports check
 */
export async function projectPortsCheckCommand(): Promise<void> {
  console.log(chalk.bold('Checking port conflicts...'));
  console.log('');

  const conflicts = await projectCoordinator.detectPortConflicts();

  if (conflicts.length === 0) {
    console.log(chalk.green('✓ No port conflicts detected'));
    console.log('');

    const reserved = getReservedPorts();
    if (reserved.length > 0) {
      console.log(chalk.dim('Reserved ports:'));
      for (const { port, project } of reserved) {
        console.log(chalk.dim(`  ${port} (${project})`));
      }
    }

    return;
  }

  console.log(chalk.yellow(`Found ${conflicts.length} port conflict(s):\n`));

  for (const conflict of conflicts) {
    console.log(chalk.yellow(`Port ${conflict.port}:`));
    console.log(`  Type: ${conflict.conflictType}`);

    if (conflict.currentProcess) {
      console.log(`  Process: ${conflict.currentProcess.command} (PID: ${conflict.currentProcess.pid})`);
    }

    if (conflict.requestedBy) {
      console.log(`  Requested by: ${conflict.requestedBy}`);
    }

    if (conflict.suggestions && conflict.suggestions.length > 0) {
      console.log(`  Suggestions: ${conflict.suggestions.join(', ')}`);
    }

    console.log('');
  }
}

/**
 * ib project ports find
 */
export async function projectPortsFindCommand(options?: {
  range?: string;
  count?: string;
}): Promise<void> {
  const config = getCoordinationConfig();
  const range = options?.range || '3000-9999';
  const count = options?.count ? parseInt(options.count, 10) : 1;

  const [start, end] = range.split('-').map(n => parseInt(n.trim(), 10));

  console.log(chalk.bold(`Finding ${count} available port(s) in range ${start}-${end}...`));
  console.log('');

  const ports = await portScanner.findAvailablePorts(count, start, end);

  if (ports.length === 0) {
    console.log(chalk.yellow('No available ports found in the specified range.'));
    return;
  }

  console.log(chalk.green('Available ports:'));
  for (const port of ports) {
    console.log(`  ${port}`);
  }
}

/**
 * ib project ports assign
 */
export async function projectPortsAssignCommand(
  projectName: string,
  port: string
): Promise<void> {
  const project = getProject(projectName);

  if (!project) {
    console.log(chalk.red(`Project "${projectName}" not found.`));
    return;
  }

  const portNum = parseInt(port, 10);

  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    console.log(chalk.red('Invalid port number.'));
    return;
  }

  const available = await projectCoordinator.checkPortAvailability(portNum);

  if (!available) {
    console.log(chalk.red(`Port ${portNum} is not available.`));
    return;
  }

  try {
    reservePorts(projectName, [portNum]);
    console.log(chalk.green(`✓ Port ${portNum} assigned to project "${projectName}"`));
  } catch (e: any) {
    console.log(chalk.red(e.message));
  }
}

/**
 * ib project ports release
 */
export async function projectPortsReleaseCommand(
  projectName: string,
  port?: string
): Promise<void> {
  const project = getProject(projectName);

  if (!project) {
    console.log(chalk.red(`Project "${projectName}" not found.`));
    return;
  }

  const ports = port ? [parseInt(port, 10)] : undefined;

  try {
    releasePorts(projectName, ports);
    console.log(chalk.green(`✓ Port(s) released from project "${projectName}"`));
  } catch (e: any) {
    console.log(chalk.red(e.message));
  }
}

/**
 * ib project resources <name>
 */
export async function projectResourcesCommand(projectName: string): Promise<void> {
  const resources = await projectCoordinator.getProjectResources(projectName);

  if (!resources) {
    console.log(chalk.red(`Project "${projectName}" not found.`));
    return;
  }

  console.log(chalk.bold(`Resources for project "${projectName}"`));
  console.log('');
  console.log(`Status: ${resources.status === 'running' ? chalk.green('Running') : chalk.dim('Stopped')}`);

  if (resources.uptime !== undefined) {
    console.log(`Uptime: ${Math.floor(resources.uptime / 60)}m ${resources.uptime % 60}s`);
  }

  console.log('');
  console.log(chalk.cyan('Resource Usage:'));
  console.log(`  CPU: ${resources.resourceUsage.cpu.toFixed(1)}%`);
  console.log(`  Memory: ${resources.resourceUsage.memory.toFixed(1)} MB`);

  if (resources.processes.length > 0) {
    console.log('');
    console.log(chalk.cyan('Processes:'));

    const table = new Table({
      head: ['PID', 'Command', 'CPU %', 'Memory (MB)'],
      colWidths: [10, 30, 10, 15],
    });

    for (const proc of resources.processes) {
      table.push([
        String(proc.pid),
        proc.command.substring(0, 28),
        (proc.cpu || 0).toFixed(1),
        (proc.memory || 0).toFixed(1),
      ]);
    }

    console.log(table.toString());
  }

  if (resources.ports.length > 0) {
    console.log('');
    console.log(chalk.cyan('Ports:'));

    for (const port of resources.ports) {
      const status = port.inUse ? chalk.green('In Use') : chalk.dim('Available');
      console.log(`  ${port.port}: ${status}`);
    }
  }
}

/**
 * ib project resources top
 */
export async function projectResourcesTopCommand(): Promise<void> {
  const status = await projectCoordinator.getGlobalStatus();

  console.log(chalk.bold('\n=== Project Resources Overview ===\n'));

  // System resources
  console.log(chalk.cyan('System:'));
  console.log(`  CPU: ${status.system.cpu.usage.toFixed(1)}% (${status.system.cpu.cores} cores)`);
  console.log(`  Memory: ${status.system.memory.used}MB / ${status.system.memory.total}MB (${status.system.memory.usagePercent.toFixed(1)}%)\n`);

  // Projects table
  const table = new Table({
    head: ['Project', 'Status', 'Ports', 'Processes', 'CPU %', 'Memory (MB)', 'Uptime'],
    colWidths: [15, 10, 15, 10, 10, 15, 10],
  });

  for (const project of status.projects) {
    table.push([
      project.name,
      project.status === 'running' ? chalk.green('Running') : chalk.dim('Stopped'),
      project.ports.join(', ') || '-',
      String(project.processes),
      project.cpu.toFixed(1),
      project.memory.toFixed(1),
      project.uptime || '-',
    ]);
  }

  console.log(table.toString());

  // Summary
  console.log('');
  console.log(chalk.dim(`Total: ${status.summary.totalProjects} projects | ${status.summary.runningProjects} running | ${status.summary.totalProcesses} processes`));
}

/**
 * ib project ps
 */
export async function projectPsCommand(): Promise<void> {
  const status = await projectCoordinator.getGlobalStatus();

  console.log(chalk.bold('Running Processes'));
  console.log('');

  const runningProjects = status.projects.filter(p => p.status === 'running');

  if (runningProjects.length === 0) {
    console.log(chalk.dim('No running processes found.'));
    return;
  }

  const table = new Table({
    head: ['Project', 'Ports', 'CPU %', 'Memory (MB)', 'Processes', 'Uptime'],
    colWidths: [15, 20, 10, 15, 10, 15],
  });

  for (const project of runningProjects) {
    table.push([
      project.name,
      project.ports.join(', ') || '-',
      project.cpu.toFixed(1),
      project.memory.toFixed(1),
      String(project.processes),
      project.uptime || '-',
    ]);
  }

  console.log(table.toString());
}

/**
 * ib project dependencies <name>
 */
export function projectDependenciesCommand(projectName: string): void {
  const project = getProject(projectName);

  if (!project) {
    console.log(chalk.red(`Project "${projectName}" not found.`));
    return;
  }

  const dependencies = getProjectDependencies(projectName);
  const dependents = getProjectDependents(projectName);

  console.log(chalk.bold(`Dependencies for project "${projectName}"`));
  console.log('');

  if (dependencies.length > 0) {
    console.log(chalk.cyan('Depends on:'));
    for (const dep of dependencies) {
      console.log(`  → ${dep}`);
    }
    console.log('');
  } else {
    console.log(chalk.dim('No dependencies.'));
    console.log('');
  }

  if (dependents.length > 0) {
    console.log(chalk.cyan('Dependents (projects that depend on this):'));
    for (const dep of dependents) {
      console.log(`  ← ${dep}`);
    }
  } else {
    console.log(chalk.dim('No dependents.'));
  }
}

/**
 * ib project graph
 */
export async function projectGraphCommand(): Promise<void> {
  const graph = await projectCoordinator.getProjectDependencyGraph();

  console.log(chalk.bold('Project Dependency Graph'));
  console.log('');

  if (graph.nodes.length === 0) {
    console.log(chalk.dim('No projects registered.'));
    return;
  }

  // Display nodes
  for (const node of graph.nodes) {
    const statusIcon =
      node.status === 'running' ? chalk.green('●') :
      node.status === 'stopped' ? chalk.dim('○') :
      chalk.red('●');

    console.log(`${statusIcon} ${chalk.bold(node.name)}`);

    if (node.dependencies.length > 0) {
      console.log(chalk.dim(`  → Depends on: ${node.dependencies.join(', ')}`));
    }

    if (node.dependents.length > 0) {
      console.log(chalk.dim(`  ← Dependents: ${node.dependents.join(', ')}`));
    }

    console.log('');
  }

  // Display start order
  if (graph.startOrder.length > 0) {
    console.log(chalk.cyan('Recommended start order:'));
    console.log(chalk.dim(`  ${graph.startOrder.join(' → ')}`));
  }
}

/**
 * ib project dashboard
 */
export async function projectDashboardCommand(): Promise<void> {
  await projectCoordinator.displayDashboard();
}

/**
 * ib project config <name>
 */
export async function projectConfigCommand(
  projectName: string,
  options?: {
    setStart?: string;
    setStop?: string;
    setPorts?: string;
    setEnv?: string;
  }
): Promise<void> {
  const project = getProject(projectName);

  if (!project) {
    console.log(chalk.red(`Project "${projectName}" not found.`));
    return;
  }

  if (!options || Object.keys(options).length === 0) {
    // Display current config
    const runtime = getProjectRuntime(projectName);

    console.log(chalk.bold(`Configuration for project "${projectName}"`));
    console.log('');

    if (!runtime) {
      console.log(chalk.dim('No runtime configuration set.'));
      console.log('');
      console.log('Use --set-start, --set-stop, --set-ports, or --set-env to configure.');
      return;
    }

    if (runtime.commands) {
      console.log(chalk.cyan('Commands:'));
      console.log(`  Start: ${runtime.commands.start || 'Not set'}`);
      console.log(`  Stop: ${runtime.commands.stop || 'Not set'}`);
      console.log('');
    }

    if (runtime.ports && Object.keys(runtime.ports).length > 0) {
      console.log(chalk.cyan('Ports:'));
      for (const [service, port] of Object.entries(runtime.ports)) {
        console.log(`  ${service}: ${port}`);
      }
      console.log('');
    }

    if (runtime.environment && Object.keys(runtime.environment).length > 0) {
      console.log(chalk.cyan('Environment:'));
      for (const [key, value] of Object.entries(runtime.environment)) {
        console.log(`  ${key}: ${value}`);
      }
    }

    return;
  }

  // Update configuration
  const runtime: Partial<import('../models/types.js').ProjectRuntimeConfig> = {};

  if (options.setStart) {
    runtime.commands = { ...runtime.commands, start: options.setStart };
  }

  if (options.setStop) {
    runtime.commands = { ...runtime.commands, stop: options.setStop };
  }

  if (options.setPorts) {
    // Parse ports: service1:3000,service2:8000
    const ports: Record<string, number> = {};
    const parts = options.setPorts.split(',');
    for (const part of parts) {
      const [service, port] = part.split(':');
      if (service && port) {
        ports[service.trim()] = parseInt(port.trim(), 10);
      }
    }
    runtime.ports = ports;
  }

  if (options.setEnv) {
    // Parse env: KEY1=value1,KEY2=value2
    const env: Record<string, string> = {};
    const parts = options.setEnv.split(',');
    for (const part of parts) {
      const [key, ...valueParts] = part.split('=');
      if (key) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
    runtime.environment = env;
  }

  updateProjectRuntime(projectName, runtime);
  console.log(chalk.green(`✓ Configuration updated for project "${projectName}"`));
}
