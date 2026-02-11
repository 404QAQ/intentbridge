import { readFileSync, writeFileSync } from 'node:fs';
import type { Requirement } from '../models/types.js';

const ANCHOR_PREFIX = '// INTENTBRIDGE:';
const ANCHOR_START = '// INTENTBRIDGE-START';
const ANCHOR_END = '// INTENTBRIDGE-END';

export interface CodeAnchor {
  reqId: string;
  title: string;
  goal: string;
  decisions: string[];
  constraints: string[];
}

/**
 * Generate a code anchor comment block for a requirement
 */
export function generateCodeAnchor(requirement: Requirement): string {
  const lines: string[] = [];

  lines.push(ANCHOR_START);
  lines.push(`${ANCHOR_PREFIX}${requirement.id}`);
  lines.push(`// 目标: ${requirement.title}`);

  if (requirement.description) {
    // Truncate long descriptions
    const desc = requirement.description.length > 80
      ? requirement.description.substring(0, 80) + '...'
      : requirement.description;
    lines.push(`// ${desc}`);
  }

  // Add decisions if present
  if (requirement.notes && requirement.notes.length > 0) {
    lines.push(`// 决策:`);
    for (const note of requirement.notes.slice(-3)) { // Last 3 decisions
      lines.push(`//   - ${note.content}`);
    }
  }

  // Add acceptance progress
  if (requirement.acceptance && requirement.acceptance.length > 0) {
    const doneCount = requirement.acceptance.filter((a) => a.done).length;
    lines.push(`// 进度: ${doneCount}/${requirement.acceptance.length} 验收通过`);
  }

  lines.push(ANCHOR_END);

  return lines.join('\n');
}

/**
 * Check if a file already has an anchor for a requirement
 */
export function hasAnchor(filePath: string, reqId: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return content.includes(`${ANCHOR_PREFIX}${reqId}`);
  } catch {
    return false;
  }
}

/**
 * Find the INTENTBRIDGE anchor block in a file
 */
export function findAnchorBlock(content: string): { start: number; end: number } | null {
  const startIdx = content.indexOf(ANCHOR_START);
  if (startIdx === -1) return null;

  const endIdx = content.indexOf(ANCHOR_END, startIdx);
  if (endIdx === -1) return null;

  return { start: startIdx, end: endIdx + ANCHOR_END.length };
}

/**
 * Inject or update anchor in a file
 */
export function injectAnchor(filePath: string, requirement: Requirement): void {
  const content = readFileSync(filePath, 'utf-8');
  const anchor = generateCodeAnchor(requirement);

  const existingBlock = findAnchorBlock(content);

  let newContent: string;

  if (existingBlock) {
    // Replace existing block
    newContent =
      content.substring(0, existingBlock.start) +
      anchor +
      content.substring(existingBlock.end);
  } else {
    // Insert at the beginning (after shebang if present)
    const shebangMatch = content.match(/^#!.+\n/);
    if (shebangMatch) {
      const insertPos = shebangMatch[0].length;
      newContent =
        content.substring(0, insertPos) +
        '\n' +
        anchor +
        '\n' +
        content.substring(insertPos);
    } else {
      newContent = anchor + '\n\n' + content;
    }
  }

  writeFileSync(filePath, newContent, 'utf-8');
}

/**
 * Remove anchor from a file
 */
export function removeAnchor(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');
  const block = findAnchorBlock(content);

  if (!block) return;

  // Remove the block plus surrounding newlines
  let newContent = content.substring(0, block.start);
  const afterBlock = content.substring(block.end);

  // Clean up trailing newlines before the block
  newContent = newContent.replace(/\n+$/, '\n');
  newContent += afterBlock.startsWith('\n') ? afterBlock : '\n' + afterBlock;

  writeFileSync(filePath, newContent, 'utf-8');
}

/**
 * Extract requirement ID from an anchor comment
 */
export function extractReqIdFromAnchor(content: string): string | null {
  const match = content.match(/\/\/ INTENTBRIDGE:(REQ-\d+)/);
  return match ? match[1] : null;
}
