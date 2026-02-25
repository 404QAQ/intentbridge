# 🚀 IntentBridge 5 分钟快速入门

**欢迎使用 IntentBridge！** 这个教程将在 5 分钟内教会您核心功能。

---

## ⏱️ 第 1 分钟: 安装

### 一键安装（推荐）

```bash
curl -fsSL https://raw.githubusercontent.com/404QAQ/intentbridge/main/install.sh | bash
```

安装程序会自动：
- ✅ 检测并安装 Node.js (v18+)
- ✅ 全局安装 IntentBridge
- ✅ 配置 Claude API（可选）
- ✅ 初始化第一个项目

### 验证安装

```bash
ib --version
# 输出: 3.5.0
```

---

## ⏱️ 第 2 分钟: 初始化项目

### 创建新项目

```bash
# 创建项目目录
mkdir my-project
cd my-project

# 初始化 IntentBridge
ib init
```

**输出示例**:
```
✅ 创建 .intentbridge/ 目录
✅ 生成 project.yml
✅ 生成 requirements.yml
✅ 项目初始化完成！
```

### 查看项目状态

```bash
ib status
```

---

## ⏱️ 第 3 分钟: 添加需求

### 方式 1: 自然语言（最简单）✨

```bash
ib "添加用户登录功能"
```

### 方式 2: 短命令

```bash
ib add "用户登录功能"
```

### 方式 3: 完整命令

```bash
ib req add
> 标题: 用户登录功能
> 描述: 实现 JWT 认证登录
> 优先级: high
> 标签: backend, auth
```

**输出**:
```
✅ 创建需求: REQ-001
标题: 用户登录功能
优先级: high
标签: backend, auth
```

---

## ⏱️ 第 4 分钟: 查看和管理

### 查看所有需求

```bash
# 短命令
ib ls

# 或自然语言
ib "查看所有需求"
```

**输出**:
```
需求列表 (共 1 个)
━━━━━━━━━━━━━━━━━━━━━━

REQ-001  [active]  high
用户登录功能
标签: backend, auth
```

### 更新需求状态

```bash
# 短命令（推荐）
ib done REQ-001

# 或自然语言
ib "完成 REQ-001"

# 或完整命令
ib req update REQ-001 --status done
```

### 查看需求详情

```bash
ib req show REQ-001
```

---

## ⏱️ 第 5 分钟: 启动 Web UI

### 启动可视化界面

```bash
# 短命令
ib web

# 或自然语言
ib "打开网页"

# 或完整命令
ib web start
```

**输出**:
```
🚀 启动 Web UI...

API Server: http://localhost:9528
Dashboard:  http://localhost:3000

✅ Web UI 已启动！
```

### 打开浏览器

访问 http://localhost:3000 查看：
- 📊 仪表板
- 📋 需求列表
- 🔍 高级筛选
- 📤 多格式导出

---

## 🎉 恭喜！你已经掌握了核心功能！

### 你学会了：

✅ **安装** - 一键安装命令
✅ **初始化** - 创建新项目
✅ **添加需求** - 3 种方式
✅ **查看需求** - 列表和详情
✅ **更新状态** - 管理需求生命周期
✅ **Web UI** - 可视化管理

---

## 🚀 接下来可以做什么？

### 1. AI 功能（推荐）

```bash
# 让 AI 理解你的需求
ib understand REQ-001

# AI 自动验证实现
ib validate REQ-001
```

### 2. 多项目管理

```bash
# 注册多个项目
ib start my-frontend
ib start my-backend

# 查看所有进程
ib ps

# 实时仪表板
ib dashboard
```

### 3. 端口管理

```bash
# 检查端口冲突
ib ports check

# 自动分配端口
ib start my-project --auto-ports
```

---

## 💡 命令速查表

### 短命令别名

| 短命令 | 完整命令 | 说明 |
|--------|---------|------|
| `ib add` | `ib req add` | 添加需求 |
| `ib ls` | `ib req list` | 列出需求 |
| `ib done` | `ib req update --status done` | 完成需求 |
| `ib start` | `ib project start` | 启动项目 |
| `ib stop` | `ib project stop` | 停止项目 |
| `ib web` | `ib web start` | 启动 Web UI |
| `ib ps` | `ib project ps` | 查看进程 |

### 自然语言示例

```bash
ib "添加登录功能"
ib "查看所有需求"
ib "完成 REQ-001"
ib "启动 my-project"
ib "打开网页"
```

---

## 📚 更多资源

- **完整文档**: [README.md](../README.md)
- **中文文档**: [README_CN.md](../README_CN.md)
- **实战教程**: [TUTORIALS.md](TUTORIALS.md)
- **故障排查**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## 🆘 需要帮助？

### 查看帮助

```bash
ib --help
ib req --help
ib add --help
```

### 常见问题

**Q: 命令找不到？**
```bash
# 检查 PATH
echo $PATH

# 重新安装
npm install -g intentbridge
```

**Q: 端口冲突？**
```bash
# 检查端口
ib ports check

# 使用自动端口
ib start --auto-ports
```

**Q: AI 功能不工作？**
```bash
# 配置 AI
ib ai config
```

---

## ⭐ 5 分钟后的你

现在你已经能够：
- ✅ 快速添加和管理需求
- ✅ 使用自然语言或短命令
- ✅ 通过 Web UI 可视化管理
- ✅ 启动和停止项目
- ✅ 使用 AI 辅助开发

**开始构建你的下一个项目吧！** 🚀

---

**最后更新**: 2026-02-24
**版本**: v3.5.0+
