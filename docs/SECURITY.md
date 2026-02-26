# IntentBridge 安全指南

## API Key 管理

### 安全措施

1. **API Key 不保存到配置文件**
   - 运行 `ib ai config` 时，API Key 仅保存为 `***`
   - 实际 Key 只在内存中使用

2. **推荐使用环境变量**

   ```bash
   # OpenAI
   export OPENAI_API_KEY=sk-...

   # Anthropic
   export ANTHROPIC_API_KEY=sk-ant-...
   ```

3. **配置时支持环境变量引用**
   - 输入 `$OPENAI_API_KEY` 会自动从环境变量读取
   - 避免在命令行历史中泄露 Key

### 最佳实践

1. **不要将 API Key 提交到版本控制**
   - `.intentbridge/` 目录已在 `.gitignore` 中

2. **使用项目级环境变量**

   ```bash
   # .env.local (不要提交到 Git)
   OPENAI_API_KEY=sk-...
   ```

3. **定期轮换 API Key**
   - 建议每 90 天轮换一次
   - 如果怀疑泄露，立即轮换

## Web Server 安全

### 当前状态

⚠️ Web Server (`ib web`) 目前不包含认证机制，仅适用于本地开发。

### 生产环境建议

1. **不要将 Web Server 暴露到公网**
2. **使用反向代理添加认证**

   ```nginx
   location /api {
       auth_basic "IntentBridge";
       auth_basic_user_file /etc/nginx/.htpasswd;
       proxy_pass http://localhost:9527;
   }
   ```

3. **考虑使用 VPN 或 SSH 隧道**

## 代码扫描

IntentBridge 内置安全扫描器，可检测：

- 硬编码凭证
- API Key 泄露
- 敏感信息暴露

运行安全扫描：

```bash
ib validate --security REQ-001
```

## 报告安全问题

如果发现安全漏洞，请发送邮件至项目维护者，不要公开披露。
