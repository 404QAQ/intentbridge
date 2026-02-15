/**
 * Requirement Co-Creation Engine (需求共创引擎)
 *
 * 功能：
 * 1. 多轮对话管理
 * 2. 需求澄清算法
 * 3. 自动生成 PRD
 *
 * v3.0.0 新增
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { callModel, getAIConfig } from './ai-client.js';
import { getIntentBridgeDir } from '../utils/paths.js';
import type { Requirement, Feature } from '../models/types.js';

// 对话消息
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// 对话会话
export interface Conversation {
  id: string;
  userId: string;
  status: 'active' | 'completed';
  messages: Message[];
  extractedRequirements: Partial<Requirement>[];
  createdAt: string;
  updatedAt: string;
}

// 模糊检测结果
export interface AmbiguityReport {
  hasAmbiguity: boolean;
  ambiguities: Array<{
    type: 'vague' | 'conflict' | 'missing';
    description: string;
    suggestion: string;
  }>;
  clarificationQuestions: string[];
}

// PRD 文档
export interface PRDDocument {
  id: string;
  version: string;
  title: string;
  description: string;
  features: Feature[];
  acceptanceCriteria: Array<{
    criterion: string;
    priority: 'must' | 'should' | 'could';
  }>;
  technicalConstraints: string[];
  dependencies: string[];
  createdAt: string;
}

let conversationsDir: string;

/**
 * 初始化引擎
 */
export function initEngine(cwd?: string): void {
  const intentBridgeDir = getIntentBridgeDir(cwd);
  conversationsDir = join(intentBridgeDir, 'conversations');

  if (!existsSync(conversationsDir)) {
    mkdirSync(conversationsDir, { recursive: true });
  }
}

/**
 * 开始新的对话会话
 */
export async function startConversation(userId: string = 'default'): Promise<Conversation> {
  initEngine();

  const conversation: Conversation = {
    id: `C-${Date.now()}`,
    userId,
    status: 'active',
    messages: [],
    extractedRequirements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 添加系统欢迎消息
  const welcomeMessage: Message = {
    role: 'assistant',
    content: `🎯 欢迎使用 IntentBridge 需求共创系统！

我是您的需求分析助手，将帮助您：
1. 澄清和细化需求
2. 识别潜在问题
3. 生成完整的产品需求文档

请描述您想要实现的功能或需求：`,
    timestamp: new Date().toISOString(),
  };

  conversation.messages.push(welcomeMessage);

  // 保存对话
  saveConversation(conversation);

  return conversation;
}

/**
 * 处理用户输入
 */
export async function processUserInput(
  conversationId: string,
  userInput: string
): Promise<{
  conversation: Conversation;
  response: string;
  needsClarification: boolean;
  canGeneratePRD: boolean;
}> {
  const conversation = loadConversation(conversationId);

  if (!conversation) {
    throw new Error(`Conversation ${conversationId} not found`);
  }

  // 添加用户消息
  const userMessage: Message = {
    role: 'user',
    content: userInput,
    timestamp: new Date().toISOString(),
  };
  conversation.messages.push(userMessage);

  // 检测是否需要澄清
  const ambiguityReport = await detectAmbiguity(userInput, conversation);

  let response: string;
  let needsClarification = false;
  let canGeneratePRD = false;

  if (ambiguityReport.hasAmbiguity) {
    // 需要澄清
    needsClarification = true;
    response = await generateClarificationResponse(ambiguityReport);
  } else {
    // 提取需求
    const extracted = await extractRequirements(userInput, conversation);
    conversation.extractedRequirements.push(extracted);

    // 检查是否可以生成 PRD
    canGeneratePRD = conversation.extractedRequirements.length >= 1 && conversation.messages.length >= 3;

    if (canGeneratePRD) {
      response = `✅ 需求已充分理解！

我已收集到以下信息：
${formatExtractedRequirements(conversation.extractedRequirements)}

是否现在生成产品需求文档（PRD）？
- 回复 "是" 或 "yes" 立即生成
- 回复 "继续" 添加更多需求`;
    } else {
      response = await generateFollowUpQuestion(conversation);
    }
  }

  // 添加助手消息
  const assistantMessage: Message = {
    role: 'assistant',
    content: response,
    timestamp: new Date().toISOString(),
  };
  conversation.messages.push(assistantMessage);

  // 更新时间戳
  conversation.updatedAt = new Date().toISOString();

  // 保存对话
  saveConversation(conversation);

  return {
    conversation,
    response,
    needsClarification,
    canGeneratePRD,
  };
}

/**
 * 生成 PRD
 */
export async function generatePRD(conversationId: string): Promise<PRDDocument> {
  const conversation = loadConversation(conversationId);

  if (!conversation) {
    throw new Error(`Conversation ${conversationId} not found`);
  }

  if (conversation.extractedRequirements.length === 0) {
    throw new Error('No requirements extracted from conversation');
  }

  // 使用 AI 生成完整 PRD
  const prd = await generatePRDWithAI(conversation);

  // 保存 PRD
  savePRD(prd);

  // 标记对话为完成
  conversation.status = 'completed';
  saveConversation(conversation);

  return prd;
}

/**
 * 检测模糊需求
 */
async function detectAmbiguity(
  userInput: string,
  conversation: Conversation
): Promise<AmbiguityReport> {
  // 如果没有配置 AI，使用规则检测
  if (!getAIConfig()) {
    return detectAmbiguityWithRules(userInput);
  }

  // 使用 AI 检测
  try {
    const conversationHistory = conversation.messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = `分析以下用户输入，检测是否存在模糊、冲突或缺失的信息。

对话历史：
${conversationHistory}

最新用户输入：
${userInput}

输出纯 JSON 格式：
{
  "hasAmbiguity": true/false,
  "ambiguities": [
    {
      "type": "vague|conflict|missing",
      "description": "描述问题",
      "suggestion": "建议如何澄清"
    }
  ],
  "clarificationQuestions": ["问题1", "问题2"]
}

只输出 JSON。`;

    const response = await callModel(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { hasAmbiguity: false, ambiguities: [], clarificationQuestions: [] };
  } catch (error) {
    // 回退到规则检测
    return detectAmbiguityWithRules(userInput);
  }
}

/**
 * 基于规则的模糊检测（无 AI 时的后备方案）
 */
function detectAmbiguityWithRules(userInput: string): AmbiguityReport {
  const ambiguities: AmbiguityReport['ambiguities'] = [];
  const clarificationQuestions: string[] = [];

  // 检测模糊词汇
  const vagueWords = ['好的', '快速', '很多', '一些', '尽量', '可能', '大概', '差不多'];
  for (const word of vagueWords) {
    if (userInput.includes(word)) {
      ambiguities.push({
        type: 'vague',
        description: `使用了模糊词汇"${word}"`,
        suggestion: '请使用更具体的描述',
      });
    }
  }

  // 检测缺失信息
  if (userInput.length < 20) {
    ambiguities.push({
      type: 'missing',
      description: '需求描述过于简短',
      suggestion: '请提供更多细节',
    });
    clarificationQuestions.push('能否详细描述一下这个功能的具体需求？');
  }

  // 检测是否缺少技术约束
  if (
    !userInput.includes('技术') &&
    !userInput.includes('框架') &&
    !userInput.includes('性能') &&
    userInput.length > 50
  ) {
    clarificationQuestions.push('是否有特定的技术要求或限制？');
  }

  return {
    hasAmbiguity: ambiguities.length > 0 || clarificationQuestions.length > 0,
    ambiguities,
    clarificationQuestions,
  };
}

/**
 * 生成澄清回复
 */
async function generateClarificationResponse(report: AmbiguityReport): Promise<string> {
  let response = '🤔 我需要更多信息来更好地理解您的需求：\n\n';

  // 添加澄清问题
  if (report.clarificationQuestions.length > 0) {
    report.clarificationQuestions.forEach((q, i) => {
      response += `${i + 1}. ${q}\n`;
    });
  }

  // 添加问题说明
  if (report.ambiguities.length > 0) {
    response += '\n检测到的问题：\n';
    report.ambiguities.forEach((a) => {
      response += `- ${a.description}。${a.suggestion}\n`;
    });
  }

  return response;
}

/**
 * 提取需求
 */
async function extractRequirements(
  userInput: string,
  conversation: Conversation
): Promise<Partial<Requirement>> {
  if (!getAIConfig()) {
    // 无 AI 时使用简单提取
    return {
      title: userInput.substring(0, 50),
      description: userInput,
      status: 'draft',
      priority: 'medium',
    };
  }

  // 使用 AI 提取
  try {
    const conversationHistory = conversation.messages
      .slice(-5)  // 只使用最近5条消息
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = `从以下对话中提取结构化需求。

对话历史：
${conversationHistory}

最新用户输入：
${userInput}

输出纯 JSON 格式：
{
  "title": "需求标题（简洁）",
  "description": "需求详细描述",
  "priority": "high|medium|low",
  "tags": ["标签1", "标签2"],
  "acceptance": [
    {"criterion": "验收标准1", "done": false},
    {"criterion": "验收标准2", "done": false}
  ],
  "features": [
    {
      "id": "F-001",
      "name": "功能名",
      "description": "功能描述",
      "acceptance_criteria": ["标准1"],
      "technical_constraints": [],
      "estimated_hours": 2
    }
  ]
}

只输出 JSON。`;

    const response = await callModel(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const extracted = JSON.parse(jsonMatch[0]);
      return {
        ...extracted,
        status: 'draft',
      };
    }

    throw new Error('Failed to parse AI response');
  } catch (error) {
    // 回退到简单提取
    return {
      title: userInput.substring(0, 50),
      description: userInput,
      status: 'draft',
      priority: 'medium',
    };
  }
}

/**
 * 生成后续问题
 */
async function generateFollowUpQuestion(conversation: Conversation): Promise<string> {
  if (!getAIConfig()) {
    return '还有其他需求或细节要补充吗？';
  }

  try {
    const conversationHistory = conversation.messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = `基于以下对话，生成一个后续问题来引导用户提供更多信息。

对话历史：
${conversationHistory}

要求：
1. 问题要具体，有针对性
2. 帮助用户补充缺失的信息
3. 不超过50字

只输出问题本身，不要其他内容。`;

    return await callModel(prompt);
  } catch (error) {
    return '还有其他需求或细节要补充吗？';
  }
}

/**
 * 使用 AI 生成 PRD
 */
async function generatePRDWithAI(conversation: Conversation): Promise<PRDDocument> {
  const conversationHistory = conversation.messages
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const prompt = `基于以下对话生成完整的产品需求文档（PRD）。

对话历史：
${conversationHistory}

已提取的需求：
${JSON.stringify(conversation.extractedRequirements, null, 2)}

输出纯 JSON 格式：
{
  "id": "PRD-${Date.now()}",
  "version": "1.0.0",
  "title": "产品名称",
  "description": "产品描述",
  "features": [
    {
      "id": "F-001",
      "name": "功能名",
      "description": "功能描述",
      "acceptance_criteria": ["标准1", "标准2"],
      "technical_constraints": ["约束1"],
      "estimated_hours": 2
    }
  ],
  "acceptanceCriteria": [
    {"criterion": "验收标准1", "priority": "must"},
    {"criterion": "验收标准2", "priority": "should"}
  ],
  "technicalConstraints": ["约束1", "约束2"],
  "dependencies": ["依赖1", "依赖2"],
  "createdAt": "${new Date().toISOString()}"
}

只输出 JSON。`;

  const response = await callModel(prompt);
  const jsonMatch = response.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  // 回退到简单 PRD
  return {
    id: `PRD-${Date.now()}`,
    version: '1.0.0',
    title: conversation.extractedRequirements[0]?.title || '未命名产品',
    description: conversation.extractedRequirements[0]?.description || '',
    features: conversation.extractedRequirements[0]?.features || [],
    acceptanceCriteria:
      conversation.extractedRequirements[0]?.acceptance?.map((a) => ({
        criterion: a.criterion,
        priority: 'must' as const,
      })) || [],
    technicalConstraints: [],
    dependencies: [],
    createdAt: new Date().toISOString(),
  };
}

/**
 * 格式化提取的需求
 */
function formatExtractedRequirements(requirements: Partial<Requirement>[]): string {
  return requirements
    .map((req, i) => {
      return `${i + 1}. ${req.title || '未命名需求'}
   描述：${req.description || '无'}
   优先级：${req.priority || 'medium'}
   ${req.tags?.length ? `标签：${req.tags.join(', ')}` : ''}
   ${req.acceptance?.length ? `验收标准：\n${req.acceptance.map((a) => `   - ${a.criterion}`).join('\n')}` : ''}`;
    })
    .join('\n\n');
}

/**
 * 保存对话
 */
function saveConversation(conversation: Conversation): void {
  const path = join(conversationsDir, `${conversation.id}.json`);
  writeFileSync(path, JSON.stringify(conversation, null, 2));
}

/**
 * 加载对话
 */
function loadConversation(conversationId: string): Conversation | null {
  const path = join(conversationsDir, `${conversationId}.json`);

  if (!existsSync(path)) {
    return null;
  }

  const raw = readFileSync(path, 'utf-8');
  return JSON.parse(raw);
}

/**
 * 保存 PRD
 */
function savePRD(prd: PRDDocument): void {
  const intentBridgeDir = getIntentBridgeDir();
  const prdDir = join(intentBridgeDir, 'product-design');

  if (!existsSync(prdDir)) {
    mkdirSync(prdDir, { recursive: true });
  }

  const path = join(prdDir, `PRD-${prd.id}.yml`);
  writeFileSync(path, yaml.dump(prd, { lineWidth: -1 }));
}
