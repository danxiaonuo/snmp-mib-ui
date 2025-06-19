#!/bin/bash

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

# 检查系统要求
check_requirements() {
    log_info "检查系统要求..."
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    # 检查内存
    TOTAL_MEM=$(free -m | awk 'NR==2{printf "%d", $2}')
    if [ $TOTAL_MEM -lt 4000 ]; then
        log_warning "系统内存不足 4GB，可能影响性能"
    fi
    
    # 检查磁盘空间
    AVAILABLE_SPACE=$(df . | awk 'NR==2 {print $4}')
    if [ $AVAILABLE_SPACE -lt 20971520 ]; then # 20GB in KB
        log_warning "可用磁盘空间不足 20GB，可能影响运行"
    fi
    
    log_success "系统要求检查完成"
}

# 停止已存在的服务
stop_existing_services() {
    log_info "停止现有服务..."
    if docker-compose ps -q &> /dev/null; then
        docker-compose down
    elif docker compose ps -q &> /dev/null; then
        docker compose down
    fi
    log_success "现有服务已停止"
}

# 清理旧数据（可选）
cleanup_data() {
    if [ "$1" == "--clean" ]; then
        log_warning "清理旧数据..."
        docker volume prune -f
        log_success "旧数据已清理"
    fi
}

# 启动服务
start_services() {
    log_info "启动 SNMP MIB Platform 服务..."
    
    # 使用 docker-compose 或 docker compose
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d
    else
        docker compose up -d
    fi
    
    log_success "服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    log_info "等待服务启动完成..."
    
    # 等待后端API就绪
    local max_attempts=60
    local attempt=0
    
    log_info "检查后端API..."
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:17880/health > /dev/null 2>&1; then
            log_success "后端API已就绪"
            break
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    echo ""
    
    if [ $attempt -eq $max_attempts ]; then
        log_error "后端API启动超时"
        return 1
    fi
    
    # 等待前端就绪
    log_info "检查前端服务..."
    attempt=0
    while [ $attempt -lt 30 ]; do
        if curl -s --max-time 3 http://localhost:12300/ > /dev/null 2>&1; then
            log_success "前端服务已就绪"
            break
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 3
    done
    echo ""
    
    if [ $attempt -eq 30 ]; then
        log_warning "前端服务响应较慢，但可能正常运行"
    fi
    
    log_success "所有服务已启动完成"
}

# 显示访问信息
show_access_info() {
    echo ""
    echo "======================================"
    echo -e "${GREEN}🚀 SNMP MIB Platform 部署成功！${NC}"
    echo "======================================"
    echo ""
    echo "📱 服务访问地址："
    echo "  🌐 Web 界面:      http://localhost:12300"
    echo "  🔧 后端 API:      http://localhost:17880"
    echo ""
    echo "🌍 外网访问配置："
    echo "  如需外网访问，请运行: ./setup-external-access.sh"
    echo "  📊 Grafana:       http://localhost:3001 (admin/admin)"
    echo "  📈 VictoriaMetrics: http://localhost:8428"
    echo "  🚨 Alertmanager:  http://localhost:9093"
    echo ""
    echo "🔧 管理命令："
    echo "  查看状态: docker compose ps"
    echo "  查看日志: docker compose logs -f"
    echo "  停止服务: docker compose down"
    echo ""
    echo "📖 更多信息请查看 README.md"
    echo "======================================"
}

# 主函数
main() {
    echo "======================================"
    echo -e "${BLUE}🐳 SNMP MIB Platform 一键部署${NC}"
    echo "======================================"
    echo ""
    
    check_requirements
    stop_existing_services
    cleanup_data "$1"
    start_services
    wait_for_services
    show_access_info
}

# 帮助信息
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --clean    清理旧数据和Docker卷"
    echo "  --help     显示此帮助信息"
    echo ""
    echo "Examples:"
    echo "  $0                # 标准部署"
    echo "  $0 --clean       # 清理旧数据后部署"
}

# 参数处理
case "$1" in
    --help)
        show_help
        exit 0
        ;;
    *)
        main "$1"
        ;;
esac