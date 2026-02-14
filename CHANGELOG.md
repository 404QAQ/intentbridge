# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.0] - 2024-02-14

### Added
- **Web UI Dashboard** - Beautiful web-based dashboard for requirement management
  - Dashboard with statistics and charts
  - Requirements list with filtering
  - Requirement detail view with status updates
  - Real-time API integration
- **Version Control System** - Complete requirement versioning
  - Automatic change tracking
  - Version history with diffs
  - Rollback capability
  - Snapshot creation with tags
- **Plugin System** - Extensible plugin architecture
  - Hook-based event system (12 hooks)
  - Plugin lifecycle management
  - 3 builtin plugins (auto-tagger, dependency-detector, notifier)
  - Custom plugin development support
  - Plugin CLI commands
- **Auto Project Detection** - Automatically detect project context from directory
- **Natural Language Interface** - `ib do "add user auth requirement"` - just describe what you want
- **MCP Protocol Integration** - Real MCP server for Claude Code integration
- **Smart Project Creation** - AI analyzes requirements and auto-creates project structure
- **Project Detector Service** - `detectCurrentProject()`, `findIntentBridgeDir()`
- **NLP Router** - Natural language parsing with AI and rule-based fallback
- **MCP Server** - TCP socket server with tool-based API
- **Smart Analyzer** - AI-driven requirement analysis and scaffolding
- New commands: `ib detect`, `ib do`, `ib smart-add`, `ib mcp-server start`, `ib web start`, `ib plugin install/uninstall/enable/disable/list/info`

### Changed
- Enhanced CLI with intelligent routing
- Improved project context resolution

### Fixed
- Fix Jest dependency versions (29.x instead of non-existent 30.x)
- Replace vitest with Jest across all test files
- Fix test version expectations (2.3.0)
- Fix test import paths and function names

### Technical
- Added `src/services/version-control.ts` - Version control logic
- Added `src/services/plugin-manager.ts` - Plugin management
- Added `src/services/plugin-loader.ts` - Builtin plugin loader
- Added `src/types/plugin.ts` - Plugin type definitions
- Added `src/commands/version.ts` - Version commands
- Added `src/commands/web.ts` - Web dashboard commands
- Added `src/commands/plugin.ts` - Plugin commands
- Added `src/plugins/builtin/` - Builtin plugins
- Added `web/` - React frontend with Vite + TypeScript
- Added `web-server/` - Express backend API server
- Added `docs/PLUGINS.md` - Plugin development guide
- Added `src/services/project-detector.ts`
- Added `src/services/nlp-router.ts`
- Added `src/services/mcp-server.ts`
- Added `src/services/smart-analyzer.ts`
- Added `src/commands/smart.ts`

## [2.2.0] - 2024-02-13

### Added
- **Multi-Project Management** - Manage multiple projects from one place
- **Global Project Registry** - `~/.intentbridge/projects.json`
- **Project Switching** - `ib project switch <name>`
- **Global Views** - `ib global-status`, `ib global-reqs`
- **File Sharing** - Share files between projects
- **Project Linking** - Link related projects together
- New commands: `ib project register`, `ib project list`, `ib project switch`, `ib global-status`

### Technical
- Added `src/services/global-store.ts`
- Added `src/commands/project.ts`

## [2.1.0] - 2024-02-13

### Added
- **AI-Powered Understanding** - Auto-generate requirement understanding with AI
- **Change Impact Analysis** - Analyze requirement change impact
- **Loop Validation** - AI-driven completion validation with code analysis
- **MCP Bridge** - Session management and context export
- **AI Client** - Multi-provider support (OpenAI, Anthropic, local models)
- New commands: `ib ai config`, `ib ai understand`, `ib analyze-impact`, `ib ai validate`

### Changed
- Enhanced understanding generation with AI insights
- Improved context export for Claude Code

### Technical
- Added `src/services/ai-client.ts`
- Added `src/services/mcp-bridge.ts`
- Added `src/commands/ai.ts`

## [2.0.0] - 2024-02-09

### Added
- **Progressive Understanding System** - L0→L1→L2→L3→L4 levels
- **Understanding Documents** - `.intentbridge/understanding/REQ-XXX.md`
- **Code Anchors** - Inject understanding comments into source files
- **Requirement Explanation** - `ib explain` for compact Claude Code output
- New commands: `ib explain`, `ib gen-understanding`, `ib show-understanding`, `ib anchor`

### Changed
- Improved requirement structure with deeper understanding
- Enhanced documentation generation

### Technical
- Added `src/services/understanding-generator.ts`
- Added `src/commands/explain.ts`

## [1.2.0] - 2024-02-09

### Added
- **Requirement Tags** - Add and manage tags for requirements
- **Requirement Search** - Search requirements by keyword
- **Export Functionality** - Export requirements to Markdown/JSON
- **Templates** - Pre-defined requirement templates
- New commands: `ib req tag`, `ib req search`, `ib req export`, `ib req templates`

### Changed
- Improved requirement organization with tags

## [1.1.0] - 2024-02-09

### Added
- **Milestones** - Group requirements by milestones
- **Enhanced Map Commands** - Better file mapping with `ib map which`
- **Status Command** - Project status overview
- **Sync Command** - Auto-detect stale file mappings
- New commands: `ib milestone`, `ib status`, `ib sync`

### Fixed
- File mapping synchronization issues

## [1.0.0] - 2024-02-09

### Added
- **Requirement Management** - Full CRUD operations for requirements
- **File Mapping** - Map source files to requirements
- **Notes and Decisions** - Track technical decisions
- **Acceptance Criteria** - Define and track completion criteria
- **Dependencies** - Manage requirement dependencies
- **Priority Levels** - high, medium, low priorities
- **Status Workflow** - draft → active → implementing → done
- **Persistent Storage** - YAML-based file storage
- **CLI Interface** - Complete command-line interface

### Technical
- Initial release
- Core requirement management system
- File mapping and tracking
- CLI built with Commander.js
- TypeScript implementation

---

## [Unreleased]

### Planned
- Web UI dashboard
- Plugin system
- Team collaboration features
- Third-party integrations (Jira, GitHub, Linear)
- Requirement version control
- REST/GraphQL API
- Database backends (SQLite, PostgreSQL)

---

## Version History

| Version | Date | Key Features |
|---------|------|-------------|
| 2.3.0 | 2024-02-13 | Auto detection, NLP, MCP server, Smart analysis |
| 2.2.0 | 2024-02-13 | Multi-project management, Global views |
| 2.1.0 | 2024-02-13 | AI features, Impact analysis, Validation |
| 2.0.0 | 2024-02-09 | Progressive understanding, Code anchors |
| 1.2.0 | 2024-02-09 | Tags, Search, Export, Templates |
| 1.1.0 | 2024-02-09 | Milestones, Status, Sync |
| 1.0.0 | 2024-02-09 | Initial release |

---

For more details, see the [GitHub Releases](https://github.com/404QAQ/intentbridge/releases) page.
