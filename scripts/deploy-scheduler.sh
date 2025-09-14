#!/bin/bash

# 部署定时任务脚本
# 适用于任何部署环境

# 获取脚本所在目录的父目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 部署定时任务"
echo "项目目录: $PROJECT_DIR"

# 创建日志目录
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"

# 获取 Node.js 路径
NODE_PATH=$(which node)

# 创建 cron 任务 - 使用 Node.js 直接运行脚本（测试模式：每2分钟）
CRON_JOB="*/10 * * * * cd \"$PROJECT_DIR\" && \"$NODE_PATH\" scripts/smart-cleanup.js >> \"$LOG_DIR/cleanup.log\" 2>&1"

# 检查是否已存在相同的任务
if crontab -l 2>/dev/null | grep -q "smart-cleanup.js"; then
    echo "⚠️ 定时任务已存在"
else
    # 添加新的 cron 任务
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ 定时任务已安装"
fi

echo "📋 当前定时任务:"
crontab -l 2>/dev/null | grep "smart-cleanup.js" || echo "  (无相关任务)"

echo "📄 日志文件: $LOG_DIR/cleanup.log"
echo "✅ 部署完成"
