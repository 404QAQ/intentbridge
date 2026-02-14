/**
 * mcp-tools 命令 - v3.0.0 Phase 3.5 MCP 工具管理命令
 *
 * 功能：
 * - mcp-tools list: 列出所有可用的 MCP 工具
 * - mcp-tools run: 执行 MCP 工具
 * - mcp-tools info: 查看工具详情
 */

import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import {
  initializeMCPTools,
  getMCPToolsList,
  executeMCPTool,
  getRegisteredMCPTools,
} from '../services/mcp-tools.js';
import type { MCPTool } from '../models/types.js';

/**
 * mcp-tools list 命令 - 列出所有工具
 */
export async function mcpToolsListCommand() {
  try {
    initializeMCPTools();
    const tools = getMCPToolsList();

    console.log(chalk.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.bold('  MCP 工具列表'));
    console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    const table = new Table({
      head: [chalk.bold('工具名称'), chalk.bold('描述'), chalk.bold('参数数量')],
      colWidths: [30, 50, 15],
    });

    tools.forEach((tool) => {
      table.push([tool.name, tool.description.substring(0, 48), tool.parameters.length.toString()]);
    });

    console.log(table.toString());
    console.log();
    console.log(chalk.gray(`总计: ${tools.length} 个工具`));
    console.log(chalk.gray('查看工具详情: ib mcp-tools info <tool-name>'));
    console.log(chalk.gray('执行工具: ib mcp-tools run <tool-name> [params]\n'));
  } catch (error: any) {
    console.error(chalk.red(`\n❌ 错误: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * mcp-tools info 命令 - 查看工具详情
 */
export async function mcpToolsInfoCommand(toolName: string) {
  try {
    initializeMCPTools();
    const tools = getMCPToolsList();
    const tool = tools.find((t) => t.name === toolName);

    if (!tool) {
      console.error(chalk.red(`\n❌ 工具 ${toolName} 不存在\n`));
      process.exit(1);
    }

    console.log(chalk.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.bold(`  MCP 工具详情: ${tool.name}`));
    console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    console.log(chalk.bold('基本信息:'));
    console.log(`  名称: ${tool.name}`);
    console.log(`  描述: ${tool.description}`);
    console.log();

    console.log(chalk.bold('参数列表:'));
    if (tool.parameters.length === 0) {
      console.log(chalk.gray('  无参数'));
    } else {
      tool.parameters.forEach((param, index) => {
        console.log(`  ${index + 1}. ${param.name}`);
        console.log(`     类型: ${param.type}`);
        console.log(`     必需: ${param.required ? '是' : '否'}`);
        console.log(`     描述: ${param.description}`);
        if (param.default !== undefined) {
          console.log(`     默认值: ${param.default}`);
        }
        console.log();
      });
    }

    console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  } catch (error: any) {
    console.error(chalk.red(`\n❌ 错误: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * mcp-tools run 命令 - 执行工具
 */
export async function mcpToolsRunCommand(toolName: string, paramsJson?: string) {
  try {
    initializeMCPTools();

    console.log(chalk.cyan(`\n🔧 正在执行 MCP 工具: ${toolName}...\n`));

    // 解析参数
    let params = {};
    if (paramsJson) {
      try {
        params = JSON.parse(paramsJson);
      } catch {
        console.error(chalk.red('❌ 参数必须是有效的 JSON 格式\n'));
        process.exit(1);
      }
    }

    // 执行工具
    const result = await executeMCPTool(toolName, params);

    console.log(chalk.bold('执行结果:'));
    console.log(`  状态: ${result.success ? chalk.green('✅ 成功') : chalk.red('❌ 失败')}`);

    if (result.output) {
      console.log('\n输出:');
      console.log(chalk.gray(result.output.substring(0, 500)));
      if (result.output.length > 500) {
        console.log(chalk.gray('...'));
      }
    }

    if (result.error) {
      console.log(chalk.red(`\n错误: ${result.error}`));
    }

    if (result.data) {
      console.log('\n数据:');
      console.log(chalk.gray(JSON.stringify(result.data, null, 2)));
    }

    if (result.artifacts && result.artifacts.length > 0) {
      console.log('\n产物:');
      result.artifacts.forEach((artifact) => {
        console.log(chalk.gray(`  - ${artifact}`));
      });
    }

    console.log();
  } catch (error: any) {
    console.error(chalk.red(`\n❌ 错误: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * 注册 mcp-tools 命令
 */
export function registerMCPToolsCommand(program: Command) {
  const mcpTools = program.command('mcp-tools').description('v3.0.0 Phase 3.5 MCP 工具管理');

  mcpTools
    .command('list')
    .description('列出所有可用的 MCP 工具')
    .action(mcpToolsListCommand);

  mcpTools
    .command('info <tool-name>')
    .description('查看工具详情')
    .action(mcpToolsInfoCommand);

  mcpTools
    .command('run <tool-name> [params]')
    .description('执行 MCP 工具（params 为 JSON 格式）')
    .action(mcpToolsRunCommand);
}
