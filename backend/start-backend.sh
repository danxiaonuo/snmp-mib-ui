#!/bin/bash

# 设置生产环境变量
export ENVIRONMENT=production
export SERVER_PORT=17880
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=netmon_user
export DB_PASSWORD=netmon_secure_password
export DB_NAME=network_monitor
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_PASSWORD=redis_secure_password
export JWT_SECRET=your-production-jwt-secret-key-here

echo "🚀 启动SNMP监控平台后端服务..."
echo "📊 端口: $SERVER_PORT"
echo "💾 数据库: $DB_HOST:$DB_PORT"
echo "🔄 Redis: $REDIS_HOST:$REDIS_PORT"

# 启动后端服务
exec ./mib-platform