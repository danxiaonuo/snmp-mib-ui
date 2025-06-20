#!/bin/bash

# 后端本地构建脚本
# 用于在部署前预构建Go后端

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

# 检查Go环境
check_go_env() {
    if ! command -v go &> /dev/null; then
        log_error "Go环境未安装，请先运行 ./deploy.sh 安装Go环境"
        exit 1
    fi
    
    local GO_VERSION=$(go version | awk '{print $3}' | sed 's/go//')
    log_info "检测到Go版本: $GO_VERSION"
    
    # 配置Go代理
    log_info "配置Go代理..."
    go env -w GOPROXY=https://goproxy.cn,direct
    go env -w GOSUMDB=sum.golang.google.cn
    go env -w GO111MODULE=on
    
    log_success "Go环境检查完成"
}

# 构建后端
build_backend() {
    local BACKEND_DIR="./backend"
    
    if [ ! -d "$BACKEND_DIR" ]; then
        log_error "后端目录不存在: $BACKEND_DIR"
        exit 1
    fi
    
    log_info "开始构建Go后端..."
    
    cd "$BACKEND_DIR"
    
    # 清理旧的构建产物
    rm -f mib-platform
    
    # 显示构建信息
    log_info "项目: $(head -n 5 go.mod | grep module | awk '{print $2}')"
    log_info "Go版本: $(go version)"
    log_info "GOPROXY: $(go env GOPROXY)"
    
    # 下载依赖
    log_info "下载依赖..."
    if ! go mod download; then
        log_error "依赖下载失败"
        exit 1
    fi
    
    # 验证依赖
    log_info "验证依赖..."
    if ! go mod verify; then
        log_error "依赖验证失败"
        exit 1
    fi
    
    # 静态检查（可选）
    if command -v go vet &> /dev/null; then
        log_info "执行静态检查..."
        if ! go vet ./...; then
            log_warning "静态检查发现问题，但继续构建"
        fi
    fi
    
    # 构建二进制文件
    log_info "编译程序..."
    local BUILD_TIME=$(date -u '+%Y-%m-%d %H:%M:%S UTC')
    local GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    
    if CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
        -ldflags="-w -s -X 'main.BuildTime=$BUILD_TIME' -X 'main.GitCommit=$GIT_COMMIT'" \
        -o mib-platform main.go; then
        
        log_success "构建成功！"
        
        # 显示构建结果
        local FILE_SIZE=$(ls -lh mib-platform | awk '{print $5}')
        log_info "二进制文件: mib-platform"
        log_info "文件大小: $FILE_SIZE"
        log_info "构建时间: $BUILD_TIME"
        log_info "Git提交: $GIT_COMMIT"
        
        # 验证二进制文件
        if file mib-platform | grep -q "statically linked"; then
            log_success "静态链接构建成功"
        else
            log_warning "非静态链接构建"
        fi
        
    else
        log_error "构建失败"
        exit 1
    fi
    
    cd - > /dev/null
}

# 清理构建产物
clean_build() {
    log_info "清理构建产物..."
    rm -f ./backend/mib-platform
    log_success "清理完成"
}

# 显示帮助信息
show_help() {
    echo "Go后端构建脚本"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --clean    清理构建产物"
    echo "  --help     显示帮助信息"
    echo ""
    echo "Examples:"
    echo "  $0          # 构建后端"
    echo "  $0 --clean  # 清理构建产物"
}

# 主函数
main() {
    case "$1" in
        --clean)
            clean_build
            ;;
        --help)
            show_help
            ;;
        "")
            echo "======================================"
            echo -e "${BLUE}🔨 构建Go后端${NC}"
            echo "======================================"
            check_go_env
            build_backend
            echo ""
            echo "======================================"
            echo -e "${GREEN}✅ 构建完成！${NC}"
            echo "======================================"
            echo ""
            echo "下一步: 运行 ./deploy.sh 部署服务"
            ;;
        *)
            log_error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$1"