import { Plugin, HookContext } from '../../types/plugin.js';

/**
 * Notifier Plugin
 * Logs important events (could be extended to send emails, Slack, etc.)
 */
const notifierPlugin: Plugin = {
  name: 'notifier',
  version: '1.0.0',
  description: 'Notify on important requirement events',
  author: 'IntentBridge',
  enabled: true,
  main: 'builtin/notifier.js',

  hooks: {
    'requirement:done': (context: HookContext) => {
      const { data: requirement } = context;
      console.log(`\n🎉 Requirement completed: ${requirement.id}`);
      console.log(`   Title: ${requirement.title}`);
      console.log('');
      return { success: true };
    },

    'milestone:create': (context: HookContext) => {
      const { data: milestone } = context;
      console.log(`\n🎯 Milestone created: ${milestone.name}`);
      if (milestone.dueDate) {
        console.log(`   Due: ${milestone.dueDate}`);
      }
      console.log('');
      return { success: true };
    },

    'project:register': (context: HookContext) => {
      const { data: project } = context;
      console.log(`\n📁 Project registered: ${project.name}`);
      console.log(`   Path: ${project.path}`);
      console.log('');
      return { success: true };
    },
  },

  setup: () => {
    console.log('📌 Notifier plugin loaded');
  },
};

export default notifierPlugin;
