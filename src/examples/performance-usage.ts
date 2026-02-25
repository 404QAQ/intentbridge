/**
 * 性能监控使用示例
 *
 * 展示如何在 IntentBridge 中使用性能监控工具
 */

import {
  PerformanceMonitor,
  startTimer,
  measurePerformanceAsync,
  measurePerformanceSync,
  printPerformanceReport,
  getPerformanceReport,
} from '../utils/performance.js';

/**
 * 示例 1: 基本性能测量
 */
export async function example1_basicMeasurement() {
  console.log('\n=== 示例 1: 基本性能测量 ===\n');

  // 测量异步函数
  await measurePerformanceAsync('加载配置文件', async () => {
    // 模拟加载配置
    await new Promise(resolve => setTimeout(resolve, 100));
    return { name: 'test-project', version: '1.0.0' };
  });

  // 测量同步函数
  const result = measurePerformanceSync('解析 YAML', () => {
    // 模拟 YAML 解析
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += i;
    }
    return sum;
  });

  console.log('✅ 基本测量完成');
}

/**
 * 示例 2: 使用计时器
 */
export async function example2_usingTimer() {
  console.log('\n=== 示例 2: 使用计时器 ===\n');

  // 创建计时器
  const timer = startTimer('数据库查询', { query: 'SELECT * FROM requirements' });

  // 执行操作
  await new Promise(resolve => setTimeout(resolve, 150));

  // 停止计时并记录
  const duration = timer.stop();
  console.log(`⏱️  操作耗时: ${duration}ms`);
}

/**
 * 示例 3: 多个操作的测量
 */
export async function example3_multipleOperations() {
  console.log('\n=== 示例 3: 多个操作的测量 ===\n');

  const monitor = PerformanceMonitor.getInstance();

  // 操作 1: 读取文件
  await monitor.measure('读取需求文件', async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  // 操作 2: 解析内容
  await monitor.measure('解析需求内容', async () => {
    await new Promise(resolve => setTimeout(resolve, 30));
  });

  // 操作 3: 验证需求
  await monitor.measure('验证需求格式', async () => {
    await new Promise(resolve => setTimeout(resolve, 20));
  });

  // 操作 4: 保存需求
  await monitor.measure('保存需求', async () => {
    await new Promise(resolve => setTimeout(resolve, 40));
  });

  console.log('✅ 所有操作完成');
}

/**
 * 示例 4: 带元数据的测量
 */
export async function example4_withMetadata() {
  console.log('\n=== 示例 4: 带元数据的测量 ===\n');

  await measurePerformanceAsync(
    'AI 需求理解',
    async () => {
      // 模拟 AI 调用
      await new Promise(resolve => setTimeout(resolve, 200));
      return { understanding: 'complete', confidence: 0.95 };
    },
    {
      provider: 'openai',
      model: 'gpt-4',
      tokens: 1500,
    }
  );

  console.log('✅ AI 调用完成');
}

/**
 * 示例 5: 性能报告
 */
export async function example5_performanceReport() {
  console.log('\n=== 示例 5: 性能报告 ===\n');

  const monitor = PerformanceMonitor.getInstance();
  monitor.clearMetrics();

  // 执行一系列操作
  for (let i = 0; i < 10; i++) {
    await monitor.measure(`操作 ${i + 1}`, async () => {
      const delay = Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    });
  }

  // 打印性能报告
  printPerformanceReport();

  // 获取 JSON 格式的报告
  const report = getPerformanceReport();
  console.log('\n报告摘要:');
  console.log(`- 总操作数: ${report.totalOperations}`);
  console.log(`- 总耗时: ${report.totalDuration.toFixed(0)}ms`);
  console.log(`- 平均耗时: ${report.averageDuration.toFixed(2)}ms`);
}

/**
 * 示例 6: 错误场景的性能测量
 */
export async function example6_errorMeasurement() {
  console.log('\n=== 示例 6: 错误场景的性能测量 ===\n');

  try {
    await measurePerformanceAsync('可能失败的操作', async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      throw new Error('操作失败');
    });
  } catch (error) {
    console.log('⚠️  操作失败（已记录）');
  }

  // 即使失败也会记录性能
  printPerformanceReport();
}

/**
 * 示例 7: 查找慢操作
 */
export async function example7_findSlowOperations() {
  console.log('\n=== 示例 7: 查找慢操作 ===\n');

  const monitor = PerformanceMonitor.getInstance();
  monitor.clearMetrics();

  // 执行不同速度的操作
  const operations = [
    { name: '快速操作', delay: 10 },
    { name: '中速操作', delay: 50 },
    { name: '慢速操作', delay: 200 },
    { name: '很慢操作', delay: 500 },
  ];

  for (const op of operations) {
    await monitor.measure(op.name, async () => {
      await new Promise(resolve => setTimeout(resolve, op.delay));
    });
  }

  // 查找慢操作
  const slowOps = monitor.getMetrics().filter(m => m.duration > 100);

  console.log('慢操作 (>100ms):');
  slowOps.forEach(op => {
    console.log(`  - ${op.name}: ${op.duration.toFixed(0)}ms`);
  });
}

/**
 * 示例 8: 内存监控
 */
export async function example8_memoryMonitoring() {
  console.log('\n=== 示例 8: 内存监控 ===\n');

  const monitor = PerformanceMonitor.getInstance();
  monitor.clearMetrics();

  // 执行内存密集型操作
  await monitor.measure('创建大数组', async () => {
    const largeArray = new Array(1000000).fill(null).map((_, i) => i);
    return largeArray.length;
  });

  // 查看内存使用
  const metrics = monitor.getMetrics();
  const memoryMetric = metrics[0];

  if (memoryMetric.memory) {
    console.log('内存使用:');
    console.log(`  - 堆内存变化: ${formatBytes(memoryMetric.memory.heapUsed)}`);
    console.log(`  - 堆内存总量: ${formatBytes(memoryMetric.memory.heapTotal)}`);
    console.log(`  - 外部内存: ${formatBytes(memoryMetric.memory.external)}`);
  }
}

/**
 * 示例 9: 装饰器使用（TypeScript）
 */
export class ExampleService {
  /**
   * 使用装饰器自动测量性能
   * 注意：需要启用 TypeScript 装饰器支持
   */
  // @measurePerformance('数据处理')
  async processData(data: any[]): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return data.map(item => ({ ...item, processed: true }));
  }

  /**
   * 手动测量性能
   */
  async processDataManual(data: any[]): Promise<any[]> {
    return await measurePerformanceAsync(
      '数据处理 (手动)',
      async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return data.map(item => ({ ...item, processed: true }));
      },
      { itemCount: data.length }
    );
  }
}

/**
 * 示例 10: 真实场景 - 命令执行
 */
export async function example10_realWorldCommand() {
  console.log('\n=== 示例 10: 真实场景 - 命令执行 ===\n');

  const monitor = PerformanceMonitor.getInstance();
  monitor.clearMetrics();

  // 模拟 ib req add 命令执行
  console.log('执行: ib req add "用户登录功能"');

  // 步骤 1: 验证输入
  await monitor.measure('验证输入', async () => {
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  // 步骤 2: 加载项目配置
  await monitor.measure('加载项目配置', async () => {
    await new Promise(resolve => setTimeout(resolve, 30));
  });

  // 步骤 3: 生成需求 ID
  await monitor.measure('生成需求 ID', async () => {
    await new Promise(resolve => setTimeout(resolve, 5));
  });

  // 步骤 4: 保存需求
  await monitor.measure('保存需求', async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
  });

  // 步骤 5: AI 理解（可选）
  await monitor.measure('AI 理解需求', async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
  }, { provider: 'openai', model: 'gpt-4' });

  console.log('✅ 需求添加成功');

  // 打印性能报告
  printPerformanceReport();
}

/**
 * 辅助函数：格式化字节数
 */
function formatBytes(bytes: number): string {
  const absBytes = Math.abs(bytes);
  const sign = bytes < 0 ? '-' : '';

  if (absBytes < 1024) {
    return `${sign}${absBytes}B`;
  } else if (absBytes < 1024 * 1024) {
    return `${sign}${(absBytes / 1024).toFixed(2)}KB`;
  } else if (absBytes < 1024 * 1024 * 1024) {
    return `${sign}${(absBytes / (1024 * 1024)).toFixed(2)}MB`;
  } else {
    return `${sign}${(absBytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
  }
}

/**
 * 运行所有示例
 */
export async function runAllExamples() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   IntentBridge 性能监控使用示例           ║');
  console.log('╚════════════════════════════════════════════╝');

  try {
    await example1_basicMeasurement();
    await example2_usingTimer();
    await example3_multipleOperations();
    await example4_withMetadata();
    await example5_performanceReport();
    await example6_errorMeasurement();
    await example7_findSlowOperations();
    await example8_memoryMonitoring();
    await example10_realWorldCommand();

    console.log('\n✅ 所有示例运行完成');
  } catch (error) {
    console.error('❌ 示例运行出错:', error);
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}
