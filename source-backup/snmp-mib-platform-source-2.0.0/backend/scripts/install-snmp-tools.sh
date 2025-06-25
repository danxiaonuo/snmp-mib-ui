#!/bin/bash

# SNMP 工具安装脚本
# 用于安装 snmp-tools 和相关依赖

set -e

echo "开始安装 SNMP 工具..."

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
elif type lsb_release >/dev/null 2>&1; then
    OS=$(lsb_release -si)
    VER=$(lsb_release -sr)
elif [ -f /etc/lsb-release ]; then
    . /etc/lsb-release
    OS=$DISTRIB_ID
    VER=$DISTRIB_RELEASE
elif [ -f /etc/debian_version ]; then
    OS=Debian
    VER=$(cat /etc/debian_version)
elif [ -f /etc/SuSe-release ]; then
    OS=openSUSE
elif [ -f /etc/redhat-release ]; then
    OS=RedHat
else
    OS=$(uname -s)
    VER=$(uname -r)
fi

echo "检测到操作系统: $OS $VER"

# 根据操作系统安装 SNMP 工具
case "$OS" in
    "Ubuntu"*|"Debian"*)
        echo "在 Ubuntu/Debian 系统上安装 SNMP 工具..."
        apt-get update
        apt-get install -y snmp snmp-mibs-downloader
        
        # 下载标准 MIB 文件
        download-mibs
        
        # 配置 SNMP
        echo "mibs +ALL" >> /etc/snmp/snmp.conf
        ;;
        
    "CentOS"*|"Red Hat"*|"Rocky"*|"AlmaLinux"*)
        echo "在 RHEL/CentOS 系统上安装 SNMP 工具..."
        yum install -y net-snmp net-snmp-utils
        
        # 或者使用 dnf (较新的系统)
        if command -v dnf &> /dev/null; then
            dnf install -y net-snmp net-snmp-utils
        fi
        ;;
        
    "Alpine"*)
        echo "在 Alpine Linux 上安装 SNMP 工具..."
        apk update
        apk add net-snmp-tools
        ;;
        
    *)
        echo "不支持的操作系统: $OS"
        echo "请手动安装 SNMP 工具:"
        echo "- Ubuntu/Debian: apt-get install snmp snmp-mibs-downloader"
        echo "- RHEL/CentOS: yum install net-snmp net-snmp-utils"
        echo "- Alpine: apk add net-snmp-tools"
        exit 1
        ;;
esac

# 验证安装
echo "验证 SNMP 工具安装..."

if command -v snmptranslate &> /dev/null; then
    echo "✓ snmptranslate 已安装"
    snmptranslate -V
else
    echo "✗ snmptranslate 未找到"
    exit 1
fi

if command -v snmpwalk &> /dev/null; then
    echo "✓ snmpwalk 已安装"
else
    echo "✗ snmpwalk 未找到"
    exit 1
fi

if command -v snmpget &> /dev/null; then
    echo "✓ snmpget 已安装"
else
    echo "✗ snmpget 未找到"
    exit 1
fi

# 创建 MIB 目录
echo "创建 MIB 目录..."
mkdir -p /opt/monitoring/mibs
mkdir -p /opt/monitoring/mibs/uploads
mkdir -p /opt/monitoring/config/snmp_exporter
mkdir -p /opt/monitoring/config/categraf/input.snmp

# 设置权限
chmod 755 /opt/monitoring/mibs
chmod 755 /opt/monitoring/mibs/uploads
chmod 755 /opt/monitoring/config/snmp_exporter
chmod 755 /opt/monitoring/config/categraf/input.snmp

echo "SNMP 工具安装完成！"
echo ""
echo "可用命令:"
echo "- snmptranslate: 翻译 OID 和 MIB 对象"
echo "- snmpwalk: 遍历 SNMP 树"
echo "- snmpget: 获取单个 SNMP 值"
echo "- snmpset: 设置 SNMP 值"
echo ""
echo "MIB 目录:"
echo "- /opt/monitoring/mibs: MIB 文件存储目录"
echo "- /opt/monitoring/mibs/uploads: 上传的 MIB 文件"
echo ""
echo "配置目录:"
echo "- /opt/monitoring/config/snmp_exporter: SNMP Exporter 配置"
echo "- /opt/monitoring/config/categraf/input.snmp: Categraf SNMP 配置"