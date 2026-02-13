import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  createTestProject,
  cleanupTestProject,
  runCommand,
} from '../helpers/test-utils';

describe('CLI Integration Tests', () => {
  let testProjectDir: string;

  beforeEach(() => {
    testProjectDir = createTestProject('cli-test');
  });

  afterEach(() => {
    cleanupTestProject('cli-test');
  });

  describe('init command', () => {
    it('should initialize a new project', () => {
      const result = runCommand('init', testProjectDir);

      // Should complete without error
      expect(result.exitCode).toBe(0);
    });
  });

  describe('req commands', () => {
    it('should list empty requirements', () => {
      const result = runCommand('req list', testProjectDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Requirements');
    });

    it('should fail to add requirement without title', () => {
      const result = runCommand('req add', testProjectDir);

      // Should fail or prompt for input
      expect(result.exitCode).not.toBe(0);
    });
  });

  describe('detect command', () => {
    it('should detect project', () => {
      const result = runCommand('detect', testProjectDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Detected Project');
      expect(result.stdout).toContain('cli-test');
    });
  });

  describe('global-status command', () => {
    it('should show global status', () => {
      const result = runCommand('global-status');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Global Project Overview');
    });
  });

  describe('project list command', () => {
    it('should list projects', () => {
      const result = runCommand('project list');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Registered Projects');
    });
  });
});
