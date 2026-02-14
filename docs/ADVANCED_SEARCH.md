# IntentBridge 高级搜索功能

## 快速开始

```bash
# 简单搜索
ib req asearch "auth"

# 按状态和优先级过滤
ib req asearch "status:active priority:high"

# 按标签过滤
ib req asearch "tag:backend,api"

# 组合条件
ib req asearch "auth status:active priority:high tag:backend"

# ID 模式匹配
ib req asearch "id:REQ-00*"

# 模糊匹配标题
ib req asearch "title:~auth"

# 正则表达式搜索
ib req asearch "auth.*login" --regex

# 模糊匹配
ib req asearch "usr lg" --fuzzy

# 排序和限制结果
ib req asearch "status:active" --sort-by priority --sort-order desc --limit 10
```

## 查询语法

### 过滤器

- `status:<status>` - 按状态过滤 (draft/active/implementing/done)
- `priority:<priority>` - 按优先级过滤 (high/medium/low)
- `tag:<tag>` - 按标签过滤
- `id:<pattern>` - ID 模式匹配
- `title:<pattern>` - 标题模式匹配
- `title:~<text>` - 标题模糊匹配
- `desc:<pattern>` - 描述模式匹配
- `created:><date>` - 创建日期之后
- `created:<<date>` - 创建日期之前

### 组合使用

用空格分隔多个条件（AND 逻辑）：

```bash
ib req asearch "auth status:active priority:high tag:backend"
```

### 通配符

- `*` 匹配任意字符
- `id:REQ-00*` 匹配 REQ-001, REQ-002, ...

### 选项

- `--regex` - 启用正则表达式
- `--fuzzy` - 启用模糊匹配
- `-s, --sort-by <field>` - 排序字段
- `-o, --sort-order <order>` - 排序方向 (asc/desc)
- `-l, --limit <number>` - 限制结果数量

## 示例

```bash
# 查找所有活跃的高优先级后端需求
ib req asearch "status:active priority:high tag:backend"

# 查找标题包含 auth 的需求（模糊）
ib req asearch "title:~auth" --fuzzy

# 查找 REQ-00X 格式的需求
ib req asearch "id:REQ-00*"

# 查找 2024 年 1 月后创建的需求
ib req asearch "created:>2024-01-01"

# 正则表达式搜索
ib req asearch "user.*(login|auth)" --regex

# 排序输出
ib req asearch "status:active" --sort-by priority --sort-order desc
```

**版本**: v2.4.0
**预期收益**: 提升 40% 查找效率
