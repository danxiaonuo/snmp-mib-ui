#!/bin/bash

# SNMP MIB Platform - systemd服务安装脚本
# 安装和配置所有必要的systemd服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 检查权限
check_permissions() {
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本必须以root权限运行"
        log_info "请使用: sudo $0"
        exit 1
    fi
}

# 检查系统要求
check_requirements() {
    log_info "检查系统要求..."
    
    # 检查systemd
    if ! command -v systemctl &> /dev/null; then
        log_error "系统不支持systemd"
        exit 1
    fi
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js未安装，请先安装Node.js 18+"
        exit 1
    fi
    
    log_success "系统要求检查通过"
}

# 创建用户和目录
setup_user_and_directories() {
    log_info "创建snmp-mib用户和目录..."
    
    # 创建系统用户
    if ! id "snmp-mib" &>/dev/null; then
        useradd -r -d /opt/snmp-mib-ui -s /bin/bash snmp-mib
        log_success "已创建snmp-mib用户"
    else
        log_warning "snmp-mib用户已存在"
    fi
    
    # 创建目录结构
    mkdir -p /opt/snmp-mib-ui
    mkdir -p /opt/snmp-mib-ui/logs
    mkdir -p /opt/snmp-mib-ui/backend/logs
    mkdir -p /opt/snmp-mib-ui/backend/uploads
    mkdir -p /var/log/snmp-mib-platform
    
    # 复制应用文件到目标目录
    if [[ $(pwd) != "/opt/snmp-mib-ui" ]]; then
        log_info "复制应用文件到 /opt/snmp-mib-ui"
        cp -r . /opt/snmp-mib-ui/
    fi
    
    # 设置权限
    chown -R snmp-mib:snmp-mib /opt/snmp-mib-ui
    chown -R snmp-mib:snmp-mib /var/log/snmp-mib-platform
    chmod +x /opt/snmp-mib-ui/backend/mib-platform
    
    log_success "目录和权限设置完成"
}

# 安装systemd服务文件
install_systemd_services() {
    log_info "安装systemd服务文件..."
    
    # 复制服务文件
    cp systemd/snmp-mib-frontend.service /etc/systemd/system/
    cp systemd/snmp-mib-backend.service /etc/systemd/system/
    cp systemd/snmp-mib-platform.target /etc/systemd/system/
    
    # 重新加载systemd配置
    systemctl daemon-reload
    
    log_success "systemd服务文件安装完成"
}

# 配置日志轮转
setup_log_rotation() {
    log_info "配置日志轮转..."
    
    cat > /etc/logrotate.d/snmp-mib-platform << 'EOF'
/var/log/snmp-mib-platform/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 snmp-mib snmp-mib
    postrotate
        systemctl reload snmp-mib-frontend snmp-mib-backend || true
    endscript
}

/opt/snmp-mib-ui/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 snmp-mib snmp-mib
}
EOF
    
    log_success "日志轮转配置完成"
}

# 启用和启动服务
start_services() {
    log_info "启用和启动服务..."
    
    # 启用服务
    systemctl enable snmp-mib-platform.target
    systemctl enable snmp-mib-frontend.service
    systemctl enable snmp-mib-backend.service
    
    # 启动数据库容器
    log_info "启动数据库容器..."
    docker run -d --name snmp-postgres \
        -e POSTGRES_USER=netmon_user \
        -e POSTGRES_PASSWORD=production_db_pass \
        -e POSTGRES_DB=network_monitor \
        -p 5432:5432 \
        --restart=unless-stopped \
        postgres:15-alpine || log_warning "PostgreSQL容器可能已存在"
    
    docker run -d --name snmp-redis \
        -p 6379:6379 \
        --restart=unless-stopped \
        redis:7-alpine || log_warning "Redis容器可能已存在"
    
    # 等待数据库启动
    sleep 10
    
    # 启动应用服务
    systemctl start snmp-mib-platform.target
    
    log_success "服务启动完成"
}

# 验证服务状态
verify_services() {
    log_info "验证服务状态..."
    
    sleep 5
    
    # 检查服务状态
    services=("snmp-mib-backend" "snmp-mib-frontend")
    for service in "${services[@]}"; do
        if systemctl is-active --quiet "$service"; then
            log_success "$service 服务运行正常"
        else
            log_error "$service 服务启动失败"
            systemctl status "$service" --no-pager -l
        fi
    done
    
    # 检查端口监听
    if netstat -tlnp | grep -q ":17880"; then
        log_success "后端API端口17880监听正常"
    else
        log_error "后端API端口17880未监听"
    fi
    
    if netstat -tlnp | grep -q ":12300"; then
        log_success "前端Web端口12300监听正常"
    else
        log_error "前端Web端口12300未监听"
    fi
    
    # 健康检查
    log_info "执行健康检查..."
    sleep 10
    
    if curl -f http://localhost:17880/api/v1/health &>/dev/null; then
        log_success "后端API健康检查通过"
    else
        log_warning "后端API健康检查失败"
    fi
    
    if curl -f http://localhost:12300/api/health &>/dev/null; then
        log_success "前端健康检查通过"
    else
        log_warning "前端健康检查失败"
    fi
}

# 显示管理命令
show_management_commands() {
    log_info "systemd服务管理命令:"
    echo
    echo "🚀 启动所有服务:"
    echo "   sudo systemctl start snmp-mib-platform.target"
    echo
    echo "🛑 停止所有服务:"
    echo "   sudo systemctl stop snmp-mib-platform.target"
    echo
    echo "🔄 重启所有服务:"
    echo "   sudo systemctl restart snmp-mib-platform.target"
    echo
    echo "📊 查看服务状态:"
    echo "   sudo systemctl status snmp-mib-platform.target"
    echo "   sudo systemctl status snmp-mib-frontend"
    echo "   sudo systemctl status snmp-mib-backend"
    echo
    echo "📋 查看服务日志:"
    echo "   sudo journalctl -u snmp-mib-frontend -f"
    echo "   sudo journalctl -u snmp-mib-backend -f"
    echo
    echo "🔧 重新加载配置:"
    echo "   sudo systemctl daemon-reload"
    echo "   sudo systemctl reload snmp-mib-frontend"
    echo "   sudo systemctl reload snmp-mib-backend"
    echo
    echo "🌐 访问地址:"
    echo "   Web界面: http://localhost:12300"
    echo "   API接口: http://localhost:17880/api/v1"
    echo
}

# 主函数
main() {
    echo
    echo "🚀 SNMP MIB Platform - systemd服务安装器"
    echo "========================================"
    echo
    
    check_permissions
    check_requirements
    setup_user_and_directories
    install_systemd_services
    setup_log_rotation
    start_services
    verify_services
    
    echo
    log_success "🎉 SNMP MIB Platform systemd服务安装完成！"
    echo
    show_management_commands
}

# 运行主函数
main "$@"