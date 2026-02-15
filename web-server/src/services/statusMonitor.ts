import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

const INTENTBRIDGE_DIR = process.env.INTENTBRIDGE_DIR || path.join(process.cwd(), '.intentbridge');

export interface ExecutionStatus {
  projectId: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  currentTask?: string;
  progress?: number;
  startTime?: string;
  endTime?: string;
  logs: LogEntry[];
  lastUpdated: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  details?: any;
}

/**
 * Get status file path for a project
 */
function getStatusPath(projectId: string): string {
  return path.join(INTENTBRIDGE_DIR, 'status', `${projectId}.json`);
}

/**
 * Get logs directory
 */
function getLogsDir(): string {
  return path.join(INTENTBRIDGE_DIR, 'logs');
}

/**
 * Initialize status for a project
 */
export async function initializeStatus(projectId: string): Promise<ExecutionStatus> {
  const status: ExecutionStatus = {
    projectId,
    status: 'idle',
    logs: [],
    lastUpdated: new Date().toISOString(),
  };

  await saveStatus(status);
  return status;
}

/**
 * Load execution status for a project
 */
export async function loadStatus(projectId: string): Promise<ExecutionStatus | null> {
  const statusPath = getStatusPath(projectId);

  try {
    const content = await fs.readFile(statusPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // Create default status if doesn't exist
    return await initializeStatus(projectId);
  }
}

/**
 * Save execution status
 */
export async function saveStatus(status: ExecutionStatus): Promise<void> {
  const statusPath = getStatusPath(status.projectId);

  // Ensure directory exists
  await fs.mkdir(path.dirname(statusPath), { recursive: true });

  status.lastUpdated = new Date().toISOString();
  await fs.writeFile(statusPath, JSON.stringify(status, null, 2), 'utf-8');
}

/**
 * Add log entry to status
 */
export async function addLog(
  projectId: string,
  level: LogEntry['level'],
  message: string,
  details?: any
): Promise<void> {
  const status = await loadStatus(projectId);

  if (status) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
    };

    status.logs.push(logEntry);

    // Keep only last 100 logs to prevent file from growing too large
    if (status.logs.length > 100) {
      status.logs = status.logs.slice(-100);
    }

    await saveStatus(status);
  }
}

/**
 * Update execution status
 */
export async function updateStatus(
  projectId: string,
  updates: Partial<ExecutionStatus>
): Promise<void> {
  const status = await loadStatus(projectId);

  if (status) {
    Object.assign(status, updates);
    await saveStatus(status);
  }
}

/**
 * Parse existing IntentBridge logs (if any)
 */
export async function parseExistingLogs(projectId: string): Promise<LogEntry[]> {
  const logsDir = getLogsDir();
  const logs: LogEntry[] = [];

  try {
    const files = await fs.readdir(logsDir);

    for (const file of files) {
      if (file.includes(projectId) && (file.endsWith('.log') || file.endsWith('.txt'))) {
        const content = await fs.readFile(path.join(logsDir, file), 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());

        for (const line of lines) {
          // Try to parse log line
          const timestampMatch = line.match(/^[\d\-:T\s]+/);
          const timestamp = timestampMatch ? timestampMatch[0].trim() : new Date().toISOString();

          let level: LogEntry['level'] = 'info';
          if (line.toLowerCase().includes('error')) level = 'error';
          else if (line.toLowerCase().includes('warn')) level = 'warn';
          else if (line.toLowerCase().includes('success') || line.toLowerCase().includes('completed')) level = 'success';

          logs.push({
            timestamp,
            level,
            message: line,
          });
        }
      }
    }
  } catch (error) {
    // Logs directory doesn't exist or no matching files
  }

  return logs;
}

/**
 * Get recent execution logs
 */
export async function getRecentLogs(projectId: string, limit: number = 50): Promise<LogEntry[]> {
  const status = await loadStatus(projectId);

  if (status && status.logs.length > 0) {
    return status.logs.slice(-limit);
  }

  // Try to parse existing logs if no status logs
  return await parseExistingLogs(projectId);
}
