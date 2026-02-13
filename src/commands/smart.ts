import chalk from 'chalk';
import {
  parseUserIntent,
  validateIntent,
  type UserIntent,
} from '../services/nlp-router.js';
import {
  detectCurrentProject,
  resolveProjectContext,
} from '../services/project-detector.js';
import {
  smartAddRequirement,
  analyzeRequirement,
} from '../services/smart-analyzer.js';
import { readRequirements, addRequirement, addRequirementFromTemplate, updateRequirement } from '../services/store.js';
import { getProject, listProjects } from '../services/global-store.js';
import { prompt, closePrompt } from '../utils/prompt.js';
import { join } from 'node:path';

/**
 * ib detect - Show detected project
 */
export function detectCommand(): void {
  const project = detectCurrentProject();

  if (!project) {
    console.log(chalk.yellow('No project detected in current directory.'));
    console.log('');
    console.log(chalk.dim('Options:'));
    console.log(chalk.dim('  - Run `ib init` to initialize a new project'));
    console.log(chalk.dim('  - Run `ib project register` to register an existing project'));
    console.log(chalk.dim('  - Navigate to a project directory'));
    return;
  }

  console.log(chalk.bold('Detected Project'));
  console.log('');
  console.log(`Name: ${chalk.cyan(project.name)}`);
  console.log(`Path: ${project.path}`);
  console.log(`Status: ${project.status}`);

  if (project.tags && project.tags.length > 0) {
    console.log(`Tags: ${project.tags.join(', ')}`);
  }

  console.log('');

  // Try to show requirements stats
  try {
    const data = readRequirements(project.path);
    console.log(chalk.bold('Requirements:'));
    console.log(`  Total: ${data.requirements.length}`);
    console.log(`  Done: ${data.requirements.filter(r => r.status === 'done').length}`);
    console.log(`  In Progress: ${data.requirements.filter(r => r.status === 'implementing').length}`);
  } catch {
    console.log(chalk.dim('Requirements data not available.'));
  }
}

/**
 * ib do - Natural language command router
 */
export async function doCommand(userPrompt: string): Promise<void> {
  console.log(chalk.dim(`Parsing: "${userPrompt}"`));
  console.log('');

  // Parse intent
  const intent = await parseUserIntent(userPrompt);

  // Validate intent
  const validation = validateIntent(intent);
  if (!validation.valid) {
    console.log(chalk.red('Failed to parse command:'));
    validation.errors.forEach(err => console.log(chalk.red(`  - ${err}`)));
    console.log('');
    console.log(chalk.dim('Example commands:'));
    console.log(chalk.dim('  ib do "在 project-a 添加用户认证需求"'));
    console.log(chalk.dim('  ib do "查看 project-b 的进度"'));
    console.log(chalk.dim('  ib do "更新 REQ-001 状态为 done"'));
    closePrompt();
    return;
  }

  // Display parsed intent
  console.log(chalk.bold('Parsed Intent:'));
  console.log(`  Action: ${chalk.cyan(intent.action)}`);
  console.log(`  Target: ${chalk.cyan(intent.targetType)}`);
  if (intent.projectName) {
    console.log(`  Project: ${chalk.cyan(intent.projectName)}`);
  }
  console.log(`  Params: ${JSON.stringify(intent.params)}`);
  console.log('');

  // Execute intent
  await executeIntent(intent);
  closePrompt();
}

/**
 * Execute parsed intent
 */
async function executeIntent(intent: UserIntent): Promise<void> {
  switch (intent.action) {
    case 'add':
      await executeAdd(intent);
      break;
    case 'list':
      await executeList(intent);
      break;
    case 'update':
      await executeUpdate(intent);
      break;
    case 'status':
      await executeStatus(intent);
      break;
    case 'search':
      await executeSearch(intent);
      break;
    default:
      console.log(chalk.yellow(`Action "${intent.action}" not implemented yet.`));
  }
}

/**
 * Execute add action
 */
async function executeAdd(intent: UserIntent): Promise<void> {
  const context = resolveProjectContext(intent.projectName);

  if (!context.project) {
    console.log(chalk.red(context.message || 'No project found'));
    return;
  }

  if (context.needsRegistration) {
    console.log(chalk.yellow(context.message));
    return;
  }

  if (intent.targetType === 'requirement') {
    const title = intent.params.title || await prompt('Requirement title: ');
    const description = intent.params.description || await prompt('Description (optional): ') || '';

    const req = addRequirement(
      title,
      description,
      'medium',
      context.project.path
    );

    console.log('');
    console.log(chalk.green(`✔ Created requirement ${chalk.bold(req.id)}: ${req.title}`));
    console.log(chalk.dim(`  Project: ${context.project.name}`));
    console.log(chalk.dim(`  Status: ${req.status}`));
    console.log(chalk.dim(`  Priority: ${req.priority}`));
  } else {
    console.log(chalk.yellow(`Adding ${intent.targetType} not implemented yet.`));
  }
}

/**
 * Execute list action
 */
async function executeList(intent: UserIntent): Promise<void> {
  const context = resolveProjectContext(intent.projectName);

  if (!context.project) {
    console.log(chalk.red(context.message || 'No project found'));
    return;
  }

  if (intent.targetType === 'requirement') {
    const data = readRequirements(context.project.path);
    const requirements = data.requirements;

    console.log(chalk.bold(`Requirements (${requirements.length})`));
    console.log('');

    for (const req of requirements) {
      const statusIcon =
        req.status === 'done' ? chalk.green('✓') :
        req.status === 'implementing' ? chalk.yellow('●') :
        '○';

      console.log(`${statusIcon} ${req.id}: ${req.title}`);
      console.log(chalk.dim(`  Status: ${req.status} | Priority: ${req.priority || 'medium'}`));
      console.log('');
    }
  } else if (intent.targetType === 'project') {
    const projects = listProjects();

    console.log(chalk.bold(`Projects (${projects.length})`));
    console.log('');

    for (const project of projects) {
      const statusIcon =
        project.status === 'active' ? chalk.green('●') :
        project.status === 'paused' ? chalk.yellow('●') :
        chalk.dim('○');

      console.log(`${statusIcon} ${project.name}`);
      console.log(chalk.dim(`  ${project.path}`));
      console.log('');
    }
  }
}

/**
 * Execute update action
 */
async function executeUpdate(intent: UserIntent): Promise<void> {
  const context = resolveProjectContext(intent.projectName);

  if (!context.project) {
    console.log(chalk.red(context.message || 'No project found'));
    return;
  }

  if (intent.targetType === 'requirement') {
    const { requirementId, status } = intent.params;

    if (!requirementId) {
      console.log(chalk.red('Requirement ID is required'));
      return;
    }

    if (!status) {
      console.log(chalk.red('Status is required'));
      return;
    }

    updateRequirement(requirementId, { status: status as any }, context.project.path);
    console.log(chalk.green(`✔ Updated ${requirementId} to ${status}`));
  } else {
    console.log(chalk.yellow(`Updating ${intent.targetType} not implemented yet.`));
  }
}

/**
 * Execute status action
 */
async function executeStatus(intent: UserIntent): Promise<void> {
  if (intent.targetType === 'global') {
    // Show global status
    const projects = listProjects();

    console.log(chalk.bold('Global Project Overview'));
    console.log(`Total Projects: ${projects.length}`);
    console.log(`  Active: ${projects.filter(p => p.status === 'active').length}`);
    console.log(`  Paused: ${projects.filter(p => p.status === 'paused').length}`);
    console.log('');

    for (const project of projects) {
      if (project.status === 'archived') continue;

      try {
        const data = readRequirements(project.path);
        const done = data.requirements.filter(r => r.status === 'done').length;
        const total = data.requirements.length;

        const statusIcon = project.status === 'active' ? chalk.green('●') : chalk.yellow('●');
        console.log(`${statusIcon} ${project.name}: ${done}/${total} requirements done`);
      } catch {
        console.log(`${chalk.dim('○')} ${project.name}: Unable to read requirements`);
      }
    }
  } else if (intent.targetType === 'project' && intent.projectName) {
    const project = getProject(intent.projectName);

    if (!project) {
      console.log(chalk.red(`Project "${intent.projectName}" not found`));
      return;
    }

    console.log(chalk.bold(`Project: ${project.name}`));
    console.log(`Path: ${project.path}`);
    console.log(`Status: ${project.status}`);
    console.log(`Priority: ${project.priority || 'medium'}`);

    try {
      const data = readRequirements(project.path);
      console.log('');
      console.log(chalk.bold('Requirements:'));
      console.log(`  Total: ${data.requirements.length}`);
      console.log(`  Done: ${data.requirements.filter(r => r.status === 'done').length}`);
      console.log(`  In Progress: ${data.requirements.filter(r => r.status === 'implementing').length}`);
    } catch {
      console.log(chalk.dim('Requirements data not available.'));
    }
  }
}

/**
 * Execute search action
 */
async function executeSearch(intent: UserIntent): Promise<void> {
  const context = resolveProjectContext(intent.projectName);

  if (!context.project) {
    console.log(chalk.red(context.message || 'No project found'));
    return;
  }

  const keyword = intent.params.keyword;
  if (!keyword) {
    console.log(chalk.red('Search keyword is required'));
    return;
  }

  const data = readRequirements(context.project.path);
  const results = data.requirements.filter(r =>
    r.title.toLowerCase().includes(keyword.toLowerCase()) ||
    r.description.toLowerCase().includes(keyword.toLowerCase())
  );

  console.log(chalk.bold(`Search Results for "${keyword}" (${results.length})`));
  console.log('');

  if (results.length === 0) {
    console.log(chalk.dim('No requirements found.'));
    return;
  }

  for (const req of results) {
    const statusIcon =
      req.status === 'done' ? chalk.green('✓') :
      req.status === 'implementing' ? chalk.yellow('●') :
      '○';

    console.log(`${statusIcon} ${req.id}: ${req.title}`);
    console.log(chalk.dim(`  Status: ${req.status}`));
    console.log('');
  }
}

/**
 * ib smart-add - Smart requirement addition with AI analysis
 */
export async function smartAddCommand(description: string): Promise<void> {
  console.log(chalk.bold('Smart Requirement Analysis'));
  console.log(chalk.dim(`Analyzing: "${description}"`));
  console.log('');

  // Detect project
  const context = resolveProjectContext();

  if (!context.project) {
    console.log(chalk.red(context.message || 'No project detected'));
    closePrompt();
    return;
  }

  console.log(chalk.dim(`Project: ${context.project.name}`));
  console.log('');

  try {
    // Analyze requirement
    console.log(chalk.dim('Step 1: Analyzing requirement...'));
    const analysis = await analyzeRequirement(description);

    console.log(chalk.cyan('Analysis Results:'));
    console.log(`  Category: ${analysis.category}`);
    console.log(`  Complexity: ${analysis.estimatedComplexity}`);
    console.log(`  Tags: ${analysis.tags.join(', ') || 'none'}`);
    console.log(`  Dependencies: ${analysis.dependencies.join(', ') || 'none'}`);
    console.log('');

    // Ask for confirmation
    const proceed = await prompt('Proceed to create project structure? (y/N): ');
    if (proceed.toLowerCase() !== 'y') {
      console.log(chalk.yellow('Cancelled.'));
      closePrompt();
      return;
    }

    // Create structure
    console.log('');
    console.log(chalk.dim('Step 2: Creating project structure...'));
    const result = await smartAddRequirement(description, context.project.path);

    console.log(chalk.green('✔ Project structure created:'));
    console.log(`  Created: ${result.structure.created.length} items`);
    console.log(`  Skipped: ${result.structure.skipped.length} items`);

    if (result.structure.errors.length > 0) {
      console.log(chalk.red(`  Errors: ${result.structure.errors.length}`));
      result.structure.errors.forEach(err => console.log(chalk.red(`    - ${err}`)));
    }

    console.log('');
    console.log(chalk.green('✔ README.md generated'));

    // Add requirement to IntentBridge
    console.log('');
    console.log(chalk.dim('Step 3: Adding requirement to IntentBridge...'));
    const req = addRequirementFromTemplate(
      analysis.summary,
      description,
      analysis.estimatedComplexity === 'high' ? 'high' : 'medium',
      analysis.tags,
      [],
      context.project.path
    );

    console.log(chalk.green(`✔ Requirement ${req.id} created`));
    console.log('');
    console.log(chalk.bold('Summary:'));
    console.log(`  Requirement ID: ${req.id}`);
    console.log(`  Project: ${context.project.name}`);
    console.log(`  Files Created: ${result.structure.created.length}`);
    console.log('');
    console.log(chalk.dim('Run `ib explain ' + req.id + '` for details'));

  } catch (e: any) {
    console.log(chalk.red(`Error: ${e.message}`));
  }

  closePrompt();
}
