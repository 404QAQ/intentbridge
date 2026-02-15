# Project Status & Chat Feature

## Overview

The Project Status & Chat feature allows users to monitor IntentBridge execution status and have natural language conversations with Claude Code about project requirements, implementation progress, and development suggestions.

## Features

### 1. Execution Status Monitoring
- Real-time status display (idle, running, completed, error)
- Current task tracking
- Progress bar visualization
- Recent log entries with color-coded severity levels

### 2. Chat Interface
- Natural language conversation with Claude
- Streaming responses for real-time feedback
- Conversation history persistence
- Clear history functionality
- Quick action buttons for common queries

### 3. Demo Mode
- Works without Claude API key
- Simulated AI responses for testing
- Easy upgrade path to real AI responses

## Architecture

### Backend Components

#### 1. Conversation Store (`conversationStore.ts`)
Manages conversation persistence:
- Creates and loads conversations for projects
- Stores messages in JSON format
- Maintains conversation history

**Storage Location**: `.intentbridge/conversations/{projectId}.json`

#### 2. Status Monitor (`statusMonitor.ts`)
Tracks execution status:
- Monitors current execution state
- Logs execution events
- Parses existing logs if available

**Storage Location**: `.intentbridge/status/{projectId}.json`

#### 3. Claude Service (`claudeService.ts`)
Handles AI integration:
- Manages Claude API configuration
- Implements streaming response handling
- Provides demo mode fallback
- Generates project context

### Frontend Components

#### 1. ProjectChat Page (`ProjectChat.tsx`)
Main chat interface:
- Integrates status panel and chat interface
- Handles message sending and streaming
- Manages conversation state

#### 2. ChatInterface (`ChatInterface.tsx`)
Chat UI component:
- Displays message history
- Handles user input
- Shows streaming responses
- Auto-scrolls to latest messages

#### 3. StatusPanel (`StatusPanel.tsx`)
Status display component:
- Shows execution status with visual indicators
- Displays current task and progress
- Shows recent log entries

#### 4. MessageBubble (`MessageBubble.tsx`)
Individual message display:
- Differentiates user/assistant/system messages
- Shows timestamps
- Supports markdown rendering

## API Endpoints

### GET `/api/projects/:id/status`
Get project execution status.

**Response**:
```json
{
  "status": {
    "projectId": "project-123",
    "status": "running",
    "currentTask": "Processing requirements",
    "progress": 45,
    "logs": [...]
  }
}
```

### GET `/api/projects/:id/conversations`
Get conversation history.

**Response**:
```json
{
  "messages": [
    {
      "id": "msg-123",
      "role": "user",
      "content": "What are the requirements?",
      "timestamp": "2026-02-15T12:00:00Z"
    }
  ],
  "count": 1
}
```

### POST `/api/projects/:id/chat`
Send a message and receive streaming response.

**Request Body**:
```json
{
  "message": "What are the current requirements?"
}
```

**Response**: Server-Sent Events (SSE) stream

**Events**:
- `data: {"type": "chunk", "content": "text"}` - Streaming chunk
- `data: {"type": "complete", "content": "full response"}` - Completion
- `data: {"type": "error", "message": "error text"}` - Error

### DELETE `/api/projects/:id/conversations`
Clear conversation history.

**Response**:
```json
{
  "success": true,
  "message": "Conversation history cleared"
}
```

### GET `/api/projects/:id/demo`
Check demo mode status.

**Response**:
```json
{
  "demoMode": true,
  "message": "Running in demo mode..."
}
```

## Configuration

### Environment Variables

Create a `.env` file in `web-server/` directory:

```bash
# Server Configuration
WEB_SERVER_PORT=9528
INTENTBRIDGE_DIR=.intentbridge

# Claude API (Optional)
CLAUDE_API_KEY=your_api_key_here
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_BASE_URL=https://api.anthropic.com/v1/messages
```

### Demo Mode

If `CLAUDE_API_KEY` is not set, the system operates in demo mode:
- Provides simulated responses
- Simulates streaming with delays
- Useful for testing and demonstrations

## Usage

### 1. Access Chat Interface

From any requirement detail page, click the "Project Status & Chat" button:
```
/requirements/REQ-001 → Click button → /projects/REQ-001/chat
```

### 2. Start Conversation

Type a message or use quick action buttons:
- "What are the current requirements?"
- "What is the implementation progress?"
- "What are the next steps?"

### 3. Monitor Execution

View real-time status updates in the status panel:
- Current task
- Progress percentage
- Recent log entries

### 4. Clear History

Click "Clear History" to remove all conversation messages.

## Development

### Running in Development

1. Start backend server:
```bash
cd web-server
npm install
npm run dev
```

2. Start frontend dev server:
```bash
cd web
npm install
npm run dev
```

3. Open browser: `http://localhost:5173`

### Testing Demo Mode

Simply run without setting `CLAUDE_API_KEY`:
```bash
cd web-server
npm run dev
```

The system will automatically use demo mode.

### Testing with Real Claude API

1. Set API key:
```bash
export CLAUDE_API_KEY=your_key_here
```

2. Start server:
```bash
npm run dev
```

## Security Considerations

### API Key Management
- Never commit API keys to version control
- Use environment variables
- Consider using a secrets manager for production

### Input Validation
- All user inputs are validated
- Messages are sanitized before storage
- Conversation history is scoped to project ID

### Rate Limiting
Consider implementing rate limiting for:
- Chat messages per minute
- Concurrent connections
- API call quotas

## Troubleshooting

### Chat Not Working

1. **Check server is running**:
   ```bash
   curl http://localhost:9528/api/health
   ```

2. **Check demo mode**:
   ```bash
   curl http://localhost:9528/api/projects/test/demo
   ```

3. **Check API key** (if not in demo mode):
   ```bash
   echo $CLAUDE_API_KEY
   ```

### No Status Updates

Status updates are written to `.intentbridge/status/{projectId}.json`. Check:
- Directory exists and is writable
- Project ID is correct
- Logs are being generated

### Streaming Not Working

Streaming uses Server-Sent Events (SSE). Check:
- Client supports EventSource or fetch streams
- No proxy blocking SSE
- CORS headers are set correctly

## Future Enhancements

### Planned Features
1. **Markdown Support**: Render markdown in messages
2. **Code Highlighting**: Syntax highlighting for code blocks
3. **Export Conversations**: Download conversation as PDF/Markdown
4. **Multi-model Support**: Choose between different AI models
5. **Context Injection**: Auto-load relevant code context
6. **Voice Input**: Speech-to-text for messages
7. **Message Search**: Search through conversation history
8. **Threads**: Organize conversations by topic

### Integration Ideas
1. **Git Integration**: Auto-detect commits related to requirements
2. **CI/CD Integration**: Show build status in status panel
3. **Code Review**: AI-assisted code review suggestions
4. **Documentation Generation**: Auto-generate docs from conversations

## Contributing

To contribute to this feature:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- Use TypeScript for type safety
- Follow existing component structure
- Add comments for complex logic
- Update documentation

## License

MIT License - See LICENSE file for details.
