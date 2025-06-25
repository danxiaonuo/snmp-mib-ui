#!/bin/bash

# SNMP MIB Platform 安装脚本
# 安装为系统服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查权限
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 sudo 运行此脚本"
    exit 1
fi

INSTALL_DIR="/opt/snmp-mib-platform"
SERVICE_USER="snmp-mib"

log_info "🚀 安装 SNMP MIB Platform 到系统"

# 创建用户
if ! id "$SERVICE_USER" &>/dev/null; then
    log_info "创建服务用户: $SERVICE_USER"
    useradd -r -s /bin/false -d "$INSTALL_DIR" "$SERVICE_USER"
fi

# 创建安装目录
log_info "创建安装目录: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cp -r . "$INSTALL_DIR/"
chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
chmod +x "$INSTALL_DIR"/*.sh
chmod +x "$INSTALL_DIR"/frontend/*.sh
chmod +x "$INSTALL_DIR"/backend/*.sh

# 创建systemd服务文件
log_info "创建systemd服务..."

# 后端服务
cat > /etc/systemd/system/snmp-mib-backend.service << EOF
[Unit]
Description=SNMP MIB Platform Backend
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR/backend
ExecStart=$INSTALL_DIR/backend/start-backend.sh
Restart=always
RestartSec=10
Environment=GIN_MODE=release
Environment=BACKEND_PORT=8080

[Install]
WantedBy=multi-user.target
