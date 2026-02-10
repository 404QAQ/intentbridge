export interface ProjectConfig {
  version: string;
  project: {
    name: string;
    description: string;
    tech_stack: string[];
    conventions: string[];
  };
}

export type RequirementStatus = 'draft' | 'active' | 'implementing' | 'done';
export type RequirementPriority = 'high' | 'medium' | 'low';

export interface Milestone {
  name: string;
  requirements: string[];
  status?: 'planned' | 'active' | 'completed';
  due_date?: string;
}

export interface Requirement {
  id: string;
  title: string;
  description: string;
  status: RequirementStatus;
  priority: RequirementPriority;
  created: string;
  files: string[];
  notes?: Array<{ date: string; content: string }>;
  acceptance?: Array<{ criterion: string; done: boolean }>;
  depends_on?: string[];
  tags?: string[];
}

export interface RequirementsData {
  requirements: Requirement[];
  milestones?: Milestone[];
}
