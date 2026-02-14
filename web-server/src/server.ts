import express, { Request, Response } from 'express';
import cors from 'cors';
import yaml from 'js-yaml';
import fs from 'fs/promises';
import path from 'path';

const app = express();
const PORT = process.env.WEB_SERVER_PORT || 9528;
const INTENTBRIDGE_DIR = process.env.INTENTBRIDGE_DIR || path.join(process.cwd(), '.intentbridge');

app.use(cors());
app.use(express.json());

// Types
interface Requirement {
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

interface Project {
  name: string;
  path: string;
  description?: string;
  tags?: string[];
  status: 'active' | 'paused' | 'archived';
}

interface GlobalStatus {
  totalProjects: number;
  activeProjects: number;
  totalRequirements: number;
  doneRequirements: number;
  implementingRequirements: number;
}

// Helper functions
async function loadRequirements(projectPath?: string): Promise<Requirement[]> {
  const reqDir = projectPath
    ? path.join(projectPath, '.intentbridge', 'requirements')
    : path.join(INTENTBRIDGE_DIR, 'requirements');

  try {
    const files = await fs.readdir(reqDir);
    const requirements: Requirement[] = [];

    for (const file of files) {
      if (!file.endsWith('.yaml') && !file.endsWith('.yml')) continue;

      const filePath = path.join(reqDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const req = yaml.load(content) as Requirement;
      requirements.push(req);
    }

    return requirements.sort((a, b) =>
      new Date(b.created).getTime() - new Date(a.created).getTime()
    );
  } catch (error) {
    // Directory doesn't exist
    return [];
  }
}

async function loadRequirement(id: string): Promise<Requirement | null> {
  const reqPath = path.join(INTENTBRIDGE_DIR, 'requirements', `${id}.yaml`);

  try {
    const content = await fs.readFile(reqPath, 'utf-8');
    return yaml.load(content) as Requirement;
  } catch (error) {
    return null;
  }
}

async function updateRequirementStatus(id: string, status: string): Promise<boolean> {
  const reqPath = path.join(INTENTBRIDGE_DIR, 'requirements', `${id}.yaml`);

  try {
    const content = await fs.readFile(reqPath, 'utf-8');
    const req = yaml.load(content) as Requirement;
    req.status = status as any;

    const updatedContent = yaml.dump(req);
    await fs.writeFile(reqPath, updatedContent, 'utf-8');
    return true;
  } catch (error) {
    return false;
  }
}

async function loadProjects(): Promise<Project[]> {
  const registryPath = path.join(INTENTBRIDGE_DIR, '..', 'projects.json');

  try {
    const content = await fs.readFile(registryPath, 'utf-8');
    const data = JSON.parse(content);
    return data.projects || [];
  } catch (error) {
    return [];
  }
}

async function getCurrentProject(): Promise<Project | null> {
  const currentPath = path.join(INTENTBRIDGE_DIR, 'current-project.json');

  try {
    const content = await fs.readFile(currentPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

// API Routes

// GET /api/requirements - List all requirements
app.get('/api/requirements', async (req: Request, res: Response) => {
  try {
    const project = req.query.project as string;
    const requirements = await loadRequirements(project);
    res.json({ requirements });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load requirements' });
  }
});

// GET /api/requirements/:id - Get single requirement
app.get('/api/requirements/:id', async (req: Request, res: Response) => {
  try {
    const requirement = await loadRequirement(req.params.id);
    if (!requirement) {
      res.status(404).json({ error: 'Requirement not found' });
      return;
    }
    res.json({ requirement });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load requirement' });
  }
});

// PUT /api/requirements/:id/status - Update requirement status
app.put('/api/requirements/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const success = await updateRequirementStatus(req.params.id, status);

    if (!success) {
      res.status(404).json({ error: 'Requirement not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update requirement status' });
  }
});

// GET /api/projects - List all projects
app.get('/api/projects', async (req: Request, res: Response) => {
  try {
    const projects = await loadProjects();
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load projects' });
  }
});

// GET /api/projects/current - Get current project
app.get('/api/projects/current', async (req: Request, res: Response) => {
  try {
    const project = await getCurrentProject();
    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load current project' });
  }
});

// GET /api/global-status - Get global statistics
app.get('/api/global-status', async (req: Request, res: Response) => {
  try {
    const projects = await loadProjects();
    const requirements = await loadRequirements();

    const globalStatus: GlobalStatus = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      totalRequirements: requirements.length,
      doneRequirements: requirements.filter(r => r.status === 'done').length,
      implementingRequirements: requirements.filter(r => r.status === 'implementing').length,
    };

    res.json(globalStatus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load global status' });
  }
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`IntentBridge Web Server running at http://localhost:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api`);
  console.log(`IntentBridge directory: ${INTENTBRIDGE_DIR}`);
});
