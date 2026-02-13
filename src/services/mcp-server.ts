import { createServer, Server } from 'node:net';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { getIntentBridgeDir } from '../utils/paths.js';
import { readRequirements, addRequirement, addRequirementFromTemplate, updateRequirement } from './store.js';
import { generateRequirementUnderstanding } from './understanding-generator.js';
import { detectCurrentProject, resolveProjectContext } from './project-detector.js';
import type { Requirement } from '../models/types.js';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (params: any) => Promise<any>;
}

export interface MCPServerConfig {
  port: number;
  host: string;
}

let mcpServer: Server | null = null;
let serverConfig: MCPServerConfig = {
  port: 9527,
  host: 'localhost',
};

/**
 * Get MCP server status file path
 */
function getServerStatusPath(): string {
  return join(getIntentBridgeDir(), 'mcp-server-status.json');
}

/**
 * Update server status file
 */
function updateServerStatus(status: 'running' | 'stopped', config?: MCPServerConfig): void {
  const statusPath = getServerStatusPath();
  writeFileSync(statusPath, JSON.stringify({
    status,
    config: config || serverConfig,
    timestamp: new Date().toISOString(),
  }, null, 2), 'utf-8');
}

/**
 * Define available MCP tools
 */
function getMCPTools(): MCPTool[] {
  return [
    {
      name: 'add_requirement',
      description: 'Add a new requirement to the project',
      inputSchema: {
        type: 'object',
        properties: {
          project: {
            type: 'string',
            description: 'Project name (optional, auto-detected if not provided)',
          },
          title: {
            type: 'string',
            description: 'Requirement title',
          },
          description: {
            type: 'string',
            description: 'Requirement description',
          },
          priority: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
            description: 'Requirement priority',
          },
        },
        required: ['title'],
      },
      handler: async (params: any) => {
        const { project, title, description = '', priority = 'medium' } = params;

        // Resolve project context
        const context = resolveProjectContext(project);

        if (!context.project) {
          return {
            success: false,
            error: context.message || 'No project found',
          };
        }

        // Add requirement
        const req = addRequirement(title, description, priority, context.project.path);

        return {
          success: true,
          requirement: {
            id: req.id,
            title: req.title,
            status: req.status,
            priority: req.priority,
          },
        };
      },
    },

    {
      name: 'list_requirements',
      description: 'List all requirements in a project',
      inputSchema: {
        type: 'object',
        properties: {
          project: {
            type: 'string',
            description: 'Project name (optional)',
          },
          status: {
            type: 'string',
            enum: ['draft', 'active', 'implementing', 'done'],
            description: 'Filter by status',
          },
          tag: {
            type: 'string',
            description: 'Filter by tag',
          },
        },
      },
      handler: async (params: any) => {
        const { project, status, tag } = params;

        const context = resolveProjectContext(project);
        if (!context.project) {
          return {
            success: false,
            error: context.message || 'No project found',
          };
        }

        const data = readRequirements(context.project.path);
        let requirements = data.requirements;

        // Apply filters
        if (status) {
          requirements = requirements.filter(r => r.status === status);
        }
        if (tag) {
          requirements = requirements.filter(r => r.tags?.includes(tag));
        }

        return {
          success: true,
          requirements: requirements.map(r => ({
            id: r.id,
            title: r.title,
            status: r.status,
            priority: r.priority,
            tags: r.tags,
          })),
        };
      },
    },

    {
      name: 'get_requirement',
      description: 'Get detailed information about a requirement',
      inputSchema: {
        type: 'object',
        properties: {
          project: {
            type: 'string',
            description: 'Project name (optional)',
          },
          requirementId: {
            type: 'string',
            description: 'Requirement ID (e.g., REQ-001)',
          },
        },
        required: ['requirementId'],
      },
      handler: async (params: any) => {
        const { project, requirementId } = params;

        const context = resolveProjectContext(project);
        if (!context.project) {
          return {
            success: false,
            error: context.message || 'No project found',
          };
        }

        const data = readRequirements(context.project.path);
        const req = data.requirements.find(r => r.id === requirementId);

        if (!req) {
          return {
            success: false,
            error: `Requirement ${requirementId} not found`,
          };
        }

        // Generate understanding
        const understanding = generateRequirementUnderstanding(req, data.requirements);

        return {
          success: true,
          requirement: req,
          understanding,
        };
      },
    },

    {
      name: 'update_requirement_status',
      description: 'Update requirement status',
      inputSchema: {
        type: 'object',
        properties: {
          project: {
            type: 'string',
            description: 'Project name (optional)',
          },
          requirementId: {
            type: 'string',
            description: 'Requirement ID',
          },
          status: {
            type: 'string',
            enum: ['draft', 'active', 'implementing', 'done'],
            description: 'New status',
          },
        },
        required: ['requirementId', 'status'],
      },
      handler: async (params: any) => {
        const { project, requirementId, status } = params;

        const context = resolveProjectContext(project);
        if (!context.project) {
          return {
            success: false,
            error: context.message || 'No project found',
          };
        }

        updateRequirement(requirementId, { status: status as any }, context.project.path);

        return {
          success: true,
          message: `Requirement ${requirementId} status updated to ${status}`,
        };
      },
    },

    {
      name: 'detect_project',
      description: 'Detect current project based on working directory',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to check (optional, defaults to cwd)',
          },
        },
      },
      handler: async (params: any) => {
        const { path } = params;
        const project = detectCurrentProject(path);

        if (!project) {
          return {
            success: false,
            error: 'No project detected',
          };
        }

        return {
          success: true,
          project: {
            name: project.name,
            path: project.path,
            status: project.status,
          },
        };
      },
    },
  ];
}

/**
 * Handle MCP tool call
 */
async function handleToolCall(toolName: string, params: any): Promise<any> {
  const tools = getMCPTools();
  const tool = tools.find(t => t.name === toolName);

  if (!tool) {
    return {
      success: false,
      error: `Unknown tool: ${toolName}`,
    };
  }

  try {
    return await tool.handler(params);
  } catch (e: any) {
    return {
      success: false,
      error: e.message,
    };
  }
}

/**
 * Start MCP server
 */
export function startMCPServer(config?: Partial<MCPServerConfig>): Promise<void> {
  return new Promise((resolve, reject) => {
    if (mcpServer) {
      reject(new Error('MCP server is already running'));
      return;
    }

    if (config) {
      serverConfig = { ...serverConfig, ...config };
    }

    mcpServer = createServer((socket) => {
      let buffer = '';

      socket.on('data', (data) => {
        buffer += data.toString();

        // Try to parse complete JSON messages
        try {
          const message = JSON.parse(buffer);
          buffer = ''; // Clear buffer after successful parse

          // Handle message
          handleMessage(message, socket);
        } catch {
          // Incomplete JSON, keep buffering
        }
      });

      socket.on('error', (err) => {
        console.error('Socket error:', err.message);
      });
    });

    mcpServer.listen(serverConfig.port, serverConfig.host, () => {
      updateServerStatus('running', serverConfig);
      console.log(`MCP server started on ${serverConfig.host}:${serverConfig.port}`);
      resolve();
    });

    mcpServer.on('error', (err: any) => {
      updateServerStatus('stopped');
      reject(err);
    });
  });
}

/**
 * Handle incoming MCP message
 */
async function handleMessage(message: any, socket: any): Promise<void> {
  const { type, tool, params, id } = message;

  try {
    if (type === 'list_tools') {
      const tools = getMCPTools().map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      }));

      socket.write(JSON.stringify({
        id,
        type: 'tools_list',
        tools,
      }) + '\n');
    } else if (type === 'call_tool') {
      const result = await handleToolCall(tool, params);

      socket.write(JSON.stringify({
        id,
        type: 'tool_result',
        result,
      }) + '\n');
    } else {
      socket.write(JSON.stringify({
        id,
        type: 'error',
        error: `Unknown message type: ${type}`,
      }) + '\n');
    }
  } catch (e: any) {
    socket.write(JSON.stringify({
      id,
      type: 'error',
      error: e.message,
    }) + '\n');
  }
}

/**
 * Stop MCP server
 */
export function stopMCPServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!mcpServer) {
      resolve();
      return;
    }

    mcpServer.close((err) => {
      if (err) {
        reject(err);
      } else {
        mcpServer = null;
        updateServerStatus('stopped');
        resolve();
      }
    });
  });
}

/**
 * Get MCP server status
 */
export function getMCPServerStatus(): {
  running: boolean;
  config?: MCPServerConfig;
  timestamp?: string;
} {
  const statusPath = getServerStatusPath();

  if (!existsSync(statusPath)) {
    return { running: false };
  }

  try {
    const content = readFileSync(statusPath, 'utf-8');
    const status = JSON.parse(content);
    return {
      running: status.status === 'running',
      config: status.config,
      timestamp: status.timestamp,
    };
  } catch {
    return { running: false };
  }
}

/**
 * Get MCP tools list
 */
export function getMCPToolsList(): Array<{
  name: string;
  description: string;
  inputSchema: any;
}> {
  return getMCPTools().map(t => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  }));
}
