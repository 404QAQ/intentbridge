import { Plugin, HookContext } from '../../types/plugin.js';

/**
 * Auto Tagger Plugin
 * Automatically tags requirements based on keywords in description
 */
const autoTaggerPlugin: Plugin = {
  name: 'auto-tagger',
  version: '1.0.0',
  description: 'Automatically tag requirements based on keywords',
  author: 'IntentBridge',
  enabled: true,
  main: 'builtin/auto-tagger.js',

  hooks: {
    'requirement:add': (context: HookContext) => {
      const { data: requirement } = context;

      // Auto-tag based on keywords
      const keywords: Record<string, string[]> = {
        'backend': ['api', 'server', 'database', 'auth', 'security'],
        'frontend': ['ui', 'ux', 'component', 'page', 'react', 'vue'],
        'testing': ['test', 'spec', 'coverage', 'jest', 'cypress'],
        'documentation': ['readme', 'docs', 'documentation', 'guide'],
        'security': ['auth', 'login', 'password', 'csrf', 'xss', 'jwt'],
        'performance': ['optimize', 'performance', 'cache', 'speed'],
      };

      const description = (requirement.description || '').toLowerCase();
      const title = (requirement.title || '').toLowerCase();
      const text = `${title} ${description}`;

      const autoTags: string[] = [];

      for (const [tag, words] of Object.entries(keywords)) {
        if (words.some(word => text.includes(word))) {
          autoTags.push(tag);
        }
      }

      if (autoTags.length > 0) {
        requirement.tags = [...new Set([...(requirement.tags || []), ...autoTags])];
        console.log(`🏷️  Auto-tagged with: ${autoTags.join(', ')}`);
      }

      return { success: true, modifiedData: requirement };
    },
  },

  setup: () => {
    console.log('📌 Auto Tagger plugin loaded');
  },
};

export default autoTaggerPlugin;
