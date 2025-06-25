#!/bin/bash

# 开发环境停止脚本

echo "🛑 停止开发环境"

# 停止前端
if [ -f "frontend-dev.pid" ]; then
    FRONTEND_PID=$(cat frontend-dev.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo "前端服务已停止"
    fi
    rm -f frontend-dev.pid
fi

# 停止后端
if [ -f "backend-dev.pid" ]; then
    BACKEND_PID=$(cat backend-dev.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo "后端服务已停止"
    fi
    rm -f backend-dev.pid
fi

echo "✅ 开发环境已停止"
