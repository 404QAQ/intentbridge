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

export function addNote(id: string, content: string, cwd?: string): Requirement {
  const data = readRequirements(cwd);
  const req = data.requirements.find((r) => r.id === id);
  if (!req) throw new Error(`Requirement ${id} not found`);
  if (!req.notes) req.notes = [];
  req.notes.push({
    date: new Date().toISOString().split('T')[0],
    content,
  });
  writeRequirements(data, cwd);
  return req;
}

export function addAcceptanceCriterion(id: string, criterion: string, cwd?: string): Requirement {
  const data = readRequirements(cwd);
  const req = data.requirements.find((r) => r.id === id);
  if (!req) throw new Error(`Requirement ${id} not found`);
  if (!req.acceptance) req.acceptance = [];
  req.acceptance.push({ criterion, done: false });
  writeRequirements(data, cwd);
  return req;
}

export function acceptCriterion(id: string, index: number, cwd?: string): Requirement {
  const data = readRequirements(cwd);
  const req = data.requirements.find((r) => r.id === id);
  if (!req) throw new Error(`Requirement ${id} not found`);
  if (!req.acceptance || index < 0 || index >= req.acceptance.length) {
    throw new Error(`Invalid acceptance criterion index ${index}`);
  }
  req.acceptance[index].done = true;
  writeRequirements(data, cwd);
  return req;
}

export function addDependency(id: string, depId: string, cwd?: string): Requirement {
  const data = readRequirements(cwd);
  const req = data.requirements.find((r) => r.id === id);
  if (!req) throw new Error(`Requirement ${id} not found`);
  const dep = data.requirements.find((r) => r.id === depId);
  if (!dep) throw new Error(`Requirement ${depId} not found`);
  if (id === depId) throw new Error('A requirement cannot depend on itself');
  if (!req.depends_on) req.depends_on = [];
  if (req.depends_on.includes(depId)) return req;

  // Cycle detection: check if depId transitively depends on id
  const visited = new Set<string>();
  const queue = [depId];
  while (queue.length > 0) {
    const current = queue.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);
    const r = data.requirements.find((r) => r.id === current);
    if (r?.depends_on) {
      for (const d of r.depends_on) {
        if (d === id) throw new Error(`Circular dependency: ${id} → ${depId} → ... → ${id}`);
        queue.push(d);
      }
    }
  }

  req.depends_on.push(depId);
  writeRequirements(data, cwd);
  return req;
}

export function removeDependency(id: string, depId: string, cwd?: string): Requirement {
  const data = readRequirements(cwd);
  const req = data.requirements.find((r) => r.id === id);
  if (!req) throw new Error(`Requirement ${id} not found`);
  if (!req.depends_on) throw new Error(`${id} has no dependencies`);
  const idx = req.depends_on.indexOf(depId);
  if (idx === -1) throw new Error(`${id} does not depend on ${depId}`);
  req.depends_on.splice(idx, 1);
  if (req.depends_on.length === 0) delete req.depends_on;
  writeRequirements(data, cwd);
  return req;
}

export function searchRequirements(keyword: string, cwd?: string): Requirement[] {
  const data = readRequirements(cwd);
  const lowerKeyword = keyword.toLowerCase();

  return data.requirements.filter((req) => {
    // Exact ID match
    if (req.id.toLowerCase() === lowerKeyword) return true;
    // Title contains
    if (req.title.toLowerCase().includes(lowerKeyword)) return true;
    // Description contains
    if (req.description.toLowerCase().includes(lowerKeyword)) return true;
    // Notes contain
    if (req.notes && req.notes.some((n) => n.content.toLowerCase().includes(lowerKeyword))) {
      return true;
    }
    return false;
  });
}

export function addTag(id: string, tag: string, cwd?: string): Requirement {
  const data = readRequirements(cwd);
  const req = data.requirements.find((r) => r.id === id);
  if (!req) throw new Error(`Requirement ${id} not found`);
  if (!req.tags) req.tags = [];
  const normalizedTag = tag.toLowerCase().trim();
  if (req.tags.includes(normalizedTag)) return req;
  req.tags.push(normalizedTag);
  writeRequirements(data, cwd);
  return req;
}

export function removeTag(id: string, tag: string, cwd?: string): Requirement {
  const data = readRequirements(cwd);
  const req = data.requirements.find((r) => r.id === id);
  if (!req) throw new Error(`Requirement ${id} not found`);
  if (!req.tags) throw new Error(`${id} has no tags`);
  const normalizedTag = tag.toLowerCase().trim();
  const idx = req.tags.indexOf(normalizedTag);
  if (idx === -1) throw new Error(`${id} does not have tag "${tag}"`);
  req.tags.splice(idx, 1);
  if (req.tags.length === 0) delete req.tags;
  writeRequirements(data, cwd);
  return req;
}

export function getTags(cwd?: string): Map<string, number> {
  const data = readRequirements(cwd);
  const tagCounts = new Map<string, number>();
  for (const req of data.requirements) {
    if (req.tags) {
      for (const tag of req.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
  }
  return tagCounts;
}

export function findByTag(tag: string, cwd?: string): Requirement[] {
  const data = readRequirements(cwd);
  const normalizedTag = tag.toLowerCase().trim();
  return data.requirements.filter((req) => req.tags?.includes(normalizedTag));
}

export function addRequirementFromTemplate(
  title: string,
  description: string,
  priority: RequirementPriority,
  tags: string[],
  acceptance: Array<{ criterion: string; done: boolean }>,
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
    tags,
    files: [],
    acceptance,
  };
  data.requirements.push(req);
  writeRequirements(data, cwd);
  return req;
}
