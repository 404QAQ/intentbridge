import { beforeAll, afterAll, afterEach } from '@jest/globals';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { jest } from '@jest/globals';

// Global test configuration
declare global {
  var TEST_DIR: string;
}

// Create a temporary directory for each test run
beforeAll(() => {
  globalThis.TEST_DIR = join(tmpdir(), `intentbridge-test-${Date.now()}`);
  if (!existsSync(globalThis.TEST_DIR)) {
    mkdirSync(globalThis.TEST_DIR, { recursive: true });
  }
});

// Cleanup after all tests
afterAll(() => {
  if (existsSync(globalThis.TEST_DIR)) {
    rmSync(globalThis.TEST_DIR, { recursive: true, force: true });
  }
});

// Increase timeout for integration tests
jest.setTimeout(10000);
