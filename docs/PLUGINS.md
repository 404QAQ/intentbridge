# IntentBridge Plugin System

IntentBridge supports a powerful plugin system that allows developers to extend functionality without modifying core code.

## Overview

Plugins can:
- Hook into lifecycle events (requirement add, update, done, etc.)
- Add custom CLI commands
- Modify data before it's saved
- Integrate with external services
- Automate repetitive tasks

## Quick Start

### 1. Create a Plugin

Create a new JavaScript/TypeScript file:

```typescript
// my-plugin.ts
import { Plugin, HookContext } from 'intentbridge';

const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My custom plugin',
  enabled: true,
  main: 'my-plugin.js',

  hooks: {
    'requirement:add': (context: HookContext) => {
      console.log('New requirement added:', context.data.title);
      return { success: true };
    },
  },

  setup: () => {
    console.log('My plugin loaded!');
  },
};

export default myPlugin;
```

### 2. Install the Plugin

```bash
ib plugin install ./my-plugin.js
```

### 3. Manage Plugins

```bash
# List all plugins
ib plugin list

# Enable a plugin
ib plugin enable my-plugin

# Disable a plugin
ib plugin disable my-plugin

# Uninstall a plugin
ib plugin uninstall my-plugin
```

## Plugin Structure

### Required Fields

```typescript
interface Plugin {
  name: string;          // Unique plugin identifier
  version: string;       // Semver version
  description: string;   // Plugin description
  enabled: boolean;      // Initial enabled state
  main: string;          // Main file path
}
```

### Optional Fields

```typescript
interface Plugin {
  author?: string;                          // Plugin author
  hooks?: Partial<Record<HookName, HookHandler>>;  // Event hooks
  commands?: Record<string, Function>;      // Custom commands
  setup?: () => void | Promise<void>;       // Setup function
  teardown?: () => void | Promise<void>;    // Cleanup function
}
```

## Available Hooks

### Requirement Hooks

| Hook | When | Data |
|------|------|------|
| `requirement:add` | After requirement is added | Full requirement object |
| `requirement:update` | After requirement is updated | Updated requirement |
| `requirement:done` | When requirement marked done | Requirement object |
| `requirement:remove` | Before requirement is removed | Requirement ID |

### File Hooks

| Hook | When | Data |
|------|------|------|
| `file:map` | File mapped to requirement | `{ reqId, file }` |
| `file:unmap` | File unmapped | `{ reqId, file }` |

### Milestone Hooks

| Hook | When | Data |
|------|------|------|
| `milestone:create` | Milestone created | Milestone object |
| `milestone:update` | Milestone updated | Updated milestone |

### Project Hooks

| Hook | When | Data |
|------|------|------|
| `project:switch` | Project switched | Project object |
| `project:register` | Project registered | Project object |

### System Hooks

| Hook | When | Data |
|------|------|------|
| `init:before` | Before initialization | `{}` |
| `init:after` | After initialization | `{ cwd }` |

## Hook Context

All hook handlers receive a context object:

```typescript
interface HookContext {
  type: HookName;        // Name of the hook
  timestamp: string;     // ISO timestamp
  data: any;            // Hook-specific data
  cwd: string;          // Current working directory
}
```

## Hook Result

Return a result object:

```typescript
interface HookResult {
  success: boolean;      // Required
  error?: string;       // Error message if failed
  modifiedData?: any;   // Modified data (for data modification hooks)
}
```

### Modifying Data

Some hooks allow modifying data before it's saved:

```typescript
hooks: {
  'requirement:add': (context) => {
    const requirement = context.data;

    // Auto-add tag
    if (!requirement.tags) {
      requirement.tags = [];
    }
    requirement.tags.push('auto-tagged');

    return {
      success: true,
      modifiedData: requirement
    };
  },
}
```

## Builtin Plugins

IntentBridge comes with several builtin plugins:

### 1. Auto Tagger

Automatically tags requirements based on keywords.

```bash
ib plugin info auto-tagger
```

Keywords detected:
- `backend`: api, server, database, auth
- `frontend`: ui, ux, component, page
- `testing`: test, spec, coverage
- `security`: auth, login, password
- `performance`: optimize, cache, speed

### 2. Dependency Detector

Suggests dependencies based on requirement content.

```bash
ib plugin info dependency-detector
```

### 3. Notifier

Logs important events to console.

```bash
ib plugin info notifier
```

## Advanced Examples

### Custom Validation Plugin

```typescript
import { Plugin, HookContext } from 'intentbridge';

const validationPlugin: Plugin = {
  name: 'requirement-validator',
  version: '1.0.0',
  description: 'Validate requirement completeness',
  enabled: true,
  main: 'requirement-validator.js',

  hooks: {
    'requirement:add': (context: HookContext) => {
      const req = context.data;
      const errors: string[] = [];

      if (!req.title || req.title.length < 10) {
        errors.push('Title too short (min 10 chars)');
      }

      if (!req.description || req.description.length < 50) {
        errors.push('Description too short (min 50 chars)');
      }

      if (!req.acceptance || req.acceptance.length === 0) {
        errors.push('No acceptance criteria defined');
      }

      if (errors.length > 0) {
        console.error('Validation failed:');
        errors.forEach(e => console.error(`  ❌ ${e}`));
        return { success: false, error: 'Validation failed' };
      }

      return { success: true };
    },
  },
};

export default validationPlugin;
```

### Slack Integration Plugin

```typescript
import { Plugin, HookContext } from 'intentbridge';

const slackPlugin: Plugin = {
  name: 'slack-notifier',
  version: '1.0.0',
  description: 'Send notifications to Slack',
  enabled: true,
  main: 'slack-notifier.js',

  hooks: {
    'requirement:done': async (context: HookContext) => {
      const req = context.data;

      // Send to Slack webhook
      await fetch('https://hooks.slack.com/services/YOUR/WEBHOOK', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `✅ Requirement completed: ${req.title}`,
          attachments: [{
            color: 'good',
            fields: [
              { title: 'ID', value: req.id, short: true },
              { title: 'Priority', value: req.priority, short: true },
            ]
          }]
        })
      });

      return { success: true };
    },
  },

  setup: () => {
    console.log('Slack integration enabled');
  },
};

export default slackPlugin;
```

### Custom Command Plugin

```typescript
import { Plugin } from 'intentbridge';

const customCommandsPlugin: Plugin = {
  name: 'custom-commands',
  version: '1.0.0',
  description: 'Add custom CLI commands',
  enabled: true,
  main: 'custom-commands.js',

  commands: {
    'export-csv': () => {
      console.log('Exporting requirements to CSV...');
      // Implementation
    },
    'import-jira': (file: string) => {
      console.log(`Importing from Jira: ${file}`);
      // Implementation
    },
  },

  setup: () => {
    console.log('Custom commands loaded');
    console.log('Available commands:');
    console.log('  ib custom export-csv');
    console.log('  ib custom import-jira <file>');
  },
};

export default customCommandsPlugin;
```

## Plugin Development Guide

### Best Practices

1. **Namespace your plugin**: Use a unique name like `@myorg/plugin-name`
2. **Version your plugin**: Follow semantic versioning
3. **Handle errors gracefully**: Catch exceptions in hooks
4. **Use TypeScript**: Get type safety and autocomplete
5. **Document hooks**: Comment which hooks your plugin uses
6. **Test thoroughly**: Test with different scenarios

### Testing Your Plugin

```typescript
// test-plugin.ts
import myPlugin from './my-plugin';

// Test setup
await myPlugin.setup?.();

// Test hook
const result = await myPlugin.hooks?.['requirement:add']?.({
  type: 'requirement:add',
  timestamp: new Date().toISOString(),
  data: {
    id: 'REQ-TEST',
    title: 'Test Requirement',
    description: 'Test',
  },
  cwd: process.cwd(),
});

console.log('Hook result:', result);
```

### Publishing Plugins

1. Create a GitHub repository
2. Add `package.json` with `main` field
3. Document in README.md
4. Share via npm or GitHub URL

Users can install with:
```bash
ib plugin install @myorg/my-plugin
# or
ib plugin install https://github.com/myorg/ib-plugin-myplugin
```

## Plugin API Reference

### PluginManager

```typescript
class PluginManager {
  register(plugin: Plugin): Promise<void>
  unregister(pluginName: string): Promise<void>
  enable(pluginName: string): Promise<void>
  disable(pluginName: string): Promise<void>
  getPlugin(name: string): Plugin | undefined
  listPlugins(): PluginConfig[]
  executeHook(hookName: HookName, context: any): Promise<void>
}
```

## Troubleshooting

### Plugin Not Loading

Check:
- File path is correct
- Plugin has required fields (name, version, description, enabled, main)
- No syntax errors in plugin file
- Check console for error messages

### Hook Not Firing

Ensure:
- Plugin is enabled: `ib plugin list`
- Hook name is spelled correctly
- Plugin is registered: `ib plugin info <name>`

### Modifying Data

Only certain hooks support data modification:
- `requirement:add`
- `requirement:update`

Return `modifiedData` in result to modify.

## Future Enhancements

- [ ] Plugin marketplace/registry
- [ ] Plugin dependencies
- [ ] Plugin configuration UI
- [ ] Hot reload plugins
- [ ] Plugin sandboxing
- [ ] Plugin permissions system

## License

MIT © IntentBridge Contributors
