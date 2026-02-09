# IntentBridge

维护项目状态并自动生成 `CLAUDE.md` 的 CLI 工具，为 Claude Code 提供项目上下文注入。

IntentBridge 跟踪项目需求、将源文件映射到需求，并生成结构化的 `CLAUDE.md` 文件，让 Claude Code 充分了解你的项目上下文。

## 安装

```bash
npm install -g intentbridge
```

或通过 npx 直接使用：

```bash
npx intentbridge <command>
```

## 快速开始

```bash
# 在项目目录中初始化
ib init

# 添加需求
ib req add

# 将文件映射到需求
ib map add REQ-001 src/auth.ts src/login.vue

# 记录技术决策
ib req note REQ-001 "认证方案确定用 JWT，原因是需要跨域"

# 添加验收条件
ib req ac REQ-001 "JWT token 签发和验证"

# 生成/更新 CLAUDE.md（聚焦特定需求）
ib gen --focus REQ-001
```

## 命令

### `ib init`

在当前目录初始化 IntentBridge。创建 `.intentbridge/` 目录（包含项目配置）和初始 `CLAUDE.md`。

### `ib req`

管理需求：

| 子命令 | 说明 |
|---|---|
| `ib req add` | 添加新需求（交互式） |
| `ib req list` | 按状态分组列出所有需求 |
| `ib req update <id>` | 更新状态/标题/描述（`-s`、`-t`、`-d`） |
| `ib req done <id>` | 标记需求为已完成 |
| `ib req remove <id>` | 删除需求 |
| `ib req note <id> <message>` | 添加决策记录（带时间戳） |
| `ib req notes <id>` | 查看决策记录 |
| `ib req ac <id> <criterion>` | 添加验收条件 |
| `ib req accept <id> <index>` | 标记验收条件为已完成 |
| `ib req ac-list <id>` | 查看验收条件列表 |
| `ib req dep <id> <dep-id>` | 添加依赖关系 |
| `ib req undep <id> <dep-id>` | 移除依赖关系 |
| `ib req deps <id>` | 查看依赖列表 |

状态流转：`draft` → `active` → `implementing` → `done`

优先级：`high`、`medium`、`low`

### `ib map`

将源文件映射到需求：

| 子命令 | 说明 |
|---|---|
| `ib map add <req-id> <files...>` | 将一个或多个文件映射到需求 |
| `ib map remove <req-id> <file>` | 移除文件映射 |
| `ib map list` | 列出所有文件映射 |
| `ib map which <file>` | 反向查询：从文件查找关联需求（支持模糊匹配） |

### `ib gen`

生成或更新 `CLAUDE.md`，写入当前项目上下文。

```bash
ib gen                          # 生成完整上下文
ib gen --focus REQ-001          # 只注入指定需求
ib gen --focus REQ-001,REQ-003  # 注入多个需求
```

`--focus` 模式会自动包含依赖链上的需求。生成后输出估算 token 数，超过 4000 时警告。

生成的内容包括：

- 项目概述和技术栈
- 活跃/进行中的需求（含决策记录、验收条件、依赖关系）
- 最近完成的需求
- 代码映射索引（文件 → 需求）

### `ib sync`

检测文件映射中的过时条目（已删除或重命名的文件），交互确认后自动更新映射。

```bash
ib sync
# Found 2 mapping change(s):
#   ✗ deleted  src/old-auth.ts
#   → renamed  src/utils.ts → src/helpers.ts
# Apply these changes? (y/N):
```

### `ib status`

显示项目状态概览，包括需求统计和 `CLAUDE.md` 上下文体积（估算 token 数）。

## 工作原理

IntentBridge 将项目状态以 YAML 文件存储在 `.intentbridge/` 目录中：

```
.intentbridge/
  project.yaml        # 项目名称、描述、技术栈、约定
  requirements.yaml   # 所有需求（状态、优先级、文件映射）
```

运行 `ib gen` 会读取这些文件，在 `CLAUDE.md` 中生成结构化内容块，以 `<!-- INTENTBRIDGE:START -->` / `<!-- INTENTBRIDGE:END -->` 标记包裹。标记外的已有内容会被保留。

## 开发

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev -- <command>

# 运行测试
npm test

# 构建
npm run build
```

## Docker

```bash
# 在 Docker 中运行测试
docker compose run test

# 通过 Docker 使用 CLI
docker compose run cli status
```

## 许可证

MIT
