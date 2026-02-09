#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from '../src/commands/init.js';
import { reqAddCommand, reqListCommand, reqUpdateCommand, reqDoneCommand, reqRemoveCommand } from '../src/commands/req.js';
import { mapAddCommand, mapRemoveCommand, mapListCommand } from '../src/commands/map.js';
import { genCommand } from '../src/commands/gen.js';
import { statusCommand } from '../src/commands/status.js';

const program = new Command();

program
  .name('ib')
  .description('IntentBridge — project context manager for Claude Code')
  .version('1.0.0');

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

// ib gen
program
  .command('gen')
  .description('Generate/update CLAUDE.md')
  .action(() => {
    try {
      genCommand();
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

program.parse();
