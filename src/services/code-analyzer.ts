/**
 * Code Complexity Analyzer (代码复杂度分析器)
 *
 * 功能：
 * 1. 解析 TypeScript/JavaScript 代码
 * 2. 计算圈复杂度 (Cyclomatic Complexity)
 * 3. 检测常见反模式
 * 4. 生成质量评分
 *
 * v3.0.0 Phase 4 新增 - 硬验证机制
 */

import { readFileSync, existsSync } from 'node:fs';
import { extname } from 'node:path';

/**
 * 复杂度分析结果
 */
export interface ComplexityAnalysis {
  filePath: string;
  language: string;
  metrics: {
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    linesOfCode: number;
    maintainabilityIndex: number;
    halsteadVolume?: number;
  };
  issues: CodeIssue[];
  antiPatterns: AntiPattern[];
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

/**
 * 代码问题
 */
export interface CodeIssue {
  type: 'complexity' | 'maintainability' | 'security' | 'performance' | 'style';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  line?: number;
  column?: number;
  rule: string;
  suggestion?: string;
}

/**
 * 反模式检测
 */
export interface AntiPattern {
  type: AntiPatternType;
  description: string;
  line?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export type AntiPatternType =
  | 'hardcoded_credentials'
  | 'empty_function'
  | 'missing_error_handling'
  | 'sql_injection_risk'
  | 'missing_input_validation'
  | 'console_log_in_production'
  | 'any_type_abuse'
  | 'magic_numbers'
  | 'deeply_nested_code'
  | 'long_function'
  | 'god_object'
  | 'premature_optimization'
  | 'copy_paste_code'
  | 'spaghetti_code'
  | 'placeholder_code';

/**
 * 质量门禁
 */
export interface QualityGates {
  maxCyclomaticComplexity: number; // ≤ 10
  maxCognitiveComplexity: number; // ≤ 15
  minMaintainabilityIndex: number; // ≥ 65
  maxLinesOfCode: number; // ≤ 500 per file
  minScore: number; // ≥ 90
  allowedGrade: ('A' | 'B' | 'C' | 'D' | 'F')[];
}

/**
 * 默认质量门禁
 */
export const DEFAULT_QUALITY_GATES: QualityGates = {
  maxCyclomaticComplexity: 10,
  maxCognitiveComplexity: 15,
  minMaintainabilityIndex: 65,
  maxLinesOfCode: 500,
  minScore: 90,
  allowedGrade: ['A', 'B'],
};

/**
 * 分析文件复杂度
 */
export function analyzeFile(filePath: string): ComplexityAnalysis {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = readFileSync(filePath, 'utf-8');
  const ext = extname(filePath);
  const language = detectLanguage(ext);

  const metrics = calculateMetrics(content, language);
  const issues = detectIssues(content, language);
  const antiPatterns = detectAntiPatterns(content, language);

  const score = calculateScore(metrics, issues, antiPatterns);
  const grade = calculateGrade(score);

  return {
    filePath,
    language,
    metrics,
    issues,
    antiPatterns,
    score,
    grade,
  };
}

/**
 * 分析多个文件
 */
export function analyzeFiles(filePaths: string[]): ComplexityAnalysis[] {
  return filePaths.map((file) => {
    try {
      return analyzeFile(file);
    } catch (error: any) {
      // 返回失败的分析
      return {
        filePath: file,
        language: 'unknown',
        metrics: {
          cyclomaticComplexity: 0,
          cognitiveComplexity: 0,
          linesOfCode: 0,
          maintainabilityIndex: 0,
        },
        issues: [
          {
            type: 'maintainability',
            severity: 'critical',
            message: `Failed to analyze file: ${error.message}`,
            rule: 'analysis-failed',
          },
        ],
        antiPatterns: [],
        score: 0,
        grade: 'F',
      };
    }
  });
}

/**
 * 检查是否通过质量门禁
 */
export function checkQualityGates(
  analysis: ComplexityAnalysis,
  gates: QualityGates = DEFAULT_QUALITY_GATES
): { passed: boolean; violations: string[] } {
  const violations: string[] = [];

  // 检查圈复杂度
  if (analysis.metrics.cyclomaticComplexity > gates.maxCyclomaticComplexity) {
    violations.push(
      `Cyclomatic complexity ${analysis.metrics.cyclomaticComplexity} exceeds maximum ${gates.maxCyclomaticComplexity}`
    );
  }

  // 检查认知复杂度
  if (analysis.metrics.cognitiveComplexity > gates.maxCognitiveComplexity) {
    violations.push(
      `Cognitive complexity ${analysis.metrics.cognitiveComplexity} exceeds maximum ${gates.maxCognitiveComplexity}`
    );
  }

  // 检查可维护性指数
  if (analysis.metrics.maintainabilityIndex < gates.minMaintainabilityIndex) {
    violations.push(
      `Maintainability index ${analysis.metrics.maintainabilityIndex} below minimum ${gates.minMaintainabilityIndex}`
    );
  }

  // 检查代码行数
  if (analysis.metrics.linesOfCode > gates.maxLinesOfCode) {
    violations.push(
      `Lines of code ${analysis.metrics.linesOfCode} exceeds maximum ${gates.maxLinesOfCode}`
    );
  }

  // 检查质量评分
  if (analysis.score < gates.minScore) {
    violations.push(`Quality score ${analysis.score} below minimum ${gates.minScore}`);
  }

  // 检查等级
  if (!gates.allowedGrade.includes(analysis.grade)) {
    violations.push(`Grade ${analysis.grade} not in allowed grades: ${gates.allowedGrade.join(', ')}`);
  }

  // 检查严重问题
  const criticalIssues = analysis.issues.filter((i) => i.severity === 'critical');
  if (criticalIssues.length > 0) {
    violations.push(`Found ${criticalIssues.length} critical issues`);
  }

  // 检查高危反模式
  const criticalPatterns = analysis.antiPatterns.filter((p) => p.severity === 'critical');
  if (criticalPatterns.length > 0) {
    violations.push(`Found ${criticalPatterns.length} critical anti-patterns`);
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

/**
 * 计算代码指标
 */
function calculateMetrics(
  content: string,
  language: string
): ComplexityAnalysis['metrics'] {
  const lines = content.split('\n');
  const linesOfCode = lines.filter((line) => line.trim().length > 0).length;

  // 计算圈复杂度
  const cyclomaticComplexity = calculateCyclomaticComplexity(content, language);

  // 计算认知复杂度
  const cognitiveComplexity = calculateCognitiveComplexity(content, language);

  // 计算可维护性指数 (简化版)
  const maintainabilityIndex = calculateMaintainabilityIndex(
    linesOfCode,
    cyclomaticComplexity
  );

  return {
    cyclomaticComplexity,
    cognitiveComplexity,
    linesOfCode,
    maintainabilityIndex,
  };
}

/**
 * 计算圈复杂度
 */
function calculateCyclomaticComplexity(content: string, language: string): number {
  let complexity = 1; // 基础复杂度

  // 检测决策点
  const patterns = [
    /\bif\s*\(/g, // if 语句
    /\belse\s+if\s*\(/g, // else if
    /\bfor\s*\(/g, // for 循环
    /\bwhile\s*\(/g, // while 循环
    /\bcase\s+/g, // switch case
    /\bcatch\s*\(/g, // catch
    /\?\s*[^:]+\s*:/g, // 三元运算符
    /&&/g, // 逻辑与
    /\|\|/g, // 逻辑或
  ];

  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  }

  return complexity;
}

/**
 * 计算认知复杂度
 */
function calculateCognitiveComplexity(content: string, language: string): number {
  let complexity = 0;
  const lines = content.split('\n');
  let nestingLevel = 0;

  for (const line of lines) {
    // 增加嵌套级别
    if (/\b(if|for|while|switch|try)\s*[\(\{]/.test(line)) {
      complexity += 1 + nestingLevel;
      nestingLevel++;
    }
    // 减少嵌套级别
    else if (/[\}]\s*$/.test(line) && nestingLevel > 0) {
      nestingLevel--;
    }
    // else if 增加复杂度
    else if (/\belse\s+if\b/.test(line)) {
      complexity += 1;
    }
  }

  return complexity;
}

/**
 * 计算可维护性指数
 * 简化版，基于行数和圈复杂度
 */
function calculateMaintainabilityIndex(loc: number, cc: number): number {
  // 可维护性指数公式（简化版）
  // 原始公式更复杂，这里使用简化版本
  const volume = Math.log(loc + 1);
  const maintainability = Math.max(0, (171 - 5.2 * volume - 0.23 * cc - 16.2) * 100 / 171);
  return Math.min(100, maintainability);
}

/**
 * 检测代码问题
 */
function detectIssues(content: string, language: string): CodeIssue[] {
  const issues: CodeIssue[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // 检测 console.log
    if (/console\.(log|debug|info|warn|error)/.test(line)) {
      issues.push({
        type: 'style',
        severity: 'low',
        message: 'Console statement should be removed in production',
        line: index + 1,
        rule: 'no-console',
        suggestion: 'Remove console statement or use a logging library',
      });
    }

    // 检测 any 类型（TypeScript）
    if (language === 'typescript' && /:\s*any\b/.test(line)) {
      issues.push({
        type: 'maintainability',
        severity: 'medium',
        message: 'Usage of "any" type defeats type checking',
        line: index + 1,
        rule: 'no-explicit-any',
        suggestion: 'Use a more specific type',
      });
    }

    // 检测 var 声明
    if (/\bvar\s+/.test(line)) {
      issues.push({
        type: 'style',
        severity: 'medium',
        message: 'Use "const" or "let" instead of "var"',
        line: index + 1,
        rule: 'no-var',
        suggestion: 'Replace "var" with "const" or "let"',
      });
    }

    // 检测长行
    if (line.length > 120) {
      issues.push({
        type: 'style',
        severity: 'low',
        message: 'Line exceeds 120 characters',
        line: index + 1,
        rule: 'max-line-length',
        suggestion: 'Break line into multiple lines',
      });
    }
  });

  // 检测重复代码（简化版）
  const codeBlocks = content.split(/\n\n+/);
  const seen = new Map<string, number>();
  codeBlocks.forEach((block, index) => {
    const normalized = block.trim();
    if (normalized.length > 50) {
      if (seen.has(normalized)) {
        issues.push({
          type: 'maintainability',
          severity: 'medium',
          message: 'Duplicate code block detected',
          line: content.split('\n').findIndex((l) => l.includes(normalized.split('\n')[0])) + 1,
          rule: 'no-duplicate-code',
          suggestion: 'Extract duplicated code into a reusable function',
        });
      } else {
        seen.set(normalized, index);
      }
    }
  });

  return issues;
}

/**
 * 检测反模式
 */
function detectAntiPatterns(content: string, language: string): AntiPattern[] {
  const antiPatterns: AntiPattern[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // 检测硬编码凭证
    if (/(password|passwd|pwd|secret|api[_-]?key)\s*[=:]\s*['"][^'"]+['"]/i.test(line)) {
      antiPatterns.push({
        type: 'hardcoded_credentials',
        description: 'Hardcoded credential detected',
        line: index + 1,
        severity: 'critical',
      });
    }

    // 检测空函数
    if (/function\s+\w+\s*\([^)]*\)\s*\{\s*\}/.test(line)) {
      antiPatterns.push({
        type: 'empty_function',
        description: 'Empty function body',
        line: index + 1,
        severity: 'medium',
      });
    }

    // 检测 SQL 注入风险
    if (/(\+\s*['"]*SELECT|SELECT.*\+)/i.test(line)) {
      antiPatterns.push({
        type: 'sql_injection_risk',
        description: 'Potential SQL injection vulnerability',
        line: index + 1,
        severity: 'critical',
      });
    }

    // 检测 console.log
    if (/console\.log/.test(line)) {
      antiPatterns.push({
        type: 'console_log_in_production',
        description: 'Console.log should be removed in production',
        line: index + 1,
        severity: 'low',
      });
    }

    // 检测 TODO/FIXME/HACK
    if (/(TODO|FIXME|HACK|XXX):/.test(line)) {
      antiPatterns.push({
        type: 'placeholder_code',
        description: 'TODO/FIXME comment detected',
        line: index + 1,
        severity: 'low',
      });
    }
  });

  // 检测缺少错误处理
  if (/\basync\s+function|\bfunction\s+async/.test(content)) {
    if (!content.includes('try {') && !content.includes('catch (')) {
      antiPatterns.push({
        type: 'missing_error_handling',
        description: 'Async function without error handling',
        severity: 'high',
      });
    }
  }

  // 检测深层嵌套
  let maxNesting = 0;
  let currentNesting = 0;
  lines.forEach((line) => {
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    currentNesting += opens - closes;
    maxNesting = Math.max(maxNesting, currentNesting);
  });

  if (maxNesting > 4) {
    antiPatterns.push({
      type: 'deeply_nested_code',
      description: `Code is deeply nested (${maxNesting} levels)`,
      severity: 'high',
    });
  }

  // 检测长函数
  const functionMatches = content.match(/function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?\n\}/g);
  if (functionMatches) {
    functionMatches.forEach((func) => {
      const lines = func.split('\n').length;
      if (lines > 50) {
        antiPatterns.push({
          type: 'long_function',
          description: `Function is too long (${lines} lines)`,
          severity: 'medium',
        });
      }
    });
  }

  return antiPatterns;
}

/**
 * 计算质量评分
 */
function calculateScore(
  metrics: ComplexityAnalysis['metrics'],
  issues: CodeIssue[],
  antiPatterns: AntiPattern[]
): number {
  let score = 100;

  // 基于圈复杂度扣分
  if (metrics.cyclomaticComplexity > 10) {
    score -= Math.min(20, (metrics.cyclomaticComplexity - 10) * 2);
  }

  // 基于认知复杂度扣分
  if (metrics.cognitiveComplexity > 15) {
    score -= Math.min(15, (metrics.cognitiveComplexity - 15) * 1.5);
  }

  // 基于可维护性指数扣分
  if (metrics.maintainabilityIndex < 65) {
    score -= Math.min(20, (65 - metrics.maintainabilityIndex) * 0.5);
  }

  // 基于问题扣分
  issues.forEach((issue) => {
    switch (issue.severity) {
      case 'critical':
        score -= 10;
        break;
      case 'high':
        score -= 5;
        break;
      case 'medium':
        score -= 2;
        break;
      case 'low':
        score -= 0.5;
        break;
    }
  });

  // 基于反模式扣分
  antiPatterns.forEach((pattern) => {
    switch (pattern.severity) {
      case 'critical':
        score -= 15;
        break;
      case 'high':
        score -= 8;
        break;
      case 'medium':
        score -= 4;
        break;
      case 'low':
        score -= 1;
        break;
    }
  });

  return Math.max(0, Math.min(100, score));
}

/**
 * 计算等级
 */
function calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * 检测编程语言
 */
function detectLanguage(ext: string): string {
  const languageMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.py': 'python',
    '.java': 'java',
    '.go': 'go',
    '.rb': 'ruby',
    '.php': 'php',
    '.cs': 'csharp',
    '.cpp': 'cpp',
    '.c': 'c',
  };

  return languageMap[ext.toLowerCase()] || 'unknown';
}
