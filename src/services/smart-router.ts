/**
 * 智能命令路由器
 * 支持自然语言输入、短命令和智能别名
 */

export interface ParsedCommand {
  command: string;
  action?: string;
  args: string[];
  options: Record<string, any>;
  originalInput: string;
}

export interface CommandAlias {
  short: string;
  full: string;
  description: string;
  example: string;
}

export class SmartRouter {
  private static aliases: CommandAlias[] = [
    {
      short: 'add',
      full: 'req add',
      description: '添加需求',
      example: 'ib add "用户登录功能"'
    },
    {
      short: 'ls',
      full: 'req list',
      description: '列出需求',
      example: 'ib ls'
    },
    {
      short: 'done',
      full: 'req update',
      description: '完成需求',
      example: 'ib done REQ-001'
    },
    {
      short: 'start',
      full: 'project start',
      description: '启动项目',
      example: 'ib start my-project'
    },
    {
      short: 'stop',
      full: 'project stop',
      description: '停止项目',
      example: 'ib stop my-project'
    },
    {
      short: 'web',
      full: 'web start',
      description: '启动 Web UI',
      example: 'ib web'
    },
    {
      short: 'understand',
      full: 'ai understand',
      description: 'AI 理解需求',
      example: 'ib understand REQ-001'
    },
    {
      short: 'validate',
      full: 'ai validate',
      description: '验证需求',
      example: 'ib validate REQ-001'
    },
    {
      short: 'ports',
      full: 'project ports',
      description: '端口管理',
      example: 'ib ports check'
    },
    {
      short: 'ps',
      full: 'project ps',
      description: '查看进程',
      example: 'ib ps'
    }
  ];

  /**
   * 解析用户输入
   */
  parse(input: string): ParsedCommand {
    const trimmed = input.trim();
    const originalInput = trimmed;

    // 1. 尝试自然语言解析
    const naturalLanguage = this.parseNaturalLanguage(trimmed);
    if (naturalLanguage) {
      return { ...naturalLanguage, originalInput };
    }

    // 2. 尝试短命令解析
    const shortCommand = this.parseShortCommand(trimmed);
    if (shortCommand) {
      return { ...shortCommand, originalInput };
    }

    // 3. 返回原始命令
    const parts = trimmed.split(/\s+/);
    return {
      command: parts[0] || '',
      action: parts[1],
      args: parts.slice(2),
      options: {},
      originalInput
    };
  }

  /**
   * 解析自然语言输入
   */
  private parseNaturalLanguage(input: string): ParsedCommand | null {
    const text = input.toLowerCase();

    // 添加需求
    if (text.includes('添加') || text.includes('增加') || text.includes('新建') || text.includes('创建')) {
      const content = this.extractContent(input, ['添加', '增加', '新建', '创建']);
      return {
        command: 'req',
        action: 'add',
        args: content ? [content] : [],
        options: this.extractOptions(text),
        originalInput: input
      };
    }

    // 查看需求
    if (text.includes('查看') || text.includes('显示') || text.includes('列出')) {
      return {
        command: 'req',
        action: 'list',
        args: [],
        options: this.extractOptions(text),
        originalInput: input
      };
    }

    // 完成需求
    if (text.includes('完成') || text.includes('结束')) {
      const reqId = this.extractReqId(input);
      return {
        command: 'req',
        action: 'update',
        args: reqId ? [reqId, '--status', 'done'] : [],
        options: {},
        originalInput: input
      };
    }

    // 启动项目
    if (text.includes('启动') || text.includes('运行') || text.includes('开始')) {
      const projectName = this.extractProjectName(input);
      return {
        command: 'project',
        action: 'start',
        args: projectName ? [projectName] : [],
        options: this.extractOptions(text),
        originalInput: input
      };
    }

    // 停止项目
    if (text.includes('停止') || text.includes('关闭')) {
      const projectName = this.extractProjectName(input);
      return {
        command: 'project',
        action: 'stop',
        args: projectName ? [projectName] : [],
        options: {},
        originalInput: input
      };
    }

    // 打开 Web UI
    if (text.includes('网页') || text.includes('界面') || text.includes('ui') || text.includes('dashboard')) {
      return {
        command: 'web',
        action: 'start',
        args: [],
        options: {},
        originalInput: input
      };
    }

    return null;
  }

  /**
   * 解析短命令
   */
  private parseShortCommand(input: string): ParsedCommand | null {
    const parts = input.split(/\s+/);
    const firstPart = parts[0];

    // 查找别名
    const alias = SmartRouter.aliases.find((a: CommandAlias) => a.short === firstPart);
    if (alias) {
      const [command, action] = alias.full.split(' ');
      const args = parts.slice(1);

      // 特殊处理 done 命令
      if (firstPart === 'done' && args.length > 0) {
        return {
          command: 'req',
          action: 'update',
          args: [args[0], '--status', 'done'],
          options: {},
          originalInput: input
        };
      }

      return {
        command,
        action,
        args,
        options: {},
        originalInput: input
      };
    }

    return null;
  }

  /**
   * 提取内容
   */
  private extractContent(input: string, keywords: string[]): string | null {
    for (const keyword of keywords) {
      const index = input.indexOf(keyword);
      if (index !== -1) {
        let content = input.substring(index + keyword.length).trim();
        // 移除引号
        content = content.replace(/^["'""]|["'""]$/g, '');
        // 提取第一个逗号或句号之前的内容
        const stopIndex = content.search(/[,，。]/);
        if (stopIndex !== -1) {
          content = content.substring(0, stopIndex);
        }
        return content.trim() || null;
      }
    }
    return null;
  }

  /**
   * 提取需求 ID
   */
  private extractReqId(input: string): string | null {
    const match = input.match(/REQ-\d+/i);
    return match ? match[0].toUpperCase() : null;
  }

  /**
   * 提取项目名称
   */
  private extractProjectName(input: string): string | null {
    const patterns = [
      /项目\s+([^\s，。,]+)/,
      /project\s+([^\s，。,]+)/i,
      /启动\s+([^\s，。,]+)/,
      /停止\s+([^\s，。,]+)/
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * 提取选项
   */
  private extractOptions(text: string): Record<string, any> {
    const options: Record<string, any> = {};

    // 优先级
    if (text.includes('高优先级') || text.includes('优先级高')) {
      options.priority = 'high';
    } else if (text.includes('中优先级') || text.includes('优先级中')) {
      options.priority = 'medium';
    } else if (text.includes('低优先级') || text.includes('优先级低')) {
      options.priority = 'low';
    }

    // 状态
    if (text.includes('进行中')) {
      options.status = 'implementing';
    } else if (text.includes('已完成')) {
      options.status = 'done';
    }

    // 端口自动分配
    if (text.includes('自动端口') || text.includes('auto')) {
      options.autoPorts = true;
    }

    return options;
  }

  /**
   * 获取所有别名
   */
  static getAliases(): CommandAlias[] {
    return this.aliases;
  }

  /**
   * 获取帮助信息
   */
  static getHelp(): string {
    let help = '\n💡 智能命令帮助\n\n';
    help += '短命令别名:\n';

    for (const alias of this.aliases) {
      help += `  ${alias.short.padEnd(12)} → ${alias.full.padEnd(20)} ${alias.description}\n`;
      help += `             示例: ${alias.example}\n\n`;
    }

    help += '\n自然语言示例:\n';
    help += '  ib "添加登录功能"\n';
    help += '  ib "查看所有需求"\n';
    help += '  ib "完成 REQ-001"\n';
    help += '  ib "启动 my-project"\n';
    help += '  ib "打开网页"\n';

    return help;
  }
}
