# @intentbridge/sdk

Official JavaScript/TypeScript SDK for IntentBridge API.

## Installation

```bash
npm install @intentbridge/sdk
```

## Quick Start

```typescript
import { IntentBridge } from '@intentbridge/sdk';

const client = new IntentBridge({
  baseURL: 'http://localhost:9528/api', // Optional, defaults to localhost
});

// List all requirements
const requirements = await client.listRequirements();
console.log(requirements);

// Get a specific requirement
const req = await client.getRequirement('REQ-001');
console.log(req.title, req.status);

// Update requirement status
await client.updateRequirementStatus('REQ-001', 'done');

// Get global statistics
const status = await client.getGlobalStatus();
console.log(`Completion: ${status.doneRequirements}/${status.totalRequirements}`);
```

## API Reference

### Constructor

```typescript
new IntentBridge(config?: IntentBridgeConfig)
```

**Options:**
- `baseURL` (string) - API base URL (default: `http://localhost:9528/api`)
- `timeout` (number) - Request timeout in ms (default: 10000)
- `headers` (object) - Custom headers

### Methods

#### Requirements

- `listRequirements(project?: string)` - List all requirements
- `getRequirement(id: string)` - Get a requirement by ID
- `updateRequirementStatus(id: string, status: string)` - Update status

#### Projects

- `listProjects()` - List all projects
- `getCurrentProject()` - Get current project

#### Statistics

- `getGlobalStatus()` - Get global statistics
- `healthCheck()` - Check API health

## TypeScript Support

This SDK is written in TypeScript and provides full type definitions.

```typescript
import { Requirement, Project, GlobalStatus } from '@intentbridge/sdk';
```

## Error Handling

```typescript
try {
  const req = await client.getRequirement('REQ-999');
} catch (error) {
  console.error('Failed to get requirement:', error.message);
}
```

## Examples

### Node.js

```javascript
const { IntentBridge } = require('@intentbridge/sdk');

const client = new IntentBridge();

async function main() {
  const requirements = await client.listRequirements();
  console.log(`Found ${requirements.length} requirements`);
}

main().catch(console.error);
```

### Browser

```html
<script type="module">
  import { IntentBridge } from 'https://unpkg.com/@intentbridge/sdk/dist/index.js';

  const client = new IntentBridge();
  const requirements = await client.listRequirements();
  console.log(requirements);
</script>
```

### React

```typescript
import { useEffect, useState } from 'react';
import { IntentBridge, Requirement } from '@intentbridge/sdk';

const client = new IntentBridge();

function RequirementsList() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);

  useEffect(() => {
    client.listRequirements().then(setRequirements);
  }, []);

  return (
    <ul>
      {requirements.map(req => (
        <li key={req.id}>{req.title}</li>
      ))}
    </ul>
  );
}
```

## License

MIT

## Links

- [GitHub Repository](https://github.com/404QAQ/intentbridge)
- [API Documentation](https://github.com/404QAQ/intentbridge/blob/main/docs/api/openapi.yaml)
- [Issues](https://github.com/404QAQ/intentbridge/issues)
