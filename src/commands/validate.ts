/**
 * validate 命令 - v3.0.0 Phase 4 闭环验证命令
 *
 * 功能：
 * - validate requirement: 验证需求实现
 * - validate report: 查看验证报告
 * - validate list: 列出所有验证报告
 * - validate evidence: 查看证据详情
 */

import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import {
  validateRequirement,
  getRequirementValidationReports,
  getLatestValidationReport,
  readValidationReports,
} from '../services/validation-engine.js';
import { readRequirements } from '../services/store.js';
import type { ValidationReport, ValidationChecklist } from '../models/types.js';

/**
 * validate requirement 命令 - 验证需求实现
 */
export async function validateRequirementCommand(requirementId: string) {
  try {
    console.log(chalk.cyan(`\n🔍 正在验证需求: ${requirementId}...\n`));

    const report = await validateRequirement(requirementId);

    console.log(chalk.green('✅ 验证完成\n'));
    displayValidationReport(report);
  } catch (error: any) {
    console.error(chalk.red(`\n❌ 错误: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * validate report 命令 - 查看验证报告
 */
export async function validateReportCommand(requirementId: string) {
  try {
    const report = getLatestValidationReport(requirementId);

    if (!report) {
      console.log(chalk.yellow(`\n⚠️  未找到需求 ${requirementId} 的验证报告\n`));
      console.log(chalk.gray('运行验证: ib validate requirement ' + requirementId));
      return;
    }

    displayValidationReport(report);
  } catch (error: any) {
    console.error(chalk.red(`\n❌ 错误: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * validate list 命令 - 列出所有验证报告
 */
export async function validateListCommand() {
  try {
    const reports = readValidationReports();

    if (reports.length === 0) {
      console.log(chalk.yellow('\n⚠️  暂无验证报告\n'));
      console.log(chalk.gray('运行验证: ib validate requirement <requirement-id>'));
      return;
    }

    console.log(chalk.cyan('\n📋 验证报告列表\n'));

    const table = new Table({
      head: [chalk.white('报告ID'), chalk.white('需求ID'), chalk.white('状态'), chalk.white('匹配度'), chalk.white('时间')],
      colWidths: [20, 15, 15, 12, 20],
    });

    for (const report of reports) {
      table.push([
        report.id,
        report.requirementId,
        getStatusDisplay(report.status),
        `${(report.matchScore * 100).toFixed(1)}%`,
        new Date(report.timestamp).toLocaleString('zh-CN'),
      ]);
    }

    console.log(table.toString());
    console.log();
  } catch (error: any) {
    console.error(chalk.red(`\n❌ 错误: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * validate evidence 命令 - 查看证据详情
 */
export async function validateEvidenceCommand(reportId: string) {
  try {
    const reports = readValidationReports();
    const report = reports.find((r) => r.id === reportId);

    if (!report) {
      console.log(chalk.yellow(`\n⚠️  未找到报告 ${reportId}\n`));
      return;
    }

    console.log(chalk.cyan(`\n📎 证据详情: ${reportId}\n`));

    if (report.evidence.length === 0) {
      console.log(chalk.gray('暂无证据'));
      return;
    }

    for (const [index, evidence] of report.evidence.entries()) {
      console.log(chalk.bold(`证据 ${index + 1}:`));
      console.log(`  类型: ${getEvidenceTypeDisplay(evidence.type)}`);
      console.log(`  描述: ${evidence.description}`);
      console.log(`  路径: ${evidence.path}`);
      console.log(`  时间: ${evidence.timestamp}`);
      console.log();
    }
  } catch (error: any) {
    console.error(chalk.red(`\n❌ 错误: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * 显示验证报告
 */
function displayValidationReport(report: ValidationReport) {
  console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.bold('  验证报告'));
  console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  console.log(chalk.bold('基本信息:'));
  console.log(`  报告 ID: ${report.id}`);
  console.log(`  需求 ID: ${report.requirementId}`);
  console.log(`  验证时间: ${new Date(report.timestamp).toLocaleString('zh-CN')}`);
  console.log(`  状态: ${getStatusDisplay(report.status)}`);
  console.log(`  匹配度: ${(report.matchScore * 100).toFixed(1)}%`);
  console.log();

  console.log(chalk.bold('验证维度评分:'));

  const checklistTable = new Table({
    head: [chalk.white('类别'), chalk.white('得分'), chalk.white('状态')],
    colWidths: [20, 15, 15],
  });

  const categories = [
    { key: 'functional' as const, name: '功能完整性' },
    { key: 'quality' as const, name: '代码质量' },
    { key: 'testing' as const, name: '测试覆盖' },
    { key: 'acceptance' as const, name: '验收标准' },
  ];

  for (const { key, name } of categories) {
    const checklist = report.checklists[key];
    checklistTable.push([
      name,
      `${(checklist.score * 100).toFixed(0)}%`,
      checklist.passed ? chalk.green('✓ 通过') : chalk.red('✗ 未通过'),
    ]);
  }

  if (report.checklists.ui) {
    checklistTable.push([
      'UI/UX',
      `${(report.checklists.ui.score * 100).toFixed(0)}%`,
      report.checklists.ui.passed ? chalk.green('✓ 通过') : chalk.red('✗ 未通过'),
    ]);
  }

  console.log(checklistTable.toString());
  console.log();

  // 显示详细检查项
  console.log(chalk.bold('详细检查项:'));
  console.log();

  for (const { key, name } of categories) {
    displayChecklistDetails(name, report.checklists[key]);
  }

  if (report.checklists.ui) {
    displayChecklistDetails('UI/UX', report.checklists.ui);
  }

  // 显示摘要和建议
  console.log(chalk.bold('摘要:'));
  console.log(report.summary);
  console.log();

  if (report.recommendations.length > 0) {
    console.log(chalk.bold('改进建议:'));
    for (const [index, rec] of report.recommendations.entries()) {
      console.log(`  ${index + 1}. ${rec}`);
    }
    console.log();
  }

  // 显示证据数量
  console.log(chalk.bold('证据:'));
  console.log(`  收集证据数量: ${report.evidence.length}`);
  console.log(chalk.gray('查看证据详情: ib validate evidence ' + report.id));
  console.log();
}

/**
 * 显示检查清单详情
 */
function displayChecklistDetails(categoryName: string, checklist: ValidationChecklist) {
  console.log(chalk.cyan(`  ${categoryName}:`));

  for (const item of checklist.items) {
    const icon = item.passed ? chalk.green('✓') : chalk.red('✗');
    console.log(`    ${icon} ${item.criterion}`);
    if (!item.passed || item.details) {
      console.log(chalk.gray(`       ${item.details}`));
    }
  }
  console.log();
}

/**
 * 获取状态显示
 */
function getStatusDisplay(status: string): string {
  switch (status) {
    case 'passed':
      return chalk.green('✅ 验证通过');
    case 'needs_revision':
      return chalk.yellow('⚠️  需要修订');
    case 'failed':
      return chalk.red('❌ 验证失败');
    default:
      return status;
  }
}

/**
 * 获取证据类型显示
 */
function getEvidenceTypeDisplay(type: string): string {
  const typeMap: Record<string, string> = {
    code_snippet: '📝 代码片段',
    screenshot: '📷 截图',
    test_result: '🧪 测试结果',
    log: '📋 日志',
    documentation: '📄 文档',
  };
  return typeMap[type] || type;
}

/**
 * 注册 validate 命令
 */
export function registerValidateCommand(program: Command) {
  const validate = program
    .command('validate')
    .description('闭环验证命令（Phase 4）');

  validate
    .command('requirement <requirement-id>')
    .description('验证需求实现')
    .action(async (requirementId: string) => {
      await validateRequirementCommand(requirementId);
    });

  validate
    .command('report <requirement-id>')
    .description('查看需求的最新验证报告')
    .action(async (requirementId: string) => {
      await validateReportCommand(requirementId);
    });

  validate
    .command('list')
    .description('列出所有验证报告')
    .action(async () => {
      await validateListCommand();
    });

  validate
    .command('evidence <report-id>')
    .description('查看报告的证据详情')
    .action(async (reportId: string) => {
      await validateEvidenceCommand(reportId);
    });
}
