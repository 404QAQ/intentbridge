/**
 * 错误系统使用示例和最佳实践
 *
 * 本文件展示如何在 IntentBridge 中正确使用错误系统
 */

import {
  IntentBridgeError,
  createError,
  throwError,
  handleError,
  ErrorCode,
  ErrorContext,
} from '../errors/index.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * 示例 1: 基本错误处理
 */
export function example1_basicErrorHandling() {
  console.log('\n=== 示例 1: 基本错误处理 ===\n');

  try {
    // 检查文件是否存在
    const filePath = './nonexistent.yml';

    if (!existsSync(filePath)) {
      // 方式 1: 使用 throwError（推荐）
      throwError(ErrorCode.E2031, {
        filePath,
        operation: 'read',
      });
    }
  } catch (error) {
    // 统一错误处理
    handleError(error);
  }
}

/**
 * 示例 2: 创建错误并延迟抛出
 */
export async function example2_createError() {
  console.log('\n=== 示例 2: 创建错误并延迟抛出 ===\n');

  // 创建错误但不立即抛出
  const error = createError(ErrorCode.E2011, {
    requirementId: 'REQ-999',
    operation: 'fetch',
  });

  // 可以在抛出前添加更多上下文
  error.context.availableRequirements = ['REQ-001', 'REQ-002', 'REQ-003'];

  // 稍后抛出
  try {
    throw error;
  } catch (err) {
    handleError(err);
  }
}

/**
 * 示例 3: 在异步函数中使用
 */
export async function example3_asyncErrorHandling() {
  console.log('\n=== 示例 3: 异步函数中的错误处理 ===\n');

  try {
    await fetchRequirement('REQ-999');
  } catch (error) {
    handleError(error);
  }
}

async function fetchRequirement(reqId: string) {
  // 模拟 API 调用
  const requirements = ['REQ-001', 'REQ-002', 'REQ-003'];

  if (!requirements.includes(reqId)) {
    throwError(ErrorCode.E2011, {
      requirementId: reqId,
      availableRequirements: requirements,
    });
  }

  return { id: reqId, title: 'Test Requirement' };
}

/**
 * 示例 4: 嵌套错误（错误链）
 */
export function example4_errorChaining() {
  console.log('\n=== 示例 4: 错误链 ===\n');

  try {
    // 尝试读取配置文件
    const config = readProjectConfig('./project.yml');
    console.log('Config loaded:', config);
  } catch (error) {
    // 底层错误会被包装为 IntentBridgeError
    if (error instanceof IntentBridgeError) {
      handleError(error);
    } else {
      // 将未知错误包装为 IntentBridgeError
      const wrappedError = createError(ErrorCode.E3001, {
        originalError: error.message,
      });
      handleError(wrappedError);
    }
  }
}

function readProjectConfig(filePath: string) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // 将文件读取错误包装为 IntentBridgeError
    throwError(ErrorCode.E3001, {
      filePath,
      originalError: error.message,
    });
  }
}

/**
 * 示例 5: 可恢复错误
 */
export function example5_recoverableError() {
  console.log('\n=== 示例 5: 可恢复错误 ===\n');

  try {
    // 尝试连接数据库
    connectToDatabase('localhost:5432');
  } catch (error) {
    if (error instanceof IntentBridgeError) {
      // 打印错误但不退出
      console.error(error.format());

      // 如果可恢复，尝试恢复
      if (error.recoverable) {
        console.log('\n💡 尝试恢复...\n');
        // 执行恢复逻辑
        recoverFromError(error);
      }
    }
  }
}

function connectToDatabase(connectionString: string) {
  // 模拟数据库连接失败
  throwError(ErrorCode.E3011, {
    connectionString,
    error: 'Connection refused',
  });
}

function recoverFromError(error: IntentBridgeError) {
  console.log('✅ 恢复成功：使用默认配置');
  // 恢复逻辑...
}

/**
 * 示例 6: 可重试错误
 */
export async function example6_retryableError() {
  console.log('\n=== 示例 6: 可重试错误 ===\n');

  let attempts = 0;
  const maxRetries = 3;

  while (attempts < maxRetries) {
    try {
      await callAIService();
      console.log('✅ AI 服务调用成功');
      break;
    } catch (error) {
      if (error instanceof IntentBridgeError && error.retryable) {
        attempts++;
        console.log(`⚠️  调用失败，重试 ${attempts}/${maxRetries}...`);

        if (attempts >= maxRetries) {
          handleError(error);
        }

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        handleError(error);
      }
    }
  }
}

async function callAIService() {
  // 模拟 AI 服务超时
  if (Math.random() > 0.3) {
    throwError(ErrorCode.E4011, {
      provider: 'openai',
      model: 'gpt-4',
    });
  }
}

/**
 * 示例 7: 错误日志和报告
 */
export function example7_errorLogging() {
  console.log('\n=== 示例 7: 错误日志和报告 ===\n');

  try {
    throwError(ErrorCode.E2011, {
      requirementId: 'REQ-404',
    });
  } catch (error) {
    if (error instanceof IntentBridgeError) {
      // 生成 JSON 格式的错误报告
      const report = error.toJSON();
      console.log('错误报告（JSON）:');
      console.log(JSON.stringify(report, null, 2));

      // 也可以格式化为 CLI 友好的输出
      console.log('\n错误输出（CLI）:');
      console.error(error.format());
    }
  }
}

/**
 * 示例 8: 错误上下文收集
 */
export function example8_errorContext() {
  console.log('\n=== 示例 8: 错误上下文收集 ===\n');

  try {
    throwError(ErrorCode.E2023, {
      // 自定义上下文
      projectId: 'my-project',
      attemptedOperation: 'start',
      dependencies: ['frontend', 'backend'],
      environmentVariables: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
    });
  } catch (error) {
    if (error instanceof IntentBridgeError) {
      console.log('错误上下文:');
      console.log(JSON.stringify(error.context, null, 2));
    }
  }
}

/**
 * 示例 9: 多语言错误消息
 */
export function example9_multilanguageErrors() {
  console.log('\n=== 示例 9: 多语言错误消息 ===\n');

  try {
    throwError(ErrorCode.E1001);
  } catch (error) {
    if (error instanceof IntentBridgeError) {
      // 中文输出
      console.log('中文错误消息:');
      console.error(error.format('zh-CN'));

      console.log('\n' + '='.repeat(50) + '\n');

      // 英文输出
      console.log('English Error Message:');
      console.error(error.format('en-US'));
    }
  }
}

/**
 * 示例 10: 错误处理最佳实践
 */
export class BestPractices {
  /**
   * 最佳实践 1: 在函数开始时验证输入
   */
  static validateInput(reqId: string) {
    // 验证需求 ID 格式
    if (!reqId.match(/^REQ-\d{3,}$/)) {
      throwError(ErrorCode.E2012, {
        providedId: reqId,
        expectedFormat: 'REQ-XXX',
      });
    }

    // 继续处理...
    console.log(`✅ 需求 ID 验证通过: ${reqId}`);
  }

  /**
   * 最佳实践 2: 使用类型守卫
   */
  static isIntentBridgeError(error: unknown): error is IntentBridgeError {
    return error instanceof IntentBridgeError;
  }

  static handleUnknownError(error: unknown) {
    if (this.isIntentBridgeError(error)) {
      handleError(error);
    } else if (error instanceof Error) {
      // 包装未知错误
      const wrappedError = createError(ErrorCode.E5011, {
        originalError: error.message,
        stack: error.stack,
      });
      handleError(wrappedError);
    } else {
      // 完全未知的错误
      console.error('❌ 发生未知错误:', error);
      process.exit(1);
    }
  }

  /**
   * 最佳实践 3: 提供有用的上下文
   */
  static withContext<T>(
    operation: string,
    fn: () => T,
    context: Partial<ErrorContext>
  ): T {
    try {
      return fn();
    } catch (error) {
      if (error instanceof IntentBridgeError) {
        // 添加更多上下文
        Object.assign(error.context, {
          operation,
          ...context,
        });
      }
      throw error;
    }
  }

  /**
   * 最佳实践 4: 错误恢复策略
   */
  static async withRecovery<T>(
    fn: () => Promise<T>,
    recoveryFn: (error: IntentBridgeError) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        return await fn();
      } catch (error) {
        if (error instanceof IntentBridgeError) {
          attempts++;

          if (error.retryable && attempts < maxRetries) {
            console.log(`⚠️  重试 ${attempts}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            continue;
          }

          if (error.recoverable) {
            console.log('💡 尝试恢复...');
            return await recoveryFn(error);
          }
        }

        throw error;
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * 最佳实践 5: 错误分类处理
   */
  static handleByCategory(error: IntentBridgeError) {
    switch (error.category) {
      case 'installation':
        console.log('🔧 安装错误，请检查环境配置');
        break;
      case 'command':
        console.log('💡 命令错误，请检查命令语法');
        break;
      case 'project':
        console.log('📁 项目错误，请检查项目配置');
        break;
      case 'ai':
        console.log('🤖 AI 错误，请检查 API 配置');
        break;
      case 'system':
        console.log('💻 系统错误，请检查系统资源');
        break;
    }

    handleError(error);
  }
}

/**
 * 运行所有示例
 */
export async function runAllExamples() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   IntentBridge 错误系统使用示例           ║');
  console.log('╚════════════════════════════════════════════╝');

  try {
    // example1_basicErrorHandling();  // 会退出
    // example2_createError();  // 会退出
    // example3_asyncErrorHandling();  // 会退出
    // example4_errorChaining();  // 会退出

    // 这些示例不会退出
    example5_recoverableError();
    await example6_retryableError();
    example7_errorLogging();
    example8_errorContext();
    example9_multilanguageErrors();

    // 最佳实践示例
    console.log('\n=== 最佳实践示例 ===\n');

    try {
      BestPractices.validateInput('invalid-id');
    } catch (error) {
      if (BestPractices.isIntentBridgeError(error)) {
        console.log(error.format());
      }
    }

    console.log('\n✅ 所有示例运行完成');
  } catch (error) {
    console.error('示例运行出错:', error);
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}
