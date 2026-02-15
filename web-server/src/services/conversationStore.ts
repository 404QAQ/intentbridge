import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

const INTENTBRIDGE_DIR = process.env.INTENTBRIDGE_DIR || path.join(process.cwd(), '.intentbridge');

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    model?: string;
    tokens?: number;
    projectId?: string;
  };
}

export interface Conversation {
  id: string;
  projectId: string;
  title: string;
  messages: ConversationMessage[];
  created: string;
  updated: string;
}

/**
 * Get conversation file path for a project
 */
function getConversationPath(projectId: string): string {
  return path.join(INTENTBRIDGE_DIR, 'conversations', `${projectId}.json`);
}

/**
 * Load conversation for a project
 */
export async function loadConversation(projectId: string): Promise<Conversation | null> {
  const conversationPath = getConversationPath(projectId);

  try {
    const content = await fs.readFile(conversationPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Save conversation for a project
 */
export async function saveConversation(conversation: Conversation): Promise<void> {
  const conversationPath = getConversationPath(conversation.projectId);

  // Ensure directory exists
  await fs.mkdir(path.dirname(conversationPath), { recursive: true });

  conversation.updated = new Date().toISOString();
  await fs.writeFile(conversationPath, JSON.stringify(conversation, null, 2), 'utf-8');
}

/**
 * Create new conversation for a project
 */
export async function createConversation(projectId: string, title?: string): Promise<Conversation> {
  const conversation: Conversation = {
    id: `conv-${Date.now()}`,
    projectId,
    title: title || `Project ${projectId} Chat`,
    messages: [],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };

  await saveConversation(conversation);
  return conversation;
}

/**
 * Add message to conversation
 */
export async function addMessage(
  projectId: string,
  message: Omit<ConversationMessage, 'id' | 'timestamp'>
): Promise<ConversationMessage> {
  let conversation = await loadConversation(projectId);

  if (!conversation) {
    conversation = await createConversation(projectId);
  }

  const newMessage: ConversationMessage = {
    ...message,
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };

  conversation.messages.push(newMessage);
  await saveConversation(conversation);

  return newMessage;
}

/**
 * Get conversation history
 */
export async function getConversationHistory(projectId: string): Promise<ConversationMessage[]> {
  const conversation = await loadConversation(projectId);
  return conversation?.messages || [];
}

/**
 * Clear conversation history
 */
export async function clearConversation(projectId: string): Promise<void> {
  const conversationPath = getConversationPath(projectId);

  try {
    await fs.unlink(conversationPath);
  } catch (error) {
    // File doesn't exist, that's fine
  }
}
