# 📚 IntentBridge 实战教程 - 个人博客系统

**难度**: ⭐⭐☆☆☆ (入门级)
**时间**: 30 分钟
**目标**: 从零开始构建一个完整的个人博客系统

---

## 🎯 学习目标

通过这个教程，你将学会：

- ✅ 使用 IntentBridge 管理博客系统需求
- ✅ 从需求到实现的完整流程
- ✅ AI 辅助需求理解和验证
- ✅ 多项目管理技巧

---

## 📋 项目概述

### 个人博客系统功能

**核心功能**:
- 📝 文章管理（发布、编辑、删除）
- 💬 评论系统
- 🏷️ 标签分类
- 🔍 搜索功能
- 📊 访问统计

**技术栈**:
- 前端: Vue 3 + TypeScript
- 后端: Node.js + Express
- 数据库: SQLite
- 部署: Docker

---

## ⏱️ 第 5 分钟: 初始化项目

### 步骤 1: 创建项目目录

```bash
mkdir personal-blog
cd personal-blog
```

### 步骤 2: 初始化 IntentBridge

```bash
ib init
```

**输出**:
```
✅ 创建 .intentbridge/ 目录
✅ 生成 project.yml
✅ 生成 requirements.yml
✅ 项目初始化完成！
```

### 步骤 3: 配置项目信息

```bash
ib "配置项目信息：个人博客系统，使用 Vue3 + Express + SQLite"
```

---

## ⏱️ 第 10 分钟: 添加核心需求

### 需求 1: 文章管理

```bash
# 使用自然语言
ib "添加文章管理功能，支持发布、编辑、删除文章，包括标题、内容、标签、发布时间"
```

**IntentBridge 输出**:
```
✅ 创建需求: REQ-001
标题: 文章管理功能
优先级: medium
标签: backend, core
```

### 需求 2: 评论系统

```bash
ib "添加评论系统，用户可以对文章发表评论，支持回复和点赞"
```

### 需求 3: 标签分类

```bash
ib "添加标签功能，文章可以打多个标签，支持按标签筛选"
```

### 需求 4: 搜索功能

```bash
ib "添加全文搜索，支持按标题、内容、标签搜索文章"
```

### 查看所有需求

```bash
ib ls
```

**输出**:
```
需求列表 (共 4 个)
━━━━━━━━━━━━━━━━━━━━━━

REQ-001  [active]  medium  文章管理功能
REQ-002  [active]  medium  评论系统
REQ-003  [active]  low     标签分类
REQ-004  [active]  medium  搜索功能
```

---

## ⏱️ 第 15 分钟: AI 理解需求

### 让 AI 理解每个需求

```bash
# 理解文章管理需求
ib understand REQ-001
```

**AI 输出示例**:
```
🤖 AI 需求理解: REQ-001 - 文章管理功能

## 功能分析

### 核心功能点
1. 文章发布
   - 输入: 标题、内容、标签、作者
   - 验证: 标题长度 (5-100字)、内容长度 (> 50字)
   - 输出: 文章 ID、发布时间

2. 文章编辑
   - 权限: 仅作者可编辑
   - 记录: 编辑历史

3. 文章删除
   - 权限: 仅作者可删除
   - 软删除: 保留数据 30 天

### 技术要求
- 数据库表: articles
- API 端点:
  - POST /api/articles
  - PUT /api/articles/:id
  - DELETE /api/articles/:id
  - GET /api/articles/:id

### 验收标准
- ✅ 用户可以发布文章
- ✅ 作者可以编辑自己的文章
- ✅ 作者可以删除自己的文章
- ✅ 文章包含标题、内容、标签、时间戳

### 建议实现步骤
1. 设计数据库模型
2. 实现 API 端点
3. 创建前端表单
4. 添加权限验证
```

### 理解其他需求

```bash
ib understand REQ-002  # 评论系统
ib understand REQ-003  # 标签分类
ib understand REQ-004  # 搜索功能
```

---

## ⏱️ 第 20 分钟: 实现第一个需求

### 开始实现文章管理

```bash
# 更新需求状态
ib done REQ-001

# 或使用完整命令
ib req update REQ-001 --status implementing
```

### 创建项目结构

```bash
# 创建后端目录
mkdir -p backend/{routes,models,controllers}

# 创建前端目录
mkdir -p frontend/{components,pages,api}
```

### 添加文件映射

```bash
# 映射实现文件到需求
ib map add REQ-001 \
  backend/models/Article.ts \
  backend/routes/articles.ts \
  backend/controllers/articleController.ts \
  frontend/pages/ArticleEditor.vue \
  frontend/api/articles.ts
```

### 查看映射关系

```bash
ib map list
```

**输出**:
```
文件映射列表
━━━━━━━━━━━━━━━━

REQ-001:
  backend/models/Article.ts
  backend/routes/articles.ts
  backend/controllers/articleController.ts
  frontend/pages/ArticleEditor.vue
  frontend/api/articles.ts
```

---

## ⏱️ 第 25 分钟: 验证实现

### AI 验证需求实现

```bash
ib validate REQ-001
```

**AI 输出示例**:
```
🔍 AI 验证: REQ-001 - 文章管理功能

## 验证结果

### 功能完整性: ✅ 95%
- ✅ 文章发布功能已实现
- ✅ 文章编辑功能已实现
- ✅ 文章删除功能已实现
- ⚠️  软删除未实现（建议添加）

### 代码质量: ✅ 90%
- ✅ 代码结构清晰
- ✅ 错误处理完善
- ⚠️  缺少单元测试

### 验收标准: ✅ 90%
- ✅ 用户可以发布文章
- ✅ 作者可以编辑文章
- ✅ 作者可以删除文章
- ✅ 包含标题、内容、标签、时间戳

## 改进建议

1. 添加软删除功能
2. 补充单元测试
3. 添加缓存优化

总体评分: 92/100 ✅ 通过
```

### 根据建议改进

```bash
# 添加软删除需求
ib "为文章添加软删除功能，删除后保留 30 天"

# 更新文件映射
ib map add REQ-001 backend/utils/softDelete.ts
```

---

## ⏱️ 第 30 分钟: 项目总结

### 查看项目状态

```bash
ib status
```

**输出**:
```
项目状态: 个人博客系统
━━━━━━━━━━━━━━━━━━━━━━

需求总数: 5
  ✅ 已完成: 1 (REQ-001)
  🔄 进行中: 0
  ⏳ 待开发: 4

文件映射: 6 个文件
  后端: 4 个
  前端: 2 个

最近活动:
  2026-02-24 10:30  验证 REQ-001 通过 (92分)
  2026-02-24 10:25  映射文件到 REQ-001
  2026-02-24 10:15  AI 理解 REQ-001
```

### 导出项目报告

```bash
ib req export --format markdown
```

---

## 📊 学习总结

### 你学会了

1. **项目管理** ✅
   - 初始化 IntentBridge 项目
   - 添加和管理需求
   - 查看项目状态

2. **需求管理** ✅
   - 自然语言添加需求
   - AI 理解需求
   - 验证需求实现

3. **开发流程** ✅
   - 文件映射
   - 需求验证
   - 状态跟踪

4. **AI 辅助** ✅
   - AI 理解功能
   - AI 验证实现
   - AI 给出建议

### 下一步

- 📚 **电商后台教程** - 学习复杂项目管理
- 📚 **微服务架构教程** - 学习多项目协调
- 📚 **错误系统教程** - 深入错误处理

---

## 🎯 实践练习

### 练习 1: 完成其他需求

尝试完成评论系统、标签分类、搜索功能：

```bash
# 实现评论系统
ib done REQ-002
# ... 编写代码 ...
ib validate REQ-002

# 实现标签分类
ib done REQ-003
# ... 编写代码 ...
ib validate REQ-003
```

### 练习 2: 添加新需求

添加访问统计功能：

```bash
ib "添加访问统计，记录文章浏览次数、访客 IP、访问时间"
```

### 练习 3: 使用 Web UI

```bash
ib web
```

在 Web UI 中：
- 查看所有需求
- 查看需求关系图
- 导出项目报告

---

## 📚 相关资源

- **快速入门**: [QUICK_START_5MIN.md](QUICK_START_5MIN.md)
- **故障排查**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **命令参考**: [README.md](../README.md)

---

**教程完成！** 🎉

你已经学会了使用 IntentBridge 管理完整项目的流程。

**下一个教程**: [电商后台管理系统](TUTORIAL_02_ECOMMERCE.md)
