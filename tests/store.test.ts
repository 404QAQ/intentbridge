import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  isInitialized,
  writeProject,
  readProject,
  readRequirements,
  writeRequirements,
  addRequirement,
  updateRequirement,
  removeRequirement,
  addFileMapping,
  removeFileMapping,
  getNextReqId,
} from '../src/services/store.js';
import type { ProjectConfig, RequirementsData } from '../src/models/types.js';

let tmpDir: string;

function makeProject(): ProjectConfig {
  return {
    version: '1',
    project: {
      name: 'test-project',
      description: 'A test project',
      tech_stack: ['TypeScript'],
      conventions: ['Use ESM'],
    },
  };
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'ib-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('isInitialized', () => {
  it('returns false for empty directory', () => {
    expect(isInitialized(tmpDir)).toBe(false);
  });

  it('returns true after writeProject', () => {
    writeProject(makeProject(), tmpDir);
    expect(isInitialized(tmpDir)).toBe(true);
  });
});

describe('project read/write', () => {
  it('round-trips project config', () => {
    const config = makeProject();
    writeProject(config, tmpDir);
    const read = readProject(tmpDir);
    expect(read.project.name).toBe('test-project');
    expect(read.project.tech_stack).toEqual(['TypeScript']);
  });
});

describe('requirements', () => {
  beforeEach(() => {
    writeProject(makeProject(), tmpDir);
    writeRequirements({ requirements: [] }, tmpDir);
  });

  it('starts with empty requirements', () => {
    const data = readRequirements(tmpDir);
    expect(data.requirements).toEqual([]);
  });

  it('generates sequential IDs', () => {
    expect(getNextReqId({ requirements: [] })).toBe('REQ-001');
    expect(
      getNextReqId({
        requirements: [
          { id: 'REQ-003', title: '', description: '', status: 'draft', priority: 'medium', created: '', files: [] },
        ],
      })
    ).toBe('REQ-004');
  });

  it('adds a requirement', () => {
    const req = addRequirement('Test req', 'Description', 'high', tmpDir);
    expect(req.id).toBe('REQ-001');
    expect(req.status).toBe('draft');
    expect(req.priority).toBe('high');

    const data = readRequirements(tmpDir);
    expect(data.requirements).toHaveLength(1);
  });

  it('updates a requirement', () => {
    addRequirement('Test req', 'Desc', 'medium', tmpDir);
    const updated = updateRequirement('REQ-001', { status: 'active', title: 'Updated' }, tmpDir);
    expect(updated.status).toBe('active');
    expect(updated.title).toBe('Updated');
  });

  it('removes a requirement', () => {
    addRequirement('Test req', 'Desc', 'medium', tmpDir);
    removeRequirement('REQ-001', tmpDir);
    const data = readRequirements(tmpDir);
    expect(data.requirements).toHaveLength(0);
  });

  it('throws on unknown requirement', () => {
    expect(() => updateRequirement('REQ-999', { status: 'done' }, tmpDir)).toThrow('not found');
  });
});

describe('file mappings', () => {
  beforeEach(() => {
    writeProject(makeProject(), tmpDir);
    writeRequirements({ requirements: [] }, tmpDir);
    addRequirement('Test req', 'Desc', 'medium', tmpDir);
  });

  it('adds file mappings', () => {
    const req = addFileMapping('REQ-001', ['src/a.ts', 'src/b.ts'], tmpDir);
    expect(req.files).toEqual(['src/a.ts', 'src/b.ts']);
  });

  it('deduplicates file mappings', () => {
    addFileMapping('REQ-001', ['src/a.ts'], tmpDir);
    const req = addFileMapping('REQ-001', ['src/a.ts', 'src/b.ts'], tmpDir);
    expect(req.files).toEqual(['src/a.ts', 'src/b.ts']);
  });

  it('removes file mappings', () => {
    addFileMapping('REQ-001', ['src/a.ts', 'src/b.ts'], tmpDir);
    const req = removeFileMapping('REQ-001', 'src/a.ts', tmpDir);
    expect(req.files).toEqual(['src/b.ts']);
  });

  it('throws on unmapped file removal', () => {
    expect(() => removeFileMapping('REQ-001', 'nope.ts', tmpDir)).toThrow('not mapped');
  });
});
