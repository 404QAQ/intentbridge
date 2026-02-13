import { describe, it, expect } from '@jest/globals';
import {
  parseUserIntent,
  validateIntent,
} from '../../src/services/nlp-router';

describe('NLP Router', () => {
  describe('parseUserIntent (rule-based)', () => {
    it('should parse add requirement intent', async () => {
      const intent = await parseUserIntent('在 project-a 添加用户认证需求');

      expect(intent.action).toBe('add');
      expect(intent.targetType).toBe('requirement');
      expect(intent.projectName).toBe('project-a');
    });

    it('should parse list requirements intent', async () => {
      const intent = await parseUserIntent('查看 project-a 的需求');

      expect(intent.action).toBe('list');
      expect(intent.targetType).toBe('requirement');
    });

    it('should parse update status intent', async () => {
      const intent = await parseUserIntent('更新 REQ-001 状态为 done');

      expect(intent.action).toBe('update');
      expect(intent.targetType).toBe('requirement');
      expect(intent.params.requirementId).toBe('REQ-001');
      expect(intent.params.status).toBe('done');
    });

    it('should parse search intent', async () => {
      const intent = await parseUserIntent('搜索认证相关需求');

      expect(intent.action).toBe('search');
      expect(intent.targetType).toBe('requirement');
      expect(intent.params.keyword).toBeDefined();
    });

    it('should parse view project status intent', async () => {
      const intent = await parseUserIntent('查看 project-b 的进度');

      expect(intent.action).toBe('status');
      expect(intent.targetType).toBe('project');
      expect(intent.projectName).toBe('project-b');
    });

    it('should extract requirement ID from prompt', async () => {
      const intent = await parseUserIntent('更新 REQ-005 状态');

      expect(intent.params.requirementId).toBe('REQ-005');
    });

    it('should extract title from add command', async () => {
      const intent = await parseUserIntent('添加用户登录需求');

      expect(intent.params.title).toContain('用户登录');
    });
  });

  describe('validateIntent', () => {
    it('should validate add requirement intent', () => {
      const intent = {
        action: 'add' as const,
        targetType: 'requirement' as const,
        params: { title: 'Test' },
        originalPrompt: 'test',
      };

      const result = validateIntent(intent);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should invalidate add requirement without title', () => {
      const intent = {
        action: 'add' as const,
        targetType: 'requirement' as const,
        params: {},
        originalPrompt: 'test',
      };

      const result = validateIntent(intent);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate update requirement intent with ID', () => {
      const intent = {
        action: 'update' as const,
        targetType: 'requirement' as const,
        params: { requirementId: 'REQ-001', status: 'done' },
        originalPrompt: 'test',
      };

      const result = validateIntent(intent);

      expect(result.valid).toBe(true);
    });

    it('should invalidate update without requirement ID', () => {
      const intent = {
        action: 'update' as const,
        targetType: 'requirement' as const,
        params: { status: 'done' },
        originalPrompt: 'test',
      };

      const result = validateIntent(intent);

      expect(result.valid).toBe(false);
    });

    it('should validate search intent with keyword', () => {
      const intent = {
        action: 'search' as const,
        targetType: 'requirement' as const,
        params: { keyword: '认证' },
        originalPrompt: 'test',
      };

      const result = validateIntent(intent);

      expect(result.valid).toBe(true);
    });

    it('should invalidate invalid action', () => {
      const intent = {
        action: 'invalid' as any,
        targetType: 'requirement' as const,
        params: {},
        originalPrompt: 'test',
      };

      const result = validateIntent(intent);

      expect(result.valid).toBe(false);
    });
  });
});
