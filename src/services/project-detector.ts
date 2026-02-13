import { existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import {
  loadGlobalConfig,
  getProject,
  switchProject,
  type ProjectMeta,
} from './global-store.js';

/**
 * Detect current project based on working directory
 */
export function detectCurrentProject(cwd?: string): ProjectMeta | null {
  const workingDir = resolve(cwd || process.cwd());
  const config = loadGlobalConfig();

  // Strategy 1: Exact path match
  for (const project of config.projects) {
    if (project.path === workingDir) {
      return project;
    }
  }

  // Strategy 2: Subdirectory match (current dir is inside project dir)
  for (const project of config.projects) {
    if (workingDir.startsWith(project.path + '/') || workingDir.startsWith(project.path + '\\')) {
      return project;
    }
  }

  // Strategy 3: Find .intentbridge directory by traversing up
  const intentDir = findIntentBridgeDir(workingDir);
  if (intentDir) {
    const projectDir = dirname(intentDir);

    // Check if this project is registered
    for (const project of config.projects) {
      if (project.path === projectDir) {
        return project;
      }
    }

    // Found unregistered project
    return {
      name: projectDir.split('/').pop() || projectDir.split('\\').pop() || 'unknown',
      path: projectDir,
      registeredAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      status: 'active',
    };
  }

  // Strategy 4: Use current project from global config
  if (config.currentProject) {
    return getProject(config.currentProject);
  }

  return null;
}

/**
 * Find .intentbridge directory by traversing up
 */
export function findIntentBridgeDir(startPath: string): string | null {
  let currentPath = resolve(startPath);

  while (currentPath !== '/' && currentPath.length > 1) {
    const intentPath = join(currentPath, '.intentbridge');
    if (existsSync(intentPath)) {
      return intentPath;
    }
    currentPath = dirname(currentPath);
  }

  return null;
}

/**
 * Resolve project context (auto-detect or use specified)
 */
export function resolveProjectContext(
  projectName?: string,
  cwd?: string
): {
  project: ProjectMeta | null;
  needsRegistration: boolean;
  message?: string;
} {
  if (projectName) {
    // Explicit project name provided
    const project = getProject(projectName);
    if (project) {
      switchProject(projectName);
      return { project, needsRegistration: false };
    } else {
      return {
        project: null,
        needsRegistration: false,
        message: `Project "${projectName}" not found in registry. Run 'ib project register' first.`,
      };
    }
  }

  // Auto-detect project
  const detected = detectCurrentProject(cwd);

  if (!detected) {
    return {
      project: null,
      needsRegistration: true,
      message: 'No project detected in current directory. Run \'ib init\' to initialize or \'ib project register\' to register.',
    };
  }

  // Check if project is registered
  const config = loadGlobalConfig();
  const isRegistered = config.projects.some(p => p.path === detected.path);

  if (!isRegistered) {
    return {
      project: detected,
      needsRegistration: true,
      message: `Project detected at ${detected.path} but not registered. Run 'ib project register ${detected.path}' to register.`,
    };
  }

  // Auto-switch to detected project
  if (config.currentProject !== detected.name) {
    switchProject(detected.name);
  }

  return { project: detected, needsRegistration: false };
}

/**
 * Get all projects that contain a specific path
 */
export function getProjectsForPath(targetPath: string): ProjectMeta[] {
  const config = loadGlobalConfig();
  const resolved = resolve(targetPath);

  return config.projects.filter(project =>
    resolved.startsWith(project.path + '/') ||
    resolved.startsWith(project.path + '\\') ||
    resolved === project.path
  );
}

/**
 * Check if current directory is inside a project
 */
export function isInProject(cwd?: string): boolean {
  return detectCurrentProject(cwd) !== null;
}

/**
 * Get project root directory
 */
export function getProjectRoot(cwd?: string): string | null {
  const project = detectCurrentProject(cwd);
  return project?.path || null;
}

/**
 * Auto-register current project if not registered
 */
export async function autoRegisterProject(
  cwd?: string,
  meta?: Partial<ProjectMeta>
): Promise<ProjectMeta | null> {
  const detected = detectCurrentProject(cwd);

  if (!detected) {
    return null;
  }

  const config = loadGlobalConfig();
  const isRegistered = config.projects.some(p => p.path === detected.path);

  if (isRegistered) {
    return detected;
  }

  // Register the project
  const { registerProject } = await import('./global-store.js');
  return registerProject(detected.path, {
    name: detected.name,
    ...meta,
  });
}
