import chalk from 'chalk';
import { detectSyncChanges, applySyncChange } from '../services/sync.js';
import { prompt, closePrompt } from '../utils/prompt.js';

export async function syncCommand(): Promise<void> {
  const changes = detectSyncChanges();

  if (changes.length === 0) {
    console.log(chalk.dim('All file mappings are up to date.'));
    return;
  }

  console.log(chalk.bold(`Found ${changes.length} mapping change(s):`));
  console.log('');

  for (let i = 0; i < changes.length; i++) {
    const c = changes[i];
    if (c.type === 'deleted') {
      console.log(`  ${chalk.red('✗ deleted')}  ${c.file}`);
      console.log(`    ${chalk.dim(`mapped in: ${c.reqIds.join(', ')}`)}`);
    } else {
      console.log(`  ${chalk.yellow('→ renamed')}  ${c.file} → ${chalk.cyan(c.newFile!)}`);
      console.log(`    ${chalk.dim(`mapped in: ${c.reqIds.join(', ')}`)}`);
    }
  }
  console.log('');

  const answer = await prompt('Apply these changes? (y/N): ');
  if (answer.toLowerCase() !== 'y') {
    console.log(chalk.dim('No changes applied.'));
    closePrompt();
    return;
  }

  for (const c of changes) {
    applySyncChange(c);
    if (c.type === 'deleted') {
      console.log(chalk.green(`  ✔ Removed mapping: ${c.file}`));
    } else {
      console.log(chalk.green(`  ✔ Updated mapping: ${c.file} → ${c.newFile}`));
    }
  }

  console.log('');
  console.log(chalk.dim('Run `ib gen` to update CLAUDE.md'));
  closePrompt();
}
