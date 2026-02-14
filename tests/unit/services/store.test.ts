import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  readRequirements,
  addRequirement,
  updateRequirement,
  removeRequirement,
  addNote,
  addAcceptanceCriterion,
} from '../../../src/services/store';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import yaml from 'js-yaml';

function createTestProject(name: string): string {
  const testDir = join(tmpdir(), `ib-test-${name}-${Date.now()}`);
  const ibDir = join(testDir, '.intentbridge');

  mkdirSync(ibDir, { recursive: true });

  // Create project.yaml
  const projectConfig = {
    version: '1',
    project: {
      name: name,
      description: 'Test project',
      tech_stack: ['TypeScript'],
      conventions: ['Use ESM'],
    },
  };
  writeFileSync(join(ibDir, 'project.yaml'), yaml.dump(projectConfig), 'utf-8');

  // Create requirements.yaml
  writeFileSync(join(ibDir, 'requirements.yaml'), yaml.dump({ requirements: [] }), 'utf-8');

  return testDir;
}

function cleanupTestProject(testDir: string): void {
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
}

describe('RequirementStore', () => {
  let testProjectDir: string;

  beforeEach(() => {
    testProjectDir = createTestProject('test-store');
  });

  afterEach(() => {
    cleanupTestProject('test-store');
  });

  describe('readRequirements', () => {
    it('should read empty requirements', () => {
      const data = readRequirements(testProjectDir);
      expect(data).toBeDefined();
      expect(data.requirements).toEqual([]);
    });

    it('should create requirements.yaml if not exists', () => {
      const data = readRequirements(testProjectDir);
      expect(data).toBeDefined();
      expect(data.requirements).toBeDefined();
    });
  });

  describe('addRequirement', () => {
    it('should add a new requirement', () => {
      const req = addRequirement(
        'Test Requirement',
        'Test description',
        'medium',
        testProjectDir
      );

      expect(req).toBeDefined();
      expect(req.id).toMatch(/REQ-\d+/);
      expect(req.title).toBe('Test Requirement');
      expect(req.description).toBe('Test description');
      expect(req.status).toBe('draft');
      expect(req.priority).toBe('medium');
      expect(req.created).toBeDefined();
      expect(req.files).toEqual([]);
    });

    it('should increment requirement IDs', () => {
      const req1 = addRequirement('Req 1', 'Desc 1', 'high', testProjectDir);
      const req2 = addRequirement('Req 2', 'Desc 2', 'low', testProjectDir);

      const id1 = parseInt(req1.id.split('-')[1]);
      const id2 = parseInt(req2.id.split('-')[1]);

      expect(id2).toBeGreaterThan(id1);
    });

    it('should persist requirement to file', () => {
      addRequirement('Persisted Req', 'Will be saved', 'medium', testProjectDir);

      const data = readRequirements(testProjectDir);
      expect(data.requirements).toHaveLength(1);
      expect(data.requirements[0].title).toBe('Persisted Req');
    });
  });

  describe('updateRequirement', () => {
    it('should update requirement title', () => {
      const req = addRequirement('Original', 'Desc', 'medium', testProjectDir);

      const updated = updateRequirement(
        req.id,
        { title: 'Updated Title' },
        testProjectDir
      );

      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('Desc'); // Should preserve other fields
    });

    it('should update requirement status', () => {
      const req = addRequirement('Test', 'Desc', 'medium', testProjectDir);

      const updated = updateRequirement(
        req.id,
        { status: 'implementing' },
        testProjectDir
      );

      expect(updated.status).toBe('implementing');
    });

    it('should throw error if requirement not found', () => {
      expect(() => {
        updateRequirement('REQ-999', { title: 'Test' }, testProjectDir);
      }).toThrow();
    });
  });

  describe('removeRequirement', () => {
    it('should delete requirement', () => {
      const req = addRequirement('To Delete', 'Desc', 'medium', testProjectDir);

      removeRequirement(req.id, testProjectDir);

      const data = readRequirements(testProjectDir);
      expect(data.requirements).toHaveLength(0);
    });

    it('should throw error if requirement not found', () => {
      expect(() => {
        removeRequirement('REQ-999', testProjectDir);
      }).toThrow();
    });
  });

  describe('addNote', () => {
    it('should add note to requirement', () => {
      const req = addRequirement('Test', 'Desc', 'medium', testProjectDir);

      addNote(req.id, 'Test note', testProjectDir);

      const data = readRequirements(testProjectDir);
      const updatedReq = data.requirements.find(r => r.id === req.id);

      expect(updatedReq?.notes).toBeDefined();
      expect(updatedReq?.notes).toHaveLength(1);
      expect(updatedReq?.notes?.[0].content).toBe('Test note');
    });
  });

  describe('addAcceptanceCriterion', () => {
    it('should add acceptance criterion', () => {
      const req = addRequirement('Test', 'Desc', 'medium', testProjectDir);

      addAcceptanceCriterion(req.id, 'User can login', testProjectDir);

      const data = readRequirements(testProjectDir);
      const updatedReq = data.requirements.find(r => r.id === req.id);

      expect(updatedReq?.acceptance).toBeDefined();
      expect(updatedReq?.acceptance).toHaveLength(1);
      expect(updatedReq?.acceptance?.[0].criterion).toBe('User can login');
      expect(updatedReq?.acceptance?.[0].done).toBe(false);
    });
  });
});
