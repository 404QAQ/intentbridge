/**
 * IntentBridge 错误处理工具
 *
 * 功能：
 * - 错误格式化
 * - 错误上下文收集
 * - 错误报告生成
 * - 错误日志记录
 */

import chalk from 'chalk';
import { ErrorCode, ErrorSeverity, ErrorCategory, ErrorMetadata } from './codes.js';
import { getErrorMessage, Language, ErrorMessage } from './messages.js';

/**
 * IntentBridge 自定义错误类
 */
export class IntentBridgeError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly recoverable: boolean;
  public readonly retryable: boolean;
  public readonly context: ErrorContext;
  public readonly docs?: string;

  constructor(
    code: ErrorCode,
    context?: Partial<ErrorContext>,
    cause?: Error
  ) {
    const message = getErrorMessage(code);
    super(message.message, { cause });

    this.name = 'IntentBridgeError';
    this.code = code;
    this.severity = this.getSeverity(code);
    this.category = this.getCategory(code);
    this.recoverable = this.isRecoverable(code);
    this.retryable = this.isRetryable(code);
    this.docs = message.docs;

    // 收集错误上下文
    this.context = {
      timestamp: new Date().toISOString(),
      command: process.argv.slice(2).join(' '),
      cwd: process.cwd(),
      nodeVersion: process.version,
      platform: process.platform,
      ...context,
    };

    // 确保正确的原型链
    Object.setPrototypeOf(this, IntentBridgeError.prototype);
  }

  /**
   * 根据错误代码判断严重程度
   */
  private getSeverity(code: ErrorCode): ErrorSeverity {
    const criticalCodes = [
      ErrorCode.E1001, // Node.js 版本过低
      ErrorCode.E1002, // npm 权限错误
      ErrorCode.E1014, // 权限不足
    ];

    const highCodes = [
      ErrorCode.E1003, // 依赖安装失败
      ErrorCode.E1004, // 全局安装失败
      ErrorCode.E3001, // 配置文件损坏
      ErrorCode.E4001, // API Key 缺失
      ErrorCode.E4002, // API Key 无效
    ];

    const mediumCodes = [
      ErrorCode.E2001, // 命令不存在
      ErrorCode.E2011, // 需求不存在
      ErrorCode.E2021, // 项目不存在
      ErrorCode.E3021, // 端口已被占用
    ];

    if (criticalCodes.includes(code)) return ErrorSeverity.CRITICAL;
    if (highCodes.includes(code)) return ErrorSeverity.HIGH;
    if (mediumCodes.includes(code)) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  /**
   * 根据错误代码判断分类
   */
  private getCategory(code: ErrorCode): ErrorCategory {
    const codeNum = parseInt(code.slice(1));
    if (codeNum >= 1000 && codeNum < 2000) return ErrorCategory.INSTALLATION;
    if (codeNum >= 2000 && codeNum < 3000) return ErrorCategory.COMMAND;
    if (codeNum >= 3000 && codeNum < 4000) return ErrorCategory.PROJECT;
    if (codeNum >= 4000 && codeNum < 5000) return ErrorCategory.AI;
    return ErrorCategory.SYSTEM;
  }

  /**
   * 判断错误是否可恢复
   */
  private isRecoverable(code: ErrorCode): boolean {
    const unrecoverableCodes = [
      ErrorCode.E1001, // Node.js 版本过低
      ErrorCode.E1014, // 权限不足
      ErrorCode.E3001, // 配置文件损坏
    ];

    return !unrecoverableCodes.includes(code);
  }

  /**
   * 判断错误是否可重试
   */
  private isRetryable(code: ErrorCode): boolean {
    const retryableCodes = [
      ErrorCode.E1003, // 依赖安装失败
      ErrorCode.E4011, // AI 请求超时
      ErrorCode.E4012, // AI 响应错误
      ErrorCode.E5014, // 网络错误
    ];

    return retryableCodes.includes(code);
  }

  /**
   * 格式化错误输出（用于 CLI）
   */
  public format(language: Language = 'zh-CN'): string {
    const message = getErrorMessage(this.code, language);
    const lines: string[] = [];

    // 错误标题
    lines.push('');
    lines.push(chalk.red('❌ ') + chalk.bold(message.title));
    lines.push(chalk.gray('━'.repeat(50)));
    lines.push('');

    // 错误代码和严重程度
    const severityEmoji = {
      [ErrorSeverity.LOW]: '💡',
      [ErrorSeverity.MEDIUM]: '⚠️',
      [ErrorSeverity.HIGH]: '🔴',
      [ErrorSeverity.CRITICAL]: '🚨',
    };

    lines.push(`${chalk.gray('错误代码:')} ${chalk.yellow(this.code)}`);
    lines.push(`${chalk.gray('严重程度:')} ${severityEmoji[this.severity]} ${this.severity.toUpperCase()}`);
    lines.push('');

    // 错误消息
    lines.push(chalk.gray('错误详情:'));
    lines.push(chalk.white('  ' + message.message));
    lines.push('');

    // 解决方案
    lines.push(chalk.gray('解决方案:'));
    const solutionLines = message.solution.split('\n');
    solutionLines.forEach(line => {
      lines.push(chalk.cyan('  ' + line));
    });
    lines.push('');

    // 文档链接
    if (message.docs) {
      lines.push(`${chalk.gray('文档链接:')} ${chalk.blue(message.docs)}`);
      lines.push('');
    }

    // 错误上下文（调试模式）
    if (process.env.INTENTBRIDGE_DEBUG === 'true') {
      lines.push(chalk.gray('调试信息:'));
      lines.push(chalk.gray('  时间: ') + this.context.timestamp);
      lines.push(chalk.gray('  命令: ') + this.context.command);
      lines.push(chalk.gray('  目录: ') + this.context.cwd);
      lines.push(chalk.gray('  Node: ') + this.context.nodeVersion);
      lines.push(chalk.gray('  平台: ') + this.context.platform);
      lines.push('');
    }

    // 可恢复和可重试提示
    if (this.recoverable || this.retryable) {
      const hints: string[] = [];
      if (this.recoverable) hints.push('✅ 此错误可恢复');
      if (this.retryable) hints.push('🔄 可以重试此操作');
      lines.push(chalk.green(hints.join(' | ')));
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * 生成 JSON 格式的错误报告
   */
  public toJSON(): object {
    const message = getErrorMessage(this.code);

    return {
      error: {
        code: this.code,
        name: this.name,
        message: this.message,
        severity: this.severity,
        category: this.category,
        recoverable: this.recoverable,
        retryable: this.retryable,
      },
      details: {
        title: message.title,
        description: message.message,
        solution: message.solution,
        docs: message.docs,
      },
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * 错误上下文信息
 */
export interface ErrorContext {
  timestamp: string;
  command: string;
  cwd: string;
  nodeVersion: string;
  platform: string;
  [key: string]: any;
}

/**
 * 错误处理器
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private language: Language = 'zh-CN';

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 设置语言
   */
  setLanguage(language: Language): void {
    this.language = language;
  }

  /**
   * 处理错误（打印并退出）
   */
  handle(error: Error | IntentBridgeError, exitCode: number = 1): never {
    if (error instanceof IntentBridgeError) {
      console.error(error.format(this.language));

      // 记录错误日志
      this.logError(error);

      // 如果不可恢复，提供更多帮助
      if (!error.recoverable) {
        console.log(chalk.yellow('\n💡 此错误需要手动修复后才能继续。'));
        console.log(chalk.gray('   请按照上述解决方案操作，然后重新运行命令。'));
        console.log();
      }

      // 如果可重试，提示重试
      if (error.retryable) {
        console.log(chalk.yellow('\n🔄 您可以尝试重新运行此命令。'));
        console.log();
      }
    } else {
      // 未知错误
      console.error(chalk.red('\n❌ 发生未知错误:\n'));
      console.error(chalk.white(error.message));
      console.error();

      if (error.stack && process.env.INTENTBRIDGE_DEBUG === 'true') {
        console.error(chalk.gray(error.stack));
        console.error();
      }

      // 记录未知错误
      this.logUnknownError(error);
    }

    process.exit(exitCode);
  }

  /**
   * 记录错误日志
   */
  private logError(error: IntentBridgeError): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      code: error.code,
      message: error.message,
      context: error.context,
      stack: error.stack,
    };

    // 写入日志文件（可以扩展为写入文件或发送到日志服务）
    if (process.env.INTENTBRIDGE_DEBUG === 'true') {
      console.error(chalk.gray('\n[DEBUG] Error logged:'));
      console.error(chalk.gray(JSON.stringify(logEntry, null, 2)));
    }

    // TODO: 写入日志文件
    // fs.appendFileSync('.intentbridge/error.log', JSON.stringify(logEntry) + '\n');
  }

  /**
   * 记录未知错误
   */
  private logUnknownError(error: Error): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      type: 'unknown',
      message: error.message,
      stack: error.stack,
    };

    if (process.env.INTENTBRIDGE_DEBUG === 'true') {
      console.error(chalk.gray('\n[DEBUG] Unknown error logged:'));
      console.error(chalk.gray(JSON.stringify(logEntry, null, 2)));
    }
  }
}

/**
 * 快捷函数：创建 IntentBridge 错误
 */
export function createError(
  code: ErrorCode,
  context?: Partial<ErrorContext>
): IntentBridgeError {
  return new IntentBridgeError(code, context);
}

/**
 * 快捷函数：抛出 IntentBridge 错误
 */
export function throwError(
  code: ErrorCode,
  context?: Partial<ErrorContext>
): never {
  throw new IntentBridgeError(code, context);
}

/**
 * 快捷函数：处理错误
 */
export function handleError(error: Error, exitCode?: number): never {
  ErrorHandler.getInstance().handle(error, exitCode);
}
