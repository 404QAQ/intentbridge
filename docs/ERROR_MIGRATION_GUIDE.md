# 错误系统迁移指南

本指南帮助你将现有代码从 `console.error` 和简单错误处理迁移到 IntentBridge 统一错误系统。

---

## 📖 为什么要迁移？

### 旧方式的问题

```typescript
// ❌ 旧方式：console.error
if (!fs.existsSync(configPath)) {
  console.error('配置文件不存在');
  process.exit(1);
}

// ❌ 旧方式：简单 throw
if (!requirement) {
  throw new Error('需求不存在');
}

// ❌ 旧方式：不友好的错误
catch (error) {
  console.error('发生错误:', error);
  process.exit(1);
}
```

**问题**:
- 错误消息不清晰
- 没有解决方案提示
- 没有错误代码
- 不支持多语言
- 没有上下文信息
- 难以调试

### 新方式的优势

```typescript
// ✅ 新方式：IntentBridgeError
import { throwError, ErrorCode } from '../errors/index.js';

if (!fs.existsSync(configPath)) {
  throwError(ErrorCode.E3002, {
    configPath,
    operation: 'load',
  });
}

// ✅ 输出示例：
// ❌ 配置文件不存在
// ──────────────────────────────────────────────────
//
// 错误代码: E3002
// 严重程度: ⚠️ MEDIUM
//
// 错误详情:
//   项目配置文件不存在
//
// 解决方案:
//   1. 初始化项目: ib init
//   2. 检查是否在项目目录中
//   3. 检查 .intentbridge 目录
//
// 文档链接: https://intentbridge.dev/docs/errors/E3002
```

**优势**:
- ✅ 清晰的错误消息
- ✅ 详细的解决方案
- ✅ 错误代码便于查找
- ✅ 支持多语言
- ✅ 丰富的上下文
- ✅ 易于调试

---

## 🚀 迁移步骤

### 步骤 1: 导入错误模块

在每个文件的开头添加：

```typescript
import {
  IntentBridgeError,
  createError,
  throwError,
  handleError,
  ErrorCode,
} from '../errors/index.js';
```

### 步骤 2: 识别错误场景

浏览代码，找到所有错误处理的地方：

```bash
# 查找 console.error
grep -r "console.error" src/

# 查找 process.exit
grep -r "process.exit" src/

# 查找 throw new Error
grep -r "throw new Error" src/
```

### 步骤 3: 选择合适的错误代码

参考 `docs/ERROR_CODES.md` 或 `src/errors/codes.ts`，选择合适的错误代码：

| 场景 | 错误代码 | 说明 |
|------|---------|------|
| 文件不存在 | E2031 | 文件相关错误 |
| 配置错误 | E3001-E3004 | 项目配置错误 |
| 需求不存在 | E2011 | 需求相关错误 |
| 端口占用 | E3021 | 端口管理错误 |
| AI 错误 | E4001-E4014 | AI 和集成错误 |

### 步骤 4: 替换错误处理

#### 场景 1: console.error + process.exit

**旧代码**:
```typescript
if (!fs.existsSync(projectPath)) {
  console.error('❌ 项目不存在');
  console.error('请先运行 ib init 初始化项目');
  process.exit(1);
}
```

**新代码**:
```typescript
if (!fs.existsSync(projectPath)) {
  throwError(ErrorCode.E2023, {
    projectPath,
    operation: 'load',
  });
}
```

#### 场景 2: throw new Error

**旧代码**:
```typescript
if (!requirement) {
  throw new Error(`需求 ${reqId} 不存在`);
}
```

**新代码**:
```typescript
if (!requirement) {
  throwError(ErrorCode.E2011, {
    requirementId: reqId,
    availableRequirements: requirements.map(r => r.id),
  });
}
```

#### 场景 3: try-catch 错误处理

**旧代码**:
```typescript
try {
  const config = loadConfig();
} catch (error) {
  console.error('加载配置失败:', error.message);
  process.exit(1);
}
```

**新代码**:
```typescript
try {
  const config = loadConfig();
} catch (error) {
  if (error instanceof IntentBridgeError) {
    handleError(error);
  } else {
    // 包装未知错误
    const wrappedError = createError(ErrorCode.E3001, {
      originalError: error.message,
      stack: error.stack,
    });
    handleError(wrappedError);
  }
}
```

#### 场景 4: 异步函数错误

**旧代码**:
```typescript
async function fetchRequirement(reqId: string) {
  try {
    const req = await api.get(`/requirements/${reqId}`);
    return req;
  } catch (error) {
    console.error('获取需求失败:', error.message);
    throw error;
  }
}
```

**新代码**:
```typescript
async function fetchRequirement(reqId: string) {
  try {
    const req = await api.get(`/requirements/${reqId}`);
    return req;
  } catch (error) {
    if (error.response?.status === 404) {
      throwError(ErrorCode.E2011, {
        requirementId: reqId,
      });
    } else if (error.code === 'ECONNREFUSED') {
      throwError(ErrorCode.E5014, {
        service: 'API Server',
        url: api.defaults.baseURL,
      });
    } else {
      throwError(ErrorCode.E5011, {
        operation: 'fetchRequirement',
        originalError: error.message,
      });
    }
  }
}
```

---

## 📋 迁移清单

### 文件级迁移清单

对每个文件：

- [ ] 导入错误模块
- [ ] 识别所有错误处理场景
- [ ] 替换 `console.error` 为 `throwError`
- [ ] 替换 `throw new Error` 为 `throwError`
- [ ] 更新 try-catch 块使用 `handleError`
- [ ] 添加错误上下文
- [ ] 测试错误场景

### 优先级

**P0 (立即迁移)**:
- CLI 入口文件 (`src/index.ts`)
- 核心命令 (`src/commands/`)
- 项目管理 (`src/services/project-manager.ts`)
- 需求管理 (`src/services/requirement-manager.ts`)

**P1 (重要)**:
- AI 集成 (`src/services/ai-*.ts`)
- MCP 服务器 (`src/services/mcp-*.ts`)
- Web UI (`web/`)

**P2 (次要)**:
- 工具函数 (`src/utils/`)
- 辅助模块

---

## 🎯 迁移示例

### 示例 1: 项目初始化

**旧代码** (`src/commands/init.ts`):

```typescript
export async function initCommand() {
  const projectPath = process.cwd();
  const intentbridgePath = join(projectPath, '.intentbridge');

  if (fs.existsSync(intentbridgePath)) {
    console.error('❌ 项目已存在');
    console.error('当前目录已经是一个 IntentBridge 项目');
    process.exit(1);
  }

  try {
    fs.mkdirSync(intentbridgePath, { recursive: true });
  } catch (error) {
    console.error('❌ 创建目录失败:', error.message);
    process.exit(1);
  }

  console.log('✅ 项目初始化成功');
}
```

**新代码**:

```typescript
import { throwError, handleError, ErrorCode } from '../errors/index.js';

export async function initCommand() {
  const projectPath = process.cwd();
  const intentbridgePath = join(projectPath, '.intentbridge');

  // 检查项目是否已存在
  if (fs.existsSync(intentbridgePath)) {
    throwError(ErrorCode.E1011, {
      projectPath,
      intentbridgePath,
    });
  }

  // 创建目录
  try {
    fs.mkdirSync(intentbridgePath, { recursive: true });
  } catch (error) {
    throwError(ErrorCode.E1012, {
      directory: intentbridgePath,
      operation: 'create',
      originalError: error.message,
    });
  }

  console.log('✅ 项目初始化成功');
}
```

### 示例 2: 需求管理

**旧代码** (`src/commands/req.ts`):

```typescript
export async function getRequirement(reqId: string) {
  const requirements = loadRequirements();
  const requirement = requirements.find(r => r.id === reqId);

  if (!requirement) {
    console.error(`❌ 需求 ${reqId} 不存在`);
    console.error('请检查需求 ID 是否正确');
    process.exit(1);
  }

  return requirement;
}
```

**新代码**:

```typescript
import { throwError, ErrorCode } from '../errors/index.js';

export async function getRequirement(reqId: string) {
  const requirements = loadRequirements();
  const requirement = requirements.find(r => r.id === reqId);

  if (!requirement) {
    throwError(ErrorCode.E2011, {
      requirementId: reqId,
      availableRequirements: requirements.map(r => r.id),
      totalRequirements: requirements.length,
    });
  }

  return requirement;
}
```

### 示例 3: AI 服务调用

**旧代码** (`src/services/ai-service.ts`):

```typescript
export async function callAI(prompt: string) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ 未配置 OpenAI API Key');
    console.error('请运行 ib ai config 配置 API Key');
    process.exit(1);
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0].message.content;
  } catch (error) {
    if (error.status === 401) {
      console.error('❌ API Key 无效');
      process.exit(1);
    } else if (error.status === 429) {
      console.error('❌ API 配额超限');
      process.exit(1);
    } else {
      console.error('❌ AI 调用失败:', error.message);
      process.exit(1);
    }
  }
}
```

**新代码**:

```typescript
import { throwError, ErrorCode } from '../errors/index.js';

export async function callAI(prompt: string) {
  // 检查 API Key
  if (!process.env.OPENAI_API_KEY) {
    throwError(ErrorCode.E4001, {
      provider: 'openai',
      operation: 'callAI',
    });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0].message.content;
  } catch (error) {
    // 根据错误类型选择错误代码
    if (error.status === 401) {
      throwError(ErrorCode.E4002, {
        provider: 'openai',
        statusCode: error.status,
      });
    } else if (error.status === 429) {
      throwError(ErrorCode.E4014, {
        provider: 'openai',
        quota: 'exceeded',
      });
    } else if (error.code === 'ETIMEDOUT') {
      throwError(ErrorCode.E4011, {
        provider: 'openai',
        timeout: '30s',
      });
    } else {
      throwError(ErrorCode.E4012, {
        provider: 'openai',
        originalError: error.message,
      });
    }
  }
}
```

---

## ⚠️ 注意事项

### 1. 不要过度使用

**❌ 错误示例**:
```typescript
// 简单的验证不需要错误系统
if (!name || name.trim() === '') {
  throwError(ErrorCode.E2002, { field: 'name' });
}
```

**✅ 正确示例**:
```typescript
// 简单验证使用普通逻辑
if (!name || name.trim() === '') {
  console.log('⚠️  名称不能为空');
  return;
}

// 严重错误使用错误系统
if (!fs.existsSync(configPath)) {
  throwError(ErrorCode.E3002, { configPath });
}
```

### 2. 提供足够的上下文

**❌ 不足的上下文**:
```typescript
throwError(ErrorCode.E2011);
```

**✅ 充足的上下文**:
```typescript
throwError(ErrorCode.E2011, {
  requirementId: 'REQ-999',
  availableRequirements: ['REQ-001', 'REQ-002'],
  totalRequirements: 2,
  operation: 'fetch',
});
```

### 3. 错误链处理

当捕获到底层错误时，保留原始错误信息：

```typescript
try {
  // 底层操作
  const data = JSON.parse(content);
} catch (error) {
  throwError(ErrorCode.E3003, {
    filePath,
    originalError: error.message,
    stack: error.stack,
  });
}
```

### 4. 调试模式

在开发时启用调试模式查看更多上下文：

```bash
INTENTBRIDGE_DEBUG=true ib req list
```

---

## 📊 迁移进度追踪

使用此表格追踪迁移进度：

| 模块 | 文件数 | 已迁移 | 进度 | 优先级 |
|------|--------|--------|------|--------|
| CLI 入口 | 1 | 0 | 0% | P0 |
| 核心命令 | 10 | 0 | 0% | P0 |
| 项目管理 | 5 | 0 | 0% | P0 |
| 需求管理 | 5 | 0 | 0% | P0 |
| AI 服务 | 3 | 0 | 0% | P1 |
| MCP 服务 | 2 | 0 | 0% | P1 |
| Web UI | 10 | 0 | 0% | P1 |
| 工具函数 | 8 | 0 | 0% | P2 |

---

## 🎓 最佳实践总结

1. **始终提供上下文**: 让错误更容易调试
2. **选择正确的错误代码**: 参考错误代码文档
3. **使用类型守卫**: `error instanceof IntentBridgeError`
4. **保留错误链**: 记录原始错误信息
5. **测试错误场景**: 确保错误消息正确显示
6. **更新文档**: 新增错误代码时更新文档

---

## 📚 相关资源

- **错误代码参考**: [ERROR_CODES.md](./ERROR_CODES.md)
- **使用示例**: [src/examples/error-usage.ts](../src/examples/error-usage.ts)
- **错误系统源码**: [src/errors/](../src/errors/)

---

**迁移完成后**，IntentBridge 将拥有统一、友好的错误处理系统！
