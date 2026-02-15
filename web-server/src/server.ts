import express, { Request, Response } from 'express';
import cors from 'cors';
import yaml from 'js-yaml';
import fs from 'fs/promises';
import path from 'path';
import { loadConversation, addMessage, getConversationHistory, clearConversation, createConversation } from './services/conversationStore.js';
import { loadStatus, updateStatus, getRecentLogs, addLog } from './services/statusMonitor.js';
import { streamClaudeResponse, isClaudeConfigured, generateProjectContext } from './services/claudeService.js';

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

// ==================== Project Status & Chat Routes ====================

// GET /api/projects/:id/status - Get project execution status
app.get('/api/projects/:id/status', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const status = await loadStatus(projectId);

    if (!status) {
      res.status(404).json({ error: 'Project status not found' });
      return;
    }

    res.json({ status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load project status' });
  }
});

// GET /api/projects/:id/conversations - Get conversation history
app.get('/api/projects/:id/conversations', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const messages = await getConversationHistory(projectId);

    res.json({ messages, count: messages.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load conversation history' });
  }
});

// DELETE /api/projects/:id/conversations - Clear conversation history
app.delete('/api/projects/:id/conversations', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    await clearConversation(projectId);

    res.json({ success: true, message: 'Conversation history cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear conversation history' });
  }
});

// POST /api/projects/:id/chat - Send message and get streaming response
app.post('/api/projects/:id/chat', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.id;
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Add user message to conversation
    await addMessage(projectId, {
      role: 'user',
      content: message,
    });

    // Load conversation history
    const history = await getConversationHistory(projectId);

    // Load project context
    const projects = await loadProjects();
    const project = projects.find(p => p.path.includes(projectId) || p.name === projectId);
    const requirements = await loadRequirements(project?.path);
    const status = await loadStatus(projectId);

    // Generate context
    const context = generateProjectContext(project, requirements, status);

    // Prepare messages for Claude
    const messages = [
      {
        role: 'system',
        content: `You are an AI assistant helping with the IntentBridge project management system.\n\nCurrent project context:\n${context}\n\nYou can help with:\n- Understanding requirements\n- Analyzing implementation progress\n- Providing development suggestions\n- Answering questions about the project\n\nBe helpful, concise, and focused on the project context.`,
      },
      ...history.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let assistantMessage = '';

    // Stream response from Claude
    await streamClaudeResponse(
      messages,
      (chunk) => {
        // Send chunk as SSE
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        assistantMessage += chunk;
      },
      async (fullResponse) => {
        // Save assistant message to conversation
        await addMessage(projectId, {
          role: 'assistant',
          content: fullResponse,
        });

        // Send completion event
        res.write(`data: ${JSON.stringify({ type: 'complete', content: fullResponse })}\n\n`);
        res.end();
      },
      (error) => {
        console.error('Claude API error:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
      }
    );
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// GET /api/projects/:id/demo - Check if demo mode is active
app.get('/api/projects/:id/demo', (req: Request, res: Response) => {
  res.json({
    demoMode: !isClaudeConfigured(),
    message: isClaudeConfigured()
      ? 'Claude API is configured'
      : 'Running in demo mode. Set CLAUDE_API_KEY environment variable for real AI responses.',
  });
});

// ==================== End Project Status & Chat Routes ====================

// Start server
app.listen(PORT, () => {
  console.log(`IntentBridge Web Server running at http://localhost:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api`);
  console.log(`IntentBridge directory: ${INTENTBRIDGE_DIR}`);
  console.log(`Claude API configured: ${isClaudeConfigured() ? 'Yes' : 'No (Demo mode)'}`);
});
