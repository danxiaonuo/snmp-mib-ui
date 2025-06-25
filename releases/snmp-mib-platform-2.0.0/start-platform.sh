#!/bin/bash

# SNMP MIB Platform 一键启动脚本
# 同时启动前端和后端服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 配置
FRONTEND_PORT=${FRONTEND_PORT:-12300}
BACKEND_PORT=${BACKEND_PORT:-8080}

log_info "🚀 启动 SNMP MIB Platform"
log_info "前端端口: ${FRONTEND_PORT}"
log_info "后端端口: ${BACKEND_PORT}"

# 检查端口是否被占用
check_port() {
    local port=$1
    if netstat -tlnp 2>/dev/null | grep -q ":${port} "; then
        log_warning "端口 ${port} 已被占用"
        return 1
    fi
    return 0
}

# 启动后端
log_info "启动后端服务..."
cd backend
if [ -f "mib-platform" ]; then
    export BACKEND_PORT=${BACKEND_PORT}
    nohup ./start-backend.sh > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    log_success "后端服务已启动 (PID: ${BACKEND_PID})"
else
    log_error "后端二进制文件不存在，请先构建后端"
    exit 1
fi
cd ..

# 等待后端启动
sleep 3

# 启动前端
log_info "启动前端服务..."
cd frontend
export PORT=${FRONTEND_PORT}
nohup ./start-frontend.sh > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid
log_success "前端服务已启动 (PID: ${FRONTEND_PID})"
cd ..

log_success "🎉 SNMP MIB Platform 启动完成！"
log_info "前端访问地址: http://localhost:${FRONTEND_PORT}"
log_info "后端API地址: http://localhost:${BACKEND_PORT}"
log_info ""
log_info "查看日志:"
log_info "  前端日志: tail -f frontend.log"
log_info "  后端日志: tail -f backend.log"
log_info ""
log_info "停止服务:"
log_info "  ./stop-platform.sh"
