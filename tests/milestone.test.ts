import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  writeProject,
  writeRequirements,
  addRequirement,
  updateRequirement,
} from '../src/services/store.js';
import {
  createMilestone,
  removeMilestone,
  addRequirementToMilestone,
  removeRequirementFromMilestone,
  setMilestoneStatus,
  listMilestones,
  getMilestoneProgress,
  getMilestonesWithProgress,
} from '../src/services/milestone.js';
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
  tmpDir = mkdtempSync(join(tmpdir(), 'ib-milestone-test-'));
  writeProject(makeProject(), tmpDir);
  writeRequirements({ requirements: [] }, tmpDir);
  // Add some test requirements
  addRequirement('Feature A', 'Description A', 'high', tmpDir);
  addRequirement('Feature B', 'Description B', 'medium', tmpDir);
  addRequirement('Feature C', 'Description C', 'low', tmpDir);
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('createMilestone', () => {
  it('creates a new milestone', () => {
    const milestone = createMilestone('v1.0.0', '2026-03-01', tmpDir);
    expect(milestone.name).toBe('v1.0.0');
    expect(milestone.due_date).toBe('2026-03-01');
    expect(milestone.status).toBe('planned');
    expect(milestone.requirements).toEqual([]);
  });

  it('creates milestone without due date', () => {
    const milestone = createMilestone('v1.0.0', undefined, tmpDir);
    expect(milestone.due_date).toBeUndefined();
  });

  it('throws on duplicate name', () => {
    createMilestone('v1.0.0', undefined, tmpDir);
    expect(() => createMilestone('v1.0.0', undefined, tmpDir)).toThrow('already exists');
  });
});

describe('removeMilestone', () => {
  it('removes a milestone', () => {
    createMilestone('v1.0.0', undefined, tmpDir);
    removeMilestone('v1.0.0', tmpDir);

    const milestones = listMilestones(tmpDir);
    expect(milestones).toHaveLength(0);
  });

  it('throws on non-existent milestone', () => {
    expect(() => removeMilestone('nonexistent', tmpDir)).toThrow('not found');
  });
});

describe('addRequirementToMilestone', () => {
  it('adds requirement to milestone', () => {
    createMilestone('v1.0.0', undefined, tmpDir);
    const milestone = addRequirementToMilestone('v1.0.0', 'REQ-001', tmpDir);

    expect(milestone.requirements).toEqual(['REQ-001']);
  });

  it('adds multiple requirements', () => {
    createMilestone('v1.0.0', undefined, tmpDir);
    addRequirementToMilestone('v1.0.0', 'REQ-001', tmpDir);
    addRequirementToMilestone('v1.0.0', 'REQ-002', tmpDir);

    const milestone = listMilestones(tmpDir)[0];
    expect(milestone.requirements).toEqual(['REQ-001', 'REQ-002']);
  });

  it('throws on non-existent milestone', () => {
    expect(() => addRequirementToMilestone('nonexistent', 'REQ-001', tmpDir)).toThrow('not found');
  });

  it('throws on non-existent requirement', () => {
    createMilestone('v1.0.0', undefined, tmpDir);
    expect(() => addRequirementToMilestone('v1.0.0', 'REQ-999', tmpDir)).toThrow('not found');
  });

  it('ignores duplicate requirement additions', () => {
    createMilestone('v1.0.0', undefined, tmpDir);
    addRequirementToMilestone('v1.0.0', 'REQ-001', tmpDir);
    const milestone = addRequirementToMilestone('v1.0.0', 'REQ-001', tmpDir);

    expect(milestone.requirements).toEqual(['REQ-001']);
  });
});

describe('removeRequirementFromMilestone', () => {
  it('removes requirement from milestone', () => {
    createMilestone('v1.0.0', undefined, tmpDir);
    addRequirementToMilestone('v1.0.0', 'REQ-001', tmpDir);
    const milestone = removeRequirementFromMilestone('v1.0.0', 'REQ-001', tmpDir);

    expect(milestone.requirements).toEqual([]);
  });

  it('throws on non-existent milestone', () => {
    expect(() => removeRequirementFromMilestone('nonexistent', 'REQ-001', tmpDir)).toThrow('not found');
  });

  it('throws when requirement not in milestone', () => {
    createMilestone('v1.0.0', undefined, tmpDir);
    expect(() => removeRequirementFromMilestone('v1.0.0', 'REQ-001', tmpDir)).toThrow('is not in milestone');
  });
});

describe('setMilestoneStatus', () => {
  it('sets milestone status to active', () => {
    createMilestone('v1.0.0', undefined, tmpDir);
    const milestone = setMilestoneStatus('v1.0.0', 'active', tmpDir);

    expect(milestone.status).toBe('active');
  });

  it('sets milestone status to completed', () => {
    createMilestone('v1.0.0', undefined, tmpDir);
    const milestone = setMilestoneStatus('v1.0.0', 'completed', tmpDir);

    expect(milestone.status).toBe('completed');
  });

  it('throws on non-existent milestone', () => {
    expect(() => setMilestoneStatus('nonexistent', 'active', tmpDir)).toThrow('not found');
  });
});

describe('listMilestones', () => {
  it('returns empty array when no milestones', () => {
    const milestones = listMilestones(tmpDir);
    expect(milestones).toEqual([]);
  });

  it('lists all milestones', () => {
    createMilestone('v1.0.0', undefined, tmpDir);
    createMilestone('v1.1.0', undefined, tmpDir);

    const milestones = listMilestones(tmpDir);
    expect(milestones).toHaveLength(2);
    expect(milestones[0].name).toBe('v1.0.0');
    expect(milestones[1].name).toBe('v1.1.0');
  });
});

describe('getMilestoneProgress', () => {
  it('calculates progress for empty milestone', () => {
    createMilestone('v1.0.0', undefined, tmpDir);
    const milestone = listMilestones(tmpDir)[0];

    const progress = getMilestoneProgress(milestone, []);
    expect(progress.total).toBe(0);
    expect(progress.percentage).toBe(0);
  });

  it('calculates progress with requirements', () => {
    createMilestone('v1.0.0', undefined, tmpDir);
    addRequirementToMilestone('v1.0.0', 'REQ-001', tmpDir);
    addRequirementToMilestone('v1.0.0', 'REQ-002', tmpDir);
    addRequirementToMilestone('v1.0.0', 'REQ-003', tmpDir);

    updateRequirement('REQ-001', { status: 'done' }, tmpDir);
    updateRequirement('REQ-002', { status: 'implementing' }, tmpDir);

    const milestone = listMilestones(tmpDir)[0];
    const progress = getMilestoneProgress(milestone, [
      { id: 'REQ-001', status: 'done' } as any,
      { id: 'REQ-002', status: 'implementing' } as any,
      { id: 'REQ-003', status: 'draft' } as any,
    ]);

    expect(progress.total).toBe(3);
    expect(progress.done).toBe(1);
    expect(progress.implementing).toBe(1);
    expect(progress.active).toBe(0);
    expect(progress.draft).toBe(1);
    expect(progress.percentage).toBe(33);
  });
});

describe('getMilestonesWithProgress', () => {
  it('returns empty array when no milestones', () => {
    const result = getMilestonesWithProgress(tmpDir);
    expect(result).toEqual([]);
  });

  it('returns milestones with progress', () => {
    createMilestone('v1.0.0', undefined, tmpDir);
    addRequirementToMilestone('v1.0.0', 'REQ-001', tmpDir);
    addRequirementToMilestone('v1.0.0', 'REQ-002', tmpDir);

    updateRequirement('REQ-001', { status: 'done' }, tmpDir);

    const result = getMilestonesWithProgress(tmpDir);
    expect(result).toHaveLength(1);
    expect(result[0].milestone.name).toBe('v1.0.0');
    expect(result[0].progress.total).toBe(2);
    expect(result[0].progress.done).toBe(1);
  });
});
