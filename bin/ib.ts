#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from '../src/commands/init.js';
import {
  reqAddCommand,
  reqListCommand,
  reqUpdateCommand,
  reqDoneCommand,
  reqRemoveCommand,
  reqNoteCommand,
  reqNotesCommand,
  reqAcCommand,
  reqAcceptCommand,
  reqAcListCommand,
  reqDepCommand,
  reqUndepCommand,
  reqDepsCommand,
  reqSearchCommand,
  reqTagCommand,
  reqUntagCommand,
  reqTagsCommand,
  reqExportCommand,
  reqTemplatesCommand,
} from '../src/commands/req.js';
import {
  reqHistoryCommand,
  reqDiffCommand,
  reqDiffLastCommand,
  reqRollbackCommand,
  reqSnapshotCommand,
  reqSnapshotsCommand,
} from '../src/commands/version.js';
import { mapAddCommand, mapRemoveCommand, mapListCommand, mapWhichCommand } from '../src/commands/map.js';
import {
  milestoneCreateCommand,
  milestoneRemoveCommand,
  milestoneAddCommand,
  milestoneRemoveReqCommand,
  milestoneStatusCommand,
  milestoneListCommand,
} from '../src/commands/milestone.js';
import {
  explainCommand,
  genUnderstandingCommand,
  showUnderstandingCommand,
  anchorAddCommand,
  anchorRemoveCommand,
  anchorListCommand,
} from '../src/commands/explain.js';
import {
  aiConfigCommand,
  aiUnderstandCommand,
  analyzeImpactCommand,
  validateCommand,
  mcpStatusCommand,
  mcpExportCommand,
  mcpCleanupCommand,
} from '../src/commands/ai.js';
import {
  projectRegisterCommand,
  projectListCommand,
  projectSwitchCommand,
  projectUnlinkCommand,
  projectLinkCommand,
  projectStatusCommand,
  projectSetStatusCommand,
  globalStatusCommand,
  globalReqsCommand,
  shareFileCommand,
  listSharedCommand,
} from '../src/commands/project.js';
import {
  detectCommand,
  doCommand,
  smartAddCommand,
} from '../src/commands/smart.js';
import {
  startMCPServer,
  stopMCPServer,
  getMCPServerStatus,
  getMCPToolsList,
} from '../src/services/mcp-server.js';
import { genCommand } from '../src/commands/gen.js';
import { statusCommand } from '../src/commands/status.js';
import { syncCommand } from '../src/commands/sync.js';
import { webStartCommand, webStopCommand } from '../src/commands/web.js';

const program = new Command();

program
  .name('ib')
  .description('IntentBridge — AI-powered requirement management for Claude Code')
  .version('2.3.0');

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

// Version control commands
req
  .command('history <req-id>')
  .description('Show version history for a requirement')
  .option('-o, --oneline', 'Show one line per version')
  .action((reqId: string, options: { oneline?: boolean }) => {
    try {
      reqHistoryCommand(reqId, options);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

req
  .command('diff <req-id> <from> <to>')
  .description('Compare two versions of a requirement')
  .action((reqId: string, from: string, to: string) => {
    try {
      reqDiffCommand(reqId, from, to);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

req
  .command('diff-last <req-id>')
  .description('Compare last two versions')
  .action((reqId: string) => {
    try {
      reqDiffLastCommand(reqId);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

req
  .command('rollback <req-id> <version>')
  .description('Rollback requirement to a specific version')
  .option('-d, --dry-run', 'Preview rollback without making changes')
  .action(async (reqId: string, version: string, options: { dryRun?: boolean }) => {
    try {
      await reqRollbackCommand(reqId, version, options);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

req
  .command('snapshot <req-id> <tag>')
  .description('Create a snapshot for a requirement')
  .option('-m, --message <message>', 'Snapshot message')
  .action(async (reqId: string, tag: string, options: { message?: string }) => {
    try {
      await reqSnapshotCommand(reqId, tag, options);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

req
  .command('snapshots <req-id>')
  .description('List all snapshots for a requirement')
  .action((reqId: string) => {
    try {
      reqSnapshotsCommand(reqId);
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

// ib explain
program
  .command('explain <reqId>')
  .description('Explain a requirement (compact output for Claude Code)')
  .option('-f, --format <format>', 'Output format (text|json)', 'text')
  .action((reqId: string, options: { format?: 'text' | 'json' }) => {
    try {
      explainCommand(reqId, options);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

// ib gen-understanding
program
  .command('gen-understanding [reqId]')
  .description('Generate understanding documents')
  .action((reqId?: string) => {
    try {
      genUnderstandingCommand(reqId);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

// ib show-understanding
program
  .command('show-understanding <reqId>')
  .description('Show detailed understanding document')
  .action((reqId: string) => {
    try {
      showUnderstandingCommand(reqId);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

// ib anchor
const anchor = program
  .command('anchor')
  .description('Manage code anchors');

anchor
  .command('add <reqId> <file>')
  .description('Inject understanding anchor into code file')
  .action((reqId: string, file: string) => {
    try {
      anchorAddCommand(reqId, file);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

anchor
  .command('remove <file>')
  .description('Remove anchor from code file')
  .action((file: string) => {
    try {
      anchorRemoveCommand(file);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

anchor
  .command('list [reqId]')
  .description('List code anchors')
  .action((reqId?: string) => {
    try {
      anchorListCommand(reqId);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

// ib ai
const ai = program
  .command('ai')
  .description('AI-powered understanding and validation');

ai
  .command('config')
  .description('Configure AI provider')
  .action(async () => {
    try {
      await aiConfigCommand();
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

ai
  .command('understand [reqId]')
  .description('Generate AI-powered understanding')
  .action(async (reqId?: string) => {
    try {
      await aiUnderstandCommand(reqId);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

ai
  .command('validate <reqId>')
  .description('Validate requirement completion')
  .option('-c, --with-code', 'Include code analysis')
  .action(async (reqId: string, options: { withCode?: boolean }) => {
    try {
      await validateCommand(reqId, options);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

// ib analyze
program
  .command('analyze-impact <reqId>')
  .description('Analyze change impact for a requirement')
  .option('-s, --change-status <status>', 'Simulate status change')
  .action(async (reqId: string, options: { changeStatus?: string }) => {
    try {
      await analyzeImpactCommand(reqId, options);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

// ib mcp
const mcp = program
  .command('mcp')
  .description('MCP bridge management');

mcp
  .command('status')
  .description('Show MCP bridge status')
  .action(() => {
    try {
      mcpStatusCommand();
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

mcp
  .command('export <reqId>')
  .description('Export context for Claude Code')
  .action((reqId: string) => {
    try {
      mcpExportCommand(reqId);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

mcp
  .command('cleanup')
  .description('Clean up expired sessions')
  .action(() => {
    try {
      mcpCleanupCommand();
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

// ib project
const project = program
  .command('project')
  .description('Manage multiple projects');

project
  .command('register [path]')
  .description('Register a project')
  .option('-n, --name <name>', 'Project name')
  .option('-d, --description <desc>', 'Project description')
  .option('-t, --tags <tags>', 'Comma-separated tags')
  .option('-p, --priority <priority>', 'Priority (low/medium/high/critical)')
  .action(async (path?: string, options?: any) => {
    try {
      await projectRegisterCommand(path, options);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

project
  .command('list')
  .description('List all registered projects')
  .action(() => {
    try {
      projectListCommand();
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

project
  .command('switch <name>')
  .description('Switch to a project')
  .action((name: string) => {
    try {
      projectSwitchCommand(name);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

project
  .command('unlink <name>')
  .description('Unregister a project')
  .action((name: string) => {
    try {
      projectUnlinkCommand(name);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

project
  .command('link <name> <projects...>')
  .description('Link projects together')
  .action((name: string, projects: string[]) => {
    try {
      projectLinkCommand(name, projects);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

project
  .command('status [name]')
  .description('Show project status')
  .action((name?: string) => {
    try {
      projectStatusCommand(name);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

project
  .command('pause <name>')
  .description('Pause a project')
  .action((name: string) => {
    try {
      projectSetStatusCommand(name, 'paused');
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

project
  .command('archive <name>')
  .description('Archive a project')
  .action((name: string) => {
    try {
      projectSetStatusCommand(name, 'archived');
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

project
  .command('activate <name>')
  .description('Activate a project')
  .action((name: string) => {
    try {
      projectSetStatusCommand(name, 'active');
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

// ib global-status
program
  .command('global-status')
  .description('Show global project overview')
  .action(() => {
    try {
      globalStatusCommand();
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

// ib global-reqs
program
  .command('global-reqs')
  .description('View requirements across all projects')
  .option('-t, --tag <tag>', 'Filter by tag')
  .option('-s, --status <status>', 'Filter by status')
  .option('-p, --priority <priority>', 'Filter by priority')
  .action((options: { tag?: string; status?: string; priority?: string }) => {
    try {
      globalReqsCommand(options);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

// ib share-file
program
  .command('share-file <source-project> <file-path> <target-projects>')
  .description('Share a file between projects')
  .option('-s, --strategy <strategy>', 'Sync strategy (copy/symlink/reference)', 'reference')
  .action((
    sourceProject: string,
    filePath: string,
    targetProjects: string,
    options: { strategy?: 'copy' | 'symlink' | 'reference' }
  ) => {
    try {
      shareFileCommand(sourceProject, filePath, targetProjects, options.strategy);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

// ib list-shared
program
  .command('list-shared [project]')
  .description('List shared files')
  .action((project?: string) => {
    try {
      listSharedCommand(project);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

// ib detect
program
  .command('detect')
  .description('Detect current project based on working directory')
  .action(() => {
    try {
      detectCommand();
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

// ib do
program
  .command('do <prompt>')
  .description('Execute natural language command')
  .action(async (prompt: string) => {
    try {
      await doCommand(prompt);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

// ib smart-add
program
  .command('smart-add <description>')
  .description('Add requirement with AI analysis and auto-create project structure')
  .action(async (description: string) => {
    try {
      await smartAddCommand(description);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

// ib mcp-server
const mcpServerCmd = program
  .command('mcp-server')
  .description('MCP server management');

mcpServerCmd
  .command('start')
  .description('Start MCP server')
  .option('-p, --port <port>', 'Port number', '9527')
  .option('-h, --host <host>', 'Host', 'localhost')
  .action(async (options: { port: string; host: string }) => {
    try {
      console.log('Starting MCP server...');
      await startMCPServer({
        port: parseInt(options.port),
        host: options.host,
      });
      console.log('MCP server is running. Press Ctrl+C to stop.');
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

mcpServerCmd
  .command('stop')
  .description('Stop MCP server')
  .action(async () => {
    try {
      await stopMCPServer();
      console.log('MCP server stopped.');
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

mcpServerCmd
  .command('status')
  .description('Show MCP server status')
  .action(() => {
    try {
      const status = getMCPServerStatus();
      console.log('MCP Server Status:');
      console.log(`  Running: ${status.running ? 'Yes' : 'No'}`);
      if (status.config) {
        console.log(`  Host: ${status.config.host}`);
        console.log(`  Port: ${status.config.port}`);
      }
      if (status.timestamp) {
        console.log(`  Last Update: ${status.timestamp}`);
      }
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

mcpServerCmd
  .command('tools')
  .description('List available MCP tools')
  .action(() => {
    try {
      const tools = getMCPToolsList();
      console.log('Available MCP Tools:\n');
      tools.forEach(tool => {
        console.log(`  ${tool.name}`);
        console.log(`    ${tool.description}`);
        console.log('');
      });
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

// ib web
const web = program
  .command('web')
  .description('Web Dashboard management');

web
  .command('start')
  .description('Start web dashboard')
  .option('-p, --port <port>', 'API server port', '9528')
  .option('--no-dev', 'Start in production mode')
  .action(async (options: { port?: string; dev?: boolean }) => {
    try {
      await webStartCommand(options);
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

web
  .command('stop')
  .description('Stop web dashboard')
  .action(() => {
    try {
      webStopCommand();
    } catch (e: any) {
      console.error(e.message);
      process.exit(1);
    }
  });

program.parse();
