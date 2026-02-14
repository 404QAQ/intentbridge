import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeProject, writeRequirements, addRequirement, addFileMapping, updateRequirement } from '../src/services/store.js';
import { generateBlock, writeClaudeMd, generate } from '../src/services/generator.js';
import type { ProjectConfig, RequirementsData } from '../src/models/types.js';
import { getClaudeMdPath } from '../src/utils/paths.js';

let tmpDir: string;

function setup() {
  const config: ProjectConfig = {
    version: '1',
    project: {
      name: 'test-project',
      description: 'A test project',
      tech_stack: ['Vue 3', 'Python FastAPI'],
      conventions: ['Use Composition API', 'API prefix /api/v1'],
    },
  };
  writeProject(config, tmpDir);
  writeRequirements({ requirements: [] }, tmpDir);
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'ib-gen-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('generateBlock', () => {
  it('generates correct markdown block', () => {
    setup();
    addRequirement('Login', 'JWT auth', 'high', tmpDir);
    updateRequirement('REQ-001', { status: 'active' }, tmpDir);
    addFileMapping('REQ-001', ['src/auth.py'], tmpDir);

    const project = {
      version: '1',
      project: {
        name: 'test-project',
        description: 'A test project',
        tech_stack: ['Vue 3', 'Python FastAPI'],
        conventions: ['Use Composition API'],
      },
    };

    const reqs: RequirementsData = {
      requirements: [
        {
          id: 'REQ-001',
          title: 'Login',
          description: 'JWT auth',
          status: 'active',
          priority: 'high',
          created: '2026-02-09',
          files: ['src/auth.py'],
        },
        {
          id: 'REQ-002',
          title: 'Register',
          description: 'Email register',
          status: 'done',
          priority: 'medium',
          created: '2026-02-09',
          files: [],
        },
      ],
    };

    const block = generateBlock(project, reqs);
    expect(block).toContain('INTENTBRIDGE:START');
    expect(block).toContain('INTENTBRIDGE:END');
    expect(block).toContain('test-project — A test project');
    expect(block).toContain('- Vue 3');
    expect(block).toContain('- Use Composition API');
    expect(block).toContain('REQ-001 [active] Login');
    expect(block).toContain('src/auth.py');
    expect(block).toContain('REQ-002 Register ✓');
    expect(block).toContain('| src/auth.py | REQ-001 |');
  });
});

describe('writeClaudeMd', () => {
  it('creates new CLAUDE.md', () => {
    const block = '<!-- INTENTBRIDGE:START -->\ntest\n<!-- INTENTBRIDGE:END -->';
    writeClaudeMd(block, tmpDir);
    const content = readFileSync(getClaudeMdPath(tmpDir), 'utf-8');
    expect(content).toContain('test');
  });

  it('replaces existing block', () => {
    const path = getClaudeMdPath(tmpDir);
    writeFileSync(
      path,
      '# My Notes\n\n<!-- INTENTBRIDGE:START -->\nold\n<!-- INTENTBRIDGE:END -->\n\n# Footer\n'
    );

    const newBlock = '<!-- INTENTBRIDGE:START -->\nnew content\n<!-- INTENTBRIDGE:END -->';
    writeClaudeMd(newBlock, tmpDir);

    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('# My Notes');
    expect(content).toContain('new content');
    expect(content).not.toContain('old');
    expect(content).toContain('# Footer');
  });

  it('appends to existing file without markers', () => {
    const path = getClaudeMdPath(tmpDir);
    writeFileSync(path, '# Existing content\n');

    const block = '<!-- INTENTBRIDGE:START -->\nappended\n<!-- INTENTBRIDGE:END -->';
    writeClaudeMd(block, tmpDir);

    const content = readFileSync(path, 'utf-8');
    expect(content).toContain('# Existing content');
    expect(content).toContain('appended');
  });
});

describe('generate (integration)', () => {
  it('generates CLAUDE.md from YAML files', () => {
    setup();
    addRequirement('Feature A', 'Description A', 'high', tmpDir);
    updateRequirement('REQ-001', { status: 'implementing' }, tmpDir);
    addFileMapping('REQ-001', ['src/a.ts'], tmpDir);

    generate(tmpDir);

    const content = readFileSync(getClaudeMdPath(tmpDir), 'utf-8');
    expect(content).toContain('test-project');
    expect(content).toContain('REQ-001 [implementing] Feature A');
    expect(content).toContain('src/a.ts');
  });
});
