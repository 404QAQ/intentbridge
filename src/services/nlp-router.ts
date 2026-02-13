import { getAIConfig, callModel } from './ai-client.js';

export interface UserIntent {
  action: 'add' | 'list' | 'update' | 'delete' | 'status' | 'search' | 'analyze' | 'validate' | 'help';
  projectName?: string;
  targetType: 'requirement' | 'project' | 'milestone' | 'file' | 'global';
  params: Record<string, any>;
  originalPrompt: string;
}

/**
 * Parse user intent from natural language prompt
 */
export async function parseUserIntent(prompt: string): Promise<UserIntent> {
  // If AI is configured, use AI parsing
  if (getAIConfig()) {
    try {
      return await parseWithAI(prompt);
    } catch (e) {
      // Fall back to rule-based parsing
      console.error('AI parsing failed, using rule-based fallback');
    }
  }

  // Rule-based parsing fallback
  return parseWithRules(prompt);
}

/**
 * AI-powered intent parsing
 */
async function parseWithAI(prompt: string): Promise<UserIntent> {
  const aiPrompt = `分析用户指令，提取意图和参数。

用户指令: "${prompt}"

输出纯 JSON 格式：
{
  "action": "add|list|update|delete|status|search|analyze|validate|help",
  "projectName": "项目名称或 null",
  "targetType": "requirement|project|milestone|file|global",
  "params": {
    "title": "需求标题",
    "description": "描述",
    "requirementId": "REQ-ID",
    "status": "新状态",
    "tag": "标签",
    "keyword": "搜索关键词"
  }
}

示例:
"在 project-a 添加用户认证需求" → {"action":"add","projectName":"project-a","targetType":"requirement","params":{"title":"用户认证"}}
"查看 project-b 进度" → {"action":"status","projectName":"project-b","targetType":"project","params":{}}
"更新 REQ-001 为 done" → {"action":"update","projectName":null,"targetType":"requirement","params":{"requirementId":"REQ-001","status":"done"}}

只输出 JSON，不要其他内容。`;

  const response = await callModel(aiPrompt);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      ...parsed,
      originalPrompt: prompt,
    };
  } catch (e) {
    throw new Error('Failed to parse AI response');
  }
}

/**
 * Rule-based intent parsing
 */
function parseWithRules(prompt: string): UserIntent {
  const lower = prompt.toLowerCase();

  // Extract project name pattern: "在 project-x" or "project-x 的" or "project-x 中"
  const projectPattern = /(?:在\s+)?([a-zA-Z0-9_-]+)(?:\s+的|\s+中|\s+添加|\s+查看|\s+更新)?/i;
  const projectMatch = prompt.match(projectPattern);
  const projectName = projectMatch && projectMatch[1] !== 'REQ' ? projectMatch[1] : undefined;

  // Extract requirement ID
  const reqPattern = /REQ-\d+/i;
  const reqMatch = prompt.match(reqPattern);
  const requirementId = reqMatch ? reqMatch[0] : undefined;

  // Detect action
  let action: UserIntent['action'] = 'help';
  let targetType: UserIntent['targetType'] = 'global';

  if (lower.includes('添加') || lower.includes('创建') || lower.includes('新增')) {
    action = 'add';
    if (lower.includes('需求')) targetType = 'requirement';
    else if (lower.includes('项目')) targetType = 'project';
    else if (lower.includes('里程碑')) targetType = 'milestone';
    else targetType = 'requirement';
  } else if (lower.includes('查看') || lower.includes('列出') || lower.includes('显示')) {
    action = 'list';
    if (lower.includes('进度') || lower.includes('状态')) {
      action = 'status';
      targetType = projectName ? 'project' : 'global';
    } else if (lower.includes('需求')) {
      targetType = 'requirement';
    } else if (lower.includes('项目')) {
      targetType = 'project';
    }
  } else if (lower.includes('更新') || lower.includes('修改') || lower.includes('设置')) {
    action = 'update';
    if (requirementId) targetType = 'requirement';
    else if (lower.includes('项目')) targetType = 'project';
    else targetType = 'requirement';
  } else if (lower.includes('删除') || lower.includes('移除')) {
    action = 'delete';
    if (requirementId) targetType = 'requirement';
    else targetType = 'requirement';
  } else if (lower.includes('搜索') || lower.includes('查找') || lower.includes('寻找')) {
    action = 'search';
    targetType = 'requirement';
  } else if (lower.includes('分析')) {
    action = 'analyze';
    targetType = 'requirement';
  } else if (lower.includes('验证') || lower.includes('检查')) {
    action = 'validate';
    targetType = 'requirement';
  }

  // Extract title/description for add action
  const params: Record<string, any> = {};

  if (action === 'add' && targetType === 'requirement') {
    // Try to extract requirement title
    const titlePatterns = [
      /添加\s+(.+?)\s+需求/,
      /创建\s+(.+?)\s+需求/,
      /新增\s+(.+?)\s+需求/,
      /需要一个\s+(.+)/,
    ];

    for (const pattern of titlePatterns) {
      const match = prompt.match(pattern);
      if (match) {
        params.title = match[1].trim();
        break;
      }
    }

    // If no title found, use the entire prompt as description
    if (!params.title) {
      params.description = prompt;
    }
  }

  if (requirementId) {
    params.requirementId = requirementId;
  }

  // Extract status for update action
  if (action === 'update') {
    if (lower.includes('done') || lower.includes('完成')) {
      params.status = 'done';
    } else if (lower.includes('implementing') || lower.includes('实现中')) {
      params.status = 'implementing';
    } else if (lower.includes('active') || lower.includes('激活')) {
      params.status = 'active';
    } else if (lower.includes('draft') || lower.includes('草稿')) {
      params.status = 'draft';
    }
  }

  // Extract search keyword
  if (action === 'search') {
    const keywordPattern = /搜索\s+(.+?)(?:\s|$)/;
    const match = prompt.match(keywordPattern);
    if (match) {
      params.keyword = match[1].trim();
    }
  }

  return {
    action,
    projectName,
    targetType,
    params,
    originalPrompt: prompt,
  };
}

/**
 * Validate user intent
 */
export function validateIntent(intent: UserIntent): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate action
  const validActions = ['add', 'list', 'update', 'delete', 'status', 'search', 'analyze', 'validate', 'help'];
  if (!validActions.includes(intent.action)) {
    errors.push(`Invalid action: ${intent.action}`);
  }

  // Validate target type
  const validTargets = ['requirement', 'project', 'milestone', 'file', 'global'];
  if (!validTargets.includes(intent.targetType)) {
    errors.push(`Invalid target type: ${intent.targetType}`);
  }

  // Validate params based on action
  if (intent.action === 'add' && intent.targetType === 'requirement') {
    if (!intent.params.title && !intent.params.description) {
      errors.push('Requirement add needs title or description');
    }
  }

  if (intent.action === 'update' && intent.targetType === 'requirement') {
    if (!intent.params.requirementId) {
      errors.push('Requirement update needs requirementId');
    }
  }

  if (intent.action === 'search') {
    if (!intent.params.keyword) {
      errors.push('Search needs keyword');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
