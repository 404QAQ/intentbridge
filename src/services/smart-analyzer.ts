import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { callModel, getAIConfig } from './ai-client.js';

export interface RequirementAnalysis {
  summary: string;
  category: 'web-app' | 'api' | 'cli' | 'library' | 'mobile' | 'desktop' | 'other';
  suggestedStructure: DirectoryStructure;
  requiredFiles: string[];
  recommendedTemplates: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  tags: string[];
  dependencies: string[];
}

export interface DirectoryStructure {
  directories: string[];
  files: FileTemplate[];
}

export interface FileTemplate {
  path: string;
  content: string;
  description: string;
}

/**
 * Analyze requirement description and generate project structure
 */
export async function analyzeRequirement(
  description: string
): Promise<RequirementAnalysis> {
  if (!getAIConfig()) {
    // Return default structure if AI not configured
    return getDefaultAnalysis(description);
  }

  const prompt = `分析需求描述，推荐项目结构。

需求描述: "${description}"

输出纯 JSON 格式：
{
  "summary": "需求一句话总结",
  "category": "web-app|api|cli|library|mobile|desktop|other",
  "suggestedStructure": {
    "directories": ["src", "tests"],
    "files": [
      {
        "path": "README.md",
        "content": "# Project Name\\n\\n## Description\\n...",
        "description": "项目文档"
      }
    ]
  },
  "requiredFiles": ["package.json", "tsconfig.json"],
  "recommendedTemplates": ["user-auth", "api-base"],
  "estimatedComplexity": "low|medium|high",
  "tags": ["frontend", "backend"],
  "dependencies": ["express", "jsonwebtoken"]
}

只输出 JSON。`;

  const response = await callModel(prompt);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    return getDefaultAnalysis(description);
  }
}

/**
 * Get default analysis without AI
 */
function getDefaultAnalysis(description: string): RequirementAnalysis {
  return {
    summary: description,
    category: 'other',
    suggestedStructure: {
      directories: ['src', 'tests', 'docs'],
      files: [
        {
          path: 'README.md',
          content: `# Project\n\n${description}\n`,
          description: '项目文档',
        },
      ],
    },
    requiredFiles: [],
    recommendedTemplates: [],
    estimatedComplexity: 'medium',
    tags: [],
    dependencies: [],
  };
}

/**
 * Create project structure based on analysis
 */
export async function createProjectStructure(
  projectRoot: string,
  analysis: RequirementAnalysis,
  options?: {
    dryRun?: boolean;
    overwrite?: boolean;
  }
): Promise<{
  created: string[];
  skipped: string[];
  errors: string[];
}> {
  const created: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  // Create directories
  for (const dir of analysis.suggestedStructure.directories) {
    const dirPath = join(projectRoot, dir);
    try {
      if (existsSync(dirPath)) {
        skipped.push(dirPath);
      } else {
        if (!options?.dryRun) {
          mkdirSync(dirPath, { recursive: true });
        }
        created.push(dirPath);
      }
    } catch (e: any) {
      errors.push(`Failed to create directory ${dirPath}: ${e.message}`);
    }
  }

  // Create files
  for (const file of analysis.suggestedStructure.files) {
    const filePath = join(projectRoot, file.path);
    try {
      if (existsSync(filePath) && !options?.overwrite) {
        skipped.push(filePath);
      } else {
        if (!options?.dryRun) {
          // Ensure parent directory exists
          const parentDir = join(filePath, '..');
          if (!existsSync(parentDir)) {
            mkdirSync(parentDir, { recursive: true });
          }
          writeFileSync(filePath, file.content, 'utf-8');
        }
        created.push(filePath);
      }
    } catch (e: any) {
      errors.push(`Failed to create file ${filePath}: ${e.message}`);
    }
  }

  return { created, skipped, errors };
}

/**
 * Generate README content based on requirement
 */
export async function generateREADME(
  requirementTitle: string,
  description: string,
  analysis: RequirementAnalysis
): Promise<string> {
  if (!getAIConfig()) {
    return generateDefaultREADME(requirementTitle, description, analysis);
  }

  const prompt = `生成 README.md 内容。

需求标题: ${requirementTitle}
描述: ${description}
分类: ${analysis.category}
复杂度: ${analysis.estimatedComplexity}
标签: ${analysis.tags.join(', ')}
依赖: ${analysis.dependencies.join(', ')}

输出 Markdown 格式的 README，包含：
- 项目名称和简介
- 功能特性
- 技术栈
- 快速开始
- 安装步骤
- 使用示例
- 项目结构
- 贡献指南

只输出 Markdown 内容。`;

  return await callModel(prompt);
}

/**
 * Generate default README without AI
 */
function generateDefaultREADME(
  title: string,
  description: string,
  analysis: RequirementAnalysis
): string {
  return `# ${title}

${description}

## Features

- Feature 1
- Feature 2

## Tech Stack

${analysis.tags.map(tag => `- ${tag}`).join('\n')}

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Run
npm start
\`\`\`

## Project Structure

${analysis.suggestedStructure.directories.map(dir => `- ${dir}/`).join('\n')}

## Installation

\`\`\`bash
npm install ${analysis.dependencies.join(' ')}
\`\`\`

## Usage

[Usage examples]

## Contributing

Contributions are welcome!

## License

MIT
`;
}

/**
 * Generate project configuration files
 */
export function generateConfigFiles(
  projectRoot: string,
  category: RequirementAnalysis['category']
): FileTemplate[] {
  const files: FileTemplate[] = [];

  // Package.json for Node.js projects
  if (['web-app', 'api', 'cli', 'library'].includes(category)) {
    files.push({
      path: 'package.json',
      content: JSON.stringify({
        name: basename(projectRoot),
        version: '1.0.0',
        description: '',
        main: 'dist/index.js',
        scripts: {
          build: 'tsc',
          start: 'node dist/index.js',
          test: 'jest',
        },
        keywords: [],
        license: 'MIT',
      }, null, 2),
      description: 'Node.js package configuration',
    });
  }

  // TypeScript config
  if (['web-app', 'api', 'cli', 'library'].includes(category)) {
    files.push({
      path: 'tsconfig.json',
      content: JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          lib: ['ES2020'],
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist'],
      }, null, 2),
      description: 'TypeScript configuration',
    });
  }

  // .gitignore
  files.push({
    path: '.gitignore',
    content: `node_modules/
dist/
.env
.DS_Store
*.log
.intentbridge/
`,
    description: 'Git ignore rules',
  });

  return files;
}

/**
 * Smart add requirement with auto-analysis
 */
export async function smartAddRequirement(
  description: string,
  projectRoot: string
): Promise<{
  analysis: RequirementAnalysis;
  structure: {
    created: string[];
    skipped: string[];
    errors: string[];
  };
  readme: string;
}> {
  // Step 1: Analyze requirement
  const analysis = await analyzeRequirement(description);

  // Step 2: Add config files
  const configFiles = generateConfigFiles(projectRoot, analysis.category);
  analysis.suggestedStructure.files.push(...configFiles);

  // Step 3: Create structure
  const structure = await createProjectStructure(projectRoot, analysis);

  // Step 4: Generate README
  const readme = await generateREADME(
    basename(projectRoot),
    description,
    analysis
  );

  // Write README
  const readmePath = join(projectRoot, 'README.md');
  if (!existsSync(readmePath)) {
    writeFileSync(readmePath, readme, 'utf-8');
    structure.created.push(readmePath);
  }

  return {
    analysis,
    structure,
    readme,
  };
}
