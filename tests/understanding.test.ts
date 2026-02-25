import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  writeProject,
  writeRequirements,
  addRequirement,
  addNote,
  addAcceptanceCriterion,
  acceptCriterion,
  addFileMapping,
  updateRequirement,
  readRequirements,
  addDependency,
  addTag,
} from '../src/services/store.js';
import {
  generateRequirementUnderstanding,
  writeUnderstandingDocument,
  readUnderstandingDocument,
  generateCompactExplanation,
  generateAllUnderstandingDocuments,
} from '../src/services/understanding-generator.js';
import {
  generateCodeAnchor,
  hasAnchor,
  injectAnchor,
  removeAnchor,
  extractReqIdFromAnchor,
} from '../src/services/code-anchoring.js';
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
  tmpDir = mkdtempSync(join(tmpdir(), 'ib-understanding-test-'));
  writeProject(makeProject(), tmpDir);
  writeRequirements({ requirements: [] }, tmpDir);
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('generateRequirementUnderstanding', () => {
  it('generates understanding document', () => {
    const req = addRequirement('User Auth', 'Implement JWT authentication', 'high', tmpDir);
    const understanding = generateRequirementUnderstanding(req, [req]);

    expect(understanding).toContain('# REQ-001: User Auth');
    expect(understanding).toContain('## 目标');
    expect(understanding).toContain('Implement JWT authentication');
    expect(understanding).toContain('**状态**: 📝 草稿');
  });

  it('includes decision notes', () => {
    const req = addRequirement('Feature', 'Description', 'medium', tmpDir);
    addNote(req.id, 'Decision 1', tmpDir);
    addNote(req.id, 'Decision 2', tmpDir);

    // 重新读取需求以获取更新后的数据
    const updatedReqs = readRequirements(tmpDir);
    const updatedReq = updatedReqs.requirements.find(r => r.id === req.id)!;

    const understanding = generateRequirementUnderstanding(updatedReq, [updatedReq], {
      includeDecisions: true,
    });

    expect(understanding).toContain('## 决策记录');
    expect(understanding).toContain('Decision 1');
    expect(understanding).toContain('Decision 2');
  });

  it('includes acceptance criteria', () => {
    const req = addRequirement('Feature', 'Description', 'medium', tmpDir);
    addAcceptanceCriterion(req.id, 'Criterion 1', tmpDir);
    addAcceptanceCriterion(req.id, 'Criterion 2', tmpDir);
    acceptCriterion(req.id, 0, tmpDir);

    // 重新读取需求以获取更新后的数据
    const updatedReqs = readRequirements(tmpDir);
    const updatedReq = updatedReqs.requirements.find(r => r.id === req.id)!;

    const understanding = generateRequirementUnderstanding(updatedReq, [updatedReq], {
      includeAcceptance: true,
    });

    expect(understanding).toContain('## 验收条件');
    expect(understanding).toContain('✅ **0**. Criterion 1');
    expect(understanding).toContain('⬜ **1**. Criterion 2');
    expect(understanding).toContain('(1/2 完成)');
  });

  it('includes code mapping', () => {
    const req = addRequirement('Feature', 'Description', 'medium', tmpDir);
    addFileMapping(req.id, ['src/auth.ts', 'src/middleware/auth.ts'], tmpDir);

    // 重新读取需求以获取更新后的数据
    const updatedReqs = readRequirements(tmpDir);
    const updatedReq = updatedReqs.requirements.find(r => r.id === req.id)!;

    const understanding = generateRequirementUnderstanding(updatedReq, [updatedReq], {
      includeCodeMapping: true,
    });

    expect(understanding).toContain('## 代码映射');
    expect(understanding).toContain('`src/auth.ts`');
    expect(understanding).toContain('`src/middleware/auth.ts`');
  });

  it('includes dependencies', () => {
    const req1 = addRequirement('Feature A', 'Description A', 'high', tmpDir);
    const req2 = addRequirement('Feature B', 'Description B', 'medium', tmpDir);
    addDependency(req2.id, req1.id, tmpDir);

    // 重新读取需求以获取更新后的数据
    const updatedReqs = readRequirements(tmpDir);
    const updatedReq2 = updatedReqs.requirements.find(r => r.id === req2.id)!;
    const updatedReq1 = updatedReqs.requirements.find(r => r.id === req1.id)!;

    const understanding = generateRequirementUnderstanding(updatedReq2, [updatedReq1, updatedReq2], {
      includeDependencies: true,
    });

    expect(understanding).toContain('## 依赖关系');
    expect(understanding).toContain('**依赖于**:');
    expect(understanding).toContain(`${req1.id} — ${req1.title}`);
  });

  it('includes tags', () => {
    const req = addRequirement('Feature', 'Description', 'medium', tmpDir);
    addTag(req.id, 'backend', tmpDir);
    addTag(req.id, 'security', tmpDir);

    // 重新读取需求以获取更新后的数据
    const updatedReqs = readRequirements(tmpDir);
    const updatedReq = updatedReqs.requirements.find(r => r.id === req.id)!;

    const understanding = generateRequirementUnderstanding(updatedReq, [updatedReq]);

    expect(understanding).toContain('## 标签');
    expect(understanding).toContain('`backend`');
    expect(understanding).toContain('`security`');
  });
});

describe('writeUnderstandingDocument', () => {
  it('writes understanding document to file', () => {
    const req = addRequirement('Feature', 'Description', 'medium', tmpDir);
    const understanding = generateRequirementUnderstanding(req, [req]);
    writeUnderstandingDocument(req.id, understanding, tmpDir);

    const filePath = join(tmpDir, '.intentbridge', 'understanding', `${req.id}.md`);

    expect(existsSync(filePath)).toBe(true);

    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('# REQ-001: Feature');
  });
});

describe('readUnderstandingDocument', () => {
  it('reads understanding document', () => {
    const req = addRequirement('Feature', 'Description', 'medium', tmpDir);
    const understanding = generateRequirementUnderstanding(req, [req]);
    writeUnderstandingDocument(req.id, understanding, tmpDir);

    const content = readUnderstandingDocument(req.id, tmpDir);
    expect(content).toContain('# REQ-001: Feature');
  });

  it('returns null for non-existent document', () => {
    const content = readUnderstandingDocument('REQ-999', tmpDir);
    expect(content).toBeNull();
  });
});

describe('generateAllUnderstandingDocuments', () => {
  it('generates documents for all requirements', () => {
    addRequirement('Feature A', 'Description A', 'high', tmpDir);
    addRequirement('Feature B', 'Description B', 'medium', tmpDir);

    const results = generateAllUnderstandingDocuments(tmpDir);

    expect(results).toHaveLength(2);
    // At least some should succeed
    const successCount = results.filter((r) => r.success).length;
    expect(successCount).toBeGreaterThan(0);

    expect(existsSync(join(tmpDir, '.intentbridge', 'understanding', 'REQ-001.md'))).toBe(true);
    expect(existsSync(join(tmpDir, '.intentbridge', 'understanding', 'REQ-002.md'))).toBe(true);
  });
});

describe('generateCompactExplanation', () => {
  it('generates compact text explanation', () => {
    const req = addRequirement('User Auth', 'JWT authentication', 'high', tmpDir);
    addNote(req.id, 'Use JWT for stateless auth', tmpDir);
    addAcceptanceCriterion(req.id, 'Token generation', tmpDir);

    const explanation = generateCompactExplanation(req.id, tmpDir);

    expect(explanation).toContain('📋 REQ-001: User Auth');
    expect(explanation).toContain('目标: JWT authentication');
    expect(explanation).toContain('决策: 1 条记录');
    expect(explanation).toContain('验收: 0/1 完成');
  });

  it('generates JSON explanation', () => {
    const req = addRequirement('Feature', 'Description', 'medium', tmpDir);
    const explanation = generateCompactExplanation(req.id, tmpDir, { format: 'json' });
    const data = JSON.parse(explanation);

    expect(data.id).toBe('REQ-001');
    expect(data.title).toBe('Feature');
    expect(data.description).toBe('Description');
    expect(data.status).toBe('draft');
  });

  it('throws for non-existent requirement', () => {
    expect(() => generateCompactExplanation('REQ-999', tmpDir)).toThrow('not found');
  });
});

describe('code anchoring', () => {
  it('generates code anchor block', () => {
    const req = addRequirement('Feature', 'Description', 'medium', tmpDir);
    addNote(req.id, 'Decision 1', tmpDir);

    // Re-read requirement to get notes
    const data = readRequirements(tmpDir);
    const updatedReq = data.requirements.find((r) => r.id === req.id)!;

    const anchor = generateCodeAnchor(updatedReq);

    expect(anchor).toContain('// INTENTBRIDGE-START');
    expect(anchor).toContain('// INTENTBRIDGE:REQ-001');
    expect(anchor).toContain('// 目标: Feature');
    expect(anchor).toContain('// 决策:');
    expect(anchor).toContain('//   - Decision 1');
    expect(anchor).toContain('// INTENTBRIDGE-END');
  });

  it('injects anchor into file', () => {
    const testFile = join(tmpDir, 'test.ts');
    writeFileSync(testFile, 'export function hello() {}', 'utf-8');

    const req = addRequirement('Feature', 'Description', 'medium', tmpDir);
    injectAnchor(testFile, req);

    const content = readFileSync(testFile, 'utf-8');
    expect(content).toContain('// INTENTBRIDGE:REQ-001');
    expect(content).toContain('export function hello() {}');
  });

  it('checks for existing anchor', () => {
    const testFile = join(tmpDir, 'test.ts');
    writeFileSync(testFile, '// INTENTBRIDGE:REQ-001\nexport function hello() {}', 'utf-8');

    expect(hasAnchor(testFile, 'REQ-001')).toBe(true);
    expect(hasAnchor(testFile, 'REQ-002')).toBe(false);
  });

  it('removes anchor from file', () => {
    const testFile = join(tmpDir, 'test.ts');
    writeFileSync(
      testFile,
      '// INTENTBRIDGE-START\n// INTENTBRIDGE:REQ-001\n// INTENTBRIDGE-END\nexport function hello() {}',
      'utf-8'
    );

    removeAnchor(testFile);

    const content = readFileSync(testFile, 'utf-8');
    expect(content).not.toContain('INTENTBRIDGE');
    expect(content).toContain('export function hello() {}');
  });

  it('extracts requirement ID from anchor', () => {
    const content = '// INTENTBRIDGE:REQ-001\nexport function hello() {}';
    expect(extractReqIdFromAnchor(content)).toBe('REQ-001');
  });
});
