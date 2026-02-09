import chalk from 'chalk';
import { isInitialized, writeProject, writeRequirements } from '../services/store.js';
import { generate } from '../services/generator.js';
import { prompt, promptWithDefault, closePrompt } from '../utils/prompt.js';
import type { ProjectConfig, RequirementsData } from '../models/types.js';

export async function initCommand(): Promise<void> {
  if (isInitialized()) {
    console.log(chalk.yellow('IntentBridge already initialized in this directory.'));
    return;
  }

  console.log(chalk.bold('Initialize IntentBridge'));
  console.log('');

  const name = await prompt('Project name: ');
  if (!name) {
    console.log(chalk.red('Project name is required.'));
    return;
  }

  const description = await promptWithDefault('Description', '');
  const techInput = await prompt('Tech stack (comma-separated): ');
  const tech_stack = techInput
    ? techInput.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  const convInput = await prompt('Conventions (comma-separated, optional): ');
  const conventions = convInput
    ? convInput.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const config: ProjectConfig = {
    version: '1',
    project: { name, description, tech_stack, conventions },
  };

  writeProject(config);

  const reqData: RequirementsData = { requirements: [] };
  writeRequirements(reqData);

  generate();

  console.log('');
  console.log(chalk.green('✔ IntentBridge initialized.'));
  console.log(`  Created ${chalk.cyan('.intentbridge/')} directory`);
  console.log(`  Generated ${chalk.cyan('CLAUDE.md')}`);
  closePrompt();
}
