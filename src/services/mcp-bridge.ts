import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { getIntentBridgeDir } from '../utils/paths.js';
import type { Requirement } from '../models/types.js';

export interface MCPSession {
  id: string;
  createdAt: string;
  lastActivity: string;
  requirements: string[]; // REQ IDs discussed
  tokenCount: number;
  status: 'active' | 'paused' | 'closed';
  summary?: string;
}

export interface MCPContextPackage {
  sessionId: string;
  timestamp: string;
  focusRequirements: Requirement[];
  understanding: string;
  sessionStrategy: 'NEW' | 'CONTINUE' | 'RESTORE' | 'COMPACT';
  tokenBudget: number;
  metadata: {
    projectContext: string;
    relatedFiles: string[];
    recentDecisions: string[];
  };
}

export interface MCPConfig {
  enabled: boolean;
  autoSync: boolean;
  sessionTimeout: number; // minutes
  maxSessions: number;
}

const SESSIONS_FILE = 'mcp-sessions.json';
const CONFIG_FILE = 'mcp-config.json';

let mcpConfig: MCPConfig = {
  enabled: true,
  autoSync: true,
  sessionTimeout: 60,
  maxSessions: 10,
};

export function getMCPConfig(): MCPConfig {
  return mcpConfig;
}

export function setMCPConfig(config: Partial<MCPConfig>): void {
  mcpConfig = { ...mcpConfig, ...config };
  saveMCPConfig();
}

function getSessionsPath(cwd?: string): string {
  const dir = getIntentBridgeDir(cwd);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return join(dir, SESSIONS_FILE);
}

function getConfigPath(cwd?: string): string {
  return join(getIntentBridgeDir(cwd), CONFIG_FILE);
}

export function loadMCPSessions(cwd?: string): MCPSession[] {
  const path = getSessionsPath(cwd);
  if (!existsSync(path)) {
    return [];
  }

  try {
    const content = readFileSync(path, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export function saveMCPSessions(sessions: MCPSession[], cwd?: string): void {
  const path = getSessionsPath(cwd);
  writeFileSync(path, JSON.stringify(sessions, null, 2), 'utf-8');
}

function saveMCPConfig(cwd?: string): void {
  const path = getConfigPath(cwd);
  writeFileSync(path, JSON.stringify(mcpConfig, null, 2), 'utf-8');
}

export function loadMCPConfig(cwd?: string): MCPConfig {
  const path = getConfigPath(cwd);
  if (!existsSync(path)) {
    return mcpConfig;
  }

  try {
    const content = readFileSync(path, 'utf-8');
    return { ...mcpConfig, ...JSON.parse(content) };
  } catch {
    return mcpConfig;
  }
}

/**
 * Create a new MCP session
 */
export function createMCPSession(
  requirements: string[],
  summary?: string
): MCPSession {
  const session: MCPSession = {
    id: `session-${Date.now()}`,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    requirements,
    tokenCount: 0,
    status: 'active',
    summary,
  };

  const sessions = loadMCPSessions();

  // Enforce max sessions limit
  if (sessions.length >= mcpConfig.maxSessions) {
    // Remove oldest inactive session
    const inactiveIdx = sessions.findIndex(s => s.status !== 'active');
    if (inactiveIdx !== -1) {
      sessions.splice(inactiveIdx, 1);
    } else {
      // Remove oldest session
      sessions.shift();
    }
  }

  sessions.push(session);
  saveMCPSessions(sessions);

  return session;
}

/**
 * Update MCP session
 */
export function updateMCPSession(
  sessionId: string,
  updates: Partial<MCPSession>
): MCPSession | null {
  const sessions = loadMCPSessions();
  const idx = sessions.findIndex(s => s.id === sessionId);

  if (idx === -1) return null;

  sessions[idx] = {
    ...sessions[idx],
    ...updates,
    lastActivity: new Date().toISOString(),
  };

  saveMCPSessions(sessions);
  return sessions[idx];
}

/**
 * Find best session for a requirement
 */
export function findBestSessionForRequirement(
  reqId: string
): MCPSession | null {
  const sessions = loadMCPSessions();

  // Filter active sessions that discuss related requirements
  const relatedSessions = sessions.filter(
    s => s.status === 'active' && s.requirements.includes(reqId)
  );

  if (relatedSessions.length === 0) return null;

  // Return most recently active
  return relatedSessions.sort((a, b) =>
    new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  )[0];
}

/**
 * Decide session strategy
 */
export function decideSessionStrategy(
  reqId: string,
  tokenCount: number
): 'NEW' | 'CONTINUE' | 'RESTORE' | 'COMPACT' {
  const existingSession = findBestSessionForRequirement(reqId);

  if (!existingSession) {
    return 'NEW';
  }

  if (tokenCount > 100000) {
    return 'COMPACT';
  }

  if (existingSession.requirements.includes(reqId)) {
    return 'CONTINUE';
  }

  return 'RESTORE';
}

/**
 * Generate context package for MCP transfer
 */
export function generateMCPContextPackage(
  sessionId: string,
  requirements: Requirement[],
  understanding: string
): MCPContextPackage {
  const session = loadMCPSessions().find(s => s.id === sessionId);

  return {
    sessionId,
    timestamp: new Date().toISOString(),
    focusRequirements: requirements,
    understanding,
    sessionStrategy: session ? 'CONTINUE' : 'NEW',
    tokenBudget: 100000, // Default budget
    metadata: {
      projectContext: 'Project context will be filled by caller',
      relatedFiles: requirements.flatMap(r => r.files || []),
      recentDecisions: requirements
        .flatMap(r => r.notes || [])
        .slice(-5)
        .map(n => n.content),
    },
  };
}

/**
 * Generate MCP protocol message
 */
export function generateMCPMessage(
  contextPackage: MCPContextPackage
): string {
  return `# IntentBridge Context Transfer

Session: ${contextPackage.sessionId}
Strategy: ${contextPackage.sessionStrategy}
Time: ${contextPackage.timestamp}

## Focus Requirements

${contextPackage.focusRequirements.map(r => `
### ${r.id}: ${r.title}
Status: ${r.status}
Priority: ${r.priority}
${r.description}
${r.acceptance?.length ? `
Acceptance Criteria:
${r.acceptance.map((a, i) => `- [${a.done ? 'x' : ' '}] ${a.criterion}`).join('\n')}
` : ''}
`).join('\n')}

## Understanding

${contextPackage.understanding}

## Related Files

${contextPackage.metadata.relatedFiles.map(f => `- ${f}`).join('\n')}

## Recent Decisions

${contextPackage.metadata.recentDecisions.map(d => `- ${d}`).join('\n')}

---
Token Budget: ${contextPackage.tokenBudget}
`;
}

/**
 * Export context for Claude Code
 */
export function exportContextForClaudeCode(
  requirements: Requirement[],
  understanding: string,
  sessionStrategy?: 'NEW' | 'CONTINUE' | 'RESTORE' | 'COMPACT'
): string {
  const sessionId = `session-${Date.now()}`;
  const strategy = sessionStrategy || decideSessionStrategy(
    requirements[0]?.id || '',
    understanding.length
  );

  const contextPackage = generateMCPContextPackage(
    sessionId,
    requirements,
    understanding
  );

  contextPackage.sessionStrategy = strategy;

  return generateMCPMessage(contextPackage);
}

/**
 * Sync session state with external system
 */
export async function syncSessionState(
  sessionId: string,
  externalState: Partial<MCPSession>
): Promise<void> {
  updateMCPSession(sessionId, externalState);
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): number {
  const sessions = loadMCPSessions();
  const now = Date.now();
  const timeout = mcpConfig.sessionTimeout * 60 * 1000;

  const active = sessions.filter(s => {
    const lastActivity = new Date(s.lastActivity).getTime();
    const isExpired = now - lastActivity > timeout;
    return !isExpired || s.status === 'active';
  });

  const removed = sessions.length - active.length;

  if (removed > 0) {
    saveMCPSessions(active);
  }

  return removed;
}
