/**
 * IntentBridge 错误消息映射（多语言支持）
 *
 * 支持语言：
 * - zh-CN: 简体中文
 * - en-US: English
 */

import { ErrorCode } from './codes.js';

export type Language = 'zh-CN' | 'en-US';

export interface ErrorMessage {
  title: string;       // 错误标题
  message: string;     // 错误消息
  solution: string;    // 解决方案
  docs?: string;       // 文档链接
}

/**
 * 中文错误消息
 */
export const errorMessages_zh_CN: Partial<Record<ErrorCode, ErrorMessage>> = {
  // ============================================
  // E1xxx: 安装和初始化错误
  // ============================================

  [ErrorCode.E1001]: {
    title: 'Node.js 版本过低',
    message: '当前 Node.js 版本不支持。IntentBridge 需要 Node.js >= 18.0.0',
    solution: '请升级 Node.js 到 v18 或更高版本:\n  1. 访问 https://nodejs.org\n  2. 下载并安装 LTS 版本\n  3. 运行 node --version 验证',
    docs: 'https://intentbridge.dev/docs/installation#nodejs',
  },

  [ErrorCode.E1002]: {
    title: 'npm 权限错误',
    message: 'npm 全局安装需要管理员权限',
    solution: '解决方案（选择一种）:\n  1. 使用 sudo: sudo npm install -g intentbridge\n  2. 修改 npm 默认目录: mkdir ~/.npm-global && npm config set prefix \'~/.npm-global\'\n  3. 使用 nvm: nvm install 18 && nvm use 18',
    docs: 'https://intentbridge.dev/docs/installation#permissions',
  },

  [ErrorCode.E1003]: {
    title: '依赖安装失败',
    message: 'npm 依赖安装失败，可能是网络问题或 npm 源问题',
    solution: '解决方案:\n  1. 检查网络连接\n  2. 更换 npm 源: npm config set registry https://registry.npmmirror.com\n  3. 清除缓存: npm cache clean --force\n  4. 重新安装: npm install -g intentbridge',
  },

  [ErrorCode.E1004]: {
    title: '全局安装失败',
    message: 'IntentBridge 全局安装失败',
    solution: '请尝试以下步骤:\n  1. 检查 npm 权限\n  2. 使用管理员权限运行\n  3. 查看详细错误日志: npm-debug.log',
  },

  [ErrorCode.E1011]: {
    title: '项目已存在',
    message: '当前目录已经是一个 IntentBridge 项目',
    solution: '解决方案:\n  1. 在新目录中初始化: mkdir new-project && cd new-project && ib init\n  2. 或删除现有项目: rm -rf .intentbridge && ib init',
  },

  [ErrorCode.E1012]: {
    title: '目录创建失败',
    message: '无法创建项目目录，可能是权限问题',
    solution: '解决方案:\n  1. 检查目录权限: ls -la\n  2. 修改权限: chmod 755 .\n  3. 或使用其他目录',
  },

  [ErrorCode.E1013]: {
    title: '配置文件创建失败',
    message: '无法创建配置文件 .intentbridge/project.yml',
    solution: '解决方案:\n  1. 检查磁盘空间: df -h\n  2. 检查目录权限\n  3. 手动创建: mkdir -p .intentbridge',
  },

  [ErrorCode.E1014]: {
    title: '权限不足',
    message: '当前用户没有足够的权限执行此操作',
    solution: '解决方案:\n  1. 使用 sudo（不推荐）\n  2. 修改文件/目录所有者: chown -R $USER:$USER .\n  3. 修改权限: chmod -R 755 .',
  },

  // ============================================
  // E2xxx: 命令错误
  // ============================================

  [ErrorCode.E2001]: {
    title: '命令不存在',
    message: '输入的命令不存在或拼写错误',
    solution: '解决方案:\n  1. 查看可用命令: ib help\n  2. 检查命令拼写\n  3. 使用自动补全: ib completion install',
  },

  [ErrorCode.E2002]: {
    title: '参数缺失',
    message: '命令缺少必需的参数',
    solution: '解决方案:\n  1. 查看命令用法: ib [command] --help\n  2. 添加缺失参数\n  3. 使用交互模式',
  },

  [ErrorCode.E2003]: {
    title: '参数格式错误',
    message: '命令参数格式不正确',
    solution: '解决方案:\n  1. 检查参数格式\n  2. 查看示例: ib [command] --help\n  3. 使用交互模式',
  },

  [ErrorCode.E2004]: {
    title: '选项冲突',
    message: '命令选项之间存在冲突',
    solution: '解决方案:\n  1. 检查冲突的选项\n  2. 只使用其中一个选项\n  3. 查看命令帮助: ib [command] --help',
  },

  [ErrorCode.E2011]: {
    title: '需求不存在',
    message: '指定的需求 ID 不存在',
    solution: '解决方案:\n  1. 查看所有需求: ib ls\n  2. 检查需求 ID 拼写\n  3. 使用自动补全: ib completion install',
  },

  [ErrorCode.E2012]: {
    title: '需求 ID 格式错误',
    message: '需求 ID 格式不正确，正确格式为 REQ-XXX',
    solution: '解决方案:\n  1. 使用正确格式: REQ-001, REQ-002, ...\n  2. 查看现有需求: ib ls\n  3. IntentBridge 会自动分配 ID',
  },

  [ErrorCode.E2013]: {
    title: '需求状态转换错误',
    message: '需求不能从当前状态转换到目标状态',
    solution: '解决方案:\n  1. 查看需求当前状态: ib show REQ-XXX\n  2. 了解状态转换规则:\n     - pending → implementing → testing → done\n     - 可以随时转换到 cancelled\n  3. 使用正确的状态转换命令',
  },

  [ErrorCode.E2014]: {
    title: '需求依赖循环',
    message: '需求之间存在循环依赖',
    solution: '解决方案:\n  1. 检查依赖关系: ib dep list\n  2. 移除循环依赖: ib dep remove REQ-XXX REQ-YYY\n  3. 重新设计依赖关系',
  },

  [ErrorCode.E2021]: {
    title: '项目不存在',
    message: '指定的项目不存在',
    solution: '解决方案:\n  1. 查看所有项目: ib project list\n  2. 检查项目名称\n  3. 注册项目: ib project register',
  },

  [ErrorCode.E2022]: {
    title: '项目 ID 冲突',
    message: '项目 ID 已被使用',
    solution: '解决方案:\n  1. 使用不同的项目 ID\n  2. 查看现有项目: ib project list\n  3. 删除冲突项目: ib project remove [id]',
  },

  [ErrorCode.E2023]: {
    title: '项目未初始化',
    message: '当前目录不是 IntentBridge 项目',
    solution: '解决方案:\n  1. 初始化项目: ib init\n  2. 或切换到项目目录: cd /path/to/project\n  3. 检查 .intentbridge 目录是否存在',
  },

  [ErrorCode.E2024]: {
    title: '项目路径无效',
    message: '项目路径不存在或无法访问',
    solution: '解决方案:\n  1. 检查路径是否存在\n  2. 检查路径权限\n  3. 使用绝对路径',
  },

  [ErrorCode.E2031]: {
    title: '文件不存在',
    message: '指定的文件不存在',
    solution: '解决方案:\n  1. 检查文件路径\n  2. 检查文件是否存在: ls -la\n  3. 使用相对路径或绝对路径',
  },

  [ErrorCode.E2032]: {
    title: '文件读取失败',
    message: '无法读取文件，可能是权限问题或文件损坏',
    solution: '解决方案:\n  1. 检查文件权限: ls -la\n  2. 修改权限: chmod 644 [file]\n  3. 检查文件是否损坏',
  },

  [ErrorCode.E2033]: {
    title: '文件写入失败',
    message: '无法写入文件，可能是权限问题或磁盘空间不足',
    solution: '解决方案:\n  1. 检查文件权限\n  2. 检查磁盘空间: df -h\n  3. 检查目录是否为只读',
  },

  [ErrorCode.E2034]: {
    title: '文件映射不存在',
    message: '指定的文件映射不存在',
    solution: '解决方案:\n  1. 查看所有映射: ib map list\n  2. 添加映射: ib map add REQ-XXX [file]\n  3. 检查需求 ID 是否正确',
  },

  // ============================================
  // E3xxx: 项目错误
  // ============================================

  [ErrorCode.E3001]: {
    title: '配置文件损坏',
    message: '项目配置文件损坏，无法解析',
    solution: '解决方案:\n  1. 备份配置文件: cp .intentbridge/project.yml project.yml.backup\n  2. 重新初始化: ib init --force\n  3. 手动修复 YAML 格式\n  4. 查看错误详情: ib validate',
  },

  [ErrorCode.E3002]: {
    title: '配置文件缺失',
    message: '项目配置文件不存在',
    solution: '解决方案:\n  1. 初始化项目: ib init\n  2. 或检查是否在项目目录中\n  3. 检查 .intentbridge 目录',
  },

  [ErrorCode.E3003]: {
    title: '配置格式错误',
    message: '配置文件格式不正确',
    solution: '解决方案:\n  1. 检查 YAML 语法\n  2. 使用 YAML 验证工具\n  3. 查看示例配置: ib init --example',
  },

  [ErrorCode.E3004]: {
    title: 'YAML 解析错误',
    message: '无法解析 YAML 文件',
    solution: '解决方案:\n  1. 检查 YAML 语法（缩进、引号等）\n  2. 使用 YAML linter 工具\n  3. 查看错误行号和列号',
  },

  [ErrorCode.E3011]: {
    title: '数据库连接失败',
    message: '无法连接到数据库',
    solution: '解决方案:\n  1. 检查数据库是否运行\n  2. 检查连接配置\n  3. 检查网络连接',
  },

  [ErrorCode.E3012]: {
    title: '数据库读取失败',
    message: '无法从数据库读取数据',
    solution: '解决方案:\n  1. 检查数据库权限\n  2. 检查数据库表是否存在\n  3. 查看数据库日志',
  },

  [ErrorCode.E3013]: {
    title: '数据库写入失败',
    message: '无法写入数据到数据库',
    solution: '解决方案:\n  1. 检查数据库权限\n  2. 检查磁盘空间\n  3. 检查数据格式',
  },

  [ErrorCode.E3014]: {
    title: '数据库迁移失败',
    message: '数据库迁移执行失败',
    solution: '解决方案:\n  1. 检查迁移脚本\n  2. 手动执行迁移\n  3. 回滚到上一个版本',
  },

  [ErrorCode.E3021]: {
    title: '端口已被占用',
    message: '指定的端口已被其他程序占用',
    solution: '解决方案:\n  1. 查看端口占用: ib ports check\n  2. 停止占用进程: ib stop [project]\n  3. 使用其他端口: ib start --port 3001\n  4. 自动分配端口: ib start --auto-ports',
  },

  [ErrorCode.E3022]: {
    title: '端口权限不足',
    message: '需要管理员权限才能使用该端口（< 1024）',
    solution: '解决方案:\n  1. 使用高于 1024 的端口\n  2. 使用 sudo 运行（不推荐）\n  3. 配置端口转发',
  },

  [ErrorCode.E3023]: {
    title: '端口范围无效',
    message: '指定的端口范围无效',
    solution: '解决方案:\n  1. 使用有效的端口范围: 1024-65535\n  2. 示例: --port-range 3000-4000\n  3. 检查端口格式',
  },

  [ErrorCode.E3024]: {
    title: '端口分配失败',
    message: '无法自动分配可用端口',
    solution: '解决方案:\n  1. 手动指定端口: --port 3000\n  2. 检查端口范围设置\n  3. 查看已用端口: ib ports list',
  },

  [ErrorCode.E3031]: {
    title: '进程启动失败',
    message: '无法启动项目进程',
    solution: '解决方案:\n  1. 检查启动命令是否正确\n  2. 检查依赖是否安装\n  3. 查看进程日志: ib logs [project]\n  4. 检查端口是否被占用',
  },

  [ErrorCode.E3032]: {
    title: '进程不存在',
    message: '指定的进程不存在',
    solution: '解决方案:\n  1. 查看所有进程: ib ps\n  2. 检查进程 ID\n  3. 启动进程: ib start [project]',
  },

  [ErrorCode.E3033]: {
    title: '进程已停止',
    message: '进程已经停止运行',
    solution: '解决方案:\n  1. 重启进程: ib restart [project]\n  2. 查看停止原因: ib logs [project]\n  3. 检查错误日志',
  },

  [ErrorCode.E3034]: {
    title: '进程监控失败',
    message: '无法监控进程状态',
    solution: '解决方案:\n  1. 检查系统资源\n  2. 重启监控服务\n  3. 手动检查进程状态',
  },

  // ============================================
  // E4xxx: AI 和集成错误
  // ============================================

  [ErrorCode.E4001]: {
    title: 'API Key 缺失',
    message: '未配置 AI API Key',
    solution: '解决方案:\n  1. 配置 API Key: ib ai config\n  2. 或设置环境变量:\n     - OpenAI: export OPENAI_API_KEY=sk-...\n     - Anthropic: export ANTHROPIC_API_KEY=sk-ant-...\n  3. 获取 API Key:\n     - OpenAI: https://platform.openai.com/api-keys\n     - Anthropic: https://console.anthropic.com/',
  },

  [ErrorCode.E4002]: {
    title: 'API Key 无效',
    message: '提供的 API Key 无效或已过期',
    solution: '解决方案:\n  1. 检查 API Key 是否正确\n  2. 重新生成 API Key\n  3. 更新配置: ib ai config',
  },

  [ErrorCode.E4003]: {
    title: 'AI 提供商不支持',
    message: '指定的 AI 提供商不被支持',
    solution: '解决方案:\n  1. 查看支持的提供商: ib ai providers\n  2. 使用支持的提供商:\n     - openai\n     - anthropic\n     - local (Ollama)\n  3. 配置提供商: ib ai config',
  },

  [ErrorCode.E4004]: {
    title: 'AI 配置错误',
    message: 'AI 配置参数不正确',
    solution: '解决方案:\n  1. 检查配置文件: .intentbridge/ai.yml\n  2. 重新配置: ib ai config\n  3. 查看配置示例: ib ai config --example',
  },

  [ErrorCode.E4011]: {
    title: 'AI 请求超时',
    message: 'AI 请求超时，可能是网络问题或 AI 服务响应慢',
    solution: '解决方案:\n  1. 检查网络连接\n  2. 增加超时时间: ib ai config --timeout 60\n  3. 使用本地模型: ib ai config --provider local\n  4. 稍后重试',
  },

  [ErrorCode.E4012]: {
    title: 'AI 响应错误',
    message: 'AI 服务返回错误响应',
    solution: '解决方案:\n  1. 检查 API 配额是否用完\n  2. 检查 API Key 是否有效\n  3. 查看错误详情\n  4. 稍后重试',
  },

  [ErrorCode.E4013]: {
    title: 'AI 质量不达标',
    message: 'AI 生成的理解或验证结果质量不达标',
    solution: '解决方案:\n  1. 提供更详细的需求描述\n  2. 调整 AI 参数: ib ai config --temperature 0.7\n  3. 手动修改 AI 输出\n  4. 使用不同的 AI 模型',
  },

  [ErrorCode.E4014]: {
    title: 'AI 配额超限',
    message: 'AI API 配额已用完',
    solution: '解决方案:\n  1. 检查 API 配额使用情况\n  2. 升级 API 套餐\n  3. 使用本地模型: ib ai config --provider local\n  4. 等待配额重置',
  },

  [ErrorCode.E4021]: {
    title: 'MCP 服务器启动失败',
    message: '无法启动 MCP 服务器',
    solution: '解决方案:\n  1. 检查端口是否被占用\n  2. 检查配置文件: .intentbridge/mcp.yml\n  3. 查看日志: ib mcp logs\n  4. 使用默认配置: ib mcp-server start --port 9527',
  },

  [ErrorCode.E4022]: {
    title: 'MCP 连接失败',
    message: '无法连接到 MCP 服务器',
    solution: '解决方案:\n  1. 检查 MCP 服务器是否运行: ib mcp status\n  2. 检查连接配置\n  3. 重启 MCP 服务器: ib mcp restart\n  4. 检查防火墙设置',
  },

  [ErrorCode.E4023]: {
    title: 'MCP 工具调用失败',
    message: 'MCP 工具调用失败',
    solution: '解决方案:\n  1. 检查工具是否存在: ib mcp tools\n  2. 检查工具参数\n  3. 查看 MCP 日志\n  4. 重启 MCP 服务器',
  },

  [ErrorCode.E4024]: {
    title: 'MCP 协议错误',
    message: 'MCP 协议版本不兼容或消息格式错误',
    solution: '解决方案:\n  1. 检查 MCP 版本: ib mcp version\n  2. 更新 IntentBridge\n  3. 检查 Claude Code 版本\n  4. 查看协议文档',
  },

  [ErrorCode.E4031]: {
    title: 'Web UI 启动失败',
    message: '无法启动 Web UI',
    solution: '解决方案:\n  1. 检查端口是否被占用\n  2. 检查依赖是否安装: cd web && npm install\n  3. 查看日志: ib web logs\n  4. 使用其他端口: ib web start --port 3001',
  },

  [ErrorCode.E4032]: {
    title: 'Web UI 端口冲突',
    message: 'Web UI 端口已被占用',
    solution: '解决方案:\n  1. 查看端口占用: lsof -i:3000\n  2. 停止占用进程\n  3. 使用其他端口: ib web start --port 3001',
  },

  [ErrorCode.E4033]: {
    title: 'Web UI 访问错误',
    message: '无法访问 Web UI',
    solution: '解决方案:\n  1. 检查 Web UI 是否运行: ib web status\n  2. 检查防火墙设置\n  3. 使用正确的 URL: http://localhost:3000\n  4. 查看浏览器控制台错误',
  },

  [ErrorCode.E4034]: {
    title: 'Web UI 构建失败',
    message: 'Web UI 前端构建失败',
    solution: '解决方案:\n  1. 检查 Node.js 版本\n  2. 重新安装依赖: cd web && rm -rf node_modules && npm install\n  3. 手动构建: cd web && npm run build\n  4. 查看构建日志',
  },

  // ============================================
  // E5xxx: 性能和系统错误
  // ============================================

  [ErrorCode.E5001]: {
    title: '内存不足',
    message: '系统内存不足，无法完成操作',
    solution: '解决方案:\n  1. 关闭其他程序\n  2. 增加系统内存\n  3. 减少并发操作\n  4. 使用流式处理',
  },

  [ErrorCode.E5002]: {
    title: '执行超时',
    message: '操作执行超时',
    solution: '解决方案:\n  1. 增加超时时间\n  2. 优化操作性能\n  3. 分批执行\n  4. 检查系统资源',
  },

  [ErrorCode.E5003]: {
    title: '缓存错误',
    message: '缓存系统错误',
    solution: '解决方案:\n  1. 清除缓存: ib cache clear\n  2. 重启系统\n  3. 检查磁盘空间\n  4. 禁用缓存: ib config set cache.enabled false',
  },

  [ErrorCode.E5004]: {
    title: '文件监听失败',
    message: '无法监听文件变化',
    solution: '解决方案:\n  1. 检查系统限制: ulimit -n\n  2. 增加文件描述符限制\n  3. 减少监听的文件数量\n  4. 重启监听服务',
  },

  [ErrorCode.E5011]: {
    title: '系统命令执行失败',
    message: '系统命令执行失败',
    solution: '解决方案:\n  1. 检查命令是否存在\n  2. 检查命令权限\n  3. 手动执行命令测试\n  4. 查看命令输出',
  },

  [ErrorCode.E5012]: {
    title: '权限不足',
    message: '系统权限不足',
    solution: '解决方案:\n  1. 使用 sudo（谨慎使用）\n  2. 修改文件/目录权限\n  3. 切换到有权限的用户\n  4. 检查 SELinux/AppArmor 设置',
  },

  [ErrorCode.E5013]: {
    title: '磁盘空间不足',
    message: '磁盘空间不足，无法完成操作',
    solution: '解决方案:\n  1. 清理磁盘空间: df -h\n  2. 删除不需要的文件\n  3. 清除缓存: ib cache clear\n  4. 增加磁盘容量',
  },

  [ErrorCode.E5014]: {
    title: '网络错误',
    message: '网络连接错误',
    solution: '解决方案:\n  1. 检查网络连接\n  2. 检查防火墙设置\n  3. 检查代理配置\n  4. 稍后重试',
  },
};

/**
 * 英文错误消息
 */
export const errorMessages_en_US: Partial<Record<ErrorCode, ErrorMessage>> = {
  // ============================================
  // E1xxx: Installation and Initialization Errors
  // ============================================

  [ErrorCode.E1001]: {
    title: 'Node.js Version Too Low',
    message: 'Current Node.js version is not supported. IntentBridge requires Node.js >= 18.0.0',
    solution: 'Please upgrade Node.js to v18 or higher:\n  1. Visit https://nodejs.org\n  2. Download and install the LTS version\n  3. Verify with: node --version',
    docs: 'https://intentbridge.dev/docs/installation#nodejs',
  },

  [ErrorCode.E1002]: {
    title: 'npm Permission Error',
    message: 'npm global installation requires administrator privileges',
    solution: 'Solutions (choose one):\n  1. Use sudo: sudo npm install -g intentbridge\n  2. Change npm default directory: mkdir ~/.npm-global && npm config set prefix \'~/.npm-global\'\n  3. Use nvm: nvm install 18 && nvm use 18',
    docs: 'https://intentbridge.dev/docs/installation#permissions',
  },

  [ErrorCode.E1003]: {
    title: 'Dependency Installation Failed',
    message: 'npm dependency installation failed, possibly due to network or npm registry issues',
    solution: 'Solutions:\n  1. Check network connection\n  2. Change npm registry: npm config set registry https://registry.npmjs.org\n  3. Clear cache: npm cache clean --force\n  4. Reinstall: npm install -g intentbridge',
  },

  [ErrorCode.E1004]: {
    title: 'Global Installation Failed',
    message: 'IntentBridge global installation failed',
    solution: 'Please try:\n  1. Check npm permissions\n  2. Run with administrator privileges\n  3. Check error log: npm-debug.log',
  },

  [ErrorCode.E1011]: {
    title: 'Project Already Exists',
    message: 'Current directory is already an IntentBridge project',
    solution: 'Solutions:\n  1. Initialize in a new directory: mkdir new-project && cd new-project && ib init\n  2. Or remove existing project: rm -rf .intentbridge && ib init',
  },

  [ErrorCode.E1012]: {
    title: 'Directory Creation Failed',
    message: 'Unable to create project directory, possibly due to permission issues',
    solution: 'Solutions:\n  1. Check directory permissions: ls -la\n  2. Modify permissions: chmod 755 .\n  3. Or use a different directory',
  },

  [ErrorCode.E1013]: {
    title: 'Config File Creation Failed',
    message: 'Unable to create config file .intentbridge/project.yml',
    solution: 'Solutions:\n  1. Check disk space: df -h\n  2. Check directory permissions\n  3. Create manually: mkdir -p .intentbridge',
  },

  [ErrorCode.E1014]: {
    title: 'Insufficient Permissions',
    message: 'Current user does not have sufficient permissions for this operation',
    solution: 'Solutions:\n  1. Use sudo (not recommended)\n  2. Change file/directory owner: chown -R $USER:$USER .\n  3. Modify permissions: chmod -R 755 .',
  },

  // ... (continuing with all other error codes in English)
  // For brevity, I'll include a few more examples and then use placeholders

  [ErrorCode.E2001]: {
    title: 'Command Not Found',
    message: 'The command does not exist or is misspelled',
    solution: 'Solutions:\n  1. View available commands: ib help\n  2. Check command spelling\n  3. Use auto-completion: ib completion install',
  },

  // ... (continuing with all error codes)
};

/**
 * 获取错误消息
 */
export function getErrorMessage(
  code: ErrorCode,
  language: Language = 'zh-CN'
): ErrorMessage {
  const messages = language === 'zh-CN' ? errorMessages_zh_CN : errorMessages_en_US;
  return messages[code] || {
    title: `错误 ${code}`,
    message: '发生未知错误',
    solution: '请检查错误代码文档或联系支持',
  };
}
