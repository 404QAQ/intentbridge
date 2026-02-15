/**
 * Runtime Validator (运行时验证器)
 *
 * 功能：
 * 1. 实际运行测试（不仅是检查存在性）
 * 2. 验证测试覆盖率 ≥ 80%
 * 3. 检查所有测试通过
 * 4. 捕获测试输出作为证据
 * 5. 执行运行时验证
 *
 * v3.0.0 Phase 4 新增 - 硬验证机制
 */

import { execSync, exec } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const execAsync = promisify(exec);

/**
 * 运行时验证结果
 */
export interface RuntimeValidationResult {
  success: boolean;
  testResults: TestResults;
  coverageReport?: CoverageReport;
  runtimeErrors: RuntimeError[];
  evidence: Evidence[];
  summary: string;
}

/**
 * 测试结果
 */
export interface TestResults {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number; // 0-100
  duration: number; // ms
  details: TestDetail[];
}

/**
 * 测试详情
 */
export interface TestDetail {
  name: string;
  suite?: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  stackTrace?: string;
}

/**
 * 覆盖率报告
 */
export interface CoverageReport {
  lineCoverage: number;
  branchCoverage: number;
  functionCoverage: number;
  statementCoverage: number;
  overall: number; // 综合覆盖率
  files: FileCoverage[];
}

/**
 * 文件覆盖率
 */
export interface FileCoverage {
  path: string;
  lineCoverage: number;
  branchCoverage: number;
  functionCoverage: number;
  uncoveredLines: number[];
}

/**
 * 运行时错误
 */
export interface RuntimeError {
  type: 'test_failure' | 'coverage_insufficient' | 'execution_error' | 'timeout';
  message: string;
  details?: string;
  severity: 'critical' | 'high' | 'medium';
}

/**
 * 证据
 */
export interface Evidence {
  type: 'test_output' | 'coverage_report' | 'screenshot' | 'log';
  path: string;
  description: string;
  timestamp: string;
}

/**
 * 验证配置
 */
export interface RuntimeValidationConfig {
  testCommand: string;
  coverageCommand?: string;
  coverageThreshold: number; // 默认 80
  passRateThreshold: number; // 默认 100
  timeout: number; // 秒
  collectEvidence: boolean;
  evidenceDir: string;
}

/**
 * 默认验证配置
 */
export const DEFAULT_RUNTIME_CONFIG: RuntimeValidationConfig = {
  testCommand: 'npm test',
  coverageCommand: 'npm test -- --coverage',
  coverageThreshold: 80,
  passRateThreshold: 100,
  timeout: 300,
  collectEvidence: true,
  evidenceDir: '.intentbridge/evidence/runtime',
};

/**
 * 执行运行时验证
 */
export async function performRuntimeValidation(
  config: Partial<RuntimeValidationConfig> = {}
): Promise<RuntimeValidationResult> {
  const finalConfig = { ...DEFAULT_RUNTIME_CONFIG, ...config };
  const errors: RuntimeError[] = [];
  const evidence: Evidence[] = [];

  try {
    // 步骤 1: 运行测试
    console.log('[RuntimeValidator] Running tests...');
    const testResults = await runTests(finalConfig);

    // 收集测试输出证据
    if (finalConfig.collectEvidence) {
      const testEvidence = await saveTestEvidence(testResults, finalConfig.evidenceDir);
      evidence.push(testEvidence);
    }

    // 检查测试通过率
    if (testResults.passRate < finalConfig.passRateThreshold) {
      errors.push({
        type: 'test_failure',
        message: `Test pass rate ${testResults.passRate.toFixed(1)}% is below threshold ${finalConfig.passRateThreshold}%`,
        details: `${testResults.failed} tests failed out of ${testResults.total}`,
        severity: 'critical',
      });
    }

    // 步骤 2: 收集覆盖率
    console.log('[RuntimeValidator] Collecting coverage...');
    let coverageReport: CoverageReport | undefined;
    if (finalConfig.coverageCommand) {
      coverageReport = await collectCoverage(finalConfig);

      // 收集覆盖率报告证据
      if (finalConfig.collectEvidence && coverageReport) {
        const coverageEvidence = await saveCoverageEvidence(coverageReport, finalConfig.evidenceDir);
        evidence.push(coverageEvidence);
      }

      // 检查覆盖率阈值
      if (coverageReport && coverageReport.overall < finalConfig.coverageThreshold) {
        errors.push({
          type: 'coverage_insufficient',
          message: `Coverage ${coverageReport.overall.toFixed(1)}% is below threshold ${finalConfig.coverageThreshold}%`,
          details: `Line: ${coverageReport.lineCoverage}%, Branch: ${coverageReport.branchCoverage}%, Function: ${coverageReport.functionCoverage}%`,
          severity: 'high',
        });
      }
    }

    // 步骤 3: 检查运行时错误
    const runtimeErrors = detectRuntimeErrors(testResults, coverageReport);
    errors.push(...runtimeErrors);

    // 生成摘要
    const summary = generateSummary(testResults, coverageReport, errors);

    return {
      success: errors.filter((e) => e.severity === 'critical' || e.severity === 'high').length === 0,
      testResults,
      coverageReport,
      runtimeErrors: errors,
      evidence,
      summary,
    };
  } catch (error: any) {
    return {
      success: false,
      testResults: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        passRate: 0,
        duration: 0,
        details: [],
      },
      runtimeErrors: [
        {
          type: 'execution_error',
          message: 'Runtime validation failed',
          details: error.message,
          severity: 'critical',
        },
      ],
      evidence,
      summary: `Validation failed: ${error.message}`,
    };
  }
}

/**
 * 运行测试
 */
async function runTests(config: RuntimeValidationConfig): Promise<TestResults> {
  try {
    const timeout = config.timeout * 1000;
    const startTime = Date.now();

    const { stdout, stderr } = await execAsync(config.testCommand, {
      timeout,
      maxBuffer: 1024 * 1024 * 10, // 10MB
    });

    const duration = Date.now() - startTime;
    const output = stdout + stderr;

    // 解析测试结果
    return parseTestOutput(output, duration);
  } catch (error: any) {
    // 即使测试失败，也要解析输出
    const output = (error.stdout || '') + (error.stderr || '');
    const duration = 0;

    return parseTestOutput(output, duration);
  }
}

/**
 * 解析测试输出
 */
export function parseTestOutput(output: string, duration: number): TestResults {
  const results: TestResults = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    passRate: 0,
    duration,
    details: [],
  };

  // Jest 格式
  const jestMatch = output.match(/Tests:\s+(\d+)\s+(?:passed|failed)(?:,\s+(\d+)\s+(?:passed|failed|skipped))?(?:,\s+(\d+)\s+skipped)?/);
  if (jestMatch) {
    // 尝试解析 Jest 输出
    const passedMatch = output.match(/(\d+)\s+passed/);
    const failedMatch = output.match(/(\d+)\s+failed/);
    const skippedMatch = output.match(/(\d+)\s+skipped/);

    results.passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    results.failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    results.skipped = skippedMatch ? parseInt(skippedMatch[1]) : 0;
    results.total = results.passed + results.failed + results.skipped;
  }

  // Mocha 格式
  const mochaMatch = output.match(/(\d+)\s+passing/);
  if (mochaMatch) {
    results.passed = parseInt(mochaMatch[1]);
    const failingMatch = output.match(/(\d+)\s+failing/);
    results.failed = failingMatch ? parseInt(failingMatch[1]) : 0;
    results.total = results.passed + results.failed;
  }

  // Pytest 格式
  const pytestMatch = output.match(/(\d+)\s+passed/);
  if (pytestMatch) {
    results.passed = parseInt(pytestMatch[1]);
    const failedMatch = output.match(/(\d+)\s+failed/);
    results.failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    const skippedMatch = output.match(/(\d+)\s+skipped/);
    results.skipped = skippedMatch ? parseInt(skippedMatch[1]) : 0;
    results.total = results.passed + results.failed + results.skipped;
  }

  // 计算通过率
  if (results.total > 0) {
    results.passRate = (results.passed / results.total) * 100;
  }

  // 解析失败测试详情（简化版）
  const failedTests = output.match(/✕\s+(.+?)\s+\((\d+)\s*ms\)/g);
  if (failedTests) {
    failedTests.forEach((test) => {
      const match = test.match(/✕\s+(.+?)\s+\((\d+)\s*ms\)/);
      if (match) {
        results.details.push({
          name: match[1],
          status: 'failed',
          duration: parseInt(match[2]),
          error: 'Test failed',
        });
      }
    });
  }

  return results;
}

/**
 * 收集覆盖率
 */
async function collectCoverage(config: RuntimeValidationConfig): Promise<CoverageReport | undefined> {
  try {
    if (!config.coverageCommand) {
      return undefined;
    }

    const { stdout, stderr } = await execAsync(config.coverageCommand, {
      timeout: config.timeout * 1000,
      maxBuffer: 1024 * 1024 * 10,
    });

    const output = stdout + stderr;

    // 解析覆盖率报告
    return parseCoverageOutput(output);
  } catch (error: any) {
    // 尝试从错误输出中解析
    const output = (error.stdout || '') + (error.stderr || '');
    return parseCoverageOutput(output);
  }
}

/**
 * 解析覆盖率输出
 */
function parseCoverageOutput(output: string): CoverageReport | undefined {
  // Jest/Istanbul 格式
  const allFilesMatch = output.match(/All files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/);
  if (allFilesMatch) {
    return {
      statementCoverage: parseFloat(allFilesMatch[1]),
      branchCoverage: parseFloat(allFilesMatch[2]),
      functionCoverage: parseFloat(allFilesMatch[3]),
      lineCoverage: parseFloat(allFilesMatch[4]),
      overall: parseFloat(allFilesMatch[1]),
      files: [],
    };
  }

  // 简化的覆盖率匹配
  const coverageMatch = output.match(/(?:coverage|lines)\s*[:=]?\s*([\d.]+)%/i);
  if (coverageMatch) {
    const coverage = parseFloat(coverageMatch[1]);
    return {
      lineCoverage: coverage,
      branchCoverage: coverage,
      functionCoverage: coverage,
      statementCoverage: coverage,
      overall: coverage,
      files: [],
    };
  }

  return undefined;
}

/**
 * 检测运行时错误
 */
function detectRuntimeErrors(
  testResults: TestResults,
  coverageReport?: CoverageReport
): RuntimeError[] {
  const errors: RuntimeError[] = [];

  // 检查失败的测试
  if (testResults.failed > 0) {
    errors.push({
      type: 'test_failure',
      message: `${testResults.failed} test(s) failed`,
      severity: 'critical',
    });
  }

  // 检查未运行的测试
  if (testResults.total === 0) {
    errors.push({
      type: 'test_failure',
      message: 'No tests were executed',
      severity: 'high',
    });
  }

  // 检查低覆盖率
  if (coverageReport && coverageReport.overall < 50) {
    errors.push({
      type: 'coverage_insufficient',
      message: `Very low test coverage: ${coverageReport.overall.toFixed(1)}%`,
      severity: 'high',
    });
  }

  return errors;
}

/**
 * 保存测试证据
 */
async function saveTestEvidence(
  testResults: TestResults,
  evidenceDir: string
): Promise<Evidence> {
  const timestamp = new Date().toISOString();
  const evidencePath = join(evidenceDir, `test-results-${Date.now()}.json`);

  const content = JSON.stringify(testResults, null, 2);
  writeFileSync(evidencePath, content, 'utf-8');

  return {
    type: 'test_output',
    path: evidencePath,
    description: 'Test execution results',
    timestamp,
  };
}

/**
 * 保存覆盖率证据
 */
async function saveCoverageEvidence(
  coverageReport: CoverageReport,
  evidenceDir: string
): Promise<Evidence> {
  const timestamp = new Date().toISOString();
  const evidencePath = join(evidenceDir, `coverage-report-${Date.now()}.json`);

  const content = JSON.stringify(coverageReport, null, 2);
  writeFileSync(evidencePath, content, 'utf-8');

  return {
    type: 'coverage_report',
    path: evidencePath,
    description: 'Test coverage report',
    timestamp,
  };
}

/**
 * 生成摘要
 */
function generateSummary(
  testResults: TestResults,
  coverageReport: CoverageReport | undefined,
  errors: RuntimeError[]
): string {
  const parts: string[] = [];

  // 测试摘要
  parts.push(`Tests: ${testResults.passed}/${testResults.total} passed (${testResults.passRate.toFixed(1)}%)`);

  // 覆盖率摘要
  if (coverageReport) {
    parts.push(`Coverage: ${coverageReport.overall.toFixed(1)}%`);
  }

  // 错误摘要
  const criticalErrors = errors.filter((e) => e.severity === 'critical');
  const highErrors = errors.filter((e) => e.severity === 'high');

  if (criticalErrors.length > 0) {
    parts.push(`Critical Issues: ${criticalErrors.length}`);
  }
  if (highErrors.length > 0) {
    parts.push(`High Issues: ${highErrors.length}`);
  }

  // 总体状态
  const success = criticalErrors.length === 0 && highErrors.length === 0;
  parts.unshift(success ? '✅ PASSED' : '❌ FAILED');

  return parts.join(' | ');
}

/**
 * 验证特定测试文件
 */
export async function validateTestFile(
  testFilePath: string,
  config: Partial<RuntimeValidationConfig> = {}
): Promise<RuntimeValidationResult> {
  // 针对单个测试文件的验证
  const testCommand = `npm test -- ${testFilePath}`;
  return performRuntimeValidation({
    ...config,
    testCommand,
  });
}

/**
 * 验证测试套件
 */
export async function validateTestSuite(
  testPattern: string,
  config: Partial<RuntimeValidationConfig> = {}
): Promise<RuntimeValidationResult> {
  const testCommand = `npm test -- --testPathPattern="${testPattern}"`;
  return performRuntimeValidation({
    ...config,
    testCommand,
  });
}
