#!/bin/bash

# SNMP MIB 监控平台 - 停止服务脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

echo -e "${BLUE}停止 SNMP MIB 监控平台服务...${NC}"

# 停止后端服务
if pgrep -f "mib-platform" > /dev/null; then
    log_info "停止后端服务..."
    pkill -f "mib-platform"
    sleep 2
    if pgrep -f "mib-platform" > /dev/null; then
        log_warning "强制停止后端服务..."
        pkill -9 -f "mib-platform"
    fi
    log_success "后端服务已停止"
else
    log_info "后端服务未运行"
fi

# 停止前端服务
if pgrep -f "next" > /dev/null; then
    log_info "停止前端服务..."
    pkill -f "next"
    sleep 2
    if pgrep -f "next" > /dev/null; then
        log_warning "强制停止前端服务..."
        pkill -9 -f "next"
    fi
    log_success "前端服务已停止"
else
    log_info "前端服务未运行"
fi

# 清理 PID 文件
if [ -f "backend.pid" ]; then
    rm -f backend.pid
    log_info "清理后端 PID 文件"
fi

if [ -f "frontend.pid" ]; then
    rm -f frontend.pid
    log_info "清理前端 PID 文件"
fi

# 检查端口占用
if netstat -tuln 2>/dev/null | grep -q ":17880 "; then
    log_warning "端口 17880 仍被占用"
else
    log_success "端口 17880 已释放"
fi

if netstat -tuln 2>/dev/null | grep -q ":12300 "; then
    log_warning "端口 12300 仍被占用"
else
    log_success "端口 12300 已释放"
fi

log_success "所有服务已停止"