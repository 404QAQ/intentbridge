# Quick Start: Project Status & Chat Feature

## 🚀 Quick Setup

### 1. Start Backend Server

```bash
cd web-server
npm install
npm run dev
```

The server will start at http://localhost:9528

### 2. Start Frontend (New Terminal)

```bash
cd web
npm install
npm run dev
```

The frontend will start at http://localhost:5173

### 3. Test the Feature

1. Open http://localhost:5173 in your browser
2. Navigate to "Requirements" page
3. Click on any requirement (e.g., REQ-001)
4. Click the "Project Status & Chat" button
5. Start chatting!

## 🎯 Feature Demo

### Without Claude API Key (Demo Mode)
- System will automatically use demo mode
- Provides simulated AI responses
- Great for testing and demonstrations

### With Claude API Key
1. Get your API key from https://console.anthropic.com/
2. Set environment variable:
   ```bash
   export CLAUDE_API_KEY=your_key_here
   ```
3. Restart the server
4. Chat with real Claude AI!

## 📦 What's Included

### Backend (web-server/)
- `src/services/conversationStore.ts` - Manages conversations
- `src/services/statusMonitor.ts` - Tracks execution status
- `src/services/claudeService.ts` - Claude API integration
- `src/server.ts` - Updated with new routes

### Frontend (web/src/)
- `pages/ProjectChat.tsx` - Main chat page
- `components/chat/ChatInterface.tsx` - Chat UI
- `components/chat/StatusPanel.tsx` - Status display
- `components/chat/MessageBubble.tsx` - Message component
- `services/api.ts` - Updated with chat APIs

### Storage
- `.intentbridge/conversations/` - Conversation history
- `.intentbridge/status/` - Execution status

## 🧪 Testing

### Automated Tests
```bash
cd scripts
./test-project-chat.sh
```

### Manual Testing
1. Follow quick setup steps above
2. Open browser to http://localhost:5173
3. Test all features:
   - View execution status
   - Send messages
   - Use quick action buttons
   - Clear conversation history
   - Check demo mode banner

## 🔧 Configuration

### Environment Variables

Create `.env` file in `web-server/`:

```bash
# Server Configuration
WEB_SERVER_PORT=9528
INTENTBRIDGE_DIR=.intentbridge

# Claude API (Optional)
CLAUDE_API_KEY=your_key_here
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_BASE_URL=https://api.anthropic.com/v1/messages
```

## 📖 Usage Examples

### Ask about requirements:
```
"What are the current requirements for this project?"
```

### Check progress:
```
"What is the current implementation progress?"
```

### Get recommendations:
```
"What are the next steps for this project?"
```

### Analyze specific requirement:
```
"Can you explain requirement REQ-001 in detail?"
```

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port is in use
lsof -i :9528

# Kill process if needed
kill -9 <PID>
```

### No messages appearing
- Check browser console for errors
- Verify server is running
- Check network tab in dev tools

### Demo mode not working
- Ensure CLAUDE_API_KEY is not set
- Check server logs for errors

## 📚 Documentation

For detailed documentation, see:
- [PROJECT_CHAT_FEATURE.md](../docs/PROJECT_CHAT_FEATURE.md) - Complete documentation
- [API Reference](../docs/PROJECT_CHAT_FEATURE.md#api-endpoints)
- [Architecture](../docs/PROJECT_CHAT_FEATURE.md#architecture)

## 🎉 Next Steps

1. Test the feature with demo mode
2. Configure Claude API key for real AI responses
3. Integrate with your IntentBridge workflows
4. Customize UI to match your preferences
5. Add additional features as needed

## 💡 Tips

- Use quick action buttons for common queries
- Clear conversation history if responses become irrelevant
- Check status panel for real-time execution updates
- Demo mode is perfect for presentations and testing
- Real API mode provides more accurate and contextual responses

## 🤝 Contributing

Found a bug or want to contribute?
1. Create an issue on GitHub
2. Submit a pull request
3. Join the discussion

## 📄 License

MIT License - See LICENSE file for details.
