# IntentBridge v1.1.0 实现计划

按优先级实现 7 个功能，所有改动基于现有架构扩展。

---

## 功能 1：上下文裁剪生成

**命令**: `ib gen --focus REQ-003` / `ib gen --focus REQ-003,REQ-005`

**改动文件**:
- `src/models/types.ts` — 无改动
- `src/services/generator.ts` — `generate()` 和 `generateBlock()` 增加 `focusIds?: string[]` 参数，过滤只输出指定需求及其关联文件映射
- `src/commands/gen.ts` — 接收 `--focus` 选项
- `bin/ib.ts` — `gen` 命令增加 `--focus` option
- `tests/generator.test.ts` — 增加 focus 过滤测试

**逻辑**:
- 有 `--focus` 时：只输出 focus 列表中的需求（无论状态），代码映射索引也只包含这些需求的文件
- 无 `--focus` 时：行为不变
- focus 的需求 ID 不存在时，警告并跳过

---

## 功能 2：需求决策日志

**命令**: `ib req note <id> <message>` / `ib req notes <id>`

**改动文件**:
- `src/models/types.ts` — `Requirement` 增加 `notes?: Array<{ date: string; content: string }>`
- `src/services/store.ts` — 新增 `addNote(id, content)` 函数
- `src/commands/req.ts` — 新增 `reqNoteCommand` 和 `reqNotesCommand`
- `bin/ib.ts` — `req` 子命令增加 `note` 和 `notes`
- `src/services/generator.ts` — `generateBlock` 中，有 notes 的需求输出决策记录
- `tests/store.test.ts` — 增加 note 相关测试

**YAML 存储格式**:
```yaml
- id: REQ-003
  notes:
    - date: "2026-02-09"
      content: "认证方案确定用JWT，原因是需要跨域"
```

**CLAUDE.md 输出**:
```markdown
### REQ-003 [implementing] 用户认证
描述...
决策记录:
- [2026-02-09] 认证方案确定用JWT，原因是需要跨域
```

---

## 功能 3：需求验收条件

**命令**: `ib req add` 交互时增加验收条件输入 / `ib req accept <id> <index>`

**改动文件**:
- `src/models/types.ts` — `Requirement` 增加 `acceptance?: Array<{ criterion: string; done: boolean }>`
- `src/services/store.ts` — `addRequirement` 支持 acceptance 参数，新增 `acceptCriterion(id, index)` 函数
- `src/commands/req.ts` — `reqAddCommand` 交互增加验收条件输入（逐条，空行结束），新增 `reqAcceptCommand`
- `bin/ib.ts` — `req` 子命令增加 `accept`
- `src/services/generator.ts` — 需求输出中包含验收条件及完成状态
- `tests/store.test.ts` — 增加 acceptance 相关测试

**CLAUDE.md 输出**:
```markdown
### REQ-003 [implementing] 用户认证
描述...
验收条件:
- [x] JWT token 签发和验证
- [ ] 刷新 token 机制
- [ ] 登录失败锁定
```

---

## 功能 4：需求依赖关系

**命令**: `ib req dep <id> <depends-on-id>` / `ib req deps <id>`

**改动文件**:
- `src/models/types.ts` — `Requirement` 增加 `depends_on?: string[]`
- `src/services/store.ts` — 新增 `addDependency(id, depId)` 和 `removeDependency(id, depId)`，含循环依赖检测
- `src/commands/req.ts` — 新增 `reqDepCommand` 和 `reqDepsCommand`
- `bin/ib.ts` — `req` 子命令增加 `dep` 和 `deps`
- `src/services/generator.ts` — focus 模式下自动包含依赖链上的需求；需求输出中标注依赖关系
- `src/commands/status.ts` — 展示依赖关系
- `tests/store.test.ts` — 依赖增删和循环检测测试

**循环依赖检测**: A depends B, B depends C, 再加 C depends A 时报错。

**CLAUDE.md 输出**:
```markdown
### REQ-003 [implementing] 用户认证
依赖: REQ-001 (数据模型)
描述...
```

**focus 联动**: `ib gen --focus REQ-003` 时，如果 REQ-003 依赖 REQ-001，自动包含 REQ-001 的上下文。

---

## 功能 5：反向文件查询

**命令**: `ib map which <file>`

**改动文件**:
- `src/commands/map.ts` — 新增 `mapWhichCommand`
- `bin/ib.ts` — `map` 子命令增加 `which`
- `tests/cli.test.ts` — 增加 which 命令测试

**逻辑**: 遍历所有需求的 files 数组，找到包含该文件的需求，输出需求 ID、标题、状态。支持模糊匹配（文件路径包含输入字符串即匹配）。

---

## 功能 6：git diff 映射同步

**命令**: `ib sync`

**改动文件**:
- `src/services/sync.ts` — 新建，调用 `git diff --name-status HEAD` 和 `git status --porcelain` 获取变更文件列表，与现有映射对比
- `src/commands/sync.ts` — 新建，展示变更检测结果（新增/删除/重命名的文件），交互确认更新
- `bin/ib.ts` — 增加 `sync` 命令
- `tests/` — sync 相关测试

**检测逻辑**:
1. 获取所有已映射文件列表
2. 检查哪些已映射文件已被删除（git 中不存在）
3. 检查 git 中重命名的文件（R status）
4. 提示用户确认：删除失效映射 / 更新重命名映射

---

## 功能 7：上下文体积感知

**改动文件**:
- `src/utils/tokens.ts` — 新建，简单 token 估算（中文字符 ×1.5，英文单词 ×1.3，粗略但够用）
- `src/commands/gen.ts` — 生成后输出估算 token 数，超过阈值（默认 4000）时警告
- `src/commands/status.ts` — 展示当前 CLAUDE.md 体积
- `tests/` — token 估算测试

---

## 实施顺序

每个功能独立提交，按 1→7 顺序实现。每个功能完成后运行 `npm test` 确保不破坏现有测试。

版本号更新为 1.1.0。
