import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import type { ProjectConfig, RequirementsData, Requirement } from '../models/types.js';
import { readProject, readRequirements } from './store.js';
import { getClaudeMdPath } from '../utils/paths.js';

const START_MARKER = '<!-- INTENTBRIDGE:START - 此区块由 IntentBridge 自动生成，请勿手动编辑 -->';
const START_MARKER_PREFIX = '<!-- INTENTBRIDGE:START';
const END_MARKER = '<!-- INTENTBRIDGE:END -->';

export function generateBlock(project: ProjectConfig, requirements: RequirementsData): string {
  const lines: string[] = [START_MARKER, ''];

  // Project overview
  lines.push('## 项目概述');
  lines.push(`${project.project.name} — ${project.project.description}`);
  lines.push('');

  // Tech stack
  if (project.project.tech_stack.length > 0) {
    lines.push('## 技术栈');
    for (const t of project.project.tech_stack) {
      lines.push(`- ${t}`);
    }
    lines.push('');
  }

  // Conventions
  if (project.project.conventions.length > 0) {
    lines.push('## 项目约定');
    for (const c of project.project.conventions) {
      lines.push(`- ${c}`);
    }
    lines.push('');
  }

  // Active/implementing requirements
  const active = requirements.requirements.filter(
    (r) => r.status === 'active' || r.status === 'implementing'
  );
  if (active.length > 0) {
    lines.push('## 当前需求（活跃/进行中）');
    lines.push('');
    for (const r of active) {
      lines.push(`### ${r.id} [${r.status}] ${r.title}`);
      lines.push(r.description);
      if (r.files.length > 0) {
        lines.push(`相关文件: ${r.files.join(', ')}`);
      }
      lines.push('');
    }
  }

  // Done requirements (last 5)
  const done = requirements.requirements
    .filter((r) => r.status === 'done')
    .slice(-5);
  if (done.length > 0) {
    lines.push('## 已完成需求（最近 5 个）');
    for (const r of done) {
      lines.push(`- ${r.id} ${r.title} ✓`);
    }
    lines.push('');
  }

  // Code mapping index
  const fileMap = new Map<string, string[]>();
  for (const r of requirements.requirements) {
    for (const f of r.files) {
      if (!fileMap.has(f)) fileMap.set(f, []);
      fileMap.get(f)!.push(r.id);
    }
  }
  if (fileMap.size > 0) {
    lines.push('## 代码映射索引');
    lines.push('| 文件 | 关联需求 |');
    lines.push('|------|---------|');
    for (const [file, reqIds] of fileMap) {
      lines.push(`| ${file} | ${reqIds.join(', ')} |`);
    }
    lines.push('');
  }

  lines.push(END_MARKER);
  return lines.join('\n');
}

export function writeClaudeMd(block: string, cwd?: string): void {
  const path = getClaudeMdPath(cwd);

  if (existsSync(path)) {
    const existing = readFileSync(path, 'utf-8');
    const startIdx = existing.indexOf(START_MARKER_PREFIX);
    const endIdx = existing.indexOf(END_MARKER);

    if (startIdx !== -1 && endIdx !== -1) {
      // Replace existing block
      const before = existing.substring(0, startIdx);
      const after = existing.substring(endIdx + END_MARKER.length);
      writeFileSync(path, before + block + after);
      return;
    }

    // Append block to existing file
    writeFileSync(path, existing.trimEnd() + '\n\n' + block + '\n');
    return;
  }

  // Create new file
  writeFileSync(path, block + '\n');
}

export function generate(cwd?: string): string {
  const project = readProject(cwd);
  const requirements = readRequirements(cwd);
  const block = generateBlock(project, requirements);
  writeClaudeMd(block, cwd);
  return block;
}
