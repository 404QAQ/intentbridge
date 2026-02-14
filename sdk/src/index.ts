/**
 * IntentBridge JavaScript SDK
 * @version 2.4.0
 * @description Official JavaScript/TypeScript SDK for IntentBridge API
 */

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

export interface IntentBridgeConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export class IntentBridge {
  private baseURL: string;
  private timeout: number;
  private headers: Record<string, string>;

  constructor(config: IntentBridgeConfig = {}) {
    this.baseURL = config.baseURL || 'http://localhost:9528/api';
    this.timeout = config.timeout || 10000;
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: this.headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // ==================== Requirements ====================

  /**
   * List all requirements
   */
  async listRequirements(project?: string): Promise<Requirement[]> {
    const query = project ? `?project=${encodeURIComponent(project)}` : '';
    const response = await this.request<{ requirements: Requirement[] }>(
      `/requirements${query}`
    );
    return response.requirements;
  }

  /**
   * Get a requirement by ID
   */
  async getRequirement(id: string): Promise<Requirement> {
    const response = await this.request<{ requirement: Requirement }>(
      `/requirements/${id}`
    );
    return response.requirement;
  }

  /**
   * Update requirement status
   */
  async updateRequirementStatus(
    id: string,
    status: Requirement['status']
  ): Promise<void> {
    await this.request(`/requirements/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // ==================== Projects ====================

  /**
   * List all projects
   */
  async listProjects(): Promise<Project[]> {
    const response = await this.request<{ projects: Project[] }>('/projects');
    return response.projects;
  }

  /**
   * Get current project
   */
  async getCurrentProject(): Promise<Project | null> {
    const response = await this.request<{ project: Project | null }>(
      '/projects/current'
    );
    return response.project;
  }

  // ==================== Statistics ====================

  /**
   * Get global status
   */
  async getGlobalStatus(): Promise<GlobalStatus> {
    return await this.request<GlobalStatus>('/global-status');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return await this.request('/health');
  }
}

// Default export
export default IntentBridge;

// Usage examples:
/**
 * @example
 * import { IntentBridge } from '@intentbridge/sdk';
 *
 * const client = new IntentBridge({
 *   baseURL: 'http://localhost:9528/api',
 * });
 *
 * // List requirements
 * const requirements = await client.listRequirements();
 *
 * // Get requirement
 * const req = await client.getRequirement('REQ-001');
 *
 * // Update status
 * await client.updateRequirementStatus('REQ-001', 'done');
 *
 * // Get global status
 * const status = await client.getGlobalStatus();
 * console.log(`Completion: ${status.doneRequirements}/${status.totalRequirements}`);
 */
