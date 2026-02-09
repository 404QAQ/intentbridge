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

export interface Requirement {
  id: string;
  title: string;
  description: string;
  status: RequirementStatus;
  priority: RequirementPriority;
  created: string;
  files: string[];
}

export interface RequirementsData {
  requirements: Requirement[];
}
