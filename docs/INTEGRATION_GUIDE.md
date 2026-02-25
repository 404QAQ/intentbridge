# IntentBridge 系统集成指南

本指南帮助你将错误系统、性能监控和缓存集成到 IntentBridge 中。

---

## 📋 集成优先级

### P0 - 立即集成（核心功能）
1. **错误系统** - 提升用户体验
   - `src/commands/init.ts` - 项目初始化
   - `src/commands/req.ts` - 需求管理
   - `src/commands/project.ts` - 项目管理
   - `src/services/store.ts` - 数据存储

### P1 - 重要集成（用户体验）
2. **性能监控** - 识别性能瓶颈
   - 所有 AI 相关命令
   - 文件加载操作
   - 复杂计算操作

### P2 - 优化集成（性能提升）
3. **缓存系统** - 提升响应速度
   - 配置文件加载
   - 需求列表查询
   - AI 结果缓存

---

## 🚀 快速开始

### 步骤 1: 迁移单个命令（5 分钟）

选择一个简单的命令开始，例如 `init.ts`：

```typescript
// 1. 添加导入
import { throwError, handleError, ErrorCode } from '../errors/index.js';
import { measurePerformanceAsync } from '../utils/performance.js';

// 2. 包装命令函数
export async function initCommand(): Promise<void> {
  await measurePerformanceAsync('init 命令', async () => {
    try {
      // 3. 替换错误处理
      if (isInitialized()) {
        throwError(ErrorCode.E1011, {
          cwd: process.cwd(),
        });
      }

      // 原有逻辑...

    } catch (error) {
      // 4. 统一错误处理
      handleError(error);
    }
  });
}
```

### 步骤 2: 添加缓存（3 分钟）

为频繁操作添加缓存：

```typescript
import { getOrSetCache, SmartCache, registerFileCache } from '../utils/cache.js';

async function loadConfig(): Promise<ProjectConfig> {
  const configPath = '.intentbridge/project.yml';
  const cacheKey = SmartCache.generateKey('config', configPath);

  // 注册文件映射（自动失效）
  registerFileCache(configPath, cacheKey);

  return await getOrSetCache(
    cacheKey,
    async () => {
      // 实际加载逻辑
      return readProject();
    },
    {
      ttl: 60000, // 1 分钟
      tags: ['config'],
    }
  );
}
```

### 步骤 3: 启动文件监听（2 分钟）

在应用启动时启动文件监听：

```typescript
import { startWatching } from '../utils/file-watcher.js';

// 在 bin/ib.ts 中
if (process.env.INTENTBRIDGE_WATCH !== 'false') {
  startWatching(process.cwd());
}
```

---

## 📚 详细集成步骤

### 1. 错误系统集成

#### 1.1 导入错误模块

在文件顶部添加：

```typescript
import {
  throwError,
  handleError,
  ErrorCode,
  IntentBridgeError,
} from '../errors/index.js';
```

#### 1.2 替换错误处理

**模式 1: console.error + process.exit**

```typescript
// ❌ 旧代码
if (!fs.existsSync(configPath)) {
  console.error('❌ 配置文件不存在');
  console.error('请先运行 ib init 初始化项目');
  process.exit(1);
}

// ✅ 新代码
if (!fs.existsSync(configPath)) {
  throwError(ErrorCode.E3002, {
    configPath,
    operation: 'load',
  });
}
```

**模式 2: throw new Error**

```typescript
// ❌ 旧代码
if (!requirement) {
  throw new Error(`需求 ${reqId} 不存在`);
}

// ✅ 新代码
if (!requirement) {
  throwError(ErrorCode.E2011, {
    requirementId: reqId,
    availableRequirements: requirements.map(r => r.id),
  });
}
```

**模式 3: try-catch**

```typescript
// ❌ 旧代码
try {
  const config = loadConfig();
} catch (error) {
  console.error('加载配置失败:', error.message);
  process.exit(1);
}

// ✅ 新代码
try {
  const config = loadConfig();
} catch (error) {
  if (error instanceof IntentBridgeError) {
    handleError(error);
  } else {
    const wrappedError = createError(ErrorCode.E3001, {
      originalError: error.message,
    });
    handleError(wrappedError);
  }
}
```

#### 1.3 选择正确的错误代码

| 场景 | 错误代码 | 说明 |
|------|---------|------|
| 文件不存在 | E2031 | 文件相关错误 |
| 配置错误 | E3001-E3004 | 项目配置错误 |
| 需求不存在 | E2011 | 需求相关错误 |
| 项目未初始化 | E2023 | 项目状态错误 |
| AI 错误 | E4001-E4014 | AI 相关错误 |

---

### 2. 性能监控集成

#### 2.1 导入性能模块

```typescript
import {
  measurePerformanceAsync,
  measurePerformanceSync,
  startTimer,
} from '../utils/performance.js';
```

#### 2.2 包装异步函数

```typescript
// 包装整个命令
export async function reqAddCommand(): Promise<void> {
  await measurePerformanceAsync('req add 命令', async () => {
    // 命令逻辑...
  });
}

// 包装特定操作
const result = await measurePerformanceAsync(
  'AI 理解需求',
  async () => {
    return await aiClient.understand(requirement);
  },
  {
    requirementId: 'REQ-001',
    provider: 'openai',
  }
);
```

#### 2.3 包装同步函数

```typescript
const config = measurePerformanceSync('加载配置', () => {
  return readProject();
});
```

#### 2.4 使用计时器

```typescript
const timer = startTimer('用户输入');
const name = await prompt('项目名称: ');
timer.stop(); // 自动记录
```

#### 2.5 查看性能报告

在调试模式下，性能信息会自动打印：

```bash
INTENTBRIDGE_DEBUG=true ib req list
```

或在代码中手动打印：

```typescript
import { printPerformanceReport } from '../utils/performance.js';

// 在命令结束时
printPerformanceReport();
```

---

### 3. 缓存系统集成

#### 3.1 导入缓存模块

```typescript
import {
  getCache,
  setCache,
  getCacheValue,
  getOrSetCache,
  SmartCache,
} from '../utils/cache.js';
import { registerFileCache } from '../utils/file-watcher.js';
```

#### 3.2 基本缓存使用

```typescript
// 方式 1: set + get
const cache = getCache();
cache.set('key', { data: 'value' }, { ttl: 60000 });
const value = cache.get('key');

// 方式 2: getOrSet（推荐）
const data = await getOrSetCache(
  'cache-key',
  async () => expensiveOperation(),
  {
    ttl: 60000,
    tags: ['data'],
  }
);
```

#### 3.3 文件变化自动失效

```typescript
async function loadRequirements(): Promise<RequirementsData> {
  const filePath = '.intentbridge/requirements.yml';
  const cacheKey = SmartCache.generateKey('requirements', filePath);

  // 注册文件映射
  registerFileCache(filePath, cacheKey);

  return await getOrSetCache(
    cacheKey,
    async () => {
      // 实际加载逻辑
      return readRequirements();
    },
    {
      ttl: 30000, // 30 秒
      tags: ['requirements'],
    }
  );
}
```

#### 3.4 AI 结果缓存

```typescript
async function understandRequirement(reqId: string) {
  const cacheKey = SmartCache.generateKey('ai', 'understand', reqId);

  return await getOrSetCache(
    cacheKey,
    async () => {
      // 调用 AI 服务
      return await aiClient.understand(reqId);
    },
    {
      ttl: 3600000, // 1 小时
      tags: ['ai', 'understanding', reqId],
    }
  );
}
```

#### 3.5 标签批量失效

```typescript
const cache = getCache();

// 当需求变化时，失效所有相关缓存
cache.deleteByTag('requirements');

// 当配置变化时，失效所有 AI 缓存
cache.deleteByTag('ai');
```

#### 3.6 查看缓存统计

```typescript
const cache = getCache();
cache.printStats();
```

---

## 🔧 实际集成示例

### 示例 1: req.ts（需求管理命令）

```typescript
import { throwError, handleError, ErrorCode } from '../errors/index.js';
import { measurePerformanceAsync } from '../utils/performance.js';
import { getOrSetCache, SmartCache, registerFileCache } from '../utils/cache.js';

export async function reqListCommand(): Promise<void> {
  await measurePerformanceAsync('req list 命令', async () => {
    try {
      // 检查项目状态
      if (!isInitialized()) {
        throwError(ErrorCode.E2023, {
          operation: 'req list',
        });
      }

      // 加载需求（带缓存）
      const requirements = await loadRequirementsWithCache();

      // 显示需求列表
      requirements.forEach(req => {
        console.log(`${req.id} - ${req.title}`);
      });

    } catch (error) {
      handleError(error);
    }
  });
}

async function loadRequirementsWithCache() {
  const filePath = '.intentbridge/requirements.yml';
  const cacheKey = SmartCache.generateKey('requirements', filePath);

  registerFileCache(filePath, cacheKey);

  return await getOrSetCache(
    cacheKey,
    async () => {
      const data = readRequirements();

      if (!data) {
        throwError(ErrorCode.E3002, {
          filePath,
        });
      }

      return data.requirements;
    },
    {
      ttl: 30000,
      tags: ['requirements'],
    }
  );
}
```

### 示例 2: ai.ts（AI 命令）

```typescript
import { throwError, handleError, ErrorCode } from '../errors/index.js';
import { measurePerformanceAsync } from '../utils/performance.js';
import { getOrSetCache, SmartCache } from '../utils/cache.js';

export async function aiUnderstandCommand(reqId: string): Promise<void> {
  await measurePerformanceAsync(
    'AI 理解需求',
    async () => {
      try {
        // 验证需求 ID
        if (!reqId.match(/^REQ-\d{3,}$/)) {
          throwError(ErrorCode.E2012, {
            providedId: reqId,
          });
        }

        // 检查需求是否存在
        const requirements = await loadRequirements();
        const requirement = requirements.find(r => r.id === reqId);

        if (!requirement) {
          throwError(ErrorCode.E2011, {
            requirementId: reqId,
            availableRequirements: requirements.map(r => r.id),
          });
        }

        // AI 理解（带缓存）
        const cacheKey = SmartCache.generateKey('ai', 'understand', reqId);

        const understanding = await getOrSetCache(
          cacheKey,
          async () => {
            console.log('🤖 调用 AI 服务...');
            return await aiClient.understand(requirement);
          },
          {
            ttl: 3600000, // 1 小时
            tags: ['ai', 'understanding', reqId],
          }
        );

        console.log('AI 理解结果:', understanding);

      } catch (error) {
        handleError(error);
      }
    },
    {
      requirementId: reqId,
    }
  );
}
```

---

## ✅ 集成检查清单

完成集成后，检查以下项目：

### 错误系统
- [ ] 导入错误模块
- [ ] 替换所有 console.error
- [ ] 替换所有 throw new Error
- [ ] 添加 try-catch 和 handleError
- [ ] 选择正确的错误代码
- [ ] 添加错误上下文
- [ ] 测试错误场景

### 性能监控
- [ ] 导入性能模块
- [ ] 包装命令函数
- [ ] 包装关键操作
- [ ] 添加性能元数据
- [ ] 测试性能报告

### 缓存系统
- [ ] 导入缓存模块
- [ ] 为配置加载添加缓存
- [ ] 为需求列表添加缓存
- [ ] 为 AI 结果添加缓存
- [ ] 注册文件到缓存映射
- [ ] 启动文件监听
- [ ] 测试缓存命中和失效

---

## 🐛 常见问题

### Q1: 错误处理导致程序退出

**问题**: 使用 throwError 后程序立即退出

**解决**: throwError 会抛出异常，需要用 try-catch 捕获：

```typescript
try {
  throwError(ErrorCode.E2011, { requirementId: 'REQ-999' });
} catch (error) {
  handleError(error); // 统一处理
}
```

### Q2: 缓存不生效

**问题**: 缓存总是未命中

**解决**: 检查缓存键是否一致：

```typescript
// 确保使用相同的缓存键生成方式
const cacheKey = SmartCache.generateKey('prefix', 'data');
```

### Q3: 性能监控不显示

**问题**: 看不到性能信息

**解决**: 启用调试模式：

```bash
INTENTBRIDGE_DEBUG=true ib req list
```

---

## 📊 集成进度追踪

使用此表格追踪集成进度：

| 命令/服务 | 错误系统 | 性能监控 | 缓存系统 | 状态 |
|----------|---------|---------|---------|------|
| init.ts | ⏳ | ⏳ | - | 待开始 |
| req.ts | ⏳ | ⏳ | ⏳ | 待开始 |
| project.ts | ⏳ | ⏳ | ⏳ | 待开始 |
| ai.ts | ⏳ | ⏳ | ⏳ | 待开始 |
| store.ts | ⏳ | - | ⏳ | 待开始 |

**图例**:
- ✅ 已完成
- 🔄 进行中
- ⏳ 待开始
- - 不适用

---

## 📚 相关资源

- **错误代码参考**: `docs/ERROR_CODES.md`
- **错误迁移指南**: `docs/ERROR_MIGRATION_GUIDE.md`
- **命令迁移示例**: `src/examples/command-migration.ts`
- **性能使用示例**: `src/examples/performance-usage.ts`
- **缓存使用示例**: `src/examples/cache-usage.ts`

---

**集成完成后，IntentBridge 将拥有统一的错误处理、完整的性能监控和智能缓存！**
