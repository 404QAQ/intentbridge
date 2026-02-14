/**
 * MCP Tools Implementation (MCP 工具实现)
 *
 * 功能：
 * 1. 定义标准化的 MCP 工具接口
 * 2. 实现文件操作工具
 * 3. 实现测试运行工具
 * 4. 实现代码质量检查工具
 * 5. 集成 Claude Code API
 *
 * v3.0.0 Phase 3.5 新增
 */

import { execSync, exec } from 'node:child_process';
import { promisify } from 'node:util';
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  statSync,
  readdirSync,
  unlinkSync,
  rmdirSync,
} from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { callModel, getAIConfig } from './ai-client.js';
import type { MCPTool, MCPParameter, ExecutionSession, ExecutionResult } from '../models/types.js';

const execAsync = promisify(exec);

/**
 * MCP 工具注册表
 */
const mcpToolsRegistry: Map<string, MCPToolHandler> = new Map();

/**
 * MCP 工具处理器类型
 */
export type MCPToolHandler = (params: Record<string, any>) => Promise<MCPToolResult>;

/**
 * MCP 工具执行结果
 */
export interface MCPToolResult {
  success: boolean;
  output?: string;
  error?: string;
  data?: any;
  artifacts?: string[];
}

/**
 * 注册 MCP 工具
 */
export function registerMCPTool(tool: MCPTool, handler: MCPToolHandler): void {
  mcpToolsRegistry.set(tool.name, handler);
  console.log(`[MCP] Registered tool: ${tool.name}`);
}

/**
 * 执行 MCP 工具
 */
export async function executeMCPTool(
  toolName: string,
  params: Record<string, any>
): Promise<MCPToolResult> {
  const handler = mcpToolsRegistry.get(toolName);

  if (!handler) {
    return {
      success: false,
      error: `Tool not found: ${toolName}`,
    };
  }

  try {
    const result = await handler(params);
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 获取所有已注册的 MCP 工具
 */
export function getRegisteredMCPTools(): string[] {
  return Array.from(mcpToolsRegistry.keys());
}

// ============================================
// 文件操作工具
// ============================================

/**
 * 工具：读取文件
 */
export const toolReadFile: MCPTool = {
  name: 'fs_read_file',
  description: '读取文件内容',
  parameters: [
    {
      name: 'path',
      type: 'string',
      required: true,
      description: '文件路径',
    },
  ],
  handler: 'handleReadFile',
};

async function handleReadFile(params: Record<string, any>): Promise<MCPToolResult> {
  try {
    if (!params.path) {
      return {
        success: false,
        error: 'Missing required parameter: path',
      };
    }

    if (!existsSync(params.path)) {
      return {
        success: false,
        error: `File not found: ${params.path}`,
      };
    }

    const content = readFileSync(params.path, 'utf-8');
    const stats = statSync(params.path);

    return {
      success: true,
      output: content,
      data: {
        path: params.path,
        size: stats.size,
        modified: stats.mtime,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 工具：写入文件
 */
export const toolWriteFile: MCPTool = {
  name: 'fs_write_file',
  description: '写入文件内容',
  parameters: [
    {
      name: 'path',
      type: 'string',
      required: true,
      description: '文件路径',
    },
    {
      name: 'content',
      type: 'string',
      required: true,
      description: '文件内容',
    },
  ],
  handler: 'handleWriteFile',
};

async function handleWriteFile(params: Record<string, any>): Promise<MCPToolResult> {
  try {
    // 确保目录存在
    const dir = dirname(params.path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(params.path, params.content, 'utf-8');

    return {
      success: true,
      output: `File written successfully: ${params.path}`,
      artifacts: [params.path],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 工具：创建目录
 */
export const toolCreateDirectory: MCPTool = {
  name: 'fs_create_directory',
  description: '创建目录',
  parameters: [
    {
      name: 'path',
      type: 'string',
      required: true,
      description: '目录路径',
    },
  ],
  handler: 'handleCreateDirectory',
};

async function handleCreateDirectory(params: Record<string, any>): Promise<MCPToolResult> {
  try {
    if (!existsSync(params.path)) {
      mkdirSync(params.path, { recursive: true });
    }

    return {
      success: true,
      output: `Directory created: ${params.path}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 工具：列出目录
 */
export const toolListDirectory: MCPTool = {
  name: 'fs_list_directory',
  description: '列出目录内容',
  parameters: [
    {
      name: 'path',
      type: 'string',
      required: true,
      description: '目录路径',
    },
  ],
  handler: 'handleListDirectory',
};

async function handleListDirectory(params: Record<string, any>): Promise<MCPToolResult> {
  try {
    if (!existsSync(params.path)) {
      return {
        success: false,
        error: `Directory not found: ${params.path}`,
      };
    }

    const items = readdirSync(params.path, { withFileTypes: true });
    const listing = items.map((item) => ({
      name: item.name,
      type: item.isDirectory() ? 'directory' : 'file',
    }));

    return {
      success: true,
      data: listing,
      output: JSON.stringify(listing, null, 2),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 工具：删除文件
 */
export const toolDeleteFile: MCPTool = {
  name: 'fs_delete_file',
  description: '删除文件',
  parameters: [
    {
      name: 'path',
      type: 'string',
      required: true,
      description: '文件路径',
    },
  ],
  handler: 'handleDeleteFile',
};

async function handleDeleteFile(params: Record<string, any>): Promise<MCPToolResult> {
  try {
    if (!existsSync(params.path)) {
      return {
        success: false,
        error: `File not found: ${params.path}`,
      };
    }

    unlinkSync(params.path);

    return {
      success: true,
      output: `File deleted: ${params.path}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// 测试运行工具
// ============================================

/**
 * 工具：运行测试
 */
export const toolRunTests: MCPTool = {
  name: 'test_run',
  description: '运行测试套件',
  parameters: [
    {
      name: 'command',
      type: 'string',
      required: true,
      description: '测试命令（如 npm test, pytest）',
    },
    {
      name: 'cwd',
      type: 'string',
      required: false,
      description: '工作目录',
    },
    {
      name: 'timeout',
      type: 'number',
      required: false,
      description: '超时时间（秒）',
      default: 300,
    },
  ],
  handler: 'handleRunTests',
};

async function handleRunTests(params: Record<string, any>): Promise<MCPToolResult> {
  try {
    const timeout = (params.timeout || 300) * 1000;

    const { stdout, stderr } = await execAsync(params.command, {
      cwd: params.cwd || process.cwd(),
      timeout,
      maxBuffer: 1024 * 1024 * 10, // 10MB
    });

    // 解析测试结果
    const result = parseTestOutput(stdout + stderr);

    return {
      success: result.success,
      output: stdout,
      error: stderr,
      data: result,
    };
  } catch (error: any) {
    // 即使测试失败，也可能有有用的输出
    const result = parseTestOutput(error.stdout + error.stderr);

    return {
      success: false,
      output: error.stdout,
      error: error.stderr || error.message,
      data: result,
    };
  }
}

/**
 * 解析测试输出
 */
function parseTestOutput(output: string): any {
  // 尝试解析常见的测试输出格式
  const result: any = {
    success: true,
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  // Jest 格式
  const jestMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+(?:failed|total)/);
  if (jestMatch) {
    result.passed = parseInt(jestMatch[1]);
    result.total = parseInt(jestMatch[2]) + result.passed;
    result.failed = result.total - result.passed;
    result.success = result.failed === 0;
    return result;
  }

  // Pytest 格式
  const pytestMatch = output.match(/(\d+)\s+passed/);
  if (pytestMatch) {
    result.passed = parseInt(pytestMatch[1]);
    const failedMatch = output.match(/(\d+)\s+failed/);
    result.failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    result.total = result.passed + result.failed;
    result.success = result.failed === 0;
    return result;
  }

  // Mocha 格式
  const mochaMatch = output.match(/(\d+)\s+passing/);
  if (mochaMatch) {
    result.passed = parseInt(mochaMatch[1]);
    const failingMatch = output.match(/(\d+)\s+failing/);
    result.failed = failingMatch ? parseInt(failingMatch[1]) : 0;
    result.total = result.passed + result.failed;
    result.success = result.failed === 0;
    return result;
  }

  return result;
}

// ============================================
// 代码质量检查工具
// ============================================

/**
 * 工具：运行 ESLint
 */
export const toolRunESLint: MCPTool = {
  name: 'quality_eslint',
  description: '运行 ESLint 代码检查',
  parameters: [
    {
      name: 'files',
      type: 'string',
      required: true,
      description: '文件或目录路径',
    },
    {
      name: 'config',
      type: 'string',
      required: false,
      description: 'ESLint 配置文件路径',
    },
    {
      name: 'fix',
      type: 'boolean',
      required: false,
      description: '是否自动修复问题',
      default: false,
    },
  ],
  handler: 'handleRunESLint',
};

async function handleRunESLint(params: Record<string, any>): Promise<MCPToolResult> {
  try {
    let command = `npx eslint ${params.files}`;
    if (params.config) {
      command += ` -c ${params.config}`;
    }
    if (params.fix) {
      command += ' --fix';
    }
    command += ' --format json';

    const { stdout } = await execAsync(command, {
      maxBuffer: 1024 * 1024 * 10,
    });

    const results = JSON.parse(stdout);
    const summary = {
      totalFiles: results.length,
      errorCount: results.reduce((sum: number, r: any) => sum + r.errorCount, 0),
      warningCount: results.reduce((sum: number, r: any) => sum + r.warningCount, 0),
      fixableErrorCount: results.reduce((sum: number, r: any) => sum + r.fixableErrorCount, 0),
      fixableWarningCount: results.reduce(
        (sum: number, r: any) => sum + r.fixableWarningCount,
        0
      ),
    };

    return {
      success: summary.errorCount === 0,
      data: summary,
      output: JSON.stringify(results, null, 2),
    };
  } catch (error: any) {
    // ESLint 在发现问题时会返回非零退出码
    try {
      const results = JSON.parse(error.stdout);
      const summary = {
        totalFiles: results.length,
        errorCount: results.reduce((sum: number, r: any) => sum + r.errorCount, 0),
        warningCount: results.reduce((sum: number, r: any) => sum + r.warningCount, 0),
      };

      return {
        success: false,
        data: summary,
        output: error.stdout,
        error: `Found ${summary.errorCount} errors and ${summary.warningCount} warnings`,
      };
    } catch {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

/**
 * 工具：运行 TypeScript 类型检查
 */
export const toolRunTypeCheck: MCPTool = {
  name: 'quality_typecheck',
  description: '运行 TypeScript 类型检查',
  parameters: [
    {
      name: 'project',
      type: 'string',
      required: false,
      description: 'tsconfig.json 路径',
      default: 'tsconfig.json',
    },
    {
      name: 'noEmit',
      type: 'boolean',
      required: false,
      description: '不生成输出文件',
      default: true,
    },
  ],
  handler: 'handleRunTypeCheck',
};

async function handleRunTypeCheck(params: Record<string, any>): Promise<MCPToolResult> {
  try {
    let command = 'npx tsc';
    if (params.project) {
      command += ` -p ${params.project}`;
    }
    if (params.noEmit !== false) {
      command += ' --noEmit';
    }

    const { stdout, stderr } = await execAsync(command);

    return {
      success: true,
      output: 'Type check passed with no errors',
      data: {
        errors: 0,
      },
    };
  } catch (error: any) {
    // 解析 TypeScript 错误
    const errors = error.stdout || error.stderr || '';
    const errorCount = (errors.match(/error TS\d+:/g) || []).length;

    return {
      success: false,
      output: errors,
      error: `Found ${errorCount} type errors`,
      data: {
        errors: errorCount,
      },
    };
  }
}

/**
 * 工具：运行 Python 代码检查
 */
export const toolRunPylint: MCPTool = {
  name: 'quality_pylint',
  description: '运行 Pylint Python 代码检查',
  parameters: [
    {
      name: 'files',
      type: 'string',
      required: true,
      description: '文件或目录路径',
    },
    {
      name: 'rcfile',
      type: 'string',
      required: false,
      description: 'Pylint 配置文件路径',
    },
  ],
  handler: 'handleRunPylint',
};

async function handleRunPylint(params: Record<string, any>): Promise<MCPToolResult> {
  try {
    let command = `pylint ${params.files}`;
    if (params.rcfile) {
      command += ` --rcfile=${params.rcfile}`;
    }
    command += ' --output-format=json';

    const { stdout } = await execAsync(command);

    const results = JSON.parse(stdout);
    const summary = {
      totalIssues: results.length,
      bySeverity: {
        fatal: results.filter((r: any) => r.type === 'fatal').length,
        error: results.filter((r: any) => r.type === 'error').length,
        warning: results.filter((r: any) => r.type === 'warning').length,
        convention: results.filter((r: any) => r.type === 'convention').length,
        refactor: results.filter((r: any) => r.type === 'refactor').length,
      },
    };

    return {
      success: summary.bySeverity.fatal === 0 && summary.bySeverity.error === 0,
      data: summary,
      output: JSON.stringify(results, null, 2),
    };
  } catch (error: any) {
    try {
      const results = JSON.parse(error.stdout);
      const summary = {
        totalIssues: results.length,
        bySeverity: {
          fatal: results.filter((r: any) => r.type === 'fatal').length,
          error: results.filter((r: any) => r.type === 'error').length,
        },
      };

      return {
        success: false,
        data: summary,
        output: error.stdout,
        error: `Found ${summary.bySeverity.fatal} fatal errors and ${summary.bySeverity.error} errors`,
      };
    } catch {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// ============================================
// Claude Code API 集成
// ============================================

/**
 * 工具：调用 Claude Code 生成代码
 */
export const toolClaudeGenerate: MCPTool = {
  name: 'claude_generate',
  description: '使用 Claude Code 生成代码',
  parameters: [
    {
      name: 'prompt',
      type: 'string',
      required: true,
      description: '生成提示',
    },
    {
      name: 'language',
      type: 'string',
      required: false,
      description: '编程语言',
      default: 'typescript',
    },
    {
      name: 'outputPath',
      type: 'string',
      required: false,
      description: '输出文件路径（可选）',
    },
  ],
  handler: 'handleClaudeGenerate',
};

async function handleClaudeGenerate(params: Record<string, any>): Promise<MCPToolResult> {
  try {
    if (!getAIConfig()) {
      return {
        success: false,
        error: 'AI not configured. Run `ib ai config` first.',
      };
    }

    const systemPrompt = `You are an expert programmer. Generate clean, efficient, and well-documented code.
Language: ${params.language || 'typescript'}
Best practices:
- Use modern syntax and features
- Include type annotations (if applicable)
- Add comments for complex logic
- Follow naming conventions
- Handle errors appropriately`;

    const fullPrompt = `${systemPrompt}\n\nTask: ${params.prompt}\n\nGenerate the code:`;

    const response = await callModel(fullPrompt);

    // 提取代码块
    const codeMatch = response.match(/```[\w]*\n([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1] : response;

    // 如果指定了输出路径，保存文件
    if (params.outputPath) {
      const dir = dirname(params.outputPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(params.outputPath, code, 'utf-8');

      return {
        success: true,
        output: code,
        artifacts: [params.outputPath],
        data: {
          language: params.language,
          lines: code.split('\n').length,
        },
      };
    }

    return {
      success: true,
      output: code,
      data: {
        language: params.language,
        lines: code.split('\n').length,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 工具：使用 Claude Code 分析代码
 */
export const toolClaudeAnalyze: MCPTool = {
  name: 'claude_analyze',
  description: '使用 Claude Code 分析代码',
  parameters: [
    {
      name: 'code',
      type: 'string',
      required: false,
      description: '代码内容',
    },
    {
      name: 'filePath',
      type: 'string',
      required: false,
      description: '文件路径（二选一）',
    },
    {
      name: 'task',
      type: 'string',
      required: true,
      description: '分析任务（如 review, explain, optimize）',
    },
  ],
  handler: 'handleClaudeAnalyze',
};

async function handleClaudeAnalyze(params: Record<string, any>): Promise<MCPToolResult> {
  try {
    if (!getAIConfig()) {
      return {
        success: false,
        error: 'AI not configured. Run `ib ai config` first.',
      };
    }

    let code = params.code;

    // 如果提供了文件路径，读取文件
    if (params.filePath && !code) {
      if (!existsSync(params.filePath)) {
        return {
          success: false,
          error: `File not found: ${params.filePath}`,
        };
      }
      code = readFileSync(params.filePath, 'utf-8');
    }

    if (!code) {
      return {
        success: false,
        error: 'No code provided for analysis',
      };
    }

    const prompt = `Analyze the following code and ${params.task}:\n\n\`\`\`\n${code}\n\`\`\`\n\nAnalysis:`;

    const response = await callModel(prompt);

    return {
      success: true,
      output: response,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// 初始化所有工具
// ============================================

/**
 * 初始化所有 MCP 工具
 */
export function initializeMCPTools(): void {
  console.log('[MCP] Initializing tools...');

  // 文件操作工具
  registerMCPTool(toolReadFile, handleReadFile);
  registerMCPTool(toolWriteFile, handleWriteFile);
  registerMCPTool(toolCreateDirectory, handleCreateDirectory);
  registerMCPTool(toolListDirectory, handleListDirectory);
  registerMCPTool(toolDeleteFile, handleDeleteFile);

  // 测试工具
  registerMCPTool(toolRunTests, handleRunTests);

  // 代码质量工具
  registerMCPTool(toolRunESLint, handleRunESLint);
  registerMCPTool(toolRunTypeCheck, handleRunTypeCheck);
  registerMCPTool(toolRunPylint, handleRunPylint);

  // Claude Code 工具
  registerMCPTool(toolClaudeGenerate, handleClaudeGenerate);
  registerMCPTool(toolClaudeAnalyze, handleClaudeAnalyze);

  console.log(`[MCP] Initialized ${mcpToolsRegistry.size} tools`);
}

/**
 * 获取工具定义列表（用于 MCP 协议）
 */
export function getMCPToolsList(): MCPTool[] {
  return [
    toolReadFile,
    toolWriteFile,
    toolCreateDirectory,
    toolListDirectory,
    toolDeleteFile,
    toolRunTests,
    toolRunESLint,
    toolRunTypeCheck,
    toolRunPylint,
    toolClaudeGenerate,
    toolClaudeAnalyze,
  ];
}
