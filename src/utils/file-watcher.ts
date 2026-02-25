/**
 * IntentBridge 文件监听器
 *
 * 功能：
 * - 监听文件变化
 * - 自动触发缓存失效
 * - 防抖和节流
 * - 批量事件处理
 * - 支持递归目录监听
 */

import { watch, FSWatcher, Stats, existsSync, statSync } from 'fs';
import { join, relative, dirname, basename, extname } from 'path';
import chalk from 'chalk';

/**
 * 文件变化事件
 */
export interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink';
  path: string;
  timestamp: number;
  stats?: Stats;
}

/**
 * 监听器配置
 */
export interface WatcherConfig {
  enabled: boolean;           // 是否启用
  ignored: RegExp[];          // 忽略的文件模式
  persistent: boolean;        // 是否持久监听
  ignoreInitial: boolean;     // 是否忽略初始扫描
  awaitWriteFinish: {         // 文件写入完成检测
    stabilityThreshold: number;
    pollInterval: number;
  };
  usePolling: boolean;        // 是否使用轮询
  interval: number;           // 轮询间隔
}

/**
 * 文件监听器
 */
export class FileWatcher {
  private static instance: FileWatcher;
  private watchers: Map<string, FSWatcher> = new Map();
  private config: WatcherConfig;
  private changeCallbacks: Map<string, ((event: FileChangeEvent) => void)[]> = new Map();
  private cacheInvalidationCallbacks: Map<string, (() => void)[]> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private eventQueue: FileChangeEvent[] = [];
  private isProcessingQueue: boolean = false;

  private constructor(config?: Partial<WatcherConfig>) {
    this.config = {
      enabled: true,
      ignored: [
        /node_modules/,
        /\.git/,
        /\.intentbridge\/cache/,
        /dist/,
        /\.DS_Store/,
        /Thumbs\.db/,
        /\.log$/,
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 10,
      },
      usePolling: false,
      interval: 100,
      ...config,
    };
  }

  static getInstance(config?: Partial<WatcherConfig>): FileWatcher {
    if (!FileWatcher.instance) {
      FileWatcher.instance = new FileWatcher(config);
    }
    return FileWatcher.instance;
  }

  /**
   * 监听文件或目录
   */
  watch(
    target: string,
    options?: {
      recursive?: boolean;
      onChange?: (event: FileChangeEvent) => void;
      onCacheInvalidate?: () => void;
    }
  ): void {
    if (!this.config.enabled) return;
    if (!existsSync(target)) return;

    const recursive = options?.recursive ?? true;

    // 检查是否已监听
    if (this.watchers.has(target)) {
      console.log(chalk.yellow(`⚠️  已经在监听: ${target}`));
      return;
    }

    // 注册回调
    if (options?.onChange) {
      const callbacks = this.changeCallbacks.get(target) || [];
      callbacks.push(options.onChange);
      this.changeCallbacks.set(target, callbacks);
    }

    if (options?.onCacheInvalidate) {
      const callbacks = this.cacheInvalidationCallbacks.get(target) || [];
      callbacks.push(options.onCacheInvalidate);
      this.cacheInvalidationCallbacks.set(target, callbacks);
    }

    // 创建监听器
    const watcher = watch(
      target,
      {
        persistent: this.config.persistent,
        recursive,
        encoding: 'utf8',
      },
      (eventType, filename) => {
        if (!filename) return;

        const filePath = join(target, filename);

        // 检查是否应该忽略
        if (this.shouldIgnore(filePath)) return;

        // 处理事件
        this.handleEvent(eventType, filePath);
      }
    );

    watcher.on('error', (error) => {
      console.error(chalk.red(`❌ 监听器错误: ${error.message}`));
    });

    this.watchers.set(target, watcher);

    if (process.env.INTENTBRIDGE_DEBUG === 'true') {
      console.log(chalk.gray(`[WATCH] 开始监听: ${target}`));
    }
  }

  /**
   * 停止监听
   */
  unwatch(target: string): void {
    const watcher = this.watchers.get(target);
    if (!watcher) return;

    watcher.close();
    this.watchers.delete(target);
    this.changeCallbacks.delete(target);
    this.cacheInvalidationCallbacks.delete(target);

    if (process.env.INTENTBRIDGE_DEBUG === 'true') {
      console.log(chalk.gray(`[WATCH] 停止监听: ${target}`));
    }
  }

  /**
   * 停止所有监听
   */
  unwatchAll(): void {
    for (const [target] of this.watchers) {
      this.unwatch(target);
    }
  }

  /**
   * 获取监听的路径列表
   */
  getWatchedPaths(): string[] {
    return Array.from(this.watchers.keys());
  }

  /**
   * 处理文件系统事件
   */
  private handleEvent(eventType: string, filePath: string): void {
    // 防抖处理
    this.debounce(filePath, () => {
      // 检查文件是否存在
      const exists = existsSync(filePath);
      const stats = exists ? statSync(filePath) : undefined;

      // 确定事件类型
      let type: 'add' | 'change' | 'unlink';
      if (!exists) {
        type = 'unlink';
      } else if (eventType === 'rename') {
        type = 'add';
      } else {
        type = 'change';
      }

      // 创建事件对象
      const event: FileChangeEvent = {
        type,
        path: filePath,
        timestamp: Date.now(),
        stats,
      };

      // 添加到事件队列
      this.eventQueue.push(event);

      // 处理队列
      this.processQueue();
    });
  }

  /**
   * 处理事件队列
   */
  private processQueue(): void {
    if (this.isProcessingQueue) return;
    if (this.eventQueue.length === 0) return;

    this.isProcessingQueue = true;

    // 批量处理事件
    const events = [...this.eventQueue];
    this.eventQueue = [];

    // 触发回调
    for (const event of events) {
      this.triggerCallbacks(event);
    }

    this.isProcessingQueue = false;

    // 如果队列中还有事件，继续处理
    if (this.eventQueue.length > 0) {
      setImmediate(() => this.processQueue());
    }
  }

  /**
   * 触发回调
   */
  private triggerCallbacks(event: FileChangeEvent): void {
    // 触发变化回调
    for (const [target, callbacks] of this.changeCallbacks) {
      if (event.path.startsWith(target)) {
        callbacks.forEach(callback => {
          try {
            callback(event);
          } catch (error) {
            console.error(chalk.red(`❌ 回调执行错误: ${error}`));
          }
        });
      }
    }

    // 触发缓存失效回调
    for (const [target, callbacks] of this.cacheInvalidationCallbacks) {
      if (event.path.startsWith(target)) {
        callbacks.forEach(callback => {
          try {
            callback();
          } catch (error) {
            console.error(chalk.red(`❌ 缓存失效回调错误: ${error}`));
          }
        });
      }
    }

    // 打印调试信息
    if (process.env.INTENTBRIDGE_DEBUG === 'true') {
      const typeEmoji = {
        add: '➕',
        change: '✏️',
        unlink: '❌',
      };
      console.log(
        chalk.gray(`[WATCH] ${typeEmoji[event.type]} ${relative(process.cwd(), event.path)}`)
      );
    }
  }

  /**
   * 防抖处理
   */
  private debounce(key: string, callback: () => void): void {
    // 清除之前的定时器
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // 设置新的定时器
    const timer = setTimeout(() => {
      callback();
      this.debounceTimers.delete(key);
    }, this.config.awaitWriteFinish.stabilityThreshold);

    this.debounceTimers.set(key, timer);
  }

  /**
   * 检查是否应该忽略
   */
  private shouldIgnore(filePath: string): boolean {
    return this.config.ignored.some(pattern => pattern.test(filePath));
  }
}

/**
 * 缓存失效管理器
 */
export class CacheInvalidationManager {
  private static instance: CacheInvalidationManager;
  private fileToCacheKeys: Map<string, Set<string>> = new Map();
  private watcher: FileWatcher;

  private constructor() {
    this.watcher = FileWatcher.getInstance();
  }

  static getInstance(): CacheInvalidationManager {
    if (!CacheInvalidationManager.instance) {
      CacheInvalidationManager.instance = new CacheInvalidationManager();
    }
    return CacheInvalidationManager.instance;
  }

  /**
   * 注册文件到缓存映射
   */
  registerFileCache(filePath: string, cacheKey: string): void {
    const keys = this.fileToCacheKeys.get(filePath) || new Set();
    keys.add(cacheKey);
    this.fileToCacheKeys.set(filePath, keys);
  }

  /**
   * 开始监听文件变化
   */
  startWatching(target: string): void {
    this.watcher.watch(target, {
      recursive: true,
      onCacheInvalidate: () => {
        this.invalidateCache(target);
      },
    });
  }

  /**
   * 失效缓存
   */
  private invalidateCache(filePath: string): void {
    // 导入缓存（避免循环依赖）
    import('./cache.js').then(({ getCache }) => {
      const cache = getCache();
      const keys = this.fileToCacheKeys.get(filePath);

      if (keys) {
        keys.forEach(key => {
          cache.delete(key);

          if (process.env.INTENTBRIDGE_DEBUG === 'true') {
            console.log(chalk.gray(`[CACHE] 失效: ${key}`));
          }
        });
      }

      // 如果是目录，失效所有子文件
      for (const [path, keys] of this.fileToCacheKeys) {
        if (path.startsWith(filePath)) {
          keys.forEach(key => {
            cache.delete(key);

            if (process.env.INTENTBRIDGE_DEBUG === 'true') {
              console.log(chalk.gray(`[CACHE] 失效: ${key}`));
            }
          });
        }
      }
    });
  }

  /**
   * 获取文件对应的缓存键
   */
  getCacheKeys(filePath: string): string[] {
    const keys = this.fileToCacheKeys.get(filePath);
    return keys ? Array.from(keys) : [];
  }
}

/**
 * 快捷函数：开始监听
 */
export function startWatching(target: string): void {
  FileWatcher.getInstance().watch(target);
}

/**
 * 快捷函数：停止监听
 */
export function stopWatching(target: string): void {
  FileWatcher.getInstance().unwatch(target);
}

/**
 * 快捷函数：注册文件缓存映射
 */
export function registerFileCache(filePath: string, cacheKey: string): void {
  CacheInvalidationManager.getInstance().registerFileCache(filePath, cacheKey);
}
