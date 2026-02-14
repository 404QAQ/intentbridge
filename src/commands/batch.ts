import inquirer from 'inquirer';
import { readRequirements, updateRequirement, addTag, removeTag, addFileMapping } from '../services/store.js';
import { getPluginManager } from '../services/plugin-manager.js';
import type { RequirementStatus, RequirementPriority } from '../models/types.js';

interface BatchFilter {
  status?: string;
  priority?: string;
  tag?: string;
  pattern?: string;
}

interface BatchUpdates {
  status?: RequirementStatus;
  priority?: RequirementPriority;
  title?: string;
}

/**
 * Parse requirement ID pattern
 * Examples: REQ-001, REQ-{001..010}, REQ-*
 */
function parsePattern(pattern: string): string[] {
  // Handle range pattern: REQ-{001..010}
  const rangeMatch = pattern.match(/(.*)\{(\d+)\.\.(\d+)\}(.*)/);
  if (rangeMatch) {
    const [, prefix, start, end, suffix] = rangeMatch;
    const ids: string[] = [];
    const startNum = parseInt(start);
    const endNum = parseInt(end);
    const padLength = start.length;

    for (let i = startNum; i <= endNum; i++) {
      const numStr = i.toString().padStart(padLength, '0');
      ids.push(`${prefix}${numStr}${suffix}`);
    }
    return ids;
  }

  // Handle wildcard pattern: REQ-*
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    const data = readRequirements();
    return data.requirements.map(r => r.id).filter(id => regex.test(id));
  }

  // Single ID
  return [pattern];
}

/**
 * Filter requirements based on criteria
 */
function filterRequirements(filters: BatchFilter): string[] {
  const data = readRequirements();
  let requirements = data.requirements;

  if (filters.status) {
    requirements = requirements.filter(r => r.status === filters.status);
  }

  if (filters.priority) {
    requirements = requirements.filter(r => r.priority === filters.priority);
  }

  if (filters.tag) {
    requirements = requirements.filter(r => r.tags && r.tags.includes(filters.tag!));
  }

  return requirements.map(r => r.id);
}

/**
 * Interactive requirement selection
 */
async function interactiveSelection(): Promise<string[]> {
  const data = readRequirements();

  const { selectedIds } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedIds',
      message: 'Select requirements:',
      choices: data.requirements.map(r => ({
        name: `${r.id} - ${r.title} [${r.status}]`,
        value: r.id,
        short: r.id,
      })),
      pageSize: 15,
    },
  ]);

  return selectedIds;
}

/**
 * Batch update requirements
 */
export async function batchUpdateCommand(
  patternOrIds: string,
  updates: BatchUpdates,
  options: { dryRun?: boolean; interactive?: boolean; status?: string; priority?: string; tag?: string }
): Promise<void> {
  try {
    let ids: string[];

    // Get IDs based on mode
    if (options.interactive) {
      ids = await interactiveSelection();
    } else if (options.status || options.priority || options.tag) {
      ids = filterRequirements({
        status: options.status,
        priority: options.priority,
        tag: options.tag,
      });
    } else {
      ids = parsePattern(patternOrIds);
    }

    if (ids.length === 0) {
      console.log('No requirements found matching the criteria.');
      return;
    }

    console.log(`\n📋 Found ${ids.length} requirement(s) to update:\n`);
    ids.forEach(id => console.log(`  - ${id}`));
    console.log('');

    if (options.dryRun) {
      console.log('🔍 Dry run mode - no changes will be made.\n');
      console.log('Updates to apply:');
      if (updates.status) console.log(`  - Status: ${updates.status}`);
      if (updates.priority) console.log(`  - Priority: ${updates.priority}`);
      if (updates.title) console.log(`  - Title: ${updates.title}`);
      return;
    }

    // Confirm before proceeding
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Update ${ids.length} requirement(s)?`,
        default: false,
      },
    ]);

    if (!confirm) {
      console.log('Operation cancelled.');
      return;
    }

    // Perform updates
    let successCount = 0;
    let failCount = 0;

    for (const id of ids) {
      try {
        updateRequirement(id, updates);
        successCount++;

        // Execute plugin hooks
        const manager = getPluginManager(process.cwd());
        await manager.executeHook('requirement:update', {
          data: { id, updates },
          cwd: process.cwd(),
        });

        console.log(`✅ Updated: ${id}`);
      } catch (error: any) {
        failCount++;
        console.error(`❌ Failed to update ${id}: ${error.message}`);
      }
    }

    console.log(`\n✨ Batch update complete!`);
    console.log(`   Success: ${successCount}`);
    if (failCount > 0) {
      console.log(`   Failed: ${failCount}`);
    }
  } catch (error: any) {
    console.error('Batch update failed:', error.message);
    process.exit(1);
  }
}

/**
 * Batch add tags
 */
export async function batchTagCommand(
  patternOrIds: string,
  tags: string[],
  options: { dryRun?: boolean; interactive?: boolean; status?: string; priority?: string; tag?: string; remove?: boolean }
): Promise<void> {
  try {
    let ids: string[];

    if (options.interactive) {
      ids = await interactiveSelection();
    } else if (options.status || options.priority || options.tag) {
      ids = filterRequirements({
        status: options.status,
        priority: options.priority,
        tag: options.tag,
      });
    } else {
      ids = parsePattern(patternOrIds);
    }

    if (ids.length === 0) {
      console.log('No requirements found matching the criteria.');
      return;
    }

    console.log(`\n🏷️  ${options.remove ? 'Remove' : 'Add'} tags from ${ids.length} requirement(s):\n`);
    console.log(`  Tags: ${tags.join(', ')}`);
    console.log(`  Requirements:`);
    ids.forEach(id => console.log(`    - ${id}`));
    console.log('');

    if (options.dryRun) {
      console.log('🔍 Dry run mode - no changes will be made.');
      return;
    }

    // Confirm
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `${options.remove ? 'Remove' : 'Add'} tags from ${ids.length} requirement(s)?`,
        default: false,
      },
    ]);

    if (!confirm) {
      console.log('Operation cancelled.');
      return;
    }

    // Perform operation
    let successCount = 0;
    let failCount = 0;

    for (const id of ids) {
      try {
        for (const tag of tags) {
          if (options.remove) {
            removeTag(id, tag);
          } else {
            addTag(id, tag);
          }
        }
        successCount++;
        console.log(`✅ ${options.remove ? 'Removed from' : 'Tagged'}: ${id}`);
      } catch (error: any) {
        failCount++;
        console.error(`❌ Failed to tag ${id}: ${error.message}`);
      }
    }

    console.log(`\n✨ Batch tagging complete!`);
    console.log(`   Success: ${successCount}`);
    if (failCount > 0) {
      console.log(`   Failed: ${failCount}`);
    }
  } catch (error: any) {
    console.error('Batch tagging failed:', error.message);
    process.exit(1);
  }
}

/**
 * Batch mark as done
 */
export async function batchDoneCommand(
  patternOrIds: string,
  options: { dryRun?: boolean; interactive?: boolean; status?: string; priority?: string; tag?: string }
): Promise<void> {
  await batchUpdateCommand(
    patternOrIds,
    { status: 'done' },
    { ...options, status: options.status || 'active' }
  );
}

/**
 * Batch map files
 */
export async function batchMapCommand(
  patternOrIds: string,
  files: string[],
  options: { dryRun?: boolean; interactive?: boolean; status?: string; priority?: string; tag?: string }
): Promise<void> {
  try {
    let ids: string[];

    if (options.interactive) {
      ids = await interactiveSelection();
    } else if (options.status || options.priority || options.tag) {
      ids = filterRequirements({
        status: options.status,
        priority: options.priority,
        tag: options.tag,
      });
    } else {
      ids = parsePattern(patternOrIds);
    }

    if (ids.length === 0) {
      console.log('No requirements found matching the criteria.');
      return;
    }

    console.log(`\n📁 Map files to ${ids.length} requirement(s):\n`);
    console.log(`  Files: ${files.join(', ')}`);
    console.log(`  Requirements:`);
    ids.forEach(id => console.log(`    - ${id}`));
    console.log('');

    if (options.dryRun) {
      console.log('🔍 Dry run mode - no changes will be made.');
      return;
    }

    // Confirm
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Map ${files.length} file(s) to ${ids.length} requirement(s)?`,
        default: false,
      },
    ]);

    if (!confirm) {
      console.log('Operation cancelled.');
      return;
    }

    // Perform mapping
    let successCount = 0;
    let failCount = 0;

    for (const id of ids) {
      try {
        addFileMapping(id, files);
        successCount++;
        console.log(`✅ Mapped: ${id}`);
      } catch (error: any) {
        failCount++;
        console.error(`❌ Failed to map ${id}: ${error.message}`);
      }
    }

    console.log(`\n✨ Batch mapping complete!`);
    console.log(`   Success: ${successCount}`);
    if (failCount > 0) {
      console.log(`   Failed: ${failCount}`);
    }
  } catch (error: any) {
    console.error('Batch mapping failed:', error.message);
    process.exit(1);
  }
}
