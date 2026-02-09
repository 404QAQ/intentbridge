import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import {
  writeProject,
  writeRequirements,
  addRequirement,
  addFileMapping,
  readRequirements,
} from '../src/services/store.js';
import { detectSyncChanges, applySyncChange } from '../src/services/sync.js';
import type { ProjectConfig } from '../src/models/types.js';
import { writeFileSync, unlinkSync } from 'node:fs';

let tmpDir: string;

function initGitRepo() {
  execSync('git init', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git config user.email "test@test.com"', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git config user.name "Test"', { cwd: tmpDir, stdio: 'ignore' });
}

function setupProject() {
  const config: ProjectConfig = {
    version: '1',
    project: {
      name: 'test-project',
      description: 'A test project',
      tech_stack: ['TypeScript'],
      conventions: [],
    },
  };
  writeProject(config, tmpDir);
  writeRequirements({ requirements: [] }, tmpDir);
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'ib-sync-test-'));
  initGitRepo();
  setupProject();
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('detectSyncChanges', () => {
  it('returns empty when no mappings exist', () => {
    const changes = detectSyncChanges(tmpDir);
    expect(changes).toEqual([]);
  });

  it('returns empty when mapped files still exist', () => {
    addRequirement('Feature', 'Desc', 'medium', tmpDir);
    const filePath = join(tmpDir, 'src', 'a.ts');
    execSync(`mkdir -p ${join(tmpDir, 'src')}`, { stdio: 'ignore' });
    writeFileSync(filePath, 'export const a = 1;');
    execSync('git add -A && git commit -m "init"', { cwd: tmpDir, stdio: 'ignore' });
    addFileMapping('REQ-001', ['src/a.ts'], tmpDir);

    const changes = detectSyncChanges(tmpDir);
    expect(changes).toEqual([]);
  });

  it('detects deleted files', () => {
    addRequirement('Feature', 'Desc', 'medium', tmpDir);
    const filePath = join(tmpDir, 'src', 'a.ts');
    execSync(`mkdir -p ${join(tmpDir, 'src')}`, { stdio: 'ignore' });
    writeFileSync(filePath, 'export const a = 1;');
    execSync('git add -A && git commit -m "init"', { cwd: tmpDir, stdio: 'ignore' });
    addFileMapping('REQ-001', ['src/a.ts'], tmpDir);

    // Delete the file
    unlinkSync(filePath);
    execSync('git add -A', { cwd: tmpDir, stdio: 'ignore' });

    const changes = detectSyncChanges(tmpDir);
    expect(changes).toHaveLength(1);
    expect(changes[0].type).toBe('deleted');
    expect(changes[0].file).toBe('src/a.ts');
    expect(changes[0].reqIds).toContain('REQ-001');
  });
});

describe('applySyncChange', () => {
  it('removes mapping for deleted file', () => {
    addRequirement('Feature', 'Desc', 'medium', tmpDir);
    addFileMapping('REQ-001', ['src/a.ts', 'src/b.ts'], tmpDir);

    applySyncChange(
      { type: 'deleted', file: 'src/a.ts', reqIds: ['REQ-001'] },
      tmpDir
    );

    const data = readRequirements(tmpDir);
    expect(data.requirements[0].files).toEqual(['src/b.ts']);
  });

  it('updates mapping for renamed file', () => {
    addRequirement('Feature', 'Desc', 'medium', tmpDir);
    addFileMapping('REQ-001', ['src/old.ts'], tmpDir);

    applySyncChange(
      { type: 'renamed', file: 'src/old.ts', newFile: 'src/new.ts', reqIds: ['REQ-001'] },
      tmpDir
    );

    const data = readRequirements(tmpDir);
    expect(data.requirements[0].files).toContain('src/new.ts');
    expect(data.requirements[0].files).not.toContain('src/old.ts');
  });
});
