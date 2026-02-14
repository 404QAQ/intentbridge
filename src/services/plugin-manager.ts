import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Plugin, PluginConfig, PluginRegistry, HookName, HookContext, HookHandler } from '../types/plugin.js';

export class PluginManager {
  private pluginsDir: string;
  private registryPath: string;
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<HookName, Set<{ pluginName: string; handler: HookHandler }>> = new Map();

  constructor(cwd: string) {
    this.pluginsDir = join(cwd, '.intentbridge', 'plugins');
    this.registryPath = join(this.pluginsDir, 'registry.json');
    this.ensurePluginDirectory();
    this.loadRegistry();
  }

  private ensurePluginDirectory(): void {
    if (!existsSync(this.pluginsDir)) {
      mkdirSync(this.pluginsDir, { recursive: true });
    }
  }

  private loadRegistry(): PluginRegistry {
    if (!existsSync(this.registryPath)) {
      return { plugins: [] };
    }

    const content = readFileSync(this.registryPath, 'utf-8');
    return JSON.parse(content);
  }

  private saveRegistry(registry: PluginRegistry): void {
    writeFileSync(this.registryPath, JSON.stringify(registry, null, 2));
  }

  /**
   * Register a plugin
   */
  async register(plugin: Plugin): Promise<void> {
    const registry = this.loadRegistry();

    // Check if already registered
    const existingIndex = registry.plugins.findIndex(p => p.name === plugin.name);
    if (existingIndex >= 0) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }

    // Add to registry
    const config: PluginConfig = {
      name: plugin.name,
      version: plugin.version,
      enabled: plugin.enabled,
      installedAt: new Date().toISOString(),
    };

    registry.plugins.push(config);
    this.saveRegistry(registry);

    // Load plugin
    this.plugins.set(plugin.name, plugin);

    // Register hooks
    if (plugin.hooks) {
      for (const [hookName, handler] of Object.entries(plugin.hooks)) {
        this.registerHook(hookName as HookName, plugin.name, handler!);
      }
    }

    // Call setup
    if (plugin.setup) {
      await plugin.setup();
    }
  }

  /**
   * Unregister a plugin
   */
  async unregister(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }

    // Call teardown
    if (plugin.teardown) {
      await plugin.teardown();
    }

    // Remove hooks
    for (const [hookName, handlers] of this.hooks.entries()) {
      const toRemove: any[] = [];
      handlers.forEach(h => {
        if (h.pluginName === pluginName) {
          toRemove.push(h);
        }
      });
      toRemove.forEach(h => handlers.delete(h));
    }

    // Remove from memory
    this.plugins.delete(pluginName);

    // Remove from registry
    const registry = this.loadRegistry();
    registry.plugins = registry.plugins.filter(p => p.name !== pluginName);
    this.saveRegistry(registry);
  }

  /**
   * Enable a plugin
   */
  async enable(pluginName: string): Promise<void> {
    const registry = this.loadRegistry();
    const config = registry.plugins.find(p => p.name === pluginName);

    if (!config) {
      throw new Error(`Plugin ${pluginName} not found in registry`);
    }

    config.enabled = true;
    this.saveRegistry(registry);

    const plugin = this.plugins.get(pluginName);
    if (plugin) {
      plugin.enabled = true;
      if (plugin.setup) {
        await plugin.setup();
      }
    }
  }

  /**
   * Disable a plugin
   */
  async disable(pluginName: string): Promise<void> {
    const registry = this.loadRegistry();
    const config = registry.plugins.find(p => p.name === pluginName);

    if (!config) {
      throw new Error(`Plugin ${pluginName} not found in registry`);
    }

    config.enabled = false;
    this.saveRegistry(registry);

    const plugin = this.plugins.get(pluginName);
    if (plugin) {
      plugin.enabled = false;
      if (plugin.teardown) {
        await plugin.teardown();
      }
    }
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * List all registered plugins
   */
  listPlugins(): PluginConfig[] {
    const registry = this.loadRegistry();
    return registry.plugins;
  }

  /**
   * Register a hook handler
   */
  private registerHook(hookName: HookName, pluginName: string, handler: HookHandler): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, new Set());
    }

    this.hooks.get(hookName)!.add({ pluginName, handler });
  }

  /**
   * Execute a hook
   */
  async executeHook(hookName: HookName, context: Omit<HookContext, 'type' | 'timestamp'>): Promise<void> {
    const handlers = this.hooks.get(hookName);
    if (!handlers || handlers.size === 0) {
      return;
    }

    const hookContext: HookContext = {
      ...context,
      type: hookName,
      timestamp: new Date().toISOString(),
    };

    for (const { pluginName, handler } of handlers) {
      const plugin = this.plugins.get(pluginName);
      if (!plugin || !plugin.enabled) {
        continue;
      }

      try {
        await handler(hookContext);
      } catch (error: any) {
        console.error(`Error executing hook ${hookName} for plugin ${pluginName}:`, error.message);
      }
    }
  }

  /**
   * Get all registered hooks
   */
  getRegisteredHooks(): Map<HookName, string[]> {
    const result = new Map<HookName, string[]>();

    for (const [hookName, handlers] of this.hooks.entries()) {
      const pluginNames = Array.from(handlers).map(h => h.pluginName);
      result.set(hookName, pluginNames);
    }

    return result;
  }
}

// Singleton instance
let pluginManagerInstance: PluginManager | null = null;

export function getPluginManager(cwd?: string): PluginManager {
  if (!pluginManagerInstance && cwd) {
    pluginManagerInstance = new PluginManager(cwd);
  }

  if (!pluginManagerInstance) {
    throw new Error('PluginManager not initialized. Call getPluginManager with cwd first.');
  }

  return pluginManagerInstance;
}
