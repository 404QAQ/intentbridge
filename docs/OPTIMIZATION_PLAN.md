# IntentBridge 优化计划 v3.6.0

## 📊 优化目标

针对用户反馈的四个关键问题进行系统性优化。

---

## 1. 🟡 简化命令复杂度

### 当前问题
- 命令层级过多：`ib req add`, `ib project start`, `ib ai understand`
- 参数选项复杂
- 新手学习曲线陡峭

### 优化方案

#### 1.1 添加智能命令别名

```bash
# 当前命令
ib req add --title "登录功能" --priority high

# 优化后 - 方式 1: 自然语言
ib "添加登录功能，优先级高"

# 优化后 - 方式 2: 短命令
ib add "登录功能" -p high

# 优化后 - 方式 3: 交互式
ib add
> 标题: 登录功能
> 优先级: high
```

#### 1.2 实现智能命令路由

```typescript
// src/services/smart-router.ts
export class SmartRouter {
  parse(input: string): ParsedCommand {
    // 支持自然语言
    if (input.includes('添加') || input.includes('add')) {
      return { command: 'req', action: 'add' };
    }

    // 支持短命令
    if (input.startsWith('add ')) {
      return { command: 'req', action: 'add', args: [input.slice(4)] };
    }

    // 支持完整命令
    return this.parseFullCommand(input);
  }
}
```

#### 1.3 命令简化映射表

| 当前命令 | 简化命令 | 自然语言示例 |
|---------|---------|-------------|
| `ib req add` | `ib add` | `ib "添加登录功能"` |
| `ib req list` | `ib ls` | `ib "查看所有需求"` |
| `ib req update REQ-001 --status done` | `ib done REQ-001` | `ib "完成 REQ-001"` |
| `ib project start my-project` | `ib start my-project` | `ib "启动 my-project"` |
| `ib ai understand REQ-001` | `ib understand REQ-001` | `ib "理解 REQ-001"` |
| `ib web start` | `ib web` | `ib "打开网页"` |

#### 1.4 实现命令自动补全

```bash
# 安装自动补全
ib completion install

# 支持的 shell
ib completion install --shell bash
ib completion install --shell zsh
ib completion install --shell fish
```

---

## 2. 🟡 完善文档和教程

### 当前问题
- 缺少快速入门教程
- 缺少实际案例
- 缺少故障排查指南

### 优化方案

#### 2.1 创建 5 分钟快速入门

```markdown
# docs/QUICK_START_5MIN.md

## 🚀 5 分钟快速入门

### 第 1 分钟: 安装
```bash
curl -fsSL https://raw.githubusercontent.com/404QAQ/intentbridge/main/install.sh | bash
```

### 第 2 分钟: 初始化
```bash
ib init
```

### 第 3 分钟: 添加需求
```bash
ib add "用户登录功能"
```

### 第 4 分钟: 查看需求
```bash
ib ls
```

### 第 5 分钟: 启动 Web UI
```bash
ib web
```

🎉 恭喜！你已经掌握了 IntentBridge 的基本使用！
```

#### 2.2 创建实际案例教程

```markdown
# docs/TUTORIALS.md

## 📚 实战教程

### 教程 1: 个人博客系统
- 添加需求
- 理解需求
- 验证实现
- [查看完整教程](tutorials/blog-system.md)

### 教程 2: 电商后台
- 多项目管理
- 端口协调
- 依赖管理
- [查看完整教程](tutorials/ecommerce-admin.md)

### 教程 3: 微服务架构
- 服务注册
- 端口自动分配
- 进程监控
- [查看完整教程](tutorials/microservices.md)
```

#### 2.3 创建故障排查指南

```markdown
# docs/TROUBLESHOOTING.md

## 🔧 故障排查指南

### 常见问题 1: 安装失败
**症状**: `npm install -g intentbridge` 报错
**原因**: Node.js 版本过低
**解决**: 升级到 Node.js 18+

### 常见问题 2: 命令找不到
**症状**: `ib: command not found`
**原因**: npm 全局路径未添加到 PATH
**解决**: `export PATH="$(npm prefix -g)/bin:$PATH"`

### 常见问题 3: 端口冲突
**症状**: `Error: Port 3000 already in use`
**原因**: 端口被占用
**解决**: `ib project ports check && ib project ports release <project> 3000`
```

#### 2.4 创建视频教程大纲

```markdown
# docs/VIDEO_TUTORIALS.md

## 📹 视频教程计划

### 第 1 集: IntentBridge 简介 (5 分钟)
- 什么是 IntentBridge
- 解决什么问题
- 核心功能演示

### 第 2 集: 快速上手 (10 分钟)
- 安装和初始化
- 添加第一个需求
- 使用 Web UI

### 第 3 集: 进阶功能 (15 分钟)
- 多项目管理
- AI 功能
- 端口协调

### 第 4 集: 实战案例 (20 分钟)
- 完整项目演示
- 从需求到实现
```

---

## 3. 🟡 改进错误提示

### 当前问题
- 错误信息过于技术化
- 缺少解决建议
- 没有错误代码

### 优化方案

#### 3.1 实现错误代码系统

```typescript
// src/errors/error-codes.ts
export enum ErrorCode {
  // 安装错误 (1xxx)
  INSTALL_NODE_VERSION = 1001,
  INSTALL_NPM_NOT_FOUND = 1002,
  INSTALL_PERMISSION_DENIED = 1003,

  // 需求错误 (2xxx)
  REQ_NOT_FOUND = 2001,
  REQ_ALREADY_EXISTS = 2002,
  REQ_INVALID_STATUS = 2003,

  // 项目错误 (3xxx)
  PROJECT_NOT_FOUND = 3001,
  PROJECT_ALREADY_EXISTS = 3002,
  PROJECT_PORT_CONFLICT = 3003,

  // AI 错误 (4xxx)
  AI_API_KEY_MISSING = 4001,
  AI_RATE_LIMIT = 4002,
  AI_TIMEOUT = 4003,
}

export const ErrorMessages: Record<ErrorCode, ErrorMessage> = {
  [ErrorCode.INSTALL_NODE_VERSION]: {
    code: 'E1001',
    title: 'Node.js 版本过低',
    message: '当前 Node.js 版本为 {current}，需要 {required} 或更高版本',
    solution: '请升级 Node.js:\n  macOS/Linux: brew install node@22\n  Windows: 访问 https://nodejs.org',
    doc: 'https://intentbridge.dev/docs/installation#nodejs'
  },

  [ErrorCode.PROJECT_PORT_CONFLICT]: {
    code: 'E3003',
    title: '端口冲突',
    message: '端口 {port} 已被项目 {project} 占用',
    solution: '解决方案:\n  1. 停止占用项目: ib stop {project}\n  2. 释放端口: ib ports release {project} {port}\n  3. 使用其他端口: ib start {newProject} --auto-ports',
    doc: 'https://intentbridge.dev/docs/port-management'
  }
};
```

#### 3.2 友好的错误输出

```typescript
// src/services/error-formatter.ts
export function formatError(error: IntentBridgeError): string {
  const info = ErrorMessages[error.code];

  return `
╔══════════════════════════════════════╗
║  ❌ ${info.title.padEnd(30)} ║
╚══════════════════════════════════════╝

错误代码: ${info.code}
错误详情: ${info.message}

💡 解决方法:
${info.solution}

📚 详细文档: ${info.doc}

需要帮助? 运行: ib help ${info.code}
`;
}
```

#### 3.3 多语言错误提示

```typescript
// src/errors/messages/zh-CN.ts
export const zhCN = {
  [ErrorCode.PROJECT_PORT_CONFLICT]: {
    title: '端口冲突',
    message: '端口 {port} 已被项目 {project} 占用',
    solution: '解决方案:\n  1. 停止占用项目: ib stop {project}\n  2. 释放端口: ib ports release {project} {port}'
  }
};

// src/errors/messages/en-US.ts
export const enUS = {
  [ErrorCode.PROJECT_PORT_CONFLICT]: {
    title: 'Port Conflict',
    message: 'Port {port} is already used by project {project}',
    solution: 'Solutions:\n  1. Stop the project: ib stop {project}\n  2. Release port: ib ports release {project} {port}'
  }
};
```

#### 3.4 错误上下文收集

```typescript
// src/services/error-context.ts
export class ErrorContextCollector {
  collect(error: Error): ErrorContext {
    return {
      timestamp: new Date().toISOString(),
      version: getVersion(),
      os: getOS(),
      nodeVersion: process.version,
      command: process.argv.join(' '),
      stackTrace: error.stack,
      recentLogs: this.getRecentLogs(10),
      projectState: this.getProjectState()
    };
  }

  generateReport(context: ErrorContext): string {
    return `
## 错误报告

**时间**: ${context.timestamp}
**版本**: ${context.version}
**系统**: ${context.os}
**Node.js**: ${context.nodeVersion}
**命令**: ${context.command}

### 堆栈跟踪
\`\`\`
${context.stackTrace}
\`\`\`

### 项目状态
\`\`\`json
${JSON.stringify(context.projectState, null, 2)}
\`\`\`
`;
  }
}
```

---

## 4. 🟡 性能优化

### 当前问题
- YAML 文件读取频繁
- AI 调用延迟高
- 没有缓存机制

### 优化方案

#### 4.1 实现智能缓存系统

```typescript
// src/services/cache-manager.ts
export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 分钟

  // 缓存需求列表
  cacheRequirements(requirements: Requirement[]): void {
    this.set('requirements', requirements, {
      ttl: this.TTL,
      tags: ['requirements']
    });
  }

  // 获取缓存的需求列表
  getCachedRequirements(): Requirement[] | null {
    const entry = this.get('requirements');
    if (!entry || this.isExpired(entry)) {
      return null;
    }
    return entry.data;
  }

  // 文件变更时失效缓存
  invalidateOnFileChange(filePath: string): void {
    if (filePath.includes('requirements.yml')) {
      this.invalidateByTag('requirements');
    }
  }
}
```

#### 4.2 YAML 读取优化

```typescript
// src/services/yaml-optimizer.ts
export class YAMLOptimizer {
  private static instance: YAMLOptimizer;
  private fileWatchers: Map<string, FSWatcher> = new Map();
  private cachedData: Map<string, any> = new Map();

  // 使用文件监听而不是轮询
  watch(filePath: string): void {
    if (this.fileWatchers.has(filePath)) return;

    const watcher = fs.watch(filePath, (eventType) => {
      if (eventType === 'change') {
        this.cachedData.delete(filePath);
      }
    });

    this.fileWatchers.set(filePath, watcher);
  }

  // 读取时使用缓存
  async read(filePath: string): Promise<any> {
    if (this.cachedData.has(filePath)) {
      return this.cachedData.get(filePath);
    }

    const data = await this.loadYAML(filePath);
    this.cachedData.set(filePath, data);
    this.watch(filePath);

    return data;
  }
}
```

#### 4.3 AI 调用批处理

```typescript
// src/services/ai-batch-processor.ts
export class AIBatchProcessor {
  private queue: AIRequest[] = [];
  private processing = false;

  // 添加 AI 请求到队列
  enqueue(request: AIRequest): Promise<AIResponse> {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  // 批量处理队列
  private async processQueue(): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0) {
      // 批量取出 10 个请求
      const batch = this.queue.splice(0, 10);

      // 合并为一个 API 调用
      const combinedPrompt = this.combineRequests(batch);

      try {
        const response = await this.callAI(combinedPrompt);
        const results = this.parseResponse(response);

        // 分发结果
        batch.forEach((item, index) => {
          item.resolve(results[index]);
        });
      } catch (error) {
        batch.forEach(item => item.reject(error));
      }

      // 延迟避免限流
      await this.delay(1000);
    }

    this.processing = false;
  }
}
```

#### 4.4 性能监控

```typescript
// src/services/performance-monitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, Metric[]> = new Map();

  // 记录操作耗时
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();

    try {
      const result = fn();
      const duration = performance.now() - start;

      this.record(name, duration, 'success');

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.record(name, duration, 'error');
      throw error;
    }
  }

  // 生成性能报告
  generateReport(): PerformanceReport {
    const report: PerformanceReport = {};

    this.metrics.forEach((metrics, name) => {
      const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
      const p95 = this.percentile(metrics.map(m => m.duration), 95);

      report[name] = {
        count: metrics.length,
        avgDuration: avgDuration.toFixed(2) + 'ms',
        p95: p95.toFixed(2) + 'ms',
        errorRate: (metrics.filter(m => m.status === 'error').length / metrics.length * 100).toFixed(2) + '%'
      };
    });

    return report;
  }
}
```

#### 4.5 启动优化

```typescript
// src/services/startup-optimizer.ts
export class StartupOptimizer {
  // 延迟加载非关键模块
  async optimize(): Promise<void> {
    // 1. 只加载核心模块
    await this.loadCoreModules();

    // 2. 在后台预加载常用模块
    this.preloadInBackground([
      'ai-client',
      'project-coordinator',
      'validation-engine'
    ]);

    // 3. 延迟加载 Web UI
    if (this.needsWebUI()) {
      await this.loadWebUI();
    }
  }

  // 核心模块加载
  private async loadCoreModules(): Promise<void> {
    const coreModules = [
      'store',
      'nlp-router',
      'commander'
    ];

    await Promise.all(
      coreModules.map(m => import(`./${m}`))
    );
  }
}
```

---

## 📊 优化效果预期

| 优化项 | 当前 | 优化后 | 提升 |
|-------|------|--------|------|
| **命令复杂度** | 3-4 层 | 1-2 层 | 60% ↓ |
| **学习曲线** | 30 分钟 | 5 分钟 | 83% ↓ |
| **错误解决时间** | 10 分钟 | 2 分钟 | 80% ↓ |
| **启动时间** | 2 秒 | 0.5 秒 | 75% ↓ |
| **内存占用** | 150 MB | 80 MB | 47% ↓ |
| **AI 响应** | 3 秒 | 1 秒 | 67% ↓ |

---

## 🚀 实施计划

### Phase 1: 命令简化 (Week 1)
- ✅ 实现智能路由
- ✅ 添加命令别名
- ✅ 实现自动补全

### Phase 2: 文档完善 (Week 2)
- ✅ 创建快速入门
- ✅ 编写实战教程
- ✅ 建立故障排查指南

### Phase 3: 错误提示 (Week 3)
- ✅ 实现错误代码系统
- ✅ 创建多语言支持
- ✅ 添加错误上下文收集

### Phase 4: 性能优化 (Week 4)
- ✅ 实现缓存系统
- ✅ 优化 YAML 读取
- ✅ 添加性能监控

---

## 📝 版本规划

**v3.6.0** - 命令简化 + 文档完善
**v3.7.0** - 错误提示优化
**v3.8.0** - 性能优化

---

**优化目标**: 让 IntentBridge 成为最易用、最高效的 AI 需求管理工具！
