import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeProject, writeRequirements } from '../src/services/store.js';
import { loadTemplate, listTemplates, applyTemplate, getTemplateVariables } from '../src/services/template.js';
import type { ProjectConfig } from '../src/models/types.js';

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
  tmpDir = mkdtempSync(join(tmpdir(), 'ib-template-test-'));
  writeProject(makeProject(), tmpDir);
  writeRequirements({ requirements: [] }, tmpDir);
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('loadTemplate', () => {
  it('loads crud template', () => {
    const template = loadTemplate('crud');
    expect(template).not.toBeNull();
    expect(template?.title).toBe('CRUD {资源名}');
    expect(template?.tags).toEqual(['backend', 'database']);
    expect(template?.acceptance).toHaveLength(5);
  });

  it('loads auth template', () => {
    const template = loadTemplate('auth');
    expect(template).not.toBeNull();
    expect(template?.title).toBe('认证授权');
    expect(template?.tags).toContain('security');
    expect(template?.acceptance).toHaveLength(6);
  });

  it('loads api template', () => {
    const template = loadTemplate('api');
    expect(template).not.toBeNull();
    expect(template?.title).toBe('API {功能名}');
  });

  it('loads ui template', () => {
    const template = loadTemplate('ui');
    expect(template).not.toBeNull();
    expect(template?.title).toBe('UI {页面名}');
  });

  it('loads database template', () => {
    const template = loadTemplate('database');
    expect(template).not.toBeNull();
    expect(template?.title).toBe('数据库 {表名} 迁移');
  });

  it('returns null for non-existent template', () => {
    const template = loadTemplate('nonexistent');
    expect(template).toBeNull();
  });
});

describe('listTemplates', () => {
  it('lists all available templates', () => {
    const templates = listTemplates();
    expect(templates.size).toBeGreaterThanOrEqual(5);
    expect(templates.has('crud')).toBe(true);
    expect(templates.has('auth')).toBe(true);
    expect(templates.has('api')).toBe(true);
    expect(templates.has('ui')).toBe(true);
    expect(templates.has('database')).toBe(true);
  });

  it('includes template descriptions', () => {
    const templates = listTemplates();
    const crud = templates.get('crud');
    expect(crud?.description).toContain('增删改查');
  });
});

describe('getTemplateVariables', () => {
  it('extracts variables from crud template', () => {
    const template = loadTemplate('crud')!;
    const variables = getTemplateVariables(template);
    expect(variables).toEqual(['资源名']);
  });

  it('extracts variables from api template', () => {
    const template = loadTemplate('api')!;
    const variables = getTemplateVariables(template);
    expect(variables).toContain('功能名');
    expect(variables).toContain('资源');
  });

  it('returns empty array for templates without variables', () => {
    const template = loadTemplate('auth')!;
    const variables = getTemplateVariables(template);
    expect(variables).toEqual([]);
  });
});

describe('applyTemplate', () => {
  it('applies crud template with variables', () => {
    const template = loadTemplate('crud')!;
    const result = applyTemplate(template, { 资源名: '用户' });

    expect(result.title).toBe('CRUD 用户');
    expect(result.description).toContain('用户');
    expect(result.acceptance[0].criterion).toContain('用户');
    expect(result.tags).toEqual(['backend', 'database']);
  });

  it('applies ui template with variables', () => {
    const template = loadTemplate('ui')!;
    const result = applyTemplate(template, { 页面名: '登录页' });

    expect(result.title).toBe('UI 登录页');
    expect(result.description).toContain('登录页');
    expect(result.tags).toContain('ui');
  });

  it('replaces multiple variables in api template', () => {
    const template = loadTemplate('api')!;
    const result = applyTemplate(template, { 功能名: '用户管理', 资源: 'users' });

    expect(result.title).toBe('API 用户管理');
    expect(result.description).toContain('用户管理');
    expect(result.acceptance[0].criterion).toContain('users');
  });

  it('preserves acceptance criteria done status', () => {
    const template = loadTemplate('crud')!;
    template.acceptance[0].done = true;

    const result = applyTemplate(template, { 资源名: '产品' });
    expect(result.acceptance[0].done).toBe(true);
    expect(result.acceptance[1].done).toBe(false);
  });
});
