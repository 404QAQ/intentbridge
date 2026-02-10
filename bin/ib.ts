#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from '../src/commands/init.js';
import { reqAddCommand, reqListCommand, reqUpdateCommand, reqDoneCommand, reqRemoveCommand, reqNoteCommand, reqNotesCommand, reqAcCommand, reqAcceptCommand, reqAcListCommand, reqDepCommand, reqUndepCommand, reqDepsCommand, reqSearchCommand, reqTagCommand, reqUntagCommand, reqTagsCommand, reqExportCommand, reqTemplatesCommand } from '../src/commands/req.js';
import { mapAddCommand, mapRemoveCommand, mapListCommand, mapWhichCommand } from '../src/commands/map.js';
import {
  milestoneCreateCommand,
  milestoneRemoveCommand,
  milestoneAddCommand,
  milestoneRemoveReqCommand,
  milestoneStatusCommand,
  milestoneListCommand,
} from '../src/commands/milestone.js';
import { genCommand } from '../src/commands/gen.js';
import { statusCommand } from '../src/commands/status.js';
import { syncCommand } from '../src/commands/sync.js';

const program = new Command();

program
  .name('ib')
  .description('IntentBridge — project context manager for Claude Code')
  .version('1.1.0');

// ib init
program
  .command('init')
  .description('Initialize IntentBridge in current directory')
  .action(async () => {
    try {
      await initCommand();
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

// ib req
const req = program
  .command('req')
  .description('Manage requirements');

req
  .command('add')
  .description('Add a new requirement')
  .option('-t, --template <name>', 'Use a template')
  .action(async (options: { template?: string }) => {
    try {
      await reqAddCommand(options.template);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

req
  .command('list')
  .description('List all requirements')
  .action(() => {
    try {
      reqListCommand();
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

req
  .command('update <id>')
  .description('Update a requirement')
  .option('-s, --status <status>', 'New status (draft/active/implementing/done)')
  .option('-t, --title <title>', 'New title')
  .option('-d, --desc <desc>', 'New description')
  .action((id: string, options: { status?: string; title?: string; desc?: string }) => {
    try {
      reqUpdateCommand(id, options);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

req
  .command('done <id>')
  .description('Mark requirement as done')
  .action((id: string) => {
    try {
      reqDoneCommand(id);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

req
  .command('remove <id>')
  .description('Remove a requirement')
  .action((id: string) => {
    try {
      reqRemoveCommand(id);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

req
  .command('note <id> <message>')
  .description('Add a decision note to a requirement')
  .action((id: string, message: string) => {
    try {
      reqNoteCommand(id, message);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

req
  .command('notes <id>')
  .description('Show all notes for a requirement')
  .action((id: string) => {
    try {
      reqNotesCommand(id);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

req
  .command('ac <id> <criterion>')
  .description('Add an acceptance criterion to a requirement')
  .action((id: string, criterion: string) => {
    try {
      reqAcCommand(id, criterion);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

req
  .command('accept <id> <index>')
  .description('Mark an acceptance criterion as done')
  .action((id: string, index: string) => {
    try {
      reqAcceptCommand(id, index);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

req
  .command('ac-list <id>')
  .description('List acceptance criteria for a requirement')
  .action((id: string) => {
    try {
      reqAcListCommand(id);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

req
  .command('dep <id> <depends-on-id>')
  .description('Add a dependency (id depends on depends-on-id)')
  .action((id: string, depId: string) => {
    try {
      reqDepCommand(id, depId);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

req
  .command('undep <id> <depends-on-id>')
  .description('Remove a dependency')
  .action((id: string, depId: string) => {
    try {
      reqUndepCommand(id, depId);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

req
  .command('deps <id>')
  .description('Show dependencies for a requirement')
  .action((id: string) => {
    try {
      reqDepsCommand(id);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

req
  .command('search <keyword>')
  .description('Search requirements by keyword')
  .action((keyword: string) => {
    try {
      reqSearchCommand(keyword);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

req
  .command('tag <id> <tag>')
  .description('Add a tag to a requirement')
  .action((id: string, tag: string) => {
    try {
      reqTagCommand(id, tag);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

req
  .command('untag <id> <tag>')
  .description('Remove a tag from a requirement')
  .action((id: string, tag: string) => {
    try {
      reqUntagCommand(id, tag);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

req
  .command('tags')
  .description('List all tags')
  .action(() => {
    try {
      reqTagsCommand();
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

req
  .command('export')
  .description('Export requirements')
  .option('-f, --format <format>', 'Output format (markdown|json)', 'markdown')
  .option('-o, --output <file>', 'Output file (prints to stdout if not specified)')
  .action((options: { format: string; output?: string }) => {
    try {
      const format = options.format === 'json' ? 'json' : 'markdown';
      reqExportCommand(format, options.output);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

req
  .command('templates')
  .description('List available templates')
  .action(() => {
    try {
      reqTemplatesCommand();
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

// ib map
const map = program
  .command('map')
  .description('Manage file mappings');

map
  .command('add <req-id> <files...>')
  .description('Map files to a requirement')
  .action((reqId: string, files: string[]) => {
    try {
      mapAddCommand(reqId, files);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

map
  .command('remove <req-id> <file>')
  .description('Remove a file mapping')
  .action((reqId: string, file: string) => {
    try {
      mapRemoveCommand(reqId, file);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

map
  .command('list')
  .description('List all file mappings')
  .action(() => {
    try {
      mapListCommand();
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

map
  .command('which <file>')
  .description('Find requirements related to a file')
  .action((file: string) => {
    try {
      mapWhichCommand(file);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

// ib milestone
const milestone = program
  .command('milestone')
  .description('Manage milestones');

milestone
  .command('create [name] [dueDate]')
  .description('Create a new milestone')
  .action(async (name?: string, dueDate?: string) => {
    try {
      await milestoneCreateCommand(name, dueDate);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

milestone
  .command('remove <name>')
  .description('Remove a milestone')
  .action((name: string) => {
    try {
      milestoneRemoveCommand(name);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

milestone
  .command('add <name> <reqId>')
  .description('Add a requirement to a milestone')
  .action((name: string, reqId: string) => {
    try {
      milestoneAddCommand(name, reqId);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

milestone
  .command('remove-req <name> <reqId>')
  .description('Remove a requirement from a milestone')
  .action((name: string, reqId: string) => {
    try {
      milestoneRemoveReqCommand(name, reqId);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

milestone
  .command('status <name> <status>')
  .description('Set milestone status (planned/active/completed)')
  .action((name: string, status: string) => {
    try {
      milestoneStatusCommand(name, status);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

milestone
  .command('list')
  .description('List all milestones')
  .action(() => {
    try {
      milestoneListCommand();
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

// ib gen
program
  .command('gen')
  .description('Generate/update CLAUDE.md')
  .option('-f, --focus <ids>', 'Focus on specific requirement IDs (comma-separated)')
  .action((options: { focus?: string }) => {
    try {
      genCommand(options.focus);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

// ib status
program
  .command('status')
  .description('Show project status overview')
  .action(() => {
    try {
      statusCommand();
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

// ib sync
program
  .command('sync')
  .description('Detect and fix stale file mappings via git')
  .action(async () => {
    try {
      await syncCommand();
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

program.parse();
