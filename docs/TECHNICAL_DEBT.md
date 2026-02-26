# IntentBridge 技术债务跟踪

## 概述

本文档跟踪代码中的 TODO、FIXME 和计划中的改进。

---

## 未实现功能

### P1 - 高优先级

| 位置                                   | 描述                             | 状态      |
| -------------------------------------- | -------------------------------- | --------- |
| `commands/execute.ts:238`              | WebSocket 客户端连接（实时监控） | ⏳ 待实现 |
| `services/execution-supervisor.ts:194` | Claude Code 实际执行集成         | ⏳ 待实现 |
| `commands/requirement.ts:200`          | 需求澄清功能                     | ⏳ 待实现 |
| `commands/requirement.ts:209`          | 需求确认功能                     | ⏳ 待实现 |

### P2 - 中优先级

| 位置                                   | 描述                | 状态      |
| -------------------------------------- | ------------------- | --------- |
| `services/validation-engine.ts:494`    | Playwright 截图集成 | ⏳ 待实现 |
| `services/execution-supervisor.ts:277` | 文件校验和计算      | ⏳ 待实现 |
| `services/execution-supervisor.ts:397` | 复杂度实际计算      | ⏳ 待实现 |

### P3 - 低优先级

| 位置                                   | 描述             | 状态      |
| -------------------------------------- | ---------------- | --------- |
| `errors/handler.ts:316`                | 错误日志写入文件 | ⏳ 待实现 |
| `services/execution-supervisor.ts:863` | 用户通知发送     | ⏳ 待实现 |

---

## 改进建议

### 代码质量

- [x] 添加 ESLint 配置
- [x] 添加 Prettier 配置
- [x] 添加 Husky pre-commit hooks
- [ ] 添加 lint-staged 自动格式化
- [ ] 提高测试覆盖率到 90%+

### 安全

- [x] API Key 不保存明文
- [x] 支持环境变量引用
- [ ] Web Server 添加认证
- [ ] 添加 rate limiting

### 性能

- [x] 添加缓存系统
- [x] 添加性能监控
- [ ] 大文件异步处理
- [ ] 数据库查询优化

---

## 如何贡献

1. 选择一个待实现功能
2. 创建分支 `feature/xxx`
3. 实现功能并添加测试
4. 提交 PR

---

## 更新历史

- **2026-02-26**: 初始创建，记录 9 个 TODO
- **2026-02-25**: 完成 ESLint/Prettier/Husky 配置
