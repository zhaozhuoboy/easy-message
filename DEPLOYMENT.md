# 部署指南

## 定时任务部署

### 方式1：使用部署脚本（推荐）

```bash
# 部署定时任务
npm run scheduler:deploy

# 或者直接运行
./scripts/deploy-scheduler.sh
```

### 方式2：手动部署

```bash
# 1. 创建日志目录
mkdir -p logs

# 2. 获取项目路径
PROJECT_DIR=$(pwd)

# 3. 添加 cron 任务
(crontab -l 2>/dev/null; echo "*/10 * * * * cd \"$PROJECT_DIR\" && npm run cleanup:run >> \"$PROJECT_DIR/logs/cleanup.log\" 2>&1") | crontab -

# 4. 验证安装
crontab -l
```

### 方式3：Docker 部署

如果使用 Docker 部署，可以创建一个专门的清理服务：

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
  
  scheduler:
    build: .
    command: sh -c "while true; do npm run cleanup:run; sleep 600; done"
    volumes:
      - ./logs:/app/logs
    depends_on:
      - app
```

### 管理命令

```bash
# 查看定时任务状态
npm run scheduler:status

# 测试清理脚本
npm run scheduler:test

# 卸载定时任务
npm run scheduler:uninstall

# 查看清理日志
tail -f logs/cleanup.log
```

### 生产环境注意事项

1. **确保 Node.js 和 npm 在系统 PATH 中**
2. **确保项目目录权限正确**
3. **定期检查日志文件大小**
4. **考虑使用 logrotate 管理日志文件**

### 日志轮转配置

创建 `/etc/logrotate.d/easy-message`：

```
/Users/zhaozhuo/zhaozhuo/code/easy-message/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
```

### 监控

建议设置监控来确保定时任务正常运行：

```bash
# 检查定时任务是否在运行
pgrep -f "cleanup:run" || echo "定时任务未运行"

# 检查日志文件是否更新
find logs/cleanup.log -mmin -20 || echo "日志文件超过20分钟未更新"
```
