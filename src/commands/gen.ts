import chalk from 'chalk';
import { generate } from '../services/generator.js';

export function genCommand(): void {
  const block = generate();
  console.log(chalk.green('✔ CLAUDE.md updated'));
}
