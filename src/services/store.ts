import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import yaml from 'js-yaml';
import type {
  ProjectConfig,
  RequirementsData,
  Requirement,
  RequirementStatus,
  RequirementPriority,
} from '../models/types.js';
import {
  getIntentBridgeDir,
  getProjectYamlPath,
  getRequirementsYamlPath,
} from '../utils/paths.js';

export function isInitialized(cwd?: string): boolean {
  return existsSync(getIntentBridgeDir(cwd));
}

export function ensureInitialized(cwd?: string): void {
  if (!isInitialized(cwd)) {
    throw new Error(
      'IntentBridge not initialized. Run `ib init` first.'
    );
  }
}

// --- Project ---

export function readProject(cwd?: string): ProjectConfig {
  ensureInitialized(cwd);
  const raw = readFileSync(getProjectYamlPath(cwd), 'utf-8');
  return yaml.load(raw) as ProjectConfig;
}

export function writeProject(config: ProjectConfig, cwd?: string): void {
  const dir = getIntentBridgeDir(cwd);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(getProjectYamlPath(cwd), yaml.dump(config, { lineWidth: -1 }));
}

// --- Requirements ---

export function readRequirements(cwd?: string): RequirementsData {
  ensureInitialized(cwd);
  const path = getRequirementsYamlPath(cwd);
  if (!existsSync(path)) {
    return { requirements: [] };
  }
  const raw = readFileSync(path, 'utf-8');
  const data = yaml.load(raw) as RequirementsData | null;
  return data ?? { requirements: [] };
}

export function writeRequirements(data: RequirementsData, cwd?: string): void {
  ensureInitialized(cwd);
  writeFileSync(
    getRequirementsYamlPath(cwd),
    yaml.dump(data, { lineWidth: -1 })
  );
}

export function getNextReqId(data: RequirementsData): string {
  if (data.requirements.length === 0) return 'REQ-001';
  const maxNum = data.requirements.reduce((max, r) => {
    const num = parseInt(r.id.replace('REQ-', ''), 10);
    return num > max ? num : max;
  }, 0);
  return `REQ-${String(maxNum + 1).padStart(3, '0')}`;
}

export function addRequirement(
  title: string,
  description: string,
  priority: RequirementPriority,
  cwd?: string
): Requirement {
  const data = readRequirements(cwd);
  const req: Requirement = {
    id: getNextReqId(data),
    title,
    description,
    status: 'draft',
    priority,
    created: new Date().toISOString().split('T')[0],
    files: [],
  };
  data.requirements.push(req);
  writeRequirements(data, cwd);
  return req;
}

export function updateRequirement(
  id: string,
  updates: Partial<Pick<Requirement, 'title' | 'description' | 'status' | 'priority'>>,
  cwd?: string
): Requirement {
  const data = readRequirements(cwd);
  const req = data.requirements.find((r) => r.id === id);
  if (!req) throw new Error(`Requirement ${id} not found`);
  if (updates.title !== undefined) req.title = updates.title;
  if (updates.description !== undefined) req.description = updates.description;
  if (updates.status !== undefined) req.status = updates.status;
  if (updates.priority !== undefined) req.priority = updates.priority;
  writeRequirements(data, cwd);
  return req;
}

export function removeRequirement(id: string, cwd?: string): void {
  const data = readRequirements(cwd);
  const idx = data.requirements.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error(`Requirement ${id} not found`);
  data.requirements.splice(idx, 1);
  writeRequirements(data, cwd);
}

export function addFileMapping(id: string, files: string[], cwd?: string): Requirement {
  const data = readRequirements(cwd);
  const req = data.requirements.find((r) => r.id === id);
  if (!req) throw new Error(`Requirement ${id} not found`);
  for (const f of files) {
    if (!req.files.includes(f)) {
      req.files.push(f);
    }
  }
  writeRequirements(data, cwd);
  return req;
}

export function removeFileMapping(id: string, file: string, cwd?: string): Requirement {
  const data = readRequirements(cwd);
  const req = data.requirements.find((r) => r.id === id);
  if (!req) throw new Error(`Requirement ${id} not found`);
  const idx = req.files.indexOf(file);
  if (idx === -1) throw new Error(`File ${file} not mapped to ${id}`);
  req.files.splice(idx, 1);
  writeRequirements(data, cwd);
  return req;
}
