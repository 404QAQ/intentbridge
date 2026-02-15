# IntentBridge Web UI 仪表板 v3.1.0

**中文文档** | **[English](README.md)**

一个精美的基于 Web 的仪表板，用于管理您的 IntentBridge 需求。

## 🎉 v3.1.0 新功能

### 1. 🌙 暗色模式
- **自动检测**：尊重系统偏好设置
- **手动切换**：一键主题切换
- **持久化**：记住您的选择（存储在 localStorage）
- **平滑过渡**：优美的颜色过渡效果

### 2. 🔄 实时更新
- **自动刷新**：每 10 秒更新一次数据
- **实时状态**：显示最后更新时间戳
- **手动刷新**：随时点击刷新
- **错误处理**：优雅的错误显示

### 3. 🔍 高级筛选
- **搜索**：全文搜索标题和描述
- **状态筛选**：按状态筛选（draft、active、implementing、done）
- **优先级筛选**：按优先级筛选（high、medium、low）
- **标签筛选**：多选标签过滤
- **清除全部**：一键重置所有筛选器

### 4. 📤 导出功能
- **CSV 导出**：导出为电子表格格式
- **JSON 导出**：导出供程序使用
- **Markdown 导出**：导出为格式化文档
- **时间戳文件名**：自动在文件名中添加日期

## 功能特性

- **仪表板概览**：一目了然地查看统计数据和状态分布
- **需求列表**：使用高级控件浏览和筛选需求
- **需求详情**：查看详细信息并更新状态
- **实时更新**：通过轮询立即反映更改
- **暗色模式**：日夜护眼
- **导出选项**：以多种格式下载数据

## 快速开始

### 1. 启动 Web 仪表板

从您的项目根目录（`.intentbridge/` 所在位置）运行：

```bash
ib web start
```

这将启动：
- **API 服务器**：http://localhost:9528
- **前端开发服务器**：http://localhost:3000

### 2. 在浏览器中打开

访问 http://localhost:3000 查看您的仪表板。

## 使用方法

### 仪表板

首页显示：
- 项目总数
- 活跃项目数
- 需求总数
- 完成率
- 状态分布饼图
- 最近的需求

### 需求列表

浏览所有需求的功能：
- **搜索栏**：按标题、描述或 ID 搜索
- **筛选面板**：高级多条件筛选
- **导出按钮**：下载为 CSV、JSON 或 Markdown
- **实时更新**：每 10 秒自动刷新
- 状态、优先级和标签显示
- 点击查看详情

### 需求详情

点击任意需求可以：
- 查看完整描述
- 查看验收标准
- 检查依赖关系
- 查看备注和决策
- 通过下拉菜单更新状态

## 开发

### 架构

```
web/
├── src/
│   ├── App.tsx                      # 主应用（路由和主题）
│   ├── components/
│   │   ├── ThemeToggle.tsx          # 暗色模式切换
│   │   ├── FilterPanel.tsx          # 高级筛选
│   │   └── ExportButton.tsx         # 导出下拉菜单
│   ├── hooks/
│   │   ├── useTheme.ts              # 主题管理
│   │   ├── useRealtimeUpdates.ts    # 自动刷新逻辑
│   │   └── useExport.ts             # 导出工具
│   ├── pages/
│   │   ├── Home.tsx                 # 仪表板页面
│   │   ├── Requirements.tsx         # 需求列表（增强版）
│   │   └── RequirementDetail.tsx    # 单个需求视图
│   └── services/
│       └── api.ts                   # API 客户端
├── package.json
└── vite.config.ts

web-server/
├── src/
│   └── server.ts                    # Express API 服务器
└── package.json
```

### 技术栈

**前端**：
- React 18 + TypeScript
- React Router v6
- Recharts（图表）
- TailwindCSS（样式）+ 暗色模式
- Vite（构建工具）
- 用于主题、更新和导出的自定义 Hooks

**后端**：
- Express.js
- js-yaml（YAML 解析）
- CORS 已启用

### API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/requirements` | GET | 列出所有需求 |
| `/api/requirements/:id` | GET | 获取单个需求 |
| `/api/requirements/:id/status` | PUT | 更新需求状态 |
| `/api/projects` | GET | 列出所有项目 |
| `/api/projects/current` | GET | 获取当前项目 |
| `/api/global-status` | GET | 获取全局统计 |
| `/api/health` | GET | 健康检查 |

### 生产环境构建

```bash
# 构建前端
cd web
npm run build

# 构建后端
cd ../web-server
npm run build

# 以生产模式启动
cd ..
ib web start --no-dev
```

## 配置

### 环境变量

Web 服务器支持以下环境变量：

- `WEB_SERVER_PORT`：API 服务器端口（默认：9528）
- `INTENTBRIDGE_DIR`：`.intentbridge/` 目录路径（默认：`./.intentbridge`）

### 生产环境设置

生产环境部署：

1. 构建前端和后端
2. 配置反向代理（nginx、Apache）
3. 设置环境变量
4. 使用进程管理器（PM2、systemd）

nginx 配置示例：

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:9528;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

## 故障排除

### 端口已被占用

如果端口 3000 或 9528 已被使用：

```bash
# 使用自定义端口
PORT=3001 ib web start  # 前端
WEB_SERVER_PORT=9529 ib web start  # 后端
```

### 没有显示需求

确保您在已初始化 `.intentbridge/` 的目录中：

```bash
ib init
ib req add  # 添加一些需求
```

### 暗色模式不工作

清除浏览器的 localStorage 并刷新页面。主题切换将根据您的系统偏好初始化。

### 实时更新不工作

检查 API 服务器是否在端口 9528 上运行。您可以使用"刷新"链接手动刷新数据。

## 未来增强

- [ ] 用户认证
- [ ] 基于 WebSocket 的实时更新
- [ ] 格式化的 PDF 导出
- [ ] 批量状态更新
- [ ] 支持正则表达式的高级搜索
- [ ] 时间线视图
- [ ] 依赖关系的甘特图
- [ ] 可自定义的仪表板小部件

## 许可证

MIT © IntentBridge 贡献者
