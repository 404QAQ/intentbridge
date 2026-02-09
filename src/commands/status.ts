import chalk from 'chalk';
import { readProject, readRequirements } from '../services/store.js';

export function statusCommand(): void {
  const project = readProject();
  const data = readRequirements();

  const counts: Record<string, number> = { draft: 0, active: 0, implementing: 0, done: 0 };
  for (const r of data.requirements) {
    counts[r.status] = (counts[r.status] || 0) + 1;
  }

  console.log('');
  console.log(chalk.bold(`  ${project.project.name}`));
  if (project.project.description) {
    console.log(chalk.dim(`  ${project.project.description}`));
  }
  console.log('');

  console.log('  Requirements:');
  console.log(`    ${chalk.dim('Draft')}         ${counts.draft}`);
  console.log(`    ${chalk.blue('Active')}        ${counts.active}`);
  console.log(`    ${chalk.magenta('Implementing')}  ${counts.implementing}`);
  console.log(`    ${chalk.green('Done')}          ${counts.done}`);
  console.log(`    ${chalk.bold('Total')}         ${data.requirements.length}`);
  console.log('');

  // Show currently active/implementing
  const current = data.requirements.filter(
    (r) => r.status === 'active' || r.status === 'implementing'
  );
  if (current.length > 0) {
    console.log('  In Progress:');
    for (const r of current) {
      const statusColor = r.status === 'implementing' ? chalk.magenta : chalk.blue;
      console.log(`    ${r.id} ${statusColor(`[${r.status}]`)} ${r.title}`);
    }
    console.log('');
  }
}
