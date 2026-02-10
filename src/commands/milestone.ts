import chalk from 'chalk';
import {
  createMilestone,
  removeMilestone,
  addRequirementToMilestone,
  removeRequirementFromMilestone,
  setMilestoneStatus,
  listMilestones,
  getMilestonesWithProgress,
} from '../services/milestone.js';
import { prompt, closePrompt } from '../utils/prompt.js';

export async function milestoneCreateCommand(name?: string, dueDate?: string): Promise<void> {
  if (!name) {
    name = await prompt('Milestone name: ');
    if (!name) {
      console.log(chalk.red('Name is required.'));
      closePrompt();
      return;
    }
  }

  if (!dueDate) {
    dueDate = await prompt('Due date (YYYY-MM-DD, optional): ');
  }

  try {
    const milestone = createMilestone(name, dueDate || undefined);
    console.log(chalk.green(`✔ Created milestone: ${milestone.name}`));
    if (milestone.due_date) {
      console.log(chalk.dim(`  Due: ${milestone.due_date}`));
    }
    console.log(chalk.dim('  Use `ib milestone add <name> <req-id>` to add requirements'));
    closePrompt();
  } catch (e: any) {
    console.log(chalk.red(e.message));
    closePrompt();
  }
}

export function milestoneRemoveCommand(name: string): void {
  try {
    removeMilestone(name);
    console.log(chalk.green(`✔ Removed milestone: ${name}`));
  } catch (e: any) {
    console.log(chalk.red(e.message));
  }
}

export function milestoneAddCommand(milestoneName: string, reqId: string): void {
  try {
    const milestone = addRequirementToMilestone(milestoneName, reqId);
    console.log(chalk.green(`✔ Added ${reqId} to milestone "${milestoneName}"`));
    console.log(chalk.dim(`  Total: ${milestone.requirements.length} requirements`));
  } catch (e: any) {
    console.log(chalk.red(e.message));
  }
}

export function milestoneRemoveReqCommand(milestoneName: string, reqId: string): void {
  try {
    const milestone = removeRequirementFromMilestone(milestoneName, reqId);
    console.log(chalk.green(`✔ Removed ${reqId} from milestone "${milestoneName}"`));
    console.log(chalk.dim(`  Remaining: ${milestone.requirements.length} requirements`));
  } catch (e: any) {
    console.log(chalk.red(e.message));
  }
}

export function milestoneStatusCommand(name: string, status: string): void {
  const validStatuses = ['planned', 'active', 'completed'];
  if (!validStatuses.includes(status)) {
    console.log(chalk.red(`Invalid status. Must be one of: ${validStatuses.join(', ')}`));
    return;
  }

  try {
    const milestone = setMilestoneStatus(name, status as 'planned' | 'active' | 'completed');
    console.log(chalk.green(`✔ Set milestone "${name}" status to ${status}`));
  } catch (e: any) {
    console.log(chalk.red(e.message));
  }
}

export function milestoneListCommand(): void {
  const milestonesWithProgress = getMilestonesWithProgress();

  if (milestonesWithProgress.length === 0) {
    console.log(chalk.dim('No milestones found.'));
    console.log(chalk.dim('Use `ib milestone create` to create one.'));
    return;
  }

  console.log(chalk.bold('Project Milestones:'));
  console.log('');

  for (const { milestone, progress } of milestonesWithProgress) {
    // Status icon and color
    let statusIcon: string;
    let statusColor: typeof chalk;
    switch (milestone.status) {
      case 'completed':
        statusIcon = '✓';
        statusColor = chalk.green;
        break;
      case 'active':
        statusIcon = '▶';
        statusColor = chalk.yellow;
        break;
      default:
        statusIcon = '☐';
        statusColor = chalk.dim;
    }

    // Progress bar
    const filled = Math.floor(progress.percentage / 10);
    const empty = 10 - filled;
    const bar = chalk.green('█'.repeat(filled)) + chalk.dim('░'.repeat(empty));

    // Milestone name and progress
    console.log(
      `  ${statusColor(statusIcon)} ${chalk.bold(milestone.name.padEnd(25))} ${bar} ${progress.percentage}%`
    );
    console.log(
      `    ${chalk.dim(`${progress.done}/${progress.total} done`)}${milestone.due_date ? `    ${chalk.magenta(`📅 ${milestone.due_date}`)}` : ''}`
    );

    // Show requirement IDs
    if (milestone.requirements.length > 0) {
      console.log(chalk.dim(`    ${milestone.requirements.join(', ')}`));
    }

    console.log('');
  }
}
