import chalk from 'chalk';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import inquirer from 'inquirer';
import { getIntentBridgeDir } from '../utils/paths.js';
import { readRequirements } from '../services/store.js';
import type { Requirement } from '../models/types.js';

const TEMPLATES_DIR = 'templates';

interface TemplateVariable {
  name: string;
  description?: string;
  default?: string;
  required?: boolean;
}

interface Template {
  name: string;
  description: string;
  variables?: TemplateVariable[];
  content: Partial<Requirement>;
}

/**
 * Get templates directory
 */
function getTemplatesDir(cwd?: string): string {
  const ibDir = getIntentBridgeDir(cwd);
  const templatesDir = join(ibDir, TEMPLATES_DIR);

  if (!existsSync(templatesDir)) {
    mkdirSync(templatesDir, { recursive: true });
  }

  return templatesDir;
}

/**
 * Load template by name
 */
export function loadTemplate(name: string, cwd?: string): Template | null {
  const templatesDir = getTemplatesDir(cwd);
  const templatePath = join(templatesDir, `${name}.yaml`);

  if (!existsSync(templatePath)) {
    return null;
  }

  const content = readFileSync(templatePath, 'utf-8');
  return yaml.load(content) as Template;
}

/**
 * List all templates
 */
export function templateListCommand(): void {
  try {
    const templatesDir = getTemplatesDir();
    const files = readdirSync(templatesDir).filter(f => f.endsWith('.yaml'));

    console.log(chalk.bold('\n📋 Available Templates:\n'));

    if (files.length === 0) {
      console.log(chalk.dim('No custom templates found.'));
      console.log(chalk.dim('\nCreate a template with: ib template create <name>'));
      return;
    }

    for (const file of files) {
      const templateName = file.replace('.yaml', '');
      const template = loadTemplate(templateName);

      if (template) {
        console.log(`  ${chalk.cyan(templateName)} - ${template.description || 'No description'}`);
        if (template.variables && template.variables.length > 0) {
          console.log(chalk.dim(`    Variables: ${template.variables.map(v => v.name).join(', ')}`));
        }
      }
    }

    console.log('');
    console.log(chalk.dim(`Total: ${files.length} template(s)`));

  } catch (error: any) {
    console.error(chalk.red('Failed to list templates:'), error.message);
    process.exit(1);
  }
}

/**
 * Create new template
 */
export async function templateCreateCommand(name?: string): Promise<void> {
  try {
    if (!name) {
      const { inputName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'inputName',
          message: 'Template name:',
          validate: (input) => input.trim() !== '' || 'Name is required',
        },
      ]);
      name = inputName;
    }

    const { description, addVariables } = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Template description:',
      },
      {
        type: 'confirm',
        name: 'addVariables',
        message: 'Add template variables?',
        default: false,
      },
    ]);

    let variables: TemplateVariable[] = [];

    if (addVariables) {
      let addMore = true;

      while (addMore) {
        const { varName, varDesc, varDefault, varRequired, continueAdd } = await inquirer.prompt([
          {
            type: 'input',
            name: 'varName',
            message: 'Variable name:',
            validate: (input) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(input) || 'Invalid variable name',
          },
          {
            type: 'input',
            name: 'varDesc',
            message: 'Variable description:',
          },
          {
            type: 'input',
            name: 'varDefault',
            message: 'Default value (leave empty for none):',
          },
          {
            type: 'confirm',
            name: 'varRequired',
            message: 'Is this variable required?',
            default: true,
          },
          {
            type: 'confirm',
            name: 'continueAdd',
            message: 'Add another variable?',
            default: false,
          },
        ]);

        variables.push({
          name: varName,
          description: varDesc || undefined,
          default: varDefault || undefined,
          required: varRequired,
        });

        addMore = continueAdd;
      }
    }

    // Create template structure
    const template: Template = {
      name: name!,
      description: description || '',
      variables: variables.length > 0 ? variables : undefined,
      content: {
        title: variables.find(v => v.name === 'title')?.default || 'New Requirement',
        description: variables.find(v => v.name === 'description')?.default || '',
        status: 'draft',
        priority: 'medium',
        tags: [],
        files: [],
      },
    };

    // Save template
    const templatesDir = getTemplatesDir();
    const templatePath = join(templatesDir, `${name}.yaml`);
    writeFileSync(templatePath, yaml.dump(template, { lineWidth: -1 }), 'utf-8');

    console.log(chalk.green('\n✅ Template created successfully!'));
    console.log(chalk.dim(`   File: ${templatePath}`));

    const { editNow } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'editNow',
        message: 'Edit template file now?',
        default: false,
      },
    ]);

    if (editNow) {
      console.log(chalk.dim('\nOpening template file for editing...'));
      console.log(chalk.dim('Template structure:\n'));
      console.log(yaml.dump(template, { lineWidth: -1 }));
    }

  } catch (error: any) {
    console.error(chalk.red('Template creation failed:'), error.message);
    process.exit(1);
  }
}

/**
 * Create template from existing requirement
 */
export async function templateFromReqCommand(reqId?: string): Promise<void> {
  try {
    if (!reqId) {
      const data = readRequirements();
      const { selectedId } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedId',
          message: 'Select requirement to create template from:',
          choices: data.requirements.map(r => ({
            name: `${r.id} - ${r.title}`,
            value: r.id,
          })),
        },
      ]);
      reqId = selectedId;
    }

    const data = readRequirements();
    const req = data.requirements.find(r => r.id === reqId!);

    if (!req) {
      console.error(chalk.red(`Requirement ${reqId} not found`));
      process.exit(1);
    }

    const { templateName, templateDesc } = await inquirer.prompt([
      {
        type: 'input',
        name: 'templateName',
        message: 'Template name:',
        default: reqId ? reqId.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'new-template',
        validate: (input) => input.trim() !== '' || 'Name is required',
      },
      {
        type: 'input',
        name: 'templateDesc',
        message: 'Template description:',
        default: `Template based on ${reqId}`,
      },
    ]);

    // Create template from requirement
    const template: Template = {
      name: templateName,
      description: templateDesc,
      content: {
        title: req.title,
        description: req.description,
        status: 'draft',
        priority: req.priority,
        tags: req.tags,
        acceptance: req.acceptance,
      },
    };

    // Save template
    const templatesDir = getTemplatesDir();
    const templatePath = join(templatesDir, `${templateName}.yaml`);
    writeFileSync(templatePath, yaml.dump(template, { lineWidth: -1 }), 'utf-8');

    console.log(chalk.green('\n✅ Template created from requirement!'));
    console.log(chalk.dim(`   File: ${templatePath}`));
    console.log(chalk.dim(`   Based on: ${reqId}`));

  } catch (error: any) {
    console.error(chalk.red('Template creation failed:'), error.message);
    process.exit(1);
  }
}

/**
 * Show template details
 */
export function templateShowCommand(name: string): void {
  try {
    const template = loadTemplate(name);

    if (!template) {
      console.error(chalk.red(`Template "${name}" not found`));
      process.exit(1);
    }

    console.log(chalk.bold(`\n📋 Template: ${name}\n`));
    console.log(chalk.dim(`Description: ${template.description || 'No description'}`));

    if (template.variables && template.variables.length > 0) {
      console.log(chalk.bold('\nVariables:'));
      for (const variable of template.variables) {
        console.log(`  ${chalk.cyan(variable.name)}`);
        if (variable.description) console.log(chalk.dim(`    ${variable.description}`));
        if (variable.default) console.log(chalk.dim(`    Default: ${variable.default}`));
        console.log(chalk.dim(`    Required: ${variable.required ? 'Yes' : 'No'}`));
      }
    }

    console.log(chalk.bold('\nContent:'));
    console.log(yaml.dump(template.content, { lineWidth: -1 }));

  } catch (error: any) {
    console.error(chalk.red('Failed to show template:'), error.message);
    process.exit(1);
  }
}

/**
 * Delete template
 */
export async function templateDeleteCommand(name: string): Promise<void> {
  try {
    const templatesDir = getTemplatesDir();
    const templatePath = join(templatesDir, `${name}.yaml`);

    if (!existsSync(templatePath)) {
      console.error(chalk.red(`Template "${name}" not found`));
      process.exit(1);
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Delete template "${name}"?`,
        default: false,
      },
    ]);

    if (!confirm) {
      console.log('Operation cancelled.');
      return;
    }

    const { unlinkSync } = await import('fs');
    unlinkSync(templatePath);

    console.log(chalk.green(`\n✅ Template "${name}" deleted`));

  } catch (error: any) {
    console.error(chalk.red('Template deletion failed:'), error.message);
    process.exit(1);
  }
}
