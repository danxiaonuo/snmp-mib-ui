#!/bin/bash

# 开发环境启动脚本

set -e

echo "🚀 启动 SNMP MIB Platform 开发环境"

# 启动后端
echo "启动后端服务..."
cd backend
if [ ! -f "mib-platform" ]; then
    echo "构建后端..."
    go build -o mib-platform .
fi
nohup ./mib-platform > ../backend-dev.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend-dev.pid
echo "后端服务已启动 (PID: $BACKEND_PID)"
cd ..

# 等待后端启动
sleep 2

# 启动前端
echo "启动前端服务..."
npm run dev &
FRONTEND_PID=$!
echo $FRONTEND_PID > frontend-dev.pid
echo "前端服务已启动 (PID: $FRONTEND_PID)"

echo ""
echo "✅ 开发环境启动完成！"
echo "前端: http://localhost:12300"
echo "后端: http://localhost:8080"
echo ""
echo "停止服务: ./dev-stop.sh"
