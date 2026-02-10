import chalk from 'chalk';
import {
  readRequirements,
  addRequirement,
  updateRequirement,
  removeRequirement,
  addNote,
  addAcceptanceCriterion,
  acceptCriterion,
  addDependency,
  removeDependency,
  searchRequirements,
  addTag,
  removeTag,
  getTags,
  findByTag,
} from '../services/store.js';
import { exportRequirements } from '../services/exporter.js';
import { loadTemplate, listTemplates, applyTemplate, getTemplateVariables } from '../services/template.js';
import { prompt, promptWithDefault, closePrompt } from '../utils/prompt.js';
import { writeFileSync } from 'node:fs';
import type { RequirementPriority, RequirementStatus } from '../models/types.js';

const VALID_STATUSES: RequirementStatus[] = ['draft', 'active', 'implementing', 'done'];
const VALID_PRIORITIES: RequirementPriority[] = ['high', 'medium', 'low'];

export async function reqAddCommand(template?: string): Promise<void> {
  if (template) {
    await reqAddCommandWithTemplate(template);
    return;
  }

  console.log(chalk.bold('Add Requirement'));
  console.log('');

  const title = await prompt('Title: ');
  if (!title) {
    console.log(chalk.red('Title is required.'));
    return;
  }

  const description = await promptWithDefault('Description', '');
  const prioInput = await promptWithDefault('Priority (high/medium/low)', 'medium');
  const priority = VALID_PRIORITIES.includes(prioInput as RequirementPriority)
    ? (prioInput as RequirementPriority)
    : 'medium';

  const req = addRequirement(title, description, priority);
  console.log('');
  console.log(chalk.green(`✔ Created ${chalk.bold(req.id)}: ${req.title}`));
  console.log(chalk.dim('  Run `ib gen` to update CLAUDE.md'));
  closePrompt();
}

export function reqListCommand(): void {
  const data = readRequirements();
  if (data.requirements.length === 0) {
    console.log(chalk.dim('No requirements yet. Run `ib req add` to create one.'));
    return;
  }

  const groups: Record<string, typeof data.requirements> = {};
  for (const r of data.requirements) {
    if (!groups[r.status]) groups[r.status] = [];
    groups[r.status].push(r);
  }

  const statusOrder: RequirementStatus[] = ['implementing', 'active', 'draft', 'done'];
  for (const status of statusOrder) {
    const reqs = groups[status];
    if (!reqs || reqs.length === 0) continue;

    const color =
      status === 'implementing' ? chalk.magenta :
      status === 'active' ? chalk.blue :
      status === 'done' ? chalk.green :
      chalk.dim;

    console.log(color(`\n  ${status.toUpperCase()} (${reqs.length})`));
    for (const r of reqs) {
      const prio =
        r.priority === 'high' ? chalk.red('H') :
        r.priority === 'medium' ? chalk.yellow('M') :
        chalk.dim('L');
      const files = r.files.length > 0 ? chalk.dim(` [${r.files.length} files]`) : '';
      console.log(`    ${r.id}  ${prio}  ${r.title}${files}`);
    }
  }
  console.log('');
}

export function reqUpdateCommand(
  id: string,
  options: { status?: string; title?: string; desc?: string }
): void {
  const updates: Partial<{ title: string; description: string; status: RequirementStatus; priority: RequirementPriority }> = {};

  if (options.status) {
    if (!VALID_STATUSES.includes(options.status as RequirementStatus)) {
      console.log(chalk.red(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`));
      return;
    }
    updates.status = options.status as RequirementStatus;
  }
  if (options.title) updates.title = options.title;
  if (options.desc) updates.description = options.desc;

  if (Object.keys(updates).length === 0) {
    console.log(chalk.yellow('No updates specified. Use --status, --title, or --desc.'));
    return;
  }

  const req = updateRequirement(id, updates);
  console.log(chalk.green(`✔ Updated ${req.id}: ${req.title}`));
  console.log(chalk.dim('  Run `ib gen` to update CLAUDE.md'));
}

export function reqDoneCommand(id: string): void {
  const req = updateRequirement(id, { status: 'done' });
  console.log(chalk.green(`✔ ${req.id} marked as done: ${req.title}`));
  console.log(chalk.dim('  Run `ib gen` to update CLAUDE.md'));
}

export function reqRemoveCommand(id: string): void {
  removeRequirement(id);
  console.log(chalk.green(`✔ Removed ${id}`));
  console.log(chalk.dim('  Run `ib gen` to update CLAUDE.md'));
}

export function reqNoteCommand(id: string, message: string): void {
  const req = addNote(id, message);
  console.log(chalk.green(`✔ Note added to ${req.id}`));
  console.log(chalk.dim('  Run `ib gen` to update CLAUDE.md'));
}

export function reqNotesCommand(id: string): void {
  const data = readRequirements();
  const req = data.requirements.find((r) => r.id === id);
  if (!req) {
    console.log(chalk.red(`Requirement ${id} not found`));
    return;
  }
  if (!req.notes || req.notes.length === 0) {
    console.log(chalk.dim(`No notes for ${id}.`));
    return;
  }
  console.log(chalk.bold(`Notes for ${req.id}: ${req.title}`));
  console.log('');
  for (const note of req.notes) {
    console.log(`  ${chalk.dim(note.date)}  ${note.content}`);
  }
  console.log('');
}

export function reqAcCommand(id: string, criterion: string): void {
  const req = addAcceptanceCriterion(id, criterion);
  console.log(chalk.green(`✔ Acceptance criterion added to ${req.id}`));
  console.log(chalk.dim('  Run `ib gen` to update CLAUDE.md'));
}

export function reqAcceptCommand(id: string, index: string): void {
  const idx = parseInt(index, 10);
  if (isNaN(idx)) {
    console.log(chalk.red('Index must be a number.'));
    return;
  }
  const req = acceptCriterion(id, idx);
  console.log(chalk.green(`✔ Criterion #${idx} marked done for ${req.id}`));
  console.log(chalk.dim('  Run `ib gen` to update CLAUDE.md'));
}

export function reqAcListCommand(id: string): void {
  const data = readRequirements();
  const req = data.requirements.find((r) => r.id === id);
  if (!req) {
    console.log(chalk.red(`Requirement ${id} not found`));
    return;
  }
  if (!req.acceptance || req.acceptance.length === 0) {
    console.log(chalk.dim(`No acceptance criteria for ${id}.`));
    return;
  }
  console.log(chalk.bold(`Acceptance criteria for ${req.id}: ${req.title}`));
  console.log('');
  for (let i = 0; i < req.acceptance.length; i++) {
    const ac = req.acceptance[i];
    const mark = ac.done ? chalk.green('[x]') : chalk.dim('[ ]');
    console.log(`  ${chalk.dim(String(i))} ${mark} ${ac.criterion}`);
  }
  console.log('');
}

export function reqDepCommand(id: string, depId: string): void {
  const req = addDependency(id, depId);
  console.log(chalk.green(`✔ ${req.id} now depends on ${depId}`));
  console.log(chalk.dim('  Run `ib gen` to update CLAUDE.md'));
}

export function reqUndepCommand(id: string, depId: string): void {
  const req = removeDependency(id, depId);
  console.log(chalk.green(`✔ Removed dependency ${id} → ${depId}`));
  console.log(chalk.dim('  Run `ib gen` to update CLAUDE.md'));
}

export function reqDepsCommand(id: string): void {
  const data = readRequirements();
  const req = data.requirements.find((r) => r.id === id);
  if (!req) {
    console.log(chalk.red(`Requirement ${id} not found`));
    return;
  }
  if (!req.depends_on || req.depends_on.length === 0) {
    console.log(chalk.dim(`${id} has no dependencies.`));
    return;
  }
  console.log(chalk.bold(`Dependencies for ${req.id}: ${req.title}`));
  console.log('');
  for (const depId of req.depends_on) {
    const dep = data.requirements.find((r) => r.id === depId);
    const label = dep ? `${dep.id} [${dep.status}] ${dep.title}` : depId;
    console.log(`  → ${label}`);
  }
  console.log('');
}

export function reqSearchCommand(keyword: string): void {
  if (!keyword || keyword.trim() === '') {
    console.log(chalk.red('Search keyword is required.'));
    return;
  }

  const results = searchRequirements(keyword);

  if (results.length === 0) {
    console.log(chalk.dim(`No requirements found matching "${keyword}".`));
    return;
  }

  console.log(chalk.bold(`Found ${results.length} requirement${results.length > 1 ? 's' : ''} matching "${keyword}":`));
  console.log('');

  for (const req of results) {
    const statusColor =
      req.status === 'implementing' ? chalk.magenta :
      req.status === 'active' ? chalk.blue :
      req.status === 'done' ? chalk.green :
      chalk.dim;
    const prio =
      req.priority === 'high' ? chalk.red('H') :
      req.priority === 'medium' ? chalk.yellow('M') :
      chalk.dim('L');

    console.log(`  ${req.id} ${statusColor(`[${req.status}]`)} ${prio} ${chalk.bold(req.title)}`);

    // Show matching context
    const lowerKeyword = keyword.toLowerCase();
    let matchedIn = false;

    if (req.description.toLowerCase().includes(lowerKeyword)) {
      const preview = req.description.length > 60
        ? req.description.substring(0, 60) + '...'
        : req.description;
      console.log(`    ${chalk.dim('描述:')} ${preview}`);
      matchedIn = true;
    }

    if (req.notes && req.notes.some((n) => n.content.toLowerCase().includes(lowerKeyword))) {
      const matchingNotes = req.notes.filter((n) => n.content.toLowerCase().includes(lowerKeyword));
      for (const note of matchingNotes) {
        const preview = note.content.length > 60
          ? note.content.substring(0, 60) + '...'
          : note.content;
        console.log(`    ${chalk.dim('决策:')} ${preview}`);
      }
      matchedIn = true;
    }

    console.log('');
  }
}

export function reqTagCommand(id: string, tag: string): void {
  if (!tag || tag.trim() === '') {
    console.log(chalk.red('Tag is required.'));
    return;
  }
  const req = addTag(id, tag);
  const tags = req.tags?.join(', ') || 'none';
  console.log(chalk.green(`✔ Added tag "${tag}" to ${req.id}`));
  console.log(chalk.dim(`  Tags: ${tags}`));
  console.log(chalk.dim('  Run `ib gen` to update CLAUDE.md'));
}

export function reqUntagCommand(id: string, tag: string): void {
  const req = removeTag(id, tag);
  const tags = req.tags?.join(', ') || 'none';
  console.log(chalk.green(`✔ Removed tag "${tag}" from ${req.id}`));
  console.log(chalk.dim(`  Tags: ${tags}`));
  console.log(chalk.dim('  Run `ib gen` to update CLAUDE.md'));
}

export function reqTagsCommand(): void {
  const tagCounts = getTags();
  if (tagCounts.size === 0) {
    console.log(chalk.dim('No tags found. Use `ib req tag <id> <tag>` to add tags.'));
    return;
  }

  console.log(chalk.bold(`All tags (${Array.from(tagCounts.values()).reduce((a, b) => a + b, 0)} requirements):`));
  console.log('');

  // Sort by count (descending), then by name
  const sortedTags = Array.from(tagCounts.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1]; // count desc
    return a[0].localeCompare(b[0]); // name asc
  });

  for (const [tag, count] of sortedTags) {
    console.log(`  ${chalk.cyan(tag.padEnd(15))} ${chalk.yellow(`(${count})`)}`);
  }
  console.log('');
}

export function reqExportCommand(format: 'markdown' | 'json', output?: string): void {
  const content = exportRequirements(format);

  if (output) {
    writeFileSync(output, content, 'utf-8');
    console.log(chalk.green(`✔ Exported to ${chalk.bold(output)}`));
  } else {
    console.log(content);
  }
}

export async function reqAddCommandWithTemplate(templateName: string): Promise<void> {
  const template = loadTemplate(templateName);
  if (!template) {
    console.log(chalk.red(`Template "${templateName}" not found.`));
    console.log(chalk.dim('Run `ib req templates` to list available templates.'));
    closePrompt();
    return;
  }

  console.log(chalk.bold(`Using template: ${templateName}`));
  console.log(chalk.dim(`  ${template.description}`));
  console.log('');

  // Get variables from template
  const variables = getTemplateVariables(template);
  const variableValues: Record<string, string> = {};

  for (const v of variables) {
    const value = await prompt(`${v}: `);
    if (!value) {
      console.log(chalk.red(`${v} is required.`));
      closePrompt();
      return;
    }
    variableValues[v] = value;
  }

  // Apply template
  const requirementData = applyTemplate(template, variableValues);

  // Ask for priority
  const prioInput = await promptWithDefault('Priority (high/medium/low)', 'medium');
  const priority = VALID_PRIORITIES.includes(prioInput as RequirementPriority)
    ? (prioInput as RequirementPriority)
    : 'medium';

  // Ask for additional tags
  const additionalTagsInput = await promptWithDefault('Additional tags (comma-separated)', '');
  const additionalTags = additionalTagsInput
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t);

  const allTags = [...new Set([...(requirementData.tags || []), ...additionalTags])];

  // Create requirement
  const { addRequirementFromTemplate } = await import('../services/store.js');
  const req = addRequirementFromTemplate(
    requirementData.title,
    requirementData.description,
    priority,
    allTags,
    requirementData.acceptance || []
  );

  console.log('');
  console.log(chalk.green(`✔ Created ${chalk.bold(req.id)}: ${req.title}`));
  if (req.tags && req.tags.length > 0) {
    console.log(chalk.dim(`  Tags: ${req.tags.join(', ')}`));
  }
  if (req.acceptance && req.acceptance.length > 0) {
    console.log(chalk.dim(`  Acceptance criteria: ${req.acceptance.length} items`));
  }
  console.log(chalk.dim('  Run `ib gen` to update CLAUDE.md'));
  closePrompt();
}

export function reqTemplatesCommand(): void {
  const templates = listTemplates();

  if (templates.size === 0) {
    console.log(chalk.dim('No templates available.'));
    return;
  }

  console.log(chalk.bold('Available templates:'));
  console.log('');

  for (const [name, info] of templates) {
    console.log(`  ${chalk.cyan(name.padEnd(15))} ${info.description}`);
  }
  console.log('');
  console.log(chalk.dim('Usage: ib req add --template <name>'));
}
