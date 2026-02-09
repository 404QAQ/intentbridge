import { resolve } from 'node:path';

const INTENTBRIDGE_DIR = '.intentbridge';

export function getIntentBridgeDir(cwd: string = process.cwd()): string {
  return resolve(cwd, INTENTBRIDGE_DIR);
}

export function getProjectYamlPath(cwd?: string): string {
  return resolve(getIntentBridgeDir(cwd), 'project.yaml');
}

export function getRequirementsYamlPath(cwd?: string): string {
  return resolve(getIntentBridgeDir(cwd), 'requirements.yaml');
}

export function getClaudeMdPath(cwd: string = process.cwd()): string {
  return resolve(cwd, 'CLAUDE.md');
}
