/**
 * IntentBridge 错误系统
 *
 * 统一导出所有错误相关的模块
 */

// 错误代码
export { ErrorCode, ErrorSeverity, ErrorCategory, ErrorMetadata } from './codes.js';

// 错误消息
export { getErrorMessage, Language, ErrorMessage } from './messages.js';

// 错误处理
export {
  IntentBridgeError,
  ErrorHandler,
  ErrorContext,
  createError,
  throwError,
  handleError,
} from './handler.js';
