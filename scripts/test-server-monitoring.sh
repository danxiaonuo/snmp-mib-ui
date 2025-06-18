#!/bin/bash

# 多品牌服务器监控配置测试脚本
# 用于验证不同品牌服务器的SNMP监控配置

echo "🖥️  多品牌服务器监控配置测试"
echo "=================================="

# 测试服务器列表（示例）
declare -A TEST_SERVERS=(
    ["dell_r740"]="192.168.1.10:public:Dell PowerEdge R740 iDRAC"
    ["hp_dl380"]="192.168.1.11:public:HP ProLiant DL380 Gen10 iLO"
    ["lenovo_sr650"]="192.168.1.12:public:Lenovo ThinkSystem SR650 XCC"
    ["supermicro_x11"]="192.168.1.13:public:Supermicro X11 IPMI"
    ["inspur_nf5280"]="192.168.1.14:public:Inspur NF5280M5 BMC"
)

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查SNMP工具
check_snmp_tools() {
    echo -e "${BLUE}检查SNMP工具...${NC}"
    
    if ! command -v snmpwalk &> /dev/null; then
        echo -e "${RED}错误: snmpwalk 未安装${NC}"
        echo "请安装 snmp-utils 包："
        echo "  Ubuntu/Debian: sudo apt-get install snmp-utils"
        echo "  CentOS/RHEL: sudo yum install net-snmp-utils"
        exit 1
    fi
    
    echo -e "${GREEN}✓ SNMP工具已安装${NC}"
}

# 测试SNMP连接
test_snmp_connection() {
    local server_name=$1
    local ip=$2
    local community=$3
    local description=$4
    
    echo -e "${BLUE}测试 $server_name ($ip)...${NC}"
    
    # 测试基本连接
    local sys_descr=$(snmpwalk -v2c -c "$community" -t 5 -r 1 "$ip" 1.3.6.1.2.1.1.1.0 2>/dev/null | cut -d'"' -f2)
    
    if [ -z "$sys_descr" ]; then
        echo -e "${RED}✗ 连接失败: $server_name${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✓ 连接成功: $server_name${NC}"
    echo -e "  系统描述: $sys_descr"
    
    # 检测服务器品牌
    detect_server_brand "$sys_descr" "$server_name"
    
    # 测试品牌特定OID
    test_brand_specific_oids "$server_name" "$ip" "$community" "$sys_descr"
    
    echo ""
}

# 检测服务器品牌
detect_server_brand() {
    local sys_descr=$1
    local server_name=$2
    
    echo -e "${YELLOW}品牌检测结果:${NC}"
    
    case "$sys_descr" in
        *"Dell"*|*"PowerEdge"*|*"iDRAC"*)
            echo -e "  🔍 检测到: Dell PowerEdge 服务器"
            echo -e "  📋 推荐模板: server-dell-idrac"
            ;;
        *"HP"*|*"HPE"*|*"ProLiant"*|*"iLO"*)
            echo -e "  🔍 检测到: HP/HPE ProLiant 服务器"
            echo -e "  📋 推荐模板: server-hp-ilo"
            ;;
        *"Lenovo"*|*"ThinkSystem"*|*"XCC"*|*"IMM"*)
            echo -e "  🔍 检测到: Lenovo ThinkSystem 服务器"
            echo -e "  📋 推荐模板: server-lenovo-xcc"
            ;;
        *"Supermicro"*|*"Super Micro"*|*"IPMI"*)
            echo -e "  🔍 检测到: Supermicro 服务器"
            echo -e "  📋 推荐模板: server-supermicro-ipmi"
            ;;
        *"Inspur"*|*"浪潮"*|*"NF"*)
            echo -e "  🔍 检测到: 浪潮/Inspur 服务器"
            echo -e "  📋 推荐模板: server-inspur-bmc"
            ;;
        *)
            echo -e "  🔍 检测到: 通用服务器"
            echo -e "  📋 推荐模板: server-universal-snmp"
            ;;
    esac
}

# 测试品牌特定OID
test_brand_specific_oids() {
    local server_name=$1
    local ip=$2
    local community=$3
    local sys_descr=$4
    
    echo -e "${YELLOW}测试品牌特定OID:${NC}"
    
    # 根据品牌测试不同的OID
    case "$sys_descr" in
        *"Dell"*|*"PowerEdge"*|*"iDRAC"*)
            test_dell_oids "$ip" "$community"
            ;;
        *"HP"*|*"HPE"*|*"ProLiant"*|*"iLO"*)
            test_hp_oids "$ip" "$community"
            ;;
        *"Lenovo"*|*"ThinkSystem"*|*"XCC"*|*"IMM"*)
            test_lenovo_oids "$ip" "$community"
            ;;
        *"Supermicro"*|*"Super Micro"*|*"IPMI"*)
            test_supermicro_oids "$ip" "$community"
            ;;
        *"Inspur"*|*"浪潮"*|*"NF"*)
            test_inspur_oids "$ip" "$community"
            ;;
        *)
            test_generic_oids "$ip" "$community"
            ;;
    esac
}

# Dell特定OID测试
test_dell_oids() {
    local ip=$1
    local community=$2
    
    echo -e "  🔧 测试Dell iDRAC OID..."
    
    # 全局状态
    local global_status=$(snmpget -v2c -c "$community" -t 3 -r 1 "$ip" 1.3.6.1.4.1.674.10892.5.2.1.0 2>/dev/null)
    if [ ! -z "$global_status" ]; then
        echo -e "  ${GREEN}✓ Dell全局状态OID可用${NC}"
    else
        echo -e "  ${RED}✗ Dell全局状态OID不可用${NC}"
    fi
    
    # 温度传感器
    local temp_sensor=$(snmpwalk -v2c -c "$community" -t 3 -r 1 "$ip" 1.3.6.1.4.1.674.10892.5.4.700.20.1.6 2>/dev/null | head -1)
    if [ ! -z "$temp_sensor" ]; then
        echo -e "  ${GREEN}✓ Dell温度传感器OID可用${NC}"
    else
        echo -e "  ${RED}✗ Dell温度传感器OID不可用${NC}"
    fi
}

# HP特定OID测试
test_hp_oids() {
    local ip=$1
    local community=$2
    
    echo -e "  🔧 测试HP iLO OID..."
    
    # CPU状态
    local cpu_status=$(snmpwalk -v2c -c "$community" -t 3 -r 1 "$ip" 1.3.6.1.4.1.232.1.2.2.1.1.6 2>/dev/null | head -1)
    if [ ! -z "$cpu_status" ]; then
        echo -e "  ${GREEN}✓ HP CPU状态OID可用${NC}"
    else
        echo -e "  ${RED}✗ HP CPU状态OID不可用${NC}"
    fi
    
    # 温度传感器
    local temp_sensor=$(snmpwalk -v2c -c "$community" -t 3 -r 1 "$ip" 1.3.6.1.4.1.232.6.2.6.8.1.6 2>/dev/null | head -1)
    if [ ! -z "$temp_sensor" ]; then
        echo -e "  ${GREEN}✓ HP温度传感器OID可用${NC}"
    else
        echo -e "  ${RED}✗ HP温度传感器OID不可用${NC}"
    fi
}

# Lenovo特定OID测试
test_lenovo_oids() {
    local ip=$1
    local community=$2
    
    echo -e "  🔧 测试Lenovo XCC OID..."
    
    # 系统健康状态
    local system_health=$(snmpget -v2c -c "$community" -t 3 -r 1 "$ip" 1.3.6.1.4.1.19046.11.1.1.1.2.1.1.1 2>/dev/null)
    if [ ! -z "$system_health" ]; then
        echo -e "  ${GREEN}✓ Lenovo系统健康OID可用${NC}"
    else
        echo -e "  ${RED}✗ Lenovo系统健康OID不可用${NC}"
    fi
    
    # 温度传感器
    local temp_sensor=$(snmpwalk -v2c -c "$community" -t 3 -r 1 "$ip" 1.3.6.1.4.1.19046.11.1.1.2.1.1.3 2>/dev/null | head -1)
    if [ ! -z "$temp_sensor" ]; then
        echo -e "  ${GREEN}✓ Lenovo温度传感器OID可用${NC}"
    else
        echo -e "  ${RED}✗ Lenovo温度传感器OID不可用${NC}"
    fi
}

# Supermicro特定OID测试
test_supermicro_oids() {
    local ip=$1
    local community=$2
    
    echo -e "  🔧 测试Supermicro IPMI OID..."
    
    # IPMI传感器
    local ipmi_sensor=$(snmpwalk -v2c -c "$community" -t 3 -r 1 "$ip" 1.3.6.1.4.1.10876.2.1.1.1.1.4 2>/dev/null | head -1)
    if [ ! -z "$ipmi_sensor" ]; then
        echo -e "  ${GREEN}✓ Supermicro IPMI传感器OID可用${NC}"
    else
        echo -e "  ${RED}✗ Supermicro IPMI传感器OID不可用${NC}"
    fi
}

# 浪潮特定OID测试
test_inspur_oids() {
    local ip=$1
    local community=$2
    
    echo -e "  🔧 测试浪潮BMC OID..."
    
    # 系统状态
    local system_status=$(snmpget -v2c -c "$community" -t 3 -r 1 "$ip" 1.3.6.1.4.1.2011.2.235.1.1.2.1.1 2>/dev/null)
    if [ ! -z "$system_status" ]; then
        echo -e "  ${GREEN}✓ 浪潮系统状态OID可用${NC}"
    else
        echo -e "  ${RED}✗ 浪潮系统状态OID不可用${NC}"
    fi
}

# 通用OID测试
test_generic_oids() {
    local ip=$1
    local community=$2
    
    echo -e "  🔧 测试通用HOST-RESOURCES-MIB OID..."
    
    # CPU负载
    local cpu_load=$(snmpwalk -v2c -c "$community" -t 3 -r 1 "$ip" 1.3.6.1.2.1.25.3.3.1.2 2>/dev/null | head -1)
    if [ ! -z "$cpu_load" ]; then
        echo -e "  ${GREEN}✓ 通用CPU负载OID可用${NC}"
    else
        echo -e "  ${RED}✗ 通用CPU负载OID不可用${NC}"
    fi
    
    # 内存信息
    local memory_info=$(snmpget -v2c -c "$community" -t 3 -r 1 "$ip" 1.3.6.1.2.1.25.2.2.0 2>/dev/null)
    if [ ! -z "$memory_info" ]; then
        echo -e "  ${GREEN}✓ 通用内存信息OID可用${NC}"
    else
        echo -e "  ${RED}✗ 通用内存信息OID不可用${NC}"
    fi
}

# 生成测试报告
generate_report() {
    echo -e "${BLUE}生成测试报告...${NC}"
    
    local report_file="server_monitoring_test_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
多品牌服务器监控配置测试报告
================================
测试时间: $(date)
测试脚本: $0

测试服务器列表:
EOF
    
    for server in "${!TEST_SERVERS[@]}"; do
        IFS=':' read -r ip community description <<< "${TEST_SERVERS[$server]}"
        echo "- $server: $ip ($description)" >> "$report_file"
    done
    
    echo "" >> "$report_file"
    echo "详细测试结果请查看控制台输出。" >> "$report_file"
    
    echo -e "${GREEN}✓ 测试报告已生成: $report_file${NC}"
}

# 主函数
main() {
    echo -e "${BLUE}开始多品牌服务器监控配置测试...${NC}"
    echo ""
    
    # 检查SNMP工具
    check_snmp_tools
    echo ""
    
    # 测试每个服务器
    for server in "${!TEST_SERVERS[@]}"; do
        IFS=':' read -r ip community description <<< "${TEST_SERVERS[$server]}"
        test_snmp_connection "$server" "$ip" "$community" "$description"
    done
    
    # 生成报告
    generate_report
    
    echo -e "${GREEN}测试完成！${NC}"
    echo ""
    echo "💡 使用建议："
    echo "1. 对于连接失败的服务器，请检查网络连通性和SNMP配置"
    echo "2. 对于OID不可用的情况，可能需要启用相应的管理接口功能"
    echo "3. 建议使用检测到的推荐模板进行监控配置"
    echo "4. 如果专用模板不工作，可以尝试通用模板作为备选方案"
}

# 运行主函数
main "$@"