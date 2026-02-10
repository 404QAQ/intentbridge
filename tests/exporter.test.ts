import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeProject, writeRequirements, addRequirement, addTag, addNote, addAcceptanceCriterion, acceptCriterion, updateRequirement } from '../src/services/store.js';
import { exportRequirements } from '../src/services/exporter.js';
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
  tmpDir = mkdtempSync(join(tmpdir(), 'ib-export-test-'));
  writeProject(makeProject(), tmpDir);
  writeRequirements({ requirements: [] }, tmpDir);
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('export markdown', () => {
  it('exports empty requirements', () => {
    const md = exportRequirements('markdown', tmpDir);
    expect(md).toContain('# 项目需求报告');
    expect(md).toContain('总需求: 0');
  });

  it('exports requirements grouped by status', () => {
    addRequirement('Feature A', 'Description A', 'high', tmpDir);
    addRequirement('Feature B', 'Description B', 'medium', tmpDir);
    addRequirement('Feature C', 'Description C', 'low', tmpDir);

    updateRequirement('REQ-001', { status: 'implementing' }, tmpDir);
    updateRequirement('REQ-002', { status: 'active' }, tmpDir);
    updateRequirement('REQ-003', { status: 'done' }, tmpDir);

    const md = exportRequirements('markdown', tmpDir);
    expect(md).toContain('## 进行中 (1)');
    expect(md).toContain('## 活跃 (1)');
    expect(md).toContain('## 已完成 (1)');
    expect(md).toContain('REQ-001');
    expect(md).toContain('Feature A');
  });

  it('includes tags in export', () => {
    addRequirement('Feature', 'Description', 'high', tmpDir);
    addTag('REQ-001', 'frontend', tmpDir);
    addTag('REQ-001', 'backend', tmpDir);

    const md = exportRequirements('markdown', tmpDir);
    expect(md).toContain('标签: frontend, backend');
  });

  it('includes acceptance criteria', () => {
    addRequirement('Feature', 'Description', 'high', tmpDir);
    addAcceptanceCriterion('REQ-001', 'Criterion 1', tmpDir);
    addAcceptanceCriterion('REQ-001', 'Criterion 2', tmpDir);
    acceptCriterion('REQ-001', 0, tmpDir);

    const md = exportRequirements('markdown', tmpDir);
    expect(md).toContain('验收条件:');
    expect(md).toContain('- [x] Criterion 1');
    expect(md).toContain('- [ ] Criterion 2');
  });

  it('includes decision notes', () => {
    addRequirement('Feature', 'Description', 'high', tmpDir);
    addNote('REQ-001', 'Decision 1', tmpDir);
    addNote('REQ-001', 'Decision 2', tmpDir);

    const md = exportRequirements('markdown', tmpDir);
    expect(md).toContain('决策记录:');
    expect(md).toContain('- [');
    expect(md).toContain('Decision 1');
    expect(md).toContain('Decision 2');
  });

  it('translates status and priority labels', () => {
    addRequirement('Feature', 'Description', 'high', tmpDir);

    const md = exportRequirements('markdown', tmpDir);
    expect(md).toContain('状态: 草稿');
    expect(md).toContain('优先级: 高');
  });
});

describe('export json', () => {
  it('exports empty requirements', () => {
    const json = exportRequirements('json', tmpDir);
    const data = JSON.parse(json);

    expect(data.generated).toBeDefined();
    expect(data.summary.total).toBe(0);
    expect(data.requirements).toEqual([]);
  });

  it('exports all requirement data', () => {
    addRequirement('Feature A', 'Description A', 'high', tmpDir);
    addTag('REQ-001', 'frontend', tmpDir);
    addNote('REQ-001', 'Decision', tmpDir);
    addAcceptanceCriterion('REQ-001', 'Criterion', tmpDir);

    const json = exportRequirements('json', tmpDir);
    const data = JSON.parse(json);

    expect(data.summary.total).toBe(1);
    expect(data.summary.byStatus.draft).toBe(1);
    expect(data.summary.byPriority.high).toBe(1);
    expect(data.requirements).toHaveLength(1);
    expect(data.requirements[0].id).toBe('REQ-001');
    expect(data.requirements[0].title).toBe('Feature A');
    expect(data.requirements[0].tags).toEqual(['frontend']);
    expect(data.requirements[0].notes).toHaveLength(1);
    expect(data.requirements[0].acceptance).toHaveLength(1);
  });

  it('counts by status and priority', () => {
    addRequirement('Feature A', 'Description A', 'high', tmpDir);
    addRequirement('Feature B', 'Description B', 'medium', tmpDir);
    addRequirement('Feature C', 'Description C', 'low', tmpDir);

    updateRequirement('REQ-001', { status: 'implementing' }, tmpDir);
    updateRequirement('REQ-002', { status: 'active' }, tmpDir);
    updateRequirement('REQ-003', { status: 'done' }, tmpDir);

    const json = exportRequirements('json', tmpDir);
    const data = JSON.parse(json);

    expect(data.summary.byStatus.implementing).toBe(1);
    expect(data.summary.byStatus.active).toBe(1);
    expect(data.summary.byStatus.done).toBe(1);
    expect(data.summary.byPriority.high).toBe(1);
    expect(data.summary.byPriority.medium).toBe(1);
    expect(data.summary.byPriority.low).toBe(1);
  });

  it('generates valid ISO timestamp', () => {
    const json = exportRequirements('json', tmpDir);
    const data = JSON.parse(json);

    expect(() => new Date(data.generated)).not.toThrow();
    expect(data.generated).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
