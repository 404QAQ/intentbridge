/**
 * 补全命令处理
 */

import { CompletionGenerator } from '../services/completion-generator.js';

export async function completionCommand(shell?: string): Promise<void> {
  console.log('\n🔧 IntentBridge 自动补全安装\n');

  // 如果没有指定 shell，自动检测
  if (!shell) {
    const detected = CompletionGenerator.detectShell();
    if (detected) {
      console.log(`🔍 检测到当前 shell: ${detected}`);
      shell = detected;
    } else {
      console.log('❌ 无法自动检测 shell，请手动指定');
      console.log('\n支持的 shell:');
      console.log('  bash  - Bash');
      console.log('  zsh   - Zsh');
      console.log('  fish  - Fish');
      console.log('\n用法:');
      console.log('  ib completion install bash');
      console.log('  ib completion install zsh');
      console.log('  ib completion install fish');
      process.exit(1);
    }
  }

  // 验证 shell 类型
  const supportedShells = CompletionGenerator.getSupportedShells();
  if (!supportedShells.includes(shell)) {
    console.log(`❌ 不支持的 shell: ${shell}`);
    console.log(`\n支持的 shell: ${supportedShells.join(', ')}`);
    process.exit(1);
  }

  // 安装补全
  const message = CompletionGenerator.install(shell as 'bash' | 'zsh' | 'fish');
  console.log(message);
}

export function completionHelpCommand(): void {
  console.log(`
IntentBridge 自动补全

用法:
  ib completion install [shell]    安装自动补全
  ib completion generate [shell]   生成补全脚本
  ib completion help               显示帮助

支持的 shell:
  bash  - Bash
  zsh   - Zsh
  fish  - Fish

示例:
  # 自动检测并安装
  ib completion install

  # 指定 shell 安装
  ib completion install bash
  ib completion install zsh
  ib completion install fish

  # 仅生成脚本（不安装）
  ib completion generate bash

提示:
  - 安装后需要重新加载 shell 配置
  - Bash: source ~/.bashrc
  - Zsh: source ~/.zshrc
  - Fish: 无需操作（自动加载）
`);
}

export async function completionGenerateCommand(shell?: string): Promise<void> {
  if (!shell) {
    console.log('❌ 请指定 shell 类型');
    console.log('\n用法:');
    console.log('  ib completion generate bash');
    console.log('  ib completion generate zsh');
    console.log('  ib completion generate fish');
    process.exit(1);
  }

  const supportedShells = CompletionGenerator.getSupportedShells();
  if (!supportedShells.includes(shell)) {
    console.log(`❌ 不支持的 shell: ${shell}`);
    console.log(`\n支持的 shell: ${supportedShells.join(', ')}`);
    process.exit(1);
  }

  let script: string;
  switch (shell) {
    case 'bash':
      script = CompletionGenerator.generateBash();
      break;
    case 'zsh':
      script = CompletionGenerator.generateZsh();
      break;
    case 'fish':
      script = CompletionGenerator.generateFish();
      break;
    default:
      console.log('❌ 未知 shell 类型');
      process.exit(1);
  }

  console.log(script);
}
