export interface ProjectConfig {
  version: string;
  project: {
    name: string;
    description: string;
    tech_stack: string[];
    conventions: string[];
  };
}

export type RequirementStatus = 'draft' | 'active' | 'implementing' | 'done';
export type RequirementPriority = 'high' | 'medium' | 'low';

export interface Milestone {
  name: string;
  requirements: string[];
  status?: 'planned' | 'active' | 'completed';
  due_date?: string;
}

export interface Requirement {
  // === v2.4.0 字段（保持不变） ===
  id: string;
  title: string;
  description: string;
  status: RequirementStatus;
  priority: RequirementPriority;
  created: string;
  files: string[];
  notes?: Array<{ date: string; content: string }>;
  acceptance?: Array<{ criterion: string; done: boolean }>;
  depends_on?: string[];
  tags?: string[];

  // === v3.0.0 新增字段（可选，向后兼容） ===
  features?: Feature[];              // 功能拆分
  validation_rules?: ValidationRule[];  // 验证规则
  execution?: ExecutionStatus;        // 执行状态
  validation?: ValidationStatus;      // 验证状态
}

// v3 新增：功能拆分
export interface Feature {
  id: string;
  name: string;
  description: string;
  acceptance_criteria: string[];
  technical_constraints: string[];
  estimated_hours?: number;
  actual_hours?: number;
}

// v3 新增：验证规则
export interface ValidationRule {
  type: 'functional' | 'quality' | 'test' | 'performance';
  rule: string;
  threshold?: string;
}

// v3 新增：执行状态
export interface ExecutionStatus {
  status: 'pending' | 'in_progress' | 'done' | 'failed';
  assigned_to?: 'claude-code' | 'human';
  started_at?: string;
  completed_at?: string;
  progress?: number;  // 0-100
}

// v3 新增：验证状态
export interface ValidationStatus {
  status: 'pending' | 'passed' | 'failed' | 'needs_revision';
  match_score?: number;  // 0-1
  evidence?: Evidence[];
  report?: string;  // 验收报告路径
  validated_at?: string;
}

// v3 新增：证据
export interface Evidence {
  type: 'screenshot' | 'code_snippet' | 'test_result' | 'log' | 'documentation';
  description: string;
  path: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface RequirementsData {
  requirements: Requirement[];
  milestones?: Milestone[];
}

// === v3.0.0 新增：任务管理 ===

export type TaskType = 'frontend' | 'backend' | 'testing' | 'deployment';
export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'failed' | 'blocked';
export type TaskPriority = 'P0' | 'P1' | 'P2';

export interface Task {
  id: string;                        // T-001
  requirementId: string;             // REQ-001
  featureId?: string;                // F-001-1（可选）
  name: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedHours: number;
  actualHours?: number;

  // 依赖关系
  dependsOn: string[];               // Task IDs

  // 执行信息
  assignedTo?: 'claude-code' | 'human';
  startedAt?: string;
  completedAt?: string;

  // 质量指标
  qualityMetrics?: {
    codeQualityScore?: number;       // 0-100
    testCoverage?: number;           // 0-100
    issues: TaskIssue[];
  };

  // 执行日志
  executionLog?: Array<{
    timestamp: string;
    event: string;
    details?: string;
  }>;

  // 时间戳
  created: string;
  updated: string;
}

export interface TaskIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  file?: string;
  line?: number;
}

export interface TasksData {
  tasks: Task[];
  executionPlan?: ExecutionPlan;
}

export interface Dependency {
  from: string;                      // Task ID
  to: string;                        // Task ID
  type: 'hard' | 'soft';             // 硬依赖/软依赖
}

export interface DependencyGraph {
  nodes: Task[];
  edges: Dependency[];
  topologyOrder: string[];           // Task IDs in execution order
}

export interface ExecutionPlan {
  tasks: Task[];
  dependencyGraph: DependencyGraph;
  milestones: PlanMilestone[];
  estimatedTotalHours: number;
  ganttData?: GanttData;
  createdAt: string;
}

export interface PlanMilestone {
  name: string;
  tasks: string[];                   // Task IDs
  dueDate?: string;
  status: 'planned' | 'active' | 'completed';
}

export interface GanttData {
  tasks: Array<{
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    dependencies: string[];
  }>;
}

// === v3.0.0 Phase 3 新增：执行监督 ===

/**
 * 执行会话 - 代表一次 Claude Code 执行会话
 */
export interface ExecutionSession {
  sessionId: string;                  // 唯一会话 ID
  taskId: string;                     // 关联的任务 ID
  status: ExecutionSessionStatus;     // 会话状态
  startedAt: string;                  // 开始时间
  completedAt?: string;               // 完成时间

  // Claude Code 交互
  prompt: string;                     // 发送给 Claude Code 的提示
  response?: string;                  // Claude Code 的响应

  // 执行结果
  result?: ExecutionResult;           // 执行结果
  artifacts: ExecutionArtifact[];     // 生成的文件和代码

  // 监控数据
  metrics: ExecutionMetrics;          // 执行指标

  // 错误处理
  errors: ExecutionError[];           // 错误记录

  // 重试信息
  retryCount: number;                 // 重试次数
  maxRetries: number;                 // 最大重试次数
}

export type ExecutionSessionStatus =
  | 'pending'                         // 待执行
  | 'running'                         // 执行中
  | 'completed'                       // 已完成
  | 'failed'                          // 失败
  | 'timeout'                         // 超时
  | 'cancelled';                      // 已取消

/**
 * 执行结果
 */
export interface ExecutionResult {
  success: boolean;                   // 是否成功
  summary: string;                    // 结果摘要
  changes: FileChange[];              // 文件变更列表
  testResults?: TestResults;          // 测试结果
  qualityScore?: number;              // 质量评分 (0-100)
}

/**
 * 文件变更
 */
export interface FileChange {
  path: string;                       // 文件路径
  action: 'created' | 'modified' | 'deleted';
  linesAdded: number;                 // 新增行数
  linesDeleted: number;               // 删除行数
  diff?: string;                      // Diff 内容
}

/**
 * 测试结果
 */
export interface TestResults {
  total: number;                      // 总测试数
  passed: number;                     // 通过数
  failed: number;                     // 失败数
  skipped: number;                    // 跳过数
  coverage?: number;                  // 覆盖率 (0-100)
  details?: TestDetail[];             // 测试详情
}

export interface TestDetail {
  name: string;                       // 测试名称
  status: 'passed' | 'failed' | 'skipped';
  duration: number;                   // 执行时长 (ms)
  error?: string;                     // 错误信息
}

/**
 * 执行产物 - Claude Code 生成的文件
 */
export interface ExecutionArtifact {
  type: 'file' | 'code' | 'documentation' | 'test';
  path: string;                       // 文件路径
  content?: string;                   // 文件内容（可选）
  language?: string;                  // 编程语言
  size: number;                       // 文件大小（字节）
  checksum: string;                   // MD5 校验和
}

/**
 * 执行指标 - 性能和质量指标
 */
export interface ExecutionMetrics {
  duration: number;                   // 执行时长 (ms)
  tokensUsed: number;                 // 使用的 Token 数
  apiCalls: number;                   // API 调用次数
  filesGenerated: number;             // 生成的文件数
  linesOfCode: number;                // 代码行数
  complexity?: number;                // 代码复杂度
}

/**
 * 执行错误
 */
export interface ExecutionError {
  timestamp: string;                  // 发生时间
  type: 'syntax' | 'runtime' | 'timeout' | 'api' | 'unknown';
  message: string;                    // 错误信息
  stack?: string;                     // 堆栈跟踪
  recoverable: boolean;               // 是否可恢复
  retryAttempt?: number;              // 重试尝试次数
}

/**
 * 监督配置 - 执行监督的配置选项
 */
export interface SupervisionConfig {
  // 超时设置
  timeout: number;                    // 单个任务超时（秒）
  totalTimeout: number;               // 总超时（秒）

  // 重试策略
  maxRetries: number;                 // 最大重试次数
  retryDelay: number;                 // 重试延迟（秒）

  // 质量门槛
  minQualityScore: number;            // 最低质量评分
  minTestCoverage: number;            // 最低测试覆盖率

  // 并发控制
  maxConcurrentTasks: number;         // 最大并发任务数

  // 通知设置
  enableNotifications: boolean;       // 是否启用通知
  notifyOnProgress: boolean;          // 进度通知
  notifyOnCompletion: boolean;        // 完成通知
  notifyOnError: boolean;             // 错误通知
}

/**
 * 监督状态 - 当前监督的整体状态
 */
export interface SupervisionStatus {
  // 总体统计
  totalTasks: number;                 // 总任务数
  pendingTasks: number;               // 待执行任务数
  runningTasks: number;               // 执行中任务数
  completedTasks: number;             // 已完成任务数
  failedTasks: number;                // 失败任务数

  // 当前执行
  activeSessions: string[];           // 活跃会话 ID 列表

  // 时间统计
  estimatedTimeRemaining: number;     // 预计剩余时间（秒）
  averageTaskDuration: number;        // 平均任务时长（秒）

  // 质量统计
  averageQualityScore: number;        // 平均质量评分
  totalIssues: number;                // 总问题数

  // 系统状态
  systemHealth: 'healthy' | 'degraded' | 'critical';
  lastUpdate: string;                 // 最后更新时间
}

/**
 * WebSocket 消息 - 实时推送的消息格式
 */
export interface WebSocketMessage {
  type: WebSocketMessageType;
  timestamp: string;
  payload: any;
}

export type WebSocketMessageType =
  | 'task_started'                    // 任务开始
  | 'task_progress'                   // 任务进度
  | 'task_completed'                  // 任务完成
  | 'task_failed'                     // 任务失败
  | 'session_created'                 // 会话创建
  | 'session_update'                  // 会话更新
  | 'error_detected'                  // 错误检测
  | 'quality_alert'                   // 质量警告
  | 'system_status';                  // 系统状态

/**
 * 异常检测规则
 */
export interface AnomalyDetectionRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;

  // 检测条件
  condition: AnomalyCondition;

  // 响应动作
  actions: AnomalyAction[];

  // 优先级
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AnomalyCondition {
  type: 'timeout' | 'error_rate' | 'quality_drop' | 'performance' | 'custom';
  threshold: number;
  operator: '>' | '<' | '=' | '>=' | '<=';
  duration?: number;                  // 持续时间（秒）
}

export interface AnomalyAction {
  type: 'alert' | 'retry' | 'abort' | 'escalate' | 'custom';
  config?: Record<string, any>;
}

/**
 * MCP 工具定义 - Model Context Protocol 工具
 */
export interface MCPTool {
  name: string;                       // 工具名称
  description: string;                // 工具描述
  parameters: MCPParameter[];         // 参数列表
  handler: string;                    // 处理函数名称
}

export interface MCPParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  default?: any;
}

/**
 * 执行监督数据 - 持久化数据结构
 */
export interface ExecutionSupervisionData {
  sessions: ExecutionSession[];       // 执行会话列表
  status: SupervisionStatus;          // 监督状态
  config: SupervisionConfig;          // 监督配置
  anomalyRules: AnomalyDetectionRule[]; // 异常检测规则
}

/**
 * 验证检查清单项
 */
export interface ValidationChecklistItem {
  criterion: string;                  // 检查标准
  passed: boolean;                    // 是否通过
  details: string;                    // 详细说明
  evidenceIds: string[];              // 关联的证据ID
}

/**
 * 验证检查清单
 */
export interface ValidationChecklist {
  category: 'functional' | 'quality' | 'testing' | 'acceptance' | 'ui';
  items: ValidationChecklistItem[];
  score: number;                      // 该类别的得分 (0-1)
  passed: boolean;                    // 该类别是否通过
  evidence?: Evidence[];              // 相关证据
}

/**
 * 验证报告
 */
export interface ValidationReport {
  id: string;                         // 报告ID
  requirementId: string;              // 需求ID
  timestamp: string;                  // 验证时间
  status: ValidationStatus['status']; // 验证状态
  matchScore: number;                 // 总体匹配度 (0-1)
  checklists: {
    functional: ValidationChecklist;
    quality: ValidationChecklist;
    testing: ValidationChecklist;
    acceptance: ValidationChecklist;
    ui?: ValidationChecklist;
  };
  evidence: Evidence[];               // 所有证据
  summary: string;                    // 验证摘要
  recommendations: string[];          // 改进建议
}

/**
 * 验证结果
 */
export interface ValidationResult {
  requirementId: string;
  report: ValidationReport;
  needsRevision: boolean;
  revisionTasks?: string[];           // 需要修订的任务列表
}

// === v3.0.0 Phase 4 新增：硬验证质量门禁 ===

/**
 * 质量门禁配置
 */
export interface QualityGates {
  codeQuality: {
    complexity: number;               // 圈复杂度 ≤ 10
    duplication: number;              // 代码重复率 < 5%
    maintainability: string;          // 可维护性等级 ≥ 'B'
  };

  security: {
    hardcodedSecrets: number;         // 硬编码密钥数量 = 0
    sqlInjection: number;             // SQL 注入风险 = 0
    xssVulnerabilities: number;       // XSS 漏洞 = 0
    owaspTop10: 'pass' | 'fail';      // OWASP Top 10 检查
  };

  implementation: {
    emptyFunctions: number;           // 空函数数量 = 0
    todoComments: number;             // TODO 注释数量 = 0
    placeholderCode: boolean;         // 占位代码 = false
  };

  testing: {
    coverage: number;                 // 测试覆盖率 ≥ 80%
    passRate: number;                 // 测试通过率 = 100%
    e2eTests: boolean;                // 是否有端到端测试
  };
}

/**
 * 硬验证配置
 */
export interface HardValidationConfig {
  enableCodeAnalysis: boolean;        // 启用代码复杂度分析
  enableRuntimeValidation: boolean;   // 启用运行时验证
  enableSecurityScan: boolean;        // 启用安全扫描
  enableDesignComparison: boolean;    // 启用设计比较

  qualityGates: QualityGates;         // 质量门禁配置

  failOnViolation: boolean;           // 违反门禁时失败
  collectEvidence: boolean;           // 收集证据
}

/**
 * 硬验证结果
 */
export interface HardValidationResult {
  passed: boolean;
  overallScore: number;               // 0-100

  codeAnalysis?: {
    score: number;
    grade: string;
    issues: string[];
  };

  runtimeValidation?: {
    passed: boolean;
    testResults: any;
    coverage: number;
  };

  securityScan?: {
    passed: boolean;
    vulnerabilities: number;
    riskLevel: string;
  };

  designComparison?: {
    passed: boolean;
    compliance: number;
    gaps: string[];
  };

  gateViolations: string[];           // 违反的门禁列表
  evidence: Evidence[];               // 证据列表
  recommendations: string[];          // 改进建议
}
