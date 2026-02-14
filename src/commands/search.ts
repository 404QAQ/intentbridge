import chalk from 'chalk';
import { readRequirements } from '../services/store.js';
import type { Requirement } from '../models/types.js';

interface SearchQuery {
  text?: string;
  status?: string[];
  priority?: string[];
  tags?: string[];
  idPattern?: RegExp;
  titlePattern?: RegExp;
  descriptionPattern?: RegExp;
  createdAfter?: Date;
  createdBefore?: Date;
}

interface SearchOptions {
  sortBy?: 'id' | 'title' | 'status' | 'priority' | 'created';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  regex?: boolean;
  fuzzy?: boolean;
}

/**
 * Parse advanced search query
 * Examples:
 *   "auth" - simple text search
 *   "status:active priority:high" - filter by status and priority
 *   "tag:backend,api" - filter by tags
 *   "id:REQ-00*" - pattern match on ID
 *   "title:~auth" - fuzzy match on title
 */
function parseQuery(query: string): SearchQuery {
  const result: SearchQuery = {};
  const parts = query.split(/\s+/);

  for (const part of parts) {
    // Status filter: status:active,status:done
    if (part.startsWith('status:')) {
      const value = part.substring(7);
      result.status = value.split(',');
      continue;
    }

    // Priority filter: priority:high,priority:medium
    if (part.startsWith('priority:')) {
      const value = part.substring(9);
      result.priority = value.split(',');
      continue;
    }

    // Tag filter: tag:backend,tag:api
    if (part.startsWith('tag:')) {
      const value = part.substring(4);
      result.tags = value.split(',');
      continue;
    }

    // ID pattern: id:REQ-00*
    if (part.startsWith('id:')) {
      const value = part.substring(3);
      result.idPattern = new RegExp(value.replace(/\*/g, '.*'));
      continue;
    }

    // Title pattern: title:~auth
    if (part.startsWith('title:')) {
      const value = part.substring(6);
      if (value.startsWith('~')) {
        // Fuzzy match
        const fuzzyValue = value.substring(1).split('').join('.*');
        result.titlePattern = new RegExp(fuzzyValue, 'i');
      } else {
        result.titlePattern = new RegExp(value, 'i');
      }
      continue;
    }

    // Description pattern: desc:~auth
    if (part.startsWith('desc:') || part.startsWith('description:')) {
      const value = part.substring(part.startsWith('desc:') ? 5 : 11);
      if (value.startsWith('~')) {
        const fuzzyValue = value.substring(1).split('').join('.*');
        result.descriptionPattern = new RegExp(fuzzyValue, 'i');
      } else {
        result.descriptionPattern = new RegExp(value, 'i');
      }
      continue;
    }

    // Created after: created:>2024-01-01
    if (part.startsWith('created:')) {
      const value = part.substring(8);
      if (value.startsWith('>')) {
        result.createdAfter = new Date(value.substring(1));
      } else if (value.startsWith('<')) {
        result.createdBefore = new Date(value.substring(1));
      }
      continue;
    }

    // Regular text search
    if (!result.text) {
      result.text = part;
    } else {
      result.text += ' ' + part;
    }
  }

  return result;
}

/**
 * Match a requirement against search query
 */
function matchRequirement(req: Requirement, query: SearchQuery, options: SearchOptions): boolean {
  // Status filter
  if (query.status && !query.status.includes(req.status)) {
    return false;
  }

  // Priority filter
  if (query.priority && !query.priority.includes(req.priority)) {
    return false;
  }

  // Tags filter (AND logic)
  if (query.tags && query.tags.length > 0) {
    if (!req.tags || !query.tags.every(tag => req.tags!.includes(tag))) {
      return false;
    }
  }

  // ID pattern
  if (query.idPattern && !query.idPattern.test(req.id)) {
    return false;
  }

  // Title pattern
  if (query.titlePattern && !query.titlePattern.test(req.title)) {
    return false;
  }

  // Description pattern
  if (query.descriptionPattern && (!req.description || !query.descriptionPattern.test(req.description))) {
    return false;
  }

  // Created date filter
  if (query.createdAfter || query.createdBefore) {
    const createdDate = new Date(req.created);
    if (query.createdAfter && createdDate <= query.createdAfter) {
      return false;
    }
    if (query.createdBefore && createdDate >= query.createdBefore) {
      return false;
    }
  }

  // Regular text search
  if (query.text) {
    const textLower = query.text.toLowerCase();
    const searchFields = [req.id, req.title, req.description, ...(req.tags || [])].join(' ').toLowerCase();

    if (options.regex) {
      // Regex search
      try {
        const regex = new RegExp(query.text, 'i');
        if (!regex.test(searchFields)) {
          return false;
        }
      } catch {
        return false;
      }
    } else if (options.fuzzy) {
      // Fuzzy search
      const fuzzyPattern = query.text.split('').map(c => `${c}.*`).join('');
      const regex = new RegExp(fuzzyPattern, 'i');
      if (!regex.test(searchFields)) {
        return false;
      }
    } else {
      // Exact substring search
      if (!searchFields.includes(textLower)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Sort requirements
 */
function sortRequirements(requirements: Requirement[], options: SearchOptions): Requirement[] {
  const { sortBy = 'id', sortOrder = 'asc' } = options;

  return requirements.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'id':
        comparison = a.id.localeCompare(b.id);
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'status':
        const statusOrder = { draft: 0, active: 1, implementing: 2, done: 3 };
        comparison = statusOrder[a.status] - statusOrder[b.status];
        break;
      case 'priority':
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      case 'created':
        comparison = new Date(a.created).getTime() - new Date(b.created).getTime();
        break;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });
}

/**
 * Advanced search command
 */
export function advancedSearchCommand(
  query: string,
  options: SearchOptions = {}
): void {
  try {
    const parsedQuery = parseQuery(query);
    const data = readRequirements();

    // Filter requirements
    let results = data.requirements.filter(req =>
      matchRequirement(req, parsedQuery, options)
    );

    // Sort results
    results = sortRequirements(results, options);

    // Apply limit
    if (options.limit && options.limit > 0) {
      results = results.slice(0, options.limit);
    }

    // Display results
    if (results.length === 0) {
      console.log(chalk.dim(`No requirements found matching "${query}".`));
      return;
    }

    console.log(chalk.bold(`\nFound ${results.length} requirement${results.length > 1 ? 's' : ''} matching query:\n`));
    console.log(chalk.dim(`Query: ${query}`));
    if (options.sortBy) {
      console.log(chalk.dim(`Sorted by: ${options.sortBy} (${options.sortOrder || 'asc'})`));
    }
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

      console.log(`  ${chalk.cyan(req.id)} ${statusColor(`[${req.status}]`)} ${prio} ${chalk.bold(req.title)}`);

      if (req.tags && req.tags.length > 0) {
        console.log(chalk.dim(`    Tags: ${req.tags.join(', ')}`));
      }

      if (req.description) {
        const desc = req.description.substring(0, 80);
        console.log(chalk.dim(`    ${desc}${req.description.length > 80 ? '...' : ''}`));
      }

      console.log('');
    }

    // Show query breakdown
    console.log(chalk.dim('Query breakdown:'));
    if (parsedQuery.text) console.log(chalk.dim(`  - Text: ${parsedQuery.text}`));
    if (parsedQuery.status) console.log(chalk.dim(`  - Status: ${parsedQuery.status.join(', ')}`));
    if (parsedQuery.priority) console.log(chalk.dim(`  - Priority: ${parsedQuery.priority.join(', ')}`));
    if (parsedQuery.tags) console.log(chalk.dim(`  - Tags: ${parsedQuery.tags.join(', ')}`));

  } catch (error: any) {
    console.error(chalk.red('Search failed:'), error.message);
    process.exit(1);
  }
}
