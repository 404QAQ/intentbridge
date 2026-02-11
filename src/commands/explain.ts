import chalk from 'chalk';
import {
  generateCompactExplanation,
  generateAllUnderstandingDocuments,
  readUnderstandingDocument,
  generateRequirementUnderstanding,
  writeUnderstandingDocument,
} from '../services/understanding-generator.js';
import { readRequirements } from '../services/store.js';
import { injectAnchor, removeAnchor, hasAnchor } from '../services/code-anchoring.js';

export function explainCommand(reqId: string, options: { format?: 'text' | 'json' }): void {
  try {
    const explanation = generateCompactExplanation(reqId, undefined, options);
    console.log(explanation);
  } catch (e: any) {
    console.error(chalk.red(e.message));
  }
}

export function genUnderstandingCommand(reqId?: string): void {
  if (reqId) {
    // Generate single requirement understanding
    const data = readRequirements();
    const req = data.requirements.find((r) => r.id === reqId);

    if (!req) {
      console.error(chalk.red(`Requirement ${reqId} not found`));
      return;
    }

    const understanding = generateRequirementUnderstanding(req, data.requirements);
    writeUnderstandingDocument(reqId, understanding);
    console.log(chalk.green(`✔ Generated understanding for ${reqId}`));
    console.log(chalk.dim(`  → .intentbridge/understanding/${reqId}.md`));
  } else {
    // Generate all understanding documents
    const results = generateAllUnderstandingDocuments();

    const success = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    console.log(chalk.green(`✔ Generated ${success.length} understanding documents`));

    if (failed.length > 0) {
      console.log(chalk.yellow(`⚠ ${failed.length} failed:`));
      for (const f of failed) {
        console.log(chalk.dim(`  - ${f.reqId}: ${f.error}`));
      }
    }

    console.log(chalk.dim('  → .intentbridge/understanding/'));
  }
}

export function showUnderstandingCommand(reqId: string): void {
  const doc = readUnderstandingDocument(reqId);

  if (!doc) {
    console.error(chalk.red(`Understanding document for ${reqId} not found`));
    console.log(chalk.dim(`Run \`ib gen-understanding ${reqId}\` to generate it`));
    return;
  }

  console.log(doc);
}

export function anchorAddCommand(reqId: string, filePath: string): void {
  const data = readRequirements();
  const req = data.requirements.find((r) => r.id === reqId);

  if (!req) {
    console.error(chalk.red(`Requirement ${reqId} not found`));
    return;
  }

  if (req.files.length === 0 || !req.files.includes(filePath)) {
    console.error(chalk.yellow(`Warning: ${filePath} is not mapped to ${reqId}`));
    console.log(chalk.dim(`Run \`ib map add ${reqId} ${filePath}\` first`));
  }

  try {
    injectAnchor(filePath, req);
    console.log(chalk.green(`✔ Injected anchor for ${reqId} into ${filePath}`));
  } catch (e: any) {
    console.error(chalk.red(`Error: ${e.message}`));
  }
}

export function anchorRemoveCommand(filePath: string): void {
  try {
    removeAnchor(filePath);
    console.log(chalk.green(`✔ Removed anchor from ${filePath}`));
  } catch (e: any) {
    console.error(chalk.red(`Error: ${e.message}`));
  }
}

export function anchorListCommand(reqId?: string): void {
  const data = readRequirements();

  if (reqId) {
    // List anchors for a specific requirement
    const req = data.requirements.find((r) => r.id === reqId);
    if (!req) {
      console.error(chalk.red(`Requirement ${reqId} not found`));
      return;
    }

    if (req.files.length === 0) {
      console.log(chalk.dim(`${reqId} has no mapped files`));
      return;
    }

    console.log(chalk.bold(`Anchors for ${reqId}:`));
    console.log('');

    for (const file of req.files) {
      const hasAnch = hasAnchor(file, reqId);
      const status = hasAnch ? chalk.green('✓') : chalk.dim('✗');
      console.log(`  ${status} ${file}`);
    }
  } else {
    // List all anchors across all requirements
    console.log(chalk.bold('Code Anchors:'));
    console.log('');

    let total = 0;
    for (const req of data.requirements) {
      if (req.files.length === 0) continue;

      const anchoredFiles: string[] = [];
      for (const file of req.files) {
        if (hasAnchor(file, req.id)) {
          anchoredFiles.push(file);
        }
      }

      if (anchoredFiles.length > 0) {
        console.log(chalk.bold(`${req.id}:`));
        for (const file of anchoredFiles) {
          console.log(`  ✓ ${file}`);
        }
        total += anchoredFiles.length;
      }
    }

    if (total === 0) {
      console.log(chalk.dim('No code anchors found'));
      console.log(chalk.dim('Use `ib anchor add <req-id> <file>` to add anchors'));
    } else {
      console.log('');
      console.log(chalk.dim(`Total: ${total} anchors`));
    }
  }
}
