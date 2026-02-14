# IntentBridge v2.3.0 Quick Start Guide

Get started with the latest features in under 5 minutes!

## Installation

```bash
# From npm (after publication)
npm install -g intentbridge

# Or from source
git clone https://github.com/404QAQ/intentbridge.git
cd intentbridge
npm install
npm run build
npm link
```

## Feature 1: Web UI Dashboard 🖥️

Launch the beautiful web interface:

```bash
# Initialize a project
mkdir my-project && cd my-project
ib init

# Start the web dashboard
ib web start

# Open http://localhost:3000 in your browser
```

**What you'll see:**
- Dashboard with statistics
- Requirements list with filtering
- Requirement details with status updates
- Real-time charts

**Try it:**
```bash
# Add some requirements
ib req add

# View in dashboard at http://localhost:3000
```

## Feature 2: Version Control 📜

Track all requirement changes:

```bash
# Add a requirement
ib req add
# Enter: REQ-001 "User Authentication" "Implement login system"

# Update the requirement
ib req update REQ-001 -s implementing

# View version history
ib req history REQ-001

# Compare versions
ib req diff REQ-001 v1 v2

# Rollback if needed
ib req rollback REQ-001 v1

# Create a snapshot
ib req snapshot REQ-001 v1.0-release -m "Release candidate"
```

**What's tracked:**
- Status changes
- Title/description updates
- Priority changes
- Tag modifications
- Acceptance criteria changes

## Feature 3: Plugin System 🔌

Extend IntentBridge with plugins:

### View builtin plugins
```bash
ib plugin list
```

Output:
```
auto-tagger@1.0.0 - ✅ enabled
dependency-detector@1.0.0 - ✅ enabled
notifier@1.0.0 - ✅ enabled
```

### Create a custom plugin

Create `my-plugin.ts`:

```typescript
import { Plugin, HookContext } from 'intentbridge';

const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My custom plugin',
  enabled: true,
  main: 'my-plugin.js',

  hooks: {
    'requirement:add': (context: HookContext) => {
      console.log('🎉 New requirement:', context.data.title);
      return { success: true };
    },
  },
};

export default myPlugin;
```

### Install and use
```bash
ib plugin install ./my-plugin.ts
ib plugin list
```

## Complete Workflow Example

### 1. Setup Project
```bash
mkdir my-saas-app && cd my-saas-app
ib init
# Enter project details...
```

### 2. Add Requirements
```bash
ib req add
# Add: REQ-001 "User Registration"
# Add: REQ-002 "Email Verification"
# Add: REQ-003 "Dashboard Analytics"
```

### 3. Track Progress
```bash
# Start working on REQ-001
ib req update REQ-001 -s implementing

# Add acceptance criteria
ib req ac REQ-001 "User can register with email"
ib req ac REQ-001 "Password is hashed with bcrypt"

# Mark as done
ib req done REQ-001

# View history
ib req history REQ-001
```

### 4. Visualize with Web UI
```bash
ib web start
# Open http://localhost:3000
# See dashboard, charts, and requirements
```

### 5. Export for Documentation
```bash
ib req export -f markdown -o requirements.md
```

## New CLI Commands in v2.3.0

### Web UI
```bash
ib web start [--port 9528]  # Start web dashboard
ib web stop                  # Stop web dashboard
```

### Version Control
```bash
ib req history <id>              # Show version history
ib req diff <id> <v1> <v2>       # Compare versions
ib req diff-last <id>            # Compare last 2 versions
ib req rollback <id> <version>   # Rollback to version
ib req snapshot <id> <tag>       # Create snapshot
ib req snapshots <id>            # List snapshots
```

### Plugin System
```bash
ib plugin install <path>    # Install plugin
ib plugin uninstall <name>  # Uninstall plugin
ib plugin enable <name>     # Enable plugin
ib plugin disable <name>    # Disable plugin
ib plugin list              # List all plugins
ib plugin info <name>       # Show plugin details
```

## Pro Tips

### 1. Use Templates
```bash
ib req add -t feature
ib req add -t bugfix
ib req templates  # List available templates
```

### 2. Smart Natural Language
```bash
ib do "add user authentication requirement"
ib do "list all active requirements"
ib do "mark REQ-001 as done"
```

### 3. Multi-Project Management
```bash
ib project register ~/projects/backend --name backend
ib project register ~/projects/frontend --name frontend
ib project list
ib project switch backend
ib global-status
```

### 4. MCP Integration with Claude Code
```bash
ib mcp-server start
# Use with Claude Code MCP client
```

## Web UI API Endpoints

The web server provides a REST API:

```bash
# Get all requirements
curl http://localhost:9528/api/requirements

# Get single requirement
curl http://localhost:9528/api/requirements/REQ-001

# Update status
curl -X PUT http://localhost:9528/api/requirements/REQ-001/status \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}'

# Get global stats
curl http://localhost:9528/api/global-status
```

## Troubleshooting

### Web UI not starting?
```bash
# Check if ports are in use
lsof -i :3000
lsof -i :9528

# Use different ports
PORT=3001 WEB_SERVER_PORT=9529 ib web start
```

### Plugin not loading?
```bash
# Check plugin syntax
ib plugin info my-plugin

# Enable debug logging
DEBUG=* ib plugin install ./my-plugin.ts
```

### Tests failing?
```bash
# Run specific test
npm test -- tests/unit/services/store.test.ts

# Run with coverage
npm run test:coverage
```

## What's Next?

- Read the [Full Documentation](https://github.com/404QAQ/intentbridge#readme)
- Explore [Plugin Development](docs/PLUGINS.md)
- Check [Web UI Guide](web/README.md)
- View [CHANGELOG](CHANGELOG.md)

## Get Help

- GitHub Issues: https://github.com/404QAQ/intentbridge/issues
- Documentation: https://github.com/404QAQ/intentbridge
- npm: https://www.npmjs.com/package/intentbridge

---

**Version**: 2.3.0
**Released**: 2024-02-14
**Author**: IntentBridge Contributors
