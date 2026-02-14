import { join } from 'path';
import { readdirSync, existsSync } from 'fs';
import { getPluginManager } from './plugin-manager.js';
import { Plugin } from '../types/plugin.js';

/**
 * Load all builtin plugins
 */
export async function loadBuiltinPlugins(cwd: string): Promise<void> {
  const manager = getPluginManager(cwd);
  const builtinPath = join(__dirname, '..', 'plugins', 'builtin');

  if (!existsSync(builtinPath)) {
    return;
  }

  const files = readdirSync(builtinPath).filter(f => f.endsWith('.js') || f.endsWith('.ts'));

  for (const file of files) {
    try {
      const pluginPath = join(builtinPath, file);
      const pluginModule = await import(`file://${pluginPath}`);
      const plugin: Plugin = pluginModule.default || pluginModule;

      // Only register if not already registered
      const existing = manager.listPlugins().find(p => p.name === plugin.name);
      if (!existing) {
        await manager.register(plugin);
      }
    } catch (error: any) {
      console.error(`Failed to load builtin plugin ${file}:`, error.message);
    }
  }
}
