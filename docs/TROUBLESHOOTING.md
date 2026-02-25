# 🔧 IntentBridge 故障排查指南

遇到问题？别担心！这个指南帮你快速解决常见问题。

---

## 📋 目录

- [安装问题](#安装问题)
- [命令问题](#命令问题)
- [项目问题](#项目问题)
- [端口问题](#端口问题)
- [AI 功能问题](#ai-功能问题)
- [Web UI 问题](#web-ui-问题)
- [性能问题](#性能问题)

---

## 安装问题

### ❌ 问题 1: Node.js 版本过低

**症状**:
```
Error: IntentBridge requires Node.js 18.0.0 or higher
Current version: 16.x.x
```

**原因**: Node.js 版本不满足要求

**解决方案**:

**macOS/Linux**:
```bash
# 使用 Homebrew
brew install node@22
brew link node@22 --force

# 或使用 nvm
nvm install 22
nvm use 22
```

**Windows**:
```bash
# 访问官网下载
https://nodejs.org/

# 或使用 Chocolatey
choco install nodejs-lts
```

**验证**:
```bash
node --version
# 应该显示: v22.x.x
```

---

### ❌ 问题 2: npm 权限错误

**症状**:
```
npm ERR! Error: EACCES: permission denied
```

**原因**: npm 全局安装权限不足

**解决方案 1: 使用 sudo（临时）**
```bash
sudo npm install -g intentbridge
```

**解决方案 2: 修复 npm 权限（推荐）**
```bash
# 创建 npm 全局目录
mkdir ~/.npm-global

# 配置 npm
npm config set prefix '~/.npm-global'

# 添加到 PATH
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# 重新安装
npm install -g intentbridge
```

---

### ❌ 问题 3: 安装脚本失败

**症状**:
```
curl: (7) Failed to connect to raw.githubusercontent.com
```

**原因**: 网络连接问题或 GitHub 访问受限

**解决方案**:

**方式 1: 使用镜像**
```bash
# 使用代理
export https_proxy=http://your-proxy:port
curl -fsSL https://raw.githubusercontent.com/404QAQ/intentbridge/main/install.sh | bash
```

**方式 2: 手动安装**
```bash
# 克隆仓库
git clone https://github.com/404QAQ/intentbridge.git
cd intentbridge

# 安装依赖
npm install

# 构建
npm run build

# 全局链接
npm link
```

---

## 命令问题

### ❌ 问题 4: 命令找不到

**症状**:
```
bash: ib: command not found
```

**原因**: IntentBridge 未正确安装或 PATH 配置问题

**解决方案**:

**检查 1: 验证安装**
```bash
npm list -g intentbridge
```

**检查 2: 查看 npm 全局路径**
```bash
npm config get prefix
# 输出应该是: /usr/local 或 ~/.npm-global
```

**检查 3: 添加到 PATH**
```bash
# 查看当前 PATH
echo $PATH

# 如果 npm 路径不在 PATH 中
export PATH="$(npm config get prefix)/bin:$PATH"

# 永久添加
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

---

### ❌ 问题 5: 命令执行缓慢

**症状**: 命令执行需要几秒钟

**原因**: Node.js 模块加载慢或文件 I/O 频繁

**解决方案**:

**方案 1: 清理缓存**
```bash
# 清理 npm 缓存
npm cache clean --force

# 重新安装
npm uninstall -g intentbridge
npm install -g intentbridge
```

**方案 2: 使用更快的 Node.js 版本**
```bash
# 使用 Node.js 22（比 18 快）
nvm install 22
nvm use 22
```

---

## 项目问题

### ❌ 问题 6: 项目未初始化

**症状**:
```
Error: .intentbridge directory not found
Please run 'ib init' first
```

**原因**: 当前目录不是 IntentBridge 项目

**解决方案**:

**方式 1: 初始化新项目**
```bash
ib init
```

**方式 2: 切换到已有项目**
```bash
cd /path/to/your/project
```

**方式 3: 注册已有项目**
```bash
ib project register /path/to/project --name my-project
ib project switch my-project
```

---

### ❌ 问题 7: 需求 ID 冲突

**症状**:
```
Error: REQ-001 already exists
```

**原因**: 需求 ID 已被使用

**解决方案**:

**方式 1: 使用不同的标题**
```bash
ib add "用户登录 v2"
```

**方式 2: 删除旧需求**
```bash
ib req remove REQ-001
ib add "用户登录功能"
```

**方式 3: 更新现有需求**
```bash
ib req update REQ-001 --title "新的标题"
```

---

## 端口问题

### ❌ 问题 8: 端口已被占用

**症状**:
```
Error: Port 3000 already in use
```

**原因**: 端口被其他进程占用

**解决方案**:

**方式 1: 检查端口占用**
```bash
ib ports check
```

**输出示例**:
```
端口使用情况:
  3000  → my-frontend (PID: 12345)
  9528  → intentbridge-api (PID: 12346)
```

**方式 2: 停止占用进程**
```bash
# 停止项目
ib stop my-frontend

# 或使用系统命令
lsof -ti:3000 | xargs kill -9
```

**方式 3: 使用其他端口**
```bash
# 自动分配端口
ib web start --port 3001

# 或查找可用端口
ib ports find --range 3000-4000 --count 1
```

---

### ❌ 问题 9: 端口权限错误

**症状**:
```
Error: EACCES: permission denied, bind to port 80
```

**原因**: 1024 以下端口需要 root 权限

**解决方案**:

**方式 1: 使用高于 1024 的端口**
```bash
ib web start --port 3000
```

**方式 2: 使用 sudo（不推荐）**
```bash
sudo ib web start --port 80
```

---

## AI 功能问题

### ❌ 问题 10: API Key 未配置

**症状**:
```
Error: Claude API key not configured
Please run 'ib ai config' to set up AI features
```

**原因**: 未配置 AI 提供商的 API key

**解决方案**:

**配置 Claude API**:
```bash
ib ai config
> 选择提供商: Anthropic
> 输入 API key: sk-ant-xxxxx
```

**或手动配置**:
```bash
# 设置环境变量
export ANTHROPIC_API_KEY=sk-ant-xxxxx

# 或编辑配置文件
vim .intentbridge/ai-config.json
```

---

### ❌ 问题 11: AI 调用超时

**症状**:
```
Error: AI request timeout after 30000ms
```

**原因**: 网络问题或 AI 服务响应慢

**解决方案**:

**方式 1: 检查网络连接**
```bash
ping api.anthropic.com
```

**方式 2: 增加超时时间**
```bash
# 在 .intentbridge/ai-config.json 中
{
  "timeout": 60000
}
```

**方式 3: 使用本地模型**
```bash
ib ai config
> 选择提供商: Local (Ollama)
> 确保Ollama 正在运行
```

---

### ❌ 问题 12: AI 响应质量差

**症状**: AI 生成的理解或验证不准确

**原因**: 上下文信息不足或模型能力限制

**解决方案**:

**方式 1: 提供更详细的需求描述**
```bash
ib req update REQ-001 --description "
用户登录功能详细描述：
1. 支持邮箱和密码登录
2. 密码强度验证（至少8位，包含大小写字母和数字）
3. 登录失败3次后锁定15分钟
4. 支持记住我功能（7天免登录）
5. 登录成功后跳转到首页
"
```

**方式 2: 添加更多上下文**
```bash
# 添加相关文件
ib map add REQ-001 src/auth/login.ts
ib map add REQ-001 src/middleware/auth.ts

# 重新理解
ib understand REQ-001 --with-code
```

---

## Web UI 问题

### ❌ 问题 13: Web UI 启动失败

**症状**:
```
Error: Failed to start web server
```

**原因**: 后端服务器启动失败

**解决方案**:

**检查 1: 查看详细错误**
```bash
ib web start --verbose
```

**检查 2: 验证端口可用**
```bash
lsof -i:3000
lsof -i:9528
```

**检查 3: 手动启动**
```bash
# 前端
cd web
npm run dev

# 后端（新终端）
cd web-server
npm run dev
```

---

### ❌ 问题 14: Web UI 无法访问

**症状**: 浏览器显示 "无法访问此网站"

**原因**: 服务器未启动或防火墙阻止

**解决方案**:

**检查 1: 验证服务运行**
```bash
curl http://localhost:3000
curl http://localhost:9528
```

**检查 2: 检查防火墙**
```bash
# macOS
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Linux
sudo ufw status
```

**检查 3: 使用正确的 URL**
```
http://localhost:3000  (前端)
http://localhost:9528  (API)
```

---

## 性能问题

### ❌ 问题 15: 内存占用过高

**症状**: IntentBridge 占用大量内存

**原因**: 缓存数据过多或内存泄漏

**解决方案**:

**方式 1: 清理缓存**
```bash
# 清理项目缓存
rm -rf .intentbridge/cache

# 清理 npm 缓存
npm cache clean --force
```

**方式 2: 限制缓存大小**
```bash
# 在 .intentbridge/config.json 中
{
  "cache": {
    "maxSize": 100,  // MB
    "ttl": 300       // 秒
  }
}
```

---

### ❌ 问题 16: 命令执行缓慢

**症状**: 每个命令都需要几秒钟

**原因**: 文件 I/O 频繁或 AI 调用慢

**解决方案**:

**方式 1: 使用离线模式**
```bash
# 跳过 AI 调用
ib req list --no-ai
```

**方式 2: 优化 YAML 读取**
```bash
# 使用缓存
ib config set cache.enabled true
ib config set cache.ttl 300
```

---

## 🆘 仍然无法解决？

### 收集诊断信息

```bash
# 生成诊断报告
ib doctor

# 输出:
# - 系统信息
# - Node.js 版本
# - 项目配置
# - 错误日志
```

### 获取帮助

1. **查看文档**:
   - [README.md](../README.md)
   - [QUICK_START_5MIN.md](QUICK_START_5MIN.md)

2. **提交 Issue**:
   - GitHub: https://github.com/404QAQ/intentbridge/issues
   - 附上诊断报告和错误日志

3. **社区支持**:
   - GitHub Discussions
   - 提供详细的问题描述

---

## 📋 故障排查清单

遇到问题时，按顺序检查：

- [ ] Node.js 版本 >= 18
- [ ] npm 全局路径在 PATH 中
- [ ] 项目已初始化（.intentbridge/ 存在）
- [ ] API key 已配置（使用 AI 功能时）
- [ ] 端口未被占用
- [ ] 网络连接正常
- [ ] 防火墙未阻止访问

---

**最后更新**: 2026-02-24
**版本**: v3.5.0+
