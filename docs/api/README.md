# IntentBridge API Documentation

## Overview

IntentBridge provides a RESTful API for requirement management.

**Base URL**: `http://localhost:9528/api`

**Version**: 2.4.0

---

## Quick Start

### Start the API Server

```bash
# Start web dashboard (includes API server)
ib web start

# API will be available at http://localhost:9528/api
```

### Test the API

```bash
# Health check
curl http://localhost:9528/api/health

# List requirements
curl http://localhost:9528/api/requirements

# Get specific requirement
curl http://localhost:9528/api/requirements/REQ-001
```

---

## API Endpoints

### Requirements

#### GET /requirements

List all requirements.

**Query Parameters:**
- `project` (string, optional) - Filter by project path

**Response:**
```json
{
  "requirements": [
    {
      "id": "REQ-001",
      "title": "User Authentication",
      "description": "Implement login system",
      "status": "active",
      "priority": "high",
      "created": "2024-02-14T10:00:00Z",
      "files": ["src/auth/login.ts"],
      "tags": ["backend", "security"]
    }
  ]
}
```

#### GET /requirements/:id

Get a requirement by ID.

**Response:**
```json
{
  "requirement": {
    "id": "REQ-001",
    "title": "User Authentication",
    "description": "Implement login system",
    "status": "active",
    "priority": "high",
    "created": "2024-02-14T10:00:00Z",
    "files": ["src/auth/login.ts"],
    "tags": ["backend", "security"],
    "acceptance": [
      {
        "criterion": "User can login",
        "done": true
      }
    ]
  }
}
```

#### PUT /requirements/:id/status

Update requirement status.

**Request Body:**
```json
{
  "status": "done"
}
```

**Response:**
```json
{
  "success": true
}
```

### Projects

#### GET /projects

List all projects.

**Response:**
```json
{
  "projects": [
    {
      "name": "my-project",
      "path": "/Users/user/projects/my-project",
      "description": "My awesome project",
      "status": "active",
      "tags": ["frontend"]
    }
  ]
}
```

#### GET /projects/current

Get current project.

**Response:**
```json
{
  "project": {
    "name": "my-project",
    "path": "/Users/user/projects/my-project",
    "status": "active"
  }
}
```

### Statistics

#### GET /global-status

Get global statistics.

**Response:**
```json
{
  "totalProjects": 5,
  "activeProjects": 3,
  "totalRequirements": 42,
  "doneRequirements": 28,
  "implementingRequirements": 8
}
```

### System

#### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-02-14T12:00:00Z"
}
```

---

## SDK Usage

### JavaScript/TypeScript

```bash
npm install @intentbridge/sdk
```

```typescript
import { IntentBridge } from '@intentbridge/sdk';

const client = new IntentBridge();

// List requirements
const requirements = await client.listRequirements();

// Update status
await client.updateRequirementStatus('REQ-001', 'done');
```

### Python (using requests)

```python
import requests

BASE_URL = "http://localhost:9528/api"

# List requirements
response = requests.get(f"{BASE_URL}/requirements")
requirements = response.json()["requirements"]

# Update status
response = requests.put(
    f"{BASE_URL}/requirements/REQ-001/status",
    json={"status": "done"}
)
```

### cURL

```bash
# List requirements
curl http://localhost:9528/api/requirements

# Get requirement
curl http://localhost:9528/api/requirements/REQ-001

# Update status
curl -X PUT http://localhost:9528/api/requirements/REQ-001/status \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}'
```

---

## OpenAPI Specification

Full OpenAPI 3.0 specification available at:
- [openapi.yaml](./openapi.yaml)
- Swagger UI: http://localhost:9528/api-docs (coming soon)

---

## Postman Collection

Import this collection to Postman:

```json
{
  "info": {
    "name": "IntentBridge API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "List Requirements",
      "request": {
        "method": "GET",
        "url": "http://localhost:9528/api/requirements"
      }
    },
    {
      "name": "Get Requirement",
      "request": {
        "method": "GET",
        "url": "http://localhost:9528/api/requirements/REQ-001"
      }
    },
    {
      "name": "Update Status",
      "request": {
        "method": "PUT",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"status\":\"done\"}"
        },
        "url": "http://localhost:9528/api/requirements/REQ-001/status"
      }
    },
    {
      "name": "Global Status",
      "request": {
        "method": "GET",
        "url": "http://localhost:9528/api/global-status"
      }
    }
  ]
}
```

---

## Rate Limiting

Currently no rate limiting. Will be added in future versions.

## Authentication

Currently no authentication. Will add OAuth support in v3.0.0.

## CORS

CORS is enabled for all origins in development mode.

## Error Handling

All errors return JSON:

```json
{
  "error": "Requirement not found"
}
```

**Status Codes:**
- 200 - Success
- 400 - Bad Request
- 404 - Not Found
- 500 - Internal Server Error

---

## Changelog

### v2.4.0 (2024-02-14)
- Initial API release
- Requirements CRUD
- Projects management
- Global statistics
- Health check endpoint
- JavaScript SDK

---

## Support

- GitHub Issues: https://github.com/404QAQ/intentbridge/issues
- Documentation: https://github.com/404QAQ/intentbridge

**API Version**: 2.4.0
**Last Updated**: 2024-02-14
