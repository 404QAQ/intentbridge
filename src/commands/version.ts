import chalk from 'chalk';
import {
  getHistory,
  getVersion,
  compareVersions,
  createSnapshot,
  listSnapshots,
  getVersionSummary,
} from '../services/version-control.js';
import { readRequirements, updateRequirement, writeRequirements } from '../services/store.js';
import { rollbackToVersion } from '../services/version-control.js';
import { prompt, closePrompt } from '../utils/prompt.js';

/**
 * ib req history <req-id>
 */
export function reqHistoryCommand(
  reqId: string,
  options?: { oneline?: boolean }
): void {
  const data = readRequirements();
  const req = data.requirements.find(r => r.id === reqId);

  if (!req) {
    console.log(chalk.red(`Requirement ${reqId} not found.`));
    return;
  }

  const history = getHistory(reqId);

  if (history.length === 0) {
    console.log(chalk.dim('No version history found.'));
    console.log(chalk.dim('Versions are tracked automatically when you update requirements.'));
    return;
  }

  console.log(chalk.bold(`Version History for ${reqId}: ${req.title}`));
  console.log('');

  if (options?.oneline) {
    for (const version of history) {
      const snapshotIcon = version.snapshot ? chalk.cyan('📸 ') : '   ';
      const tagStr = version.tag ? chalk.yellow(`[${version.tag}] `) : '';
      console.log(
        `${snapshotIcon}${chalk.green(version.version)} ${tagStr}${chalk.dim(new Date(version.timestamp).toLocaleString())}`
      );
      console.log(chalk.dim(`   ${version.changes.map(c => c.field).join(', ')}`));
    }
  } else {
    for (let i = history.length - 1; i >= 0; i--) {
      const version = history[i];
      const snapshotIcon = version.snapshot ? chalk.cyan('📸 ') : '';
      const tagStr = version.tag ? chalk.yellow(` [${version.tag}]`) : '';

      console.log(
        `${chalk.green(version.version)}${tagStr} ${chalk.dim(new Date(version.timestamp).toLocaleString())}`
      );

      if (version.message) {
        console.log(chalk.dim(`  ${version.message}`));
      }

      for (const change of version.changes) {
        console.log(`  ${chalk.cyan(change.field)}:`);
        console.log(`    ${chalk.red('-')} ${JSON.stringify(change.from)}`);
        console.log(`    ${chalk.green('+')} ${JSON.stringify(change.to)}`);
      }
      console.log('');
    }
  }

  // Summary
  const summary = getVersionSummary(reqId);
  console.log(chalk.dim('─'.repeat(50)));
  console.log(
    `Total: ${summary.totalVersions} versions | Snapshots: ${summary.snapshots}`
  );
}

/**
 * ib req diff <req-id> <from> <to>
 */
export function reqDiffCommand(
  reqId: string,
  fromVersion: string,
  toVersion: string
): void {
  const diff = compareVersions(reqId, fromVersion, toVersion);

  if (!diff) {
    console.log(chalk.red('Unable to compare versions. Please check version numbers.'));
    return;
  }

  console.log(chalk.bold(`Comparing ${reqId}: ${fromVersion} → ${toVersion}`));
  console.log('');

  if (diff.changes.length === 0) {
    console.log(chalk.dim('No differences found.'));
    return;
  }

  console.log(`Changed at: ${chalk.dim(new Date(diff.timestamp).toLocaleString())}`);
  console.log('');

  for (const change of diff.changes) {
    console.log(`${chalk.cyan(change.field)}:`);
    console.log(`  ${chalk.red('-')} ${JSON.stringify(change.from, null, 2).split('\n').join('\n  ')}`);
    console.log(`  ${chalk.green('+')} ${JSON.stringify(change.to, null, 2).split('\n').join('\n  ')}`);
    console.log('');
  }

  console.log(`Total changes: ${diff.changes.length}`);
}

/**
 * ib req diff <req-id> --last
 */
export function reqDiffLastCommand(reqId: string): void {
  const history = getHistory(reqId);

  if (history.length < 2) {
    console.log(chalk.red('Need at least 2 versions to compare.'));
    return;
  }

  const lastTwo = history.slice(-2);
  reqDiffCommand(reqId, lastTwo[0].version, lastTwo[1].version);
}

/**
 * ib req rollback <req-id> <version>
 */
export async function reqRollbackCommand(
  reqId: string,
  targetVersion: string,
  options?: { dryRun?: boolean }
): Promise<void> {
  const data = readRequirements();
  const req = data.requirements.find(r => r.id === reqId);

  if (!req) {
    console.log(chalk.red(`Requirement ${reqId} not found.`));
    return;
  }

  const target = getVersion(reqId, targetVersion);
  if (!target) {
    console.log(chalk.red(`Version ${targetVersion} not found.`));
    return;
  }

  console.log(chalk.bold(`Rollback ${reqId} to ${targetVersion}`));
  console.log('');

  // Show what will change
  const diff = compareVersions(reqId, targetVersion, getHistory(reqId).slice(-1)[0].version);

  if (!diff || diff.changes.length === 0) {
    console.log(chalk.yellow('No changes to rollback.'));
    return;
  }

  console.log('Changes to be reverted:');
  for (const change of diff.changes) {
    console.log(`  ${chalk.cyan(change.field)}:`);
    console.log(`    Current: ${JSON.stringify(change.to)}`);
    console.log(`    Will be: ${JSON.stringify(change.from)}`);
  }
  console.log('');

  if (options?.dryRun) {
    console.log(chalk.yellow('Dry run mode. No changes made.'));
    return;
  }

  // Confirm
  const confirm = await prompt('Proceed with rollback? (y/N): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log(chalk.yellow('Rollback cancelled.'));
    closePrompt();
    return;
  }

  // Perform rollback
  const rolledBack = rollbackToVersion(req, targetVersion);

  if (!rolledBack) {
    console.log(chalk.red('Rollback failed.'));
    closePrompt();
    return;
  }

  // Update requirement
  const idx = data.requirements.findIndex(r => r.id === reqId);
  data.requirements[idx] = rolledBack;
  writeRequirements(data);

  console.log(chalk.green(`✔ Rolled back ${reqId} to ${targetVersion}`));
  closePrompt();
}

/**
 * ib req snapshot <req-id> <tag>
 */
export async function reqSnapshotCommand(
  reqId: string,
  tag: string,
  options?: { message?: string }
): Promise<void> {
  const data = readRequirements();
  const req = data.requirements.find(r => r.id === reqId);

  if (!req) {
    console.log(chalk.red(`Requirement ${reqId} not found.`));
    return;
  }

  // Check if tag already exists
  const snapshots = listSnapshots(reqId);
  if (snapshots.some(s => s.tag === tag)) {
    console.log(chalk.red(`Snapshot with tag "${tag}" already exists.`));
    return;
  }

  let message = options?.message;

  if (!message) {
    message = await prompt('Snapshot message (optional): ');
  }

  const snapshot = createSnapshot(reqId, tag, message);

  if (!snapshot) {
    console.log(chalk.red('Failed to create snapshot.'));
    closePrompt();
    return;
  }

  console.log(chalk.green(`✔ Snapshot created: ${tag}`));
  console.log(`  Version: ${snapshot.version}`);
  console.log(`  Time: ${new Date(snapshot.timestamp).toLocaleString()}`);
  if (message) {
    console.log(`  Message: ${message}`);
  }

  closePrompt();
}

/**
 * ib req snapshots <req-id>
 */
export function reqSnapshotsCommand(reqId: string): void {
  const snapshots = listSnapshots(reqId);

  if (snapshots.length === 0) {
    console.log(chalk.dim('No snapshots found.'));
    console.log(chalk.dim('Create a snapshot with: ib req snapshot <req-id> <tag>'));
    return;
  }

  console.log(chalk.bold(`Snapshots for ${reqId}`));
  console.log('');

  for (const snapshot of snapshots) {
    console.log(`📸 ${chalk.cyan(snapshot.tag!)} ${chalk.green(snapshot.version)}`);
    console.log(`   Time: ${chalk.dim(new Date(snapshot.timestamp).toLocaleString())}`);
    if (snapshot.message) {
      console.log(`   Message: ${snapshot.message}`);
    }
    console.log('');
  }

  console.log(`Total: ${snapshots.length} snapshot(s)`);
}
