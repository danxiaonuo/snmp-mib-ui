#!/bin/bash

# MIB Web UI 容器化部署脚本
# 避免二进制部署，使用容器化方式

set -e

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

# 检查Docker和Docker Compose
check_dependencies() {
    log_info "检查依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    # 检查 Docker Compose (支持新旧版本)
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE="docker-compose"
    elif docker compose version &> /dev/null 2>&1; then
        DOCKER_COMPOSE="docker compose"
    else
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 清理旧容器
cleanup() {
    log_info "清理旧容器..."
    $DOCKER_COMPOSE down --remove-orphans 2>/dev/null || true
    docker system prune -f 2>/dev/null || true
    log_success "清理完成"
}

# 构建和启动服务
deploy_production() {
    log_info "开始生产环境部署..."
    
    # 构建镜像
    log_info "构建前端镜像..."
    $DOCKER_COMPOSE build frontend
    
    log_info "构建后端镜像..."
    $DOCKER_COMPOSE build backend
    
    # 启动服务
    log_info "启动服务..."
    $DOCKER_COMPOSE up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    check_services
}

# 开发环境部署
deploy_development() {
    log_info "开始开发环境部署..."
    
    if [ ! -f "docker-compose.dev.yml" ]; then
        log_error "开发环境配置文件不存在"
        exit 1
    fi
    
    # 启动开发环境
    $DOCKER_COMPOSE -f docker-compose.dev.yml up -d --build
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 20
    
    # 检查服务状态
    check_services_dev
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."
    
    # 检查前端
    if curl -f http://localhost:12300/api/health >/dev/null 2>&1; then
        log_success "前端服务运行正常 (http://localhost:12300)"
    else
        log_warning "前端服务可能未完全启动，请稍后检查"
    fi
    
    # 检查后端
    if curl -f http://localhost:17880/health >/dev/null 2>&1; then
        log_success "后端服务运行正常 (http://localhost:17880)"
    else
        log_warning "后端服务可能未完全启动，请稍后检查"
    fi
    
    # 显示容器状态
    log_info "容器状态:"
    $DOCKER_COMPOSE ps
}

# 检查开发环境服务状态
check_services_dev() {
    log_info "检查开发环境服务状态..."
    
    # 显示容器状态
    log_info "容器状态:"
    $DOCKER_COMPOSE -f docker-compose.dev.yml ps
}

# 显示日志
show_logs() {
    log_info "显示服务日志..."
    $DOCKER_COMPOSE logs -f --tail=50
}

# 停止服务
stop_services() {
    log_info "停止服务..."
    $DOCKER_COMPOSE down
    log_success "服务已停止"
}

# 重启服务
restart_services() {
    log_info "重启服务..."
    $DOCKER_COMPOSE restart
    sleep 10
    check_services
    log_success "服务已重启"
}

# 显示帮助信息
show_help() {
    echo "MIB Web UI 容器化部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  prod, production     部署生产环境"
    echo "  dev, development     部署开发环境"
    echo "  stop                 停止所有服务"
    echo "  restart              重启所有服务"
    echo "  logs                 显示服务日志"
    echo "  status               检查服务状态"
    echo "  cleanup              清理旧容器和镜像"
    echo "  help                 显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 prod              # 部署生产环境"
    echo "  $0 dev               # 部署开发环境"
    echo "  $0 logs              # 查看日志"
}

# 主函数
main() {
    case "${1:-help}" in
        "prod"|"production")
            check_dependencies
            cleanup
            deploy_production
            ;;
        "dev"|"development")
            check_dependencies
            deploy_development
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "logs")
            show_logs
            ;;
        "status")
            check_services
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# 执行主函数
main "$@"