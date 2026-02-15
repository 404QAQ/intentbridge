# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**IntentBridge** is an AI-powered requirement management CLI tool designed for Claude Code. It provides persistent memory for requirements, progressive context building (L0→L4), natural language interface, MCP protocol integration, and smart project scaffolding.

## Development Commands

### Building and Development

```bash
# Build the project (TypeScript → dist/)
npm run build

# Run CLI in development mode (without building)
npm run dev -- <command>
# Example: npm run dev -- req list

# Clean build artifacts
npm run clean

# Link for global testing
npm link
# Then use: ib <command>
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run CI tests (stricter, coverage enforced)
npm run test:ci

# Run specific test file
npm test -- store.test.ts
npm test -- --testNamePattern="addRequirement"
```

**Note:** Tests use Jest with `ts-jest` and require `NODE_OPTIONS='--experimental-vm-modules'` for ES module support.

### Linting

```bash
# Lint TypeScript files
npm run lint
```

### Publishing

```bash
# Prepare for publishing (clean + build + test)
npm run prepublishOnly

# Publish to npm (requires auth)
npm publish
```

## Architecture Overview

### Core Data Flow

```
User Input
    ↓
[bin/ib.ts] CLI Entry Point (Commander.js)
    ↓
[commands/*] Command Handlers
    ↓
[services/*] Business Logic Services
    ↓
[.intentbridge/*] YAML-based Storage
```

### Key Directories

- **`bin/ib.ts`** - CLI entry point, registers all commands using Commander.js
- **`src/commands/`** - 18 command modules (req, ai, backup, batch, milestone, plugin, project, smart, version, web, etc.)
- **`src/services/`** - 18 service modules containing core business logic
- **`src/models/types.ts`** - Core TypeScript type definitions (Requirement, ProjectConfig, Milestone)
- **`src/templates/`** - YAML templates for requirements
- **`tests/`** - Jest test files (unit + integration)
- **`web/`** - React + Vite + TypeScript frontend for Web UI Dashboard
- **`web-server/`** - Express backend API server for Web UI
- **`sdk/`** - Official JavaScript/TypeScript SDK (`@intentbridge/sdk`)

### Core Services

**`store.ts`** - Central data management:
- `readProject()`, `writeProject()` - Project configuration (YAML)
- `readRequirements()`, `writeRequirements()` - Requirements data (YAML)
- `addRequirement()`, `updateRequirement()` - CRUD operations
- All data stored in `.intentbridge/` directory as YAML files

**`mcp-server.ts`** - MCP Protocol Integration:
- TCP socket server (default port 9527)
- Tool-based API for Claude Code integration
- Available tools: `add_requirement`, `list_requirements`, `get_requirement`, `update_requirement_status`
- Status file: `.intentbridge/mcp-server-status.json`

**`nlp-router.ts`** - Natural Language Interface:
- `parseUserIntent()` - Parses natural language to structured intents
- AI-powered parsing (when configured) with rule-based fallback
- Powers the `ib do "<natural language>"` command

**`smart-analyzer.ts`** - AI-Driven Project Scaffolding:
- Analyzes requirement descriptions
- Auto-generates project structure (src/, tests/, docs/)
- Creates configuration files (package.json, tsconfig.json, README.md)

**`version-control.ts`** - Requirement Versioning:
- Tracks all changes to requirements
- Supports version history, diffs, rollback, snapshots
- Version data stored in `.intentbridge/versions/`

**`global-store.ts`** - Multi-Project Management:
- Global registry: `~/.intentbridge/projects.json`
- Project switching, linking, file sharing
- `ib global-status`, `ib global-reqs`

**`project-detector.ts`** - Auto Project Detection:
- `detectCurrentProject()` - Detects project from current directory
- `findIntentBridgeDir()` - Searches up directory tree for `.intentbridge/`

**`plugin-manager.ts`** - Plugin System:
- Hook-based event system (12 hooks)
- Plugin lifecycle: install, enable, disable, uninstall
- Builtin plugins: auto-tagger, dependency-detector, notifier
- Plugin directory: `.intentbridge/plugins/`

### Data Storage

All data is stored locally in YAML format (offline-first):

```
.intentbridge/
├── project.yml           # Project configuration
├── requirements.yml      # All requirements
├── versions/             # Version history
│   └── REQ-001.json
├── plugins/              # Installed plugins
│   └── my-plugin.js
├── backups/              # Backup archives
└── mcp-server-status.json # MCP server status

~/.intentbridge/
└── projects.json         # Global project registry
```

### Progressive Understanding System

Requirements evolve through 5 levels:

- **L0: Raw** - User's initial description
- **L1: Standardized** - Tags, acceptance criteria, dependencies
- **L2: Structured Understanding** - Generated markdown document
- **L3: AI-Enhanced** - AI-generated analysis, suggestions
- **L4: Code-Anchored** - Comments injected into source files

Use `ib explain REQ-001` to export L2-L3 context for Claude Code.

### Plugin System

Plugins hook into IntentBridge events:

**Available Hooks:**
- `requirement:add`, `requirement:update`, `requirement:done`, `requirement:remove`
- `milestone:create`, `milestone:update`, `milestone:remove`
- `file:map`, `file:unmap`
- `project:init`, `project:switch`

**Plugin Structure:**
```typescript
interface Plugin {
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  main: string;
  hooks?: Partial<Record<HookName, HookHandler>>;
  commands?: Record<string, Function>;
  setup?: () => void | Promise<void>;
  teardown?: () => void | Promise<void>;
}
```

See `docs/PLUGINS.md` for plugin development guide.

### MCP Integration

**MCP Server** (`src/services/mcp-server.ts`):
- TCP server listening on port 9527
- Provides tools for Claude Code to call directly
- Start with: `ib mcp-server start`

**MCP Bridge** (`src/services/mcp-bridge.ts`):
- Export requirement context for Claude Code
- Manual export: `ib mcp export REQ-001`

**Available MCP Tools:**
1. `add_requirement` - Add new requirement
2. `list_requirements` - List all requirements
3. `get_requirement` - Get requirement details
4. `update_requirement_status` - Update status

### Web Dashboard Architecture

**Frontend** (`web/`):
- React 18 + TypeScript + Vite
- Tailwind CSS for styling
- Victory charts for visualization
- API client in `src/services/ApiClient.ts`

**Backend** (`web-server/`):
- Express.js REST API server
- Port 9528 (different from MCP server 9527)
- Reads `.intentbridge/` data directly
- Endpoints: `/api/requirements`, `/api/projects`, `/api/status`

Start with: `ib web start` (launches both frontend and backend)

### SDK Architecture

**`@intentbridge/sdk`** (`sdk/`):
- TypeScript SDK for programmatic access
- Communicates with Web UI backend (port 9528)
- Main class: `IntentBridge`
- Methods: `listRequirements()`, `getRequirement()`, `updateRequirementStatus()`, etc.

## Important Implementation Details

### YAML Storage

All data uses YAML format (via `js-yaml` library):
- Simpler for humans to read/edit
- Better git diff/merge
- No database required

### ES Modules

This project uses ES modules (`"type": "module"` in package.json):
- Use `.js` extensions in imports even for `.ts` files
- Jest requires `NODE_OPTIONS='--experimental-vm-modules'`
- `tsconfig.json`: `"module": "Node16"`, `"moduleResolution": "Node16"`

### AI Integration

**AI Client** (`src/services/ai-client.ts`):
- Supports multiple providers (OpenAI, Anthropic, etc.)
- Configure with: `ib ai config`
- Stores config in `.intentbridge/ai-config.json`

**AI Features:**
- `ib ai understand REQ-001` - Generate deep understanding
- `ib analyze-impact REQ-001` - Analyze change impact
- `ib ai validate REQ-001` - Validate completion
- `ib smart-add "<requirement>"` - AI scaffolding

### Testing Strategy

- **Unit tests** in `tests/unit/` - Test individual services
- **Integration tests** in `tests/` - Test command workflows
- **Coverage thresholds**: 50% branches, 60% functions/lines/statements
- All tests use Jest with `ts-jest` preset

### CLI Structure

Commands are organized by domain:
- `req` - Requirement management (add, list, update, done, search, tag, etc.)
- `ai` - AI features (understand, validate, analyze)
- `project` - Multi-project management (register, switch, link)
- `milestone` - Milestone management
- `version` - Version control (history, diff, rollback, snapshot)
- `plugin` - Plugin management (install, enable, disable)
- `web` - Web UI dashboard
- `backup` - Backup and restore
- `batch` - Batch operations
- `smart` - Smart features (smart-add, do)

### Command Registration Pattern

In `bin/ib.ts`:
```typescript
import { reqAddCommand } from '../src/commands/req.js';

const program = new Command();
program
  .command('req add')
  .description('Add a new requirement')
  .action(reqAddCommand);
```

Each command module exports handler functions that are registered with Commander.js.

## Common Development Tasks

### Adding a New Command

1. Create handler in `src/commands/` (e.g., `src/commands/myfeature.ts`)
2. Export handler function: `export function myFeatureCommand() { ... }`
3. Import and register in `bin/ib.ts`
4. Add tests in `tests/commands/myfeature.test.ts`

### Adding a New Service

1. Create service in `src/services/` (e.g., `src/services/my-service.ts`)
2. Export functions for use in commands
3. Add tests in `tests/unit/services/my-service.test.ts`

### Adding a New Plugin Hook

1. Add hook name to `src/types/plugin.ts` HookName type
2. Emit hook in relevant service function
3. Update `docs/PLUGINS.md` with hook documentation

### Modifying Data Models

1. Update types in `src/models/types.ts`
2. Update YAML read/write logic in `src/services/store.ts`
3. Add migration logic if needed
4. Update tests

### Testing with Real Projects

```bash
# Link for global access
npm link

# Create test project
mkdir ~/test-project && cd ~/test-project
ib init
ib req add
# ... test commands ...

# Unlink when done
npm unlink -g intentbridge
```

## Key Design Principles

1. **Offline-First** - All data stored locally in YAML, no cloud dependency
2. **Progressive Enhancement** - Requirements evolve from L0→L4
3. **Natural Language First** - `ib do "..."` for all operations
4. **AI-Powered** - Leverage AI for understanding, analysis, validation
5. **Plugin Architecture** - Extensible via hooks and custom commands
6. **YAML over JSON** - Human-readable, better for git
7. **CLI + Web + API** - Three interfaces for different use cases

## Version Compatibility

- Node.js >= 18.0.0 (uses ES modules, top-level await)
- TypeScript 5.6+
- Jest 29.x (with ES module support)

## Troubleshooting

**Jest fails with ES module error:**
- Ensure `NODE_OPTIONS='--experimental-vm-modules'` is set
- Check import paths use `.js` extension

**MCP server won't start:**
- Check if port 9527 is already in use
- Check `.intentbridge/mcp-server-status.json` for status

**Web UI can't connect to backend:**
- Ensure backend is running on port 9528
- Check CORS settings in `web-server/src/index.ts`

**AI features not working:**
- Run `ib ai config` to configure AI provider
- Check `.intentbridge/ai-config.json` for API key

## Resources

- **README.md** - User-facing documentation
- **CHANGELOG.md** - Version history
- **docs/PLUGINS.md** - Plugin development guide
- **docs/api/README.md** - API documentation
- **QUICKSTART.md** - Quick start guide for new features
