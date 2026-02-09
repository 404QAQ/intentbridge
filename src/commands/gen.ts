import chalk from 'chalk';
import { generate } from '../services/generator.js';
import { readRequirements } from '../services/store.js';
import { estimateTokens, formatTokenWarning } from '../utils/tokens.js';

export function genCommand(focus?: string): void {
  let focusIds: string[] | undefined;

  if (focus) {
    focusIds = focus.split(',').map((s) => s.trim()).filter(Boolean);
    // Validate IDs exist
    const data = readRequirements();
    const allIds = new Set(data.requirements.map((r) => r.id));
    const invalid = focusIds.filter((id) => !allIds.has(id));
    if (invalid.length > 0) {
      console.log(chalk.yellow(`Warning: unknown requirement(s): ${invalid.join(', ')}`));
      focusIds = focusIds.filter((id) => allIds.has(id));
    }
    if (focusIds.length === 0) {
      console.log(chalk.red('No valid requirement IDs to focus on.'));
      return;
    }
  }

  const block = generate(undefined, focusIds);
  const tokens = estimateTokens(block);

  if (focusIds) {
    console.log(chalk.green(`✔ CLAUDE.md updated (focus: ${focusIds.join(', ')}) — ~${tokens} tokens`));
  } else {
    console.log(chalk.green(`✔ CLAUDE.md updated — ~${tokens} tokens`));
  }

  const warning = formatTokenWarning(tokens);
  if (warning) {
    console.log(chalk.yellow(warning));
  }
}
