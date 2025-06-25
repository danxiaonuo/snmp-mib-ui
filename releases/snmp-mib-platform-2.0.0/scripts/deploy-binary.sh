#!/bin/bash

# SNMP MIB Platform Binary Deployment Script
# 二进制部署脚本 - 前后端服务 + 容器化数据库

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

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装，请先安装 npm"
        exit 1
    fi
    
    log_success "依赖检查完成"
}

# 创建环境配置文件
create_env_file() {
    log_info "创建环境配置文件..."
    
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=netmon_user
DB_PASSWORD=netmon_secure_password
DB_NAME=network_monitor
DB_SSLMODE=disable

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_secure_password

# Application Configuration
PORT=17880
ENVIRONMENT=production

# Frontend Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:17880
NEXT_PUBLIC_API_URL=http://localhost:17880/api/v1
EOF
        log_success "环境配置文件已创建"
    else
        log_warning "环境配置文件已存在，跳过创建"
    fi
}

# 启动数据库容器
start_database_containers() {
    log_info "启动数据库容器..."
    
    # 停止并删除旧容器（如果存在）
    docker stop snmp-postgres snmp-redis 2>/dev/null || true
    docker rm snmp-postgres snmp-redis 2>/dev/null || true
    
    # 启动 PostgreSQL 容器
    log_info "启动 PostgreSQL 容器..."
    docker run -d \
        --name snmp-postgres \
        -e POSTGRES_DB=network_monitor \
        -e POSTGRES_USER=netmon_user \
        -e POSTGRES_PASSWORD=netmon_secure_password \
        -p 5432:5432 \
        -v postgres_data:/var/lib/postgresql/data \
        postgres:15-alpine
    
    # 启动 Redis 容器
    log_info "启动 Redis 容器..."
    docker run -d \
        --name snmp-redis \
        -p 6379:6379 \
        -v redis_data:/data \
        redis:7-alpine redis-server --requirepass redis_secure_password
    
    log_success "数据库容器启动完成"
}

# 等待数据库就绪
wait_for_database() {
    log_info "等待数据库服务就绪..."
    
    # 等待 PostgreSQL
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec snmp-postgres pg_isready -U netmon_user -d network_monitor &>/dev/null; then
            log_success "PostgreSQL 已就绪"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "PostgreSQL 启动超时"
            exit 1
        fi
        
        log_info "等待 PostgreSQL 启动... ($attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    # 等待 Redis
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if docker exec snmp-redis redis-cli -a redis_secure_password ping &>/dev/null; then
            log_success "Redis 已就绪"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Redis 启动超时"
            exit 1
        fi
        
        log_info "等待 Redis 启动... ($attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
}

# 构建后端二进制文件
build_backend() {
    log_info "构建后端二进制文件..."
    
    if [ ! -f "backend/mib-platform" ]; then
        if [ -f "build-backend.sh" ]; then
            chmod +x build-backend.sh
            ./build-backend.sh
        else
            log_error "后端二进制文件不存在且无构建脚本"
            exit 1
        fi
    fi
    
    if [ ! -f "backend/mib-platform" ]; then
        log_error "后端二进制文件构建失败"
        exit 1
    fi
    
    log_success "后端二进制文件准备完成"
}

# 安装前端依赖
install_frontend_deps() {
    log_info "安装前端依赖..."
    
    if [ ! -d "node_modules" ]; then
        npm install
        log_success "前端依赖安装完成"
    else
        log_warning "前端依赖已存在，跳过安装"
    fi
}

# 启动后端服务
start_backend() {
    log_info "启动后端服务..."
    
    # 停止已存在的后端进程
    if [ -f "backend.pid" ]; then
        local old_pid=$(cat backend.pid)
        if kill -0 $old_pid 2>/dev/null; then
            log_info "停止旧的后端进程 (PID: $old_pid)"
            kill $old_pid
            sleep 2
        fi
        rm -f backend.pid
    fi
    
    # 启动后端服务
    nohup ./backend/mib-platform > backend.log 2>&1 &
    local backend_pid=$!
    echo $backend_pid > backend.pid
    
    # 检查后端是否启动成功
    sleep 3
    if kill -0 $backend_pid 2>/dev/null; then
        log_success "后端服务启动成功 (PID: $backend_pid, Port: 17880)"
    else
        log_error "后端服务启动失败，请检查 backend.log"
        exit 1
    fi
}

# 启动前端服务
start_frontend() {
    log_info "启动前端服务..."
    
    # 停止已存在的前端进程
    if [ -f "frontend.pid" ]; then
        local old_pid=$(cat frontend.pid)
        if kill -0 $old_pid 2>/dev/null; then
            log_info "停止旧的前端进程 (PID: $old_pid)"
            kill $old_pid
            sleep 2
        fi
        rm -f frontend.pid
    fi
    
    # 检查端口是否被占用
    if lsof -i:12300 &>/dev/null; then
        log_warning "端口 12300 被占用，尝试释放..."
        local occupied_pid=$(lsof -ti:12300)
        if [ ! -z "$occupied_pid" ]; then
            kill $occupied_pid
            sleep 2
        fi
    fi
    
    # 启动前端服务
    nohup npm run dev > frontend.log 2>&1 &
    local frontend_pid=$!
    echo $frontend_pid > frontend.pid
    
    # 检查前端是否启动成功
    sleep 5
    if kill -0 $frontend_pid 2>/dev/null; then
        log_success "前端服务启动成功 (PID: $frontend_pid, Port: 12300)"
    else
        log_error "前端服务启动失败，请检查 frontend.log"
        exit 1
    fi
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."
    
    # 检查数据库容器
    if docker ps | grep -q snmp-postgres; then
        log_success "PostgreSQL 容器运行正常"
    else
        log_error "PostgreSQL 容器未运行"
    fi
    
    if docker ps | grep -q snmp-redis; then
        log_success "Redis 容器运行正常"
    else
        log_error "Redis 容器未运行"
    fi
    
    # 检查后端服务
    if [ -f "backend.pid" ] && kill -0 $(cat backend.pid) 2>/dev/null; then
        log_success "后端服务运行正常"
    else
        log_error "后端服务未运行"
    fi
    
    # 检查前端服务
    if [ -f "frontend.pid" ] && kill -0 $(cat frontend.pid) 2>/dev/null; then
        log_success "前端服务运行正常"
    else
        log_error "前端服务未运行"
    fi
    
    # 检查端口
    if netstat -tlnp | grep -q ":17880"; then
        log_success "后端端口 17880 监听正常"
    else
        log_warning "后端端口 17880 未监听"
    fi
    
    if netstat -tlnp | grep -q ":12300"; then
        log_success "前端端口 12300 监听正常"
    else
        log_warning "前端端口 12300 未监听"
    fi
}

# 停止所有服务
stop_services() {
    log_info "停止所有服务..."
    
    # 停止前端服务
    if [ -f "frontend.pid" ]; then
        local frontend_pid=$(cat frontend.pid)
        if kill -0 $frontend_pid 2>/dev/null; then
            log_info "停止前端服务 (PID: $frontend_pid)"
            kill $frontend_pid
        fi
        rm -f frontend.pid
    fi
    
    # 停止后端服务
    if [ -f "backend.pid" ]; then
        local backend_pid=$(cat backend.pid)
        if kill -0 $backend_pid 2>/dev/null; then
            log_info "停止后端服务 (PID: $backend_pid)"
            kill $backend_pid
        fi
        rm -f backend.pid
    fi
    
    # 停止数据库容器
    docker stop snmp-postgres snmp-redis 2>/dev/null || true
    
    log_success "所有服务已停止"
}

# 显示帮助信息
show_help() {
    echo "SNMP MIB Platform 二进制部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  start     启动所有服务 (默认)"
    echo "  stop      停止所有服务"
    echo "  restart   重启所有服务"
    echo "  status    检查服务状态"
    echo "  help      显示此帮助信息"
    echo ""
    echo "服务访问地址:"
    echo "  前端界面: http://localhost:12300"
    echo "  后端API:  http://localhost:17880"
    echo ""
}

# 主函数
main() {
    local action=${1:-start}
    
    case $action in
        "start")
            log_info "开始部署 SNMP MIB Platform..."
            check_dependencies
            create_env_file
            start_database_containers
            wait_for_database
            build_backend
            install_frontend_deps
            start_backend
            start_frontend
            echo ""
            log_success "=== 部署完成 ==="
            echo ""
            echo "服务访问地址:"
            echo "  前端界面: http://localhost:12300"
            echo "  后端API:  http://localhost:17880"
            echo ""
            echo "日志文件:"
            echo "  后端日志: backend.log"
            echo "  前端日志: frontend.log"
            echo ""
            echo "管理命令:"
            echo "  检查状态: $0 status"
            echo "  停止服务: $0 stop"
            echo "  重启服务: $0 restart"
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            log_info "重启所有服务..."
            stop_services
            sleep 3
            main start
            ;;
        "status")
            check_services
            ;;
        "help")
            show_help
            ;;
        *)
            log_error "未知选项: $action"
            show_help
            exit 1
            ;;
    esac
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi