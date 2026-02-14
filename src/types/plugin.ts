export type HookName =
  | 'requirement:add'
  | 'requirement:update'
  | 'requirement:done'
  | 'requirement:remove'
  | 'file:map'
  | 'file:unmap'
  | 'milestone:create'
  | 'milestone:update'
  | 'project:switch'
  | 'project:register'
  | 'init:before'
  | 'init:after';

export interface HookContext {
  type: HookName;
  timestamp: string;
  data: any;
  cwd: string;
}

export interface HookResult {
  success: boolean;
  error?: string;
  modifiedData?: any;
}

export type HookHandler = (context: HookContext) => HookResult | Promise<HookResult>;

export interface Plugin {
  name: string;
  version: string;
  description: string;
  author?: string;
  main: string;
  enabled: boolean;
  hooks?: Partial<Record<HookName, HookHandler>>;
  commands?: Record<string, (...args: any[]) => any>;
  setup?: () => void | Promise<void>;
  teardown?: () => void | Promise<void>;
}

export interface PluginConfig {
  name: string;
  version: string;
  enabled: boolean;
  installedAt: string;
  config?: Record<string, any>;
}

export interface PluginRegistry {
  plugins: PluginConfig[];
}
