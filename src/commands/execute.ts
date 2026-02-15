/**
 * execute 命令 - v3.0.0 Phase 3 执行监督命令
 *
 * 功能：
 * - execute start: 启动任务执行
 * - execute status: 查看执行状态
 * - execute session: 查看会话详情
 * - execute cancel: 取消任务执行
 * - execute monitor: 实时监控执行进度
 */

import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import {
  startTaskExecution,
  getSupervisionStatus,
  getExecutionSession,
  getTaskSessions,
  cancelTaskExecution,
  registerWebSocketClient,
  unregisterWebSocketClient,
} from '../services/execution-supervisor.js';
import { readTasks } from '../services/task-decomposition.js';
import type { SupervisionStatus, ExecutionSession } from '../models/types.js';

/**
 * execute start 命令 - 启动任务执行
 */
export async function executeStartCommand(taskId: string) {
  try {
    console.log(chalk.cyan(`\n🚀 正在启动任务执行: ${taskId}...\n`));

    const session = await startTaskExecution(taskId);

    console.log(chalk.green('✅ 任务执行已启动\n'));
    console.log(chalk.bold('会话信息:'));
    console.log(`  会话 ID: ${session.sessionId}`);
    console.log(`  任务 ID: ${session.taskId}`);
    console.log(`  状态: ${getStatusIcon(session.status)} ${session.status}`);
    console.log(`  开始时间: ${session.startedAt}`);
    console.log();

    console.log(chalk.gray('查看执行状态: ib execute status'));
    console.log(chalk.gray('查看会话详情: ib execute session ' + session.sessionId));
    console.log(chalk.gray('实时监控: ib execute monitor\n'));
  } catch (error: any) {
    console.error(chalk.red(`\n❌ 错误: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * execute status 命令 - 查看执行状态
 */
export async function executeStatusCommand() {
  try {
    const status = getSupervisionStatus();

    console.log(chalk.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.bold('  执行监督状态'));
    console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    // 总体统计
    console.log(chalk.bold('任务统计:'));
    console.log(`  总任务数: ${status.totalTasks}`);
    console.log(`  ⏳ 待执行: ${status.pendingTasks}`);
    console.log(`  🔄 执行中: ${status.runningTasks}`);
    console.log(`  ✅ 已完成: ${status.completedTasks}`);
    if (status.failedTasks > 0) {
      console.log(chalk.red(`  ❌ 失败: ${status.failedTasks}`));
    }
    console.log();

    // 时间统计
    console.log(chalk.bold('时间统计:'));
    console.log(`  平均任务时长: ${formatDuration(status.averageTaskDuration)}`);
    console.log(`  预计剩余时间: ${formatDuration(status.estimatedTimeRemaining)}`);
    console.log();

    // 质量统计
    console.log(chalk.bold('质量统计:'));
    console.log(`  平均质量评分: ${status.averageQualityScore.toFixed(1)}/100`);
    console.log(`  总问题数: ${status.totalIssues}`);
    console.log();

    // 系统状态
    console.log(chalk.bold('系统状态:'));
    const healthIcon = getHealthIcon(status.systemHealth);
    const healthColor = getHealthColor(status.systemHealth);
    console.log(`  健康状态: ${healthIcon} ${healthColor(status.systemHealth)}`);
    console.log(`  活跃会话: ${status.activeSessions.length}`);
    console.log(`  最后更新: ${status.lastUpdate}`);
    console.log();

    // 活跃会话
    if (status.activeSessions.length > 0) {
      console.log(chalk.bold('活跃会话:'));
      status.activeSessions.forEach((sessionId) => {
        console.log(chalk.gray(`  - ${sessionId}`));
      });
      console.log();
    }

    console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  } catch (error: any) {
    console.error(chalk.red(`\n❌ 错误: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * execute session 命令 - 查看会话详情
 */
export async function executeSessionCommand(sessionId: string) {
  try {
    const session = getExecutionSession(sessionId);

    if (!session) {
      console.error(chalk.red(`\n❌ 会话 ${sessionId} 不存在\n`));
      process.exit(1);
    }

    console.log(chalk.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.bold(`  执行会话详情: ${sessionId}`));
    console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    console.log(chalk.bold('基本信息:'));
    console.log(`  会话 ID: ${session.sessionId}`);
    console.log(`  任务 ID: ${session.taskId}`);
    console.log(`  状态: ${getStatusIcon(session.status)} ${session.status}`);
    console.log();

    console.log(chalk.bold('时间信息:'));
    console.log(`  开始时间: ${session.startedAt}`);
    if (session.completedAt) {
      console.log(`  完成时间: ${session.completedAt}`);
      const duration =
        (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000;
      console.log(`  执行时长: ${formatDuration(duration)}`);
    }
    console.log();

    // 执行结果
    if (session.result) {
      console.log(chalk.bold('执行结果:'));
      console.log(`  成功: ${session.result.success ? '✅ 是' : '❌ 否'}`);
      console.log(`  摘要: ${session.result.summary}`);

      if (session.result.changes.length > 0) {
        console.log(`  文件变更:`);
        session.result.changes.forEach((change) => {
          console.log(
            `    - ${change.action}: ${change.path} (+${change.linesAdded}/-${change.linesDeleted})`
          );
        });
      }

      if (session.result.testResults) {
        console.log(`  测试结果:`);
        console.log(`    总数: ${session.result.testResults.total}`);
        console.log(`    通过: ${session.result.testResults.passed}`);
        console.log(`    失败: ${session.result.testResults.failed}`);
        if (session.result.testResults.coverage !== undefined) {
          console.log(`    覆盖率: ${session.result.testResults.coverage}%`);
        }
      }

      if (session.result.qualityScore !== undefined) {
        console.log(`  质量评分: ${session.result.qualityScore}/100`);
      }
      console.log();
    }

    // 执行指标
    console.log(chalk.bold('执行指标:'));
    console.log(`  Token 使用: ${session.metrics.tokensUsed}`);
    console.log(`  API 调用: ${session.metrics.apiCalls}`);
    console.log(`  生成文件: ${session.metrics.filesGenerated}`);
    console.log(`  代码行数: ${session.metrics.linesOfCode}`);
    console.log();

    // 错误信息
    if (session.errors.length > 0) {
      console.log(chalk.bold('错误记录:'));
      session.errors.forEach((error, index) => {
        console.log(chalk.red(`  ${index + 1}. [${error.type}] ${error.message}`));
        if (error.stack) {
          console.log(chalk.gray(`     ${error.stack.split('\n')[0]}`));
        }
      });
      console.log();
    }

    // 重试信息
    if (session.retryCount > 0) {
      console.log(chalk.bold('重试信息:'));
      console.log(`  重试次数: ${session.retryCount}/${session.maxRetries}`);
      console.log();
    }

    console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  } catch (error: any) {
    console.error(chalk.red(`\n❌ 错误: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * execute cancel 命令 - 取消任务执行
 */
export async function executeCancelCommand(sessionId: string) {
  try {
    console.log(chalk.cyan(`\n🚫 正在取消任务执行: ${sessionId}...\n`));

    await cancelTaskExecution(sessionId);

    console.log(chalk.green('✅ 任务执行已取消\n'));
    console.log(chalk.gray('查看任务列表: ib task list'));
    console.log(chalk.gray('重新启动任务: ib execute start <task-id>\n'));
  } catch (error: any) {
    console.error(chalk.red(`\n❌ 错误: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * execute monitor 命令 - 实时监控执行进度
 */
export async function executeMonitorCommand() {
  try {
    console.log(chalk.cyan('\n📊 实时监控执行进度...\n'));
    console.log(chalk.gray('按 Ctrl+C 退出监控\n'));

    // 显示初始状态
    displayCurrentStatus();

    // TODO: 实现 WebSocket 客户端连接
    // 目前使用轮询方式
    const interval = setInterval(() => {
      console.clear();
      displayCurrentStatus();
    }, 5000);

    // 监听退出信号
    process.on('SIGINT', () => {
      clearInterval(interval);
      console.log(chalk.gray('\n\n监控已停止\n'));
      process.exit(0);
    });
  } catch (error: any) {
    console.error(chalk.red(`\n❌ 错误: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * 显示当前状态
 */
function displayCurrentStatus() {
  const status = getSupervisionStatus();

  console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.bold('  执行监督实时监控'));
  console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  // 进度条
  const progress = status.totalTasks > 0
    ? (status.completedTasks / status.totalTasks) * 100
    : 0;
  const progressBar = generateProgressBar(progress);
  console.log(`进度: ${progressBar} ${progress.toFixed(1)}%\n`);

  // 任务统计
  console.log(`总任务: ${status.totalTasks} | 待执行: ${status.pendingTasks} | 执行中: ${status.runningTasks} | 已完成: ${status.completedTasks} | 失败: ${status.failedTasks}\n`);

  // 系统健康
  const healthIcon = getHealthIcon(status.systemHealth);
  console.log(`系统状态: ${healthIcon} ${status.systemHealth}\n`);

  // 时间统计
  console.log(`平均时长: ${formatDuration(status.averageTaskDuration)} | 预计剩余: ${formatDuration(status.estimatedTimeRemaining)}\n`);

  // 质量评分
  console.log(`质量评分: ${status.averageQualityScore.toFixed(1)}/100\n`);

  console.log(chalk.gray(`最后更新: ${status.lastUpdate}`));
}

/**
 * 生成进度条
 */
function generateProgressBar(progress: number, width: number = 30): string {
  const filled = Math.round((progress / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * 格式化时长
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(0)}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}分${secs}秒`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分`;
  }
}

/**
 * 获取状态图标
 */
function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    pending: '⏳',
    running: '🔄',
    completed: '✅',
    failed: '❌',
    timeout: '⏱️',
    cancelled: '🚫',
  };
  return icons[status] || '❓';
}

/**
 * 获取健康图标
 */
function getHealthIcon(health: string): string {
  const icons: Record<string, string> = {
    healthy: '💚',
    degraded: '💛',
    critical: '❤️',
  };
  return icons[health] || '❓';
}

/**
 * 获取健康颜色
 */
function getHealthColor(health: string) {
  const colors: Record<string, any> = {
    healthy: chalk.green,
    degraded: chalk.yellow,
    critical: chalk.red,
  };
  return colors[health] || chalk.white;
}

/**
 * 注册 execute 命令
 */
export function registerExecuteCommand(program: Command) {
  const execute = program.command('execute').description('v3.0.0 Phase 3 执行监督命令');

  execute
    .command('start <task-id>')
    .description('启动任务执行')
    .action(executeStartCommand);

  execute
    .command('status')
    .description('查看执行状态')
    .action(executeStatusCommand);

  execute
    .command('session <session-id>')
    .description('查看会话详情')
    .action(executeSessionCommand);

  execute
    .command('cancel <session-id>')
    .description('取消任务执行')
    .action(executeCancelCommand);

  execute
    .command('monitor')
    .description('实时监控执行进度')
    .action(executeMonitorCommand);
}
