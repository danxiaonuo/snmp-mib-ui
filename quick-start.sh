#!/bin/bash

# SNMP MIB 监控系统快速启动脚本
# 版本: 1.0.0
# 作者: Evan

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 切换到脚本所在目录
cd "$(dirname "$0")"

echo "=========================================="
echo "    SNMP MIB 监控系统快速启动"
echo "=========================================="

log_info "启动基础服务..."

# 启动数据库和缓存
docker compose up -d postgres redis

log_info "等待数据库启动..."
sleep 15

# 启动前端
docker compose up -d frontend

log_info "等待前端启动..."
sleep 20

log_success "系统启动完成！"
echo
echo "=========================================="
echo "         SNMP MIB 监控系统"
echo "=========================================="
echo "前端界面: http://localhost:3000"
echo "数据库: PostgreSQL (端口: 5432)"
echo "缓存: Redis (端口: 6379)"
echo "=========================================="
echo
echo "服务状态:"
docker compose ps
echo
echo "✓ 前端服务已启动 (端口 3000)"
echo "✓ 数据库服务已启动 (端口 5432)"  
echo "✓ 缓存服务已启动 (端口 6379)"
echo
echo "访问 http://localhost:3000 开始使用"
echo "停止服务: docker compose down"
echo "完整启动: ./start-monitoring.sh"