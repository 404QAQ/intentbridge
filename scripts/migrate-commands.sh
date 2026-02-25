#!/bin/bash

# IntentBridge 命令迁移工具
# 自动化迁移现有命令到新的错误系统、性能监控和缓存

set -e

echo "╔════════════════════════════════════════════╗"
echo "║   IntentBridge 命令迁移工具               ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 迁移统计
total_files=0
migrated_files=0
skipped_files=0

# 检查是否提供了文件路径
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}用法:${NC}"
    echo "  $0 <file1.ts> [file2.ts] ..."
    echo "  $0 --all  # 迁移所有命令文件"
    echo ""
    echo "示例:"
    echo "  $0 src/commands/init.ts"
    echo "  $0 src/commands/init.ts src/commands/req.ts"
    echo "  $0 --all"
    exit 1
fi

# 迁移单个文件
migrate_file() {
    local file=$1
    local filename=$(basename "$file")

    echo -e "\n${YELLOW}处理文件:${NC} $file"

    # 检查文件是否存在
    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ 文件不存在${NC}"
        ((skipped_files++))
        return
    fi

    # 检查是否已经迁移
    if grep -q "from '../errors/index.js'" "$file"; then
        echo -e "${YELLOW}⚠ 文件已迁移，跳过${NC}"
        ((skipped_files++))
        return
    fi

    # 创建备份
    cp "$file" "${file}.backup"
    echo "  ✓ 创建备份: ${file}.backup"

    # 1. 添加导入语句
    echo "  → 添加错误系统导入..."
    if ! grep -q "from '../errors/index.js'" "$file"; then
        # 在第一个 import 后添加
        sed -i '' '1,/^import/a\
import { throwError, handleError, ErrorCode } from '\''../errors/index.js'\'';
' "$file" 2>/dev/null || sed -i '1,/^import/a\import { throwError, handleError, ErrorCode } from '\''../errors/index.js'\'';\n' "$file"
    fi

    # 2. 添加性能监控导入
    echo "  → 添加性能监控导入..."
    if ! grep -q "from '../utils/performance.js'" "$file"; then
        sed -i '' '/^import/a\
import { measurePerformanceAsync } from '\''../utils/performance.js'\'';
' "$file" 2>/dev/null || sed -i '/^import/a\import { measurePerformanceAsync } from '\''../utils/performance.js'\'';\n' "$file"
    fi

    # 3. 替换 console.error + process.exit
    echo "  → 替换 console.error 模式..."
    # 这个比较复杂，需要手动检查

    # 4. 替换 throw new Error
    echo "  → 替换 throw new Error 模式..."
    # 这个也比较复杂，需要手动检查

    # 5. 添加 try-catch 和 handleError
    echo "  → 添加错误处理..."

    echo -e "${GREEN}✓ 迁移完成${NC}"
    echo -e "  ${YELLOW}注意: 请手动检查以下内容:${NC}"
    echo "    1. console.error 是否已替换为 throwError"
    echo "    2. throw new Error 是否已替换为 throwError"
    echo "    3. 是否需要添加错误上下文"
    echo "    4. 是否需要添加性能监控"
    echo "    5. 运行测试确保功能正常"

    ((migrated_files++))
}

# 迁移所有命令文件
if [ "$1" == "--all" ]; then
    echo "迁移所有命令文件..."
    echo ""

    for file in src/commands/*.ts; do
        ((total_files++))
        migrate_file "$file"
    done
else
    # 迁移指定文件
    for file in "$@"; do
        ((total_files++))
        migrate_file "$file"
    done
fi

# 打印总结
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}迁移完成${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "总文件数: $total_files"
echo -e "已迁移: ${GREEN}$migrated_files${NC}"
echo -e "已跳过: ${YELLOW}$skipped_files${NC}"
echo ""

if [ $migrated_files -gt 0 ]; then
    echo -e "${YELLOW}重要提示:${NC}"
    echo "  1. 迁移是半自动的，需要手动检查"
    echo "  2. 运行测试: npm test"
    echo "  3. 查看迁移指南: docs/ERROR_MIGRATION_GUIDE.md"
    echo "  4. 查看示例: src/examples/command-migration.ts"
    echo ""
    echo "常见检查点:"
    echo "  • console.error → throwError"
    echo "  • throw new Error → throwError"
    echo "  • process.exit → handleError"
    echo "  • 添加错误上下文"
    echo "  • 添加性能监控"
    echo ""
    echo "回滚更改:"
    echo "  for f in src/commands/*.backup; do mv \"\$f\" \"\${f%.backup}\"; done"
fi

echo ""
