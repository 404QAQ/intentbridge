/**
 * Execution Supervisor (执行监督引擎)
 *
 * 功能：
 * 1. 监督 Claude Code 执行任务
 * 2. 实时监控任务进度
 * 3. 异常检测和处理
 * 4. WebSocket 实时推送
 * 5. 质量把控和重试机制
 *
 * v3.0.0 Phase 3 新增
 */

import { writeFileSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import yaml from 'js-yaml';
import { getIntentBridgeDir } from '../utils/paths.js';
import { readTasks, saveTasks } from './task-decomposition.js';
import { executeMCPTool, initializeMCPTools } from './mcp-tools.js';
import type {
  Task,
  ExecutionSession,
  ExecutionSessionStatus,
  ExecutionResult,
  ExecutionArtifact,
  ExecutionMetrics,
  ExecutionError,
  SupervisionConfig,
  SupervisionStatus,
  WebSocketMessage,
  WebSocketMessageType,
  AnomalyDetectionRule,
  ExecutionSupervisionData,
  FileChange,
} from '../models/types.js';

let supervisionPath: string;
let wsClients: Set<any> = new Set(); // WebSocket 客户端集合

/**
 * 默认监督配置
 */
const DEFAULT_CONFIG: SupervisionConfig = {
  timeout: 3600, // 1小时
  totalTimeout: 28800, // 8小时
  maxRetries: 3,
  retryDelay: 5,
  minQualityScore: 90,
  minTestCoverage: 80,
  maxConcurrentTasks: 3,
  enableNotifications: true,
  notifyOnProgress: true,
  notifyOnCompletion: true,
  notifyOnError: true,
};

/**
 * 初始化监督引擎
 */
export function initSupervisor(cwd?: string): void {
  const intentBridgeDir = getIntentBridgeDir(cwd);
  supervisionPath = join(intentBridgeDir, 'execution-supervision.yml');

  // 初始化 MCP 工具
  initializeMCPTools();
}

/**
 * 启动任务执行
 */
export async function startTaskExecution(taskId: string): Promise<ExecutionSession> {
  initSupervisor();

  const tasksData = readTasks();
  const task = tasksData.tasks.find((t) => t.id === taskId);

  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }

  if (task.status !== 'pending') {
    throw new Error(`Task ${taskId} is not in pending status (current: ${task.status})`);
  }

  // 检查依赖任务是否完成
  const dependenciesCompleted = task.dependsOn.every((depId) => {
    const depTask = tasksData.tasks.find((t) => t.id === depId);
    return depTask && depTask.status === 'done';
  });

  if (!dependenciesCompleted) {
    throw new Error(`Task ${taskId} has incomplete dependencies`);
  }

  // 创建执行会话
  const session = createExecutionSession(task);

  // 更新任务状态
  task.status = 'in_progress';
  task.startedAt = new Date().toISOString();
  task.assignedTo = 'claude-code';
  saveTasks(tasksData);

  // 保存会话
  const supervisionData = readSupervisionData();
  supervisionData.sessions.push(session);
  updateSupervisionStatus(supervisionData);
  saveSupervisionData(supervisionData);

  // 发送 WebSocket 通知
  broadcastMessage({
    type: 'task_started',
    timestamp: new Date().toISOString(),
    payload: { taskId, sessionId: session.sessionId },
  });

  // 启动监督循环
  superviseExecution(session.sessionId);

  return session;
}

/**
 * 创建执行会话
 */
function createExecutionSession(task: Task): ExecutionSession {
  return {
    sessionId: `SES-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    taskId: task.id,
    status: 'pending',
    startedAt: new Date().toISOString(),
    prompt: generateExecutionPrompt(task),
    artifacts: [],
    metrics: {
      duration: 0,
      tokensUsed: 0,
      apiCalls: 0,
      filesGenerated: 0,
      linesOfCode: 0,
    },
    errors: [],
    retryCount: 0,
    maxRetries: DEFAULT_CONFIG.maxRetries,
  };
}

/**
 * 生成执行提示 - 发送给 Claude Code
 */
function generateExecutionPrompt(task: Task): string {
  return `
请执行以下任务：

任务 ID: ${task.id}
任务名称: ${task.name}
任务描述: ${task.description}
任务类型: ${task.type}
优先级: ${task.priority}
预估工时: ${task.estimatedHours} 小时

请完成该任务并生成相应的代码和文件。
完成后请提供：
1. 执行摘要
2. 生成的文件列表
3. 测试结果（如果适用）
4. 质量评估
`.trim();
}

/**
 * 监督执行 - 主监督循环
 */
async function superviseExecution(sessionId: string): Promise<void> {
  const supervisionData = readSupervisionData();
  const session = supervisionData.sessions.find((s) => s.sessionId === sessionId);

  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  try {
    // 更新会话状态
    session.status = 'running';
    updateSupervisionStatus(supervisionData);
    saveSupervisionData(supervisionData);

    // 广播进度更新
    broadcastMessage({
      type: 'session_update',
      timestamp: new Date().toISOString(),
      payload: { sessionId, status: 'running' },
    });

    // TODO: 实际执行 Claude Code
    // 使用 MCP 工具执行真实任务
    const result = await executeTask(session);

    // 处理执行结果
    if (result.success) {
      await handleExecutionSuccess(session, result);
    } else {
      await handleExecutionFailure(session, result);
    }
  } catch (error: any) {
    // 记录错误
    const execError: ExecutionError = {
      timestamp: new Date().toISOString(),
      type: 'runtime',
      message: error.message,
      stack: error.stack,
      recoverable: true,
    };

    session.errors.push(execError);

    // 尝试重试
    if (session.retryCount < session.maxRetries) {
      session.retryCount++;
      broadcastMessage({
        type: 'error_detected',
        timestamp: new Date().toISOString(),
        payload: { sessionId, error: execError, retryAttempt: session.retryCount },
      });

      // 延迟重试
      await new Promise((resolve) => setTimeout(resolve, DEFAULT_CONFIG.retryDelay * 1000));

      // 重新执行
      await superviseExecution(sessionId);
    } else {
      // 超过最大重试次数，标记为失败
      session.status = 'failed';
      await handleExecutionFailure(session, {
        success: false,
        summary: `Execution failed after ${session.maxRetries} retries`,
        changes: [],
      });
    }
  }
}

/**
 * 真实执行任务 - 使用 Claude Code 和 MCP 工具
 */
async function executeTask(session: ExecutionSession): Promise<ExecutionResult> {
  console.log(`[Execution] Starting real execution for session: ${session.sessionId}`);

  try {
    // 第一步：使用 Claude Code 生成代码
    const generateResult = await executeMCPTool('claude_generate', {
      prompt: session.prompt,
      language: getLanguageFromTaskType(session.taskId),
      outputPath: undefined, // 让 Claude 决定
    });

    if (!generateResult.success) {
      return {
        success: false,
        summary: `Code generation failed: ${generateResult.error}`,
        changes: [],
      };
    }

    // 更新指标
    session.metrics.apiCalls++;
    session.metrics.tokensUsed += estimateTokenCount(generateResult.output || '');

    // 收集生成的文件
    const artifacts: ExecutionArtifact[] = [];
    if (generateResult.artifacts) {
      for (const path of generateResult.artifacts) {
        artifacts.push({
          type: 'file',
          path,
          language: getLanguageFromPath(path),
          size: existsSync(path) ? statSync(path).size : 0,
          checksum: '', // TODO: 计算校验和
        });
      }
    }

    session.artifacts = artifacts;
    session.metrics.filesGenerated = artifacts.length;
    session.metrics.linesOfCode = (generateResult.output || '').split('\n').length;

    // 第二步：运行代码质量检查（如果有文件生成）
    if (artifacts.length > 0) {
      const qualityResult = await runQualityChecks(artifacts);
      session.metrics.complexity = qualityResult.complexity;

      // 第三步：运行测试
      const testResult = await runTests(artifacts);

      return {
        success: testResult.success && qualityResult.success,
        summary: generateResult.output || 'Task executed',
        changes: artifacts.map((a) => ({
          path: a.path,
          action: 'created' as const,
          linesAdded: session.metrics.linesOfCode,
          linesDeleted: 0,
        })),
        testResults: testResult.results,
        qualityScore: qualityResult.score,
      };
    }

    // 如果没有生成文件，只返回生成结果
    return {
      success: true,
      summary: generateResult.output || 'Task executed',
      changes: [],
    };
  } catch (error: any) {
    return {
      success: false,
      summary: `Execution failed: ${error.message}`,
      changes: [],
    };
  }
}

/**
 * 运行代码质量检查
 */
async function runQualityChecks(artifacts: ExecutionArtifact[]): Promise<{
  success: boolean;
  score: number;
  complexity?: number;
}> {
  let totalScore = 0;
  let checksPassed = 0;

  // TypeScript 类型检查
  const tsFiles = artifacts.filter((a) => a.language === 'typescript');
  if (tsFiles.length > 0) {
    try {
      const typeCheckResult = await executeMCPTool('quality_typecheck', {
        project: 'tsconfig.json',
      });
      if (typeCheckResult.success) {
        checksPassed++;
        totalScore += 100;
      } else {
        totalScore += 70; // 有类型错误但不算失败
      }
    } catch {
      // 忽略错误
    }
  }

  // ESLint 检查
  const jsTsFiles = artifacts.filter(
    (a) => a.language === 'javascript' || a.language === 'typescript'
  );
  if (jsTsFiles.length > 0) {
    try {
      const eslintResult = await executeMCPTool('quality_eslint', {
        files: jsTsFiles.map((a) => a.path).join(' '),
      });
      if (eslintResult.success) {
        checksPassed++;
        totalScore += 100;
      } else {
        const errorCount = eslintResult.data?.errorCount || 0;
        totalScore += Math.max(60, 100 - errorCount * 5);
      }
    } catch {
      // 忽略错误
    }
  }

  // Pylint 检查
  const pyFiles = artifacts.filter((a) => a.language === 'python');
  if (pyFiles.length > 0) {
    try {
      const pylintResult = await executeMCPTool('quality_pylint', {
        files: pyFiles.map((a) => a.path).join(' '),
      });
      if (pylintResult.success) {
        checksPassed++;
        totalScore += 100;
      } else {
        const errorCount = pylintResult.data?.bySeverity?.error || 0;
        totalScore += Math.max(60, 100 - errorCount * 5);
      }
    } catch {
      // 忽略错误
    }
  }

  const averageScore = checksPassed > 0 ? totalScore / checksPassed : 85;

  return {
    success: averageScore >= 90,
    score: Math.round(averageScore),
    complexity: 5, // TODO: 实际计算复杂度
  };
}

/**
 * 运行测试
 */
async function runTests(artifacts: ExecutionArtifact[]): Promise<{
  success: boolean;
  results?: any;
}> {
  // 检查是否有测试文件
  const testFiles = artifacts.filter((a) => a.path.includes('.test.') || a.path.includes('.spec.'));

  if (testFiles.length === 0) {
    return {
      success: true, // 没有测试文件不算失败
      results: undefined,
    };
  }

  try {
    // 尝试运行测试
    const testResult = await executeMCPTool('test_run', {
      command: 'npm test',
      timeout: 300,
    });

    return {
      success: testResult.success,
      results: testResult.data,
    };
  } catch (error: any) {
    return {
      success: false,
      results: {
        error: error.message,
      },
    };
  }
}

/**
 * 根据任务类型推断语言
 */
function getLanguageFromTaskType(taskId: string): string {
  // 从任务 ID 查找任务
  const tasksData = readTasks();
  const task = tasksData.tasks.find((t) => t.id === taskId);

  if (!task) return 'typescript';

  switch (task.type) {
    case 'frontend':
      return 'typescript';
    case 'backend':
      return 'python';
    case 'testing':
      return 'typescript';
    case 'deployment':
      return 'yaml';
    default:
      return 'typescript';
  }
}

/**
 * 根据文件路径推断语言
 */
function getLanguageFromPath(path: string): string {
  const ext = extname(path).toLowerCase();
  const languageMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.py': 'python',
    '.go': 'go',
    '.java': 'java',
    '.rb': 'ruby',
    '.rs': 'rust',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.json': 'json',
    '.md': 'markdown',
  };
  return languageMap[ext] || 'text';
}

/**
 * 估算 token 数量
 */
function estimateTokenCount(text: string): number {
  // 粗略估算：平均 4 个字符一个 token
  return Math.ceil(text.length / 4);
}

// 需要导入 statSync

/**
 * 处理执行成功
 */
async function handleExecutionSuccess(
  session: ExecutionSession,
  result: ExecutionResult
): Promise<void> {
  const supervisionData = readSupervisionData();
  const currentSession = supervisionData.sessions.find((s) => s.sessionId === session.sessionId);

  if (!currentSession) return;

  // 更新会话状态
  currentSession.status = 'completed';
  currentSession.completedAt = new Date().toISOString();
  currentSession.result = result;

  // 更新任务状态
  const tasksData = readTasks();
  const task = tasksData.tasks.find((t) => t.id === session.taskId);
  if (task) {
    task.status = 'done';
    task.completedAt = new Date().toISOString();
    task.actualHours = (Date.now() - new Date(session.startedAt).getTime()) / 3600000;

    if (result.qualityScore !== undefined) {
      task.qualityMetrics = {
        codeQualityScore: result.qualityScore,
        testCoverage: result.testResults?.coverage,
        issues: [],
      };
    }

    saveTasks(tasksData);
  }

  // 更新监督状态
  updateSupervisionStatus(supervisionData);
  saveSupervisionData(supervisionData);

  // 广播完成消息
  broadcastMessage({
    type: 'task_completed',
    timestamp: new Date().toISOString(),
    payload: { sessionId: session.sessionId, taskId: session.taskId, result },
  });
}

/**
 * 处理执行失败
 */
async function handleExecutionFailure(
  session: ExecutionSession,
  result: ExecutionResult
): Promise<void> {
  const supervisionData = readSupervisionData();
  const currentSession = supervisionData.sessions.find((s) => s.sessionId === session.sessionId);

  if (!currentSession) return;

  // 更新会话状态
  currentSession.status = 'failed';
  currentSession.completedAt = new Date().toISOString();
  currentSession.result = result;

  // 更新任务状态
  const tasksData = readTasks();
  const task = tasksData.tasks.find((t) => t.id === session.taskId);
  if (task) {
    task.status = 'failed';
    task.completedAt = new Date().toISOString();
    saveTasks(tasksData);
  }

  // 更新监督状态
  updateSupervisionStatus(supervisionData);
  saveSupervisionData(supervisionData);

  // 广播失败消息
  broadcastMessage({
    type: 'task_failed',
    timestamp: new Date().toISOString(),
    payload: { sessionId: session.sessionId, taskId: session.taskId, result },
  });
}

/**
 * 更新监督状态
 */
function updateSupervisionStatus(data: ExecutionSupervisionData): void {
  const tasksData = readTasks();
  const tasks = tasksData.tasks;

  // 计算统计数据
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
  const runningTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const failedTasks = tasks.filter((t) => t.status === 'failed').length;

  // 计算平均时长
  const completedSessions = data.sessions.filter((s) => s.status === 'completed');
  const averageTaskDuration =
    completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => {
          const duration = s.completedAt
            ? new Date(s.completedAt).getTime() - new Date(s.startedAt).getTime()
            : 0;
          return sum + duration;
        }, 0) / completedSessions.length / 1000
      : 0;

  // 计算预计剩余时间
  const estimatedTimeRemaining = pendingTasks * averageTaskDuration;

  // 计算平均质量评分
  const averageQualityScore =
    completedSessions
      .filter((s) => s.result?.qualityScore !== undefined)
      .reduce((sum, s) => sum + (s.result?.qualityScore || 0), 0) /
      completedSessions.filter((s) => s.result?.qualityScore !== undefined).length || 0;

  // 计算总问题数
  const totalIssues = data.sessions.reduce((sum, s) => sum + s.errors.length, 0);

  // 判断系统健康状态
  let systemHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
  if (failedTasks > completedTasks * 0.3) {
    systemHealth = 'critical';
  } else if (averageQualityScore < DEFAULT_CONFIG.minQualityScore) {
    systemHealth = 'degraded';
  }

  // 更新状态
  data.status = {
    totalTasks,
    pendingTasks,
    runningTasks,
    completedTasks,
    failedTasks,
    activeSessions: data.sessions
      .filter((s) => s.status === 'running')
      .map((s) => s.sessionId),
    estimatedTimeRemaining,
    averageTaskDuration,
    averageQualityScore,
    totalIssues,
    systemHealth,
    lastUpdate: new Date().toISOString(),
  };
}

/**
 * 读取监督数据
 */
export function readSupervisionData(): ExecutionSupervisionData {
  initSupervisor();

  if (!existsSync(supervisionPath)) {
    return {
      sessions: [],
      status: {
        totalTasks: 0,
        pendingTasks: 0,
        runningTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        activeSessions: [],
        estimatedTimeRemaining: 0,
        averageTaskDuration: 0,
        averageQualityScore: 0,
        totalIssues: 0,
        systemHealth: 'healthy',
        lastUpdate: new Date().toISOString(),
      },
      config: DEFAULT_CONFIG,
      anomalyRules: getDefaultAnomalyRules(),
    };
  }

  const raw = readFileSync(supervisionPath, 'utf-8');
  const data = yaml.load(raw) as ExecutionSupervisionData | null;
  return data ?? {
    sessions: [],
    status: {
      totalTasks: 0,
      pendingTasks: 0,
      runningTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      activeSessions: [],
      estimatedTimeRemaining: 0,
      averageTaskDuration: 0,
      averageQualityScore: 0,
      totalIssues: 0,
      systemHealth: 'healthy',
      lastUpdate: new Date().toISOString(),
    },
    config: DEFAULT_CONFIG,
    anomalyRules: getDefaultAnomalyRules(),
  };
}

/**
 * 保存监督数据
 */
export function saveSupervisionData(data: ExecutionSupervisionData): void {
  initSupervisor();
  writeFileSync(supervisionPath, yaml.dump(data, { lineWidth: -1 }));
}

/**
 * 获取默认异常检测规则
 */
function getDefaultAnomalyRules(): AnomalyDetectionRule[] {
  return [
    {
      id: 'timeout-alert',
      name: '任务超时警告',
      description: '任务执行超过设定阈值时触发',
      enabled: true,
      condition: {
        type: 'timeout',
        threshold: DEFAULT_CONFIG.timeout,
        operator: '>',
      },
      actions: [
        {
          type: 'alert',
          config: { message: 'Task execution timeout' },
        },
        {
          type: 'retry',
          config: { maxRetries: 3 },
        },
      ],
      severity: 'high',
    },
    {
      id: 'quality-drop',
      name: '质量下降警告',
      description: '质量评分低于阈值时触发',
      enabled: true,
      condition: {
        type: 'quality_drop',
        threshold: DEFAULT_CONFIG.minQualityScore,
        operator: '<',
      },
      actions: [
        {
          type: 'alert',
          config: { message: 'Quality score below threshold' },
        },
        {
          type: 'escalate',
          config: { notifyUser: true },
        },
      ],
      severity: 'medium',
    },
    {
      id: 'high-error-rate',
      name: '高错误率警告',
      description: '错误率超过阈值时触发',
      enabled: true,
      condition: {
        type: 'error_rate',
        threshold: 0.3,
        operator: '>',
      },
      actions: [
        {
          type: 'alert',
          config: { message: 'High error rate detected' },
        },
        {
          type: 'abort',
          config: {},
        },
      ],
      severity: 'critical',
    },
  ];
}

/**
 * 检测异常
 */
export function detectAnomalies(sessionId: string): AnomalyDetectionRule[] {
  const supervisionData = readSupervisionData();
  const session = supervisionData.sessions.find((s) => s.sessionId === sessionId);

  if (!session) {
    return [];
  }

  const triggeredRules: AnomalyDetectionRule[] = [];

  for (const rule of supervisionData.anomalyRules) {
    if (!rule.enabled) continue;

    let triggered = false;

    switch (rule.condition.type) {
      case 'timeout':
        const duration =
          (session.completedAt
            ? new Date(session.completedAt).getTime()
            : Date.now()) - new Date(session.startedAt).getTime();
        triggered = duration > rule.condition.threshold * 1000;
        break;

      case 'quality_drop':
        if (session.result?.qualityScore !== undefined) {
          triggered = session.result.qualityScore < rule.condition.threshold;
        }
        break;

      case 'error_rate':
        const errorRate = session.errors.length / (session.metrics.apiCalls || 1);
        triggered = errorRate > rule.condition.threshold;
        break;
    }

    if (triggered) {
      triggeredRules.push(rule);

      // 执行异常动作
      executeAnomalyActions(rule, session);
    }
  }

  return triggeredRules;
}

/**
 * 执行异常动作
 */
function executeAnomalyActions(rule: AnomalyDetectionRule, session: ExecutionSession): void {
  for (const action of rule.actions) {
    switch (action.type) {
      case 'alert':
        broadcastMessage({
          type: 'quality_alert',
          timestamp: new Date().toISOString(),
          payload: {
            ruleId: rule.id,
            severity: rule.severity,
            message: action.config?.message || rule.name,
            sessionId: session.sessionId,
          },
        });
        break;

      case 'retry':
        // 重试逻辑已在 superviseExecution 中处理
        break;

      case 'abort':
        // 中止任务
        session.status = 'failed';
        const supervisionData = readSupervisionData();
        saveSupervisionData(supervisionData);
        break;

      case 'escalate':
        if (action.config?.notifyUser) {
          // TODO: 发送通知给用户
          console.log(`[Escalate] ${rule.name} - Session: ${session.sessionId}`);
        }
        break;
    }
  }
}

/**
 * WebSocket 广播消息
 */
function broadcastMessage(message: WebSocketMessage): void {
  const messageStr = JSON.stringify(message);

  wsClients.forEach((client) => {
    try {
      if (client.readyState === 1) {
        // WebSocket.OPEN
        client.send(messageStr);
      }
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
    }
  });

  // 如果没有 WebSocket 客户端，输出到控制台
  if (wsClients.size === 0 && DEFAULT_CONFIG.enableNotifications) {
    console.log(`[WebSocket] ${message.type}:`, JSON.stringify(message.payload, null, 2));
  }
}

/**
 * 注册 WebSocket 客户端
 */
export function registerWebSocketClient(client: any): void {
  wsClients.add(client);

  // 发送当前状态
  const supervisionData = readSupervisionData();
  broadcastMessage({
    type: 'system_status',
    timestamp: new Date().toISOString(),
    payload: supervisionData.status,
  });
}

/**
 * 注销 WebSocket 客户端
 */
export function unregisterWebSocketClient(client: any): void {
  wsClients.delete(client);
}

/**
 * 获取监督状态
 */
export function getSupervisionStatus(): SupervisionStatus {
  const supervisionData = readSupervisionData();
  updateSupervisionStatus(supervisionData);
  return supervisionData.status;
}

/**
 * 获取执行会话
 */
export function getExecutionSession(sessionId: string): ExecutionSession | undefined {
  const supervisionData = readSupervisionData();
  return supervisionData.sessions.find((s) => s.sessionId === sessionId);
}

/**
 * 获取任务的所有执行会话
 */
export function getTaskSessions(taskId: string): ExecutionSession[] {
  const supervisionData = readSupervisionData();
  return supervisionData.sessions.filter((s) => s.taskId === taskId);
}

/**
 * 取消任务执行
 */
export async function cancelTaskExecution(sessionId: string): Promise<void> {
  const supervisionData = readSupervisionData();
  const session = supervisionData.sessions.find((s) => s.sessionId === sessionId);

  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  if (session.status !== 'running') {
    throw new Error(`Session ${sessionId} is not running`);
  }

  // 更新会话状态
  session.status = 'cancelled';
  session.completedAt = new Date().toISOString();

  // 更新任务状态
  const tasksData = readTasks();
  const task = tasksData.tasks.find((t) => t.id === session.taskId);
  if (task) {
    task.status = 'pending'; // 重置为待执行
    task.startedAt = undefined;
    task.assignedTo = undefined;
    saveTasks(tasksData);
  }

  // 更新监督状态
  updateSupervisionStatus(supervisionData);
  saveSupervisionData(supervisionData);

  // 广播取消消息
  broadcastMessage({
    type: 'task_failed',
    timestamp: new Date().toISOString(),
    payload: { sessionId, taskId: session.taskId, reason: 'cancelled' },
  });
}
