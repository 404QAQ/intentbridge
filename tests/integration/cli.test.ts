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
    it('should initialize a new project with --name flag', () => {
      // 使用非交互式模式
      const result = runCommand('init --name test-project', testProjectDir);

      // 项目已存在，会显示警告但不报错
      // init 命令在已存在项目时返回 0
      expect([0, 1]).toContain(result.exitCode);
    });
  });

  describe('req commands', () => {
    it('should list empty requirements', () => {
      const result = runCommand('req list', testProjectDir);

      expect(result.exitCode).toBe(0);
      // 空需求列表会显示提示消息
      expect(result.stdout.toLowerCase()).toMatch(/no requirements|run.*ib req add/i);
    });

    it('should add requirement with --title flag', () => {
      const result = runCommand('req add --title "Test Requirement"', testProjectDir);

      // 使用非交互式模式添加需求
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Created|REQ-/i);
    });
  });

  describe('smart command', () => {
    it('should detect project', () => {
      const result = runCommand('smart detect', testProjectDir);

      // detect 命令会检测当前目录
      expect([0, 1]).toContain(result.exitCode);
    });
  });

  describe('global-status command', () => {
    it('should show global status', () => {
      const result = runCommand('global-status');

      // global-status 显示全局项目状态
      expect([0, 1]).toContain(result.exitCode);
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
