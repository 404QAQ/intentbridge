import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { Requirement, ProjectRuntimeConfig, CoordinationConfig, PortStatus, ProcessInfo, GlobalStatus, SystemResources, ProjectResources, ResourceUsage, PortConflict, ProjectDependencyGraph } from '../models/types.js';

export interface ProjectMeta {
  name: string;
  path: string;
  description?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  registeredAt: string;
  lastAccessed: string;
  status: 'active' | 'paused' | 'archived';
  linkedProjects?: string[]; // 关联的项目名称
  runtime?: ProjectRuntimeConfig; // v3.1.0: 运行时配置
  requiredPorts?: number[]; // v3.1.0: 项目需要的端口
}

export interface GlobalConfig {
  version: string;
  currentProject?: string; // 当前激活的项目名称
  projects: ProjectMeta[];
  sharedFiles: SharedFile[];
  settings: GlobalSettings;
  coordination?: CoordinationConfig; // v3.1.0: 协调配置
}

export interface SharedFile {
  id: string;
  name: string;
  sourceProject: string;
  sourcePath: string;
  targetProjects: string[]; // 共享到哪些项目
  lastSynced: string;
  syncStrategy: 'copy' | 'symlink' | 'reference';
}

export interface GlobalSettings {
  autoSync: boolean;
  syncInterval: number; // minutes
  maxProjects: number;
  defaultView: 'current' | 'all';
}

const GLOBAL_DIR = join(homedir(), '.intentbridge');
const PROJECTS_FILE = 'projects.json';
const CONFIG_FILE = 'global-config.json';

let globalConfig: GlobalConfig | null = null;

export function getGlobalDir(): string {
  if (!existsSync(GLOBAL_DIR)) {
    mkdirSync(GLOBAL_DIR, { recursive: true });
  }
  return GLOBAL_DIR;
}

export function getProjectsPath(): string {
  return join(getGlobalDir(), PROJECTS_FILE);
}

export function getConfigPath(): string {
  return join(getGlobalDir(), CONFIG_FILE);
}

/**
 * Load global configuration
 */
export function loadGlobalConfig(): GlobalConfig {
  if (globalConfig) {
    return globalConfig;
  }

  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    // Initialize with default config
    const defaultConfig: GlobalConfig = {
      version: '3.1.0',
      projects: [],
      sharedFiles: [],
      settings: {
        autoSync: true,
        syncInterval: 30,
        maxProjects: 50,
        defaultView: 'current',
      },
      coordination: {
        portRanges: {
          frontend: '3000-3999',
          backend: '8000-8999',
          database: '9000-9999',
          mcp: '9500-9599',
          web: '9600-9699',
        },
        reservedPorts: [],
        autoPortAssignment: true,
      },
    };
    saveGlobalConfig(defaultConfig);
    globalConfig = defaultConfig;
    return defaultConfig;
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    globalConfig = JSON.parse(content);
    return globalConfig!;
  } catch {
    throw new Error('Failed to load global configuration');
  }
}

/**
 * Save global configuration
 */
export function saveGlobalConfig(config?: GlobalConfig): void {
  if (config) {
    globalConfig = config;
  }

  if (!globalConfig) {
    throw new Error('No configuration to save');
  }

  const configPath = getConfigPath();
  writeFileSync(configPath, JSON.stringify(globalConfig, null, 2), 'utf-8');
}

/**
 * Register a project
 */
export function registerProject(
  projectPath: string,
  meta: Partial<ProjectMeta>
): ProjectMeta {
  const config = loadGlobalConfig();

  // Check if already registered
  const existing = config.projects.find(p => p.path === projectPath);
  if (existing) {
    // Update existing project
    Object.assign(existing, meta, { lastAccessed: new Date().toISOString() });
    saveGlobalConfig(config);
    return existing;
  }

  // Check max projects limit
  if (config.projects.length >= config.settings.maxProjects) {
    throw new Error(`Maximum projects limit reached (${config.settings.maxProjects})`);
  }

  // Create new project
  const projectName = meta.name || projectPath.split('/').pop() || 'unnamed';

  const newProject: ProjectMeta = {
    name: projectName,
    path: projectPath,
    description: meta.description || '',
    tags: meta.tags || [],
    priority: meta.priority || 'medium',
    registeredAt: new Date().toISOString(),
    lastAccessed: new Date().toISOString(),
    status: 'active',
    linkedProjects: meta.linkedProjects || [],
  };

  config.projects.push(newProject);
  saveGlobalConfig(config);

  return newProject;
}

/**
 * Unregister a project
 */
export function unregisterProject(projectName: string): boolean {
  const config = loadGlobalConfig();
  const idx = config.projects.findIndex(p => p.name === projectName);

  if (idx === -1) {
    return false;
  }

  // Remove shared files from this project
  config.sharedFiles = config.sharedFiles.filter(
    sf => sf.sourceProject !== projectName && !sf.targetProjects.includes(projectName)
  );

  // Remove project
  config.projects.splice(idx, 1);

  // Update current project if needed
  if (config.currentProject === projectName) {
    config.currentProject = config.projects[0]?.name;
  }

  saveGlobalConfig(config);
  return true;
}

/**
 * Get project by name
 */
export function getProject(projectName: string): ProjectMeta | null {
  const config = loadGlobalConfig();
  return config.projects.find(p => p.name === projectName) || null;
}

/**
 * Get current project
 */
export function getCurrentProject(): ProjectMeta | null {
  const config = loadGlobalConfig();
  if (!config.currentProject) {
    return null;
  }
  return getProject(config.currentProject);
}

/**
 * Switch to a project
 */
export function switchProject(projectName: string): ProjectMeta {
  const config = loadGlobalConfig();
  const project = config.projects.find(p => p.name === projectName);

  if (!project) {
    throw new Error(`Project "${projectName}" not found`);
  }

  // Update last accessed
  project.lastAccessed = new Date().toISOString();
  config.currentProject = projectName;

  saveGlobalConfig(config);
  return project;
}

/**
 * List all projects
 */
export function listProjects(): ProjectMeta[] {
  const config = loadGlobalConfig();
  return config.projects.sort((a, b) =>
    new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
  );
}

/**
 * Link projects
 */
export function linkProjects(
  projectName: string,
  linkedProjectNames: string[]
): void {
  const config = loadGlobalConfig();
  const project = config.projects.find(p => p.name === projectName);

  if (!project) {
    throw new Error(`Project "${projectName}" not found`);
  }

  // Validate linked projects exist
  for (const name of linkedProjectNames) {
    if (!config.projects.find(p => p.name === name)) {
      throw new Error(`Linked project "${name}" not found`);
    }
  }

  project.linkedProjects = [
    ...new Set([...(project.linkedProjects || []), ...linkedProjectNames]),
  ];

  saveGlobalConfig(config);
}

/**
 * Share file between projects
 */
export function shareFile(
  sourceProject: string,
  sourcePath: string,
  targetProjects: string[],
  strategy: 'copy' | 'symlink' | 'reference' = 'reference'
): SharedFile {
  const config = loadGlobalConfig();

  // Validate projects exist
  if (!config.projects.find(p => p.name === sourceProject)) {
    throw new Error(`Source project "${sourceProject}" not found`);
  }

  for (const target of targetProjects) {
    if (!config.projects.find(p => p.name === target)) {
      throw new Error(`Target project "${target}" not found`);
    }
  }

  const sharedFile: SharedFile = {
    id: `share-${Date.now()}`,
    name: sourcePath.split('/').pop() || 'unnamed',
    sourceProject,
    sourcePath,
    targetProjects,
    lastSynced: new Date().toISOString(),
    syncStrategy: strategy,
  };

  config.sharedFiles.push(sharedFile);
  saveGlobalConfig(config);

  return sharedFile;
}

/**
 * List shared files
 */
export function listSharedFiles(projectName?: string): SharedFile[] {
  const config = loadGlobalConfig();

  if (!projectName) {
    return config.sharedFiles;
  }

  return config.sharedFiles.filter(
    sf => sf.sourceProject === projectName || sf.targetProjects.includes(projectName)
  );
}

/**
 * Get global requirements view
 */
export function getGlobalRequirements(
  filter?: {
    tag?: string;
    status?: string;
    priority?: string;
  }
): Array<{ project: string; requirement: Requirement }> {
  const config = loadGlobalConfig();
  const results: Array<{ project: string; requirement: Requirement }> = [];

  // This will be implemented by reading each project's requirements
  // For now, return empty array
  // Will be called from commands layer

  return results;
}

/**
 * Update project status
 */
export function updateProjectStatus(
  projectName: string,
  status: 'active' | 'paused' | 'archived'
): void {
  const config = loadGlobalConfig();
  const project = config.projects.find(p => p.name === projectName);

  if (!project) {
    throw new Error(`Project "${projectName}" not found`);
  }

  project.status = status;
  saveGlobalConfig(config);
}

/**
 * Get project statistics
 */
export function getProjectStats(): {
  total: number;
  active: number;
  paused: number;
  archived: number;
  linkedCount: number;
} {
  const config = loadGlobalConfig();

  return {
    total: config.projects.length,
    active: config.projects.filter(p => p.status === 'active').length,
    paused: config.projects.filter(p => p.status === 'paused').length,
    archived: config.projects.filter(p => p.status === 'archived').length,
    linkedCount: config.projects.filter(p => p.linkedProjects && p.linkedProjects.length > 0).length,
  };
}

// === v3.1.0 新增：运行时协调功能 ===

/**
 * Update project runtime configuration
 */
export function updateProjectRuntime(
  projectName: string,
  runtime: Partial<ProjectRuntimeConfig>
): void {
  const config = loadGlobalConfig();
  const project = config.projects.find(p => p.name === projectName);

  if (!project) {
    throw new Error(`Project "${projectName}" not found`);
  }

  project.runtime = {
    ...project.runtime,
    ...runtime,
  };

  saveGlobalConfig(config);
}

/**
 * Get project runtime configuration
 */
export function getProjectRuntime(projectName: string): ProjectRuntimeConfig | null {
  const project = getProject(projectName);
  return project?.runtime || null;
}

/**
 * Reserve ports for a project
 */
export function reservePorts(
  projectName: string,
  ports: number[]
): void {
  const config = loadGlobalConfig();
  const project = config.projects.find(p => p.name === projectName);

  if (!project) {
    throw new Error(`Project "${projectName}" not found`);
  }

  // Check for conflicts
  const conflicts: number[] = [];
  for (const port of ports) {
    const reservedByOther = config.projects.find(
      p => p.name !== projectName && p.requiredPorts?.includes(port)
    );
    if (reservedByOther) {
      conflicts.push(port);
    }
  }

  if (conflicts.length > 0) {
    throw new Error(`Port conflicts detected: ${conflicts.join(', ')}`);
  }

  project.requiredPorts = [...new Set([...(project.requiredPorts || []), ...ports])];
  saveGlobalConfig(config);
}

/**
 * Release ports for a project
 */
export function releasePorts(
  projectName: string,
  ports?: number[]
): void {
  const config = loadGlobalConfig();
  const project = config.projects.find(p => p.name === projectName);

  if (!project) {
    throw new Error(`Project "${projectName}" not found`);
  }

  if (!project.requiredPorts) return;

  if (ports) {
    project.requiredPorts = project.requiredPorts.filter(p => !ports.includes(p));
  } else {
    project.requiredPorts = [];
  }

  saveGlobalConfig(config);
}

/**
 * Get all reserved ports
 */
export function getReservedPorts(): Array<{ port: number; project: string }> {
  const config = loadGlobalConfig();
  const reserved: Array<{ port: number; project: string }> = [];

  for (const project of config.projects) {
    if (project.requiredPorts) {
      for (const port of project.requiredPorts) {
        reserved.push({ port, project: project.name });
      }
    }
  }

  return reserved.sort((a, b) => a.port - b.port);
}

/**
 * Update coordination configuration
 */
export function updateCoordinationConfig(
  coordination: Partial<CoordinationConfig>
): void {
  const config = loadGlobalConfig();
  config.coordination = {
    ...config.coordination,
    ...coordination,
  };
  saveGlobalConfig(config);
}

/**
 * Get coordination configuration
 */
export function getCoordinationConfig(): CoordinationConfig {
  const config = loadGlobalConfig();
  return config.coordination || {
    portRanges: {},
    reservedPorts: [],
    autoPortAssignment: true,
  };
}

/**
 * Register project with runtime configuration
 */
export function registerProjectWithRuntime(
  projectPath: string,
  meta: Partial<ProjectMeta> & { runtime?: ProjectRuntimeConfig }
): ProjectMeta {
  const project = registerProject(projectPath, meta);

  if (meta.runtime) {
    updateProjectRuntime(project.name, meta.runtime);
  }

  if (meta.requiredPorts) {
    reservePorts(project.name, meta.requiredPorts);
  }

  return getProject(project.name)!;
}

/**
 * Get project dependencies (linked projects)
 */
export function getProjectDependencies(projectName: string): string[] {
  const project = getProject(projectName);
  return project?.linkedProjects || [];
}

/**
 * Get project dependents (projects that depend on this one)
 */
export function getProjectDependents(projectName: string): string[] {
  const config = loadGlobalConfig();
  return config.projects
    .filter(p => p.linkedProjects?.includes(projectName))
    .map(p => p.name);
}

/**
 * Get dependency graph for all projects
 */
export function getDependencyGraph(): ProjectDependencyGraph {
  const config = loadGlobalConfig();
  const nodes: ProjectDependencyGraph['nodes'] = [];
  const edges: ProjectDependencyGraph['edges'] = [];

  for (const project of config.projects) {
    nodes.push({
      name: project.name,
      status: 'stopped', // Will be updated by coordinator
      dependencies: project.linkedProjects || [],
      dependents: config.projects
        .filter(p => p.linkedProjects?.includes(project.name))
        .map(p => p.name),
    });

    for (const dep of project.linkedProjects || []) {
      edges.push({
        from: project.name,
        to: dep,
        type: 'hard',
      });
    }
  }

  // Calculate start order using topological sort
  const visited = new Set<string>();
  const startOrder: string[] = [];

  function visit(name: string) {
    if (visited.has(name)) return;
    visited.add(name);

    const project = config.projects.find(p => p.name === name);
    if (project?.linkedProjects) {
      for (const dep of project.linkedProjects) {
        visit(dep);
      }
    }

    startOrder.push(name);
  }

  for (const project of config.projects) {
    visit(project.name);
  }

  return { nodes, edges, startOrder };
}
