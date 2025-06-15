#!/bin/bash

# SNMP MIB Platform 中国大陆部署脚本 - 优化版本 v2.0
# 作者: Evan (oumu743@gmail.com)
# 针对国内网络环境优化，使用国内镜像源，部署速度更快

set -euo pipefail
IFS=$'\n\t'

# 脚本信息
readonly SCRIPT_NAME="SNMP MIB Platform 中国大陆部署脚本"
readonly SCRIPT_VERSION="2.0.0"
readonly SCRIPT_DESCRIPTION="针对国内网络环境优化的一键部署脚本"

# 导入公共函数库
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/scripts/lib/common.sh" ]]; then
    source "$SCRIPT_DIR/scripts/lib/common.sh"
else
    echo "错误: 无法找到公共函数库 scripts/lib/common.sh"
    exit 1
fi

# 初始化公共函数库
init_common_lib

# 脚本特定配置
readonly DEFAULT_CONFIG_FILE="deploy-china.conf"
readonly COMPOSE_FILE="docker-compose.china.yml"
readonly BACKUP_SUFFIX=".backup.$(date +%Y%m%d_%H%M%S)"

# 全局变量
CONFIG_FILE="$DEFAULT_CONFIG_FILE"
SKIP_CHECKS=false
SKIP_DOCKER_CONFIG=false
SKIP_IMAGE_PULL=false
QUICK_MODE=false

# ============================================================================
# 配置管理
# ============================================================================

# 生成部署配置文件
generate_deploy_config() {
    local config_file="$1"
    
    log_step "生成部署配置文件..."
    
    if [[ -f "$config_file" && "$FORCE" != "true" ]]; then
        if ! ask_confirmation "配置文件已存在，是否覆盖？"; then
            log_info "使用现有配置文件: $config_file"
            return 0
        fi
    fi
    
    # 生成安全的随机密码
    local postgres_password=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25 2>/dev/null || echo "mib_password_$(date +%s)")
    local jwt_secret=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50 2>/dev/null || echo "jwt_secret_$(date +%s)")
    
    cat > "$config_file" << EOF
# SNMP MIB Platform 中国大陆部署配置
# 生成时间: $(date)
# 版本: $SCRIPT_VERSION

# 基础配置
VERBOSE=${VERBOSE:-false}
DRY_RUN=${DRY_RUN:-false}
FORCE=${FORCE:-false}

# Docker 配置
COMPOSE_CMD="${COMPOSE_CMD:-docker compose}"
DOCKER_REGISTRY="registry.cn-hangzhou.aliyuncs.com"

# 服务端口配置
HTTP_PORT=80
HTTPS_PORT=443
FRONTEND_PORT=3000
BACKEND_PORT=8080
POSTGRES_PORT=5432
REDIS_PORT=6379
GRAFANA_PORT=3001
VICTORIAMETRICS_PORT=8428
ALERTMANAGER_PORT=9093

# 数据库配置
POSTGRES_DB=mib_platform
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$postgres_password

# Redis 配置
REDIS_PASSWORD=""

# 应用配置
JWT_SECRET=$jwt_secret
CORS_ORIGINS="http://localhost:3000,http://localhost"
NEXT_PUBLIC_API_URL="http://localhost:8080"
ENVIRONMENT=production

# 数据目录
DATA_DIR=./data
UPLOADS_DIR=./uploads
MIBS_DIR=./mibs
CONFIG_DIR=./config

# 国内镜像源配置
NPM_REGISTRY="https://registry.npmmirror.com"
GO_PROXY="https://goproxy.cn,direct"
GO_SUMDB="sum.golang.google.cn"

# Docker 镜像源
DOCKER_MIRRORS=(
    "https://docker.mirrors.ustc.edu.cn"
    "https://hub-mirror.c.163.com"
    "https://mirror.baidubce.com"
)

# 超时配置
DOCKER_TIMEOUT=300
SERVICE_TIMEOUT=180
HEALTH_CHECK_TIMEOUT=60
HEALTH_CHECK_INTERVAL=5
HEALTH_CHECK_RETRIES=12

# 资源限制
MIN_MEMORY_GB=4
MIN_DISK_GB=20
RECOMMENDED_MEMORY_GB=8
RECOMMENDED_DISK_GB=50
EOF
    
    log_success "配置文件已生成: $config_file"
    log_info "请根据需要修改配置文件中的参数"
}

# ============================================================================
# 系统检查函数
# ============================================================================

# 检查系统要求
check_system_requirements() {
    log_step "检查系统要求..."
    
    # 检查操作系统
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        log_success "操作系统: Linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        log_success "操作系统: macOS"
    else
        log_warning "未测试的操作系统: $OSTYPE，建议在 Linux 系统上运行"
    fi
    
    # 检查必需的命令
    local required_commands=("docker" "curl" "openssl")
    check_required_commands "${required_commands[@]}"
    
    # 检查 Docker 和 Docker Compose
    check_docker
    check_docker_compose
    
    # 检查系统资源
    check_system_resources
    
    # 检查网络连接
    if [[ "$QUICK_MODE" != "true" ]]; then
        check_network_connectivity "registry.cn-hangzhou.aliyuncs.com" "github.com"
    fi
    
    log_success "系统要求检查完成"
}

# ============================================================================
# Docker 配置函数
# ============================================================================

# 配置 Docker 镜像源
configure_docker_mirrors() {
    if [[ "$SKIP_DOCKER_CONFIG" == "true" ]]; then
        log_info "跳过 Docker 镜像源配置"
        return 0
    fi
    
    log_step "配置 Docker 镜像源..."
    
    local daemon_file="/etc/docker/daemon.json"
    
    # 检查现有配置
    if [[ -f "$daemon_file" ]]; then
        if grep -q "registry-mirrors" "$daemon_file"; then
            log_success "Docker 镜像源已配置"
            return 0
        else
            log_info "备份现有 Docker 配置..."
            backup_file "$daemon_file"
        fi
    fi
    
    # 创建新的 Docker 配置
    log_info "创建 Docker 镜像源配置..."
    
    local docker_config='{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "exec-opts": ["native.cgroupdriver=systemd"]
}'
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "试运行: 将创建 Docker 配置文件"
        log_debug "配置内容: $docker_config"
    else
        # 创建配置目录
        sudo mkdir -p /etc/docker
        
        # 写入配置文件
        echo "$docker_config" | sudo tee "$daemon_file" > /dev/null
        log_success "Docker 配置文件创建成功"
        
        # 重启 Docker 服务
        restart_docker_service
    fi
}

# 重启 Docker 服务
restart_docker_service() {
    log_info "重启 Docker 服务..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "试运行: 将重启 Docker 服务"
        return 0
    fi
    
    # 重启 Docker 服务
    if command -v systemctl &> /dev/null; then
        sudo systemctl restart docker
        log_info "使用 systemctl 重启 Docker 服务"
    elif command -v service &> /dev/null; then
        sudo service docker restart
        log_info "使用 service 重启 Docker 服务"
    else
        log_error "无法找到服务管理工具"
        return 1
    fi
    
    # 等待 Docker 服务启动
    log_info "等待 Docker 服务启动..."
    local retry_count=0
    local max_retries=15
    
    while [[ $retry_count -lt $max_retries ]]; do
        if docker info &> /dev/null; then
            log_success "Docker 服务重启完成"
            return 0
        fi
        
        ((retry_count++))
        log_info "等待 Docker 服务启动... ($retry_count/$max_retries)"
        sleep 2
    done
    
    log_error "Docker 服务重启失败"
    return 1
}

# ============================================================================
# 环境准备函数
# ============================================================================

# 创建必要的目录
create_directories() {
    log_step "创建必要的目录..."
    
    local directories=(
        "${DATA_DIR:-./data}/postgres"
        "${DATA_DIR:-./data}/redis"
        "${DATA_DIR:-./data}/victoriametrics"
        "${DATA_DIR:-./data}/grafana"
        "${UPLOADS_DIR:-./uploads}"
        "${MIBS_DIR:-./mibs}"
        "${CONFIG_DIR:-./config}/snmp_exporter"
        "${CONFIG_DIR:-./config}/categraf"
        "${CONFIG_DIR:-./config}/vmalert"
        "${CONFIG_DIR:-./config}/alertmanager"
        "nginx/logs"
        "nginx/ssl"
    )
    
    for dir in "${directories[@]}"; do
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "试运行: 将创建目录 $dir"
        else
            mkdir -p "$dir"
            log_debug "创建目录: $dir"
        fi
    done
    
    # 设置权限
    if [[ "$DRY_RUN" != "true" ]]; then
        chmod 755 "${DATA_DIR:-./data}" "${UPLOADS_DIR:-./uploads}" "${MIBS_DIR:-./mibs}" "${CONFIG_DIR:-./config}"
    fi
    
    log_success "目录创建完成"
}

# 生成环境配置文件
generate_env_file() {
    log_step "生成环境配置文件..."
    
    local env_file=".env"
    
    if [[ -f "$env_file" && "$FORCE" != "true" ]]; then
        if ! ask_confirmation "环境配置文件已存在，是否覆盖？"; then
            log_info "使用现有环境配置文件"
            return 0
        fi
    fi
    
    # 备份现有文件
    if [[ -f "$env_file" ]]; then
        backup_file "$env_file"
    fi
    
    # 生成新的环境配置
    local env_content="# SNMP MIB Platform 环境配置
# 生成时间: $(date)

# 数据库配置
POSTGRES_DB=${POSTGRES_DB:-mib_platform}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)}
POSTGRES_PORT=${POSTGRES_PORT:-5432}

# Redis 配置
REDIS_PORT=${REDIS_PORT:-6379}
REDIS_PASSWORD=${REDIS_PASSWORD:-}

# 应用配置
BACKEND_PORT=${BACKEND_PORT:-8080}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
HTTP_PORT=${HTTP_PORT:-80}
HTTPS_PORT=${HTTPS_PORT:-443}

# JWT 密钥
JWT_SECRET=${JWT_SECRET:-$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)}

# CORS 配置
CORS_ORIGINS=${CORS_ORIGINS:-http://localhost:3000,http://localhost}

# API 配置
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:8080}

# 环境
ENVIRONMENT=${ENVIRONMENT:-production}

# 数据目录
DATA_DIR=${DATA_DIR:-./data}
UPLOADS_DIR=${UPLOADS_DIR:-./uploads}
MIBS_DIR=${MIBS_DIR:-./mibs}
CONFIG_DIR=${CONFIG_DIR:-./config}

# 监控配置
GRAFANA_PORT=${GRAFANA_PORT:-3001}
VICTORIAMETRICS_PORT=${VICTORIAMETRICS_PORT:-8428}
ALERTMANAGER_PORT=${ALERTMANAGER_PORT:-9093}
"
    
    write_file "$env_file" "$env_content"
    log_success "环境配置文件生成完成"
}

# ============================================================================
# 镜像管理函数
# ============================================================================

# 拉取所需的 Docker 镜像
pull_required_images() {
    if [[ "$SKIP_IMAGE_PULL" == "true" ]]; then
        log_info "跳过镜像拉取"
        return 0
    fi
    
    log_step "拉取 Docker 镜像..."
    
    # 定义镜像列表
    local images=(
        "registry.cn-hangzhou.aliyuncs.com/library/postgres:15-alpine"
        "registry.cn-hangzhou.aliyuncs.com/library/redis:7-alpine"
        "registry.cn-hangzhou.aliyuncs.com/library/nginx:alpine"
        "victoriametrics/victoria-metrics:latest"
        "grafana/grafana:latest"
        "victoriametrics/vmalert:latest"
        "prom/alertmanager:latest"
        "prom/node-exporter:latest"
        "prom/snmp-exporter:latest"
        "flashcatcloud/categraf:latest"
    )
    
    local total_images=${#images[@]}
    local current_image=0
    
    for image in "${images[@]}"; do
        ((current_image++))
        show_progress $current_image $total_images "拉取镜像: $(basename "$image")"
        
        if pull_docker_image "$image" 3; then
            log_debug "镜像拉取成功: $image"
        else
            log_warning "镜像拉取失败: $image"
        fi
    done
    
    log_success "镜像拉取完成"
}

# ============================================================================
# 服务部署函数
# ============================================================================

# 启动服务
start_services() {
    log_step "启动服务..."
    
    # 检查 compose 文件
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        log_error "Docker Compose 文件不存在: $COMPOSE_FILE"
        return 1
    fi
    
    # 验证 compose 文件
    log_info "验证 Docker Compose 配置..."
    if ! $COMPOSE_CMD -f "$COMPOSE_FILE" config &> /dev/null; then
        log_error "Docker Compose 配置文件语法错误"
        return 1
    fi
    
    # 停止可能存在的旧服务
    log_info "停止可能存在的旧服务..."
    $COMPOSE_CMD -f "$COMPOSE_FILE" down &> /dev/null || true
    
    # 启动服务
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "试运行: 将启动所有服务"
        return 0
    fi
    
    log_info "启动所有服务..."
    if $COMPOSE_CMD -f "$COMPOSE_FILE" up -d; then
        log_success "服务启动命令执行成功"
    else
        log_error "服务启动失败"
        return 1
    fi
    
    # 等待服务启动
    wait_for_services
}

# 等待服务就绪
wait_for_services() {
    log_step "等待服务就绪..."
    
    # 定义服务检查列表
    local services=(
        "postgres:5432:数据库"
        "redis:6379:缓存"
        "localhost:8080:后端API"
        "localhost:3000:前端应用"
        "localhost:3001:Grafana"
        "localhost:8428:VictoriaMetrics"
    )
    
    local total_services=${#services[@]}
    local ready_services=0
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r host port name <<< "$service_info"
        
        log_info "等待 $name 服务启动..."
        
        local retry_count=0
        local max_retries=${HEALTH_CHECK_RETRIES:-12}
        local check_interval=${HEALTH_CHECK_INTERVAL:-5}
        
        while [[ $retry_count -lt $max_retries ]]; do
            if check_service_health "$host" "$port"; then
                log_success "$name 服务已就绪"
                ((ready_services++))
                break
            fi
            
            ((retry_count++))
            if [[ $retry_count -lt $max_retries ]]; then
                log_info "等待 $name 服务启动... ($retry_count/$max_retries)"
                sleep $check_interval
            fi
        done
        
        if [[ $retry_count -eq $max_retries ]]; then
            log_error "$name 服务启动超时"
            log_error "请检查服务日志: $COMPOSE_CMD -f $COMPOSE_FILE logs $host"
        fi
    done
    
    # 显示启动结果
    log_info "服务启动结果: $ready_services/$total_services"
    
    if [[ $ready_services -eq $total_services ]]; then
        log_success "所有服务启动完成"
        return 0
    else
        log_warning "部分服务启动失败"
        return 1
    fi
}

# 检查服务健康状态
check_service_health() {
    local host="$1"
    local port="$2"
    
    # 尝试多种检查方法
    if command -v nc &> /dev/null; then
        nc -z "$host" "$port" 2>/dev/null
    elif command -v telnet &> /dev/null; then
        timeout 3 telnet "$host" "$port" 2>/dev/null | grep -q "Connected"
    elif command -v curl &> /dev/null && [[ "$host" == "localhost" ]]; then
        curl -f -s --connect-timeout 3 "http://$host:$port" &> /dev/null
    else
        # 使用 /dev/tcp 检查
        timeout 3 bash -c "echo >/dev/tcp/$host/$port" 2>/dev/null
    fi
}

# ============================================================================
# 部署后验证
# ============================================================================

# 验证部署
verify_deployment() {
    log_step "验证部署..."
    
    # 检查容器状态
    log_info "检查容器状态..."
    if $COMPOSE_CMD -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log_success "容器运行正常"
    else
        log_error "部分容器未正常运行"
        $COMPOSE_CMD -f "$COMPOSE_FILE" ps
    fi
    
    # 检查服务端点
    local endpoints=(
        "http://localhost:3000:前端应用"
        "http://localhost:8080/health:后端健康检查"
        "http://localhost:3001:Grafana"
        "http://localhost:8428:VictoriaMetrics"
    )
    
    for endpoint_info in "${endpoints[@]}"; do
        IFS=':' read -r url name <<< "$endpoint_info"
        
        if command -v curl &> /dev/null; then
            if curl -f -s --connect-timeout 5 "$url" &> /dev/null; then
                log_success "$name 可访问: $url"
            else
                log_warning "$name 不可访问: $url"
            fi
        fi
    done
    
    log_success "部署验证完成"
}

# 显示部署信息
show_deployment_info() {
    log_title "部署完成"
    
    echo -e "${GREEN}🎉 SNMP MIB Platform 部署成功！${NC}"
    echo
    echo -e "${CYAN}访问地址:${NC}"
    echo -e "  🌐 前端界面: ${BLUE}http://localhost:3000${NC}"
    echo -e "  🔧 后端 API: ${BLUE}http://localhost:8080${NC}"
    echo -e "  📊 Grafana: ${BLUE}http://localhost:3001${NC} (admin/admin)"
    echo -e "  📈 VictoriaMetrics: ${BLUE}http://localhost:8428${NC}"
    echo -e "  🚨 Alertmanager: ${BLUE}http://localhost:9093${NC}"
    echo
    echo -e "${CYAN}管理命令:${NC}"
    echo -e "  查看状态: ${YELLOW}$COMPOSE_CMD -f $COMPOSE_FILE ps${NC}"
    echo -e "  查看日志: ${YELLOW}$COMPOSE_CMD -f $COMPOSE_FILE logs -f${NC}"
    echo -e "  停止服务: ${YELLOW}$COMPOSE_CMD -f $COMPOSE_FILE down${NC}"
    echo -e "  重启服务: ${YELLOW}$COMPOSE_CMD -f $COMPOSE_FILE restart${NC}"
    echo
    echo -e "${CYAN}验证部署:${NC}"
    echo -e "  运行测试: ${YELLOW}./verify-deployment.sh${NC}"
    echo -e "  功能测试: ${YELLOW}./test_platform.sh${NC}"
    echo
    echo -e "${GREEN}部署完成时间: $(date)${NC}"
}

# ============================================================================
# 参数解析和主函数
# ============================================================================

# 显示帮助信息
show_help() {
    show_script_info "$SCRIPT_NAME" "$SCRIPT_VERSION" "$SCRIPT_DESCRIPTION"
    
    cat << EOF
用法: $0 [选项]

选项:
  -h, --help              显示此帮助信息
  -v, --verbose           详细输出模式
  -n, --dry-run           试运行模式（不执行实际操作）
  -c, --config FILE       指定配置文件 (默认: $DEFAULT_CONFIG_FILE)
  -f, --force             强制执行（跳过确认）
  --log-file FILE         指定日志文件
  --skip-checks           跳过系统检查
  --skip-docker-config    跳过 Docker 镜像源配置
  --skip-image-pull       跳过镜像拉取
  --quick                 快速模式（跳过网络检查）
  --generate-config       仅生成配置文件

示例:
  $0                      标准部署
  $0 --verbose            详细输出部署
  $0 --dry-run            试运行模式
  $0 --config prod.conf   使用生产配置
  $0 --quick              快速部署模式
  $0 --generate-config    仅生成配置文件

环境变量:
  VERBOSE                 详细输出模式 (true/false)
  DRY_RUN                 试运行模式 (true/false)
  FORCE                   强制模式 (true/false)
  LOG_FILE                日志文件路径

EOF
    
    show_standard_help "$(basename "$0")"
}

# 解析命令行参数
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -n|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -c|--config)
                CONFIG_FILE="$2"
                shift 2
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            --log-file)
                LOG_FILE="$2"
                shift 2
                ;;
            --skip-checks)
                SKIP_CHECKS=true
                shift
                ;;
            --skip-docker-config)
                SKIP_DOCKER_CONFIG=true
                shift
                ;;
            --skip-image-pull)
                SKIP_IMAGE_PULL=true
                shift
                ;;
            --quick)
                QUICK_MODE=true
                SKIP_DOCKER_CONFIG=true
                shift
                ;;
            --generate-config)
                generate_deploy_config "$CONFIG_FILE"
                exit 0
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# 主函数
main() {
    # 显示脚本信息
    show_script_info "$SCRIPT_NAME" "$SCRIPT_VERSION" "$SCRIPT_DESCRIPTION"
    
    # 解析参数
    parse_arguments "$@"
    
    # 加载配置文件
    if [[ -f "$CONFIG_FILE" ]]; then
        load_config "$CONFIG_FILE"
    else
        log_info "配置文件不存在，将生成默认配置: $CONFIG_FILE"
        generate_deploy_config "$CONFIG_FILE"
        load_config "$CONFIG_FILE"
    fi
    
    # 系统检查
    if [[ "$SKIP_CHECKS" != "true" ]]; then
        check_system_requirements
    fi
    
    # 配置 Docker 镜像源
    configure_docker_mirrors
    
    # 环境准备
    create_directories
    generate_env_file
    
    # 拉取镜像
    pull_required_images
    
    # 启动服务
    start_services
    
    # 验证部署
    verify_deployment
    
    # 显示部署信息
    show_deployment_info
    
    log_success "部署完成！"
}

# 执行主函数
main "$@"