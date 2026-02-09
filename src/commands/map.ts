import chalk from 'chalk';
import { addFileMapping, removeFileMapping, readRequirements } from '../services/store.js';

export function mapAddCommand(reqId: string, files: string[]): void {
  if (files.length === 0) {
    console.log(chalk.red('At least one file path is required.'));
    return;
  }
  const req = addFileMapping(reqId, files);
  console.log(chalk.green(`✔ Mapped ${files.length} file(s) to ${req.id}`));
  for (const f of files) {
    console.log(`  + ${f}`);
  }
  console.log(chalk.dim('  Run `ib gen` to update CLAUDE.md'));
}

export function mapRemoveCommand(reqId: string, file: string): void {
  const req = removeFileMapping(reqId, file);
  console.log(chalk.green(`✔ Removed ${file} from ${req.id}`));
  console.log(chalk.dim('  Run `ib gen` to update CLAUDE.md'));
}

export function mapListCommand(): void {
  const data = readRequirements();
  const mapped = data.requirements.filter((r) => r.files.length > 0);

  if (mapped.length === 0) {
    console.log(chalk.dim('No file mappings yet. Run `ib map add <req-id> <file...>` to add.'));
    return;
  }

  for (const r of mapped) {
    console.log(`\n  ${chalk.bold(r.id)} ${r.title}`);
    for (const f of r.files) {
      console.log(`    ${chalk.cyan(f)}`);
    }
  }
  console.log('');
}

export function mapWhichCommand(file: string): void {
  const data = readRequirements();
  const matches = data.requirements.filter((r) =>
    r.files.some((f) => f.includes(file))
  );

  if (matches.length === 0) {
    console.log(chalk.dim(`No requirements mapped to "${file}".`));
    return;
  }

  console.log(chalk.bold(`Requirements related to "${file}":`));
  console.log('');
  for (const r of matches) {
    const statusColor =
      r.status === 'implementing' ? chalk.magenta :
      r.status === 'active' ? chalk.blue :
      r.status === 'done' ? chalk.green :
      chalk.dim;
    console.log(`  ${r.id}  ${statusColor(`[${r.status}]`)}  ${r.title}`);
  }
  console.log('');
}
