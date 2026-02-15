/**
 * Design Comparator (设计文档比较器)
 *
 * 功能：
 * 1. 解析设计规范
 * 2. 提取必需功能
 * 3. 与实际实现比较
 * 4. 生成合规性报告
 * 5. 验证设计符合度
 *
 * v3.0.0 Phase 4 新增 - 硬验证机制
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import yaml from 'js-yaml';

/**
 * 设计规范
 */
export interface DesignSpecification {
  id: string;
  name: string;
  version: string;
  description: string;
  requirements: DesignRequirement[];
  features: DesignFeature[];
  constraints: DesignConstraint[];
  metadata?: Record<string, any>;
}

/**
 * 设计需求
 */
export interface DesignRequirement {
  id: string;
  category: 'functional' | 'non-functional' | 'technical' | 'business';
  description: string;
  priority: 'must' | 'should' | 'could' | 'wont';
  acceptance_criteria: string[];
  dependencies?: string[];
}

/**
 * 设计功能
 */
export interface DesignFeature {
  id: string;
  name: string;
  description: string;
  user_stories: string[];
  technical_specs?: string[];
  priority: 'P0' | 'P1' | 'P2' | 'P3';
}

/**
 * 设计约束
 */
export interface DesignConstraint {
  type: 'technical' | 'business' | 'regulatory' | 'performance';
  description: string;
  impact: string;
  mitigation?: string;
}

/**
 * 实现分析
 */
export interface ImplementationAnalysis {
  files: AnalyzedFile[];
  functions: ImplementedFunction[];
  classes: ImplementedClass[];
  interfaces: ImplementedInterface[];
  features: ImplementedFeature[];
}

/**
 * 分析的文件
 */
export interface AnalyzedFile {
  path: string;
  type: 'module' | 'test' | 'config' | 'documentation';
  language: string;
  linesOfCode: number;
  exports: string[];
  imports: string[];
}

/**
 * 实现的函数
 */
export interface ImplementedFunction {
  name: string;
  file: string;
  line: number;
  parameters: string[];
  returnType?: string;
  exported: boolean;
  documented: boolean;
}

/**
 * 实现的类
 */
export interface ImplementedClass {
  name: string;
  file: string;
  line: number;
  methods: string[];
  properties: string[];
  exported: boolean;
  documented: boolean;
}

/**
 * 实现的接口
 */
export interface ImplementedInterface {
  name: string;
  file: string;
  line: number;
  properties: string[];
  methods: string[];
}

/**
 * 实现的功能
 */
export interface ImplementedFeature {
  name: string;
  files: string[];
  functions: string[];
  classes: string[];
  testCoverage?: number;
}

/**
 * 比较结果
 */
export interface ComparisonResult {
  specification: DesignSpecification;
  implementation: ImplementationAnalysis;
  compliance: ComplianceReport;
  gaps: GapAnalysis;
  recommendations: string[];
  overallScore: number; // 0-100
  passed: boolean;
}

/**
 * 合规性报告
 */
export interface ComplianceReport {
  totalRequirements: number;
  implementedRequirements: number;
  partialRequirements: number;
  missingRequirements: number;
  requirements: RequirementCompliance[];
  overallCompliance: number; // 0-100
}

/**
 * 需求合规性
 */
export interface RequirementCompliance {
  requirement: DesignRequirement;
  status: 'implemented' | 'partial' | 'missing' | 'exceeded';
  evidence: string[];
  gaps: string[];
  score: number; // 0-100
}

/**
 * 差距分析
 */
export interface GapAnalysis {
  missingFeatures: string[];
  incompleteFeatures: string[];
  extraFeatures: string[];
  constraintViolations: string[];
  technicalDebt: string[];
}

/**
 * 比较配置
 */
export interface ComparatorConfig {
  minComplianceScore: number; // 默认 80
  failOnMissingMust: boolean; // 默认 true
  failOnMissingShould: boolean; // 默认 false
  requireDocumentation: boolean; // 默认 false
  requireTests: boolean; // 默认 false
}

/**
 * 默认比较配置
 */
export const DEFAULT_COMPARATOR_CONFIG: ComparatorConfig = {
  minComplianceScore: 80,
  failOnMissingMust: true,
  failOnMissingShould: false,
  requireDocumentation: false,
  requireTests: false,
};

/**
 * 从文件加载设计规范
 */
export function loadDesignSpecification(filePath: string): DesignSpecification {
  if (!existsSync(filePath)) {
    throw new Error(`Design specification file not found: ${filePath}`);
  }

  const content = readFileSync(filePath, 'utf-8');
  const ext = filePath.split('.').pop()?.toLowerCase();

  if (ext === 'yaml' || ext === 'yml') {
    return yaml.load(content) as DesignSpecification;
  } else if (ext === 'json') {
    return JSON.parse(content);
  } else {
    throw new Error(`Unsupported specification format: ${ext}`);
  }
}

/**
 * 比较设计与实现
 */
export function compareDesignWithImplementation(
  specification: DesignSpecification,
  codebasePath: string,
  config: ComparatorConfig = DEFAULT_COMPARATOR_CONFIG
): ComparisonResult {
  console.log(`[DesignComparator] Analyzing codebase: ${codebasePath}`);

  // 分析实现
  const implementation = analyzeImplementation(codebasePath);

  // 检查合规性
  const compliance = checkCompliance(specification, implementation);

  // 分析差距
  const gaps = analyzeGaps(specification, implementation, compliance);

  // 生成建议
  const recommendations = generateRecommendations(compliance, gaps);

  // 计算总体评分
  const overallScore = calculateOverallScore(compliance, gaps);

  // 确定是否通过
  const passed = checkPassed(compliance, gaps, config);

  return {
    specification,
    implementation,
    compliance,
    gaps,
    recommendations,
    overallScore,
    passed,
  };
}

/**
 * 分析实现
 */
function analyzeImplementation(codebasePath: string): ImplementationAnalysis {
  const files = analyzeFiles(codebasePath);
  const functions = extractFunctions(files);
  const classes = extractClasses(files);
  const interfaces = extractInterfaces(files);
  const features = identifyFeatures(files, functions, classes);

  return {
    files,
    functions,
    classes,
    interfaces,
    features,
  };
}

/**
 * 分析文件
 */
function analyzeFiles(codebasePath: string): AnalyzedFile[] {
  const files: AnalyzedFile[] = [];

  function traverse(dirPath: string) {
    const items = readdirSync(dirPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = join(dirPath, item.name);

      if (item.isDirectory()) {
        if (item.name !== 'node_modules' && !item.name.startsWith('.')) {
          traverse(fullPath);
        }
      } else if (item.isFile()) {
        const ext = item.name.split('.').pop()?.toLowerCase();
        if (['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'go'].includes(ext || '')) {
          try {
            const content = readFileSync(fullPath, 'utf-8');
            const linesOfCode = content.split('\n').filter((l) => l.trim().length > 0).length;

            files.push({
              path: fullPath,
              type: determineFileType(item.name),
              language: ext || 'unknown',
              linesOfCode,
              exports: extractExports(content),
              imports: extractImports(content),
            });
          } catch (error) {
            // 跳过无法读取的文件
          }
        }
      }
    }
  }

  traverse(codebasePath);
  return files;
}

/**
 * 提取函数
 */
function extractFunctions(files: AnalyzedFile[]): ImplementedFunction[] {
  const functions: ImplementedFunction[] = [];

  for (const file of files) {
    if (!['ts', 'tsx', 'js', 'jsx'].includes(file.language)) continue;

    try {
      const content = readFileSync(file.path, 'utf-8');
      const lines = content.split('\n');

      // 简化的函数提取（使用正则）
      lines.forEach((line, index) => {
        // 函数声明
        const funcMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/);
        if (funcMatch) {
          functions.push({
            name: funcMatch[1],
            file: file.path,
            line: index + 1,
            parameters: funcMatch[2].split(',').map((p) => p.trim()).filter((p) => p),
            exported: line.includes('export'),
            documented: index > 0 && lines[index - 1].includes('/**'),
          });
        }

        // 箭头函数
        const arrowMatch = line.match(/(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/);
        if (arrowMatch) {
          functions.push({
            name: arrowMatch[1],
            file: file.path,
            line: index + 1,
            parameters: arrowMatch[2].split(',').map((p) => p.trim()).filter((p) => p),
            exported: line.includes('export'),
            documented: index > 0 && lines[index - 1].includes('/**'),
          });
        }
      });
    } catch (error) {
      // 跳过
    }
  }

  return functions;
}

/**
 * 提取类
 */
function extractClasses(files: AnalyzedFile[]): ImplementedClass[] {
  const classes: ImplementedClass[] = [];

  for (const file of files) {
    if (!['ts', 'tsx', 'js', 'jsx'].includes(file.language)) continue;

    try {
      const content = readFileSync(file.path, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const classMatch = line.match(/(?:export\s+)?class\s+(\w+)/);
        if (classMatch) {
          // 提取方法和属性（简化版）
          const classBlock = extractClassBlock(lines, index);
          const methods = extractMethodsFromClass(classBlock);
          const properties = extractPropertiesFromClass(classBlock);

          classes.push({
            name: classMatch[1],
            file: file.path,
            line: index + 1,
            methods,
            properties,
            exported: line.includes('export'),
            documented: index > 0 && lines[index - 1].includes('/**'),
          });
        }
      });
    } catch (error) {
      // 跳过
    }
  }

  return classes;
}

/**
 * 提取接口
 */
function extractInterfaces(files: AnalyzedFile[]): ImplementedInterface[] {
  const interfaces: ImplementedInterface[] = [];

  for (const file of files) {
    if (!['ts', 'tsx'].includes(file.language)) continue;

    try {
      const content = readFileSync(file.path, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const interfaceMatch = line.match(/(?:export\s+)?interface\s+(\w+)/);
        if (interfaceMatch) {
          const interfaceBlock = extractClassBlock(lines, index);
          const properties = extractPropertiesFromInterface(interfaceBlock);
          const methods = extractMethodsFromInterface(interfaceBlock);

          interfaces.push({
            name: interfaceMatch[1],
            file: file.path,
            line: index + 1,
            properties,
            methods,
          });
        }
      });
    } catch (error) {
      // 跳过
    }
  }

  return interfaces;
}

/**
 * 识别功能
 */
function identifyFeatures(
  files: AnalyzedFile[],
  functions: ImplementedFunction[],
  classes: ImplementedClass[]
): ImplementedFeature[] {
  const features: ImplementedFeature[] = [];

  // 基于文件和函数名推断功能（简化版）
  const featureGroups = new Map<string, { files: Set<string>; functions: Set<string>; classes: Set<string> }>();

  // 按目录分组
  files.forEach((file) => {
    const parts = file.path.split('/');
    const featureName = parts.length > 1 ? parts[parts.length - 2] : 'root';

    if (!featureGroups.has(featureName)) {
      featureGroups.set(featureName, {
        files: new Set(),
        functions: new Set(),
        classes: new Set(),
      });
    }

    featureGroups.get(featureName)!.files.add(file.path);
  });

  // 按函数分组
  functions.forEach((func) => {
    const featureName = inferFeatureFromName(func.name);
    if (!featureGroups.has(featureName)) {
      featureGroups.set(featureName, {
        files: new Set(),
        functions: new Set(),
        classes: new Set(),
      });
    }
    featureGroups.get(featureName)!.functions.add(func.name);
  });

  // 转换为特征列表
  featureGroups.forEach((group, name) => {
    features.push({
      name,
      files: Array.from(group.files),
      functions: Array.from(group.functions),
      classes: Array.from(group.classes),
    });
  });

  return features;
}

/**
 * 检查合规性
 */
function checkCompliance(
  specification: DesignSpecification,
  implementation: ImplementationAnalysis
): ComplianceReport {
  const requirements: RequirementCompliance[] = [];

  for (const req of specification.requirements) {
    const compliance = checkRequirementCompliance(req, implementation);
    requirements.push(compliance);
  }

  const implementedCount = requirements.filter((r) => r.status === 'implemented').length;
  const partialCount = requirements.filter((r) => r.status === 'partial').length;
  const missingCount = requirements.filter((r) => r.status === 'missing').length;

  const overallCompliance =
    requirements.reduce((sum, r) => sum + r.score, 0) / requirements.length;

  return {
    totalRequirements: requirements.length,
    implementedRequirements: implementedCount,
    partialRequirements: partialCount,
    missingRequirements: missingCount,
    requirements,
    overallCompliance,
  };
}

/**
 * 检查单个需求合规性
 */
function checkRequirementCompliance(
  requirement: DesignRequirement,
  implementation: ImplementationAnalysis
): RequirementCompliance {
  const evidence: string[] = [];
  const gaps: string[] = [];
  let score = 0;

  // 基于需求描述搜索相关实现（简化版）
  const keywords = extractKeywords(requirement.description);
  const matchingFunctions = implementation.functions.filter((f) =>
    keywords.some((k) => f.name.toLowerCase().includes(k.toLowerCase()))
  );
  const matchingClasses = implementation.classes.filter((c) =>
    keywords.some((k) => c.name.toLowerCase().includes(k.toLowerCase()))
  );

  if (matchingFunctions.length > 0) {
    evidence.push(`Found ${matchingFunctions.length} related functions`);
    score += 40;
  }

  if (matchingClasses.length > 0) {
    evidence.push(`Found ${matchingClasses.length} related classes`);
    score += 30;
  }

  // 检查验收标准
  const criteriaMatch = requirement.acceptance_criteria.filter((criterion) => {
    return implementation.features.some((f) =>
      criterion.toLowerCase().includes(f.name.toLowerCase())
    );
  });

  if (criteriaMatch.length > 0) {
    evidence.push(`${criteriaMatch.length}/${requirement.acceptance_criteria.length} acceptance criteria matched`);
    score += (criteriaMatch.length / requirement.acceptance_criteria.length) * 30;
  }

  // 确定状态
  let status: RequirementCompliance['status'];
  if (score >= 80) {
    status = 'implemented';
  } else if (score >= 40) {
    status = 'partial';
    gaps.push('Incomplete implementation');
  } else {
    status = 'missing';
    gaps.push('Requirement not implemented');
  }

  return {
    requirement,
    status,
    evidence,
    gaps,
    score,
  };
}

/**
 * 分析差距
 */
function analyzeGaps(
  specification: DesignSpecification,
  implementation: ImplementationAnalysis,
  compliance: ComplianceReport
): GapAnalysis {
  const missingFeatures: string[] = [];
  const incompleteFeatures: string[] = [];
  const extraFeatures: string[] = [];
  const constraintViolations: string[] = [];
  const technicalDebt: string[] = [];

  // 识别缺失的功能
  compliance.requirements.forEach((req) => {
    if (req.status === 'missing') {
      missingFeatures.push(req.requirement.description);
    } else if (req.status === 'partial') {
      incompleteFeatures.push(req.requirement.description);
    }
  });

  // 识别额外的功能
  const specKeywords = new Set(
    specification.requirements.flatMap((r) => extractKeywords(r.description))
  );

  implementation.features.forEach((feature) => {
    const hasMatch = [...specKeywords].some((k) =>
      feature.name.toLowerCase().includes(k.toLowerCase())
    );
    if (!hasMatch) {
      extraFeatures.push(feature.name);
    }
  });

  // 检查约束违规
  specification.constraints.forEach((constraint) => {
    // 简化版：基于关键词检测
    if (constraint.type === 'performance') {
      const hasPerformanceCode = implementation.files.some((f) => {
        const content = readFileSync(f.path, 'utf-8');
        return content.includes('performance') || content.includes('optimize');
      });
      if (!hasPerformanceCode) {
        constraintViolations.push(constraint.description);
      }
    }
  });

  // 识别技术债务
  implementation.functions
    .filter((f) => !f.documented)
    .forEach((f) => {
      technicalDebt.push(`Function ${f.name} lacks documentation`);
    });

  return {
    missingFeatures,
    incompleteFeatures,
    extraFeatures,
    constraintViolations,
    technicalDebt,
  };
}

/**
 * 生成建议
 */
function generateRecommendations(
  compliance: ComplianceReport,
  gaps: GapAnalysis
): string[] {
  const recommendations: string[] = [];

  // 针对缺失功能的建议
  if (gaps.missingFeatures.length > 0) {
    recommendations.push(`Implement ${gaps.missingFeatures.length} missing features`);
  }

  // 针对不完整功能的建议
  if (gaps.incompleteFeatures.length > 0) {
    recommendations.push(`Complete ${gaps.incompleteFeatures.length} partial implementations`);
  }

  // 针对约束违规的建议
  if (gaps.constraintViolations.length > 0) {
    recommendations.push(`Address ${gaps.constraintViolations.length} constraint violations`);
  }

  // 针对技术债务的建议
  if (gaps.technicalDebt.length > 0) {
    recommendations.push(`Reduce technical debt (${gaps.technicalDebt.length} items)`);
  }

  // 通用建议
  if (compliance.overallCompliance < 80) {
    recommendations.push('Improve overall compliance to meet minimum threshold (80%)');
  }

  return recommendations;
}

/**
 * 计算总体评分
 */
function calculateOverallScore(
  compliance: ComplianceReport,
  gaps: GapAnalysis
): number {
  let score = compliance.overallCompliance;

  // 扣除缺失功能分数
  score -= gaps.missingFeatures.length * 5;

  // 扣除不完整功能分数
  score -= gaps.incompleteFeatures.length * 2;

  // 扣除约束违规分数
  score -= gaps.constraintViolations.length * 10;

  // 扣除技术债务分数
  score -= gaps.technicalDebt.length * 0.5;

  return Math.max(0, Math.min(100, score));
}

/**
 * 检查是否通过
 */
function checkPassed(
  compliance: ComplianceReport,
  gaps: GapAnalysis,
  config: ComparatorConfig
): boolean {
  // 检查总体合规性
  if (compliance.overallCompliance < config.minComplianceScore) {
    return false;
  }

  // 检查必需需求
  if (config.failOnMissingMust) {
    const missingMust = compliance.requirements.filter(
      (r) => r.requirement.priority === 'must' && r.status === 'missing'
    );
    if (missingMust.length > 0) {
      return false;
    }
  }

  // 检查应该需求
  if (config.failOnMissingShould) {
    const missingShould = compliance.requirements.filter(
      (r) => r.requirement.priority === 'should' && r.status === 'missing'
    );
    if (missingShould.length > 0) {
      return false;
    }
  }

  return true;
}

// ============================================
// 辅助函数
// ============================================

function determineFileType(filename: string): AnalyzedFile['type'] {
  if (filename.includes('.test.') || filename.includes('.spec.')) return 'test';
  if (filename.includes('.config.')) return 'config';
  if (filename.endsWith('.md') || filename.endsWith('.txt')) return 'documentation';
  return 'module';
}

function extractExports(content: string): string[] {
  const exports: string[] = [];
  const exportMatches = content.matchAll(/export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g);
  for (const match of exportMatches) {
    exports.push(match[1]);
  }
  return exports;
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  const importMatches = content.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
  for (const match of importMatches) {
    imports.push(match[1]);
  }
  return imports;
}

function extractClassBlock(lines: string[], startIndex: number): string[] {
  const block: string[] = [];
  let braceCount = 0;
  let started = false;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    block.push(line);

    if (line.includes('{')) {
      started = true;
      braceCount += (line.match(/{/g) || []).length;
    }
    if (line.includes('}')) {
      braceCount -= (line.match(/}/g) || []).length;
    }

    if (started && braceCount === 0) {
      break;
    }
  }

  return block;
}

function extractMethodsFromClass(classBlock: string[]): string[] {
  const methods: string[] = [];
  classBlock.forEach((line) => {
    const match = line.match(/^\s*(?:async\s+)?(\w+)\s*\(/);
    if (match && !['if', 'for', 'while', 'switch', 'catch'].includes(match[1])) {
      methods.push(match[1]);
    }
  });
  return methods;
}

function extractPropertiesFromClass(classBlock: string[]): string[] {
  const properties: string[] = [];
  classBlock.forEach((line) => {
    const match = line.match(/^\s*(?:private|public|protected)?\s*(\w+)\s*[:=]/);
    if (match) {
      properties.push(match[1]);
    }
  });
  return properties;
}

function extractPropertiesFromInterface(interfaceBlock: string[]): string[] {
  const properties: string[] = [];
  interfaceBlock.forEach((line) => {
    const match = line.match(/^\s*(\w+)\s*[?:]/);
    if (match && !match[1].includes('(')) {
      properties.push(match[1]);
    }
  });
  return properties;
}

function extractMethodsFromInterface(interfaceBlock: string[]): string[] {
  const methods: string[] = [];
  interfaceBlock.forEach((line) => {
    const match = line.match(/^\s*(\w+)\s*\(/);
    if (match) {
      methods.push(match[1]);
    }
  });
  return methods;
}

function inferFeatureFromName(name: string): string {
  // 简单的特征推断
  const parts = name.split(/(?=[A-Z])/);
  return parts[0].toLowerCase();
}

function extractKeywords(text: string): string[] {
  // 简单的关键词提取
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .filter((word) => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out'].includes(word));
}
