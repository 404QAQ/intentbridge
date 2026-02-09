#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from '../src/commands/init.js';
import { reqAddCommand, reqListCommand, reqUpdateCommand, reqDoneCommand, reqRemoveCommand, reqNoteCommand, reqNotesCommand, reqAcCommand, reqAcceptCommand, reqAcListCommand, reqDepCommand, reqUndepCommand, reqDepsCommand } from '../src/commands/req.js';
import { mapAddCommand, mapRemoveCommand, mapListCommand, mapWhichCommand } from '../src/commands/map.js';
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
  .action(async () => {
    try {
      await reqAddCommand();
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
