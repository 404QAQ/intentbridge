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
  addNote,
  searchRequirements,
  addTag,
  removeTag,
  getTags,
  findByTag,
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

describe('search requirements', () => {
  beforeEach(() => {
    writeProject(makeProject(), tmpDir);
    writeRequirements({ requirements: [] }, tmpDir);
    addRequirement('User Authentication', 'Implement JWT login system', 'high', tmpDir);
    addRequirement('User Profile', 'Manage user profile data', 'medium', tmpDir);
    addRequirement('API Documentation', 'Document all API endpoints', 'low', tmpDir);
  });

  it('finds requirements by title', () => {
    const results = searchRequirements('authentication', tmpDir);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('REQ-001');
    expect(results[0].title).toBe('User Authentication');
  });

  it('finds requirements by description', () => {
    const results = searchRequirements('JWT', tmpDir);
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('User Authentication');
  });

  it('finds requirements by ID (case insensitive)', () => {
    const results = searchRequirements('req-001', tmpDir);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('REQ-001');
  });

  it('finds multiple requirements matching keyword', () => {
    const results = searchRequirements('user', tmpDir);
    expect(results).toHaveLength(2);
    const titles = results.map((r) => r.title).sort();
    expect(titles).toEqual(['User Authentication', 'User Profile']);
  });

  it('returns empty array when no matches', () => {
    const results = searchRequirements('nonexistent', tmpDir);
    expect(results).toHaveLength(0);
  });

  it('searches in notes', () => {
    addNote('REQ-001', 'Use JWT for security', tmpDir);
    const results = searchRequirements('security', tmpDir);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('REQ-001');
  });

  it('is case insensitive', () => {
    const results1 = searchRequirements('AUTHENTICATION', tmpDir);
    const results2 = searchRequirements('authentication', tmpDir);
    const results3 = searchRequirements('AuThEnTiCaTiOn', tmpDir);
    expect(results1).toHaveLength(1);
    expect(results2).toHaveLength(1);
    expect(results3).toHaveLength(1);
  });
});

describe('tags', () => {
  beforeEach(() => {
    writeProject(makeProject(), tmpDir);
    writeRequirements({ requirements: [] }, tmpDir);
    addRequirement('User Authentication', 'Implement JWT login', 'high', tmpDir);
    addRequirement('User Profile', 'Manage profile', 'medium', tmpDir);
    addRequirement('API Docs', 'Document API', 'low', tmpDir);
  });

  it('adds a tag to a requirement', () => {
    const req = addTag('REQ-001', 'frontend', tmpDir);
    expect(req.tags).toEqual(['frontend']);
  });

  it('normalizes tags to lowercase', () => {
    const req = addTag('REQ-001', 'FrontEnd', tmpDir);
    expect(req.tags).toEqual(['frontend']);
  });

  it('adds multiple tags to a requirement', () => {
    addTag('REQ-001', 'frontend', tmpDir);
    addTag('REQ-001', 'backend', tmpDir);
    addTag('REQ-001', 'security', tmpDir);
    const req = readRequirements(tmpDir).requirements.find((r) => r.id === 'REQ-001')!;
    expect(req.tags).toEqual(['frontend', 'backend', 'security']);
  });

  it('prevents duplicate tags', () => {
    addTag('REQ-001', 'frontend', tmpDir);
    const req = addTag('REQ-001', 'frontend', tmpDir);
    expect(req.tags).toEqual(['frontend']);
  });

  it('removes a tag from a requirement', () => {
    addTag('REQ-001', 'frontend', tmpDir);
    addTag('REQ-001', 'backend', tmpDir);
    const req = removeTag('REQ-001', 'frontend', tmpDir);
    expect(req.tags).toEqual(['backend']);
  });

  it('deletes tags array when last tag is removed', () => {
    addTag('REQ-001', 'frontend', tmpDir);
    const req = removeTag('REQ-001', 'frontend', tmpDir);
    expect(req.tags).toBeUndefined();
  });

  it('throws when removing non-existent tag', () => {
    addTag('REQ-001', 'frontend', tmpDir);
    expect(() => removeTag('REQ-001', 'backend', tmpDir)).toThrow('does not have tag');
  });

  it('throws when removing tag from requirement with no tags', () => {
    expect(() => removeTag('REQ-001', 'frontend', tmpDir)).toThrow('has no tags');
  });

  it('gets all tags with counts', () => {
    addTag('REQ-001', 'frontend', tmpDir);
    addTag('REQ-001', 'backend', tmpDir);
    addTag('REQ-002', 'frontend', tmpDir);
    addTag('REQ-003', 'database', tmpDir);

    const tags = getTags(tmpDir);
    expect(tags.get('frontend')).toBe(2);
    expect(tags.get('backend')).toBe(1);
    expect(tags.get('database')).toBe(1);
  });

  it('returns empty map when no tags exist', () => {
    const tags = getTags(tmpDir);
    expect(tags.size).toBe(0);
  });

  it('finds requirements by tag', () => {
    addTag('REQ-001', 'frontend', tmpDir);
    addTag('REQ-002', 'frontend', tmpDir);
    addTag('REQ-003', 'backend', tmpDir);

    const frontendReqs = findByTag('frontend', tmpDir);
    expect(frontendReqs).toHaveLength(2);
    expect(frontendReqs.map((r) => r.id)).toEqual(['REQ-001', 'REQ-002']);

    const backendReqs = findByTag('backend', tmpDir);
    expect(backendReqs).toHaveLength(1);
    expect(backendReqs[0].id).toBe('REQ-003');
  });

  it('findByTag is case insensitive', () => {
    addTag('REQ-001', 'frontend', tmpDir);
    const results = findByTag('FrontEnd', tmpDir);
    expect(results).toHaveLength(1);
  });
});
