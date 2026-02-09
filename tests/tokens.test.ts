import { describe, it, expect } from 'vitest';
import { estimateTokens, formatTokenWarning } from '../src/utils/tokens.js';

describe('estimateTokens', () => {
  it('estimates English text', () => {
    const text = 'Hello world this is a test';
    const tokens = estimateTokens(text);
    // 6 words * 1.3 = 7.8 → 8
    expect(tokens).toBe(8);
  });

  it('estimates Chinese text', () => {
    const text = '你好世界';
    const tokens = estimateTokens(text);
    // 4 CJK chars * 1.5 = 6
    expect(tokens).toBe(6);
  });

  it('estimates mixed text', () => {
    const text = '项目名称 test-project 描述';
    const tokens = estimateTokens(text);
    // 4 CJK chars * 1.5 = 6, 1 English word * 1.3 = 1.3 → 2
    expect(tokens).toBeGreaterThan(0);
  });

  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });
});

describe('formatTokenWarning', () => {
  it('returns null when under threshold', () => {
    expect(formatTokenWarning(3000)).toBeNull();
  });

  it('returns warning when over threshold', () => {
    const warning = formatTokenWarning(5000);
    expect(warning).toContain('5000');
    expect(warning).toContain('--focus');
  });

  it('respects custom threshold', () => {
    expect(formatTokenWarning(100, 50)).toContain('100');
    expect(formatTokenWarning(30, 50)).toBeNull();
  });
});
