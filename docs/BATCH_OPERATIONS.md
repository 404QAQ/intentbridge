# IntentBridge 批量操作功能

## 概述

批量操作功能允许您一次性对多个需求执行操作，大幅提升工作效率。

**版本**: v2.4.0+

---

## 功能列表

### 1. `ib batch update` - 批量更新

批量更新需求的状态、优先级、标题。

```bash
# 基本用法
ib batch update REQ-{001..010} --status done

# 使用模式匹配
ib batch update "REQ-*" --status active

# 使用过滤器
ib batch update all --status done --status-filter implementing

# 交互式选择
ib batch update all --interactive

# 预览模式
ib batch update REQ-{001..005} --status done --dry-run

# 更新多个字段
ib batch update REQ-{001..010} --status done --priority high
```

**选项**:
- `-s, --status <status>` - 更新状态 (draft/active/implementing/done)
- `-p, --priority <priority>` - 更新优先级 (high/medium/low)
- `-t, --title <title>` - 更新标题
- `--dry-run` - 预览模式，不实际执行
- `-i, --interactive` - 交互式选择需求
- `--status-filter <status>` - 按状态过滤
- `--priority-filter <priority>` - 按优先级过滤
- `--tag-filter <tag>` - 按标签过滤

### 2. `ib batch tag` - 批量标签

批量为需求添加或删除标签。

```bash
# 添加标签
ib batch tag REQ-{001..010} backend api

# 删除标签
ib batch tag REQ-{001..010} backend --remove

# 按过滤器批量添加
ib batch tag all security --status-filter active

# 交互式选择
ib batch tag all frontend --interactive
```

**选项**:
- `--remove` - 删除标签（默认为添加）
- `--dry-run` - 预览模式
- `-i, --interactive` - 交互式选择
- `--status-filter` - 按状态过滤
- `--priority-filter` - 按优先级过滤
- `--tag-filter` - 按标签过滤

### 3. `ib batch done` - 批量完成

批量将需求标记为完成（done 状态）。

```bash
# 标记多个需求为完成
ib batch done REQ-{001..010}

# 标记所有 active 状态的需求
ib batch done all --status-filter active

# 交互式选择
ib batch done all --interactive
```

**选项**:
- `--dry-run` - 预览模式
- `-i, --interactive` - 交互式选择
- `--status-filter` - 按状态过滤（默认：active）
- `--priority-filter` - 按优先级过滤
- `--tag-filter` - 按标签过滤

### 4. `ib batch map` - 批量映射文件

批量为需求映射文件。

```bash
# 批量映射文件到多个需求
ib batch map REQ-{001..005} src/auth/login.ts src/auth/register.ts

# 使用通配符映射
ib batch map REQ-testing src/**/*.test.ts

# 按过滤器映射
ib batch map all src/backend/**/*.ts --tag-filter backend
```

**选项**:
- `--dry-run` - 预览模式
- `-i, --interactive` - 交互式选择
- `--status-filter` - 按状态过滤
- `--priority-filter` - 按优先级过滤
- `--tag-filter` - 按标签过滤

---

## ID 模式匹配

批量操作支持多种 ID 模式：

### 1. 范围模式
```bash
ib batch update REQ-{001..010} --status done
# 操作: REQ-001, REQ-002, ..., REQ-010

ib batch update REQ-{1..5} --status done
# 操作: REQ-1, REQ-2, REQ-3, REQ-4, REQ-5
```

### 2. 通配符模式
```bash
ib batch update "REQ-*" --status done
# 操作: 所有以 REQ- 开头的需求

ib batch update "REQ-AUTH-*" --status done
# 操作: 所有以 REQ-AUTH- 开头的需求
```

### 3. 关键字 `all`
```bash
ib batch update all --status done
# 操作: 所有需求（通常需要配合过滤器）
```

---

## 过滤器

使用过滤器精确控制批量操作的范围：

### 按状态过滤
```bash
ib batch done all --status-filter active
# 仅将 active 状态的需求标记为 done
```

### 按优先级过滤
```bash
ib batch update all --priority high --priority-filter medium
# 将所有 medium 优先级的需求更新为 high
```

### 按标签过滤
```bash
ib batch done all --tag-filter backend
# 仅完成带 backend 标签的需求
```

### 组合过滤
```bash
ib batch done all --status-filter implementing --priority-filter high
# 完成所有 implementing 状态且 high 优先级的需求
```

---

## 交互式选择

使用 `--interactive` 选项手动选择需求：

```bash
ib batch update all --interactive
```

将显示交互式列表：
```
? Select requirements: (Press <space> to select)
❯◉ REQ-001 - User Authentication [active]
 ◯ REQ-002 - Email Verification [implementing]
 ◯ REQ-003 - Dashboard Analytics [draft]
 ◉ REQ-004 - API Rate Limiting [done]
 ◯ REQ-005 - Email Notification [active]
```

---

## 预览模式

使用 `--dry-run` 预览将要执行的操作，不实际修改数据：

```bash
ib batch update REQ-{001..010} --status done --dry-run
```

输出：
```
📋 Found 10 requirement(s) to update:

  - REQ-001
  - REQ-002
  - REQ-003
  - REQ-004
  - REQ-005
  - REQ-006
  - REQ-007
  - REQ-008
  - REQ-009
  - REQ-010

🔍 Dry run mode - no changes will be made.

Updates to apply:
  - Status: done
```

---

## 实战示例

### 场景 1: Sprint 结束，批量完成需求

```bash
# 查看所有 implementing 状态的需求
ib req list --status implementing

# 预览将要完成的
ib batch done all --status-filter implementing --dry-run

# 确认后执行
ib batch done all --status-filter implementing
```

### 场景 2: 批量重新分类

```bash
# 将所有未标记的需求添加 backend 标签
ib batch tag all backend --tag-filter ""

# 将所有 security 相关的需求设为高优先级
ib batch update all --priority high --tag-filter security
```

### 场景 3: 批量文件映射

```bash
# 将所有测试文件映射到测试需求
ib batch map REQ-testing tests/**/*.test.ts

# 将后端代码映射到相关需求
ib batch map all src/backend/**/*.ts --tag-filter backend
```

### 场景 4: 项目迁移

```bash
# 批量更新旧需求的 ID 格式
ib batch update "OLD-*" --status archived

# 批量添加迁移标签
ib batch tag all migrated-from-v1
```

---

## 性能建议

### 批量大小
- 建议每次操作不超过 100 个需求
- 大批量操作可分批执行

### 安全性
1. **始终先预览**: 使用 `--dry-run` 确认操作
2. **使用版本控制**: 操作前创建快照
   ```bash
   ib req snapshot REQ-001 pre-batch-update
   ```
3. **精确过滤**: 使用过滤器缩小范围

---

## 错误处理

批量操作会继续执行即使部分失败：

```
✅ Updated: REQ-001
✅ Updated: REQ-002
❌ Failed to update REQ-003: Requirement not found
✅ Updated: REQ-004

✨ Batch update complete!
   Success: 3
   Failed: 1
```

---

## 版本历史

- **v2.4.0** (2024-02-14): 初始实现
  - 批量更新 (`batch update`)
  - 批量标签 (`batch tag`)
  - 批量完成 (`batch done`)
  - 批量映射 (`batch map`)
  - ID 模式匹配
  - 交互式选择
  - 预览模式

---

## 反馈

如有建议或发现问题，请提交 Issue：
https://github.com/404QAQ/intentbridge/issues

---

**文档版本**: 1.0
**最后更新**: 2024-02-14
