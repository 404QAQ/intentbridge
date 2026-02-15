# Project Status & Chat - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        IntentBridge Web UI                       │
│                        (http://localhost:5173)                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP/SSE
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Web Server (Express.js)                     │
│                        (http://localhost:9528)                   │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  API Routes  │  │  SSE Stream  │  │   Services   │         │
│  │              │  │   Handler    │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                  │                   │                │
│         ├──────────────────┼───────────────────┤                │
│         │                  │                   │                │
│         ▼                  ▼                   ▼                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Conversation │  │   Status     │  │   Claude     │         │
│  │    Store     │  │   Monitor    │  │   Service    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
         │                  │                   │
         │                  │                   │
         ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Storage Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  .intentbridge/ │ │  .intentbridge/│ │  Claude API  │         │
│  │ conversations/ │ │    status/    │ │  (Optional)  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Component Flow

### Frontend Components

```
┌─────────────────────────────────────────────────────────────┐
│                      ProjectChat Page                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Page Header                         │  │
│  │  • Back Button  • Title  • Demo Mode Banner           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────┐        ┌──────────────────────────┐  │
│  │   StatusPanel    │        │     ChatInterface         │  │
│  │  ┌────────────┐  │        │  ┌────────────────────┐  │  │
│  │  │   Status   │  │        │  │  Message List      │  │  │
│  │  │  Indicator │  │        │  │  • User Messages   │  │  │
│  │  └────────────┘  │        │  │  • AI Messages     │  │  │
│  │  ┌────────────┐  │        │  │  • System Messages │  │  │
│  │  │   Current  │  │        │  │  • Streaming       │  │  │
│  │  │    Task    │  │        │  └────────────────────┘  │  │
│  │  └────────────┘  │        │  ┌────────────────────┐  │  │
│  │  ┌────────────┐  │        │  │   Input Area       │  │  │
│  │  │  Progress  │  │        │  │  • Text Input      │  │  │
│  │  │    Bar     │  │        │  │  • Send Button     │  │  │
│  │  └────────────┘  │        │  └────────────────────┘  │  │
│  │  ┌────────────┐  │        └──────────────────────────┘  │
│  │  │   Recent   │  │                                       │
│  │  │    Logs    │  │        ┌──────────────────────────┐  │
│  │  └────────────┘  │        │    Quick Actions          │  │
│  └──────────────────┘        │  • View Requirements       │  │
│                               │  • Check Progress          │  │
│                               │  • Next Steps              │  │
│                               └──────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Backend Services

```
┌──────────────────────────────────────────────────────────────┐
│                      API Server                               │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    Request Handler                      │  │
│  │  • Authentication (Future)                              │  │
│  │  • Input Validation                                     │  │
│  │  • Route Matching                                       │  │
│  └────────────────────────────────────────────────────────┘  │
│                           │                                   │
│         ┌─────────────────┼─────────────────┐                │
│         │                 │                 │                │
│         ▼                 ▼                 ▼                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │Conversation │  │   Status    │  │   Claude    │         │
│  │   Store     │  │  Monitor    │  │  Service    │         │
│  │             │  │             │  │             │         │
│  │ • Create    │  │ • Track     │  │ • Stream    │         │
│  │ • Load      │  │ • Update    │  │ • Demo      │         │
│  │ • Save      │  │ • Log       │  │ • Context   │         │
│  │ • Clear     │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                 │                 │                │
└─────────┼─────────────────┼─────────────────┼────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
    ┌──────────┐      ┌──────────┐      ┌──────────┐
    │  JSON    │      │  JSON    │      │  Claude  │
    │  Files   │      │  Files   │      │   API    │
    └──────────┘      └──────────┘      └──────────┘
```

## Data Flow

### Message Flow

```
User Input
    │
    ▼
┌──────────────────┐
│ ChatInterface    │
│ Component        │
│                  │
│ • Capture Input  │
│ • Add to Local   │
│   State          │
└──────────────────┘
    │
    │ POST /api/projects/:id/chat
    ▼
┌──────────────────┐
│ API Service      │
│ (Frontend)       │
│                  │
│ • Send Message   │
│ • Open Stream    │
└──────────────────┘
    │
    │ HTTP POST + SSE
    ▼
┌──────────────────┐
│ Server Route     │
│                  │
│ • Validate Input │
│ • Add to History │
│ • Prepare Context│
└──────────────────┘
    │
    ▼
┌──────────────────┐
│ Claude Service   │
│                  │
│ • Call Claude    │
│ • Stream Response│
│ • Handle Errors  │
└──────────────────┘
    │
    │ SSE Stream
    ▼
┌──────────────────┐
│ Frontend         │
│ Stream Handler   │
│                  │
│ • Receive Chunks │
│ • Update UI      │
│ • Complete       │
└──────────────────┘
    │
    ▼
┌──────────────────┐
│ ChatInterface    │
│                  │
│ • Display Stream │
│ • Auto-scroll    │
│ • Persist Msg    │
└──────────────────┘
```

### Status Flow

```
IntentBridge Execution
    │
    ▼
┌──────────────────┐
│ Status Monitor   │
│                  │
│ • Track Status   │
│ • Update Progress│
│ • Log Events     │
└──────────────────┘
    │
    │ Write to .intentbridge/status/
    ▼
┌──────────────────┐
│ JSON File        │
│ Storage          │
└──────────────────┘
    │
    │ GET /api/projects/:id/status
    ▼
┌──────────────────┐
│ API Endpoint     │
│                  │
│ • Load Status    │
│ • Return JSON    │
└──────────────────┘
    │
    ▼
┌──────────────────┐
│ StatusPanel      │
│ Component        │
│                  │
│ • Display Status │
│ • Show Progress  │
│ • List Logs      │
└──────────────────┘
```

## API Endpoints

```
API Base URL: http://localhost:9528/api

┌────────────────────────────────────────────────────────┐
│                    Project Endpoints                    │
├────────────────────────────────────────────────────────┤
│ GET    /projects/:id/status                            │
│        → Get execution status                          │
│                                                         │
│ GET    /projects/:id/conversations                     │
│        → Get conversation history                      │
│                                                         │
│ POST   /projects/:id/chat                              │
│        → Send message (SSE stream response)            │
│                                                         │
│ DELETE /projects/:id/conversations                     │
│        → Clear conversation history                    │
│                                                         │
│ GET    /projects/:id/demo                              │
│        → Check demo mode status                        │
└────────────────────────────────────────────────────────┘
```

## Storage Structure

```
.intentbridge/
├── conversations/
│   ├── project-1.json      # Conversation for project-1
│   ├── project-2.json      # Conversation for project-2
│   └── ...
│
├── status/
│   ├── project-1.json      # Status for project-1
│   ├── project-2.json      # Status for project-2
│   └── ...
│
├── requirements/
│   ├── REQ-001.yaml
│   ├── REQ-002.yaml
│   └── ...
│
└── product-design/
    └── ...
```

## Configuration

```
Environment Variables (.env)
┌────────────────────────────────────────────┐
│ WEB_SERVER_PORT=9528                       │
│ INTENTBRIDGE_DIR=.intentbridge             │
│                                            │
│ # Claude API (Optional)                    │
│ CLAUDE_API_KEY=sk-ant-...                  │
│ CLAUDE_MODEL=claude-3-5-sonnet-20241022    │
│ CLAUDE_BASE_URL=https://api.anthropic.com │
└────────────────────────────────────────────┘
```

---

**Architecture Version**: 1.0.0
**Last Updated**: 2026-02-15
