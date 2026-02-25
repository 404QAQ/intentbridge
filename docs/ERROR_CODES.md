# IntentBridge 错误代码参考

本文档列出了 IntentBridge 的所有错误代码、原因和解决方案。

---

## 📖 如何使用本文档

当你遇到错误时：

1. **查看错误代码**：错误消息会显示类似 `E1001` 的代码
2. **在本文档中查找**：使用 Ctrl+F 搜索错误代码
3. **按照解决方案操作**：每个错误都有详细的解决步骤

---

## 🔍 错误代码格式

错误代码格式为 `Exxxx`，其中：
- `E1xxx`: 安装和初始化错误
- `E2xxx`: 命令错误
- `E3xxx`: 项目错误
- `E4xxx`: AI 和集成错误
- `E5xxx`: 性能和系统错误

---

## E1xxx: 安装和初始化错误

### E1001: Node.js 版本过低

**严重程度**: 🚨 Critical

**错误消息**:
```
当前 Node.js 版本不支持。IntentBridge 需要 Node.js >= 18.0.0
```

**原因**: 你的 Node.js 版本低于 v18.0.0

**解决方案**:
1. 访问 https://nodejs.org
2. 下载并安装 LTS 版本（推荐 v18 或 v20）
3. 验证安装: `node --version`

**文档**: [安装指南 - Node.js](https://intentbridge.dev/docs/installation#nodejs)

---

### E1002: npm 权限错误

**严重程度**: 🚨 Critical

**错误消息**:
```
npm 全局安装需要管理员权限
```

**原因**: 当前用户没有全局 npm 安装权限

**解决方案** (选择一种):

**方案 1: 使用 sudo** (不推荐)
```bash
sudo npm install -g intentbridge
```

**方案 2: 修改 npm 默认目录** (推荐)
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

**方案 3: 使用 nvm** (最推荐)
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装 Node.js
nvm install 18
nvm use 18
```

**文档**: [安装指南 - 权限](https://intentbridge.dev/docs/installation#permissions)

---

### E1003: 依赖安装失败

**严重程度**: 🔴 High

**错误消息**:
```
npm 依赖安装失败，可能是网络问题或 npm 源问题
```

**原因**: 网络连接问题或 npm 源访问受限

**解决方案**:

**1. 检查网络连接**
```bash
ping registry.npmjs.org
```

**2. 更换 npm 源** (中国大陆推荐)
```bash
# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com

# 或使用官方源
npm config set registry https://registry.npmjs.org
```

**3. 清除缓存并重试**
```bash
npm cache clean --force
npm install -g intentbridge
```

---

### E1004: 全局安装失败

**严重程度**: 🔴 High

**错误消息**:
```
IntentBridge 全局安装失败
```

**解决方案**:

**1. 检查 npm 权限**
```bash
npm config get prefix
```

**2. 使用管理员权限** (Windows)
```powershell
# 右键 PowerShell -> 以管理员身份运行
npm install -g intentbridge
```

**3. 查看详细错误日志**
```bash
npm install -g intentbridge --verbose
# 查看日志
cat npm-debug.log
```

---

### E1011: 项目已存在

**严重程度**: 💡 Low

**错误消息**:
```
当前目录已经是一个 IntentBridge 项目
```

**解决方案**:

**方案 1: 在新目录中初始化**
```bash
mkdir new-project
cd new-project
ib init
```

**方案 2: 删除现有项目重新初始化**
```bash
rm -rf .intentbridge
ib init
```

---

### E1012: 目录创建失败

**严重程度**: ⚠️ Medium

**错误消息**:
```
无法创建项目目录，可能是权限问题
```

**解决方案**:

**1. 检查目录权限**
```bash
ls -la
```

**2. 修改权限**
```bash
chmod 755 .
```

**3. 使用其他目录**
```bash
cd /path/to/other/directory
ib init
```

---

### E1013: 配置文件创建失败

**严重程度**: ⚠️ Medium

**错误消息**:
```
无法创建配置文件 .intentbridge/project.yml
```

**解决方案**:

**1. 检查磁盘空间**
```bash
df -h
```

**2. 手动创建目录**
```bash
mkdir -p .intentbridge
```

**3. 检查目录权限**
```bash
ls -la .intentbridge
```

---

### E1014: 权限不足

**严重程度**: 🚨 Critical

**错误消息**:
```
当前用户没有足够的权限执行此操作
```

**解决方案**:

**方案 1: 修改文件所有者** (推荐)
```bash
chown -R $USER:$USER .
```

**方案 2: 修改权限**
```bash
chmod -R 755 .
```

**方案 3: 使用 sudo** (谨慎使用)
```bash
sudo ib init
```

---

## E2xxx: 命令错误

### E2001: 命令不存在

**严重程度**: 💡 Low

**错误消息**:
```
输入的命令不存在或拼写错误
```

**解决方案**:

**1. 查看可用命令**
```bash
ib help
```

**2. 检查命令拼写**
```bash
# 正确
ib req list

# 错误
ib requirement list
```

**3. 使用自动补全**
```bash
ib completion install
ib [TAB]  # 自动补全
```

---

### E2002: 参数缺失

**严重程度**: 💡 Low

**错误消息**:
```
命令缺少必需的参数
```

**解决方案**:

**1. 查看命令用法**
```bash
ib [command] --help
```

**2. 添加缺失参数**
```bash
# 错误
ib req update

# 正确
ib req update REQ-001 --status done
```

**3. 使用交互模式**
```bash
ib req add  # 交互式输入
```

---

### E2011: 需求不存在

**严重程度**: 💡 Low

**错误消息**:
```
指定的需求 ID 不存在
```

**解决方案**:

**1. 查看所有需求**
```bash
ib ls
```

**2. 检查需求 ID 拼写**
```bash
# 正确格式
REQ-001
REQ-002
```

**3. 使用自动补全**
```bash
ib completion install
ib done [TAB]  # 自动补全需求 ID
```

---

### E2012: 需求 ID 格式错误

**严重程度**: 💡 Low

**错误消息**:
```
需求 ID 格式不正确，正确格式为 REQ-XXX
```

**解决方案**:

**正确格式**:
```bash
REQ-001
REQ-002
REQ-123
```

**错误格式**:
```bash
req-001  # 小写
REQ001   # 缺少连字符
REQ-1    # 数字位数不一致
```

---

### E2021: 项目不存在

**严重程度**: 💡 Low

**错误消息**:
```
指定的项目不存在
```

**解决方案**:

**1. 查看所有项目**
```bash
ib project list
```

**2. 注册项目**
```bash
cd /path/to/project
ib project register --name "my-project"
```

**3. 检查项目名称**
```bash
ib project list | grep my-project
```

---

### E2031: 文件不存在

**严重程度**: 💡 Low

**错误消息**:
```
指定的文件不存在
```

**解决方案**:

**1. 检查文件路径**
```bash
ls -la path/to/file
```

**2. 使用相对路径或绝对路径**
```bash
# 相对路径
ib map add REQ-001 src/index.ts

# 绝对路径
ib map add REQ-001 /home/user/project/src/index.ts
```

---

## E3xxx: 项目错误

### E3001: 配置文件损坏

**严重程度**: 🔴 High

**错误消息**:
```
项目配置文件损坏，无法解析
```

**解决方案**:

**1. 备份配置文件**
```bash
cp .intentbridge/project.yml project.yml.backup
```

**2. 重新初始化**
```bash
ib init --force
```

**3. 手动修复 YAML 格式**
```bash
# 使用 YAML 验证工具
yamllint .intentbridge/project.yml
```

---

### E3002: 配置文件缺失

**严重程度**: ⚠️ Medium

**错误消息**:
```
项目配置文件不存在
```

**解决方案**:

**1. 初始化项目**
```bash
ib init
```

**2. 检查是否在项目目录中**
```bash
ls -la .intentbridge
```

**3. 切换到项目目录**
```bash
cd /path/to/project
ib init
```

---

### E3021: 端口已被占用

**严重程度**: ⚠️ Medium

**错误消息**:
```
指定的端口已被其他程序占用
```

**解决方案**:

**1. 查看端口占用**
```bash
# Linux/macOS
lsof -i:3000

# Windows
netstat -ano | findstr :3000
```

**2. 停止占用进程**
```bash
# 查找进程
lsof -ti:3000

# 停止进程
kill -9 $(lsof -ti:3000)
```

**3. 使用其他端口**
```bash
ib web start --port 3001
```

**4. 自动分配端口**
```bash
ib start --auto-ports
```

---

### E3031: 进程启动失败

**严重程度**: ⚠️ Medium

**错误消息**:
```
无法启动项目进程
```

**解决方案**:

**1. 检查启动命令**
```bash
# 查看项目配置
cat .intentbridge/project.yml | grep start_command
```

**2. 检查依赖是否安装**
```bash
npm install  # Node.js 项目
pip install -r requirements.txt  # Python 项目
```

**3. 查看进程日志**
```bash
ib logs my-project
```

---

## E4xxx: AI 和集成错误

### E4001: API Key 缺失

**严重程度**: 🔴 High

**错误消息**:
```
未配置 AI API Key
```

**解决方案**:

**1. 配置 API Key**
```bash
ib ai config
```

**2. 设置环境变量**

**OpenAI**:
```bash
export OPENAI_API_KEY=sk-...
```

**Anthropic**:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

**3. 获取 API Key**

- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/

---

### E4002: API Key 无效

**严重程度**: 🔴 High

**错误消息**:
```
提供的 API Key 无效或已过期
```

**解决方案**:

**1. 检查 API Key 是否正确**
```bash
echo $OPENAI_API_KEY
```

**2. 重新生成 API Key**

访问对应平台重新生成：
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/

**3. 更新配置**
```bash
ib ai config
```

---

### E4011: AI 请求超时

**严重程度**: ⚠️ Medium

**错误消息**:
```
AI 请求超时，可能是网络问题或 AI 服务响应慢
```

**解决方案**:

**1. 检查网络连接**
```bash
ping api.openai.com
```

**2. 增加超时时间**
```bash
ib ai config --timeout 60
```

**3. 使用本地模型**
```bash
# 安装 Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 配置本地模型
ib ai config --provider local --model llama2
```

**4. 稍后重试**
```bash
# AI 服务可能暂时过载，稍后重试
ib ai understand REQ-001
```

---

### E4021: MCP 服务器启动失败

**严重程度**: ⚠️ Medium

**错误消息**:
```
无法启动 MCP 服务器
```

**解决方案**:

**1. 检查端口是否被占用**
```bash
lsof -i:9527
```

**2. 使用其他端口**
```bash
ib mcp-server start --port 9528
```

**3. 查看 MCP 日志**
```bash
ib mcp logs
```

**4. 重置 MCP 配置**
```bash
rm .intentbridge/mcp.yml
ib mcp-server start
```

---

### E4031: Web UI 启动失败

**严重程度**: ⚠️ Medium

**错误消息**:
```
无法启动 Web UI
```

**解决方案**:

**1. 检查端口是否被占用**
```bash
lsof -i:3000
```

**2. 检查依赖是否安装**
```bash
cd web
npm install
```

**3. 使用其他端口**
```bash
ib web start --port 3001
```

**4. 查看 Web UI 日志**
```bash
ib web logs
```

---

## E5xxx: 性能和系统错误

### E5001: 内存不足

**严重程度**: 🔴 High

**错误消息**:
```
系统内存不足，无法完成操作
```

**解决方案**:

**1. 关闭其他程序**
```bash
# 查看内存使用
free -h  # Linux
top      # macOS/Linux
```

**2. 清除缓存**
```bash
ib cache clear
```

**3. 减少并发操作**

避免同时运行多个 IntentBridge 命令。

---

### E5011: 系统命令执行失败

**严重程度**: ⚠️ Medium

**错误消息**:
```
系统命令执行失败
```

**解决方案**:

**1. 检查命令是否存在**
```bash
which [command]
```

**2. 手动执行命令测试**
```bash
# 手动运行命令查看错误
[command] [args]
```

**3. 检查命令权限**
```bash
ls -la $(which [command])
```

---

### E5013: 磁盘空间不足

**严重程度**: 🔴 High

**错误消息**:
```
磁盘空间不足，无法完成操作
```

**解决方案**:

**1. 检查磁盘空间**
```bash
df -h
```

**2. 清理磁盘**
```bash
# 清除 IntentBridge 缓存
ib cache clear

# 清除 npm 缓存
npm cache clean --force

# 删除不需要的文件
rm -rf node_modules
```

**3. 增加磁盘容量**

如果是虚拟机或云服务器，增加磁盘容量。

---

### E5014: 网络错误

**严重程度**: ⚠️ Medium

**错误消息**:
```
网络连接错误
```

**解决方案**:

**1. 检查网络连接**
```bash
ping google.com
```

**2. 检查防火墙设置**
```bash
# Linux
sudo ufw status

# macOS
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
```

**3. 检查代理配置**
```bash
echo $HTTP_PROXY
echo $HTTPS_PROXY
```

**4. 稍后重试**

网络问题通常是暂时的，稍后重试可能成功。

---

## 🆘 获取更多帮助

如果以上解决方案都无法解决你的问题：

1. **查看文档**: https://intentbridge.dev/docs
2. **搜索 Issues**: https://github.com/404QAQ/intentbridge/issues
3. **提交 Issue**: https://github.com/404QAQ/intentbridge/issues/new
4. **加入讨论**: https://github.com/404QAQ/intentbridge/discussions

在提交 Issue 时，请提供：
- 错误代码
- 完整的错误消息
- 系统信息（OS、Node.js 版本）
- 重现步骤

---

**最后更新**: 2026-02-24
**版本**: v3.5.0
