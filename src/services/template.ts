import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import type { Requirement, RequirementPriority } from '../models/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Templates are in dist/templates when running from compiled code
// or src/templates when running from source
const TEMPLATES_DIR = join(__dirname, '../../templates');

export interface RequirementTemplate {
  title: string;
  description: string;
  tags: string[];
  acceptance: Array<{ criterion: string; done: boolean }>;
}

export function loadTemplate(name: string): RequirementTemplate | null {
  const filePath = join(TEMPLATES_DIR, `${name}.yaml`);

  if (!existsSync(filePath)) {
    return null;
  }

  const content = readFileSync(filePath, 'utf-8');
  const template = yaml.load(content) as RequirementTemplate;

  return template;
}

export function listTemplates(): Map<string, { description: string; fileName: string }> {
  const templates = new Map<string, { description: string; fileName: string }>();

  if (!existsSync(TEMPLATES_DIR)) {
    return templates;
  }

  const files = readdirSync(TEMPLATES_DIR);
  for (const file of files) {
    if (!file.endsWith('.yaml')) continue;

    const name = file.replace('.yaml', '');
    const template = loadTemplate(name);
    if (template) {
      templates.set(name, {
        description: template.description,
        fileName: file,
      });
    }
  }

  return templates;
}

export function applyTemplate(
  template: RequirementTemplate,
  variables: Record<string, string>
): Omit<Requirement, 'id' | 'status' | 'priority' | 'created' | 'files'> {
  let title = template.title;
  let description = template.description;
  const acceptance = template.acceptance.map((ac) => ({
    ...ac,
    criterion: replaceVariables(ac.criterion, variables),
  }));

  // Replace variables in title and description
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    title = title.replace(new RegExp(placeholder, 'g'), value);
    description = description.replace(new RegExp(placeholder, 'g'), value);
  }

  return {
    title,
    description,
    tags: template.tags,
    acceptance,
  };
}

function replaceVariables(text: string, variables: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }
  return result;
}

export function getTemplateVariables(template: RequirementTemplate): string[] {
  const variables = new Set<string>();
  const text = [template.title, template.description, ...template.acceptance.map((a) => a.criterion)].join(' ');
  const matches = text.matchAll(/\{([^\}]+)\}/g);

  for (const match of matches) {
    if (match[1]) {
      variables.add(match[1]);
    }
  }

  return Array.from(variables);
}
