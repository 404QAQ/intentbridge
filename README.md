# 🌉 IntentBridge

<div align="center">

**[English](README.md)** | **[中文文档](README_CN.md)**

**AI-Powered Requirement Management for Claude Code**

[![npm version](https://badge.fury.io/js/intentbridge.svg)](https://badge.fury.io/js/intentbridge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/intentbridge.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Examples](#-examples) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**IntentBridge** is an intelligent requirement management tool designed specifically for **Claude Code**. It bridges the gap between human requirements and AI understanding through progressive context building and AI-powered analysis.

### Why IntentBridge?

- 🧠 **Persistent Memory** - Requirements never lost, Claude always remembers
- 📈 **Progressive Understanding** - From raw description to code implementation (L0→L4)
- 🤖 **AI-Driven Analysis** - Auto-generate understanding, impact analysis, validation
- 🌍 **Multi-Project Management** - Manage all projects from one place
- 🔗 **MCP Integration** - Seamless integration with Claude Code via Model Context Protocol
- 🎯 **Natural Language Interface** - Just describe what you want in plain language

---

## ✨ Features

### 🎯 Core Capabilities

| Feature | Description |
|---------|-------------|
| **Requirement Management** | Full CRUD operations, tags, acceptance criteria, dependencies |
| **AI-Powered Understanding** | Generate deep understanding, impact analysis, completion validation |
| **Multi-Project Support** | Register, switch, link, and share files across projects |
| **Multi-Project Coordination** | **v3.4.0**: Port management, process monitoring, resource coordination |
| **Smart Commands** | **NEW v3.6.0**: Natural language, short aliases, auto-completion |
| **Error System** | **NEW v3.6.0**: 58 error codes, multilingual support, friendly messages |
| **Performance Monitoring** | **NEW v3.6.0**: Execution time, memory usage, performance reports |
| **Intelligent Cache** | **NEW v3.6.0**: Multi-layer cache, auto-invalidation, LRU eviction |
| **Progressive Context** | L0 (Raw) → L1 (Standardized) → L2 (Structured) → L3 (AI-Enhanced) → L4 (Code-Anchored) |
| **MCP Bridge** | Export context for Claude Code, session management |
| **Natural Language Router** | `ib do "add user auth requirement"` - just describe what you want |
| **Smart Project Creation** | AI analyzes requirements and auto-creates project structure |

### 🚀 Key Innovations

1. **Auto Project Detection** - Detects project context automatically based on directory
2. **Natural Language Commands** - No need to memorize complex CLI syntax
3. **AI Project Scaffolding** - One command creates complete project structure with docs
4. **MCP Protocol** - Real bidirectional communication with Claude Code
5. **Multi-Project Coordination** - Manage ports, processes, and resources across multiple projects
6. **Smart Command System** - **NEW v3.6.0**: Natural language + short aliases + auto-completion
7. **Intelligent Error System** - **NEW v3.6.0**: 58 error codes with multilingual support
8. **Performance & Cache** - **NEW v3.6.0**: Built-in monitoring and intelligent caching

---

## 📦 Installation

### One-Line Install (Recommended)

The fastest way to get started with IntentBridge:

```bash
curl -fsSL https://raw.githubusercontent.com/404QAQ/intentbridge/main/install.sh | bash
```

**What the installer does:**
- ✅ Checks and installs Node.js (v18+) if needed
- ✅ Installs IntentBridge globally
- ✅ Checks for Claude Code CLI (optional)
- ✅ Configures Claude API key
- ✅ Configures IntentBridge AI provider
- ✅ Initializes your first project
- ✅ Optionally starts the Web UI dashboard

**Manual installation** (if you prefer):

```bash
npm install -g intentbridge
```

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Verify Installation

```bash
ib --version
# Output: 3.4.0
```

---

## 🎮 Quick Start

### 1. Initialize a Project

```bash
mkdir my-project && cd my-project
ib init
```

### 2. Add Your First Requirement

**Option A: Interactive Mode**
```bash
ib req add
> Title: User Authentication
> Description: Implement JWT-based login
> Priority: high
✔ Created REQ-001
```

**Option B: Natural Language**
```bash
ib do "添加用户认证需求"
```

**Option C: AI-Powered (Recommended)**
```bash
ib smart-add "需要一个用户认证系统，支持 JWT 和 OAuth2.0"
```

AI will:
- Analyze requirement
- Create project structure (src/, tests/, docs/)
- Generate README.md, package.json, tsconfig.json
- Add requirement to IntentBridge

### 3. View Requirements

```bash
ib req list
ib explain REQ-001          # Compact view for Claude Code
ib show-understanding REQ-001  # Detailed document
```

### 4. Work with Claude Code

```bash
# Export context for Claude Code
ib mcp export REQ-001

# Copy and paste into Claude Code conversation
```

### 5. Validate Completion

```bash
ib ai validate REQ-001 --with-code
```

### 6. Visualize with Web UI (NEW! 🎉)

IntentBridge now includes a beautiful web-based dashboard for managing requirements:

```bash
# Start the web dashboard
ib web start

# Opens:
# - Dashboard: http://localhost:3000
# - API Server: http://localhost:9528
```

**Web UI Features:**
- 🌙 **Dark Mode** - Automatic detection + manual toggle
- 🔄 **Real-Time Updates** - Auto-refresh every 10 seconds
- 🔍 **Advanced Filtering** - Search, status, priority, tags
- 📤 **Export Options** - CSV, JSON, Markdown formats

**Quick Tour:**

```
┌──────────────────────────────────────────────────┐
│  Dashboard                    🌙 Toggle Theme   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │ 12   │ │  5   │ │ 48   │ │ 75%  │          │
│  │Projs │ │Active│ │ Reqs │ │ Done │          │
│  └──────┘ └──────┘ └──────┘ └──────┘          │
│                                                  │
│  [Requirements] → Filter, Search, Export       │
│  Click any requirement → View full details     │
└──────────────────────────────────────────────────┘
```

See [Web UI Documentation](web/README.md) for detailed usage and screenshots.

### 7. Multi-Project Coordination (NEW! v3.4.0 🚀)

IntentBridge v3.4.0 introduces comprehensive multi-project coordination capabilities:

**Port Management:**
```bash
# Check for port conflicts across all projects
ib project ports check

# Find available ports automatically
ib project ports find --range 3000-4000 --count 3

# Assign ports to projects
ib project ports assign my-project 8080
```

**Process Monitoring:**
```bash
# Start a project with monitoring
ib project start my-project --auto-ports

# View all running processes
ib project ps

# Check resource usage
ib project resources my-project
```

**Real-time Dashboard:**
```bash
# View unified dashboard of all projects
ib project dashboard

# Shows:
# - Running projects and their PIDs
# - Port usage and conflicts
# - CPU/Memory consumption
# - Dependency graph
```

**Key Features:**
- 🔄 **Automatic Port Allocation** - Find and assign ports automatically
- 📊 **Resource Monitoring** - Track CPU/memory usage per project
- 🔗 **Dependency Orchestration** - Start/stop projects in correct order
- 🎯 **Conflict Prevention** - Detect and prevent port conflicts
- 📈 **Real-time Dashboard** - Unified view of all projects

See [Multi-Project Coordination Guide](docs/MULTI_PROJECT_COORDINATION.md) for complete documentation.

---

## 📚 Documentation

### 🚀 Quick Start & Help

**New to IntentBridge?** Start here:
- 📖 **[5-Minute Quick Start](docs/QUICK_START_5MIN.md)** - Get up and running in 5 minutes
- 🔧 **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)** - Solutions to common problems
- ❌ **[Error Codes Reference](docs/ERROR_CODES.md)** - Complete error code documentation
- 🎯 **[Optimization Plan](docs/OPTIMIZATION_PLAN.md)** - Roadmap for improvements

### 📚 Practical Tutorials (NEW! v3.5.0)

**Hands-on learning with real projects**:
- 📝 **[Tutorial 1: Personal Blog System](docs/tutorials/TUTORIAL_01_BLOG.md)** - 30 min, beginner (⭐⭐☆☆☆)
- 🛒 **[Tutorial 2: E-commerce Backend](docs/tutorials/TUTORIAL_02_ECOMMERCE.md)** - 45 min, intermediate (⭐⭐⭐☆☆)
- 🏗️ **[Tutorial 3: Microservices Architecture](docs/tutorials/TUTORIAL_03_MICROSERVICES.md)** - 60 min, advanced (⭐⭐⭐⭐☆)
- 📋 **[All Tutorials](docs/tutorials/README.md)** - Complete tutorial index

### 💡 Smart Commands (NEW! v3.5.0)

IntentBridge now supports natural language and short commands:

```bash
# Natural language
ib "添加用户登录功能"
ib "查看所有需求"
ib "完成 REQ-001"

# Short commands
ib add "登录功能"      # ib req add
ib ls                   # ib req list
ib done REQ-001        # ib req update --status done
ib start my-project    # ib project start
ib web                 # ib web start
```

### 📦 Installation

See [Installation Section](#-installation) or run:
```bash
curl -fsSL https://raw.githubusercontent.com/404QAQ/intentbridge/main/install.sh | bash
```

---

### Core Commands

#### Requirement Management

```bash
# Add requirement
ib req add
ib req add --template user-auth

# List requirements
ib req list
ib req search "authentication"

# Update requirement
ib req update REQ-001 --status implementing
ib req done REQ-001

# Acceptance criteria
ib req ac REQ-001 "User can login"
ib req accept REQ-001 0

# Dependencies
ib req dep REQ-002 REQ-001  # REQ-002 depends on REQ-001
```

#### File Mapping

```bash
ib map add REQ-001 src/auth.ts src/middleware/auth.ts
ib map list
ib which src/auth.ts  # Find related requirements
```

#### Milestones

```bash
ib milestone create "v1.0 Release" "2024-12-31"
ib milestone add "v1.0 Release" REQ-001
ib milestone list
```

#### AI Features

```bash
# Configure AI (first time)
ib ai config

# Generate AI understanding
ib ai understand REQ-001

# Analyze impact
ib analyze-impact REQ-001

# Validate completion
ib ai validate REQ-001 --with-code
```

#### Multi-Project Management

```bash
# Register projects
ib project register --name "frontend" --tags "react"
ib project register --name "backend" --tags "nodejs"

# List projects
ib project list

# Switch projects
ib project switch backend

# Global views
ib global-status        # All projects overview
ib global-reqs         # All requirements across projects
ib global-reqs --tag frontend
```

#### Natural Language Interface

```bash
ib do "在 project-a 添加用户认证需求"
ib do "查看 project-b 的进度"
ib do "更新 REQ-001 状态为 done"
ib do "搜索认证相关需求"
```

#### Smart Analysis

```bash
ib smart-add "需要一个电商网站，支持商品浏览、购物车、订单管理"
# AI creates:
# - Project structure (src/, tests/, docs/)
# - Configuration files (package.json, tsconfig.json)
# - README.md
# - Requirement REQ-XXX
```

#### MCP Integration

```bash
# Start MCP server
ib mcp-server start --port 9527

# View status
ib mcp-server status

# List available tools
ib mcp-server tools

# Export context (manual)
ib mcp export REQ-001
```

#### Auto Detection

```bash
# Detect current project
ib detect

# Works from any subdirectory
cd src/components
ib detect  # Still recognizes the project
```

---

## 💡 Examples

### Example 1: New Project from Scratch

```bash
# 1. Create and initialize
mkdir saas-app && cd saas-app
ib init

# 2. Smart create with AI
ib smart-add "需要一个 SaaS 应用，支持用户注册、订阅管理、计费系统"

# AI creates:
# ✓ src/models/User.ts
# ✓ src/models/Subscription.ts
# ✓ src/routes/auth.ts
# ✓ src/routes/subscriptions.ts
# ✓ package.json
# ✓ tsconfig.json
# ✓ README.md
# ✓ Requirement REQ-001

# 3. Continue adding requirements
ib do "添加用户资料编辑功能"
ib do "添加团队协作功能"

# 4. View all requirements
ib req list

# 5. Start implementing
ib req update REQ-001 --status implementing
ib map add REQ-001 src/user/UserService.ts

# 6. Validate completion
ib ai validate REQ-001 --with-code
```

### Example 2: Multi-Project Workflow

```bash
# Register all projects
cd ~/projects/frontend
ib project register --name "frontend" --tags "react,typescript"

cd ~/projects/backend
ib project register --name "backend" --tags "nodejs,express"

cd ~/projects/mobile
ib project register --name "mobile" --tags "react-native"

# View global status
ib global-status

# Link related projects
ib project link frontend backend

# Share common utilities
ib share-file backend "src/utils/validation.ts" "frontend"

# View requirements across all projects
ib global-reqs --status implementing
```

### Example 3: Claude Code Integration

```bash
# Method 1: MCP Server (Automated)
ib mcp-server start

# Claude Code can now directly call IntentBridge tools:
# - add_requirement
# - list_requirements
# - get_requirement
# - update_requirement_status

# Method 2: Manual Export
ib mcp export REQ-001
# Copy output and paste into Claude Code

# Claude Code sees:
# - Requirement details
# - Understanding
# - Related files
# - Recent decisions
# - Token budget
```

### Example 4: Change Impact Analysis

```bash
# Requirement needs to change
ib analyze-impact REQ-001

# Output:
# Direct Dependencies: None
# Transitive Dependencies: REQ-002, REQ-003
# Affected Files: 5
# Impact Depth: 2
#
# Recommendation: Continue in current session
# Suggested Strategy: CONTINUE

# If impact is large, export to new session:
ib mcp export REQ-001
# → Paste into new Claude Code session
```

---

## 🏗️ Architecture

### Progressive Understanding System

```
L0: Raw Requirement
    ↓ "User Authentication"
L1: Standardized
    ↓ Tags, acceptance criteria, dependencies
L2: Structured Understanding
    ↓ Generated markdown document
L3: AI-Enhanced
    ↓ AI-generated analysis, suggestions
L4: Code-Anchored
    ↓ Comments injected into source files
```

### Context Flow

```
User Input
    ↓
[NLP Router] → Parse Intent
    ↓
[Project Detector] → Auto-detect context
    ↓
[Smart Analyzer] → AI analysis + structure creation
    ↓
[IntentBridge Store] → Persist requirements
    ↓
[MCP Bridge] → Export to Claude Code
```

---

## 📊 Comparison

| Feature | IntentBridge | Jira | Linear | Notion |
|---------|--------------|------|--------|--------|
| **AI-Powered Understanding** | ✅ | ❌ | ❌ | ❌ |
| **Natural Language Interface** | ✅ | ❌ | ❌ | ❌ |
| **Claude Code Integration** | ✅ | ❌ | ❌ | ❌ |
| **Auto Project Scaffolding** | ✅ | ❌ | ❌ | ❌ |
| **Progressive Context** | ✅ | ❌ | ❌ | ❌ |
| **Offline-First** | ✅ | ❌ | ❌ | ✅ |
| **Developer-Centric** | ✅ | ❌ | ✅ | ❌ |
| **Free & Open Source** | ✅ | ❌ | ❌ | ✅ |

---

## 🛠️ Advanced Usage

### Custom Templates

Create custom requirement templates:

```yaml
# .intentbridge/templates/my-template.yaml
title: ""
description: ""
priority: medium
tags: []
acceptance:
  - criterion: ""
    done: false
```

Use it:
```bash
ib req add --template my-template
```

### Git Hooks

Auto-sync file mappings with git:

```bash
# .git/hooks/post-checkout
#!/bin/sh
ib sync
```

---

## 📝 License

MIT © [IntentBridge Team](https://github.com/404QAQ)

---

## 🆘 Support

- 📖 [Documentation](https://intentbridge.dev)
- 🐛 [Issue Tracker](https://github.com/404QAQ/intentbridge/issues)
- 💬 [Discussions](https://github.com/404QAQ/intentbridge/discussions)

---

## 🌟 Star History

If you find IntentBridge useful, please consider giving it a star ⭐️!

[![Star History Chart](https://api.star-history.com/svg?repos=404QAQ/intentbridge&type=Date)](https://star-history.com/#404QAQ/intentbridge&Date)

---

<div align="center">

**Built with ❤️ for Claude Code developers**

[⬆ Back to Top](#-intentbridge)

</div>
