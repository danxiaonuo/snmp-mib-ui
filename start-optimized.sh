#!/bin/bash

# SNMP MIB 监控平台 - 优化版一键启动脚本
# 使用 SQLite 数据库，无需 PostgreSQL 和 Redis
# Author: 优化版本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# 显示横幅
show_banner() {
    echo -e "${CYAN}"
    echo "================================================="
    echo "    SNMP MIB 监控平台 - 优化版"
    echo "    SQLite + Go + Next.js"
    echo "    一键启动脚本"
    echo "================================================="
    echo -e "${NC}"
}

# 检查系统要求
check_requirements() {
    log_step "检查系统要求..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        log_info "请安装 Node.js 16+ 版本"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d 'v' -f2 | cut -d '.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        log_error "Node.js 版本过低，需要 16+ 版本"
        exit 1
    fi
    log_info "Node.js 版本: $(node --version) ✓"
    
    # 检查 Go
    if ! command -v go &> /dev/null; then
        log_error "Go 未安装"
        log_info "请安装 Go 1.22+ 版本"
        exit 1
    fi
    
    GO_VERSION=$(go version | awk '{print $3}' | cut -d 'o' -f2)
    log_info "Go 版本: $GO_VERSION ✓"
    
    # 检查端口是否被占用
    if netstat -tuln | grep -q ":17880 "; then
        log_warning "端口 17880 已被占用，将尝试停止现有服务"
        pkill -f "mib-platform" 2>/dev/null || true
    fi
    
    if netstat -tuln | grep -q ":12300 "; then
        log_warning "端口 12300 已被占用，将尝试停止现有服务"
        pkill -f "next" 2>/dev/null || true
    fi
    
    log_success "系统要求检查通过"
}

# 停止现有服务
stop_existing_services() {
    log_step "停止现有服务..."
    
    # 停止后端服务
    if pgrep -f "mib-platform" > /dev/null; then
        log_info "停止现有后端服务..."
        pkill -f "mib-platform" || true
        sleep 2
    fi
    
    # 停止前端服务
    if pgrep -f "next" > /dev/null; then
        log_info "停止现有前端服务..."
        pkill -f "next" || true
        sleep 2
    fi
    
    log_success "现有服务已停止"
}

# 准备后端
prepare_backend() {
    log_step "准备后端服务..."
    
    cd backend
    
    # 检查是否存在二进制文件
    if [ ! -f "mib-platform" ]; then
        log_info "未找到二进制文件，开始构建..."
        
        # 清理并下载依赖
        log_info "下载 Go 依赖..."
        go mod tidy
        
        # 构建二进制文件
        log_info "构建后端二进制文件..."
        go build -o mib-platform .
        
        if [ ! -f "mib-platform" ]; then
            log_error "后端构建失败"
            exit 1
        fi
    fi
    
    # 检查并创建必要目录
    mkdir -p uploads
    mkdir -p data
    
    # 设置环境变量
    export ENVIRONMENT=production
    export SERVER_PORT=17880
    export JWT_SECRET=snmp-mib-platform-jwt-secret-2024
    export UPLOAD_PATH=./uploads
    
    log_success "后端准备完成"
    
    cd ..
}

# 准备前端
prepare_frontend() {
    log_step "准备前端服务..."
    
    # 检查 node_modules
    if [ ! -d "node_modules" ]; then
        log_info "安装前端依赖..."
        npm install
    else
        log_info "前端依赖已存在"
    fi
    
    # 检查是否需要构建
    if [ ! -d ".next" ]; then
        log_info "构建前端应用..."
        export NEXT_PUBLIC_API_URL=http://localhost:17880/api/v1
        npm run build
    else
        log_info "前端已构建"
    fi
    
    log_success "前端准备完成"
}

# 启动服务
start_services() {
    log_step "启动服务..."
    
    # 启动后端
    log_info "启动后端服务..."
    cd backend
    nohup ./mib-platform > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    cd ..
    
    # 等待后端启动
    log_info "等待后端服务启动..."
    sleep 3
    
    # 检查后端是否启动成功
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        log_error "后端启动失败"
        cat backend.log
        exit 1
    fi
    
    # 启动前端
    log_info "启动前端服务..."
    export NEXT_PUBLIC_API_URL=http://localhost:17880/api/v1
    nohup npm run start > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > frontend.pid
    
    log_success "服务启动完成"
    echo "后端 PID: $BACKEND_PID"
    echo "前端 PID: $FRONTEND_PID"
}

# 验证服务状态
verify_services() {
    log_step "验证服务状态..."
    
    # 等待服务完全启动
    sleep 5
    
    # 检查进程
    echo -e "\n${BLUE}进程状态:${NC}"
    ps aux | grep -E "(mib-platform|next)" | grep -v grep || true
    
    # 检查端口
    echo -e "\n${BLUE}端口监听:${NC}"
    netstat -tlnp | grep -E "(17880|12300)" || true
    
    # 检查数据库文件
    echo -e "\n${BLUE}数据库状态:${NC}"
    if [ -f "backend/snmp_platform.db" ]; then
        ls -lh backend/snmp_platform.db
        log_success "SQLite 数据库文件存在"
    else
        log_info "SQLite 数据库文件将在首次访问时创建"
    fi
    
    # 健康检查
    echo -e "\n${BLUE}健康检查:${NC}"
    
    # 检查后端
    log_info "检查后端 API..."
    if curl -f -s http://localhost:17880/health > /dev/null 2>&1; then
        log_success "后端 API 运行正常"
    else
        log_warning "后端 API 检查失败，可能还在启动中"
    fi
    
    # 检查前端
    log_info "检查前端服务..."
    if curl -f -s http://localhost:12300 > /dev/null 2>&1; then
        log_success "前端服务运行正常"
    else
        log_warning "前端服务检查失败，可能还在启动中"
    fi
}

# 显示访问信息
show_access_info() {
    echo ""
    echo -e "${GREEN}🎉 SNMP MIB 监控平台启动成功！${NC}"
    echo "================================================="
    echo -e "${CYAN}Web 界面:${NC} http://localhost:12300"
    echo -e "${CYAN}API 接口:${NC} http://localhost:17880/api/v1"
    echo -e "${CYAN}健康检查:${NC} http://localhost:17880/health"
    echo ""
    echo -e "${BLUE}管理命令:${NC}"
    echo "  查看日志: tail -f backend.log frontend.log"
    echo "  停止服务: pkill -f 'mib-platform|next'"
    echo "  重启服务: ./start-optimized.sh"
    echo ""
    echo -e "${BLUE}数据文件:${NC}"
    echo "  数据库: backend/snmp_platform.db"
    echo "  上传目录: backend/uploads/"
    echo "  配置: backend/config/"
    echo ""
    echo -e "${YELLOW}提示:${NC} 服务可能需要 1-2 分钟完全启动"
    echo -e "${YELLOW}如果无法访问，请等待片刻后重试${NC}"
    echo "================================================="
}

# 主函数
main() {
    show_banner
    
    # 检查是否在正确的目录
    if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
        log_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    check_requirements
    stop_existing_services
    prepare_backend
    prepare_frontend
    start_services
    verify_services
    show_access_info
    
    log_success "启动完成！"
}

# 错误处理
trap 'log_error "脚本执行失败！"; exit 1' ERR

# 执行主函数
main "$@"