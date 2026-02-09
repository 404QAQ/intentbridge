import { createInterface, Interface } from 'node:readline';

let rl: Interface | null = null;

function getRL(): Interface {
  if (!rl) {
    rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.on('close', () => { rl = null; });
  }
  return rl;
}

export function closePrompt(): void {
  if (rl) {
    rl.close();
    rl = null;
  }
}

export function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    getRL().question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

export async function promptWithDefault(question: string, defaultVal: string): Promise<string> {
  const answer = await prompt(`${question} (${defaultVal}): `);
  return answer || defaultVal;
}
