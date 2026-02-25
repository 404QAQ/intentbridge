/**
 * 智能路由器测试
 */

import { describe, it, expect } from '@jest/globals';
import { SmartRouter } from '../src/services/smart-router.js';

describe('SmartRouter', () => {
  const router = new SmartRouter();

  describe('自然语言解析', () => {
    it('should parse "添加用户登录功能"', () => {
      const result = router.parse('添加用户登录功能');
      expect(result.command).toBe('req');
      expect(result.action).toBe('add');
    });

    it('should parse "查看所有需求"', () => {
      const result = router.parse('查看所有需求');
      expect(result.command).toBe('req');
      expect(result.action).toBe('list');
    });

    it('should parse "完成 REQ-001"', () => {
      const result = router.parse('完成 REQ-001');
      expect(result.command).toBe('req');
      expect(result.action).toBe('update');
    });

    it('should parse "启动 my-project"', () => {
      const result = router.parse('启动 my-project');
      expect(result.command).toBe('project');
      expect(result.action).toBe('start');
    });

    it('should parse "停止 my-project"', () => {
      const result = router.parse('停止 my-project');
      expect(result.command).toBe('project');
      expect(result.action).toBe('stop');
    });

    it('should parse "打开网页"', () => {
      const result = router.parse('打开网页');
      expect(result.command).toBe('web');
      expect(result.action).toBe('start');
    });
  });

  describe('短命令解析', () => {
    it('should parse "add 登录功能"', () => {
      const result = router.parse('add 登录功能');
      expect(result.command).toBe('req');
      expect(result.action).toBe('add');
    });

    it('should parse "ls"', () => {
      const result = router.parse('ls');
      expect(result.command).toBe('req');
      expect(result.action).toBe('list');
    });

    it('should parse "done REQ-001"', () => {
      const result = router.parse('done REQ-001');
      expect(result.command).toBe('req');
      expect(result.action).toBe('update');
    });

    it('should parse "start my-project"', () => {
      const result = router.parse('start my-project');
      expect(result.command).toBe('project');
      expect(result.action).toBe('start');
    });

    it('should parse "stop my-project"', () => {
      const result = router.parse('stop my-project');
      expect(result.command).toBe('project');
      expect(result.action).toBe('stop');
    });

    it('should parse "web"', () => {
      const result = router.parse('web');
      expect(result.command).toBe('web');
      expect(result.action).toBe('start');
    });

    it('should parse "ps"', () => {
      const result = router.parse('ps');
      expect(result.command).toBe('project');
      expect(result.action).toBe('ps');
    });
  });

  describe('getHelp', () => {
    it('should return help text', () => {
      const help = SmartRouter.getHelp();
      expect(help).toContain('智能命令帮助');
      expect(help).toContain('add');
      expect(help).toContain('ls');
    });
  });
});
