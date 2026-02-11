import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readRequirements } from './store.js';
import { getClaudeMdPath, getIntentBridgeDir } from '../utils/paths.js';
import type { RequirementsData, Requirement, Milestone } from '../models/types.js';

export interface UnderstandingOptions {
  includeDecisions?: boolean;
  includeAcceptance?: boolean;
  includeDependencies?: boolean;
  includeCodeMapping?: boolean;
}

export function generateRequirementUnderstanding(
  requirement: Requirement,
  allRequirements: Requirement[],
  options: UnderstandingOptions = {},
  cwd?: string
): string {
  const {
    includeDecisions = true,
    includeAcceptance = true,
    includeDependencies = true,
    includeCodeMapping = true,
  } = options;

  const lines: string[] = [];

  // Header
  lines.push(`# ${requirement.id}: ${requirement.title}`);
  lines.push('');

  // Goal (from description)
  lines.push('## 目标');
  lines.push(requirement.description || '无描述');
  lines.push('');

  // Status & Priority
  const statusLabel =
    requirement.status === 'done' ? '✅ 已完成' :
    requirement.status === 'implementing' ? '🔨 进行中' :
    requirement.status === 'active' ? '🚀 活跃' :
    '📝 草稿';
  const priorityLabel =
    requirement.priority === 'high' ? '🔴 高' :
    requirement.priority === 'medium' ? '🟡 中' :
    '🟢 低';
  lines.push(`**状态**: ${statusLabel} | **优先级**: ${priorityLabel}`);
  lines.push('');

  // Constraints (extracted from description or separate field)
  const constraints = extractConstraints(requirement);
  if (constraints.length > 0) {
    lines.push('## 约束');
    for (const constraint of constraints) {
      lines.push(`- ${constraint}`);
    }
    lines.push('');
  }

  // Decisions
  if (includeDecisions && requirement.notes && requirement.notes.length > 0) {
    lines.push('## 决策记录');
    for (const note of requirement.notes) {
      lines.push(`- **[${note.date}]** ${note.content}`);
    }
    lines.push('');
  }

  // Acceptance Criteria
  if (includeAcceptance && requirement.acceptance && requirement.acceptance.length > 0) {
    const doneCount = requirement.acceptance.filter((a) => a.done).length;
    lines.push(`## 验收条件 (${doneCount}/${requirement.acceptance.length} 完成)`);
    for (let i = 0; i < requirement.acceptance.length; i++) {
      const ac = requirement.acceptance[i];
      const status = ac.done ? '✅' : '⬜';
      lines.push(`${status} **${i}**. ${ac.criterion}`);
    }
    lines.push('');
  }

  // Code Mapping
  if (includeCodeMapping && requirement.files && requirement.files.length > 0) {
    lines.push('## 代码映射');
    for (const file of requirement.files) {
      lines.push(`- \`${file}\``);
    }
    lines.push('');
  }

  // Tags
  if (requirement.tags && requirement.tags.length > 0) {
    lines.push('## 标签');
    lines.push(requirement.tags.map((t) => `\`${t}\``).join(', '));
    lines.push('');
  }

  // Dependencies
  if (includeDependencies && requirement.depends_on && requirement.depends_on.length > 0) {
    lines.push('## 依赖关系');
    lines.push('**依赖于**:');
    for (const depId of requirement.depends_on) {
      const dep = allRequirements.find((r) => r.id === depId);
      if (dep) {
        lines.push(`- ${dep.id} — ${dep.title} ${dep.status === 'done' ? '✅' : ''}`);
      } else {
        lines.push(`- ${depId} (未找到)`);
      }
    }
    lines.push('');

    // Find reverse dependencies
    const dependents = allRequirements.filter((r) =>
      r.depends_on?.includes(requirement.id)
    );
    if (dependents.length > 0) {
      lines.push('**被依赖于**:');
      for (const dep of dependents) {
        lines.push(`- ${dep.id} — ${dep.title}`);
      }
      lines.push('');
    }
  }

  // Milestone
  const milestones = getRequirementMilestone(requirement.id, cwd);
  if (milestones.length > 0) {
    lines.push('## 所属里程碑');
    for (const ms of milestones) {
      const statusIcon =
        ms.status === 'completed' ? '✅' :
        ms.status === 'active' ? '▶️' :
        '☐';
      lines.push(`- ${statusIcon} ${ms.name}${ms.due_date ? ` — 📅 ${ms.due_date}` : ''}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function extractConstraints(requirement: Requirement): string[] {
  const constraints: string[] = [];
  const text = requirement.description.toLowerCase();

  // Common constraint patterns
  const constraintPatterns = [
    { pattern: /必须|必须使用|mandatory|required/gi, label: '强制性要求' },
    { pattern: /不超过|限制|最大|最少|至少/gi, label: '量化约束' },
    { pattern: /支持|兼容|兼容性/gi, label: '兼容性要求' },
    { pattern: /性能|响应|延迟/gi, label: '性能约束' },
    { pattern: /安全|加密|认证/gi, label: '安全约束' },
  ];

  // Simple extraction - in future, could use AI for better extraction
  if (text.includes('jwt') || text.includes('token')) {
    constraints.push('使用 JWT 进行认证');
  }
  if (text.includes('跨域') || text.includes('cors')) {
    constraints.push('支持跨域访问');
  }

  return constraints;
}

function getRequirementMilestone(reqId: string, cwd?: string): Milestone[] {
  const data = readRequirements(cwd);
  if (!data.milestones) return [];

  return data.milestones.filter((ms) => ms.requirements.includes(reqId));
}

export function writeUnderstandingDocument(
  reqId: string,
  content: string,
  cwd?: string
): void {
  const dir = join(getIntentBridgeDir(cwd), 'understanding');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const filePath = join(dir, `${reqId}.md`);
  writeFileSync(filePath, content, 'utf-8');
}

export function generateAllUnderstandingDocuments(
  cwd?: string,
  options?: UnderstandingOptions
): { reqId: string; success: boolean; error?: string }[] {
  const data = readRequirements(cwd);
  const results: { reqId: string; success: boolean; error?: string }[] = [];

  for (const req of data.requirements) {
    try {
      const understanding = generateRequirementUnderstanding(req, data.requirements, options, cwd);
      writeUnderstandingDocument(req.id, understanding, cwd);
      results.push({ reqId: req.id, success: true });
    } catch (e: any) {
      results.push({ reqId: req.id, success: false, error: e.message });
    }
  }

  return results;
}

export function readUnderstandingDocument(reqId: string, cwd?: string): string | null {
  const filePath = join(getIntentBridgeDir(cwd), 'understanding', `${reqId}.md`);
  if (!existsSync(filePath)) {
    return null;
  }

  return readFileSync(filePath, 'utf-8');
}

/**
 * Generate a compact explanation for terminal output
 */
export function generateCompactExplanation(
  reqId: string,
  cwd?: string,
  options: { format?: 'text' | 'json' } = {}
): string {
  const data = readRequirements(cwd);
  const req = data.requirements.find((r) => r.id === reqId);
  if (!req) {
    throw new Error(`Requirement ${reqId} not found`);
  }

  if (options.format === 'json') {
    return JSON.stringify({
      id: req.id,
      title: req.title,
      description: req.description,
      status: req.status,
      priority: req.priority,
      tags: req.tags || [],
      files: req.files || [],
      acceptance: req.acceptance || [],
      notes: req.notes || [],
      depends_on: req.depends_on || [],
    }, null, 2);
  }

  // Text format - compact for terminal
  const lines: string[] = [];
  lines.push(`📋 ${req.id}: ${req.title}`);
  lines.push('');

  if (req.description) {
    lines.push(`目标: ${req.description}`);
    lines.push('');
  }

  const statusLabel =
    req.status === 'done' ? '✅ 已完成' :
    req.status === 'implementing' ? '🔨 进行中' :
    req.status === 'active' ? '🚀 活跃' :
    '📝 草稿';
  lines.push(`状态: ${statusLabel} | 优先级: ${req.priority}`);

  if (req.tags && req.tags.length > 0) {
    lines.push(`标签: ${req.tags.join(', ')}`);
  }

  if (req.acceptance && req.acceptance.length > 0) {
    const doneCount = req.acceptance.filter((a) => a.done).length;
    lines.push(`验收: ${doneCount}/${req.acceptance.length} 完成`);
  }

  if (req.files && req.files.length > 0) {
    lines.push(`代码: ${req.files.length} 个文件`);
  }

  if (req.notes && req.notes.length > 0) {
    lines.push(`决策: ${req.notes.length} 条记录`);
  }

  if (req.depends_on && req.depends_on.length > 0) {
    lines.push(`依赖: ${req.depends_on.join(', ')}`);
  }

  lines.push('');
  lines.push(`💡 运行 \`ib gen-understanding ${reqId}\` 生成详细文档`);

  return lines.join('\n');
}
