import { readFileSync, existsSync } from 'node:fs';
import { getClaudeMdPath } from './paths.js';

/**
 * Estimate token count for a string.
 * Rough heuristic: CJK chars ~1.5 tokens each, other words ~1.3 tokens each.
 */
export function estimateTokens(text: string): number {
  let tokens = 0;

  // Count CJK characters
  const cjkMatches = text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g);
  const cjkCount = cjkMatches ? cjkMatches.length : 0;
  tokens += Math.ceil(cjkCount * 1.5);

  // Remove CJK chars, count remaining as English-like words
  const nonCjk = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, ' ');
  const words = nonCjk.split(/\s+/).filter(Boolean);
  tokens += Math.ceil(words.length * 1.3);

  return tokens;
}

const DEFAULT_WARN_THRESHOLD = 4000;

export function getClaudeMdTokens(cwd?: string): { chars: number; tokens: number } | null {
  const path = getClaudeMdPath(cwd);
  if (!existsSync(path)) return null;
  const content = readFileSync(path, 'utf-8');
  return { chars: content.length, tokens: estimateTokens(content) };
}

export function formatTokenWarning(tokens: number, threshold: number = DEFAULT_WARN_THRESHOLD): string | null {
  if (tokens <= threshold) return null;
  return `⚠ CLAUDE.md estimated ~${tokens} tokens (threshold: ${threshold}). Consider using --focus to reduce context.`;
}
