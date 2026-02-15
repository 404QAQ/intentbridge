import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export interface Requirement {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'implementing' | 'done';
  priority: 'high' | 'medium' | 'low';
  created: string;
  files: string[];
  tags?: string[];
  notes?: Array<{ date: string; content: string }>;
  acceptance?: Array<{ criterion: string; done: boolean }>;
  depends_on?: string[];
}

export interface Project {
  name: string;
  path: string;
  description?: string;
  tags?: string[];
  status: 'active' | 'paused' | 'archived';
}

export interface GlobalStatus {
  totalProjects: number;
  activeProjects: number;
  totalRequirements: number;
  doneRequirements: number;
  implementingRequirements: number;
}

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

export interface DemoStatus {
  demoMode: boolean;
  message: string;
}

export const apiService = {
  // Requirements
  async getRequirements(project?: string): Promise<Requirement[]> {
    const response = await api.get('/requirements', { params: { project } });
    return response.data.requirements;
  },

  async getRequirement(id: string): Promise<Requirement> {
    const response = await api.get(`/requirements/${id}`);
    return response.data.requirement;
  },

  async updateRequirementStatus(id: string, status: string): Promise<void> {
    await api.put(`/requirements/${id}/status`, { status });
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    const response = await api.get('/projects');
    return response.data.projects;
  },

  async getCurrentProject(): Promise<Project | null> {
    const response = await api.get('/projects/current');
    return response.data.project;
  },

  // Global Status
  async getGlobalStatus(): Promise<GlobalStatus> {
    const response = await api.get('/global-status');
    return response.data;
  },

  // Project Status & Chat
  async getProjectStatus(projectId: string): Promise<ExecutionStatus> {
    const response = await api.get(`/projects/${projectId}/status`);
    return response.data.status;
  },

  async getConversationHistory(projectId: string): Promise<ConversationMessage[]> {
    const response = await api.get(`/projects/${projectId}/conversations`);
    return response.data.messages;
  },

  async clearConversation(projectId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/conversations`);
  },

  async sendChatMessage(
    projectId: string,
    message: string,
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'chunk') {
                fullResponse += parsed.content;
                onChunk(parsed.content);
              } else if (parsed.type === 'complete') {
                onComplete(parsed.content);
              } else if (parsed.type === 'error') {
                onError(new Error(parsed.message));
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  },

  async getDemoStatus(projectId: string): Promise<DemoStatus> {
    const response = await api.get(`/projects/${projectId}/demo`);
    return response.data;
  },
};

export default apiService;
