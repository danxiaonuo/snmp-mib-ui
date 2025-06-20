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

# Go环境检查和安装
check_and_install_go() {
    local GO_VERSION="1.23.10"
    local GO_ARCH=""
    
    # 检测系统架构
    case $(uname -m) in
        x86_64) GO_ARCH="amd64" ;;
        aarch64|arm64) GO_ARCH="arm64" ;;
        armv7l) GO_ARCH="armv6l" ;;
        *) 
            log_error "不支持的系统架构: $(uname -m)"
            return 1
            ;;
    esac
    
    log_info "检查Go环境..."
    
    # 使用新的检查函数
    if check_go_version_requirement; then
        local CURRENT_VERSION=$(go version | awk '{print $3}' | sed 's/go//')
        log_success "Go版本满足要求: $CURRENT_VERSION"
        configure_go_proxy
        return 0
    fi
    
    # 如果版本不满足要求，检查是否需要安装或升级
    if command -v go &> /dev/null; then
        local CURRENT_VERSION=$(go version | awk '{print $3}' | sed 's/go//')
        log_warning "Go版本过低: $CURRENT_VERSION，需要升级到 $GO_VERSION 或更高版本"
    else
        log_warning "未检测到Go环境，正在安装..."
    fi
    
    # 安装Go
    log_info "正在安装Go $GO_VERSION ($GO_ARCH)..."
    
    # 下载Go
    local GO_TAR="go${GO_VERSION}.linux-${GO_ARCH}.tar.gz"
    local GO_URL="https://golang.google.cn/dl/${GO_TAR}"
    
    # 创建临时目录
    local TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    # 下载Go安装包
    if curl -L -o "$GO_TAR" "$GO_URL"; then
        log_success "Go安装包下载完成"
    else
        log_error "Go安装包下载失败"
        rm -rf "$TEMP_DIR"
        return 1
    fi
    
    # 移除旧的Go安装（如果存在）
    sudo rm -rf /usr/local/go
    
    # 解压安装
    sudo tar -C /usr/local -xzf "$GO_TAR"
    
    # 设置环境变量
    if ! grep -q "/usr/local/go/bin" ~/.bashrc; then
        echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
        echo 'export GOPATH=$HOME/go' >> ~/.bashrc
        echo 'export GOBIN=$GOPATH/bin' >> ~/.bashrc
    fi
    
    # 为当前会话设置环境变量
    export PATH=$PATH:/usr/local/go/bin
    export GOPATH=$HOME/go
    export GOBIN=$GOPATH/bin
    
    # 清理临时文件
    cd - > /dev/null
    rm -rf "$TEMP_DIR"
    
    # 验证安装
    if command -v go &> /dev/null; then
        log_success "Go安装成功，版本: $(go version | awk '{print $3}')"
        configure_go_proxy
        return 0
    else
        log_error "Go安装失败"
        return 1
    fi
}

# 配置Go代理
configure_go_proxy() {
    log_info "配置Go代理和环境..."
    
    # 检查是否已经配置过
    local CURRENT_PROXY=$(go env GOPROXY 2>/dev/null || echo "")
    if [ "$CURRENT_PROXY" = "https://goproxy.cn,direct" ]; then
        log_success "Go代理已配置，跳过"
        return 0
    fi
    
    # 配置国内代理
    go env -w GOPROXY=https://goproxy.cn,direct
    go env -w GOSUMDB=sum.golang.google.cn
    go env -w GO111MODULE=on
    go env -w GOPRIVATE=""
    
    log_success "Go代理配置完成"
}

# 检查Docker镜像源配置状态
check_docker_mirrors() {
    local DAEMON_CONFIG="/etc/docker/daemon.json"
    
    if [ -f "$DAEMON_CONFIG" ]; then
        if grep -q "registry-mirrors" "$DAEMON_CONFIG" 2>/dev/null; then
            log_success "Docker镜像源已配置"
            return 0
        fi
    fi
    
    return 1
}

# 检查Go环境是否满足要求
check_go_version_requirement() {
    local REQUIRED_VERSION="1.23.10"
    
    if ! command -v go &> /dev/null; then
        return 1
    fi
    
    local CURRENT_VERSION=$(go version | awk '{print $3}' | sed 's/go//')
    
    # 使用版本比较
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$CURRENT_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
        return 0
    else
        return 1
    fi
}

# 检查构建产物是否存在且有效
check_build_artifact() {
    local BACKEND_DIR="./backend"
    local BINARY_PATH="$BACKEND_DIR/mib-platform"
    
    if [ ! -f "$BINARY_PATH" ]; then
        return 1
    fi
    
    # 检查文件是否可执行
    if [ ! -x "$BINARY_PATH" ]; then
        return 1
    fi
    
    # 检查文件大小（应该大于1MB）
    local FILE_SIZE=$(stat -c%s "$BINARY_PATH" 2>/dev/null || echo "0")
    if [ "$FILE_SIZE" -lt 1048576 ]; then
        return 1
    fi
    
    # 检查是否是有效的二进制文件
    if ! file "$BINARY_PATH" | grep -q "executable" 2>/dev/null; then
        return 1
    fi
    
    return 0
}

# 本地构建后端
build_backend_locally() {
    log_info "检查是否需要本地构建后端..."
    
    local BACKEND_DIR="./backend"
    
    if [ ! -d "$BACKEND_DIR" ]; then
        log_error "后端目录不存在: $BACKEND_DIR"
        return 1
    fi
    
    # 检查是否已有有效的构建产物
    if check_build_artifact; then
        if [ -n "$SKIP_BUILD" ]; then
            log_success "检测到有效的二进制文件，跳过构建"
            return 0
        else
            local BINARY_TIME=$(stat -c %Y "./backend/mib-platform" 2>/dev/null || echo "0")
            local SOURCE_TIME=$(find ./backend -name "*.go" -newer "./backend/mib-platform" | head -1)
            
            if [ -z "$SOURCE_TIME" ]; then
                log_success "二进制文件是最新的，跳过构建"
                return 0
            else
                log_info "检测到源代码更新，需要重新构建"
            fi
        fi
    fi
    
    cd "$BACKEND_DIR"
    
    log_info "开始本地构建Go后端..."
    
    # 清理旧的构建产物
    rm -f mib-platform
    
    # 显示构建信息
    log_info "Go版本: $(go version | awk '{print $3}')"
    log_info "代理配置: $(go env GOPROXY)"
    
    # 下载依赖
    log_info "下载Go依赖..."
    if ! go mod download; then
        log_error "依赖下载失败"
        cd - > /dev/null
        return 1
    fi
    
    # 验证依赖
    if ! go mod verify; then
        log_error "依赖验证失败"
        cd - > /dev/null
        return 1
    fi
    
    # 构建二进制文件
    log_info "编译Go程序..."
    local BUILD_TIME=$(date -u '+%Y-%m-%d %H:%M:%S UTC')
    local GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    
    if CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
        -ldflags="-w -s -X 'main.BuildTime=$BUILD_TIME' -X 'main.GitCommit=$GIT_COMMIT'" \
        -o mib-platform main.go; then
        
        local FILE_SIZE=$(ls -lh mib-platform | awk '{print $5}')
        log_success "后端构建成功 (大小: $FILE_SIZE)"
        
        # 验证构建结果
        if check_build_artifact; then
            log_success "构建产物验证通过"
        else
            log_warning "构建产物验证失败，但继续执行"
        fi
    else
        log_error "后端构建失败"
        cd - > /dev/null
        return 1
    fi
    
    cd - > /dev/null
    return 0
}

# 自动安装 Docker
install_docker() {
    log_info "安装 Docker..."
    
    # 检测操作系统
    if command -v apt-get &> /dev/null; then
        # Ubuntu/Debian
        log_info "检测到 Ubuntu/Debian 系统，正在安装 Docker..."
        sudo apt-get update
        sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        sudo systemctl start docker
        sudo systemctl enable docker
        sudo usermod -aG docker $USER
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        log_info "检测到 CentOS/RHEL 系统，正在安装 Docker..."
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        sudo systemctl start docker
        sudo systemctl enable docker
        sudo usermod -aG docker $USER
    else
        log_error "不支持的操作系统，请手动安装 Docker"
        exit 1
    fi
    
    log_success "Docker 安装完成"
}

# 安装 Docker Compose (如果需要)
install_docker_compose() {
    log_info "安装 Docker Compose..."
    
    # 下载最新版本的 Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    log_success "Docker Compose 安装完成"
}

# 配置Docker镜像源
configure_docker_mirrors() {
    # 先检查是否已配置
    if check_docker_mirrors; then
        return 0
    fi
    
    log_info "配置Docker镜像源..."
    
    # 使用dkturbo一键配置镜像源
    if docker run --rm --name=dkturbo -v /etc/docker:/etc/docker -v /opt:/opt -e MODE=registry -e REGISTRY=auto --pid=host --privileged registry.cn-shenzhen.aliyuncs.com/cp0204/dkturbo:main; then
        log_success "Docker镜像源配置完成"
        # 重启Docker服务以应用配置
        sudo systemctl restart docker
        sleep 3
    else
        log_warning "镜像源配置失败，使用默认配置"
    fi
}

# 检查系统要求
check_requirements() {
    log_info "检查系统要求..."
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        log_warning "Docker 未安装，正在自动安装..."
        install_docker
        log_info "请重新运行此脚本以应用用户组更改"
        exit 0
    fi
    
    # 检查 Docker 服务状态
    if ! sudo systemctl is-active --quiet docker; then
        log_info "启动 Docker 服务..."
        sudo systemctl start docker
    fi
    
    # 配置Docker镜像源
    configure_docker_mirrors
    
    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_warning "Docker Compose 未安装，正在自动安装..."
        install_docker_compose
    fi
    
    # 检查Go环境（用于本地构建）
    if [ "$BUILD_MODE" = "local" ] || [ -z "$BUILD_MODE" ]; then
        if ! check_and_install_go; then
            log_error "Go环境配置失败"
            exit 1
        fi
        
        # 执行本地构建
        if ! build_backend_locally; then
            log_error "本地构建失败，将切换到Docker在线构建模式"
            export BUILD_MODE="docker"
        else
            export BUILD_MODE="local"
            log_success "本地构建完成，将使用本地构建的二进制文件"
        fi
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
    
    # 智能选择Dockerfile和构建模式
    if [ "$BUILD_MODE" = "local" ] || ([ -z "$BUILD_MODE" ] && check_build_artifact); then
        export USE_LOCAL_BUILD=true
        export BACKEND_DOCKERFILE=Dockerfile.no-network
        log_info "使用本地构建模式 - 直接复制二进制文件"
        
        # 确保二进制文件存在
        if ! check_build_artifact; then
            log_error "本地构建产物不存在或无效，请先运行构建"
            return 1
        fi
    elif [ "$BUILD_MODE" = "docker" ]; then
        export USE_LOCAL_BUILD=false
        export BACKEND_DOCKERFILE=Dockerfile.optimized
        log_info "使用Docker在线构建模式"
    else
        # 自动选择：优先本地构建，如果没有则使用Docker构建
        if check_build_artifact; then
            export USE_LOCAL_BUILD=true
            export BACKEND_DOCKERFILE=Dockerfile.no-network
            log_info "检测到本地构建产物，使用本地构建模式"
        else
            export USE_LOCAL_BUILD=false
            export BACKEND_DOCKERFILE=Dockerfile.optimized
            log_info "未检测到本地构建产物，使用Docker在线构建模式"
        fi
    fi
    
    export GO_VERSION=1.23.10
    
    # 显示构建信息
    if [ "$USE_LOCAL_BUILD" = "true" ]; then
        local BINARY_SIZE=$(ls -lh ./backend/mib-platform 2>/dev/null | awk '{print $5}' || echo "未知")
        log_info "二进制文件大小: $BINARY_SIZE"
        log_info "使用Dockerfile: $BACKEND_DOCKERFILE"
    fi
    
    # 创建临时的.env文件确保环境变量传递
    cat > .env << EOF
USE_LOCAL_BUILD=$USE_LOCAL_BUILD
BACKEND_DOCKERFILE=$BACKEND_DOCKERFILE
GO_VERSION=$GO_VERSION
EOF
    
    log_info "环境变量配置:"
    log_info "  USE_LOCAL_BUILD=$USE_LOCAL_BUILD"
    log_info "  BACKEND_DOCKERFILE=$BACKEND_DOCKERFILE"
    log_info "  GO_VERSION=$GO_VERSION"
    
    # 使用 docker-compose 或 docker compose
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d --build
    else
        docker compose up -d --build
    fi
    
    # 清理临时.env文件
    rm -f .env
    
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
    
    # 等待前端就绪 (增加等待时间，考虑构建过程)
    log_info "检查前端服务（前端构建可能需要几分钟时间）..."
    attempt=0
    max_frontend_attempts=100  # 5分钟等待时间
    
    while [ $attempt -lt $max_frontend_attempts ]; do
        if curl -s --max-time 5 http://localhost:12300/ > /dev/null 2>&1; then
            log_success "前端服务已就绪"
            break
        fi
        attempt=$((attempt + 1))
        
        # 每30秒显示一次进度提示
        if [ $((attempt % 10)) -eq 0 ]; then
            echo ""
            log_info "前端正在构建中，已等待 $((attempt * 3)) 秒..."
        else
            echo -n "."
        fi
        sleep 3
    done
    echo ""
    
    if [ $attempt -eq $max_frontend_attempts ]; then
        log_error "前端服务启动超时，请检查服务状态"
        docker-compose logs frontend
        return 1
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

# 显示系统状态摘要
show_system_status() {
    echo ""
    echo "📋 系统状态检查摘要："
    echo "======================================"
    
    # Docker状态
    if command -v docker &> /dev/null; then
        echo -e "  ✅ Docker: $(docker --version | awk '{print $3}' | sed 's/,//')"
    else
        echo -e "  ❌ Docker: 未安装"
    fi
    
    # Docker镜像源
    if check_docker_mirrors; then
        echo -e "  ✅ Docker镜像源: 已配置"
    else
        echo -e "  ⚠️  Docker镜像源: 使用默认源"
    fi
    
    # Go环境
    if check_go_version_requirement; then
        local GO_VER=$(go version | awk '{print $3}' | sed 's/go//')
        echo -e "  ✅ Go环境: $GO_VER"
        
        # Go代理
        local PROXY=$(go env GOPROXY 2>/dev/null || echo "default")
        if [ "$PROXY" = "https://goproxy.cn,direct" ]; then
            echo -e "  ✅ Go代理: 国内加速"
        else
            echo -e "  ⚠️  Go代理: $PROXY"
        fi
    else
        echo -e "  ❌ Go环境: 未满足要求"
    fi
    
    # 构建产物
    if check_build_artifact; then
        local SIZE=$(ls -lh ./backend/mib-platform 2>/dev/null | awk '{print $5}' || echo "未知")
        echo -e "  ✅ 后端构建: 已完成 ($SIZE)"
    else
        echo -e "  ❌ 后端构建: 需要构建"
    fi
    
    echo "======================================"
    echo ""
}

# 主函数
main() {
    echo "======================================"
    echo -e "${BLUE}🐳 SNMP MIB Platform 一键部署${NC}"
    echo "======================================"
    echo ""
    
    # 显示系统状态
    show_system_status
    
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
    echo "  --clean           清理旧数据和Docker卷"
    echo "  --local-build     强制使用本地构建模式"
    echo "  --docker-build    强制使用Docker在线构建模式"
    echo "  --skip-build      跳过Go构建（仅在二进制文件已存在时）"
    echo "  --help            显示此帮助信息"
    echo ""
    echo "构建模式说明："
    echo "  本地构建模式：先在宿主机安装Go环境并构建二进制文件，然后复制到容器"
    echo "    优点：构建速度快，可以利用本地缓存，不依赖容器网络"
    echo "    适用：开发环境、网络受限环境"
    echo ""
    echo "  Docker构建模式：直接在Docker容器中构建"
    echo "    优点：环境一致性好，不污染宿主机环境"
    echo "    适用：生产环境、持续集成"
    echo ""
    echo "Examples:"
    echo "  $0                        # 自动选择构建模式（优先本地构建）"
    echo "  $0 --local-build          # 强制本地构建"
    echo "  $0 --docker-build         # 强制Docker构建"
    echo "  $0 --clean                # 清理旧数据后部署"
    echo "  $0 --skip-build --clean   # 跳过构建，清理数据后部署"
}

# 参数处理
CLEAN_DATA=""
BUILD_MODE=""
SKIP_BUILD=""

# 解析所有参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --help)
            show_help
            exit 0
            ;;
        --clean)
            CLEAN_DATA="--clean"
            shift
            ;;
        --local-build)
            BUILD_MODE="local"
            shift
            ;;
        --docker-build)
            BUILD_MODE="docker"
            shift
            ;;
        --skip-build)
            SKIP_BUILD="true"
            shift
            ;;
        *)
            log_error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

# 执行主函数
main "$CLEAN_DATA"