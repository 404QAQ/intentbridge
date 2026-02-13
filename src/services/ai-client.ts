import type { Requirement } from '../models/types.js';

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'local';
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface StructuredUnderstanding {
  goal: string;
  constraints: string[];
  technical_approach: string;
  risks: string[];
  acceptance_criteria_suggestions: string[];
  implementation_steps: string[];
}

export interface ValidationResult {
  isComplete: boolean;
  completedCriteria: number[];
  missingCriteria: number[];
  issues: string[];
  suggestions: string[];
  completionScore: number;
}

export interface ImpactAnalysis {
  changedRequirement: string;
  directDependencies: string[];
  transitiveDependencies: string[];
  affectedFiles: string[];
  impactDepth: number;
  recommendation: string;
  suggestedSessionStrategy: 'NEW' | 'CONTINUE' | 'RESTORE';
}

let aiConfig: AIConfig | null = null;

export function setAIConfig(config: AIConfig): void {
  aiConfig = config;
}

export function getAIConfig(): AIConfig | null {
  return aiConfig;
}

/**
 * Call AI model with prompt
 */
export async function callModel(prompt: string): Promise<string> {
  if (!aiConfig) {
    throw new Error('AI not configured. Run `ib ai-config` first.');
  }

  const { provider, model, apiKey, baseUrl } = aiConfig;

  if (provider === 'openai') {
    return await callOpenAI(prompt, model, apiKey!, baseUrl);
  } else if (provider === 'anthropic') {
    return await callAnthropic(prompt, model, apiKey!, baseUrl);
  } else {
    // Local model (e.g., Ollama)
    return await callLocalModel(prompt, model, baseUrl);
  }
}

async function callOpenAI(
  prompt: string,
  model: string,
  apiKey: string,
  baseUrl?: string
): Promise<string> {
  const url = baseUrl || 'https://api.openai.com/v1/chat/completions';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(
  prompt: string,
  model: string,
  apiKey: string,
  baseUrl?: string
): Promise<string> {
  const url = baseUrl || 'https://api.anthropic.com/v1/messages';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callLocalModel(
  prompt: string,
  model: string,
  baseUrl?: string
): Promise<string> {
  const url = baseUrl || 'http://localhost:11434/api/generate';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Local model error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response;
}

/**
 * Generate structured understanding from requirement
 */
export async function generateAIUnderstanding(
  requirement: Requirement,
  projectContext: string
): Promise<StructuredUnderstanding> {
  const prompt = `你是一个资深技术架构师。分析以下需求，输出结构化理解。

## 需求
ID: ${requirement.id}
标题: ${requirement.title}
描述: ${requirement.description}
优先级: ${requirement.priority}
${requirement.notes?.length ? `已有决策:\n${requirement.notes.map(n => `- ${n.content}`).join('\n')}` : ''}

## 项目背景
${projectContext}

## 输出要求
输出纯 JSON 格式（不要 markdown 代码块），包含以下字段：
{
  "goal": "目标一句话（15字内）",
  "constraints": ["约束1", "约束2"],
  "technical_approach": "技术方案建议（50字内）",
  "risks": ["风险1", "风险2"],
  "acceptance_criteria_suggestions": ["建议验收标准1", "建议验收标准2"],
  "implementation_steps": ["步骤1", "步骤2", "步骤3"]
}

只输出 JSON，不要其他内容。`;

  const response = await callModel(prompt);

  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    // Return default structure if parsing fails
    return {
      goal: requirement.title,
      constraints: [],
      technical_approach: '需要人工分析',
      risks: [],
      acceptance_criteria_suggestions: [],
      implementation_steps: [],
    };
  }
}

/**
 * Validate requirement completion
 */
export async function validateCompletion(
  requirement: Requirement,
  codeContext: string
): Promise<ValidationResult> {
  const acceptanceList = requirement.acceptance?.map((a, i) =>
    `${i}. ${a.criterion} [${a.done ? '✓' : ' '}]`
  ).join('\n') || '无验收标准';

  const prompt = `你是一个代码审查专家。判断以下需求是否完成。

## 需求
标题: ${requirement.title}
描述: ${requirement.description}

## 验收标准
${acceptanceList}

## 相关代码
\`\`\`
${codeContext.substring(0, 3000)}
\`\`\`

## 输出要求
输出纯 JSON 格式：
{
  "isComplete": true/false,
  "completedCriteria": [0, 1],
  "missingCriteria": [2],
  "issues": ["问题1"],
  "suggestions": ["建议1"],
  "completionScore": 85
}

只输出 JSON。`;

  const response = await callModel(prompt);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    return {
      isComplete: false,
      completedCriteria: [],
      missingCriteria: requirement.acceptance?.map((_, i) => i) || [],
      issues: ['无法解析验证结果'],
      suggestions: [],
      completionScore: 0,
    };
  }
}

/**
 * Analyze change impact
 */
export async function analyzeImpact(
  requirement: Requirement,
  allRequirements: Requirement[],
  changedField: string
): Promise<ImpactAnalysis> {
  // Find direct dependencies
  const directDeps = requirement.depends_on || [];

  // Find transitive dependencies (requirements that depend on this one)
  const transitiveDeps: string[] = [];
  for (const req of allRequirements) {
    if (req.depends_on?.includes(requirement.id)) {
      transitiveDeps.push(req.id);
      // Recursively find dependents
      const subDependents = allRequirements.filter(r =>
        r.depends_on?.includes(req.id) && !transitiveDeps.includes(r.id)
      );
      transitiveDeps.push(...subDependents.map(r => r.id));
    }
  }

  // Affected files
  const affectedFiles = [...requirement.files];
  for (const depId of transitiveDeps) {
    const dep = allRequirements.find(r => r.id === depId);
    if (dep?.files) {
      affectedFiles.push(...dep.files);
    }
  }

  // Calculate impact depth
  const impactDepth = directDeps.length + transitiveDeps.length;

  // Generate recommendation
  let recommendation = '';
  let suggestedSessionStrategy: 'NEW' | 'CONTINUE' | 'RESTORE' = 'CONTINUE';

  if (impactDepth === 0) {
    recommendation = '此需求独立，变更影响小。可继续当前会话。';
    suggestedSessionStrategy = 'CONTINUE';
  } else if (impactDepth <= 3) {
    recommendation = `影响 ${impactDepth} 个相关需求。建议在当前会话处理。`;
    suggestedSessionStrategy = 'CONTINUE';
  } else {
    recommendation = `影响范围较大（${impactDepth} 个需求）。建议新建会话处理。`;
    suggestedSessionStrategy = 'NEW';
  }

  return {
    changedRequirement: requirement.id,
    directDependencies: directDeps,
    transitiveDependencies: transitiveDeps,
    affectedFiles: [...new Set(affectedFiles)],
    impactDepth,
    recommendation,
    suggestedSessionStrategy,
  };
}
