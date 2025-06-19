#!/bin/bash

# MIB Web UI 快速启动脚本
# 一键启动容器化部署

echo "🚀 MIB Web UI 快速启动"
echo "========================"

# 检查是否存在部署脚本
if [ ! -f "scripts/docker-deploy.sh" ]; then
    echo "❌ 部署脚本不存在"
    exit 1
fi

# 询问部署模式
echo "请选择部署模式:"
echo "1) 生产环境 (推荐)"
echo "2) 开发环境"
echo "3) 查看服务状态"
echo "4) 查看日志"
echo "5) 停止服务"

read -p "请输入选择 (1-5): " choice

case $choice in
    1)
        echo "🏭 启动生产环境..."
        ./scripts/docker-deploy.sh prod
        ;;
    2)
        echo "🔧 启动开发环境..."
        ./scripts/docker-deploy.sh dev
        ;;
    3)
        echo "📊 检查服务状态..."
        ./scripts/docker-deploy.sh status
        ;;
    4)
        echo "📋 显示服务日志..."
        ./scripts/docker-deploy.sh logs
        ;;
    5)
        echo "🛑 停止服务..."
        ./scripts/docker-deploy.sh stop
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac