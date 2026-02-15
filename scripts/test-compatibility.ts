#!/usr/bin/env node

/**
 * IntentBridge v2/v3 兼容性测试
 *
 * 功能：
 * 1. 测试 v2 命令兼容性
 * 2. 测试 v2/v3 数据格式兼容性
 * 3. 生成测试报告
 *
 * 使用：
 *   node scripts/test-compatibility.ts
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import type { Requirement } from '../src/models/types.js';

interface TestResult {
  name: string;
  status: 'passed' | 'failed';
  message: string;
  duration?: number;
}

interface TestReport {
  timestamp: string;
  total: number;
  passed: number;
  failed: number;
  results: TestResult[];
}

const TEST_DIR = '/tmp/intentbridge-compatibility-test';

/**
 * 创建测试环境
 */
function setupTestEnv(): void {
  console.log('🔧 创建测试环境...\n');

  // 清理旧测试目录
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true });
  }

  // 创建新测试目录
  mkdirSync(TEST_DIR, { recursive: true });

  // 切换到测试目录
  process.chdir(TEST_DIR);

  // 初始化 IntentBridge
  execSync('ib init', { stdio: 'inherit' });

  console.log('\n✅ 测试环境已创建\n');
}

/**
 * 清理测试环境
 */
function cleanupTestEnv(): void {
  console.log('\n🧹 清理测试环境...');
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true });
  }
  console.log('✅ 测试环境已清理\n');
}

/**
 * 测试用例 1：v2 命令兼容性
 */
function testV2Commands(): TestResult[] {
  const results: TestResult[] = [];

  console.log('📝 测试用例 1：v2 命令兼容性\n');

  // 测试 1.1：ib req add
  try {
    console.log('  测试 1.1: ib req add');
    const start = Date.now();
    execSync('ib req add --title "测试需求1" --description "v2兼容性测试" --priority high', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const duration = Date.now() - start;

    results.push({
      name: 'ib req add',
      status: 'passed',
      message: '成功创建需求',
      duration,
    });
    console.log('    ✅ 通过\n');
  } catch (error: any) {
    results.push({
      name: 'ib req add',
      status: 'failed',
      message: error.message,
    });
    console.log(`    ❌ 失败: ${error.message}\n`);
  }

  // 测试 1.2：ib req list
  try {
    console.log('  测试 1.2: ib req list');
    const start = Date.now();
    const output = execSync('ib req list', { encoding: 'utf-8' });
    const duration = Date.now() - start;

    if (output.includes('REQ-001') && output.includes('测试需求1')) {
      results.push({
        name: 'ib req list',
        status: 'passed',
        message: '成功列出需求',
        duration,
      });
      console.log('    ✅ 通过\n');
    } else {
      throw new Error('输出不包含预期内容');
    }
  } catch (error: any) {
    results.push({
      name: 'ib req list',
      status: 'failed',
      message: error.message,
    });
    console.log(`    ❌ 失败: ${error.message}\n`);
  }

  // 测试 1.3：ib req update
  try {
    console.log('  测试 1.3: ib req update');
    const start = Date.now();
    execSync('ib req update REQ-001 --status active', { encoding: 'utf-8' });
    const duration = Date.now() - start;

    results.push({
      name: 'ib req update',
      status: 'passed',
      message: '成功更新需求',
      duration,
    });
    console.log('    ✅ 通过\n');
  } catch (error: any) {
    results.push({
      name: 'ib req update',
      status: 'failed',
      message: error.message,
    });
    console.log(`    ❌ 失败: ${error.message}\n`);
  }

  return results;
}

/**
 * 测试用例 2：数据格式兼容性
 */
function testDataFormatCompatibility(): TestResult[] {
  const results: TestResult[] = [];

  console.log('📝 测试用例 2：数据格式兼容性\n');

  // 读取 requirements.yml
  const requirementsPath = join(TEST_DIR, '.intentbridge', 'requirements.yml');
  const raw = readFileSync(requirementsPath, 'utf-8');
  const data = yaml.load(raw) as any;

  // 测试 2.1：v2 字段完整性
  try {
    console.log('  测试 2.1: v2 字段完整性');
    const req = data.requirements[0];

    const v2Fields = ['id', 'title', 'description', 'status', 'priority', 'created', 'files'];
    const missingFields = v2Fields.filter((field) => !(field in req));

    if (missingFields.length === 0) {
      results.push({
        name: 'v2 字段完整性',
        status: 'passed',
        message: '所有 v2 字段都存在',
      });
      console.log('    ✅ 通过\n');
    } else {
      throw new Error(`缺少字段: ${missingFields.join(', ')}`);
    }
  } catch (error: any) {
    results.push({
      name: 'v2 字段完整性',
      status: 'failed',
      message: error.message,
    });
    console.log(`    ❌ 失败: ${error.message}\n`);
  }

  // 测试 2.2：v3 字段可选性
  try {
    console.log('  测试 2.2: v3 字段可选性');
    const req = data.requirements[0];

    // v2 命令创建的需求不应该有 v3 字段
    const hasV3Fields = req.features || req.validation_rules || req.execution || req.validation;

    if (!hasV3Fields) {
      results.push({
        name: 'v3 字段可选性',
        status: 'passed',
        message: 'v2 命令不添加 v3 字段',
      });
      console.log('    ✅ 通过\n');
    } else {
      throw new Error('v2 命令不应该添加 v3 字段');
    }
  } catch (error: any) {
    results.push({
      name: 'v3 字段可选性',
      status: 'failed',
      message: error.message,
    });
    console.log(`    ❌ 失败: ${error.message}\n`);
  }

  return results;
}

/**
 * 测试用例 3：v3 数据读取兼容性
 */
function testV3DataReadCompatibility(): TestResult[] {
  const results: TestResult[] = [];

  console.log('📝 测试用例 3：v3 数据读取兼容性\n');

  // 创建包含 v3 字段的数据
  try {
    console.log('  测试 3.1: 创建 v3 格式数据');
    const requirementsPath = join(TEST_DIR, '.intentbridge', 'requirements.yml');
    const raw = readFileSync(requirementsPath, 'utf-8');
    const data = yaml.load(raw) as any;

    // 添加 v3 字段
    data.requirements[0].features = [
      {
        id: 'F-001-1',
        name: '测试功能',
        description: 'v3 功能拆分',
        acceptance_criteria: ['标准1'],
        technical_constraints: [],
        estimated_hours: 2,
      },
    ];
    data.requirements[0].execution = {
      status: 'pending',
    };
    data.requirements[0].validation = {
      status: 'pending',
      match_score: 0,
      evidence: [],
    };

    writeFileSync(requirementsPath, yaml.dump(data, { lineWidth: -1 }));
    results.push({
      name: '创建 v3 格式数据',
      status: 'passed',
      message: '成功创建 v3 格式数据',
    });
    console.log('    ✅ 通过\n');
  } catch (error: any) {
    results.push({
      name: '创建 v3 格式数据',
      status: 'failed',
      message: error.message,
    });
    console.log(`    ❌ 失败: ${error.message}\n`);
  }

  // 测试 v2 命令读取 v3 数据
  try {
    console.log('  测试 3.2: v2 命令读取 v3 数据');
    const output = execSync('ib req list', { encoding: 'utf-8' });

    if (output.includes('REQ-001')) {
      results.push({
        name: 'v2 命令读取 v3 数据',
        status: 'passed',
        message: 'v2 命令可以读取 v3 数据',
      });
      console.log('    ✅ 通过\n');
    } else {
      throw new Error('v2 命令无法读取 v3 数据');
    }
  } catch (error: any) {
    results.push({
      name: 'v2 命令读取 v3 数据',
      status: 'failed',
      message: error.message,
    });
    console.log(`    ❌ 失败: ${error.message}\n`);
  }

  // 测试 v3 字段不被 v2 命令修改
  try {
    console.log('  测试 3.3: v2 命令不修改 v3 字段');
    const requirementsPath = join(TEST_DIR, '.intentbridge', 'requirements.yml');
    const rawBefore = readFileSync(requirementsPath, 'utf-8');
    const dataBefore = yaml.load(rawBefore) as any;
    const featuresBefore = dataBefore.requirements[0].features;

    // 使用 v2 命令更新
    execSync('ib req update REQ-001 --status implementing', { encoding: 'utf-8' });

    const rawAfter = readFileSync(requirementsPath, 'utf-8');
    const dataAfter = yaml.load(rawAfter) as any;
    const featuresAfter = dataAfter.requirements[0].features;

    // 验证 v3 字段未被修改
    if (JSON.stringify(featuresBefore) === JSON.stringify(featuresAfter)) {
      results.push({
        name: 'v2 命令不修改 v3 字段',
        status: 'passed',
        message: 'v2 命令不修改 v3 字段',
      });
      console.log('    ✅ 通过\n');
    } else {
      throw new Error('v2 命令修改了 v3 字段');
    }
  } catch (error: any) {
    results.push({
      name: 'v2 命令不修改 v3 字段',
      status: 'failed',
      message: error.message,
    });
    console.log(`    ❌ 失败: ${error.message}\n`);
  }

  return results;
}

/**
 * 主测试函数
 */
async function runTests(): Promise<void> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  IntentBridge v2/v3 兼容性测试');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const report: TestReport = {
    timestamp: new Date().toISOString(),
    total: 0,
    passed: 0,
    failed: 0,
    results: [],
  };

  try {
    // 创建测试环境
    setupTestEnv();

    // 运行测试
    const results1 = testV2Commands();
    const results2 = testDataFormatCompatibility();
    const results3 = testV3DataReadCompatibility();

    // 汇总结果
    report.results = [...results1, ...results2, ...results3];
    report.total = report.results.length;
    report.passed = report.results.filter((r) => r.status === 'passed').length;
    report.failed = report.results.filter((r) => r.status === 'failed').length;

    // 保存报告
    const reportPath = join(TEST_DIR, 'compatibility-test-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  测试结果汇总');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`  总测试数：${report.total}`);
    console.log(`  ✅ 通过：${report.passed}`);
    console.log(`  ❌ 失败：${report.failed}`);
    console.log(`\n  通过率：${((report.passed / report.total) * 100).toFixed(1)}%`);

    if (report.failed === 0) {
      console.log('\n  🎉 所有测试通过！');
    } else {
      console.log('\n  ⚠️  有测试失败，请检查');
    }

    console.log(`\n📄 测试报告：${reportPath}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 退出码
    process.exit(report.failed === 0 ? 0 : 1);
  } catch (error: any) {
    console.error('❌ 测试执行失败：', error.message);
    process.exit(1);
  } finally {
    // 清理测试环境
    cleanupTestEnv();
  }
}

// 执行测试
runTests();
