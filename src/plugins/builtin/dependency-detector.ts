import { Plugin, HookContext } from '../../types/plugin.js';

/**
 * Dependency Detector Plugin
 * Automatically detects dependencies based on file paths
 */
const dependencyDetectorPlugin: Plugin = {
  name: 'dependency-detector',
  version: '1.0.0',
  description: 'Automatically detect requirement dependencies based on file mappings',
  author: 'IntentBridge',
  enabled: true,
  main: 'builtin/dependency-detector.js',

  hooks: {
    'file:map': (context: HookContext) => {
      const { data: { reqId, file } } = context;

      // Simple heuristic: if mapping to a shared file, suggest dependencies
      if (file.includes('shared/') || file.includes('common/')) {
        console.log(`💡 Tip: File "${file}" is shared. Consider adding dependencies.`);
      }

      return { success: true };
    },

    'requirement:add': (context: HookContext) => {
      const { data: requirement } = context;

      // Detect potential dependencies based on keywords
      const depKeywords: Record<string, string[]> = {
        'authentication': ['auth', 'login', 'user'],
        'database': ['db', 'database', 'schema', 'migration'],
        'api': ['api', 'endpoint', 'route'],
      };

      const title = (requirement.title || '').toLowerCase();
      const potentialDeps: string[] = [];

      for (const [dep, keywords] of Object.entries(depKeywords)) {
        if (keywords.some(kw => title.includes(kw)) && !title.includes(dep)) {
          potentialDeps.push(dep);
        }
      }

      if (potentialDeps.length > 0) {
        console.log(`💡 Potential dependencies detected: ${potentialDeps.join(', ')}`);
      }

      return { success: true };
    },
  },

  setup: () => {
    console.log('📌 Dependency Detector plugin loaded');
  },
};

export default dependencyDetectorPlugin;
