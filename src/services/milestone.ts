import { readFileSync, writeFileSync } from 'node:fs';
import yaml from 'js-yaml';
import type {
  RequirementsData,
  Milestone,
  Requirement,
} from '../models/types.js';
import {
  readRequirements,
  writeRequirements,
} from './store.js';

export function createMilestone(
  name: string,
  dueDate?: string,
  cwd?: string
): Milestone {
  const data = readRequirements(cwd);
  if (!data.milestones) {
    data.milestones = [];
  }

  // Check for duplicate name
  if (data.milestones.some((m) => m.name === name)) {
    throw new Error(`Milestone "${name}" already exists`);
  }

  const milestone: Milestone = {
    name,
    requirements: [],
    status: 'planned',
    due_date: dueDate,
  };

  data.milestones.push(milestone);
  writeRequirements(data, cwd);
  return milestone;
}

export function removeMilestone(name: string, cwd?: string): void {
  const data = readRequirements(cwd);
  if (!data.milestones) {
    throw new Error(`Milestone "${name}" not found`);
  }

  const idx = data.milestones.findIndex((m) => m.name === name);
  if (idx === -1) {
    throw new Error(`Milestone "${name}" not found`);
  }

  data.milestones.splice(idx, 1);
  writeRequirements(data, cwd);
}

export function addRequirementToMilestone(
  milestoneName: string,
  reqId: string,
  cwd?: string
): Milestone {
  const data = readRequirements(cwd);
  if (!data.milestones) {
    throw new Error(`Milestone "${milestoneName}" not found`);
  }

  const milestone = data.milestones.find((m) => m.name === milestoneName);
  if (!milestone) {
    throw new Error(`Milestone "${milestoneName}" not found`);
  }

  const req = data.requirements.find((r) => r.id === reqId);
  if (!req) {
    throw new Error(`Requirement ${reqId} not found`);
  }

  if (milestone.requirements.includes(reqId)) {
    return milestone; // Already added
  }

  milestone.requirements.push(reqId);
  writeRequirements(data, cwd);
  return milestone;
}

export function removeRequirementFromMilestone(
  milestoneName: string,
  reqId: string,
  cwd?: string
): Milestone {
  const data = readRequirements(cwd);
  if (!data.milestones) {
    throw new Error(`Milestone "${milestoneName}" not found`);
  }

  const milestone = data.milestones.find((m) => m.name === milestoneName);
  if (!milestone) {
    throw new Error(`Milestone "${milestoneName}" not found`);
  }

  const idx = milestone.requirements.indexOf(reqId);
  if (idx === -1) {
    throw new Error(`${reqId} is not in milestone "${milestoneName}"`);
  }

  milestone.requirements.splice(idx, 1);
  writeRequirements(data, cwd);
  return milestone;
}

export function setMilestoneStatus(
  name: string,
  status: 'planned' | 'active' | 'completed',
  cwd?: string
): Milestone {
  const data = readRequirements(cwd);
  if (!data.milestones) {
    throw new Error(`Milestone "${name}" not found`);
  }

  const milestone = data.milestones.find((m) => m.name === name);
  if (!milestone) {
    throw new Error(`Milestone "${name}" not found`);
  }

  milestone.status = status;
  writeRequirements(data, cwd);
  return milestone;
}

export function listMilestones(cwd?: string): Milestone[] {
  const data = readRequirements(cwd);
  return data.milestones || [];
}

export function getMilestoneProgress(
  milestone: Milestone,
  requirements: Requirement[]
): {
  total: number;
  done: number;
  implementing: number;
  active: number;
  draft: number;
  percentage: number;
} {
  const milestoneReqs = requirements.filter((r) =>
    milestone.requirements.includes(r.id)
  );

  const done = milestoneReqs.filter((r) => r.status === 'done').length;
  const implementing = milestoneReqs.filter((r) => r.status === 'implementing').length;
  const active = milestoneReqs.filter((r) => r.status === 'active').length;
  const draft = milestoneReqs.filter((r) => r.status === 'draft').length;
  const total = milestoneReqs.length;
  const percentage = total === 0 ? 0 : Math.round((done / total) * 100);

  return {
    total,
    done,
    implementing,
    active,
    draft,
    percentage,
  };
}

export function getMilestonesWithProgress(cwd?: string): Array<{
  milestone: Milestone;
  progress: ReturnType<typeof getMilestoneProgress>;
}> {
  const data = readRequirements(cwd);
  const milestones = data.milestones || [];

  return milestones.map((milestone) => ({
    milestone,
    progress: getMilestoneProgress(milestone, data.requirements),
  }));
}
