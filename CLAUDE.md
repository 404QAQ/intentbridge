# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**IntentBridge** is an AI-powered requirement management CLI tool designed for Claude Code. It provides persistent memory for requirements, progressive context building (L0→L4), natural language interface, MCP protocol integration, and smart project scaffolding.

**Current Version**: 3.4.0

## Development Commands

### Build & Development

```bash
npm run build          # TypeScript → dist/ (includes copying templates)
npm run dev -- <cmd>   # Run CLI directly with tsx (no build needed)
npm run clean          # Remove dist/
npm link              # Install globally for testing
```

### Testing

```bash
npm test                        # Run all tests
npm run test:watch              # Watch mode
npm run test:coverage           # With coverage report
npm run test:ci                 # CI mode (strict, coverage enforced)
npm test -- store.test.ts       # Run specific test file
npm test -- --testNamePattern="addRequirement"  # Run specific test
```

**Important**: All test commands require `NODE_OPTIONS='--experimental-vm-modules'` for ES module support.

### Code Quality

```bash
npm run lint          # ESLint on TypeScript files
```

## Architecture

### Project Structure

```
bin/ib.ts              # CLI entry (Commander.js)
src/commands/          # 24 command modules (req, ai, project, etc.)
src/services/          # 30 core services
src/models/types.ts    # TypeScript type definitions
src/templates/         # YAML requirement templates
tests/                 # Jest unit + integration tests
web/                   # React Web UI (Vite + Tailwind)
web-server/            # Express backend API
sdk/                   # @intentbridge/sdk package
```

### Key Services (30 total)

**Data Management**:
- `store.ts` - Central CRUD for requirements/projects (YAML-based)
- `global-store.ts` - Multi-project registry (~/.intentbridge/projects.json)

**AI Integration**:
- `ai-client.ts` - OpenAI/Anthropic/local model support
- `nlp-router.ts` - Natural language parsing (`ib do "..."`)
- `smart-analyzer.ts` - AI project scaffolding

**MCP Protocol**:
- `mcp-server.ts` - TCP server (port 9527) with tools for Claude Code
- `mcp-bridge.ts` - Export context for Claude Code sessions

**Multi-Project Coordination** (v3.4.0):
- `port-scanner.ts` - Cross-platform port scanning/conflict detection
- `process-monitor.ts` - Process lifecycle + resource tracking (CPU/memory)
- `project-coordinator.ts` - Multi-project orchestration

**Validation** (v3.3.0):
- `code-analyzer.ts` - Complexity analysis, anti-pattern detection
- `runtime-validator.ts` - Execute tests, verify coverage
- `security-scanner.ts` - OWASP Top 10 vulnerability scanning
- `design-comparator.ts` - Design spec compliance checking

**Other**:
- `version-control.ts` - Requirement versioning (history, diff, rollback)
- `project-detector.ts` - Auto-detect project from current directory
- `plugin-manager.ts` - Hook-based plugin system

### Data Storage (YAML-based, offline-first)

```
.intentbridge/
├── project.yml              # Project config
├── requirements.yml         # All requirements
├── versions/                # Version history
├── backups/                 # Backup archives
├── plugins/                 # Installed plugins
└── mcp-server-status.json   # MCP server status

~/.intentbridge/
└── projects.json            # Global project registry
```

### Progressive Understanding System

Requirements evolve through 5 levels:
- **L0**: Raw user description
- **L1**: Standardized (tags, acceptance criteria, dependencies)
- **L2**: Structured markdown document
- **L3**: AI-enhanced analysis
- **L4**: Code-anchored comments in source files

Use `ib explain REQ-001` to export L2-L3 context for Claude Code.

### Plugin System

12 hooks available: `requirement:add/update/done/remove`, `milestone:create/update/remove`, `file:map/unmap`, `project:init/switch`

Plugin structure:
```typescript
interface Plugin {
  name: string;
  version: string;
  hooks?: Partial<Record<HookName, HookHandler>>;
  commands?: Record<string, Function>;
  setup?: () => void | Promise<void>;
}
```

See `docs/PLUGINS.md` for details.

### MCP Integration

**Server** (port 9527): `ib mcp-server start`
- Tools: `add_requirement`, `list_requirements`, `get_requirement`, `update_requirement_status`

**Bridge**: `ib mcp export REQ-001` - Manual context export

### Web Dashboard

**Frontend** (web/): React 18 + Vite + Tailwind, port 3000
**Backend** (web-server/): Express REST API, port 9528

Start: `ib web start` (launches both)

## Critical Implementation Details

### ES Modules

This project uses ES modules (`"type": "module"` in package.json):
- **Imports must use `.js` extensions** even for `.ts` files
- Jest requires `NODE_OPTIONS='--experimental-vm-modules'`
- tsconfig: `"module": "Node16"`, `"moduleResolution": "Node16"`

Example:
```typescript
// ❌ Wrong
import { something } from './my-file';

// ✅ Correct
import { something } from './my-file.js';
```

### Command Registration Pattern

In `bin/ib.ts`:
```typescript
import { reqAddCommand } from '../src/commands/req.js';

program
  .command('req add')
  .description('Add a new requirement')
  .action(reqAddCommand);
```

Each command module exports handler functions registered with Commander.js.

### Adding New Features

**New Command**:
1. Create `src/commands/myfeature.ts` with exported handler
2. Import and register in `bin/ib.ts`
3. Add tests in `tests/commands/myfeature.test.ts`

**New Service**:
1. Create `src/services/my-service.ts`
2. Use in command handlers
3. Add tests in `tests/unit/services/my-service.test.ts`

**New Plugin Hook**:
1. Add to `src/types/plugin.ts` HookName type
2. Emit in relevant service
3. Update `docs/PLUGINS.md`

### CLI Organization

Commands by domain: `req` (requirements), `ai` (AI features), `project` (multi-project), `milestone`, `version` (version control), `plugin`, `web`, `backup`, `batch`, `smart`

### Testing Strategy

- Unit tests: `tests/unit/` - isolated service tests
- Integration tests: `tests/` - command workflows
- Coverage thresholds: 50% branches, 60% functions/lines/statements
- All tests use Jest with ts-jest

## Design Principles

1. **Offline-First** - YAML storage, no cloud required
2. **Progressive Enhancement** - L0→L4 evolution
3. **Natural Language First** - `ib do "..."` for everything
4. **AI-Powered** - AI for understanding/analysis/validation
5. **Plugin Architecture** - Extensible via hooks
6. **YAML over JSON** - Human-readable, git-friendly
7. **Three Interfaces** - CLI + Web + API

## Requirements

- Node.js >= 18.0.0 (ES modules, top-level await)
- TypeScript 5.6+
- Jest 29.x

## Common Issues

**Jest ES module error**: Ensure `NODE_OPTIONS='--experimental-vm-modules'` is set and imports use `.js` extensions.

**MCP server won't start**: Check port 9527 availability, see `.intentbridge/mcp-server-status.json`.

**Web UI connection failed**: Ensure backend running on port 9528, check CORS in `web-server/src/index.ts`.

**AI features not working**: Run `ib ai config` to configure provider, check `.intentbridge/ai-config.json`.
