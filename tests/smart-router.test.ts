/**
 * 智能路由器测试
 */

import { SmartRouter } from '../src/services/smart-router.js';

console.log('🧪 测试智能路由器\n');

const router = new SmartRouter();

// 测试用例
const testCases = [
  // 自然语言测试
  { input: '添加用户登录功能', expected: { command: 'req', action: 'add' } },
  { input: '查看所有需求', expected: { command: 'req', action: 'list' } },
  { input: '完成 REQ-001', expected: { command: 'req', action: 'update' } },
  { input: '启动 my-project', expected: { command: 'project', action: 'start' } },
  { input: '停止 my-project', expected: { command: 'project', action: 'stop' } },
  { input: '打开网页', expected: { command: 'web', action: 'start' } },

  // 短命令测试
  { input: 'add 登录功能', expected: { command: 'req', action: 'add' } },
  { input: 'ls', expected: { command: 'req', action: 'list' } },
  { input: 'done REQ-001', expected: { command: 'req', action: 'update' } },
  { input: 'start my-project', expected: { command: 'project', action: 'start' } },
  { input: 'stop my-project', expected: { command: 'project', action: 'stop' } },
  { input: 'web', expected: { command: 'web', action: 'start' } },
  { input: 'ps', expected: { command: 'project', action: 'ps' } },
];

let passed = 0;
let failed = 0;

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

for (const test of testCases) {
  const result = router.parse(test.input);
  const isSuccess =
    result.command === test.expected.command &&
    result.action === test.expected.action;

  if (isSuccess) {
    console.log(`✅ ${test.input}`);
    console.log(`   → ${result.command} ${result.action || ''} ${result.args.join(' ')}`);
    passed++;
  } else {
    console.log(`❌ ${test.input}`);
    console.log(`   期望: ${test.expected.command} ${test.expected.action || ''}`);
    console.log(`   实际: ${result.command} ${result.action || ''}`);
    failed++;
  }
  console.log('');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`📊 测试结果:`);
console.log(`   ✅ 通过: ${passed}`);
console.log(`   ❌ 失败: ${failed}`);
console.log(`   成功率: ${((passed / testCases.length) * 100).toFixed(1)}%`);

// 显示帮助信息
console.log('\n' + SmartRouter.getHelp());
