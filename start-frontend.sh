#!/bin/bash

# 设置生产环境变量
export NODE_ENV=production
export PORT=12300
export HOSTNAME=0.0.0.0
export NEXT_PUBLIC_API_URL=http://localhost:17880/api/v1
export NEXT_PUBLIC_BACKEND_URL=http://localhost:17880

echo "🚀 启动SNMP监控平台前端服务..."
echo "📊 端口: $PORT"
echo "🌐 API地址: $NEXT_PUBLIC_API_URL"
echo "🔗 后端地址: $NEXT_PUBLIC_BACKEND_URL"

# 启动前端服务
echo "🔄 正在后台启动前端服务..."
nohup npm run start > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ 前端服务已启动，PID: $FRONTEND_PID"
echo $FRONTEND_PID > frontend.pid
echo "📝 日志文件: frontend.log"
echo "🔍 进程ID已保存到: frontend.pid"
echo "🌐 访问地址: http://localhost:12300"