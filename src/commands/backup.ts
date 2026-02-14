import { createWriteStream, createReadStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { createGzip, createGunzip } from 'zlib';
import { glob } from 'glob';
import archiver from 'archiver';
import extractor from 'unzipper';
import chalk from 'chalk';
import { getIntentBridgeDir } from '../utils/paths.js';

const BACKUPS_DIR = 'backups';

interface BackupMetadata {
  version: string;
  timestamp: string;
  size: number;
  type: 'full' | 'incremental';
}

/**
 * Get backups directory
 */
function getBackupsDir(cwd?: string): string {
  const ibDir = getIntentBridgeDir(cwd);
  const backupsDir = join(ibDir, BACKUPS_DIR);

  if (!existsSync(backupsDir)) {
    mkdirSync(backupsDir, { recursive: true });
  }

  return backupsDir;
}

/**
 * Create backup
 */
export async function backupCreateCommand(options: { output?: string; compress?: boolean }): Promise<void> {
  try {
    const ibDir = getIntentBridgeDir();
    const backupsDir = getBackupsDir();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = options.output || `backup-${timestamp}.tar.gz`;
    const backupPath = join(backupsDir, filename);

    console.log(chalk.bold('\n📦 Creating backup...\n'));

    // Create tar.gz archive
    const output = createWriteStream(backupPath);
    const archive = archiver('tar', { gzip: options.compress !== false });

    archive.pipe(output);

    // Add .intentbridge directory (excluding backups and plugins)
    archive.directory(ibDir, 'intentbridge', (entry) => {
      if (entry.name.includes('backups') || entry.name.includes('plugins/node_modules')) {
        return false;
      }
      return entry;
    });

    await archive.finalize();

    const stats = statSync(backupPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

    console.log(chalk.green('✅ Backup created successfully!'));
    console.log(chalk.dim(`   File: ${backupPath}`));
    console.log(chalk.dim(`   Size: ${sizeMB} MB`));
    console.log('');

  } catch (error: any) {
    console.error(chalk.red('Backup failed:'), error.message);
    process.exit(1);
  }
}

/**
 * Restore backup
 */
export async function backupRestoreCommand(backupFile: string, options: { dryRun?: boolean }): Promise<void> {
  try {
    const ibDir = getIntentBridgeDir();
    const backupsDir = getBackupsDir();
    const backupPath = join(backupsDir, backupFile);

    if (!existsSync(backupPath)) {
      console.error(chalk.red(`Backup file not found: ${backupFile}`));
      console.log(chalk.dim('\nAvailable backups:'));
      listBackups();
      process.exit(1);
    }

    console.log(chalk.bold('\n📥 Restoring backup...\n'));
    console.log(chalk.dim(`File: ${backupPath}`));

    if (options.dryRun) {
      console.log(chalk.yellow('\n🔍 Dry run mode - no changes will be made.\n'));
      console.log('This backup contains:');
      console.log('  - requirements.yaml');
      console.log('  - project.yaml');
      console.log('  - file mappings');
      console.log('  - version history');
      return;
    }

    // Extract backup
    await pipeline(
      createReadStream(backupPath),
      createGunzip(),
      extractor.Extract({ path: ibDir })
    );

    console.log(chalk.green('\n✅ Backup restored successfully!'));
    console.log('');

  } catch (error: any) {
    console.error(chalk.red('Restore failed:'), error.message);
    process.exit(1);
  }
}

/**
 * List backups
 */
export function backupListCommand(): void {
  try {
    console.log(chalk.bold('\n📋 Available Backups:\n'));
    listBackups();
  } catch (error: any) {
    console.error(chalk.red('Failed to list backups:'), error.message);
    process.exit(1);
  }
}

function listBackups(): void {
  const backupsDir = getBackupsDir();
  const files = readdirSync(backupsDir)
    .filter(f => f.endsWith('.tar.gz') || f.endsWith('.tar'))
    .map(f => {
      const filePath = join(backupsDir, f);
      const stats = statSync(filePath);
      return {
        name: f,
        size: (stats.size / 1024 / 1024).toFixed(2),
        date: stats.mtime.toISOString().split('T')[0],
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  if (files.length === 0) {
    console.log(chalk.dim('No backups found.'));
    console.log(chalk.dim('\nCreate a backup with: ib backup create'));
    return;
  }

  for (const file of files) {
    console.log(`  ${chalk.cyan(file.name)} - ${file.size} MB - ${file.date}`);
  }

  console.log('');
  console.log(chalk.dim(`Total: ${files.length} backup(s)`));
}

/**
 * Delete old backups
 */
export function backupPruneCommand(options: { keep?: number; days?: number }): void {
  try {
    const backupsDir = getBackupsDir();
    const files = readdirSync(backupsDir)
      .filter(f => f.endsWith('.tar.gz') || f.endsWith('.tar'))
      .map(f => {
        const filePath = join(backupsDir, f);
        const stats = statSync(filePath);
        return {
          name: f,
          path: filePath,
          date: stats.mtime,
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    let toDelete: typeof files = [];

    if (options.keep) {
      toDelete = files.slice(options.keep);
    } else if (options.days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - options.days);
      toDelete = files.filter(f => f.date < cutoff);
    }

    if (toDelete.length === 0) {
      console.log(chalk.dim('\nNo backups to delete.'));
      return;
    }

    console.log(chalk.bold('\n🗑️  Deleting old backups:\n'));

    for (const file of toDelete) {
      console.log(`  ${file.name} - ${file.date.toISOString().split('T')[0]}`);
      unlinkSync(file.path);
    }

    console.log(chalk.green(`\n✅ Deleted ${toDelete.length} backup(s)`));

  } catch (error: any) {
    console.error(chalk.red('Prune failed:'), error.message);
    process.exit(1);
  }
}
