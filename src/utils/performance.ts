/**
 * IntentBridge 性能监控工具
 *
 * 功能：
 * - 执行时间测量
 * - 内存使用监控
 * - 性能指标收集
 * - 性能报告生成
 */

import chalk from 'chalk';

/**
 * 性能指标
 */
export interface PerformanceMetric {
  name: string;          // 指标名称
  duration: number;      // 执行时间（毫秒）
  memory?: {
    heapUsed: number;    // 堆内存使用（字节）
    heapTotal: number;   // 堆内存总量
    external: number;    // 外部内存
  };
  timestamp: string;     // 时间戳
  metadata?: Record<string, any>;  // 元数据
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private enabled: boolean = true;

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 启用/禁用监控
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 测量函数执行时间
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.enabled) {
      return await fn();
    }

    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage();

      this.recordMetric({
        name,
        duration,
        memory: {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal,
          external: endMemory.external,
        },
        timestamp: new Date().toISOString(),
        metadata,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage();

      this.recordMetric({
        name: `${name} (failed)`,
        duration,
        memory: {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal,
          external: endMemory.external,
        },
        timestamp: new Date().toISOString(),
        metadata: { ...metadata, error: true },
      });

      throw error;
    }
  }

  /**
   * 测量同步函数执行时间
   */
  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    if (!this.enabled) {
      return fn();
    }

    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    try {
      const result = fn();
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage();

      this.recordMetric({
        name,
        duration,
        memory: {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal,
          external: endMemory.external,
        },
        timestamp: new Date().toISOString(),
        metadata,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage();

      this.recordMetric({
        name: `${name} (failed)`,
        duration,
        memory: {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal,
          external: endMemory.external,
        },
        timestamp: new Date().toISOString(),
        metadata: { ...metadata, error: true },
      });

      throw error;
    }
  }

  /**
   * 记录指标
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // 如果启用调试模式，打印性能信息
    if (process.env.INTENTBRIDGE_DEBUG === 'true') {
      this.printMetric(metric);
    }
  }

  /**
   * 打印单个指标
   */
  private printMetric(metric: PerformanceMetric): void {
    const duration = this.formatDuration(metric.duration);
    const memory = metric.memory
      ? this.formatMemory(metric.memory.heapUsed)
      : '';

    console.log(
      chalk.gray(`[PERF] ${metric.name}: ${duration}`) +
        (memory ? chalk.gray(` (${memory})`) : '')
    );
  }

  /**
   * 获取所有指标
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * 获取特定名称的指标
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name.includes(name));
  }

  /**
   * 清除所有指标
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * 生成性能报告
   */
  generateReport(): PerformanceReport {
    if (this.metrics.length === 0) {
      return {
        totalOperations: 0,
        totalDuration: 0,
        averageDuration: 0,
        slowestOperations: [],
        memoryUsage: {
          peak: 0,
          average: 0,
        },
        metrics: [],
      };
    }

    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const averageDuration = totalDuration / this.metrics.length;

    const memoryMetrics = this.metrics.filter(m => m.memory);
    const peakMemory = memoryMetrics.length > 0
      ? Math.max(...memoryMetrics.map(m => m.memory!.heapUsed))
      : 0;
    const averageMemory = memoryMetrics.length > 0
      ? memoryMetrics.reduce((sum, m) => sum + m.memory!.heapUsed, 0) / memoryMetrics.length
      : 0;

    const slowestOperations = [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      totalOperations: this.metrics.length,
      totalDuration,
      averageDuration,
      slowestOperations,
      memoryUsage: {
        peak: peakMemory,
        average: averageMemory,
      },
      metrics: this.metrics,
    };
  }

  /**
   * 打印性能报告
   */
  printReport(): void {
    const report = this.generateReport();

    console.log('\n' + chalk.bold('📊 性能报告'));
    console.log(chalk.gray('━'.repeat(50)));
    console.log();

    console.log(`总操作数: ${chalk.yellow(report.totalOperations)}`);
    console.log(`总耗时: ${chalk.yellow(this.formatDuration(report.totalDuration))}`);
    console.log(`平均耗时: ${chalk.yellow(this.formatDuration(report.averageDuration))}`);
    console.log();

    if (report.memoryUsage.peak > 0) {
      console.log(`内存峰值: ${chalk.yellow(this.formatMemory(report.memoryUsage.peak))}`);
      console.log(`内存平均: ${chalk.yellow(this.formatMemory(report.memoryUsage.average))}`);
      console.log();
    }

    if (report.slowestOperations.length > 0) {
      console.log(chalk.bold('最慢的操作:'));
      report.slowestOperations.forEach((op, index) => {
        const duration = this.formatDuration(op.duration);
        const memory = op.memory
          ? ` (${this.formatMemory(op.memory.heapUsed)})`
          : '';
        console.log(`  ${index + 1}. ${op.name}: ${chalk.yellow(duration)}${memory}`);
      });
      console.log();
    }
  }

  /**
   * 格式化持续时间
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms.toFixed(0)}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * 格式化内存大小
   */
  private formatMemory(bytes: number): string {
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
}

/**
 * 性能报告
 */
export interface PerformanceReport {
  totalOperations: number;
  totalDuration: number;
  averageDuration: number;
  slowestOperations: PerformanceMetric[];
  memoryUsage: {
    peak: number;
    average: number;
  };
  metrics: PerformanceMetric[];
}

/**
 * 计时器类（用于手动测量）
 */
export class Timer {
  private startTime: number;
  private name: string;
  private metadata?: Record<string, any>;

  constructor(name: string, metadata?: Record<string, any>) {
    this.name = name;
    this.metadata = metadata;
    this.startTime = Date.now();
  }

  /**
   * 停止计时并记录
   */
  stop(): number {
    const duration = Date.now() - this.startTime;

    PerformanceMonitor.getInstance().measureSync(
      this.name,
      () => duration,
      this.metadata
    );

    return duration;
  }

  /**
   * 获取已过时间（不停止）
   */
  elapsed(): number {
    return Date.now() - this.startTime;
  }
}

/**
 * 装饰器：自动测量方法执行时间
 */
export function measurePerformance(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const monitor = PerformanceMonitor.getInstance();
      return await monitor.measure(
        metricName,
        () => originalMethod.apply(this, args),
        { args }
      );
    };

    return descriptor;
  };
}

/**
 * 快捷函数：创建计时器
 */
export function startTimer(name: string, metadata?: Record<string, any>): Timer {
  return new Timer(name, metadata);
}

/**
 * 快捷函数：测量异步函数
 */
export async function measurePerformanceAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return await PerformanceMonitor.getInstance().measure(name, fn, metadata);
}

/**
 * 快捷函数：测量同步函数
 */
export function measurePerformanceSync<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, any>
): T {
  return PerformanceMonitor.getInstance().measureSync(name, fn, metadata);
}

/**
 * 快捷函数：打印性能报告
 */
export function printPerformanceReport(): void {
  PerformanceMonitor.getInstance().printReport();
}

/**
 * 快捷函数：获取性能报告
 */
export function getPerformanceReport(): PerformanceReport {
  return PerformanceMonitor.getInstance().generateReport();
}
