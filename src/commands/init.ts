import chalk from 'chalk';
import { isInitialized, writeProject, writeRequirements } from '../services/store.js';
import { generate } from '../services/generator.js';
import { prompt, promptWithDefault, closePrompt } from '../utils/prompt.js';
import type { ProjectConfig, RequirementsData } from '../models/types.js';

export interface InitOptions {
  name?: string;
  description?: string;
  tech?: string;
  conventions?: string;
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
  if (isInitialized()) {
    console.log(chalk.yellow('IntentBridge already initialized in this directory.'));
    return;
  }

  let name: string;
  let description: string;
  let tech_stack: string[];
  let conventions: string[];

  // 非交互式模式
  if (options.name) {
    name = options.name;
    description = options.description || '';
    tech_stack = options.tech
      ? options.tech.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    conventions = options.conventions
      ? options.conventions.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
  } else {
    // 交互式模式
    console.log(chalk.bold('Initialize IntentBridge'));
    console.log('');

    const inputName = await prompt('Project name: ');
    if (!inputName) {
      console.log(chalk.red('Project name is required.'));
      return;
    }
    name = inputName;

    description = await promptWithDefault('Description', '');
    const techInput = await prompt('Tech stack (comma-separated): ');
    tech_stack = techInput
      ? techInput.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const convInput = await prompt('Conventions (comma-separated, optional): ');
    conventions = convInput
      ? convInput.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
  }

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

  if (!options.name) {
    closePrompt();
  }
}
