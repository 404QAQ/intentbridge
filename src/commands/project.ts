import chalk from 'chalk';
import {
  registerProject,
  unregisterProject,
  switchProject,
  listProjects,
  getCurrentProject,
  getProject,
  linkProjects,
  updateProjectStatus,
  getProjectStats,
  loadGlobalConfig,
  shareFile,
  listSharedFiles,
} from '../services/global-store.js';
import { readRequirements } from '../services/store.js';
import { prompt, closePrompt } from '../utils/prompt.js';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Requirement } from '../models/types.js';

/**
 * ib project register
 */
export async function projectRegisterCommand(
  projectPath?: string,
  options?: {
    name?: string;
    description?: string;
    tags?: string;
    priority?: string;
  }
): Promise<void> {
  const targetPath = projectPath ? resolve(projectPath) : process.cwd();

  // Check if .intentbridge exists
  if (!existsSync(`${targetPath}/.intentbridge`)) {
    console.log(chalk.yellow('Warning: .intentbridge directory not found.'));
    console.log(chalk.dim(`Run 'ib init' in ${targetPath} first.`));
    console.log('');
  }

  console.log(chalk.bold('Register Project'));
  console.log(`Path: ${targetPath}`);
  console.log('');

  // Interactive prompts if options not provided
  const name = options?.name || await prompt(`Project name [${targetPath.split('/').pop()}]: `);
  const description = options?.description || await prompt('Description (optional): ');
  const tagsInput = options?.tags || await prompt('Tags (comma-separated, optional): ');
  const priorityInput = options?.priority || await prompt('Priority (low/medium/high/critical) [medium]: ');

  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];
  const priority = priorityInput || 'medium';

  try {
    const project = registerProject(targetPath, {
      name: name || undefined,
      description: description || undefined,
      tags,
      priority: priority as any,
    });

    console.log('');
    console.log(chalk.green('✔ Project registered successfully'));
    console.log(`  Name: ${project.name}`);
    console.log(`  Path: ${project.path}`);
    console.log(`  Status: ${project.status}`);
    closePrompt();
  } catch (e: any) {
    console.log(chalk.red(`Error: ${e.message}`));
    closePrompt();
  }
}

/**
 * ib project list
 */
export function projectListCommand(): void {
  const projects = listProjects();
  const currentProject = getCurrentProject();

  console.log(chalk.bold(`Registered Projects (${projects.length})`));
  console.log('');

  if (projects.length === 0) {
    console.log(chalk.dim('No projects registered yet.'));
    console.log(chalk.dim(`Run 'ib project register' to add a project.`));
    return;
  }

  for (const project of projects) {
    const isCurrent = currentProject?.name === project.name;
    const statusIcon =
      project.status === 'active' ? chalk.green('●') :
      project.status === 'paused' ? chalk.yellow('●') :
      chalk.dim('○');

    console.log(
      `${statusIcon} ${isCurrent ? chalk.cyan.bold(project.name) : project.name} ${isCurrent ? chalk.dim('(current)') : ''}`
    );
    console.log(chalk.dim(`  ${project.path}`));

    if (project.description) {
      console.log(chalk.dim(`  ${project.description}`));
    }

    if (project.tags && project.tags.length > 0) {
      console.log(chalk.dim(`  Tags: ${project.tags.join(', ')}`));
    }

    if (project.linkedProjects && project.linkedProjects.length > 0) {
      console.log(chalk.dim(`  Linked: ${project.linkedProjects.join(', ')}`));
    }

    console.log('');
  }
}

/**
 * ib project switch
 */
export function projectSwitchCommand(projectName: string): void {
  try {
    const project = switchProject(projectName);

    console.log(chalk.green(`✔ Switched to project "${project.name}"`));
    console.log(`Path: ${project.path}`);
    console.log('');
    console.log(chalk.dim(`Run 'cd ${project.path}' to navigate to project directory.`));
  } catch (e: any) {
    console.log(chalk.red(`Error: ${e.message}`));
  }
}

/**
 * ib project unlink
 */
export function projectUnlinkCommand(projectName: string): void {
  const project = getProject(projectName);

  if (!project) {
    console.log(chalk.red(`Project "${projectName}" not found.`));
    return;
  }

  const success = unregisterProject(projectName);

  if (success) {
    console.log(chalk.green(`✔ Project "${projectName}" unregistered`));
    console.log(chalk.dim('Note: Project files are not deleted.'));
  } else {
    console.log(chalk.red('Failed to unregister project'));
  }
}

/**
 * ib project link
 */
export function projectLinkCommand(
  projectName: string,
  linkedProjects: string[]
): void {
  try {
    linkProjects(projectName, linkedProjects);
    console.log(chalk.green(`✔ Linked "${projectName}" to: ${linkedProjects.join(', ')}`));
  } catch (e: any) {
    console.log(chalk.red(`Error: ${e.message}`));
  }
}

/**
 * ib project status
 */
export function projectStatusCommand(projectName?: string): void {
  const targetName = projectName || getCurrentProject()?.name;

  if (!targetName) {
    console.log(chalk.red('No project specified and no current project set.'));
    console.log(chalk.dim(`Run 'ib project register' to register a project.`));
    return;
  }

  const project = getProject(targetName);

  if (!project) {
    console.log(chalk.red(`Project "${targetName}" not found.`));
    return;
  }

  console.log(chalk.bold(`Project: ${project.name}`));
  console.log('');
  console.log(`Path: ${project.path}`);
  console.log(`Status: ${project.status}`);
  console.log(`Priority: ${project.priority || 'medium'}`);
  console.log(`Registered: ${project.registeredAt}`);
  console.log(`Last Accessed: ${project.lastAccessed}`);

  if (project.description) {
    console.log(`Description: ${project.description}`);
  }

  if (project.tags && project.tags.length > 0) {
    console.log(`Tags: ${project.tags.join(', ')}`);
  }

  if (project.linkedProjects && project.linkedProjects.length > 0) {
    console.log(`Linked Projects: ${project.linkedProjects.join(', ')}`);
  }

  // Show requirements stats if .intentbridge exists
  try {
    const data = readRequirements(project.path);
    console.log('');
    console.log(chalk.bold('Requirements:'));
    console.log(`  Total: ${data.requirements.length}`);
    console.log(`  Done: ${data.requirements.filter(r => r.status === 'done').length}`);
    console.log(`  In Progress: ${data.requirements.filter(r => r.status === 'implementing').length}`);
    console.log(`  Active: ${data.requirements.filter(r => r.status === 'active').length}`);
  } catch {
    console.log(chalk.dim('Requirements data not available.'));
  }
}

/**
 * ib project pause / archive / activate
 */
export function projectSetStatusCommand(
  projectName: string,
  status: 'active' | 'paused' | 'archived'
): void {
  try {
    updateProjectStatus(projectName, status);
    console.log(chalk.green(`✔ Project "${projectName}" status updated to ${status}`));
  } catch (e: any) {
    console.log(chalk.red(`Error: ${e.message}`));
  }
}

/**
 * ib global-status
 */
export function globalStatusCommand(): void {
  const stats = getProjectStats();
  const projects = listProjects();

  console.log(chalk.bold('Global Project Overview'));
  console.log('');
  console.log(`Total Projects: ${stats.total}`);
  console.log(`  Active: ${chalk.green(stats.active)}`);
  console.log(`  Paused: ${chalk.yellow(stats.paused)}`);
  console.log(`  Archived: ${chalk.dim(stats.archived)}`);
  console.log(`  Linked: ${stats.linkedCount}`);
  console.log('');

  if (projects.length === 0) {
    console.log(chalk.dim('No projects registered.'));
    return;
  }

  console.log(chalk.bold('Project Summaries:'));
  console.log('');

  for (const project of projects) {
    const statusIcon =
      project.status === 'active' ? chalk.green('●') :
      project.status === 'paused' ? chalk.yellow('●') :
      chalk.dim('○');

    try {
      const data = readRequirements(project.path);
      const done = data.requirements.filter(r => r.status === 'done').length;
      const total = data.requirements.length;

      console.log(
        `${statusIcon} ${project.name}: ${done}/${total} requirements done (${project.priority || 'medium'} priority)`
      );
    } catch {
      console.log(`${statusIcon} ${project.name}: Unable to read requirements`);
    }
  }
}

/**
 * ib global-reqs
 */
export function globalReqsCommand(options?: {
  tag?: string;
  status?: string;
  priority?: string;
}): void {
  const projects = listProjects();
  const allReqs: Array<{ project: string; requirement: Requirement }> = [];

  for (const project of projects) {
    if (project.status === 'archived') continue;

    try {
      const data = readRequirements(project.path);

      for (const req of data.requirements) {
        // Apply filters
        if (options?.tag && !req.tags?.includes(options.tag)) continue;
        if (options?.status && req.status !== options.status) continue;
        if (options?.priority && req.priority !== options.priority) continue;

        allReqs.push({
          project: project.name,
          requirement: req,
        });
      }
    } catch {
      // Skip projects that can't be read
    }
  }

  console.log(chalk.bold(`Global Requirements View (${allReqs.length})`));
  console.log('');

  if (allReqs.length === 0) {
    console.log(chalk.dim('No requirements found matching filters.'));
    return;
  }

  for (const { project, requirement } of allReqs) {
    const statusIcon =
      requirement.status === 'done' ? chalk.green('✓') :
      requirement.status === 'implementing' ? chalk.yellow('●') :
      '○';

    const priorityColor =
      requirement.priority === 'high' ? chalk.yellow :
      chalk.dim;

    console.log(
      `${statusIcon} [${chalk.cyan(project)}] ${requirement.id}: ${requirement.title}`
    );
    console.log(
      `  Status: ${requirement.status} | Priority: ${priorityColor(requirement.priority || 'medium')}`
    );
    console.log('');
  }
}

/**
 * ib share-file
 */
export function shareFileCommand(
  sourceProject: string,
  filePath: string,
  targetProjects: string,
  strategy?: 'copy' | 'symlink' | 'reference'
): void {
  try {
    const targets = targetProjects.split(',').map(t => t.trim());
    const shared = shareFile(sourceProject, filePath, targets, strategy || 'reference');

    console.log(chalk.green('✔ File shared successfully'));
    console.log(`  From: ${shared.sourceProject}:${shared.sourcePath}`);
    console.log(`  To: ${shared.targetProjects.join(', ')}`);
    console.log(`  Strategy: ${shared.syncStrategy}`);
  } catch (e: any) {
    console.log(chalk.red(`Error: ${e.message}`));
  }
}

/**
 * ib list-shared
 */
export function listSharedCommand(projectName?: string): void {
  const sharedFiles = listSharedFiles(projectName);

  console.log(chalk.bold(`Shared Files (${sharedFiles.length})`));
  console.log('');

  if (sharedFiles.length === 0) {
    console.log(chalk.dim('No shared files.'));
    return;
  }

  for (const sf of sharedFiles) {
    console.log(`${sf.name}`);
    console.log(chalk.dim(`  From: ${sf.sourceProject}`));
    console.log(chalk.dim(`  To: ${sf.targetProjects.join(', ')}`));
    console.log(chalk.dim(`  Strategy: ${sf.syncStrategy} | Last synced: ${sf.lastSynced}`));
    console.log('');
  }
}
