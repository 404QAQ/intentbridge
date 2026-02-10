import { readRequirements } from './store.js';
import type { RequirementsData, Requirement } from '../models/types.js';

interface ExportJson {
  generated: string;
  summary: {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  };
  requirements: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    created: string;
    tags?: string[];
    depends_on?: string[];
    acceptance?: Array<{ criterion: string; done: boolean }>;
    notes?: Array<{ date: string; content: string }>;
    files: string[];
  }>;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: '草稿',
    active: '活跃',
    implementing: '进行中',
    done: '已完成',
  };
  return labels[status] || status;
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低',
  };
  return labels[priority] || priority;
}

export function exportMarkdown(cwd?: string): string {
  const data = readRequirements(cwd);

  // Group by status
  const byStatus: Record<string, Requirement[]> = {
    draft: [],
    active: [],
    implementing: [],
    done: [],
  };

  for (const req of data.requirements) {
    byStatus[req.status].push(req);
  }

  const lines: string[] = [];

  // Header
  lines.push('# 项目需求报告');
  lines.push('');
  lines.push(`生成时间: ${new Date().toISOString().split('T')[0]}`);
  lines.push('');

  // Summary
  lines.push('## 概述');
  lines.push('');
  lines.push(`- 总需求: ${data.requirements.length}`);
  lines.push(`- 已完成: ${byStatus.done.length}`);
  lines.push(`- 进行中: ${byStatus.implementing.length}`);
  lines.push(`- 活跃: ${byStatus.active.length}`);
  lines.push(`- 草稿: ${byStatus.draft.length}`);
  lines.push('');

  // Sections by status
  if (byStatus.implementing.length > 0) {
    lines.push(`## 进行中 (${byStatus.implementing.length})`);
    lines.push('');
    for (const req of byStatus.implementing) {
      renderRequirementMd(lines, req);
    }
  }

  if (byStatus.active.length > 0) {
    lines.push(`## 活跃 (${byStatus.active.length})`);
    lines.push('');
    for (const req of byStatus.active) {
      renderRequirementMd(lines, req);
    }
  }

  if (byStatus.draft.length > 0) {
    lines.push(`## 草稿 (${byStatus.draft.length})`);
    lines.push('');
    for (const req of byStatus.draft) {
      renderRequirementMd(lines, req);
    }
  }

  if (byStatus.done.length > 0) {
    lines.push(`## 已完成 (${byStatus.done.length})`);
    lines.push('');
    for (const req of byStatus.done) {
      renderRequirementMd(lines, req);
    }
  }

  return lines.join('\n');
}

function renderRequirementMd(lines: string[], req: Requirement): void {
  lines.push(`### ${req.id} ${req.title}`);
  lines.push('');

  // Metadata line
  const meta: string[] = [
    `状态: ${getStatusLabel(req.status)}`,
    `优先级: ${getPriorityLabel(req.priority)}`,
  ];
  if (req.tags && req.tags.length > 0) {
    meta.push(`标签: ${req.tags.join(', ')}`);
  }
  if (req.depends_on && req.depends_on.length > 0) {
    meta.push(`依赖: ${req.depends_on.join(', ')}`);
  }
  lines.push(meta.join(' | '));
  lines.push('');

  // Description
  if (req.description) {
    lines.push(req.description);
    lines.push('');
  }

  // Acceptance criteria
  if (req.acceptance && req.acceptance.length > 0) {
    lines.push('验收条件:');
    for (const ac of req.acceptance) {
      lines.push(`- [${ac.done ? 'x' : ' '}] ${ac.criterion}`);
    }
    lines.push('');
  }

  // Notes
  if (req.notes && req.notes.length > 0) {
    lines.push('决策记录:');
    for (const note of req.notes) {
      lines.push(`- [${note.date}] ${note.content}`);
    }
    lines.push('');
  }

  // Files
  if (req.files.length > 0) {
    lines.push(`相关文件: ${req.files.join(', ')}`);
    lines.push('');
  }

  lines.push('---');
  lines.push('');
}

export function exportJson(cwd?: string): string {
  const data = readRequirements(cwd);

  // Calculate summary
  const byStatus: Record<string, number> = {
    draft: 0,
    active: 0,
    implementing: 0,
    done: 0,
  };
  const byPriority: Record<string, number> = {
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const req of data.requirements) {
    byStatus[req.status]++;
    byPriority[req.priority]++;
  }

  const exportData: ExportJson = {
    generated: new Date().toISOString(),
    summary: {
      total: data.requirements.length,
      byStatus,
      byPriority,
    },
    requirements: data.requirements.map((req) => ({
      id: req.id,
      title: req.title,
      description: req.description,
      status: req.status,
      priority: req.priority,
      created: req.created,
      tags: req.tags,
      depends_on: req.depends_on,
      acceptance: req.acceptance,
      notes: req.notes,
      files: req.files,
    })),
  };

  return JSON.stringify(exportData, null, 2);
}

export function exportRequirements(format: 'markdown' | 'json', cwd?: string): string {
  if (format === 'json') {
    return exportJson(cwd);
  }
  return exportMarkdown(cwd);
}
