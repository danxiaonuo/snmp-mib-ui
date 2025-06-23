#!/bin/bash

# 设置生产环境变量 - SQLite版本
export ENVIRONMENT=production
export SERVER_PORT=17880
export JWT_SECRET=snmp-mib-platform-jwt-secret-2024
export UPLOAD_PATH=./uploads

echo "🚀 启动SNMP监控平台后端服务..."
echo "📊 端口: $SERVER_PORT"
echo "💾 数据库: SQLite (snmp_platform.db)"
echo "📁 上传目录: $UPLOAD_PATH"

# 创建必要目录
mkdir -p uploads
mkdir -p data

# 启动后端服务
exec ./mib-platform