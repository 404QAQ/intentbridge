import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { getIntentBridgeDir } from '../utils/paths.js';
import type { Requirement } from '../models/types.js';

export interface VersionChange {
  field: string;
  from: any;
  to: any;
}

export interface RequirementVersion {
  version: string;
  timestamp: string;
  changes: VersionChange[];
  message?: string;
  author?: string;
  snapshot?: boolean;
  tag?: string;
}

export interface VersionDiff {
  fromVersion: string;
  toVersion: string;
  changes: VersionChange[];
  timestamp: string;
}

let currentVersionCounter = 0;

/**
 * Get versions file path
 */
function getVersionsPath(cwd?: string): string {
  return join(getIntentBridgeDir(cwd), 'versions.json');
}

/**
 * Load versions data
 */
export function loadVersions(cwd?: string): Record<string, RequirementVersion[]> {
  const path = getVersionsPath(cwd);

  if (!existsSync(path)) {
    return {};
  }

  try {
    const content = readFileSync(path, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

/**
 * Save versions data
 */
export function saveVersions(
  versions: Record<string, RequirementVersion[]>,
  cwd?: string
): void {
  const path = getVersionsPath(cwd);
  writeFileSync(path, JSON.stringify(versions, null, 2), 'utf-8');
}

/**
 * Get next version number
 */
export function getNextVersion(reqId: string, cwd?: string): string {
  const versions = loadVersions(cwd);
  const reqVersions = versions[reqId] || [];

  if (reqVersions.length === 0) {
    return 'v1.0';
  }

  const lastVersion = reqVersions[reqVersions.length - 1].version;
  const match = lastVersion.match(/v(\d+)\.(\d+)/);

  if (!match) {
    return 'v1.0';
  }

  const major = parseInt(match[1]);
  const minor = parseInt(match[2]);

  return `v${major}.${minor + 1}`;
}

/**
 * Track requirement change
 */
export function trackChange(
  reqId: string,
  changes: VersionChange[],
  message?: string,
  cwd?: string
): RequirementVersion {
  const versions = loadVersions(cwd);
  const reqVersions = versions[reqId] || [];

  const newVersion: RequirementVersion = {
    version: getNextVersion(reqId, cwd),
    timestamp: new Date().toISOString(),
    changes,
    message,
    author: 'system',
  };

  reqVersions.push(newVersion);
  versions[reqId] = reqVersions;
  saveVersions(versions, cwd);

  return newVersion;
}

/**
 * Compare two requirement states and find changes
 */
export function findChanges(
  oldReq: Partial<Requirement>,
  newReq: Partial<Requirement>
): VersionChange[] {
  const changes: VersionChange[] = [];
  const fields = new Set([...Object.keys(oldReq), ...Object.keys(newReq)]);

  // Skip internal fields
  const skipFields = ['versions', 'created'];

  for (const field of fields) {
    if (skipFields.includes(field)) continue;

    const oldValue = oldReq[field as keyof Requirement];
    const newValue = newReq[field as keyof Requirement];

    // Deep compare
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        field,
        from: oldValue,
        to: newValue,
      });
    }
  }

  return changes;
}

/**
 * Get requirement history
 */
export function getHistory(
  reqId: string,
  cwd?: string
): RequirementVersion[] {
  const versions = loadVersions(cwd);
  return versions[reqId] || [];
}

/**
 * Get specific version
 */
export function getVersion(
  reqId: string,
  version: string,
  cwd?: string
): RequirementVersion | null {
  const history = getHistory(reqId, cwd);
  return history.find(v => v.version === version || v.tag === version) || null;
}

/**
 * Compare two versions
 */
export function compareVersions(
  reqId: string,
  fromVersion: string,
  toVersion: string,
  cwd?: string
): VersionDiff | null {
  const from = getVersion(reqId, fromVersion, cwd);
  const to = getVersion(reqId, toVersion, cwd);

  if (!from || !to) {
    return null;
  }

  // Find all changes between versions
  const history = getHistory(reqId, cwd);
  const fromIdx = history.findIndex(v => v.version === fromVersion);
  const toIdx = history.findIndex(v => v.version === toVersion);

  if (fromIdx === -1 || toIdx === -1) {
    return null;
  }

  // Aggregate all changes
  const allChanges: VersionChange[] = [];
  const [start, end] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];

  for (let i = start + 1; i <= end; i++) {
    allChanges.push(...history[i].changes);
  }

  return {
    fromVersion: from.version,
    toVersion: to.version,
    changes: allChanges,
    timestamp: to.timestamp,
  };
}

/**
 * Create snapshot
 */
export function createSnapshot(
  reqId: string,
  tag: string,
  message?: string,
  cwd?: string
): RequirementVersion | null {
  const versions = loadVersions(cwd);
  const reqVersions = versions[reqId] || [];

  if (reqVersions.length === 0) {
    return null;
  }

  // Mark last version as snapshot
  const lastVersion = reqVersions[reqVersions.length - 1];
  lastVersion.snapshot = true;
  lastVersion.tag = tag;
  if (message) {
    lastVersion.message = message;
  }

  versions[reqId] = reqVersions;
  saveVersions(versions, cwd);

  return lastVersion;
}

/**
 * List snapshots
 */
export function listSnapshots(reqId: string, cwd?: string): RequirementVersion[] {
  const history = getHistory(reqId, cwd);
  return history.filter(v => v.snapshot);
}

/**
 * Rollback to specific version
 */
export function rollbackToVersion(
  req: Requirement,
  targetVersion: string,
  cwd?: string
): Requirement | null {
  const target = getVersion(req.id, targetVersion, cwd);

  if (!target) {
    return null;
  }

  // Apply reverse changes from current to target
  const history = getHistory(req.id, cwd);
  const currentIdx = history.length - 1;
  const targetIdx = history.findIndex(v => v.version === targetVersion);

  if (targetIdx === -1 || targetIdx >= currentIdx) {
    return null;
  }

  // Reconstruct requirement state at target version
  const rolledBack = { ...req };

  // Apply changes in reverse order
  for (let i = currentIdx; i > targetIdx; i--) {
    for (const change of history[i].changes) {
      // Reverse the change
      (rolledBack as any)[change.field] = change.from;
    }
  }

  return rolledBack;
}

/**
 * Get version summary
 */
export function getVersionSummary(reqId: string, cwd?: string): {
  totalVersions: number;
  snapshots: number;
  lastChange: string | null;
  lastVersion: string | null;
} {
  const history = getHistory(reqId, cwd);

  return {
    totalVersions: history.length,
    snapshots: history.filter(v => v.snapshot).length,
    lastChange: history.length > 0 ? history[history.length - 1].timestamp : null,
    lastVersion: history.length > 0 ? history[history.length - 1].version : null,
  };
}
