#!/bin/bash

# SNMP MIB 监控系统一键启动脚本
# 版本: 1.0.0
# 作者: Evan

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    # 检查 Docker Compose
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose 未安装或版本过低，请安装最新版本"
        exit 1
    fi
    
    log_success "依赖检查完成"
}

# 检查端口占用
check_ports() {
    log_info "检查端口占用..."
    
    local ports=(80 3000 5432 6379 8080)
    local occupied_ports=()
    
    for port in "${ports[@]}"; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            occupied_ports+=($port)
        fi
    done
    
    if [ ${#occupied_ports[@]} -ne 0 ]; then
        log_warning "以下端口已被占用: ${occupied_ports[*]}"
        read -p "是否继续启动？(y/N): " continue_choice
        if [[ ! "$continue_choice" =~ ^[Yy]$ ]]; then
            log_info "启动已取消"
            exit 0
        fi
    fi
}

# 清理旧容器
cleanup_containers() {
    log_info "清理旧容器..."
    
    # 停止并删除现有容器
    docker compose down --remove-orphans 2>/dev/null || true
    
    # 清理悬挂的镜像
    docker system prune -f &>/dev/null || true
    
    log_success "容器清理完成"
}

# 启动服务
start_services() {
    log_info "启动监控系统服务..."
    
    # 构建并启动服务
    docker compose up -d --build
    
    # 等待服务启动
    log_info "等待服务启动完成..."
    sleep 10
    
    # 检查服务状态
    if docker compose ps | grep -q "healthy\|Up"; then
        log_success "服务启动成功"
    else
        log_error "服务启动失败"
        docker compose logs
        exit 1
    fi
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    local max_attempts=30
    local attempt=1
    
    # 检查Nginx服务
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -sf http://localhost/ &>/dev/null; then
            log_success "Nginx服务健康检查通过"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Nginx服务健康检查失败"
            return 1
        fi
        
        log_info "等待Nginx服务启动... ($attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    # 检查后端服务
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -sf http://localhost:8080/health &>/dev/null; then
            log_success "后端服务健康检查通过"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "后端服务健康检查失败"
            return 1
        fi
        
        log_info "等待后端服务启动... ($attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    # 检查数据库连接
    if docker compose exec -T postgres pg_isready -U netmon_user -d network_monitor &>/dev/null; then
        log_success "数据库连接正常"
    else
        log_warning "数据库连接检查失败"
    fi
    
    # 检查 Redis 连接
    if docker compose exec -T redis redis-cli -a redis_pass_2024 ping &>/dev/null; then
        log_success "Redis 连接正常"
    else
        log_warning "Redis 连接检查失败"
    fi
}

# 显示服务信息
show_service_info() {
    log_success "监控系统启动完成！"
    echo
    echo "=========================================="
    echo "         SNMP MIB 监控系统"
    echo "=========================================="
    echo "主界面: http://localhost/"
    echo "前端界面: http://localhost:3000"
    echo "后端API: http://localhost:8080"
    echo "数据库: PostgreSQL (端口: 5432)"
    echo "缓存: Redis (端口: 6379)"
    echo "=========================================="
    echo
    echo "服务状态:"
    docker compose ps
    echo
    echo "查看日志: docker compose logs -f"
    echo "停止服务: docker compose down"
    echo "重启服务: docker compose restart"
}

# 主函数
main() {
    echo "=========================================="
    echo "    SNMP MIB 监控系统启动脚本"
    echo "=========================================="
    echo
    
    # 切换到脚本所在目录
    cd "$(dirname "$0")"
    
    # 执行启动流程
    check_dependencies
    check_ports
    cleanup_containers
    start_services
    health_check
    show_service_info
}

# 信号处理
trap 'log_error "脚本被中断"; exit 1' INT TERM

# 运行主函数
main "$@"