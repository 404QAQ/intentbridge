# IntentBridge

CLI tool that maintains project state and auto-generates `CLAUDE.md` for Claude Code context injection.

IntentBridge tracks your project's requirements, maps source files to those requirements, and generates a structured `CLAUDE.md` file that gives Claude Code full awareness of your project context.

## Installation

```bash
npm install -g intentbridge
```

Or use directly with npx:

```bash
npx intentbridge <command>
```

## Quick Start

```bash
# Initialize in your project directory
ib init

# Add a requirement
ib req add

# Map files to a requirement
ib map add REQ-001 src/auth.ts src/login.vue

# Generate/update CLAUDE.md
ib gen
```

## Commands

### `ib init`

Initialize IntentBridge in the current directory. Creates a `.intentbridge/` directory with project config and an initial `CLAUDE.md`.

### `ib req`

Manage requirements:

| Subcommand | Description |
|---|---|
| `ib req add` | Add a new requirement (interactive) |
| `ib req list` | List all requirements grouped by status |
| `ib req update <id>` | Update status/title/description (`-s`, `-t`, `-d`) |
| `ib req done <id>` | Mark a requirement as done |
| `ib req remove <id>` | Remove a requirement |

Statuses: `draft` → `active` → `implementing` → `done`

Priorities: `high`, `medium`, `low`

### `ib map`

Map source files to requirements:

| Subcommand | Description |
|---|---|
| `ib map add <req-id> <files...>` | Map one or more files to a requirement |
| `ib map remove <req-id> <file>` | Remove a file mapping |
| `ib map list` | List all file mappings |

### `ib gen`

Generate or update `CLAUDE.md` with the current project context. The generated block includes:

- Project overview and tech stack
- Active/implementing requirements with mapped files
- Recently completed requirements
- Code mapping index (file → requirement)

### `ib status`

Show a project status overview with requirement counts by status.

## How It Works

IntentBridge stores project state in `.intentbridge/` as YAML files:

```
.intentbridge/
  project.yaml        # Project name, description, tech stack, conventions
  requirements.yaml   # All requirements with status, priority, file mappings
```

Running `ib gen` reads these files and produces a structured block in `CLAUDE.md`, wrapped in `<!-- INTENTBRIDGE:START -->` / `<!-- INTENTBRIDGE:END -->` markers. Existing content in `CLAUDE.md` outside these markers is preserved.

## Development

```bash
# Install dependencies
npm install

# Run in dev mode
npm run dev -- <command>

# Run tests
npm test

# Build
npm run build
```

## Docker

```bash
# Run tests in Docker
docker compose run test

# Use CLI via Docker
docker compose run cli status
```

## License

MIT
