/**
 * IntentBridge 命令迁移示例
 *
 * 展示如何将现有命令迁移到新的错误系统、性能监控和缓存
 */

import chalk from 'chalk';
import { isInitialized, writeProject, writeRequirements, readProject } from '../services/store.js';
import { generate } from '../services/generator.js';
import { prompt, promptWithDefault, closePrompt } from '../utils/prompt.js';
import type { ProjectConfig, RequirementsData } from '../models/types.js';

// 导入新系统
import { throwError, handleError, ErrorCode } from '../errors/index.js';
import { measurePerformanceAsync, startTimer } from '../utils/performance.js';
import { getOrSetCache, SmartCache, registerFileCache } from '../utils/cache.js';
import { startWatching } from '../utils/file-watcher.js';

/**
 * 迁移后的 init 命令（集成错误系统、性能监控）
 */
export async function initCommandMigrated(): Promise<void> {
  // 使用性能监控包装整个命令
  await measurePerformanceAsync('init 命令', async () => {
    try {
      // 检查是否已初始化
      if (isInitialized()) {
        // 使用新的错误系统
        throwError(ErrorCode.E1011, {
          cwd: process.cwd(),
          operation: 'init',
        });
      }

      console.log(chalk.bold('Initialize IntentBridge'));
      console.log('');

      // 使用计时器测量交互时间
      const inputTimer = startTimer('用户输入');

      const name = await prompt('Project name: ');
      if (!name) {
        // 使用新的错误系统
        throwError(ErrorCode.E2002, {
          field: 'name',
          message: '项目名称是必需的',
        });
      }

      const description = await promptWithDefault('Description', '');
      const techInput = await prompt('Tech stack (comma-separated): ');
      const tech_stack = techInput
        ? techInput.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const convInput = await prompt('Conventions (comma-separated, optional): ');
      const conventions = convInput
        ? convInput.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      inputTimer.stop();

      // 创建配置
      const config: ProjectConfig = {
        version: '1',
        project: { name, description, tech_stack, conventions },
      };

      // 写入配置（带性能监控）
      await measurePerformanceAsync('写入配置', () => {
        writeProject(config);
      });

      // 写入空需求
      const reqData: RequirementsData = { requirements: [] };
      await measurePerformanceAsync('写入需求', () => {
        writeRequirements(reqData);
      });

      // 生成 CLAUDE.md
      await measurePerformanceAsync('生成文件', () => {
        generate();
      });

      console.log('');
      console.log(chalk.green('✔ IntentBridge initialized.'));
      console.log(`  Created ${chalk.cyan('.intentbridge/')} directory`);
      console.log(`  Generated ${chalk.cyan('CLAUDE.md')}`);
      closePrompt();

    } catch (error) {
      // 统一错误处理
      handleError(error);
    }
  });
}

/**
 * 带缓存的配置加载器
 */
export async function loadConfigWithCache(): Promise<ProjectConfig> {
  const configPath = '.intentbridge/project.yml';
  const cacheKey = SmartCache.generateKey('config', configPath);

  // 注册文件到缓存映射（支持自动失效）
  registerFileCache(configPath, cacheKey);

  // 使用缓存
  return await getOrSetCache(
    cacheKey,
    async () => {
      // 缓存未命中，执行实际加载
      const config = readProject();

      if (!config) {
        throwError(ErrorCode.E3002, {
          configPath,
          operation: 'load',
        });
      }

      return config;
    },
    {
      ttl: 60000, // 1 分钟
      tags: ['config', 'project'],
    }
  );
}

/**
 * 带性能监控和缓存的需求列表加载器
 */
export async function loadRequirementsWithCache(): Promise<RequirementsData> {
  const reqPath = '.intentbridge/requirements.yml';
  const cacheKey = SmartCache.generateKey('requirements', reqPath);

  // 注册文件到缓存映射
  registerFileCache(reqPath, cacheKey);

  return await getOrSetCache(
    cacheKey,
    async () => {
      // 这里应该调用实际的加载函数
      // 简化示例，返回空数据
      return { requirements: [] };
    },
    {
      ttl: 30000, // 30 秒
      tags: ['requirements'],
    }
  );
}

/**
 * 迁移对比示例
 */

// ❌ 旧方式（before）
export async function oldStyleCommand(): Promise<void> {
  // 简单的 console.error
  if (!isInitialized()) {
    console.error('❌ 项目未初始化');
    console.error('请先运行 ib init');
    process.exit(1);
  }

  // 简单的 throw
  const config = readProject();
  if (!config) {
    throw new Error('配置文件不存在');
  }

  console.log('✅ 配置加载成功');
}

// ✅ 新方式（after）
export async function newStyleCommand(): Promise<void> {
  await measurePerformanceAsync('命令执行', async () => {
    try {
      // 使用错误系统
      if (!isInitialized()) {
        throwError(ErrorCode.E2023, {
          cwd: process.cwd(),
          operation: 'load',
        });
      }

      // 使用缓存和错误系统
      const config = await loadConfigWithCache();

      // 添加性能监控的日志
      console.log('✅ 配置加载成功');

    } catch (error) {
      // 统一错误处理
      handleError(error);
    }
  });
}

/**
 * 完整的命令迁移模板
 */
export async function commandTemplate(
  // 命令参数
  arg1: string,
  options: {
    option1?: string;
    option2?: boolean;
  } = {}
): Promise<void> {
  // 1. 性能监控包装
  await measurePerformanceAsync(
    '命令名称',
    async () => {
      try {
        // 2. 输入验证（使用错误系统）
        if (!arg1) {
          throwError(ErrorCode.E2002, {
            field: 'arg1',
            command: '命令名称',
          });
        }

        // 3. 检查项目状态（使用错误系统）
        if (!isInitialized()) {
          throwError(ErrorCode.E2023, {
            operation: '命令名称',
          });
        }

        // 4. 加载数据（使用缓存）
        const config = await loadConfigWithCache();

        // 5. 执行业务逻辑（带性能监控）
        const result = await measurePerformanceAsync(
          '业务操作',
          async () => {
            // 业务逻辑
            return { success: true };
          },
          {
            arg1,
            options,
          }
        );

        // 6. 输出结果
        console.log(chalk.green('✅ 操作成功'));
        console.log('结果:', result);

      } catch (error) {
        // 7. 统一错误处理
        handleError(error);
      }
    },
    {
      command: '命令名称',
      arg1,
      options,
    }
  );
}

/**
 * AI 命令示例（带缓存）
 */
export async function aiUnderstandWithCache(requirementId: string): Promise<void> {
  await measurePerformanceAsync(
    'AI 理解',
    async () => {
      try {
        // 验证需求 ID
        if (!requirementId.match(/^REQ-\d{3,}$/)) {
          throwError(ErrorCode.E2012, {
            providedId: requirementId,
            expectedFormat: 'REQ-XXX',
          });
        }

        // 检查需求是否存在
        const requirements = await loadRequirementsWithCache();
        const requirement = requirements.requirements.find(r => r.id === requirementId);

        if (!requirement) {
          throwError(ErrorCode.E2011, {
            requirementId,
            availableRequirements: requirements.requirements.map(r => r.id),
          });
        }

        // AI 理解（使用缓存）
        const cacheKey = SmartCache.generateKey('ai', 'understand', requirementId);

        const understanding = await getOrSetCache(
          cacheKey,
          async () => {
            // 调用 AI 服务
            console.log('🤖 调用 AI 服务...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟 AI 调用
            return {
              analysis: 'AI 分析结果',
              confidence: 0.95,
            };
          },
          {
            ttl: 3600000, // 1 小时
            tags: ['ai', 'understanding', requirementId],
          }
        );

        console.log('AI 理解结果:', understanding);

      } catch (error) {
        handleError(error);
      }
    },
    {
      requirementId,
    }
  );
}

/**
 * 启动文件监听器示例
 */
export function startFileWatchingExample(): void {
  const projectPath = process.cwd();

  // 开始监听项目目录
  startWatching(projectPath);

  console.log(chalk.green('👀 开始监听文件变化'));
  console.log(`  监听目录: ${projectPath}`);
  console.log('  缓存将在文件变化时自动失效');

  // 注意：在应用退出时应该停止监听
  process.on('SIGINT', () => {
    console.log('\n停止文件监听...');
    // stopWatching(projectPath);
    process.exit(0);
  });
}

/**
 * 打印性能报告示例
 */
export function printPerformanceReportExample(): void {
  const { printPerformanceReport } = await import('../utils/performance.js');
  const { getCache } = await import('../utils/cache.js');

  console.log('\n' + chalk.bold('📊 IntentBridge 性能报告'));
  console.log(chalk.gray('━'.repeat(50)));

  // 性能报告
  printPerformanceReport();

  // 缓存统计
  const cache = getCache();
  cache.printStats();
}

/**
 * 运行所有示例
 */
export async function runMigrationExamples() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   IntentBridge 命令迁移示例               ║');
  console.log('╚════════════════════════════════════════════╝');

  console.log('\n示例 1: 旧方式 vs 新方式');
  console.log('旧方式使用 console.error 和 throw new Error');
  console.log('新方式使用 throwError 和 handleError');

  console.log('\n示例 2: 配置加载（带缓存）');
  console.log('第一次调用会从文件加载');
  console.log('第二次调用会从缓存返回');

  console.log('\n示例 3: 性能监控');
  console.log('自动测量执行时间和内存使用');
  console.log('在调试模式下显示详细信息');

  console.log('\n示例 4: 文件监听');
  console.log('监听文件变化');
  console.log('自动使缓存失效');

  console.log('\n✅ 所有示例说明完成');
  console.log('\n查看源代码了解详细实现:');
  console.log('  src/examples/command-migration.ts');
}
