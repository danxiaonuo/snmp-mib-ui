#!/bin/bash

# SNMP监控平台统一部署脚本
# 支持传统方式和systemd方式部署

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
    echo "SNMP监控平台部署脚本"
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --help          显示此帮助信息"
    echo "  --systemd       使用systemd方式部署（需要root权限）"
    echo "  --traditional   使用传统方式部署（默认）"
    echo ""
    echo "示例:"
    echo "  $0                  # 使用传统方式部署"
    echo "  sudo $0 --systemd   # 使用systemd方式部署"
}

# 解析命令行参数
DEPLOY_MODE="traditional"

while [[ $# -gt 0 ]]; do
    case $1 in
        --help)
            show_help
            exit 0
            ;;
        --systemd)
            DEPLOY_MODE="systemd"
            # 检查root权限
            if [[ $EUID -ne 0 ]]; then
                echo -e "${RED}使用systemd方式部署需要root权限${NC}"
                echo -e "${YELLOW}请使用: sudo $0 --systemd${NC}"
                exit 1
            fi
            ;;
        --traditional)
            DEPLOY_MODE="traditional"
            ;;
        *)
            echo -e "${RED}未知选项: $1${NC}"
            show_help
            exit 1
            ;;
    esac
    shift
done

# 根据部署模式执行相应的脚本
if [[ "$DEPLOY_MODE" == "systemd" ]]; then
    echo -e "${BLUE}使用systemd方式部署SNMP监控平台...${NC}"
    # 检查systemd服务文件是否存在
    if [[ ! -f "systemd/snmp-mib-backend.service" ]] || [[ ! -f "systemd/snmp-mib-frontend.service" ]]; then
        echo -e "${RED}未找到systemd服务文件${NC}"
        exit 1
    fi
    
    # 执行systemd部署
    bash ./deploy-systemd.sh
else
    echo -e "${BLUE}使用传统方式部署SNMP监控平台...${NC}"
    bash ./deploy-production.sh
fi

exit 0