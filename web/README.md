# IntentBridge Web UI Dashboard v3.1.0

A beautiful web-based dashboard for managing your IntentBridge requirements.

## 🎉 What's New in v3.1.0

### 1. 🌙 Dark Mode
- **Automatic detection**: Respects system preference
- **Manual toggle**: One-click theme switching
- **Persistent**: Remembers your choice in localStorage
- **Smooth transitions**: Beautiful color transitions

### 2. 🔄 Real-Time Updates
- **Auto-refresh**: Data updates every 10 seconds
- **Live status**: Shows last update timestamp
- **Manual refresh**: Click to refresh anytime
- **Error handling**: Graceful error display

### 3. 🔍 Advanced Filtering
- **Search**: Full-text search across titles and descriptions
- **Status filter**: Filter by status (draft, active, implementing, done)
- **Priority filter**: Filter by priority (high, medium, low)
- **Tag filter**: Multi-select tag filtering
- **Clear all**: Reset all filters with one click

### 4. 📤 Export Functionality
- **CSV Export**: Export to spreadsheet format
- **JSON Export**: Export for programmatic use
- **Markdown Export**: Export as formatted documentation
- **Timestamped filenames**: Automatic date in filename

## Features

- **Dashboard Overview**: View statistics and status distribution at a glance
- **Requirements List**: Browse and filter requirements with advanced controls
- **Requirement Details**: View detailed information and update status
- **Real-time Updates**: Changes reflect immediately via polling
- **Dark Mode**: Easy on the eyes, day or night
- **Export Options**: Download your data in multiple formats

## Quick Start

### 1. Start the Web Dashboard

From your project root (where `.intentbridge/` is located):

```bash
ib web start
```

This will start:
- **API Server** at http://localhost:9528
- **Frontend Dev Server** at http://localhost:3000

### 2. Open in Browser

Navigate to http://localhost:3000 to see your dashboard.

## Usage

### Dashboard

The home page shows:
- Total projects count
- Active projects
- Total requirements
- Completion rate
- Status distribution pie chart
- Recent requirements

### Requirements List

Browse all requirements with:
- **Search bar**: Search by title, description, or ID
- **Filter panel**: Advanced multi-criteria filtering
- **Export buttons**: Download in CSV, JSON, or Markdown
- **Real-time updates**: Auto-refresh every 10 seconds
- Status, priority, and tags display
- Click to view details

### Requirement Details

Click any requirement to:
- View full description
- See acceptance criteria
- Check dependencies
- View notes and decisions
- Update status via dropdown

## Development

### Architecture

```
web/
├── src/
│   ├── App.tsx                      # Main app with routing & theme
│   ├── components/
│   │   ├── ThemeToggle.tsx          # Dark mode toggle
│   │   ├── FilterPanel.tsx          # Advanced filtering
│   │   └── ExportButton.tsx         # Export dropdown
│   ├── hooks/
│   │   ├── useTheme.ts              # Theme management
│   │   ├── useRealtimeUpdates.ts    # Auto-refresh logic
│   │   └── useExport.ts             # Export utilities
│   ├── pages/
│   │   ├── Home.tsx                 # Dashboard page
│   │   ├── Requirements.tsx         # Requirements list (enhanced)
│   │   └── RequirementDetail.tsx    # Single requirement view
│   └── services/
│       └── api.ts                   # API client
├── package.json
└── vite.config.ts

web-server/
├── src/
│   └── server.ts                    # Express API server
└── package.json
```

### Tech Stack

**Frontend**:
- React 18 + TypeScript
- React Router v6
- Recharts (charts)
- TailwindCSS (styling) + Dark Mode
- Vite (bundler)
- Custom hooks for theme, updates, and export

**Backend**:
- Express.js
- js-yaml (YAML parsing)
- CORS enabled

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/requirements` | GET | List all requirements |
| `/api/requirements/:id` | GET | Get single requirement |
| `/api/requirements/:id/status` | PUT | Update requirement status |
| `/api/projects` | GET | List all projects |
| `/api/projects/current` | GET | Get current project |
| `/api/global-status` | GET | Get global statistics |
| `/api/health` | GET | Health check |

### Building for Production

```bash
# Build frontend
cd web
npm run build

# Build backend
cd ../web-server
npm run build

# Start in production mode
cd ..
ib web start --no-dev
```

## Configuration

### Environment Variables

The web server respects these environment variables:

- `WEB_SERVER_PORT`: API server port (default: 9528)
- `INTENTBRIDGE_DIR`: Path to `.intentbridge/` directory (default: `./.intentbridge`)

### Production Setup

For production deployment:

1. Build both frontend and backend
2. Configure reverse proxy (nginx, Apache)
3. Set environment variables
4. Use process manager (PM2, systemd)

Example nginx config:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:9528;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

## Troubleshooting

### Port Already in Use

If ports 3000 or 9528 are in use:

```bash
# Use custom ports
PORT=3001 ib web start  # Frontend
WEB_SERVER_PORT=9529 ib web start  # Backend
```

### No Requirements Showing

Make sure you're in a directory with `.intentbridge/` initialized:

```bash
ib init
ib req add  # Add some requirements
```

### Dark Mode Not Working

Clear your browser's localStorage and refresh the page. The theme toggle will initialize based on your system preference.

### Real-time Updates Not Working

Check that the API server is running on port 9528. You can manually refresh data using the "Refresh" link.

## Future Enhancements

- [ ] User authentication
- [ ] WebSocket-based real-time updates
- [ ] PDF export with formatting
- [ ] Bulk status updates
- [ ] Advanced search with regex
- [ ] Timeline view
- [ ] Gantt charts for dependencies
- [ ] Customizable dashboard widgets

## License

MIT © IntentBridge Contributors
