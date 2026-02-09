import { execSync } from 'node:child_process';
import { readRequirements, removeFileMapping, addFileMapping } from './store.js';

export interface SyncChange {
  type: 'deleted' | 'renamed';
  file: string;
  newFile?: string;       // only for renamed
  reqIds: string[];       // requirements that reference this file
}

/**
 * Get all files currently mapped in requirements.
 */
function getMappedFiles(cwd?: string): Map<string, string[]> {
  const data = readRequirements(cwd);
  const map = new Map<string, string[]>();
  for (const r of data.requirements) {
    for (const f of r.files) {
      if (!map.has(f)) map.set(f, []);
      map.get(f)!.push(r.id);
    }
  }
  return map;
}

/**
 * Get git status: deleted and renamed files.
 */
function getGitChanges(cwd?: string): { deleted: string[]; renamed: Map<string, string> } {
  const dir = cwd || process.cwd();
  const deleted: string[] = [];
  const renamed = new Map<string, string>();

  try {
    // Check tracked file deletions (only if HEAD exists)
    try {
      const diffOutput = execSync('git diff --name-status HEAD', { cwd: dir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      for (const line of diffOutput.split('\n').filter(Boolean)) {
        const parts = line.split('\t');
        if (parts[0] === 'D' && parts[1]) {
          deleted.push(parts[1]);
        } else if (parts[0]?.startsWith('R') && parts[1] && parts[2]) {
          renamed.set(parts[1], parts[2]);
        }
      }
    } catch {
      // No HEAD yet (fresh repo), skip diff
    }

    // Also check untracked deletions via porcelain status
    const statusOutput = execSync('git status --porcelain', { cwd: dir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    for (const line of statusOutput.split('\n').filter(Boolean)) {
      const status = line.substring(0, 2);
      const file = line.substring(3);
      if (status.includes('D')) {
        if (!deleted.includes(file)) deleted.push(file);
      }
      if (status.startsWith('R')) {
        const parts = file.split(' -> ');
        if (parts.length === 2 && !renamed.has(parts[0])) {
          renamed.set(parts[0], parts[1]);
        }
      }
    }
  } catch {
    // Not a git repo or git not available
  }

  return { deleted, renamed };
}

/**
 * Detect mapping changes needed based on git status.
 */
export function detectSyncChanges(cwd?: string): SyncChange[] {
  const mappedFiles = getMappedFiles(cwd);
  const { deleted, renamed } = getGitChanges(cwd);
  const changes: SyncChange[] = [];

  // Check renamed files
  for (const [oldFile, newFile] of renamed) {
    if (mappedFiles.has(oldFile)) {
      changes.push({
        type: 'renamed',
        file: oldFile,
        newFile,
        reqIds: mappedFiles.get(oldFile)!,
      });
    }
  }

  // Check deleted files (that aren't already handled as renames)
  for (const file of deleted) {
    if (mappedFiles.has(file) && !renamed.has(file)) {
      changes.push({
        type: 'deleted',
        file,
        reqIds: mappedFiles.get(file)!,
      });
    }
  }

  return changes;
}

/**
 * Apply a sync change: remove old mapping, add new one if renamed.
 */
export function applySyncChange(change: SyncChange, cwd?: string): void {
  for (const reqId of change.reqIds) {
    removeFileMapping(reqId, change.file, cwd);
    if (change.type === 'renamed' && change.newFile) {
      addFileMapping(reqId, [change.newFile], cwd);
    }
  }
}
