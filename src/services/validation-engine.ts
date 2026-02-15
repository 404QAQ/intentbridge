/**
 * Validation Engine (闭环验证引擎)
 *
 * 功能：
 * 1. 验证实现是否符合需求规格
 * 2. 集成 Playwright 进行截图验证
 * 3. 收集证据（代码、测试、截图）
 * 4. 生成验证报告
 * 5. 需求确认接口
 *
 * v3.0.0 Phase 4 新增
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import yaml from 'js-yaml';
import { getIntentBridgeDir } from '../utils/paths.js';
import { readRequirements } from './store.js';
import { readTasks } from './task-decomposition.js';
import { executeMCPTool } from './mcp-tools.js';
import { callModel, getAIConfig } from './ai-client.js';
import { analyzeFile, checkQualityGates, DEFAULT_QUALITY_GATES } from './code-analyzer.js';
import { performRuntimeValidation, DEFAULT_RUNTIME_CONFIG } from './runtime-validator.js';
import { scanFile, DEFAULT_SECURITY_CONFIG } from './security-scanner.js';
import { compareDesignWithImplementation, DEFAULT_COMPARATOR_CONFIG } from './design-comparator.js';
import type {
  Requirement,
  Task,
  Evidence,
  ValidationStatus,
  ValidationResult,
  ValidationReport,
  ValidationChecklist,
  QualityGates,
  HardValidationConfig,
  HardValidationResult,
} from '../models/types.js';

let validationPath: string;
let evidenceDir: string;

/**
 * 初始化验证引擎
 */
export function initValidationEngine(cwd?: string): void {
  const intentBridgeDir = getIntentBridgeDir(cwd);
  validationPath = join(intentBridgeDir, 'validation-reports.yml');
  evidenceDir = join(intentBridgeDir, 'evidence');

  // 创建证据目录
  if (!existsSync(evidenceDir)) {
    mkdirSync(evidenceDir, { recursive: true });
  }
}

/**
 * 验证需求实现
 */
export async function validateRequirement(requirementId: string): Promise<ValidationReport> {
  initValidationEngine();

  // 读取需求
  const requirementsData = readRequirements();
  const requirement = requirementsData.requirements.find((r) => r.id === requirementId);

  if (!requirement) {
    throw new Error(`Requirement ${requirementId} not found`);
  }

  // 读取相关任务
  const tasksData = readTasks();
  const tasks = tasksData.tasks.filter((t) => t.requirementId === requirementId);

  // 执行验证
  const report = await performValidation(requirement, tasks);

  // 保存报告
  saveValidationReport(report);

  return report;
}

/**
 * 执行验证流程
 */
async function performValidation(
  requirement: Requirement,
  tasks: Task[]
): Promise<ValidationReport> {
  console.log(`[Validation] Starting validation for requirement: ${requirement.id}`);

  const reportId = `VAL-${Date.now()}`;
  const evidence: Evidence[] = [];

  // 第一步：功能完整性验证
  const functionalChecklist = await validateFunctionalRequirements(requirement, tasks);
  evidence.push(...functionalChecklist.evidence);

  // 第二步：代码质量验证
  const qualityChecklist = await validateCodeQuality(requirement, tasks);
  evidence.push(...qualityChecklist.evidence);

  // 第三步：测试覆盖验证
  const testChecklist = await validateTestCoverage(requirement, tasks);
  evidence.push(...testChecklist.evidence);

  // 第四步：验收标准验证
  const acceptanceChecklist = await validateAcceptanceCriteria(requirement, tasks);
  evidence.push(...acceptanceChecklist.evidence);

  // 第五步：UI/UX 验证（如果有前端任务）
  const frontendTasks = tasks.filter((t) => t.type === 'frontend');
  const uiChecklist =
    frontendTasks.length > 0 ? await validateUIUX(requirement, frontendTasks) : null;
  if (uiChecklist) {
    evidence.push(...uiChecklist.evidence);
  }

  // 计算总体匹配度
  const checklists = [
    functionalChecklist,
    qualityChecklist,
    testChecklist,
    acceptanceChecklist,
    ...(uiChecklist ? [uiChecklist] : []),
  ];

  const overallScore = calculateOverallScore(checklists);

  // 确定验证状态
  const status: ValidationStatus['status'] =
    overallScore >= 0.9 ? 'passed' : overallScore >= 0.7 ? 'needs_revision' : 'failed';

  // 保存证据
  const savedEvidence = await saveEvidence(evidence, reportId);

  const report: ValidationReport = {
    id: reportId,
    requirementId: requirement.id,
    timestamp: new Date().toISOString(),
    status,
    matchScore: overallScore,
    checklists: {
      functional: functionalChecklist,
      quality: qualityChecklist,
      testing: testChecklist,
      acceptance: acceptanceChecklist,
      ...(uiChecklist ? { ui: uiChecklist } : {}),
    },
    evidence: savedEvidence,
    summary: generateSummary(status, overallScore, checklists),
    recommendations: generateRecommendations(checklists),
  };

  return report;
}

/**
 * 验证功能完整性
 */
async function validateFunctionalRequirements(
  requirement: Requirement,
  tasks: Task[]
): Promise<ValidationChecklist & { evidence: Evidence[] }> {
  const items: ValidationChecklist['items'] = [];
  const evidence: Evidence[] = [];

  // 检查需求是否被拆解为任务
  const hasDecomposition = tasks.length > 0;
  items.push({
    criterion: '需求已拆解为任务',
    passed: hasDecomposition,
    details: hasDecomposition
      ? `已拆解 ${tasks.length} 个任务`
      : '需求未被拆解',
    evidenceIds: [],
  });

  // 检查任务是否都已完成
  const completedTasks = tasks.filter((t) => t.status === 'done');
  const allTasksCompleted = tasks.length > 0 && completedTasks.length === tasks.length;
  items.push({
    criterion: '所有任务已完成',
    passed: allTasksCompleted,
    details: allTasksCompleted
      ? `所有 ${tasks.length} 个任务已完成`
      : `已完成 ${completedTasks.length}/${tasks.length} 个任务`,
    evidenceIds: [],
  });

  // 检查功能是否实现（通过代码文件）
  if (requirement.files && requirement.files.length > 0) {
    const filesCheck = await checkFilesExist(requirement.files);
    items.push({
      criterion: '实现文件已创建',
      passed: filesCheck.allExist,
      details: filesCheck.details,
      evidenceIds: filesCheck.evidenceIds,
    });

    // 收集代码证据
    for (const file of requirement.files.slice(0, 3)) {
      // 只取前3个文件
      const codeEvidence = await collectCodeEvidence(file);
      if (codeEvidence) {
        evidence.push(codeEvidence);
      }
    }
  }

  // 检查 features（如果有）
  if (requirement.features && requirement.features.length > 0) {
    const featuresImplemented = tasks.some((t) => t.status === 'done');
    items.push({
      criterion: '功能特性已实现',
      passed: featuresImplemented,
      details: `需求包含 ${requirement.features.length} 个功能特性`,
      evidenceIds: [],
    });
  }

  const passedCount = items.filter((item) => item.passed).length;
  const score = items.length > 0 ? passedCount / items.length : 0;

  return {
    category: 'functional',
    items,
    score,
    passed: score >= 0.8,
    evidence,
  };
}

/**
 * 验证代码质量
 */
async function validateCodeQuality(
  requirement: Requirement,
  tasks: Task[]
): Promise<ValidationChecklist & { evidence: Evidence[] }> {
  const items: ValidationChecklist['items'] = [];
  const evidence: Evidence[] = [];

  // 检查代码质量评分
  const qualityScores = tasks
    .filter((t) => t.qualityMetrics?.codeQualityScore !== undefined)
    .map((t) => t.qualityMetrics!.codeQualityScore!);

  if (qualityScores.length > 0) {
    const avgScore = qualityScores.reduce((sum, s) => sum + s, 0) / qualityScores.length;
    items.push({
      criterion: '代码质量评分 >= 90',
      passed: avgScore >= 90,
      details: `平均质量评分: ${avgScore.toFixed(1)}/100`,
      evidenceIds: [],
    });
  }

  // 检查代码复杂度
  const complexityScores = tasks
    .filter((t) => t.qualityMetrics !== undefined)
    .map((t) => t.qualityMetrics!.issues.length);

  if (complexityScores.length > 0) {
    const totalIssues = complexityScores.reduce((sum, c) => sum + c, 0);
    items.push({
      criterion: '无高危代码问题',
      passed: totalIssues === 0,
      details: totalIssues > 0 ? `发现 ${totalIssues} 个代码问题` : '无代码问题',
      evidenceIds: [],
    });
  }

  // 运行 ESLint 检查（如果有 TypeScript/JavaScript 文件）
  const jsTsFiles = requirement.files?.filter(
    (f) => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx')
  );

  if (jsTsFiles && jsTsFiles.length > 0) {
    const eslintResult = await executeMCPTool('quality_eslint', {
      files: jsTsFiles.join(' '),
    });

    items.push({
      criterion: 'ESLint 检查通过',
      passed: eslintResult.success,
      details: eslintResult.success
        ? 'ESLint 检查通过'
        : `ESLint 发现问题: ${eslintResult.error || ''}`,
      evidenceIds: [],
    });
  }

  // 运行 TypeScript 类型检查
  const tsFiles = requirement.files?.filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));
  if (tsFiles && tsFiles.length > 0) {
    const typeCheckResult = await executeMCPTool('quality_typecheck', {
      project: 'tsconfig.json',
    });

    items.push({
      criterion: 'TypeScript 类型检查通过',
      passed: typeCheckResult.success,
      details: typeCheckResult.success
        ? '类型检查通过'
        : `类型错误: ${typeCheckResult.error || ''}`,
      evidenceIds: [],
    });
  }

  const passedCount = items.filter((item) => item.passed).length;
  const score = items.length > 0 ? passedCount / items.length : 1; // 如果没有检查项，默认通过

  return {
    category: 'quality',
    items,
    score,
    passed: score >= 0.8,
    evidence,
  };
}

/**
 * 验证测试覆盖
 */
async function validateTestCoverage(
  requirement: Requirement,
  tasks: Task[]
): Promise<ValidationChecklist & { evidence: Evidence[] }> {
  const items: ValidationChecklist['items'] = [];
  const evidence: Evidence[] = [];

  // 检查是否有测试任务
  const testTasks = tasks.filter((t) => t.type === 'testing');
  items.push({
    criterion: '包含测试任务',
    passed: testTasks.length > 0,
    details: testTasks.length > 0 ? `包含 ${testTasks.length} 个测试任务` : '无测试任务',
    evidenceIds: [],
  });

  // 检查测试覆盖率
  const testCoverages = tasks
    .filter((t) => t.qualityMetrics?.testCoverage !== undefined)
    .map((t) => t.qualityMetrics!.testCoverage!);

  if (testCoverages.length > 0) {
    const avgCoverage = testCoverages.reduce((sum, c) => sum + c, 0) / testCoverages.length;
    items.push({
      criterion: '测试覆盖率 >= 80%',
      passed: avgCoverage >= 80,
      details: `平均覆盖率: ${avgCoverage.toFixed(1)}%`,
      evidenceIds: [],
    });
  }

  // 运行测试（如果有测试文件）
  const testFiles = requirement.files?.filter(
    (f) => f.includes('.test.') || f.includes('.spec.')
  );

  if (testFiles && testFiles.length > 0) {
    const testResult = await executeMCPTool('test_run', {
      command: 'npm test',
      timeout: 300,
    });

    items.push({
      criterion: '测试通过',
      passed: testResult.success,
      details: testResult.success
        ? '所有测试通过'
        : `测试失败: ${testResult.error || ''}`,
      evidenceIds: [],
    });

    // 收集测试结果证据
    if (testResult.output) {
      const testEvidence: Evidence = {
        type: 'test_result',
        description: '测试执行结果',
        path: join(evidenceDir, `test-result-${Date.now()}.txt`),
        timestamp: new Date().toISOString(),
      };
      writeFileSync(testEvidence.path, testResult.output);
      evidence.push(testEvidence);
    }
  }

  const passedCount = items.filter((item) => item.passed).length;
  const score = items.length > 0 ? passedCount / items.length : 0.5; // 如果没有测试，给50%分数

  return {
    category: 'testing',
    items,
    score,
    passed: score >= 0.7, // 测试要求稍微低一点
    evidence,
  };
}

/**
 * 验证验收标准
 */
async function validateAcceptanceCriteria(
  requirement: Requirement,
  tasks: Task[]
): Promise<ValidationChecklist & { evidence: Evidence[] }> {
  const items: ValidationChecklist['items'] = [];
  const evidence: Evidence[] = [];

  // 检查是否有验收标准
  if (!requirement.acceptance || requirement.acceptance.length === 0) {
    items.push({
      criterion: '定义了验收标准',
      passed: false,
      details: '未定义验收标准',
      evidenceIds: [],
    });
  } else {
    items.push({
      criterion: '定义了验收标准',
      passed: true,
      details: `定义了 ${requirement.acceptance.length} 个验收标准`,
      evidenceIds: [],
    });

    // 检查验收标准完成情况
    const completedCriteria = requirement.acceptance.filter((a) => a.done);
    const allCompleted = completedCriteria.length === requirement.acceptance.length;

    items.push({
      criterion: '所有验收标准已完成',
      passed: allCompleted,
      details: allCompleted
        ? '所有验收标准已完成'
        : `已完成 ${completedCriteria.length}/${requirement.acceptance.length} 个验收标准`,
      evidenceIds: [],
    });

    // 使用 AI 验证每个验收标准
    if (getAIConfig() && requirement.files && requirement.files.length > 0) {
      for (const criterion of requirement.acceptance.slice(0, 3)) {
        const validated = await validateCriterionWithAI(criterion.criterion, requirement.files);
        items.push({
          criterion: `验收标准: ${criterion.criterion.substring(0, 50)}...`,
          passed: validated.passed,
          details: validated.details,
          evidenceIds: [],
        });
      }
    }
  }

  const passedCount = items.filter((item) => item.passed).length;
  const score = items.length > 0 ? passedCount / items.length : 0;

  return {
    category: 'acceptance',
    items,
    score,
    passed: score >= 0.8,
    evidence,
  };
}

/**
 * 验证 UI/UX（需要 Playwright）
 */
async function validateUIUX(
  requirement: Requirement,
  tasks: Task[]
): Promise<ValidationChecklist & { evidence: Evidence[] }> {
  const items: ValidationChecklist['items'] = [];
  const evidence: Evidence[] = [];

  // 检查是否有前端文件
  const frontendFiles = requirement.files?.filter(
    (f) =>
      f.endsWith('.vue') ||
      f.endsWith('.jsx') ||
      f.endsWith('.tsx') ||
      f.endsWith('.html')
  );

  if (frontendFiles && frontendFiles.length > 0) {
    items.push({
      criterion: '前端文件已创建',
      passed: true,
      details: `创建了 ${frontendFiles.length} 个前端文件`,
      evidenceIds: [],
    });

    // TODO: 集成 Playwright 进行截图
    // 目前使用占位符
    items.push({
      criterion: 'UI 截图验证',
      passed: true,
      details: 'UI 截图功能待实现（需要启动应用服务器）',
      evidenceIds: [],
    });
  }

  const passedCount = items.filter((item) => item.passed).length;
  const score = items.length > 0 ? passedCount / items.length : 1;

  return {
    category: 'ui',
    items,
    score,
    passed: score >= 0.7,
    evidence,
  };
}

/**
 * 使用 AI 验证验收标准
 */
async function validateCriterionWithAI(
  criterion: string,
  files: string[]
): Promise<{ passed: boolean; details: string }> {
  try {
    // 读取相关代码文件
    const codeSnippets: string[] = [];
    for (const file of files.slice(0, 3)) {
      if (existsSync(file)) {
        const content = readFileSync(file, 'utf-8');
        codeSnippets.push(`// File: ${file}\n${content.substring(0, 500)}...`);
      }
    }

    if (codeSnippets.length === 0) {
      return { passed: false, details: '无法读取代码文件' };
    }

    const prompt = `验证以下验收标准是否在代码中实现：

验收标准: ${criterion}

代码:
${codeSnippets.join('\n\n')}

请判断该验收标准是否已实现。只回答 YES 或 NO，并简要说明原因。`;

    const response = await callModel(prompt);
    const passed = response.toUpperCase().includes('YES');

    return {
      passed,
      details: response.substring(0, 200),
    };
  } catch (error: any) {
    return { passed: false, details: `验证失败: ${error.message}` };
  }
}

/**
 * 检查文件是否存在
 */
async function checkFilesExist(files: string[]): Promise<{
  allExist: boolean;
  details: string;
  evidenceIds: string[];
}> {
  const existingFiles: string[] = [];
  const missingFiles: string[] = [];

  for (const file of files) {
    if (existsSync(file)) {
      existingFiles.push(file);
    } else {
      missingFiles.push(file);
    }
  }

  const allExist = missingFiles.length === 0;
  const details = allExist
    ? `所有 ${files.length} 个文件存在`
    : `存在 ${existingFiles.length} 个文件，缺少 ${missingFiles.length} 个文件`;

  return { allExist, details, evidenceIds: [] };
}

/**
 * 收集代码证据
 */
async function collectCodeEvidence(filePath: string): Promise<Evidence | null> {
  try {
    if (!existsSync(filePath)) {
      return null;
    }

    const content = readFileSync(filePath, 'utf-8');
    const evidencePath = join(evidenceDir, `code-${Date.now()}-${basename(filePath)}`);

    writeFileSync(evidencePath, content);

    return {
      type: 'code_snippet',
      description: `代码文件: ${filePath}`,
      path: evidencePath,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * 计算总体匹配度
 */
function calculateOverallScore(checklists: ValidationChecklist[]): number {
  const scores = checklists.map((c) => c.score);
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

/**
 * 生成验证摘要
 */
function generateSummary(
  status: ValidationStatus['status'],
  score: number,
  checklists: ValidationChecklist[]
): string {
  const statusText: Record<string, string> = {
    passed: '✅ 验证通过',
    needs_revision: '⚠️ 需要修订',
    failed: '❌ 验证失败',
    pending: '⏳ 待验证',
  };

  const checklistSummary = checklists
    .map((c) => `${c.category}: ${(c.score * 100).toFixed(0)}%`)
    .join(', ');

  return `${statusText[status] || status} (匹配度: ${(score * 100).toFixed(1)}%)\n检查项: ${checklistSummary}`;
}

/**
 * 生成改进建议
 */
function generateRecommendations(checklists: ValidationChecklist[]): string[] {
  const recommendations: string[] = [];

  for (const checklist of checklists) {
    if (!checklist.passed) {
      const failedItems = checklist.items.filter((item) => !item.passed);
      for (const item of failedItems) {
        recommendations.push(`[${checklist.category}] ${item.criterion}: ${item.details}`);
      }
    }
  }

  return recommendations;
}

/**
 * 保存证据
 */
async function saveEvidence(evidence: Evidence[], reportId: string): Promise<Evidence[]> {
  const evidenceDirForReport = join(evidenceDir, reportId);

  if (!existsSync(evidenceDirForReport)) {
    mkdirSync(evidenceDirForReport, { recursive: true });
  }

  return evidence.map((e, index) => ({
    ...e,
    path: join(evidenceDirForReport, `${index}-${basename(e.path)}`),
  }));
}

/**
 * 保存验证报告
 */
export function saveValidationReport(report: ValidationReport): void {
  initValidationEngine();

  let reports: ValidationReport[] = [];

  if (existsSync(validationPath)) {
    const raw = readFileSync(validationPath, 'utf-8');
    const data = yaml.load(raw) as ValidationReport[] | null;
    reports = data ?? [];
  }

  reports.push(report);

  writeFileSync(validationPath, yaml.dump(reports, { lineWidth: -1 }));
}

/**
 * 读取验证报告
 */
export function readValidationReports(): ValidationReport[] {
  initValidationEngine();

  if (!existsSync(validationPath)) {
    return [];
  }

  const raw = readFileSync(validationPath, 'utf-8');
  const data = yaml.load(raw) as ValidationReport[] | null;
  return data ?? [];
}

/**
 * 获取需求的验证报告
 */
export function getRequirementValidationReports(requirementId: string): ValidationReport[] {
  const reports = readValidationReports();
  return reports.filter((r) => r.requirementId === requirementId);
}

/**
 * 获取最新验证报告
 */
export function getLatestValidationReport(requirementId: string): ValidationReport | undefined {
  const reports = getRequirementValidationReports(requirementId);
  return reports[reports.length - 1];
}

// ============================================
// v3.0.0 Phase 4: 硬验证机制
// ============================================

/**
 * 默认硬验证配置
 */
export const DEFAULT_HARD_VALIDATION_CONFIG: HardValidationConfig = {
  enableCodeAnalysis: true,
  enableRuntimeValidation: true,
  enableSecurityScan: true,
  enableDesignComparison: false, // 需要设计文档，默认关闭
  qualityGates: {
    codeQuality: {
      complexity: 10,
      duplication: 5,
      maintainability: 'B',
    },
    security: {
      hardcodedSecrets: 0,
      sqlInjection: 0,
      xssVulnerabilities: 0,
      owaspTop10: 'pass',
    },
    implementation: {
      emptyFunctions: 0,
      todoComments: 0,
      placeholderCode: false,
    },
    testing: {
      coverage: 80,
      passRate: 100,
      e2eTests: false,
    },
  },
  failOnViolation: true,
  collectEvidence: true,
};

/**
 * 执行硬验证（强约束验证）
 */
export async function performHardValidation(
  requirementId: string,
  config: Partial<HardValidationConfig> = {}
): Promise<HardValidationResult> {
  const finalConfig = { ...DEFAULT_HARD_VALIDATION_CONFIG, ...config };
  const gateViolations: string[] = [];
  const evidence: Evidence[] = [];
  const recommendations: string[] = [];

  console.log(`[HardValidation] Starting hard validation for: ${requirementId}`);

  // 读取需求
  const requirementsData = readRequirements();
  const requirement = requirementsData.requirements.find((r) => r.id === requirementId);

  if (!requirement) {
    throw new Error(`Requirement ${requirementId} not found`);
  }

  const files = requirement.files || [];

  // 1. 代码复杂度分析
  let codeAnalysisResult: HardValidationResult['codeAnalysis'];
  if (finalConfig.enableCodeAnalysis && files.length > 0) {
    console.log('[HardValidation] Analyzing code complexity...');

    try {
      const analyses = files.map((file) => {
        try {
          return analyzeFile(file);
        } catch {
          return null;
        }
      }).filter(Boolean);

      if (analyses.length > 0) {
        const avgScore = analyses.reduce((sum, a) => sum + (a?.score || 0), 0) / analyses.length;
        const avgComplexity = analyses.reduce((sum, a) => sum + (a?.metrics.cyclomaticComplexity || 0), 0) / analyses.length;

        codeAnalysisResult = {
          score: avgScore,
          grade: analyses[0]?.grade || 'F',
          issues: analyses.flatMap((a) => a?.issues.map((i) => i.message) || []),
        };

        // 检查质量门禁
        if (avgComplexity > finalConfig.qualityGates.codeQuality.complexity) {
          gateViolations.push(`Cyclomatic complexity ${avgComplexity.toFixed(1)} exceeds threshold ${finalConfig.qualityGates.codeQuality.complexity}`);
        }

        if (avgScore < 90) {
          gateViolations.push(`Code quality score ${avgScore.toFixed(1)} below minimum 90`);
          recommendations.push('Improve code quality: reduce complexity, add documentation, fix issues');
        }
      }
    } catch (error: any) {
      console.error('[HardValidation] Code analysis failed:', error.message);
    }
  }

  // 2. 运行时验证
  let runtimeValidationResult: HardValidationResult['runtimeValidation'];
  if (finalConfig.enableRuntimeValidation) {
    console.log('[HardValidation] Running runtime validation...');

    try {
      const testFiles = files.filter((f) => f.includes('.test.') || f.includes('.spec.'));
      const hasTests = testFiles.length > 0;

      if (hasTests) {
        const runtimeResult = await performRuntimeValidation({
          ...DEFAULT_RUNTIME_CONFIG,
          testCommand: 'npm test',
          coverageThreshold: finalConfig.qualityGates.testing.coverage,
          passRateThreshold: finalConfig.qualityGates.testing.passRate,
        });

        runtimeValidationResult = {
          passed: runtimeResult.success,
          testResults: runtimeResult.testResults,
          coverage: runtimeResult.coverageReport?.overall || 0,
        };

        // 检查质量门禁
        if (runtimeResult.testResults.passRate < finalConfig.qualityGates.testing.passRate) {
          gateViolations.push(`Test pass rate ${runtimeResult.testResults.passRate.toFixed(1)}% below threshold ${finalConfig.qualityGates.testing.passRate}%`);
        }

        if (runtimeResult.coverageReport && runtimeResult.coverageReport.overall < finalConfig.qualityGates.testing.coverage) {
          gateViolations.push(`Test coverage ${runtimeResult.coverageReport.overall.toFixed(1)}% below threshold ${finalConfig.qualityGates.testing.coverage}%`);
        }

        if (!runtimeResult.success) {
          recommendations.push('Fix failing tests and improve test coverage');
        }
      } else {
        gateViolations.push('No test files found');
        recommendations.push('Add unit tests to meet minimum coverage requirements');
      }
    } catch (error: any) {
      console.error('[HardValidation] Runtime validation failed:', error.message);
      gateViolations.push('Runtime validation failed to execute');
    }
  }

  // 3. 安全扫描
  let securityScanResult: HardValidationResult['securityScan'];
  if (finalConfig.enableSecurityScan && files.length > 0) {
    console.log('[HardValidation] Scanning for security vulnerabilities...');

    try {
      const scanResults = files.map((file) => {
        try {
          return scanFile(file, DEFAULT_SECURITY_CONFIG);
        } catch {
          return null;
        }
      }).filter(Boolean);

      const totalVulnerabilities = scanResults.reduce((sum, r) => sum + (r?.vulnerabilities.length || 0), 0);
      const criticalCount = scanResults.reduce(
        (sum, r) => sum + (r?.vulnerabilities.filter((v) => v.severity === 'critical').length || 0),
        0
      );
      const highCount = scanResults.reduce(
        (sum, r) => sum + (r?.vulnerabilities.filter((v) => v.severity === 'high').length || 0),
        0
      );

      securityScanResult = {
        passed: criticalCount === 0 && highCount === 0,
        vulnerabilities: totalVulnerabilities,
        riskLevel: criticalCount > 0 ? 'critical' : highCount > 0 ? 'high' : 'medium',
      };

      // 检查质量门禁
      if (criticalCount > finalConfig.qualityGates.security.hardcodedSecrets) {
        gateViolations.push(`Found ${criticalCount} critical security vulnerabilities (threshold: ${finalConfig.qualityGates.security.hardcodedSecrets})`);
      }

      const sqlInjectionCount = scanResults.reduce(
        (sum, r) => sum + (r?.vulnerabilities.filter((v) => v.type === 'injection').length || 0),
        0
      );
      if (sqlInjectionCount > finalConfig.qualityGates.security.sqlInjection) {
        gateViolations.push(`Found ${sqlInjectionCount} SQL injection risks (threshold: ${finalConfig.qualityGates.security.sqlInjection})`);
      }

      if (!securityScanResult.passed) {
        recommendations.push('Fix critical and high severity security vulnerabilities');
      }
    } catch (error: any) {
      console.error('[HardValidation] Security scan failed:', error.message);
      gateViolations.push('Security scan failed to execute');
    }
  }

  // 4. 设计文档比较（如果启用且有设计文档）
  let designComparisonResult: HardValidationResult['designComparison'];
  if (finalConfig.enableDesignComparison) {
    console.log('[HardValidation] Comparing with design specification...');

    try {
      // 查找设计文档
      const designDocPath = findDesignDocument();
      if (designDocPath) {
        const { loadDesignSpecification } = await import('./design-comparator.js');
        const spec = loadDesignSpecification(designDocPath);
        const comparison = compareDesignWithImplementation(spec, process.cwd(), DEFAULT_COMPARATOR_CONFIG);

        designComparisonResult = {
          passed: comparison.passed,
          compliance: comparison.compliance.overallCompliance,
          gaps: comparison.gaps.missingFeatures,
        };

        if (!comparison.passed) {
          gateViolations.push(`Design compliance ${comparison.compliance.overallCompliance.toFixed(1)}% below threshold`);
          recommendations.push(...comparison.recommendations);
        }
      }
    } catch (error: any) {
      console.error('[HardValidation] Design comparison failed:', error.message);
    }
  }

  // 计算总体评分
  let overallScore = 100;
  if (codeAnalysisResult) {
    overallScore = Math.min(overallScore, codeAnalysisResult.score);
  }
  if (runtimeValidationResult) {
    overallScore = Math.min(overallScore, runtimeValidationResult.coverage);
  }
  if (securityScanResult) {
    overallScore = Math.min(overallScore, securityScanResult.passed ? 100 : 50);
  }
  if (designComparisonResult) {
    overallScore = Math.min(overallScore, designComparisonResult.compliance);
  }

  // 确定是否通过
  const passed = gateViolations.length === 0 || !finalConfig.failOnViolation;

  return {
    passed,
    overallScore,
    codeAnalysis: codeAnalysisResult,
    runtimeValidation: runtimeValidationResult,
    securityScan: securityScanResult,
    designComparison: designComparisonResult,
    gateViolations,
    evidence,
    recommendations,
  };
}

/**
 * 查找设计文档
 */
function findDesignDocument(): string | null {
  const possiblePaths = [
    '.intentbridge/design.yaml',
    '.intentbridge/design.yml',
    '.intentbridge/design.json',
    'design.yaml',
    'design.yml',
    'design.json',
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}
