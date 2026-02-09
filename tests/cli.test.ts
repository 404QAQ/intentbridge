import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { writeProject, writeRequirements, addRequirement } from '../src/services/store.js';
import type { ProjectConfig } from '../src/models/types.js';

const CLI = resolve(import.meta.dirname, '..', 'bin', 'ib.ts');
const TSX = resolve(import.meta.dirname, '..', 'node_modules', '.bin', 'tsx');

let cwd: string;

function run(args: string): string {
  return execFileSync(TSX, [CLI, ...args.split(/\s+/)], {
    cwd,
    encoding: 'utf-8',
    timeout: 10_000,
    env: { ...process.env, FORCE_COLOR: '0' },
  });
}

function initProject(): void {
  const config: ProjectConfig = {
    version: '1',
    project: {
      name: 'test-proj',
      description: 'A test project',
      tech_stack: ['TypeScript'],
      conventions: ['Use ESM'],
    },
  };
  writeProject(config, cwd);
  writeRequirements({ requirements: [] }, cwd);
}

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), 'ib-e2e-'));
});

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});
describe('ib --version', () => {
  it('prints version', () => {
    const out = run('--version');
    expect(out.trim()).toBe('1.0.0');
  });
});

describe('ib --help', () => {
  it('prints help text', () => {
    const out = run('--help');
    expect(out).toContain('IntentBridge');
    expect(out).toContain('init');
    expect(out).toContain('req');
    expect(out).toContain('map');
    expect(out).toContain('gen');
    expect(out).toContain('status');
  });
});

describe('ib req list', () => {
  it('shows empty message when no requirements', () => {
    initProject();
    const out = run('req list');
    expect(out).toContain('No requirements');
  });

  it('lists requirements grouped by status', () => {
    initProject();
    addRequirement('Login', 'JWT auth', 'high', cwd);
    addRequirement('Register', 'Email register', 'medium', cwd);
    const out = run('req list');
    expect(out).toContain('REQ-001');
    expect(out).toContain('Login');
    expect(out).toContain('REQ-002');
    expect(out).toContain('Register');
  });
});

describe('ib req update', () => {
  it('updates requirement status and title', () => {
    initProject();
    addRequirement('Feature', 'Desc', 'medium', cwd);
    const out = run('req update REQ-001 -s active -t Updated');
    expect(out).toContain('Updated');
    expect(out).toContain('REQ-001');
  });

  it('rejects invalid status', () => {
    initProject();
    addRequirement('Feature', 'Desc', 'medium', cwd);
    const out = run('req update REQ-001 -s invalid');
    expect(out).toContain('Invalid status');
  });

  it('warns when no updates specified', () => {
    initProject();
    addRequirement('Feature', 'Desc', 'medium', cwd);
    const out = run('req update REQ-001');
    expect(out).toContain('No updates');
  });
});

describe('ib req done', () => {
  it('marks requirement as done', () => {
    initProject();
    addRequirement('Feature', 'Desc', 'medium', cwd);
    const out = run('req done REQ-001');
    expect(out).toContain('done');
    expect(out).toContain('REQ-001');
  });
});

describe('ib req remove', () => {
  it('removes a requirement', () => {
    initProject();
    addRequirement('Feature', 'Desc', 'medium', cwd);
    const out = run('req remove REQ-001');
    expect(out).toContain('Removed');
    expect(out).toContain('REQ-001');
  });
});

describe('ib map', () => {
  beforeEach(() => {
    initProject();
    addRequirement('Feature', 'Desc', 'medium', cwd);
  });

  it('adds and lists file mappings', () => {
    run('map add REQ-001 src/a.ts src/b.ts');
    const out = run('map list');
    expect(out).toContain('src/a.ts');
    expect(out).toContain('src/b.ts');
  });

  it('removes a file mapping', () => {
    run('map add REQ-001 src/a.ts src/b.ts');
    run('map remove REQ-001 src/a.ts');
    const out = run('map list');
    expect(out).not.toContain('src/a.ts');
    expect(out).toContain('src/b.ts');
  });

  it('shows empty message when no mappings', () => {
    const out = run('map list');
    expect(out).toContain('No file mappings');
  });
});

describe('ib gen', () => {
  it('generates CLAUDE.md with project context', () => {
    initProject();
    addRequirement('Feature', 'Desc', 'high', cwd);
    run('req update REQ-001 -s active');
    run('map add REQ-001 src/a.ts');
    run('gen');

    const md = readFileSync(join(cwd, 'CLAUDE.md'), 'utf-8');
    expect(md).toContain('INTENTBRIDGE:START');
    expect(md).toContain('INTENTBRIDGE:END');
    expect(md).toContain('test-proj');
    expect(md).toContain('REQ-001');
    expect(md).toContain('src/a.ts');
  });

  it('updates existing CLAUDE.md', () => {
    initProject();
    run('gen');
    addRequirement('New Feature', 'New desc', 'high', cwd);
    run('req update REQ-001 -s implementing');
    run('gen');

    const md = readFileSync(join(cwd, 'CLAUDE.md'), 'utf-8');
    expect(md).toContain('REQ-001');
    expect(md).toContain('implementing');
  });
});

describe('ib status', () => {
  it('shows project status overview', () => {
    initProject();
    addRequirement('Feature A', 'Desc', 'high', cwd);
    addRequirement('Feature B', 'Desc', 'medium', cwd);
    run('req update REQ-001 -s active');
    run('req done REQ-002');

    const out = run('status');
    expect(out).toContain('test-proj');
    expect(out).toContain('Active');
    expect(out).toContain('Done');
  });
});
