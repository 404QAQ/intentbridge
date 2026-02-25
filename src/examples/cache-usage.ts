/**
 * 缓存系统使用示例
 *
 * 展示如何在 IntentBridge 中使用智能缓存和文件监听
 */

import {
  SmartCache,
  getCache,
  setCache,
  getCacheValue,
  getOrSetCache,
} from '../utils/cache.js';
import {
  FileWatcher,
  CacheInvalidationManager,
  startWatching,
  registerFileCache,
} from '../utils/file-watcher.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * 示例 1: 基本缓存操作
 */
export function example1_basicCache() {
  console.log('\n=== 示例 1: 基本缓存操作 ===\n');

  const cache = getCache();

  // 设置缓存
  cache.set('user:1', { name: '张三', age: 25 });
  console.log('✅ 设置缓存: user:1');

  // 获取缓存
  const user = cache.get('user:1');
  console.log('📖 获取缓存:', user);

  // 检查缓存是否存在
  const exists = cache.has('user:1');
  console.log('🔍 缓存存在:', exists);

  // 删除缓存
  cache.delete('user:1');
  console.log('❌ 删除缓存');

  // 再次检查
  const existsAfterDelete = cache.has('user:1');
  console.log('🔍 删除后存在:', existsAfterDelete);
}

/**
 * 示例 2: TTL（生存时间）
 */
export async function example2_cacheWithTTL() {
  console.log('\n=== 示例 2: TTL（生存时间） ===\n');

  const cache = getCache();

  // 设置 2 秒过期的缓存
  cache.set('temp:data', { value: '临时数据' }, { ttl: 2000 });
  console.log('✅ 设置缓存（TTL: 2秒）');

  // 立即获取
  const data1 = cache.get('temp:data');
  console.log('📖 立即获取:', data1);

  // 等待 2.5 秒
  console.log('⏳ 等待 2.5 秒...');
  await new Promise(resolve => setTimeout(resolve, 2500));

  // 再次获取（应该过期）
  const data2 = cache.get('temp:data');
  console.log('📖 2.5秒后获取:', data2, '(已过期)');
}

/**
 * 示例 3: 标签批量失效
 */
export function example3_cacheWithTags() {
  console.log('\n=== 示例 3: 标签批量失效 ===\n');

  const cache = getCache();
  cache.clear();

  // 设置带标签的缓存
  cache.set('product:1', { name: '商品1' }, { tags: ['products'] });
  cache.set('product:2', { name: '商品2' }, { tags: ['products'] });
  cache.set('product:3', { name: '商品3' }, { tags: ['products'] });
  cache.set('order:1', { name: '订单1' }, { tags: ['orders'] });

  console.log('✅ 设置了 4 个缓存条目（3 个商品，1 个订单）');

  // 根据标签删除
  const deleted = cache.deleteByTag('products');
  console.log(`❌ 删除了 ${deleted} 个商品缓存`);

  // 检查剩余
  const product1 = cache.get('product:1');
  const order1 = cache.get('order:1');

  console.log('📖 商品1缓存:', product1, '(已删除)');
  console.log('📖 订单1缓存:', order1, '(仍存在)');
}

/**
 * 示例 4: getOrSet 模式
 */
export async function example4_getOrSet() {
  console.log('\n=== 示例 4: getOrSet 模式 ===\n');

  const cache = getCache();
  cache.clear();

  // 模拟昂贵的操作
  async function fetchUserData(userId: string) {
    console.log(`🔄 执行昂贵操作: 获取用户 ${userId}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    return { id: userId, name: `用户${userId}` };
  }

  // 第一次调用（缓存未命中）
  console.log('第 1 次调用:');
  const user1 = await cache.getOrSet('user:123', () => fetchUserData('123'));
  console.log('结果:', user1);

  // 第二次调用（缓存命中）
  console.log('\n第 2 次调用（应该命中缓存）:');
  const user2 = await cache.getOrSet('user:123', () => fetchUserData('123'));
  console.log('结果:', user2);
}

/**
 * 示例 5: 缓存统计
 */
export function example5_cacheStats() {
  console.log('\n=== 示例 5: 缓存统计 ===\n');

  const cache = getCache();
  cache.clear();

  // 设置一些缓存
  for (let i = 0; i < 10; i++) {
    cache.set(`item:${i}`, { value: i });
  }

  // 命中一些
  for (let i = 0; i < 7; i++) {
    cache.get(`item:${i}`);
  }

  // 未命中一些
  for (let i = 10; i < 15; i++) {
    cache.get(`item:${i}`);
  }

  // 打印统计
  cache.printStats();
}

/**
 * 示例 6: 文件监听和缓存失效
 */
export async function example6_fileWatching() {
  console.log('\n=== 示例 6: 文件监听和缓存失效 ===\n');

  const testFile = join(process.cwd(), 'test-config.json');

  // 创建测试文件
  writeFileSync(testFile, JSON.stringify({ version: '1.0.0' }));
  console.log('✅ 创建测试文件:', testFile);

  // 创建缓存失效管理器
  const invalidationManager = CacheInvalidationManager.getInstance();
  const cache = getCache();
  cache.clear();

  // 注册文件到缓存映射
  const cacheKey = 'config:test';
  invalidationManager.registerFileCache(testFile, cacheKey);
  console.log('📝 注册文件缓存映射');

  // 设置缓存
  cache.set(cacheKey, { version: '1.0.0' });
  console.log('✅ 设置缓存:', cacheKey);

  // 开始监听
  const watcher = FileWatcher.getInstance();
  watcher.watch(process.cwd(), {
    recursive: false,
    onChange: (event) => {
      console.log(`📁 文件变化: ${event.type} ${event.path}`);
    },
    onCacheInvalidate: () => {
      console.log('🔄 触发缓存失效');
    },
  });
  console.log('👀 开始监听文件');

  // 等待一下让监听器启动
  await new Promise(resolve => setTimeout(resolve, 500));

  // 修改文件
  console.log('\n修改文件...');
  writeFileSync(testFile, JSON.stringify({ version: '2.0.0' }));

  // 等待缓存失效
  await new Promise(resolve => setTimeout(resolve, 500));

  // 检查缓存（应该已失效）
  const cachedConfig = cache.get(cacheKey);
  console.log('📖 缓存内容:', cachedConfig, '(应该为 null)');

  // 清理
  watcher.unwatch(process.cwd());
  console.log('\n✅ 停止监听');
}

/**
 * 示例 7: 快捷函数
 */
export function example7_convenienceFunctions() {
  console.log('\n=== 示例 7: 快捷函数 ===\n');

  // 使用快捷函数
  setCache('quick:key1', { data: '值1' });
  console.log('✅ 设置缓存: quick:key1');

  const value1 = getCacheValue('quick:key1');
  console.log('📖 获取缓存:', value1);

  // 生成缓存键
  const key1 = SmartCache.generateKey('user', 123, { role: 'admin' });
  console.log('🔑 生成的缓存键:', key1);

  const key2 = SmartCache.generateKey('user', 123, { role: 'admin' });
  console.log('🔑 相同输入生成的键:', key2);
  console.log('🔍 键是否相同:', key1 === key2);
}

/**
 * 示例 8: LRU 淘汰
 */
export function example8_lruEviction() {
  console.log('\n=== 示例 8: LRU 淘汰 ===\n');

  const cache = getCache({
    maxSize: 5, // 只允许 5 个条目
  });
  cache.clear();

  console.log('设置最大缓存条目数: 5');

  // 添加 7 个条目
  for (let i = 1; i <= 7; i++) {
    cache.set(`item:${i}`, { value: i });
    console.log(`✅ 添加 item:${i}`);
  }

  // 检查哪些条目存在
  console.log('\n检查条目:');
  for (let i = 1; i <= 7; i++) {
    const exists = cache.has(`item:${i}`);
    console.log(`  item:${i}: ${exists ? '存在' : '已淘汰'}`);
  }

  // 查看统计
  const stats = cache.getStats();
  console.log(`\n淘汰次数: ${stats.evictions}`);
}

/**
 * 示例 9: 真实场景 - 配置文件缓存
 */
export async function example9_realWorldConfig() {
  console.log('\n=== 示例 9: 真实场景 - 配置文件缓存 ===\n');

  const configPath = join(process.cwd(), '.intentbridge', 'project.yml');

  async function loadConfig() {
    console.log('🔄 加载配置文件...');

    if (!existsSync(configPath)) {
      console.log('⚠️  配置文件不存在');
      return null;
    }

    const content = readFileSync(configPath, 'utf-8');
    // 这里简化处理，实际应该解析 YAML
    return { path: configPath, loaded: true };
  }

  // 使用缓存
  const cacheKey = SmartCache.generateKey('config', configPath);

  // 注册文件到缓存映射
  registerFileCache(configPath, cacheKey);

  // 第一次加载（未命中）
  console.log('第 1 次加载:');
  const config1 = await getOrSetCache(cacheKey, loadConfig, {
    ttl: 60000, // 1 分钟
    tags: ['config'],
  });
  console.log('结果:', config1);

  // 第二次加载（命中）
  console.log('\n第 2 次加载（应该命中缓存）:');
  const config2 = await getOrSetCache(cacheKey, loadConfig, {
    ttl: 60000,
    tags: ['config'],
  });
  console.log('结果:', config2);

  // 打印统计
  getCache().printStats();
}

/**
 * 示例 10: 真实场景 - AI 结果缓存
 */
export async function example10_realWorldAI() {
  console.log('\n=== 示例 10: 真实场景 - AI 结果缓存 ===\n');

  const cache = getCache();
  cache.clear();

  async function callAI(prompt: string) {
    console.log(`🤖 调用 AI: ${prompt}`);
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      prompt,
      understanding: 'AI 理解结果',
      confidence: 0.95,
    };
  }

  const prompt1 = '添加用户登录功能';
  const cacheKey = SmartCache.generateKey('ai', prompt1);

  // 第一次调用（未命中）
  console.log('第 1 次调用 AI:');
  const result1 = await cache.getOrSet(
    cacheKey,
    () => callAI(prompt1),
    {
      ttl: 3600000, // 1 小时
      tags: ['ai', 'understanding'],
    }
  );
  console.log('结果:', result1);

  // 第二次调用（命中）
  console.log('\n第 2 次调用 AI（应该命中缓存）:');
  const result2 = await cache.getOrSet(
    cacheKey,
    () => callAI(prompt1),
    {
      ttl: 3600000,
      tags: ['ai', 'understanding'],
    }
  );
  console.log('结果:', result2);

  // 查看统计
  cache.printStats();
}

/**
 * 运行所有示例
 */
export async function runAllExamples() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   IntentBridge 缓存系统使用示例           ║');
  console.log('╚════════════════════════════════════════════╝');

  try {
    example1_basicCache();
    await example2_cacheWithTTL();
    example3_cacheWithTags();
    await example4_getOrSet();
    example5_cacheStats();
    await example6_fileWatching();
    example7_convenienceFunctions();
    example8_lruEviction();
    await example9_realWorldConfig();
    await example10_realWorldAI();

    console.log('\n✅ 所有示例运行完成');
  } catch (error) {
    console.error('❌ 示例运行出错:', error);
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}
