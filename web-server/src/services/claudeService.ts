import { Request, Response } from 'express';

export interface ClaudeConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

/**
 * Get Claude configuration from environment or config file
 */
export function getClaudeConfig(): ClaudeConfig {
  return {
    apiKey: process.env.CLAUDE_API_KEY,
    model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
    baseUrl: process.env.CLAUDE_BASE_URL || 'https://api.anthropic.com/v1/messages',
  };
}

/**
 * Check if Claude API is configured
 */
export function isClaudeConfigured(): boolean {
  return !!process.env.CLAUDE_API_KEY;
}

/**
 * Call Claude API with streaming response
 */
export async function streamClaudeResponse(
  messages: Array<{ role: string; content: string }>,
  onResponse: (chunk: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: Error) => void
): Promise<void> {
  const config = getClaudeConfig();

  if (!config.apiKey) {
    // Demo mode - simulate response
    await simulateDemoResponse(messages, onResponse, onComplete);
    return;
  }

  try {
    const response = await fetch(config.baseUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey!,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 4096,
        messages: messages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              const text = parsed.delta.text;
              fullResponse += text;
              onResponse(text);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    onComplete(fullResponse);
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Simulate demo response when Claude API is not configured
 */
async function simulateDemoResponse(
  messages: Array<{ role: string; content: string }>,
  onResponse: (chunk: string) => void,
  onComplete: (fullResponse: string) => void
): Promise<void> {
  const lastMessage = messages[messages.length - 1];
  const demoResponses = [
    "I understand you're asking about this project. In demo mode, I can provide general guidance about IntentBridge and requirement management.",
    "This is a demo response. To get actual AI-powered responses, please configure the CLAUDE_API_KEY environment variable.",
    "IntentBridge helps you manage requirements and track implementation progress. I can assist with understanding requirements, analyzing code context, and providing implementation suggestions.",
    "For this requirement, I recommend reviewing the acceptance criteria and ensuring all code changes align with the project goals.",
  ];

  const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
  const fullResponse = `${randomResponse}\n\nYou asked: "${lastMessage.content.substring(0, 100)}${lastMessage.content.length > 100 ? '...' : ''}"`;

  // Simulate streaming by sending chunks with delays
  const words = fullResponse.split(' ');
  let currentResponse = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const chunk = (i === 0 ? '' : ' ') + word;
    currentResponse += chunk;

    await new Promise(resolve => setTimeout(resolve, 50));
    onResponse(chunk);
  }

  onComplete(fullResponse);
}

/**
 * Generate context for Claude based on project data
 */
export function generateProjectContext(
  projectData: any,
  requirements: any[],
  executionStatus: any
): string {
  let context = `Project: ${projectData.name || 'Unknown'}\n`;
  context += `Status: ${projectData.status || 'Unknown'}\n\n`;

  if (requirements.length > 0) {
    context += `Requirements (${requirements.length} total):\n`;
    requirements.forEach((req, index) => {
      context += `${index + 1}. ${req.title} (${req.status})\n`;
    });
    context += '\n';
  }

  if (executionStatus) {
    context += `Execution Status: ${executionStatus.status}\n`;
    if (executionStatus.currentTask) {
      context += `Current Task: ${executionStatus.currentTask}\n`;
    }
  }

  return context;
}
