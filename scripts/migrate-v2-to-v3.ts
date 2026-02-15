#!/usr/bin/env node

/**
 * IntentBridge v2 → v3 数据迁移工具
 *
 * 功能：
 * 1. 自动检测 v2 数据格式
 * 2. 添加 v3 字段（向后兼容）
 * 3. 生成迁移报告
 *
 * 使用：
 *   node scripts/migrate-v2-to-v3.ts [--dry-run]
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import type { Requirement, RequirementsData } from '../src/models/types.js';

const DRY_RUN = process.argv.includes('--dry-run');

interface MigrationReport {
  timestamp: string;
  version: {
    from: string;
    to: string;
  };
  requirements: {
    total: number;
    migrated: number;
    skipped: number;
    errors: string[];
  };
  details: Array<{
    id: string;
    status: 'migrated' | 'skipped' | 'error';
    message?: string;
  }>;
}

/**
 * 检测是否是 v2 格式
 */
function isV2Format(req: any): boolean {
  // v2 格式没有 v3 字段
  return (
    req.id &&
    req.title &&
    req.description &&
    req.status &&
    req.priority &&
    req.created &&
    Array.isArray(req.files) &&
    !req.features &&  // v3 字段不存在
    !req.validation_rules &&
    !req.execution &&
    !req.validation
  );
}

/**
 * 迁移单个需求
 */
function migrateRequirement(req: any): Requirement {
  const migrated: Requirement = {
    // 保留所有 v2 字段
    ...req,

    // 添加 v3 字段（默认空值）
    features: req.features || [],
    validation_rules: req.validation_rules || [],
    execution: req.execution || {
      status: 'pending',
    },
    validation: req.validation || {
      status: 'pending',
      match_score: 0,
      evidence: [],
    },
  };

  return migrated;
}

/**
 * 主迁移函数
 */
async function migrate(cwd: string = process.cwd()): Promise<MigrationReport> {
  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    version: {
      from: '2.4.0',
      to: '3.0.0',
    },
    requirements: {
      total: 0,
      migrated: 0,
      skipped: 0,
      errors: [],
    },
    details: [],
  };

  const intentBridgeDir = join(cwd, '.intentbridge');
  const requirementsPath = join(intentBridgeDir, 'requirements.yml');

  // 检查是否存在 requirements.yml
  if (!existsSync(requirementsPath)) {
    console.log('✅ 没有找到 requirements.yml，无需迁移');
    return report;
  }

  console.log('🔍 检测到 requirements.yml，开始迁移...\n');

  try {
    // 读取现有数据
    const raw = readFileSync(requirementsPath, 'utf-8');
    const data = yaml.load(raw) as RequirementsData;

    if (!data.requirements || data.requirements.length === 0) {
      console.log('✅ 没有需求需要迁移');
      return report;
    }

    report.requirements.total = data.requirements.length;

    // 迁移每个需求
    const migratedRequirements: Requirement[] = [];

    for (const req of data.requirements) {
      try {
        if (isV2Format(req)) {
          // v2 格式，需要迁移
          const migrated = migrateRequirement(req);
          migratedRequirements.push(migrated);

          report.requirements.migrated++;
          report.details.push({
            id: req.id,
            status: 'migrated',
            message: '成功添加 v3 字段',
          });

          console.log(`  ✅ ${req.id}: 已迁移`);
        } else {
          // 已经是 v3 格式，跳过
          migratedRequirements.push(req);

          report.requirements.skipped++;
          report.details.push({
            id: req.id,
            status: 'skipped',
            message: '已经是 v3 格式',
          });

          console.log(`  ⏭️  ${req.id}: 已是 v3 格式，跳过`);
        }
      } catch (error: any) {
        // 迁移失败
        migratedRequirements.push(req);  // 保留原数据

        report.requirements.errors.push(`${req.id}: ${error.message}`);
        report.details.push({
          id: req.id,
          status: 'error',
          message: error.message,
        });

        console.log(`  ❌ ${req.id}: 迁移失败 - ${error.message}`);
      }
    }

    // 写入迁移后的数据
    if (!DRY_RUN && report.requirements.migrated > 0) {
      const migratedData: RequirementsData = {
        requirements: migratedRequirements,
        milestones: data.milestones,
      };

      writeFileSync(
        requirementsPath,
        yaml.dump(migratedData, { lineWidth: -1 })
      );

      console.log('\n✅ 迁移完成，数据已写入');
    } else if (DRY_RUN) {
      console.log('\n🔍 [DRY RUN] 未写入文件');
    }

    // 保存迁移报告
    const reportPath = join(intentBridgeDir, 'migration-report.json');
    if (!DRY_RUN) {
      writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📄 迁移报告已保存：${reportPath}`);
    }

    return report;
  } catch (error: any) {
    console.error('❌ 迁移失败：', error.message);
    throw error;
  }
}

// 执行迁移
migrate()
  .then((report) => {
    console.log('\n📊 迁移统计：');
    console.log(`  总需求数：${report.requirements.total}`);
    console.log(`  已迁移：${report.requirements.migrated}`);
    console.log(`  已跳过：${report.requirements.skipped}`);
    console.log(`  错误：${report.requirements.errors.length}`);

    if (report.requirements.errors.length > 0) {
      console.log('\n❌ 错误详情：');
      report.requirements.errors.forEach((err) => console.log(`  - ${err}`));
      process.exit(1);
    }

    console.log('\n✅ Phase 0 数据迁移完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 迁移失败：', error);
    process.exit(1);
  });
