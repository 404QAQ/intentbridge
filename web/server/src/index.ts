import express, { Request, Response } from 'express';
import cors from 'cors';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

const app = express();
const PORT = process.env.PORT || 9528;

// Middleware
app.use(cors());
app.use(express.json());

// Helper to read JSON files
function readJsonFile(filePath: string): any {
  if (!existsSync(filePath)) {
    return null;
  }
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

// Get current working directory (project root)
const getCwd = (req: Request): string => {
  return req.headers['x-project-path'] as string || process.cwd();
};

// API Routes

// GET /api/requirements - List all requirements
app.get('/api/requirements', (req: Request, res: Response) => {
  try {
    const cwd = getCwd(req);
    const ibPath = join(cwd, '.ib');
    const reqPath = join(ibPath, 'requirements.json');

    const data = readJsonFile(reqPath);
    if (!data) {
      res.json({ requirements: [] });
      return;
    }

    const requirements = Object.entries(data).map(([id, req]: [string, any]) => ({
      id,
      ...req
    }));

    res.json({ requirements });
  } catch (error) {
    console.error('Error reading requirements:', error);
    res.status(500).json({ error: 'Failed to read requirements' });
  }
});

// GET /api/requirements/:id - Get single requirement
app.get('/api/requirements/:id', (req: Request, res: Response) => {
  try {
    const cwd = getCwd(req);
    const { id } = req.params;
    const ibPath = join(cwd, '.ib');
    const reqPath = join(ibPath, 'requirements.json');

    const data = readJsonFile(reqPath);
    if (!data || !data[id]) {
      res.status(404).json({ error: 'Requirement not found' });
      return;
    }

    res.json({ requirement: { id, ...data[id] } });
  } catch (error) {
    console.error('Error reading requirement:', error);
    res.status(500).json({ error: 'Failed to read requirement' });
  }
});

// PUT /api/requirements/:id/status - Update requirement status
app.put('/api/requirements/:id/status', (req: Request, res: Response) => {
  try {
    const cwd = getCwd(req);
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }

    const ibPath = join(cwd, '.ib');
    const reqPath = join(ibPath, 'requirements.json');

    const data = readJsonFile(reqPath);
    if (!data || !data[id]) {
      res.status(404).json({ error: 'Requirement not found' });
      return;
    }

    // Update status
    data[id].status = status;

    // Write back to file
    const { writeFileSync } = require('fs');
    writeFileSync(reqPath, JSON.stringify(data, null, 2));

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating requirement:', error);
    res.status(500).json({ error: 'Failed to update requirement' });
  }
});

// GET /api/projects - List all projects
app.get('/api/projects', (req: Request, res: Response) => {
  try {
    const cwd = getCwd(req);
    const ibPath = join(cwd, '.ib');
    const projectsPath = join(ibPath, 'projects.json');

    const data = readJsonFile(projectsPath);
    if (!data || !data.projects) {
      res.json({ projects: [] });
      return;
    }

    res.json({ projects: data.projects });
  } catch (error) {
    console.error('Error reading projects:', error);
    res.status(500).json({ error: 'Failed to read projects' });
  }
});

// GET /api/projects/current - Get current project
app.get('/api/projects/current', (req: Request, res: Response) => {
  try {
    const cwd = getCwd(req);
    const ibPath = join(cwd, '.ib');
    const configPath = join(ibPath, 'config.json');

    const config = readJsonFile(configPath);
    if (!config || !config.currentProject) {
      res.json({ project: null });
      return;
    }

    const projectsPath = join(ibPath, 'projects.json');
    const projectsData = readJsonFile(projectsPath);

    if (!projectsData || !projectsData.projects) {
      res.json({ project: null });
      return;
    }

    const currentProject = projectsData.projects.find(
      (p: any) => p.path === config.currentProject
    );

    res.json({ project: currentProject || null });
  } catch (error) {
    console.error('Error reading current project:', error);
    res.status(500).json({ error: 'Failed to read current project' });
  }
});

// GET /api/global-status - Get global statistics
app.get('/api/global-status', (req: Request, res: Response) => {
  try {
    const cwd = getCwd(req);
    const ibPath = join(cwd, '.ib');
    const reqPath = join(ibPath, 'requirements.json');
    const projectsPath = join(ibPath, 'projects.json');

    const requirementsData = readJsonFile(reqPath) || {};
    const projectsData = readJsonFile(projectsPath) || { projects: [] };

    const requirements = Object.values(requirementsData) as any[];
    const projects = projectsData.projects || [];

    const totalRequirements = requirements.length;
    const doneRequirements = requirements.filter(r => r.status === 'done').length;
    const implementingRequirements = requirements.filter(r => r.status === 'implementing').length;

    const activeProjects = projects.filter((p: any) => p.status === 'active').length;

    res.json({
      totalProjects: projects.length,
      activeProjects,
      totalRequirements,
      doneRequirements,
      implementingRequirements
    });
  } catch (error) {
    console.error('Error reading global status:', error);
    res.status(500).json({ error: 'Failed to read global status' });
  }
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 IntentBridge Web Server running at http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:5173 (Vite dev server)`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
});
