# IntentBridge v1.2.0 实现计划

在 v1.1.0 基础上新增 5 个实用功能，强化需求管理和协作能力。

---

## 功能 1：需求搜索

**命令**: `ib req search <keyword>`

**改动文件**:
- `src/services/store.ts` — 新增 `searchRequirements(keyword)` 函数，搜索标题、描述、决策记录
- `src/commands/req.ts` — 新增 `reqSearchCommand`
- `bin/ib.ts` — `req` 子命令增加 `search`
- `tests/store.test.ts` — 增加搜索测试

**搜索范围**:
- 需求 ID（精确匹配）
- 需求标题（包含匹配）
- 需求描述（包含匹配）
- 决策记录 notes（包含匹配）

**输出格式**:
```
找到 3 个匹配需求:

REQ-003 [implementing] 用户认证
  描述: 实现 JWT 认证系统...

REQ-007 [pending] 认证失败处理
  描述: 登录失败 5 次锁定...

REQ-012 [done] 认证日志审计
  决策: 使用认证中间件记录...
```

---

## 功能 2：需求标签

**命令**: `ib req tag <id> <tag>` / `ib req untag <id> <tag>` / `ib req tags`

**改动文件**:
- `src/models/types.ts` — `Requirement` 增加 `tags?: string[]`
- `src/services/store.ts` — 新增 `addTag(id, tag)`、`removeTag(id, tag)`、`getTags()`、`findByTag(tag)`
- `src/commands/req.ts` — 新增 `reqTagCommand`、`reqUntagCommand`、`reqTagsCommand`
- `bin/ib.ts` — `req` 子命令增加 `tag`、`untag`、`tags`
- `src/services/generator.ts` — 需求输出中包含标签
- `tests/store.test.ts` — 增加标签相关测试

**YAML 存储格式**:
```yaml
- id: REQ-003
  tags: [frontend, backend, security]
```

**CLAUDE.md 输出**:
```markdown
### REQ-003 [implementing] 用户认证
标签: frontend, backend, security
描述...
```

**标签列表输出**:
```
所有标签 (12 个需求):

  frontend (4)
  backend (5)
  security (3)
  database (2)
  ui (1)
```

---

## 功能 3：需求导出

**命令**: `ib req export [--format markdown|json] [--output <file>]`

**改动文件**:
- `src/services/exporter.ts` — 新建，`exportRequirements(format)` 函数
- `src/commands/req.ts` — 新增 `reqExportCommand`
- `bin/ib.ts` — `req` 子命令增加 `export`
- `tests/exporter.test.ts` — 新建，导出功能测试

**格式支持**:

**Markdown** (默认):
```markdown
# 项目需求报告

生成时间: 2026-02-10

## 进行中 (3)

### REQ-003 用户认证
**标签**: frontend, backend
**优先级**: high
**依赖**: REQ-001

描述: 实现 JWT 认证系统...

验收条件:
- [x] JWT token 签发和验证
- [ ] 刷新 token 机制

---

## 待开始 (5)
...
```

**JSON**:
```json
{
  "generated": "2026-02-10T10:00:00Z",
  "summary": {
    "total": 12,
    "done": 3,
    "implementing": 4,
    "pending": 5
  },
  "requirements": [...]
}
```

---

## 功能 4：需求模板

**命令**: `ib req add --template <name>` / `ib req templates`

**改动文件**:
- `src/templates/` — 新建目录，存放模板定义
  - `crud.yaml` — CRUD 需求模板
  - `auth.yaml` — 认证需求模板
  - `api.yaml` — API endpoint 模板
- `src/services/template.ts` — 新建，`loadTemplate(name)`、`listTemplates()`
- `src/commands/req.ts` — `reqAddCommand` 增加 `--template` 选项，新增 `reqTemplatesCommand`
- `bin/ib.ts` — `req` 子命令增加 `templates`
- `tests/template.test.ts` — 新建，模板功能测试

**模板格式** (`crud.yaml`):
```yaml
title: "CRUD {资源名}"
description: "实现 {资源名} 的增删改查功能"
tags: ["backend", "database"]
acceptance:
  - criterion: "创建 {资源名} 接口"
    done: false
  - criterion: "查询列表 {资源名} 接口"
    done: false
  - criterion: "更新 {资源名} 接口"
    done: false
  - criterion: "删除 {资源名} 接口"
    done: false
```

**使用流程**:
```
$ ib req add --template crud
资源名: 用户
标签 (frontend, backend, database): backend
优先级 (high/medium/low): medium

创建需求: CRUD 用户 [y/n]? y
✓ 已创建 REQ-013
```

**模板列表**:
```
可用模板:

  crud      CRUD 功能模板 (增删改查)
  auth      认证授权模板 (JWT/Session)
  api       API endpoint 模板
  ui        UI 页面模板
  database  数据库迁移模板
```

---

## 功能 5：需求里程碑

**命令**: `ib milestone create <name>` / `ib milestone add <milestone> <req-id>` / `ib milestone list`

**改动文件**:
- `src/models/types.ts` — 增加 `Milestone` 类型，`ProjectData` 增加 `milestones?: Milestone[]`
- `src/services/milestone.ts` — 新建，里程碑 CRUD 操作
- `src/commands/milestone.ts` — 新建，里程碑命令
- `bin/ib.ts` — 增加 `milestone` 命令组
- `src/services/generator.ts` — 需求输出中包含里程碑信息
- `tests/milestone.test.ts` — 新建，里程碑测试

**YAML 存储格式**:
```yaml
milestones:
  - name: "v1.0.0 MVP"
    requirements: [REQ-001, REQ-002, REQ-003]
    status: "done"
    due_date: "2026-02-01"
  - name: "v1.1.0 认证"
    requirements: [REQ-004, REQ-005, REQ-006]
    status: "implementing"
    due_date: "2026-02-15"
```

**里程碑列表输出**:
```
项目里程碑:

  v1.0.0 MVP  [██████████] 100% (3/3)  ✓ 2026-02-01 完成
  v1.1.0 认证 [███████░░░]  70% (2/3)  📅 2026-02-15 截止
  v1.2.0 报表 [░░░░░░░░░░░]   0% (0/4)  📅 2026-03-01 计划
```

**CLAUDE.md 输出**:
```markdown
## 里程碑: v1.1.0 认证

### REQ-004 [implementing] JWT 认证
...

### REQ-005 [pending] 刷新 token
...
```

---

## 实施顺序

每个功能独立提交，按 1→5 顺序实现。每个功能完成后运行 `npm test` 确保不破坏现有测试。

版本号更新为 1.2.0。

---

## 测试覆盖

- **功能 1**: 搜索功能测试（标题、描述、notes、ID）
- **功能 2**: 标签增删查测试
- **功能 3**: 导出格式测试（Markdown、JSON）
- **功能 4**: 模板加载和应用测试
- **功能 5**: 里程碑 CRUD 和进度计算测试

预计新增测试: 25+ 个，总测试数达到 78+ 个。
