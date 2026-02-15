# Multi-Project Coordination System

**Version**: 3.4.0
**Feature**: Comprehensive multi-project management with port coordination, process monitoring, and resource management

---

## 📋 Overview

IntentBridge v3.4.0 introduces a powerful multi-project coordination system that allows you to manage multiple projects running simultaneously with:

- **Automatic Port Management**: Detect conflicts, allocate ports, prevent collisions
- **Process Monitoring**: Track CPU/memory usage, lifecycle management
- **Dependency Orchestration**: Start/stop projects in correct order
- **Resource Coordination**: Monitor and balance system resources
- **Real-time Dashboard**: Unified view of all projects

---

## 🚀 Quick Start

### 1. Register Projects with Port Requirements

```bash
# Register a project that needs ports 3000 and 9528
ib project register ./my-project --name my-project --ports 3000,9528

# Register with start/stop commands
ib project register ./api-server \
  --name api-server \
  --ports 3000,5432 \
  --start "npm run start" \
  --stop "npm run stop"
```

### 2. Check Port Conflicts

```bash
# Check all projects for port conflicts
ib project ports check

# Output:
# ✅ No port conflicts detected
# or
# ⚠️  Port conflict detected: Port 3000 used by both 'api' and 'web'
```

### 3. Start Projects with Automatic Port Allocation

```bash
# Start a project with automatic port allocation
ib project start my-project --auto-ports

# Start with dependencies
ib project start frontend --with-deps

# Start all active projects
ib project start-all
```

### 4. Monitor Projects

```bash
# View real-time dashboard
ib project dashboard

# Check resource usage
ib project resources my-project

# Show all running processes
ib project ps
```

---

## 📚 Command Reference

### Port Management Commands

#### `ib project ports <name>`
Show all ports used by a project.

```bash
ib project ports my-project
```

**Output**:
```
Project: my-project
Ports:
  - 3000 (Frontend)
  - 9528 (API Server)
  - 5432 (Database)
```

#### `ib project ports check`
Detect port conflicts across all projects.

```bash
ib project ports check
```

**Output**:
```
Port Conflict Detection
━━━━━━━━━━━━━━━━━━━━━━━━

Conflicts Found: 1

⚠️  Port 3000
   Used by:
   - api-server (PID: 12345)
   - web-frontend (PID: 12346)
   Suggested resolution: Reassign web-frontend to port 3001
```

#### `ib project ports find`
Find available ports in a range.

```bash
# Find 3 available ports starting from 3000
ib project ports find --range 3000-4000 --count 3

# Output:
# Available Ports:
#   - 3001
#   - 3002
#   - 3003
```

#### `ib project ports assign <name> <port>`
Assign a port to a project.

```bash
ib project ports assign my-project 8080
```

#### `ib project ports release <name> [port]`
Release port(s) from a project.

```bash
# Release a specific port
ib project ports release my-project 8080

# Release all ports
ib project ports release my-project
```

---

### Process Management Commands

#### `ib project start <name>`
Start a project with monitoring.

```bash
# Basic start
ib project start my-project

# Start with automatic port allocation
ib project start my-project --auto-ports

# Start with dependencies
ib project start my-project --with-deps
```

**Output**:
```
Starting project: my-project
━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Reserving ports: 3000, 9528
✅ Starting process: npm run start
✅ Process started (PID: 12345)
✅ Monitoring enabled

Project is running!
  PID: 12345
  Ports: 3000, 9528
  Status: healthy
  Uptime: 2s
```

#### `ib project stop <name>`
Stop a project and release resources.

```bash
# Basic stop
ib project stop my-project

# Stop with dependents (cascade)
ib project stop backend --with-dependents
```

**Output**:
```
Stopping project: my-project
━━━━━━━━━━━━━━━━━━━━━━━

✅ Stopping process (PID: 12345)
✅ Releasing ports: 3000, 9528
✅ Process terminated

Project stopped successfully
```

#### `ib project restart <name>`
Restart a project.

```bash
ib project restart my-project
```

#### `ib project start-all`
Start all active projects.

```bash
ib project start-all
```

**Output**:
```
Starting all active projects
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/3] Starting: api-server
  ✅ Started (PID: 12345)

[2/3] Starting: web-frontend
  ✅ Started (PID: 12346)

[3/3] Starting: database
  ✅ Started (PID: 12347)

All projects started (3/3)
```

#### `ib project stop-all`
Stop all running projects.

```bash
ib project stop-all
```

#### `ib project ps`
Show all running processes.

```bash
ib project ps
```

**Output**:
```
Running Processes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project         PID     Status   CPU    Memory   Ports
─────────────────────────────────────────────────────
api-server      12345   running  12%    256MB    3000, 5432
web-frontend    12346   running  8%     128MB    8080
database        12347   running  5%     512MB    5432

Total: 3 projects, 3 processes, 5 ports
```

---

### Resource Monitoring Commands

#### `ib project resources <name>`
Show resource usage for a project.

```bash
ib project resources my-project
```

**Output**:
```
Resource Usage: my-project
━━━━━━━━━━━━━━━━━━━━━━━━━━

Process Information:
  PID: 12345
  Status: running
  Uptime: 2h 15m

Resource Usage:
  CPU: 12.5%
  Memory: 256 MB
  Disk I/O: 45 MB/s read, 12 MB/s write
  Network: 1.2 MB/s in, 0.8 MB/s out

Ports:
  - 3000 (LISTEN)
  - 9528 (LISTEN)

Children: 3 processes
  - node (12346) - 8% CPU, 64MB
  - webpack (12347) - 15% CPU, 128MB
  - watcher (12348) - 2% CPU, 32MB
```

#### `ib project resources top`
Show top resource consumers.

```bash
ib project resources top
```

**Output**:
```
Top Resource Consumers
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Top CPU Usage:
  1. api-server     - 45.2%
  2. ml-training    - 32.8%
  3. web-frontend   - 12.5%

Top Memory Usage:
  1. database       - 2.1 GB
  2. ml-training    - 1.5 GB
  3. api-server     - 512 MB

Total System Resources:
  CPU: 35% used (8 cores)
  Memory: 8.2 GB / 16 GB (51%)
```

---

### Orchestration Commands

#### `ib project dependencies <name>`
Show project dependencies.

```bash
ib project dependencies frontend
```

**Output**:
```
Dependency Tree: frontend
━━━━━━━━━━━━━━━━━━━━━━━━━

frontend
├── api-server (required)
│   ├── database (required)
│   └── cache (optional)
└── auth-service (required)
    └── database (required)

Startup Order:
  1. database
  2. cache (optional)
  3. api-server
  4. auth-service
  5. frontend
```

#### `ib project graph`
Visualize dependency graph.

```bash
ib project graph
```

**Output**:
```
Project Dependency Graph
━━━━━━━━━━━━━━━━━━━━━━━━

┌──────────┐
│ database │
└────┬─────┘
     │
     ├──────> ┌────────────┐
     │        │ api-server │
     │        └─────┬──────┘
     │              │
     │              └──────> ┌───────────┐
     │                       │ frontend  │
     │                       └───────────┘
     │
     └──────> ┌──────────────┐
              │ auth-service │
              └──────────────┘

Total: 4 projects, 3 dependencies
```

#### `ib project dashboard`
Real-time project dashboard.

```bash
ib project dashboard
```

**Output**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   IntentBridge Project Dashboard (Live)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

System Resources
  CPU: ████████░░░░░░░░ 45% (8 cores)
  Memory: ████████░░░░░░ 8.2GB / 16GB (51%)
  Disk: 65% used

Projects (5 total)
  ✅ api-server      running   PID: 12345   Ports: 3000, 5432
  ✅ web-frontend    running   PID: 12346   Ports: 8080
  ✅ database        running   PID: 12347   Ports: 5432
  ⏸️  ml-training     paused    -           Ports: -
  ⏹️  test-suite      stopped   -           Ports: -

Active Processes
  Total: 12 processes
  CPU: 45% total
  Memory: 4.2 GB total

Port Usage
  Used: 3 ports (3000, 5432, 8080)
  Reserved: 2 ports (3001, 3002)
  Conflicts: 0

Press Ctrl+C to exit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### `ib project config <name>`
Configure project runtime settings.

```bash
# View current configuration
ib project config my-project

# Set configuration
ib project config my-project --set ports.0=3001
ib project config my-project --set start.command="npm run dev"
```

---

## 🏗️ Architecture

### Service Layer

```
┌─────────────────────────────────────────┐
│        CLI Commands (bin/ib.ts)         │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│    Project Coordinator Service          │
│  ┌────────────────────────────────────┐ │
│  │ • Orchestration                    │ │
│  │ • Dependency Management            │ │
│  │ • Resource Coordination            │ │
│  └────────────────────────────────────┘ │
└────┬───────────────────┬────────────────┘
     │                   │
┌────┴─────┐       ┌────┴──────────┐
│  Port    │       │   Process     │
│  Scanner │       │   Monitor     │
└──────────┘       └───────────────┘
```

### Data Flow

```
User Command
     ↓
CLI Parser (bin/ib.ts)
     ↓
Project Orchestrate (src/commands/project-orchestrate.ts)
     ↓
Project Coordinator (src/services/project-coordinator.ts)
     ├─→ Port Scanner (src/services/port-scanner.ts)
     └─→ Process Monitor (src/services/process-monitor.ts)
         ↓
Global Store (src/services/global-store.ts)
         ↓
Project Runtime Config
```

---

## 🔧 Configuration

### Project Registration with Ports

```bash
ib project register ./my-project \
  --name my-project \
  --ports 3000,9528,5432 \
  --start "npm run start" \
  --stop "npm run stop"
```

### Runtime Configuration

Each project can have a runtime configuration stored in `.intentbridge/projects/<name>/runtime.json`:

```json
{
  "name": "my-project",
  "ports": {
    "frontend": 3000,
    "api": 9528,
    "database": 5432
  },
  "processes": {
    "main": 12345
  },
  "commands": {
    "start": "npm run start",
    "stop": "npm run stop"
  },
  "dependencies": ["api-server", "database"],
  "resourceLimits": {
    "cpu": "50%",
    "memory": "1GB"
  }
}
```

---

## 📊 Use Cases

### 1. Microservices Development

**Scenario**: Developing multiple microservices locally

```bash
# Register all microservices
ib project register ./auth-service --name auth --ports 3001 --start "npm start"
ib project register ./user-service --name user --ports 3002 --start "npm start"
ib project register ./api-gateway --name gateway --ports 3000 --start "npm start"

# Link dependencies
ib project link gateway auth user

# Start all with dependencies
ib project start gateway --with-deps

# Output:
# [1/3] Starting: auth (port 3001)
# [2/3] Starting: user (port 3002)
# [3/3] Starting: gateway (port 3000)
```

### 2. Full-Stack Development

**Scenario**: Frontend, backend, and database coordination

```bash
# Register projects
ib project register ./backend --name backend --ports 3000,5432 --start "python main.py"
ib project register ./frontend --name frontend --ports 8080 --start "npm start"
ib project register ./database --name db --ports 5432 --start "docker-compose up"

# Set dependencies
ib project link frontend backend
ib project link backend db

# Start with automatic port detection
ib project start frontend --with-deps --auto-ports

# Monitor dashboard
ib project dashboard
```

### 3. Testing Environment

**Scenario**: Running integration tests with isolated environments

```bash
# Check port conflicts
ib project ports check

# Find available ports for test instances
ib project ports find --range 4000-5000 --count 5

# Start test environment
ib project start test-environment --auto-ports

# Run tests...

# Cleanup
ib project stop test-environment
ib project ports release test-environment
```

---

## 🎯 Best Practices

### 1. Port Management

- **Always check for conflicts before starting**: `ib project ports check`
- **Use automatic port allocation**: `--auto-ports` flag
- **Reserve commonly used ports**: `ib project ports assign`
- **Release ports when done**: `ib project ports release`

### 2. Process Management

- **Use start/stop commands**: Register with `--start` and `--stop`
- **Monitor resource usage**: `ib project resources <name>`
- **Stop gracefully**: Use `--with-dependents` for cascading stops
- **Check dashboard regularly**: `ib project dashboard`

### 3. Dependency Management

- **Define dependencies clearly**: Use `ib project link`
- **Start with dependencies**: Always use `--with-deps`
- **Stop with dependents**: Use `--with-dependents`
- **Verify dependency graph**: `ib project graph`

### 4. Resource Coordination

- **Monitor top consumers**: `ib project resources top`
- **Set resource limits**: Configure in runtime.json
- **Balance workload**: Distribute across projects
- **Check system resources**: Dashboard shows totals

---

## 🐛 Troubleshooting

### Port Conflict

**Problem**: Port already in use

```bash
# Check conflicts
ib project ports check

# Find alternative port
ib project ports find --range 3000-4000 --count 1

# Reassign port
ib project ports assign my-project 3001
```

### Process Won't Start

**Problem**: Process fails to start

```bash
# Check if project is already running
ib project ps

# Check port conflicts
ib project ports check

# Check dependencies
ib project dependencies my-project

# Try starting dependencies first
ib project start dependency-project
```

### High Resource Usage

**Problem**: System running slow

```bash
# Check top resource consumers
ib project resources top

# Stop high-usage projects
ib project stop heavy-project

# Check for zombie processes
ib project ps

# Restart if needed
ib project restart my-project
```

---

## 🔒 Security Considerations

- **Port scanning**: Only scans ports you have permission to access
- **Process management**: Runs with current user privileges (no escalation)
- **Configuration**: Stored in user's project directory
- **Network**: No external connections required

---

## 📈 Performance

- **Port scanning**: < 100ms for 1000 ports
- **Process monitoring**: < 1% CPU overhead
- **Dashboard refresh**: 1 second intervals
- **Memory footprint**: < 50MB for coordination services

---

## 🚀 Advanced Features

### 1. Auto-Restart on Crash

```bash
# Start with auto-restart
ib project start my-project --auto-restart
```

### 2. Health Checks

```bash
# Configure health check
ib project config my-project --set healthCheck.url="http://localhost:3000/health"
ib project config my-project --set healthCheck.interval=30
```

### 3. Resource Limits

```bash
# Set resource limits
ib project config my-project --set resourceLimits.cpu=50%
ib project config my-project --set resourceLimits.memory=1GB
```

### 4. Environment Variables

```bash
# Set environment variables
ib project config my-project --set env.NODE_ENV=production
ib project config my-project --set env.DATABASE_URL=postgresql://...
```

---

## 📝 Version History

- **v3.4.0** (2026-02-15): Initial release
  - Port management (6 commands)
  - Process management (6 commands)
  - Resource monitoring (2 commands)
  - Orchestration (4 commands)
  - Cross-platform support

---

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.

---

**Last Updated**: 2026-02-15
**Maintainers**: IntentBridge Team
