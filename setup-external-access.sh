#!/bin/bash

# 外网访问配置脚本
# 用于快速配置SNMP MIB Platform的外网访问

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

# 获取公网IP
get_public_ip() {
    local ip=""
    
    # 尝试多个服务获取公网IP
    for service in "curl -s ifconfig.me" "curl -s ipinfo.io/ip" "curl -s icanhazip.com" "curl -s ident.me"; do
        ip=$(eval $service 2>/dev/null | tr -d '\n')
        if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
            echo $ip
            return 0
        fi
    done
    
    return 1
}

# 主函数
main() {
    echo "======================================"
    echo -e "${BLUE}🌍 SNMP MIB Platform 外网访问配置${NC}"
    echo "======================================"
    echo ""
    
    # 检测公网IP
    log_info "正在检测公网IP..."
    PUBLIC_IP=$(get_public_ip)
    
    if [ -z "$PUBLIC_IP" ]; then
        log_warning "无法自动检测公网IP，请手动输入"
        read -p "请输入您的公网IP或域名: " PUBLIC_IP
    else
        log_success "检测到公网IP: $PUBLIC_IP"
        read -p "是否使用此IP? (y/n) [y]: " confirm
        if [[ $confirm =~ ^[Nn]$ ]]; then
            read -p "请输入您的公网IP或域名: " PUBLIC_IP
        fi
    fi
    
    if [ -z "$PUBLIC_IP" ]; then
        log_error "未提供公网IP，退出配置"
        exit 1
    fi
    
    # 创建.env文件
    log_info "创建环境配置文件..."
    
    cat > .env << EOF
# SNMP MIB Platform 环境配置
# 自动生成于 $(date)

# 数据库配置
DATABASE_URL=postgresql://netmon_user:netmon_pass_2024@postgres:5432/network_monitor
REDIS_URL=redis://:redis_pass_2024@redis:6379

# 应用配置
NODE_ENV=production
NEXTAUTH_SECRET=mibweb_secret_key_2024_very_secure

# 外网访问配置
NEXTAUTH_URL=http://${PUBLIC_IP}:12300
NEXT_PUBLIC_BACKEND_URL=http://${PUBLIC_IP}:17880
NEXT_PUBLIC_API_URL=http://${PUBLIC_IP}:17880/api/v1

# JWT配置
JWT_SECRET=jwt_secret_key_2024_very_secure

# CORS配置
CORS_ORIGINS=http://${PUBLIC_IP}:12300,http://localhost:12300,http://localhost:3000
EOF
    
    log_success "环境配置文件已创建"
    
    # 更新后端CORS配置
    log_info "更新后端CORS配置..."
    
    # 检查是否需要重启服务
    if docker compose ps | grep -q "Up"; then
        log_warning "检测到服务正在运行"
        read -p "是否立即重启服务以应用新配置? (y/n) [y]: " restart
        if [[ ! $restart =~ ^[Nn]$ ]]; then
            log_info "重启服务..."
            docker compose down
            docker compose up -d
            
            # 等待服务启动
            log_info "等待服务启动..."
            sleep 10
            
            # 检查服务状态
            if curl -s http://localhost:17880/health > /dev/null 2>&1; then
                log_success "服务重启成功"
            else
                log_warning "服务可能仍在启动中，请稍后检查"
            fi
        fi
    fi
    
    echo ""
    echo "======================================"
    echo -e "${GREEN}🎉 外网访问配置完成！${NC}"
    echo "======================================"
    echo ""
    echo "📱 外网访问地址："
    echo "  🌐 Web 界面:      http://${PUBLIC_IP}:12300"
    echo "  🔧 后端 API:      http://${PUBLIC_IP}:17880"
    echo ""
    echo "🔒 安全提醒："
    echo "  1. 确保防火墙已开放端口 12300 和 17880"
    echo "  2. 建议配置SSL证书以启用HTTPS"
    echo "  3. 定期更新密码和密钥"
    echo ""
    echo "🔧 如需修改配置："
    echo "  编辑 .env 文件，然后运行: docker compose restart"
    echo "======================================"
}

# 帮助信息
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --ip IP    指定公网IP或域名"
    echo "  --help     显示此帮助信息"
    echo ""
    echo "Examples:"
    echo "  $0                    # 自动检测公网IP"
    echo "  $0 --ip 1.2.3.4      # 使用指定IP"
    echo "  $0 --ip example.com   # 使用域名"
}

# 参数处理
case "$1" in
    --help)
        show_help
        exit 0
        ;;
    --ip)
        if [ -z "$2" ]; then
            log_error "请提供IP地址或域名"
            exit 1
        fi
        PUBLIC_IP="$2"
        main
        ;;
    "")
        main
        ;;
    *)
        log_error "未知参数: $1"
        show_help
        exit 1
        ;;
esac