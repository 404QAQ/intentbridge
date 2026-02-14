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
};

export default apiService;
