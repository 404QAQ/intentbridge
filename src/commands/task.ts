/**
 * task 命令 - v3.0.0 任务管理命令
 *
 * 功能：
 * - task list: 查看任务列表
 * - task show: 查看任务详情
 * - task decompose: 拆解需求为任务
 * - task plan: 查看执行计划
 */

import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import {
  readTasks,
  decomposeRequirement,
  getNextTaskId,
  updateTask,
} from '../services/task-decomposition.js';
import { readRequirements } from '../services/store.js';
import type { Task, ExecutionPlan } from '../models/types.js';

/**
 * task list 命令
 */
export async function taskListCommand(options: { requirement?: string; status?: string; type?: string }) {
  try {
    const tasksData = readTasks();

    if (tasksData.tasks.length === 0) {
      console.log(chalk.yellow('\n⚠️  暂无任务'));
      console.log(chalk.gray('提示: 使用 `ib task decompose <requirement-id>` 从需求拆解任务\n'));
      return;
    }

    // 过滤任务
    let tasks = tasksData.tasks;

    if (options.requirement) {
      tasks = tasks.filter((t) => t.requirementId === options.requirement);
    }

    if (options.status) {
      tasks = tasks.filter((t) => t.status === options.status);
    }

    if (options.type) {
      tasks = tasks.filter((t) => t.type === options.type);
    }

    // 显示任务列表
    displayTaskTable(tasks);

    // 显示统计
    displayTaskStats(tasksData.tasks);
  } catch (error: any) {
    console.error(chalk.red(`\n❌ 错误: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * task show 命令
 */
export async function taskShowCommand(taskId: string) {
  try {
    const tasksData = readTasks();
    const task = tasksData.tasks.find((t) => t.id === taskId);

    if (!task) {
      console.error(chalk.red(`\n❌ 任务 ${taskId} 不存在\n`));
      process.exit(1);
    }

    displayTaskDetail(task);
  } catch (error: any) {
    console.error(chalk.red(`\n❌ 错误: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * task decompose 命令
 */
export async function taskDecomposeCommand(requirementId: string) {
  try {
    console.log(chalk.cyan(`\n🔨 正在拆解需求: ${requirementId}...\n`));

    const tasksData = await decomposeRequirement(requirementId);

    console.log(chalk.green(`✅ 成功拆解 ${tasksData.tasks.length} 个任务\n`));

    // 显示任务列表
    const newTasks = tasksData.tasks.filter((t) => t.requirementId === requirementId);
    displayTaskTable(newTasks);

    // 显示执行计划
    if (tasksData.executionPlan) {
      displayExecutionPlanSummary(tasksData.executionPlan);
    }

    console.log(chalk.gray('\n查看所有任务: ib task list'));
    console.log(chalk.gray('查看执行计划: ib task plan\n'));
  } catch (error: any) {
    console.error(chalk.red(`\n❌ 错误: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * task plan 命令
 */
export async function taskPlanCommand() {
  try {
    const tasksData = readTasks();

    if (!tasksData.executionPlan) {
      console.log(chalk.yellow('\n⚠️  暂无执行计划'));
      console.log(chalk.gray('提示: 先使用 `ib task decompose <requirement-id>` 拆解任务\n'));
      return;
    }

    displayExecutionPlan(tasksData.executionPlan);
  } catch (error: any) {
    console.error(chalk.red(`\n❌ 错误: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * task update 命令
 */
export async function taskUpdateCommand(
  taskId: string,
  options: { status?: string; hours?: string }
) {
  try {
    const updates: { status?: string; actualHours?: number } = {};

    if (options.status) {
      const validStatuses = ['pending', 'in_progress', 'done', 'failed', 'blocked'];
      if (!validStatuses.includes(options.status)) {
        console.error(chalk.red(`\n❌ 无效的状态: ${options.status}`));
        console.log(chalk.gray(`有效状态: ${validStatuses.join(', ')}\n`));
        process.exit(1);
      }
      updates.status = options.status;
    }

    if (options.hours) {
      const hours = parseFloat(options.hours);
      if (isNaN(hours) || hours < 0) {
        console.error(chalk.red(`\n❌ 无效的工时: ${options.hours}\n`));
        process.exit(1);
      }
      updates.actualHours = hours;
    }

    if (!updates.status && updates.actualHours === undefined) {
      console.error(chalk.red('\n❌ 请至少指定 --status 或 --hours 选项\n'));
      process.exit(1);
    }

    const task = updateTask(taskId, updates);

    console.log(chalk.green(`\n✅ 任务 ${taskId} 已更新`));

    if (updates.status) {
      console.log(`  状态: ${getStatusIcon(task.status)} ${task.status}`);
    }

    if (updates.actualHours !== undefined) {
      console.log(`  实际工时: ${task.actualHours}小时`);
    }

    console.log();
  } catch (error: any) {
    console.error(chalk.red(`\n❌ 错误: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * 显示任务表格
 */
function displayTaskTable(tasks: Task[]) {
  const table = new Table({
    head: [
      chalk.bold('ID'),
      chalk.bold('名称'),
      chalk.bold('类型'),
      chalk.bold('优先级'),
      chalk.bold('状态'),
      chalk.bold('工时'),
    ],
    colWidths: [10, 40, 12, 10, 15, 10],
  });

  tasks.forEach((task) => {
    const statusIcon = getStatusIcon(task.status);
    const priorityColor = getPriorityColor(task.priority);
    const typeIcon = getTypeIcon(task.type);

    table.push([
      task.id,
      task.name.substring(0, 38),
      `${typeIcon} ${task.type}`,
      priorityColor(task.priority),
      `${statusIcon} ${task.status}`,
      `${task.estimatedHours}h`,
    ]);
  });

  console.log(table.toString());
}

/**
 * 显示任务详情
 */
function displayTaskDetail(task: Task) {
  console.log(chalk.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.bold(`  任务详情: ${task.id}`));
  console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  console.log(chalk.bold('基本信息:'));
  console.log(`  名称: ${task.name}`);
  console.log(`  描述: ${task.description}`);
  console.log(`  需求: ${task.requirementId}`);
  console.log(`  类型: ${getTypeIcon(task.type)} ${task.type}`);
  console.log(`  优先级: ${getPriorityColor(task.priority)(task.priority)}`);
  console.log(`  状态: ${getStatusIcon(task.status)} ${task.status}`);
  console.log();

  console.log(chalk.bold('时间信息:'));
  console.log(`  预估工时: ${task.estimatedHours}小时`);
  if (task.actualHours) {
    console.log(`  实际工时: ${task.actualHours}小时`);
  }
  if (task.startedAt) {
    console.log(`  开始时间: ${task.startedAt}`);
  }
  if (task.completedAt) {
    console.log(`  完成时间: ${task.completedAt}`);
  }
  console.log();

  if (task.dependsOn.length > 0) {
    console.log(chalk.bold('依赖任务:'));
    task.dependsOn.forEach((depId) => {
      console.log(chalk.gray(`  - ${depId}`));
    });
    console.log();
  }

  if (task.qualityMetrics) {
    console.log(chalk.bold('质量指标:'));
    if (task.qualityMetrics.codeQualityScore !== undefined) {
      console.log(`  代码质量: ${task.qualityMetrics.codeQualityScore}/100`);
    }
    if (task.qualityMetrics.testCoverage !== undefined) {
      console.log(`  测试覆盖率: ${task.qualityMetrics.testCoverage}%`);
    }
    if (task.qualityMetrics.issues.length > 0) {
      console.log(chalk.yellow(`  问题数: ${task.qualityMetrics.issues.length}`));
    }
    console.log();
  }

  console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
}

/**
 * 显示任务统计
 */
function displayTaskStats(tasks: Task[]) {
  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
    failed: tasks.filter((t) => t.status === 'failed').length,
    totalHours: tasks.reduce((sum, t) => sum + t.estimatedHours, 0),
  };

  console.log(chalk.bold('\n统计信息:'));
  console.log(`  总任务数: ${stats.total}`);
  console.log(`  ⏳ 待开始: ${stats.pending}`);
  console.log(`  🔄 进行中: ${stats.inProgress}`);
  console.log(`  ✅ 已完成: ${stats.done}`);
  if (stats.failed > 0) {
    console.log(chalk.red(`  ❌ 失败: ${stats.failed}`));
  }
  console.log(chalk.gray(`  预估总工时: ${stats.totalHours}小时\n`));
}

/**
 * 显示执行计划摘要
 */
function displayExecutionPlanSummary(plan: ExecutionPlan) {
  console.log(chalk.bold('\n执行计划摘要:'));
  console.log(chalk.gray(`  总任务数: ${plan.tasks.length}`));
  console.log(chalk.gray(`  预估总工时: ${plan.estimatedTotalHours}小时`));
  console.log(chalk.gray(`  里程碑数: ${plan.milestones.length}`));
  console.log();
}

/**
 * 显示执行计划详情
 */
function displayExecutionPlan(plan: ExecutionPlan) {
  console.log(chalk.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.bold('  执行计划'));
  console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  console.log(chalk.bold('概览:'));
  console.log(`  总任务数: ${plan.tasks.length}`);
  console.log(`  预估总工时: ${plan.estimatedTotalHours}小时`);
  console.log();

  console.log(chalk.bold('里程碑:'));
  plan.milestones.forEach((milestone, i) => {
    const statusIcon = milestone.status === 'completed' ? '✅' : milestone.status === 'active' ? '🔄' : '⏳';
    console.log(`  ${i + 1}. ${statusIcon} ${milestone.name} (${milestone.tasks.length}个任务)`);
  });
  console.log();

  console.log(chalk.bold('执行顺序 (拓扑排序):'));
  const topologyTasks = plan.dependencyGraph.topologyOrder.map((id) =>
    plan.tasks.find((t) => t.id === id)
  );

  topologyTasks.forEach((task, i) => {
    if (!task) return;
    const icon = getStatusIcon(task.status);
    console.log(`  ${i + 1}. ${icon} ${task.id}: ${task.name}`);
  });

  console.log();
  console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
}

/**
 * 获取状态图标
 */
function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    pending: '⏳',
    in_progress: '🔄',
    done: '✅',
    failed: '❌',
    blocked: '🚫',
  };
  return icons[status] || '❓';
}

/**
 * 获取优先级颜色
 */
function getPriorityColor(priority: string) {
  const colors: Record<string, any> = {
    P0: chalk.red,
    P1: chalk.yellow,
    P2: chalk.gray,
  };
  return colors[priority] || chalk.white;
}

/**
 * 获取类型图标
 */
function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    frontend: '🎨',
    backend: '⚙️',
    testing: '🧪',
    deployment: '🚀',
  };
  return icons[type] || '📦';
}

/**
 * 注册 task 命令
 */
export function registerTaskCommand(program: Command) {
  const task = program.command('task').description('v3.0.0 任务管理命令');

  task
    .command('list')
    .description('查看任务列表')
    .option('-r, --requirement <id>', '按需求过滤')
    .option('-s, --status <status>', '按状态过滤')
    .option('-t, --type <type>', '按类型过滤')
    .action(taskListCommand);

  task
    .command('show <task-id>')
    .description('查看任务详情')
    .action(taskShowCommand);

  task
    .command('decompose <requirement-id>')
    .description('从需求拆解任务')
    .action(taskDecomposeCommand);

  task
    .command('plan')
    .description('查看执行计划')
    .action(taskPlanCommand);

  task
    .command('update <task-id>')
    .description('更新任务状态')
    .option('-s, --status <status>', '任务状态 (pending, in_progress, done, failed, blocked)')
    .option('-h, --hours <hours>', '实际工时')
    .action(taskUpdateCommand);
}
