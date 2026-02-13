import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

/**
 * Create a test project with .intentbridge directory
 */
export function createTestProject(projectName: string): string {
  const projectDir = join(globalThis.TEST_DIR, projectName);

  // Create project directory
  if (!existsSync(projectDir)) {
    mkdirSync(projectDir, { recursive: true });
  }

  // Create .intentbridge directory
  const intentDir = join(projectDir, '.intentbridge');
  if (!existsSync(intentDir)) {
    mkdirSync(intentDir, { recursive: true });
  }

  // Create empty requirements.yaml
  const reqPath = join(intentDir, 'requirements.yaml');
  writeFileSync(reqPath, 'requirements: []\n', 'utf-8');

  // Create project.yaml
  const projectPath = join(intentDir, 'project.yaml');
  writeFileSync(projectPath, `name: ${projectName}\n`, 'utf-8');

  return projectDir;
}

/**
 * Clean up test project
 */
export function cleanupTestProject(projectName: string): void {
  const projectDir = join(globalThis.TEST_DIR, projectName);
  if (existsSync(projectDir)) {
    rmSync(projectDir, { recursive: true, force: true });
  }
}

/**
 * Run a CLI command and return result
 */
export function runCommand(command: string, cwd?: string): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  try {
    const stdout = execSync(`node dist/bin/ib.js ${command}`, {
      encoding: 'utf-8',
      cwd: cwd || process.cwd(),
      timeout: 5000,
    });

    return {
      stdout,
      stderr: '',
      exitCode: 0,
    };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.status || 1,
    };
  }
}

/**
 * Wait for a specific amount of time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock requirement
 */
export function createMockRequirement(overrides?: Partial<any>): any {
  return {
    id: 'REQ-001',
    title: 'Test Requirement',
    description: 'Test description',
    status: 'active',
    priority: 'medium',
    created: new Date().toISOString(),
    files: [],
    tags: [],
    ...overrides,
  };
}
