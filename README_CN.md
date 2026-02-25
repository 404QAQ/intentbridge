# 🌉 IntentBridge

<div align="center">

**[English](README.md)** | **中文文档**

**专为 Claude Code 设计的 AI 驱动需求管理工具**

[![npm version](https://badge.fury.io/js/intentbridge.svg)](https://badge.fury.io/js/intentbridge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/intentbridge.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [文档](#-文档) • [示例](#-示例) • [贡献](#-贡献)

</div>

---

## 📖 概述

**IntentBridge** 是一款专为 **Claude Code** 设计的智能需求管理工具。通过渐进式上下文构建和 AI 驱动的分析，弥合人类需求与 AI 理解之间的鸿沟。

### 为什么选择 IntentBridge？

- 🧠 **持久化记忆** - 需求永不丢失，Claude 永远记得
- 📈 **渐进式理解** - 从原始描述到代码实现 (L0→L4)
- 🤖 **AI 驱动分析** - 自动生成理解、影响分析、验证
- 🌍 **多项目管理** - 从一处管理所有项目
- 🔗 **MCP 集成** - 通过模型上下文协议与 Claude Code 无缝集成
- 🎯 **自然语言接口** - 只需用自然语言描述您想要的

---

## ✨ 功能特性

### 🎯 核心能力

| 功能 | 描述 |
|------|------|
| **需求管理** | 完整的 CRUD 操作、标签、验收标准、依赖关系 |
| **AI 驱动理解** | 生成深度理解、影响分析、完成验证 |
| **多项目支持** | 跨项目注册、切换、链接和共享文件 |
| **多项目协调** | **新版 v3.4.0**：端口管理、进程监控、资源协调 |
| **渐进式上下文** | L0 (原始) → L1 (标准化) → L2 (结构化) → L3 (AI 增强) → L4 (代码锚定) |
| **MCP 桥接** | 为 Claude Code 导出上下文、会话管理 |
| **自然语言路由** | `ib do "添加用户认证需求"` - 只需描述您想要的 |
| **智能项目创建** | AI 分析需求并自动创建项目结构 |

### 🚀 关键创新

1. **自动项目检测** - 根据目录自动检测项目上下文
2. **自然语言命令** - 无需记忆复杂的 CLI 语法
3. **AI 项目脚手架** - 一条命令创建完整的项目结构和文档
4. **MCP 协议** - 与 Claude Code 真正的双向通信
5. **多项目协调** - **新版 v3.4.0**：跨项目管理端口、进程和资源

---

## 📦 安装

### 一键安装（推荐）

最快上手 IntentBridge 的方式：

```bash
curl -fsSL https://raw.githubusercontent.com/404QAQ/intentbridge/main/install.sh | bash
```

**安装脚本功能：**
- ✅ 检查并安装 Node.js（v18+）
- ✅ 全局安装 IntentBridge
- ✅ 检查 Claude Code CLI（可选）
- ✅ 配置 Claude API 密钥
- ✅ 配置 IntentBridge AI 提供商
- ✅ 初始化第一个项目
- ✅ 可选启动 Web UI 仪表板

**手动安装**（如果您喜欢）：

```bash
npm install -g intentbridge
```

### 前置要求

- Node.js >= 18.0.0
- npm 或 yarn

### 验证安装

```bash
ib --version
# 输出: 3.4.0
```

---

## 🎮 快速开始

### 1. 初始化项目

```bash
mkdir my-project && cd my-project
ib init
```

### 2. 添加第一个需求

**方式 A：交互模式**
```bash
ib req add
> 标题: 用户认证
> 描述: 实现基于 JWT 的登录
> 优先级: high
✔ 已创建 REQ-001
```

**方式 B：自然语言**
```bash
ib do "添加用户认证需求"
```

**方式 C：AI 驱动（推荐）**
```bash
ib smart-add "需要一个用户认证系统，支持 JWT 和 OAuth2.0"
```

AI 将会：
- 分析需求
- 创建项目结构 (src/, tests/, docs/)
- 生成 README.md、package.json、tsconfig.json
- 将需求添加到 IntentBridge

### 3. 查看需求

```bash
ib req list
ib explain REQ-001          # Claude Code 紧凑视图
ib show-understanding REQ-001  # 详细文档
```

### 4. 与 Claude Code 协作

```bash
# 为 Claude Code 导出上下文
ib mcp export REQ-001

# 复制并粘贴到 Claude Code 对话中
```

### 5. 验证完成

```bash
ib ai validate REQ-001 --with-code
```

### 6. 使用 Web UI 可视化（新功能！🎉）

IntentBridge 现在包含一个精美的基于 Web 的仪表板来管理需求：

```bash
# 启动 Web 仪表板
ib web start

# 将打开：
# - 仪表板: http://localhost:3000
# - API 服务器: http://localhost:9528
```

**Web UI 功能：**
- 🌙 **暗色模式** - 自动检测 + 手动切换
- 🔄 **实时更新** - 每 10 秒自动刷新
- 🔍 **高级筛选** - 搜索、状态、优先级、标签
- 📤 **导出选项** - CSV、JSON、Markdown 格式

**快速预览：**

```
┌──────────────────────────────────────────────────┐
│  仪表板                        🌙 切换主题       │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │ 12   │ │  5   │ │ 48   │ │ 75%  │          │
│  │项目  │ │活跃  │ │需求  │ │完成  │          │
│  └──────┘ └──────┘ └──────┘ └──────┘          │
│                                                  │
│  [需求列表] → 筛选、搜索、导出                  │
│  点击任意需求 → 查看完整详情                    │
└──────────────────────────────────────────────────┘
```

查看 [Web UI 文档](web/README_CN.md) 了解详细使用方法和截图。

### 7. 多项目协调（新功能 v3.4.0 🚀）

IntentBridge v3.4.0 引入了全面的多项目协调能力：

**端口管理：**
```bash
# 检查所有项目的端口冲突
ib project ports check

# 自动查找可用端口
ib project ports find --range 3000-4000 --count 3

# 为项目分配端口
ib project ports assign my-project 8080
```

**进程监控：**
```bash
# 启动项目并监控
ib project start my-project --auto-ports

# 查看所有运行中的进程
ib project ps

# 检查资源使用情况
ib project resources my-project
```

**实时仪表板：**
```bash
# 查看所有项目的统一仪表板
ib project dashboard

# 显示：
# - 运行中的项目及其 PID
# - 端口使用和冲突
# - CPU/内存消耗
# - 依赖关系图
```

**核心功能：**
- 🔄 **自动端口分配** - 自动查找和分配端口
- 📊 **资源监控** - 跟踪每个项目的 CPU/内存使用
- 🔗 **依赖编排** - 按正确顺序启动/停止项目
- 🎯 **冲突预防** - 检测并防止端口冲突
- 📈 **实时仪表板** - 所有项目的统一视图

查看 [多项目协调指南](docs/MULTI_PROJECT_COORDINATION.md) 获取完整文档。

---

## 📚 文档

### 🚀 快速入门与帮助

**IntentBridge 新手？** 从这里开始：
- 📖 **[5 分钟快速入门](docs/QUICK_START_5MIN.md)** - 5 分钟快速上手
- 🔧 **[故障排查指南](docs/TROUBLESHOOTING.md)** - 常见问题解决方案
- ❌ **[错误代码参考](docs/ERROR_CODES.md)** - 完整错误代码文档
- 🎯 **[优化计划](docs/OPTIMIZATION_PLAN.md)** - 改进路线图

### 📚 实战教程（新版 v3.5.0）

**通过实际项目学习**：
- 📝 **[教程 1：个人博客系统](docs/tutorials/TUTORIAL_01_BLOG.md)** - 30 分钟，入门级（⭐⭐☆☆☆）
- 🛒 **[教程 2：电商后台](docs/tutorials/TUTORIAL_02_ECOMMERCE.md)** - 45 分钟，进阶级（⭐⭐⭐☆☆）
- 🏗️ **[教程 3：微服务架构](docs/tutorials/TUTORIAL_03_MICROSERVICES.md)** - 60 分钟，高级（⭐⭐⭐⭐☆）
- 📋 **[所有教程](docs/tutorials/README.md)** - 完整教程索引

### 💡 智能命令（新版 v3.5.0）

IntentBridge 现在支持自然语言和短命令：

```bash
# 自然语言
ib "添加用户登录功能"
ib "查看所有需求"
ib "完成 REQ-001"

# 短命令
ib add "登录功能"      # ib req add
ib ls                   # ib req list
ib done REQ-001        # ib req update --status done
ib start my-project    # ib project start
ib web                 # ib web start
```

### 📦 安装

参见 [安装部分](#-安装) 或运行：
```bash
curl -fsSL https://raw.githubusercontent.com/404QAQ/intentbridge/main/install.sh | bash
```

---

### 核心命令

#### 需求管理

```bash
# 添加需求
ib req add
ib req add --template user-auth

# 列出需求
ib req list
ib req search "认证"

# 更新需求
ib req update REQ-001 --status implementing
ib req done REQ-001

# 验收标准
ib req ac REQ-001 "用户可以登录"
ib req accept REQ-001 0

# 依赖关系
ib req dep REQ-002 REQ-001  # REQ-002 依赖于 REQ-001
```

#### 文件映射

```bash
ib map add REQ-001 src/auth.ts src/middleware/auth.ts
ib map list
ib which src/auth.ts  # 查找相关需求
```

#### 里程碑

```bash
ib milestone create "v1.0 发布" "2024-12-31"
ib milestone add "v1.0 发布" REQ-001
ib milestone list
```

#### AI 功能

```bash
# 配置 AI（首次）
ib ai config

# 生成 AI 理解
ib ai understand REQ-001

# 分析影响
ib analyze-impact REQ-001

# 验证完成
ib ai validate REQ-001 --with-code
```

#### 多项目管理

```bash
# 注册项目
ib project register --name "frontend" --tags "react"
ib project register --name "backend" --tags "nodejs"

# 列出项目
ib project list

# 切换项目
ib project switch backend

# 全局视图
ib global-status        # 所有项目概览
ib global-reqs         # 跨所有项目的需求
ib global-reqs --tag frontend
```

#### 自然语言接口

```bash
ib do "在 project-a 添加用户认证需求"
ib do "查看 project-b 的进度"
ib do "更新 REQ-001 状态为 done"
ib do "搜索认证相关需求"
```

#### 智能分析

```bash
ib smart-add "需要一个电商网站，支持商品浏览、购物车、订单管理"
# AI 创建：
# - 项目结构 (src/, tests/, docs/)
# - 配置文件 (package.json, tsconfig.json)
# - README.md
# - 需求 REQ-XXX
```

#### MCP 集成

```bash
# 启动 MCP 服务器
ib mcp-server start --port 9527

# 查看状态
ib mcp-server status

# 列出可用工具
ib mcp-server tools

# 导出上下文（手动）
ib mcp export REQ-001
```

#### 自动检测

```bash
# 检测当前项目
ib detect

# 从任何子目录工作
cd src/components
ib detect  # 仍然识别项目
```

---

## 💡 示例

### 示例 1：从零开始的新项目

```bash
# 1. 创建并初始化
mkdir saas-app && cd saas-app
ib init

# 2. AI 智能创建
ib smart-add "需要一个 SaaS 应用，支持用户注册、订阅管理、计费系统"

# AI 创建：
# ✓ src/models/User.ts
# ✓ src/models/Subscription.ts
# ✓ src/routes/auth.ts
# ✓ src/routes/subscriptions.ts
# ✓ package.json
# ✓ tsconfig.json
# ✓ README.md
# ✓ 需求 REQ-001

# 3. 继续添加需求
ib do "添加用户资料编辑功能"
ib do "添加团队协作功能"

# 4. 查看所有需求
ib req list

# 5. 开始实现
ib req update REQ-001 --status implementing
ib map add REQ-001 src/user/UserService.ts

# 6. 验证完成
ib ai validate REQ-001 --with-code
```

### 示例 2：多项目工作流

```bash
# 注册所有项目
cd ~/projects/frontend
ib project register --name "frontend" --tags "react,typescript"

cd ~/projects/backend
ib project register --name "backend" --tags "nodejs,express"

cd ~/projects/mobile
ib project register --name "mobile" --tags "react-native"

# 查看全局状态
ib global-status

# 链接相关项目
ib project link frontend backend

# 共享通用工具
ib share-file backend "src/utils/validation.ts" "frontend"

# 查看跨所有项目的需求
ib global-reqs --status implementing
```

### 示例 3：Claude Code 集成

```bash
# 方式 1：MCP 服务器（自动化）
ib mcp-server start

# Claude Code 现在可以直接调用 IntentBridge 工具：
# - add_requirement
# - list_requirements
# - get_requirement
# - update_requirement_status

# 方式 2：手动导出
ib mcp export REQ-001
# 复制输出并粘贴到 Claude Code

# Claude Code 看到：
# - 需求详情
# - 理解
# - 相关文件
# - 最近决策
# - Token 预算
```

### 示例 4：变更影响分析

```bash
# 需求需要变更
ib analyze-impact REQ-001

# 输出：
# 直接依赖：无
# 传递依赖：REQ-002, REQ-003
# 受影响文件：5
# 影响深度：2
#
# 建议：在当前会话中继续
# 建议策略：CONTINUE

# 如果影响较大，导出到新会话：
ib mcp export REQ-001
# → 粘贴到新的 Claude Code 会话
```

---

## 🏗️ 架构

### 渐进式理解系统

```
L0: 原始需求
    ↓ "用户认证"
L1: 标准化
    ↓ 标签、验收标准、依赖关系
L2: 结构化理解
    ↓ 生成的 markdown 文档
L3: AI 增强
    ↓ AI 生成的分析、建议
L4: 代码锚定
    ↓ 注入到源文件的注释
```

### 上下文流

```
用户输入
    ↓
[NLP 路由器] → 解析意图
    ↓
[项目检测器] → 自动检测上下文
    ↓
[智能分析器] → AI 分析 + 结构创建
    ↓
[IntentBridge 存储] → 持久化需求
    ↓
[MCP 桥接] → 导出到 Claude Code
```

---

## 📊 对比

| 功能 | IntentBridge | Jira | Linear | Notion |
|------|--------------|------|--------|--------|
| **AI 驱动理解** | ✅ | ❌ | ❌ | ❌ |
| **自然语言接口** | ✅ | ❌ | ❌ | ❌ |
| **Claude Code 集成** | ✅ | ❌ | ❌ | ❌ |
| **自动项目脚手架** | ✅ | ❌ | ❌ | ❌ |
| **渐进式上下文** | ✅ | ❌ | ❌ | ❌ |
| **离线优先** | ✅ | ❌ | ❌ | ✅ |
| **以开发者为中心** | ✅ | ❌ | ✅ | ❌ |
| **免费开源** | ✅ | ❌ | ❌ | ✅ |

---

## 🛠️ 高级用法

### 自定义模板

创建自定义需求模板：

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

使用模板：
```bash
ib req add --template my-template
```

### Git 钩子

自动同步文件映射与 git：

```bash
# .git/hooks/post-checkout
#!/bin/sh
ib sync
```

---

## 📝 许可证

MIT © [IntentBridge 团队](https://github.com/404QAQ)

---

## 🆘 支持

- 📖 [文档](https://intentbridge.dev)
- 🐛 [问题跟踪](https://github.com/404QAQ/intentbridge/issues)
- 💬 [讨论](https://github.com/404QAQ/intentbridge/discussions)

---

## 🌟 Star 历史

如果您觉得 IntentBridge 有用，请考虑给它一个 star ⭐️！

[![Star History Chart](https://api.star-history.com/svg?repos=404QAQ/intentbridge&type=Date)](https://star-history.com/#404QAQ/intentbridge&Date)

---

<div align="center">

**用 ❤️ 为 Claude Code 开发者构建**

[⬆ 返回顶部](#-intentbridge)

</div>
