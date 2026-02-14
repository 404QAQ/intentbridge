import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  detectCurrentProject,
  findIntentBridgeDir,
  resolveProjectContext,
} from '../../../src/services/project-detector';
import { join } from 'node:path';
import { mkdirSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

  return testDir;
}

function cleanupTestProject(testDir: string): void {
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
}

describe('ProjectDetector', () => {
  let testProjectDir: string;

  beforeEach(() => {
    testProjectDir = createTestProject('detector-test');
  });

  afterEach(() => {
    cleanupTestProject('detector-test');
  });

  describe('detectCurrentProject', () => {
    it('should detect project in current directory', () => {
      const project = detectCurrentProject(testProjectDir);

      expect(project).toBeDefined();
      expect(project?.path).toBe(testProjectDir);
    });

    it('should detect project from subdirectory', () => {
      const subDir = join(testProjectDir, 'src', 'components');
      mkdirSync(subDir, { recursive: true });

      const project = detectCurrentProject(subDir);

      expect(project).toBeDefined();
      expect(project?.path).toBe(testProjectDir);
    });

    it('should return null if no project found', () => {
      const noProjectDir = join(globalThis.TEST_DIR, 'no-project');
      mkdirSync(noProjectDir, { recursive: true });

      const project = detectCurrentProject(noProjectDir);

      expect(project).toBeNull();
    });
  });

  describe('findIntentBridgeDir', () => {
    it('should find .intentbridge in current directory', () => {
      const intentDir = findIntentBridgeDir(testProjectDir);

      expect(intentDir).toBeDefined();
      expect(intentDir).toBe(join(testProjectDir, '.intentbridge'));
    });

    it('should find .intentbridge by traversing up', () => {
      const subDir = join(testProjectDir, 'src', 'components', 'Button');
      mkdirSync(subDir, { recursive: true });

      const intentDir = findIntentBridgeDir(subDir);

      expect(intentDir).toBeDefined();
      expect(intentDir).toBe(join(testProjectDir, '.intentbridge'));
    });

    it('should return null if .intentbridge not found', () => {
      const noProjectDir = join(globalThis.TEST_DIR, 'no-project');
      mkdirSync(noProjectDir, { recursive: true });

      const intentDir = findIntentBridgeDir(noProjectDir);

      expect(intentDir).toBeNull();
    });
  });

  describe('resolveProjectContext', () => {
    it('should resolve project by path', () => {
      const context = resolveProjectContext(undefined, testProjectDir);

      expect(context.project).toBeDefined();
      expect(context.project?.path).toBe(testProjectDir);
      expect(context.needsRegistration).toBe(false);
    });
  });
});
