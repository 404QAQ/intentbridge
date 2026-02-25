/**
 * IntentBridge 智能缓存系统
 *
 * 功能：
 * - 多层缓存（内存 + 磁盘）
 * - TTL（生存时间）支持
 * - LRU（最近最少使用）淘汰
 * - 自动失效机制
 * - 文件监听触发失效
 * - 缓存统计和分析
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import chalk from 'chalk';

/**
 * 缓存配置
 */
export interface CacheConfig {
  enabled: boolean;          // 是否启用缓存
  ttl: number;               // 默认 TTL（毫秒）
  maxSize: number;           // 最大缓存条目数
  memoryLimit: number;       // 内存限制（字节）
  persistToDisk: boolean;    // 是否持久化到磁盘
  cacheDir: string;          // 缓存目录
}

/**
 * 缓存条目
 */
export interface CacheEntry<T> {
  key: string;               // 缓存键
  value: T;                  // 缓存值
  timestamp: number;         // 创建时间戳
  ttl: number;               // 生存时间（毫秒）
  hits: number;              // 命中次数
  size: number;              // 大小（字节）
  tags: string[];            // 标签（用于批量失效）
}

/**
 * 缓存统计
 */
export interface CacheStats {
  hits: number;              // 命中次数
  misses: number;            // 未命中次数
  hitRate: number;           // 命中率
  totalEntries: number;      // 总条目数
  memoryUsage: number;       // 内存使用
  evictions: number;         // 淘汰次数
  expiredRemovals: number;   // 过期移除次数
}

/**
 * 智能缓存管理器
 */
export class SmartCache {
  private static instance: SmartCache;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalEntries: 0,
    memoryUsage: 0,
    evictions: 0,
    expiredRemovals: 0,
  };

  private constructor(config?: Partial<CacheConfig>) {
    this.config = {
      enabled: true,
      ttl: 3600000, // 1 小时
      maxSize: 1000,
      memoryLimit: 100 * 1024 * 1024, // 100MB
      persistToDisk: true,
      cacheDir: '.intentbridge/cache',
      ...config,
    };

    // 初始化缓存目录
    if (this.config.persistToDisk) {
      this.initCacheDir();
    }

    // 从磁盘恢复缓存
    this.restoreFromDisk();
  }

  static getInstance(config?: Partial<CacheConfig>): SmartCache {
    if (!SmartCache.instance) {
      SmartCache.instance = new SmartCache(config);
    }
    return SmartCache.instance;
  }

  /**
   * 初始化缓存目录
   */
  private initCacheDir(): void {
    if (!existsSync(this.config.cacheDir)) {
      mkdirSync(this.config.cacheDir, { recursive: true });
    }
  }

  /**
   * 生成缓存键
   */
  static generateKey(...parts: (string | number | object)[]): string {
    const content = parts.map(p =>
      typeof p === 'object' ? JSON.stringify(p) : String(p)
    ).join(':');

    return createHash('md5').update(content).digest('hex');
  }

  /**
   * 设置缓存
   */
  set<T>(
    key: string,
    value: T,
    options?: {
      ttl?: number;
      tags?: string[];
    }
  ): void {
    if (!this.config.enabled) return;

    // 检查缓存大小限制
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    // 检查内存限制
    if (this.stats.memoryUsage >= this.config.memoryLimit) {
      this.evictLRU();
    }

    const ttl = options?.ttl ?? this.config.ttl;
    const tags = options?.tags ?? [];

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      size: this.calculateSize(value),
      tags,
    };

    this.cache.set(key, entry);
    this.stats.totalEntries = this.cache.size;
    this.stats.memoryUsage += entry.size;

    // 持久化到磁盘
    if (this.config.persistToDisk) {
      this.persistToDisk(key, entry);
    }
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    if (!this.config.enabled) return null;

    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // 检查是否过期
    if (this.isExpired(entry)) {
      this.delete(key);
      this.stats.misses++;
      this.stats.expiredRemovals++;
      this.updateHitRate();
      return null;
    }

    // 更新命中次数
    entry.hits++;
    this.stats.hits++;
    this.updateHitRate();

    return entry.value as T;
  }

  /**
   * 获取或设置缓存（常用模式）
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: {
      ttl?: number;
      tags?: string[];
    }
  ): Promise<T> {
    // 尝试从缓存获取
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // 缓存未命中，执行工厂函数
    const value = await factory();

    // 存入缓存
    this.set(key, value, options);

    return value;
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.stats.totalEntries = this.cache.size;
    this.stats.memoryUsage -= entry.size;

    // 删除磁盘缓存
    if (this.config.persistToDisk) {
      this.deleteFromDisk(key);
    }

    return true;
  }

  /**
   * 根据标签批量删除
   */
  deleteByTag(tag: string): number {
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    this.stats.totalEntries = 0;
    this.stats.memoryUsage = 0;

    // 清空磁盘缓存
    if (this.config.persistToDisk) {
      this.clearDiskCache();
    }
  }

  /**
   * 检查缓存是否存在
   */
  has(key: string): boolean {
    if (!this.config.enabled) return false;

    const entry = this.cache.get(key);
    if (!entry) return false;

    // 检查是否过期
    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * 打印缓存统计
   */
  printStats(): void {
    console.log('\n' + chalk.bold('📊 缓存统计'));
    console.log(chalk.gray('━'.repeat(50)));
    console.log();

    console.log(`总条目数: ${chalk.yellow(this.stats.totalEntries)}`);
    console.log(`内存使用: ${chalk.yellow(this.formatBytes(this.stats.memoryUsage))}`);
    console.log();
    console.log(`命中次数: ${chalk.green(this.stats.hits)}`);
    console.log(`未命中次数: ${chalk.red(this.stats.misses)}`);
    console.log(`命中率: ${chalk.yellow((this.stats.hitRate * 100).toFixed(2))}%`);
    console.log();
    console.log(`淘汰次数: ${chalk.yellow(this.stats.evictions)}`);
    console.log(`过期移除: ${chalk.yellow(this.stats.expiredRemovals)}`);
    console.log();
  }

  /**
   * 清理过期缓存
   */
  cleanupExpired(): number {
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * LRU 淘汰
   */
  private evictLRU(): void {
    // 找到最少使用的条目
    let minHits = Infinity;
    let lruKey: string | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < minHits) {
        minHits = entry.hits;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.delete(lruKey);
      this.stats.evictions++;
    }
  }

  /**
   * 检查是否过期
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * 更新命中率
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * 计算对象大小（估算）
   */
  private calculateSize(value: any): number {
    const str = JSON.stringify(value);
    return Buffer.byteLength(str, 'utf8');
  }

  /**
   * 持久化到磁盘
   */
  private persistToDisk(key: string, entry: CacheEntry<any>): void {
    try {
      const filePath = join(this.config.cacheDir, `${key}.json`);
      writeFileSync(filePath, JSON.stringify(entry, null, 2));
    } catch (error) {
      // 静默失败
    }
  }

  /**
   * 从磁盘恢复缓存
   */
  private restoreFromDisk(): void {
    if (!this.config.persistToDisk) return;

    try {
      if (!existsSync(this.config.cacheDir)) return;

      const files = readdirSync(this.config.cacheDir);
      const now = Date.now();

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        try {
          const filePath = join(this.config.cacheDir, file);
          const content = readFileSync(filePath, 'utf-8');
          const entry: CacheEntry<any> = JSON.parse(content);

          // 跳过过期条目
          if (now - entry.timestamp > entry.ttl) {
            unlinkSync(filePath);
            continue;
          }

          this.cache.set(entry.key, entry);
          this.stats.memoryUsage += entry.size;
        } catch (error) {
          // 跳过损坏的缓存文件
        }
      }

      this.stats.totalEntries = this.cache.size;
    } catch (error) {
      // 静默失败
    }
  }

  /**
   * 从磁盘删除
   */
  private deleteFromDisk(key: string): void {
    try {
      const filePath = join(this.config.cacheDir, `${key}.json`);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (error) {
      // 静默失败
    }
  }

  /**
   * 清空磁盘缓存
   */
  private clearDiskCache(): void {
    try {
      if (!existsSync(this.config.cacheDir)) return;

      const files = readdirSync(this.config.cacheDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = join(this.config.cacheDir, file);
          unlinkSync(filePath);
        }
      }
    } catch (error) {
      // 静默失败
    }
  }

  /**
   * 格式化字节数
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
  }
}

/**
 * 快捷函数：获取缓存实例
 */
export function getCache(config?: Partial<CacheConfig>): SmartCache {
  return SmartCache.getInstance(config);
}

/**
 * 快捷函数：设置缓存
 */
export function setCache<T>(
  key: string,
  value: T,
  options?: {
    ttl?: number;
    tags?: string[];
  }
): void {
  getCache().set(key, value, options);
}

/**
 * 快捷函数：获取缓存
 */
export function getCacheValue<T>(key: string): T | null {
  return getCache().get<T>(key);
}

/**
 * 快捷函数：获取或设置缓存
 */
export async function getOrSetCache<T>(
  key: string,
  factory: () => Promise<T>,
  options?: {
    ttl?: number;
    tags?: string[];
  }
): Promise<T> {
  return await getCache().getOrSet(key, factory, options);
}
