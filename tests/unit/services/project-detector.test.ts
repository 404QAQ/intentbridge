import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  detectCurrentProject,
  findIntentBridgeDir,
  resolveProjectContext,
} from '../../src/services/project-detector';
import {
  createTestProject,
  cleanupTestProject,
} from '../helpers/test-utils';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';

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
