import { getPluginManager } from '../services/plugin-manager.js';
import { Plugin } from '../types/plugin.js';

export async function pluginInstallCommand(pluginPath: string) {
  const cwd = process.cwd();

  try {
    // Dynamic import the plugin
    const pluginModule = await import(pluginPath);
    const plugin: Plugin = pluginModule.default || pluginModule;

    // Validate plugin
    if (!plugin.name || !plugin.version) {
      throw new Error('Invalid plugin: missing name or version');
    }

    const manager = getPluginManager(cwd);
    await manager.register(plugin);

    console.log(`✅ Plugin installed: ${plugin.name}@${plugin.version}`);
    console.log(`   ${plugin.description}`);
  } catch (error: any) {
    console.error(`Failed to install plugin: ${error.message}`);
    process.exit(1);
  }
}

export async function pluginUninstallCommand(pluginName: string) {
  const cwd = process.cwd();

  try {
    const manager = getPluginManager(cwd);
    await manager.unregister(pluginName);
    console.log(`✅ Plugin uninstalled: ${pluginName}`);
  } catch (error: any) {
    console.error(`Failed to uninstall plugin: ${error.message}`);
    process.exit(1);
  }
}

export async function pluginEnableCommand(pluginName: string) {
  const cwd = process.cwd();

  try {
    const manager = getPluginManager(cwd);
    await manager.enable(pluginName);
    console.log(`✅ Plugin enabled: ${pluginName}`);
  } catch (error: any) {
    console.error(`Failed to enable plugin: ${error.message}`);
    process.exit(1);
  }
}

export async function pluginDisableCommand(pluginName: string) {
  const cwd = process.cwd();

  try {
    const manager = getPluginManager(cwd);
    await manager.disable(pluginName);
    console.log(`✅ Plugin disabled: ${pluginName}`);
  } catch (error: any) {
    console.error(`Failed to disable plugin: ${error.message}`);
    process.exit(1);
  }
}

export function pluginListCommand() {
  const cwd = process.cwd();

  try {
    const manager = getPluginManager(cwd);
    const plugins = manager.listPlugins();

    if (plugins.length === 0) {
      console.log('No plugins installed.');
      return;
    }

    console.log('Installed Plugins:\n');
    for (const plugin of plugins) {
      const status = plugin.enabled ? '✅ enabled' : '❌ disabled';
      console.log(`${plugin.name}@${plugin.version} - ${status}`);
      console.log(`  Installed: ${new Date(plugin.installedAt).toLocaleString()}`);
      console.log('');
    }
  } catch (error: any) {
    console.error(`Failed to list plugins: ${error.message}`);
    process.exit(1);
  }
}

export function pluginInfoCommand(pluginName: string) {
  const cwd = process.cwd();

  try {
    const manager = getPluginManager(cwd);
    const plugin = manager.getPlugin(pluginName);

    if (!plugin) {
      console.log(`Plugin ${pluginName} not found.`);
      return;
    }

    console.log(`Plugin: ${plugin.name}@${plugin.version}\n`);
    console.log(`Description: ${plugin.description}`);
    if (plugin.author) {
      console.log(`Author: ${plugin.author}`);
    }

    console.log(`Status: ${plugin.enabled ? 'Enabled' : 'Disabled'}`);

    if (plugin.hooks) {
      console.log('\nRegistered Hooks:');
      for (const [hookName] of Object.entries(plugin.hooks)) {
        console.log(`  - ${hookName}`);
      }
    }

    if (plugin.commands) {
      console.log('\nCommands:');
      for (const [cmdName] of Object.entries(plugin.commands)) {
        console.log(`  - ${cmdName}`);
      }
    }
  } catch (error: any) {
    console.error(`Failed to get plugin info: ${error.message}`);
    process.exit(1);
  }
}
