import chalk from 'chalk';
import {
  getAIConfig,
  setAIConfig,
  generateAIUnderstanding,
  validateCompletion,
  analyzeImpact,
} from '../services/ai-client.js';
import {
  createMCPSession,
  findBestSessionForRequirement,
  decideSessionStrategy,
  exportContextForClaudeCode,
  loadMCPSessions,
  getMCPConfig,
  setMCPConfig,
  cleanupExpiredSessions,
} from '../services/mcp-bridge.js';
import {
  readRequirements,
  addNote,
  addAcceptanceCriterion,
} from '../services/store.js';
import {
  generateRequirementUnderstanding,
  writeUnderstandingDocument,
} from '../services/understanding-generator.js';
import { prompt, closePrompt } from '../utils/prompt.js';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { getIntentBridgeDir } from '../utils/paths.js';

// AI Configuration Commands

export async function aiConfigCommand(): Promise<void> {
  console.log(chalk.bold('IntentBridge AI Configuration'));
  console.log('');

  const currentConfig = getAIConfig();

  if (currentConfig) {
    console.log('Current configuration:');
    console.log(`  Provider: ${currentConfig.provider}`);
    console.log(`  Model: ${currentConfig.model}`);
    console.log(`  API Key: ${currentConfig.apiKey ? '****' + currentConfig.apiKey.slice(-4) : 'not set'}`);
    console.log('');
  }

  const provider = await prompt('Provider (openai/anthropic/local): ');
  if (!['openai', 'anthropic', 'local'].includes(provider)) {
    console.log(chalk.red('Invalid provider. Must be openai, anthropic, or local.'));
    closePrompt();
    return;
  }

  const model = await prompt('Model (e.g., gpt-4, claude-3-opus-20240229, llama2): ');
  if (!model) {
    console.log(chalk.red('Model is required.'));
    closePrompt();
    return;
  }

  let apiKey: string | undefined;
  if (provider !== 'local') {
    apiKey = await prompt('API Key (or env var name like $OPENAI_API_KEY): ');
    // Support environment variable reference
    if (apiKey?.startsWith('$')) {
      const envVar = apiKey.slice(1);
      apiKey = process.env[envVar];
      if (!apiKey) {
        console.log(chalk.yellow(`Warning: Environment variable ${envVar} not found.`));
      }
    }
  }

  const baseUrl = await prompt('Base URL (optional, press Enter for default): ');

  const config = {
    provider: provider as 'openai' | 'anthropic' | 'local',
    model,
    apiKey,
    baseUrl: baseUrl || undefined,
  };

  setAIConfig(config);

  // Save to file
  const configPath = join(getIntentBridgeDir(), 'ai-config.json');
  const configToSave = {
    ...config,
    apiKey: apiKey ? '***' : undefined, // Don't save actual key
  };
  writeFileSync(configPath, JSON.stringify(configToSave, null, 2), 'utf-8');

  console.log('');
  console.log(chalk.green('✔ AI configuration saved'));
  console.log(chalk.dim(`  Config file: ${configPath}`));
  closePrompt();
}

// AI Understanding Commands

export async function aiUnderstandCommand(reqId?: string): Promise<void> {
  if (!getAIConfig()) {
    console.log(chalk.red('AI not configured. Run `ib ai-config` first.'));
    return;
  }

  const data = readRequirements();

  if (reqId) {
    const req = data.requirements.find(r => r.id === reqId);
    if (!req) {
      console.log(chalk.red(`Requirement ${reqId} not found.`));
      return;
    }
    await generateSingleUnderstanding(req, data.requirements);
  } else {
    // Generate for all requirements
    console.log(chalk.bold(`Generating AI understanding for ${data.requirements.length} requirements...`));
    console.log('');

    for (const req of data.requirements) {
      await generateSingleUnderstanding(req, data.requirements);
    }

    console.log(chalk.green('✔ All requirements processed'));
  }
}

async function generateSingleUnderstanding(
  req: any,
  allReqs: any[]
): Promise<void> {
  console.log(chalk.dim(`Processing ${req.id}...`));

  try {
    // Build project context
    const projectContext = `Total requirements: ${allReqs.length}
Active: ${allReqs.filter(r => r.status === 'active' || r.status === 'implementing').length}
Done: ${allReqs.filter(r => r.status === 'done').length}`;

    const aiUnderstanding = await generateAIUnderstanding(req, projectContext);

    // Generate and save understanding document
    const understanding = generateRequirementUnderstanding(req, allReqs);

    // Enhance with AI insights
    const enhancedUnderstanding = `${understanding}

## AI 分析

### 目标（AI 提炼）
${aiUnderstanding.goal}

### 约束条件
${aiUnderstanding.constraints.map(c => `- ${c}`).join('\n') || '无'}

### 技术方案建议
${aiUnderstanding.technical_approach}

### 风险评估
${aiUnderstanding.risks.map(r => `- ${r}`).join('\n') || '无'}

### 建议验收标准
${aiUnderstanding.acceptance_criteria_suggestions.map(a => `- [ ] ${a}`).join('\n') || '无'}

### 实施步骤建议
${aiUnderstanding.implementation_steps.map((s, i) => `${i + 1}. ${s}`).join('\n') || '无'}
`;

    writeUnderstandingDocument(req.id, enhancedUnderstanding);

    // Optionally add acceptance criteria
    if (aiUnderstanding.acceptance_criteria_suggestions.length > 0 && !req.acceptance?.length) {
      for (const ac of aiUnderstanding.acceptance_criteria_suggestions.slice(0, 5)) {
        addAcceptanceCriterion(req.id, ac);
      }
    }

    console.log(chalk.green(`  ✔ ${req.id}: ${req.title}`));
  } catch (e: any) {
    console.log(chalk.red(`  ✗ ${req.id}: ${e.message}`));
  }
}

// Impact Analysis Commands

export async function analyzeImpactCommand(
  reqId: string,
  options?: { changeStatus?: string }
): Promise<void> {
  const data = readRequirements();
  const req = data.requirements.find(r => r.id === reqId);

  if (!req) {
    console.log(chalk.red(`Requirement ${reqId} not found.`));
    return;
  }

  console.log(chalk.bold(`Impact Analysis for ${reqId}`));
  console.log('');

  try {
    const impact = await analyzeImpact(
      req,
      data.requirements,
      options?.changeStatus || 'general'
    );

    console.log(`Direct Dependencies: ${impact.directDependencies.length > 0 ? impact.directDependencies.join(', ') : 'None'}`);
    console.log(`Transitive Dependencies: ${impact.transitiveDependencies.length > 0 ? impact.transitiveDependencies.join(', ') : 'None'}`);
    console.log(`Affected Files: ${impact.affectedFiles.length}`);
    console.log(`Impact Depth: ${impact.impactDepth}`);
    console.log('');
    console.log(`Recommendation: ${impact.recommendation}`);
    console.log(`Suggested Session Strategy: ${chalk.cyan(impact.suggestedSessionStrategy)}`);

    if (impact.affectedFiles.length > 0) {
      console.log('');
      console.log(chalk.bold('Affected Files:'));
      for (const file of impact.affectedFiles.slice(0, 10)) {
        console.log(`  - ${file}`);
      }
      if (impact.affectedFiles.length > 10) {
        console.log(chalk.dim(`  ... and ${impact.affectedFiles.length - 10} more`));
      }
    }
  } catch (e: any) {
    console.log(chalk.red(`Error: ${e.message}`));
  }
}

// Validation Commands

export async function validateCommand(
  reqId: string,
  options?: { withCode?: boolean }
): Promise<void> {
  if (!getAIConfig()) {
    console.log(chalk.red('AI not configured. Run `ib ai-config` first.'));
    return;
  }

  const data = readRequirements();
  const req = data.requirements.find(r => r.id === reqId);

  if (!req) {
    console.log(chalk.red(`Requirement ${reqId} not found.`));
    return;
  }

  console.log(chalk.bold(`Validating ${reqId}: ${req.title}`));
  console.log('');

  // Get code context if requested
  let codeContext = '';
  if (options?.withCode && req.files.length > 0) {
    for (const file of req.files) {
      try {
        if (existsSync(file)) {
          const content = readFileSync(file, 'utf-8');
          codeContext += `\n// File: ${file}\n${content.substring(0, 1000)}\n`;
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  if (!codeContext) {
    codeContext = 'No code files available for analysis.';
  }

  try {
    const result = await validateCompletion(req, codeContext);

    console.log(`Completion Score: ${chalk.bold(result.completionScore + '%')}`);
    console.log(`Status: ${result.isComplete ? chalk.green('✓ Complete') : chalk.yellow('✗ Incomplete')}`);
    console.log('');

    if (result.completedCriteria.length > 0) {
      console.log(chalk.green('Completed Criteria:'));
      result.completedCriteria.forEach(i => {
        const ac = req.acceptance?.[i];
        if (ac) {
          console.log(`  ✓ [${i}] ${ac.criterion}`);
        }
      });
      console.log('');
    }

    if (result.missingCriteria.length > 0) {
      console.log(chalk.yellow('Missing Criteria:'));
      result.missingCriteria.forEach(i => {
        const ac = req.acceptance?.[i];
        if (ac) {
          console.log(`  ✗ [${i}] ${ac.criterion}`);
        }
      });
      console.log('');
    }

    if (result.issues.length > 0) {
      console.log(chalk.red('Issues:'));
      result.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
      console.log('');
    }

    if (result.suggestions.length > 0) {
      console.log(chalk.cyan('Suggestions:'));
      result.suggestions.forEach(s => {
        console.log(`  - ${s}`);
      });
    }
  } catch (e: any) {
    console.log(chalk.red(`Error: ${e.message}`));
  }
}

// MCP Commands

export function mcpStatusCommand(): void {
  const sessions = loadMCPSessions();
  const config = getMCPConfig();

  console.log(chalk.bold('MCP Bridge Status'));
  console.log('');
  console.log(`Enabled: ${config.enabled ? chalk.green('Yes') : chalk.red('No')}`);
  console.log(`Auto Sync: ${config.autoSync ? 'Yes' : 'No'}`);
  console.log(`Session Timeout: ${config.sessionTimeout} minutes`);
  console.log(`Max Sessions: ${config.maxSessions}`);
  console.log('');

  console.log(chalk.bold(`Sessions (${sessions.length}):`));
  for (const session of sessions) {
    const status =
      session.status === 'active' ? chalk.green('●') :
      session.status === 'paused' ? chalk.yellow('●') :
      chalk.dim('○');
    console.log(`  ${status} ${session.id}`);
    console.log(`    Requirements: ${session.requirements.join(', ') || 'none'}`);
    console.log(`    Last Activity: ${session.lastActivity}`);
  }
}

export function mcpExportCommand(reqId: string): void {
  const data = readRequirements();
  const req = data.requirements.find(r => r.id === reqId);

  if (!req) {
    console.log(chalk.red(`Requirement ${reqId} not found.`));
    return;
  }

  const understanding = generateRequirementUnderstanding(req, data.requirements);
  const mcpMessage = exportContextForClaudeCode([req], understanding);

  console.log(mcpMessage);
  console.log('');
  console.log(chalk.dim('Copy the above context and paste into Claude Code conversation.'));
}

export function mcpCleanupCommand(): void {
  const removed = cleanupExpiredSessions();
  console.log(chalk.green(`✔ Cleaned up ${removed} expired session(s)`));
}
