/**
 * requirement 命令 - v3.0.0 需求共创命令
 *
 * 功能：
 * - requirement create: 交互式需求收集
 * - requirement clarify: 需求澄清
 * - requirement confirm: 确认 PRD
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import {
  startConversation,
  processUserInput,
  generatePRD,
} from '../services/requirement-co-creation.js';
import { getAIConfig } from '../services/ai-client.js';
import { addRequirement } from '../services/store.js';
import type { PRDDocument } from '../services/requirement-co-creation.js';

/**
 * requirement create 命令
 */
export async function requirementCreateCommand() {
  console.log(chalk.cyan('\n🎯 IntentBridge 需求共创系统\n'));

  // 检查 AI 配置
  const aiConfig = getAIConfig();
  if (!aiConfig) {
    console.log(chalk.yellow('⚠️  未检测到 AI 配置，将使用简化模式（无 AI 增强）'));
    console.log(chalk.gray('提示：运行 `ib ai config` 配置 AI 以获得更好的体验\n'));
  }

  try {
    // 开始对话
    const conversation = await startConversation();

    console.log(chalk.gray(`对话ID: ${conversation.id}\n`));
    console.log(conversation.messages[0].content);
    console.log();

    // 进入交互式对话循环
    await interactiveLoop(conversation.id);
  } catch (error: any) {
    console.error(chalk.red(`\n❌ 错误: ${error.message}`));
    process.exit(1);
  }
}

/**
 * 交互式对话循环
 */
async function interactiveLoop(conversationId: string) {
  let canGeneratePRD = false;

  while (true) {
    try {
      // 获取用户输入
      const { userInput } = await inquirer.prompt([
        {
          type: 'input',
          name: 'userInput',
          message: chalk.cyan('您:'),
          prefix: '',
        },
      ]);

      // 检查退出命令
      if (userInput.toLowerCase() === 'exit' || userInput.toLowerCase() === 'quit') {
        console.log(chalk.gray('\n👋 对话已保存，您可以稍后继续'));
        break;
      }

      // 检查生成 PRD 命令
      if (canGeneratePRD && (userInput.toLowerCase() === 'yes' || userInput.toLowerCase() === '是')) {
        await generateAndSavePRD(conversationId);
        break;
      }

      // 处理用户输入
      const result = await processUserInput(conversationId, userInput);

      // 显示响应
      console.log(chalk.green('\n🤖 IntentBridge:'));
      console.log(result.response);
      console.log();

      // 更新状态
      canGeneratePRD = result.canGeneratePRD;

      // 如果可以生成 PRD，显示提示
      if (canGeneratePRD && !result.needsClarification) {
        console.log(chalk.yellow('💡 提示: 回复 "是" 或 "yes" 生成产品需求文档\n'));
      }
    } catch (error: any) {
      console.error(chalk.red(`\n❌ 错误: ${error.message}\n`));
    }
  }
}

/**
 * 生成并保存 PRD
 */
async function generateAndSavePRD(conversationId: string) {
  console.log(chalk.cyan('\n📝 正在生成产品需求文档...\n'));

  try {
    // 生成 PRD
    const prd = await generatePRD(conversationId);

    // 显示 PRD 摘要
    displayPRDSummary(prd);

    // 询问是否创建需求
    const { createRequirement } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'createRequirement',
        message: '是否基于此 PRD 创建需求？',
        default: true,
      },
    ]);

    if (createRequirement) {
      // 创建需求
      const req = addRequirement(
        prd.title,
        prd.description,
        'high'
      );

      console.log(chalk.green(`\n✅ 需求已创建: ${req.id}`));
      console.log(chalk.gray(`查看需求: ib req show ${req.id}`));
    }

    console.log(chalk.green('\n✅ PRD 已生成并保存'));
    console.log(chalk.gray(`文件位置: .intentbridge/product-design/PRD-${prd.id}.yml`));
  } catch (error: any) {
    console.error(chalk.red(`\n❌ 生成 PRD 失败: ${error.message}`));
    throw error;
  }
}

/**
 * 显示 PRD 摘要
 */
function displayPRDSummary(prd: PRDDocument) {
  console.log(chalk.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.bold('  产品需求文档（PRD）摘要'));
  console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  console.log(chalk.bold(`标题: ${prd.title}`));
  console.log(chalk.gray(`版本: ${prd.version}`));
  console.log(chalk.gray(`ID: ${prd.id}`));
  console.log();

  console.log(chalk.bold('描述:'));
  console.log(chalk.gray(prd.description));
  console.log();

  if (prd.features.length > 0) {
    console.log(chalk.bold('功能列表:'));
    prd.features.forEach((feature, i) => {
      console.log(chalk.cyan(`  ${i + 1}. ${feature.name}`));
      console.log(chalk.gray(`     ${feature.description}`));
      if (feature.estimated_hours) {
        console.log(chalk.gray(`     预估工时: ${feature.estimated_hours}小时`));
      }
    });
    console.log();
  }

  if (prd.acceptanceCriteria.length > 0) {
    console.log(chalk.bold('验收标准:'));
    prd.acceptanceCriteria.forEach((ac, i) => {
      const priorityIcon = ac.priority === 'must' ? '🔴' : ac.priority === 'should' ? '🟡' : '🟢';
      console.log(chalk.gray(`  ${priorityIcon} ${ac.criterion}`));
    });
    console.log();
  }

  if (prd.technicalConstraints.length > 0) {
    console.log(chalk.bold('技术约束:'));
    prd.technicalConstraints.forEach((constraint) => {
      console.log(chalk.gray(`  - ${constraint}`));
    });
    console.log();
  }

  console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
}

/**
 * requirement clarify 命令
 */
export async function requirementClarifyCommand(requirementId: string) {
  console.log(chalk.cyan(`\n🔍 需求澄清: ${requirementId}\n`));
  console.log(chalk.gray('此功能将在后续版本实现'));
  // TODO: 实现需求澄清功能
}

/**
 * requirement confirm 命令
 */
export async function requirementConfirmCommand(requirementId: string) {
  console.log(chalk.cyan(`\n✅ 确认需求: ${requirementId}\n`));
  console.log(chalk.gray('此功能将在后续版本实现'));
  // TODO: 实现需求确认功能
}

/**
 * 注册 requirement 命令
 */
export function registerRequirementCommand(program: Command) {
  const requirement = program.command('requirement').description('v3.0.0 需求共创命令');

  requirement
    .command('create')
    .description('交互式需求收集，生成产品需求文档')
    .action(requirementCreateCommand);

  requirement
    .command('clarify <requirement-id>')
    .description('澄清需求细节')
    .action(requirementClarifyCommand);

  requirement
    .command('confirm <requirement-id>')
    .description('确认产品需求文档')
    .action(requirementConfirmCommand);
}
