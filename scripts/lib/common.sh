#!/bin/bash

# SNMP MIB Platform 公共函数库
# 作者: Evan (oumu743@gmail.com)
# 版本: 2.0.0
# 用途: 为所有脚本提供统一的函数和工具

# 严格模式设置
set -euo pipefail
IFS=$'\n\t'

# 版本信息
readonly COMMON_LIB_VERSION="2.0.0"

# 颜色定义
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m' # No Color

# 符号定义
readonly CHECK_MARK="✓"
readonly CROSS_MARK="✗"
readonly WARNING_MARK="⚠"
readonly INFO_MARK="ℹ"
readonly ROCKET="🚀"
readonly GEAR="⚙"

# 全局变量
VERBOSE=${VERBOSE:-false}
DRY_RUN=${DRY_RUN:-false}
FORCE=${FORCE:-false}
LOG_FILE=${LOG_FILE:-""}

# ============================================================================
# 日志函数
# ============================================================================

# 基础日志函数
_log() {
    local level="$1"
    local color="$2"
    local symbol="$3"
    local message="$4"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # 控制台输出
    echo -e "${color}[${symbol}]${NC} ${message}" >&2
    
    # 文件输出（如果指定了日志文件）
    if [[ -n "$LOG_FILE" ]]; then
        echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    fi
}

# 信息日志
log_info() {
    _log "INFO" "$BLUE" "$INFO_MARK" "$1"
}

# 成功日志
log_success() {
    _log "SUCCESS" "$GREEN" "$CHECK_MARK" "$1"
}

# 警告日志
log_warning() {
    _log "WARNING" "$YELLOW" "$WARNING_MARK" "$1"
}

# 错误日志
log_error() {
    _log "ERROR" "$RED" "$CROSS_MARK" "$1"
}

# 步骤日志
log_step() {
    _log "STEP" "$PURPLE" "$GEAR" "$1"
}

# 调试日志（仅在 VERBOSE 模式下显示）
log_debug() {
    if [[ "$VERBOSE" == "true" ]]; then
        _log "DEBUG" "$CYAN" "🔍" "$1"
    fi
}

# 标题日志
log_title() {
    local title="$1"
    local width=60
    local padding=$(( (width - ${#title}) / 2 ))
    
    echo -e "${CYAN}"
    printf '=%.0s' $(seq 1 $width)
    echo
    printf '%*s%s%*s\n' $padding '' "$title" $padding ''
    printf '=%.0s' $(seq 1 $width)
    echo -e "${NC}"
}

# ============================================================================
# 错误处理函数
# ============================================================================

# 错误处理函数
handle_error() {
    local exit_code=$?
    local line_number=${1:-"unknown"}
    
    log_error "脚本在第 $line_number 行执行失败，退出码: $exit_code"
    
    # 显示调用栈
    if [[ "$VERBOSE" == "true" ]]; then
        log_debug "调用栈:"
        local frame=0
        while caller $frame; do
            ((frame++))
        done
    fi
    
    cleanup_on_exit
    exit $exit_code
}

# 清理函数
cleanup_on_exit() {
    log_debug "执行清理操作..."
    
    # 清理临时文件
    if [[ -n "${TEMP_DIR:-}" && -d "$TEMP_DIR" ]]; then
        rm -rf "$TEMP_DIR"
        log_debug "已清理临时目录: $TEMP_DIR"
    fi
    
    # 清理临时文件列表
    if [[ -n "${TEMP_FILES:-}" ]]; then
        for file in $TEMP_FILES; do
            if [[ -f "$file" ]]; then
                rm -f "$file"
                log_debug "已清理临时文件: $file"
            fi
        done
    fi
}

# 设置错误处理陷阱
setup_error_handling() {
    trap 'handle_error $LINENO' ERR
    trap cleanup_on_exit EXIT
}

# ============================================================================
# 系统检查函数
# ============================================================================

# 检查命令是否存在
check_command() {
    local cmd="$1"
    local package="${2:-$cmd}"
    
    if ! command -v "$cmd" &> /dev/null; then
        log_error "命令 '$cmd' 未找到"
        log_info "请安装 $package: sudo apt-get install $package"
        return 1
    fi
    
    log_debug "命令 '$cmd' 可用"
    return 0
}

# 检查必需的命令
check_required_commands() {
    local commands=("$@")
    local missing_commands=()
    
    log_step "检查必需的命令..."
    
    for cmd in "${commands[@]}"; do
        if ! check_command "$cmd"; then
            missing_commands+=("$cmd")
        fi
    done
    
    if [[ ${#missing_commands[@]} -gt 0 ]]; then
        log_error "缺少必需的命令: ${missing_commands[*]}"
        return 1
    fi
    
    log_success "所有必需的命令都可用"
    return 0
}

# 检查系统资源
check_system_resources() {
    log_step "检查系统资源..."
    
    # 检查内存
    local memory_gb
    if command -v free &> /dev/null; then
        memory_gb=$(free -g | awk '/^Mem:/{print $2}')
        if [[ $memory_gb -lt 4 ]]; then
            log_warning "可用内存少于 4GB (当前: ${memory_gb}GB)"
        else
            log_success "内存检查通过: ${memory_gb}GB"
        fi
    fi
    
    # 检查磁盘空间
    local disk_space_gb
    if command -v df &> /dev/null; then
        disk_space_gb=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
        if [[ ${disk_space_gb:-0} -lt 20 ]]; then
            log_warning "可用磁盘空间少于 20GB (当前: ${disk_space_gb}GB)"
        else
            log_success "磁盘空间检查通过: ${disk_space_gb}GB"
        fi
    fi
}

# 检查网络连接
check_network_connectivity() {
    local hosts=("$@")
    
    if [[ ${#hosts[@]} -eq 0 ]]; then
        hosts=("8.8.8.8" "github.com")
    fi
    
    log_step "检查网络连接..."
    
    for host in "${hosts[@]}"; do
        if ping -c 1 -W 5 "$host" &> /dev/null; then
            log_success "网络连接正常: $host"
        else
            log_warning "无法连接到: $host"
        fi
    done
}

# ============================================================================
# 文件操作函数
# ============================================================================

# 创建临时目录
create_temp_dir() {
    local prefix="${1:-snmp-mib-platform}"
    TEMP_DIR=$(mktemp -d -t "${prefix}.XXXXXX")
    log_debug "创建临时目录: $TEMP_DIR"
    echo "$TEMP_DIR"
}

# 创建临时文件
create_temp_file() {
    local prefix="${1:-snmp-mib-platform}"
    local suffix="${2:-}"
    local temp_file
    
    if [[ -n "$suffix" ]]; then
        temp_file=$(mktemp -t "${prefix}.XXXXXX.${suffix}")
    else
        temp_file=$(mktemp -t "${prefix}.XXXXXX")
    fi
    
    TEMP_FILES="${TEMP_FILES:-} $temp_file"
    log_debug "创建临时文件: $temp_file"
    echo "$temp_file"
}

# 安全地备份文件
backup_file() {
    local file="$1"
    local backup_suffix="${2:-.backup.$(date +%Y%m%d_%H%M%S)}"
    
    if [[ -f "$file" ]]; then
        local backup_file="${file}${backup_suffix}"
        cp "$file" "$backup_file"
        log_success "文件已备份: $file -> $backup_file"
        echo "$backup_file"
    else
        log_warning "文件不存在，无法备份: $file"
        return 1
    fi
}

# 安全地写入文件
write_file() {
    local file="$1"
    local content="$2"
    local backup="${3:-true}"
    
    # 备份原文件
    if [[ "$backup" == "true" && -f "$file" ]]; then
        backup_file "$file"
    fi
    
    # 写入新内容
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "试运行: 将写入文件 $file"
        log_debug "内容预览: $(echo "$content" | head -3)"
    else
        echo "$content" > "$file"
        log_success "文件写入成功: $file"
    fi
}

# ============================================================================
# Docker 相关函数
# ============================================================================

# 检查 Docker 是否运行
check_docker() {
    log_step "检查 Docker 状态..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        return 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker 守护进程未运行"
        return 1
    fi
    
    log_success "Docker 运行正常"
    return 0
}

# 检查 Docker Compose
check_docker_compose() {
    log_step "检查 Docker Compose..."
    
    # 检查新版本 docker compose
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
        local version=$(docker compose version --short 2>/dev/null || echo "unknown")
        log_success "使用 Docker Compose V2: $version"
        return 0
    fi
    
    # 检查旧版本 docker-compose
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
        local version=$(docker-compose --version 2>/dev/null | cut -d' ' -f3 | cut -d',' -f1 || echo "unknown")
        log_success "使用 Docker Compose V1: $version"
        return 0
    fi
    
    log_error "Docker Compose 未安装"
    return 1
}

# 拉取 Docker 镜像
pull_docker_image() {
    local image="$1"
    local max_retries="${2:-3}"
    
    log_info "拉取 Docker 镜像: $image"
    
    local retry_count=0
    while [[ $retry_count -lt $max_retries ]]; do
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "试运行: 将拉取镜像 $image"
            return 0
        fi
        
        if docker pull "$image"; then
            log_success "镜像拉取成功: $image"
            return 0
        fi
        
        ((retry_count++))
        if [[ $retry_count -lt $max_retries ]]; then
            log_warning "镜像拉取失败，重试 ($retry_count/$max_retries): $image"
            sleep 5
        fi
    done
    
    log_error "镜像拉取失败: $image"
    return 1
}

# ============================================================================
# 用户交互函数
# ============================================================================

# 询问用户确认
ask_confirmation() {
    local message="$1"
    local default="${2:-n}"
    
    if [[ "$FORCE" == "true" ]]; then
        log_info "强制模式: 自动确认 - $message"
        return 0
    fi
    
    local prompt
    if [[ "$default" == "y" ]]; then
        prompt="$message (Y/n): "
    else
        prompt="$message (y/N): "
    fi
    
    while true; do
        read -p "$prompt" -n 1 -r
        echo
        
        case $REPLY in
            [Yy])
                return 0
                ;;
            [Nn])
                return 1
                ;;
            "")
                if [[ "$default" == "y" ]]; then
                    return 0
                else
                    return 1
                fi
                ;;
            *)
                echo "请输入 y 或 n"
                ;;
        esac
    done
}

# 显示进度条
show_progress() {
    local current="$1"
    local total="$2"
    local message="${3:-处理中}"
    local width=50
    
    local percentage=$((current * 100 / total))
    local filled=$((current * width / total))
    local empty=$((width - filled))
    
    printf "\r${BLUE}[${NC}"
    printf "%${filled}s" | tr ' ' '='
    printf "%${empty}s" | tr ' ' '-'
    printf "${BLUE}]${NC} %d%% %s" "$percentage" "$message"
    
    if [[ $current -eq $total ]]; then
        echo
    fi
}

# ============================================================================
# 配置管理函数
# ============================================================================

# 加载配置文件
load_config() {
    local config_file="$1"
    
    if [[ -f "$config_file" ]]; then
        source "$config_file"
        log_success "已加载配置文件: $config_file"
        return 0
    else
        log_warning "配置文件不存在: $config_file"
        return 1
    fi
}

# 生成默认配置
generate_default_config() {
    local config_file="$1"
    
    cat > "$config_file" << 'EOF'
# SNMP MIB Platform 配置文件
# 生成时间: $(date)

# 基础配置
VERBOSE=false
DRY_RUN=false
FORCE=false

# Docker 配置
COMPOSE_CMD="docker compose"
DOCKER_REGISTRY="registry.cn-hangzhou.aliyuncs.com"

# 网络配置
HTTP_PORT=3000
API_PORT=8080
GRAFANA_PORT=3001

# 数据库配置
POSTGRES_DB=mib_platform
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# 安全配置
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
EOF
    
    log_success "默认配置文件已生成: $config_file"
}

# ============================================================================
# 版本管理函数
# ============================================================================

# 比较版本号
version_compare() {
    local version1="$1"
    local version2="$2"
    
    if [[ "$version1" == "$version2" ]]; then
        echo "0"
        return
    fi
    
    local IFS=.
    local i ver1=($version1) ver2=($version2)
    
    # 填充缺失的版本号部分
    for ((i=${#ver1[@]}; i<${#ver2[@]}; i++)); do
        ver1[i]=0
    done
    for ((i=${#ver2[@]}; i<${#ver1[@]}; i++)); do
        ver2[i]=0
    done
    
    # 比较版本号
    for ((i=0; i<${#ver1[@]}; i++)); do
        if [[ ${ver1[i]} -gt ${ver2[i]} ]]; then
            echo "1"
            return
        elif [[ ${ver1[i]} -lt ${ver2[i]} ]]; then
            echo "-1"
            return
        fi
    done
    
    echo "0"
}

# ============================================================================
# 帮助函数
# ============================================================================

# 显示脚本信息
show_script_info() {
    local script_name="$1"
    local script_version="$2"
    local script_description="$3"
    
    log_title "$script_name v$script_version"
    echo -e "${CYAN}$script_description${NC}"
    echo
    echo -e "${YELLOW}公共函数库版本:${NC} $COMMON_LIB_VERSION"
    echo -e "${YELLOW}执行时间:${NC} $(date)"
    echo -e "${YELLOW}执行用户:${NC} $(whoami)"
    echo -e "${YELLOW}工作目录:${NC} $(pwd)"
    echo
}

# 显示标准帮助信息
show_standard_help() {
    local script_name="$1"
    
    cat << EOF
标准选项:
  -h, --help          显示此帮助信息
  -v, --verbose       详细输出模式
  -n, --dry-run       试运行模式（不执行实际操作）
  -c, --config FILE   指定配置文件
  --force             强制执行（跳过确认）
  --log-file FILE     指定日志文件

环境变量:
  VERBOSE             详细输出模式 (true/false)
  DRY_RUN             试运行模式 (true/false)
  FORCE               强制模式 (true/false)
  LOG_FILE            日志文件路径

示例:
  $script_name                    标准执行
  $script_name --verbose          详细输出
  $script_name --dry-run          试运行模式
  $script_name --config prod.conf 使用生产配置

EOF
}

# ============================================================================
# 初始化函数
# ============================================================================

# 初始化公共函数库
init_common_lib() {
    # 设置错误处理
    setup_error_handling
    
    # 检查基础命令
    check_required_commands "bash" "date" "mktemp"
    
    log_debug "公共函数库 v$COMMON_LIB_VERSION 初始化完成"
}

# 如果直接执行此脚本，显示信息
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    show_script_info "SNMP MIB Platform 公共函数库" "$COMMON_LIB_VERSION" "为所有脚本提供统一的函数和工具"
    echo -e "${GREEN}这是一个函数库文件，请在其他脚本中使用 source 命令加载${NC}"
    echo -e "${YELLOW}示例: source \$(dirname \"\$0\")/scripts/lib/common.sh${NC}"
fi