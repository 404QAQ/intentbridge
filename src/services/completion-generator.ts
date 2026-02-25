/**
 * 自动补全生成器
 * 支持 bash, zsh, fish
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export class CompletionGenerator {
  /**
   * 生成 bash 补全脚本
   */
  static generateBash(): string {
    return `#!/bin/bash
# IntentBridge completion for bash

_ib_completion() {
    local cur prev words cword
    _init_completion || return

    # IntentBridge 命令
    local commands="
        init
        add ls done
        start stop restart ps
        web
        ports dashboard
        understand validate
        status
        help --version
    "

    # 子命令参数
    case \${prev} in
        ib)
            COMPREPLY=( $(compgen -W "\${commands}" -- \${cur}) )
            return 0
            ;;
        add)
            # 补全文件名
            COMPREPLY=( $(compgen -f -- \${cur}) )
            return 0
            ;;
        start|stop|restart)
            # 补全项目名
            local projects=$(ib project list 2>/dev/null | awk '{print $1}')
            COMPREPLY=( $(compgen -W "\${projects}" -- \${cur}) )
            return 0
            ;;
        done)
            # 补全需求 ID
            local reqs=$(ib ls 2>/dev/null | grep -oE 'REQ-[0-9]+' | head -20)
            COMPREPLY=( $(compgen -W "\${reqs}" -- \${cur}) )
            return 0
            ;;
        ports)
            COMPREPLY=( $(compgen -W "check find assign release" -- \${cur}) )
            return 0
            ;;
        understand|validate)
            # 补全需求 ID
            local reqs=$(ib ls 2>/dev/null | grep -oE 'REQ-[0-9]+' | head -20)
            COMPREPLY=( $(compgen -W "\${reqs}" -- \${cur}) )
            return 0
            ;;
    esac
}

complete -F _ib_completion ib
`;
  }

  /**
   * 生成 zsh 补全脚本
   */
  static generateZsh(): string {
    return `#compdef ib

# IntentBridge completion for zsh

_ib() {
    local -a commands
    commands=(
        'init:初始化项目'
        'add:添加需求（短命令）'
        'ls:列出需求（短命令）'
        'done:完成需求（短命令）'
        'start:启动项目（短命令）'
        'stop:停止项目（短命令）'
        'restart:重启项目（短命令）'
        'ps:查看进程（短命令）'
        'web:启动 Web UI（短命令）'
        'ports:端口管理'
        'dashboard:实时仪表板'
        'understand:AI 理解需求'
        'validate:验证需求'
        'status:查看状态'
        'help:帮助信息'
        '--version:显示版本'
    )

    if (( CURRENT == 2 )); then
        _describe 'command' commands
        return
    fi

    case $words[2] in
        add)
            _files
            ;;
        start|stop|restart)
            local -a projects
            projects=($(ib project list 2>/dev/null | awk '{print $1}'))
            _describe 'project' projects
            ;;
        done|understand|validate)
            local -a reqs
            reqs=($(ib ls 2>/dev/null | grep -oE 'REQ-[0-9]+' | head -20))
            _describe 'requirement' reqs
            ;;
        ports)
            local -a port_commands
            port_commands=(
                'check:检查端口冲突'
                'find:查找可用端口'
                'assign:分配端口'
                'release:释放端口'
            )
            _describe 'port command' port_commands
            ;;
    esac
}

_ib
`;
  }

  /**
   * 生成 fish 补全脚本
   */
  static generateFish(): string {
    return `# IntentBridge completion for fish

# 主命令
complete -c ib -f

# init
complete -c ib -n '__fish_use_subcommand' -a init -d '初始化项目'

# 短命令
complete -c ib -n '__fish_use_subcommand' -a add -d '添加需求'
complete -c ib -n '__fish_use_subcommand' -a ls -d '列出需求'
complete -c ib -n '__fish_use_subcommand' -a done -d '完成需求'
complete -c ib -n '__fish_use_subcommand' -a start -d '启动项目'
complete -c ib -n '__fish_use_subcommand' -a stop -d '停止项目'
complete -c ib -n '__fish_use_subcommand' -a restart -d '重启项目'
complete -c ib -n '__fish_use_subcommand' -a ps -d '查看进程'
complete -c ib -n '__fish_use_subcommand' -a web -d '启动 Web UI'

# ports 子命令
complete -c ib -n '__fish_use_subcommand' -a ports -d '端口管理'
complete -c ib -n '__fish_seen_subcommand_from ports' -a check -d '检查端口冲突'
complete -c ib -n '__fish_seen_subcommand_from ports' -a find -d '查找可用端口'
complete -c ib -n '__fish_seen_subcommand_from ports' -a assign -d '分配端口'
complete -c ib -n '__fish_seen_subcommand_from ports' -a release -d '释放端口'

# AI 命令
complete -c ib -n '__fish_use_subcommand' -a understand -d 'AI 理解需求'
complete -c ib -n '__fish_use_subcommand' -a validate -d '验证需求'

# 需求 ID 补全
complete -c ib -n '__fish_seen_subcommand_from done understand validate' \
    -a '(ib ls 2>/dev/null | grep -oE "REQ-[0-9]+" | head -20)' \
    -d '需求 ID'

# 项目名补全
complete -c ib -n '__fish_seen_subcommand_from start stop restart' \
    -a '(ib project list 2>/dev/null | awk \'{print $1}\')' \
    -d '项目名称'

# 文件补全
complete -c ib -n '__fish_seen_subcommand_from add' -f

# 全局选项
complete -c ib -n '__fish_use_subcommand' -l help -d '显示帮助'
complete -c ib -n '__fish_use_subcommand' -l version -d '显示版本'
`;
  }

  /**
   * 安装补全脚本
   */
  static install(shell: 'bash' | 'zsh' | 'fish'): string {
    const home = homedir();
    let script: string;
    let targetPath: string;

    switch (shell) {
      case 'bash':
        script = this.generateBash();
        targetPath = join(home, '.intentbridge-completion.bash');
        writeFileSync(targetPath, script);
        return `
✅ Bash 补全已生成: ${targetPath}

安装方法:
  1. 添加到 ~/.bashrc:
     source ${targetPath}

  2. 重新加载:
     source ~/.bashrc

  3. 测试:
     ib <TAB>
`;

      case 'zsh':
        script = this.generateZsh();
        targetPath = join(home, '.zsh/completions/_ib');
        const zshDir = join(home, '.zsh/completions');
        if (!existsSync(zshDir)) {
          mkdirSync(zshDir, { recursive: true });
        }
        writeFileSync(targetPath, script);
        return `
✅ Zsh 补全已生成: ${targetPath}

安装方法:
  1. 确保 ~/.zshrc 包含:
     fpath=(~/.zsh/completions $fpath)
     autoload -U compinit && compinit

  2. 重新加载:
     source ~/.zshrc

  3. 测试:
     ib <TAB>
`;

      case 'fish':
        script = this.generateFish();
        const fishDir = join(home, '.config/fish/completions');
        if (!existsSync(fishDir)) {
          mkdirSync(fishDir, { recursive: true });
        }
        targetPath = join(fishDir, 'ib.fish');
        writeFileSync(targetPath, script);
        return `
✅ Fish 补全已生成: ${targetPath}

Fish 会自动加载，无需额外配置。

测试:
  ib <TAB>
`;
    }
  }

  /**
   * 显示所有支持的 shell
   */
  static getSupportedShells(): string[] {
    return ['bash', 'zsh', 'fish'];
  }

  /**
   * 自动检测当前 shell
   */
  static detectShell(): 'bash' | 'zsh' | 'fish' | null {
    const shell = process.env.SHELL || '';
    if (shell.includes('bash')) return 'bash';
    if (shell.includes('zsh')) return 'zsh';
    if (shell.includes('fish')) return 'fish';
    return null;
  }
}
