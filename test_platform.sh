#!/bin/bash

# SNMP MIB Platform 测试脚本
# 测试后端 API 和核心功能

set -e

echo "🚀 开始测试 SNMP MIB Platform..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
test_api() {
    local name="$1"
    local url="$2"
    local method="${3:-GET}"
    local data="$4"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${BLUE}测试 $TOTAL_TESTS: $name${NC}"
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$url" || echo "000")
    else
        response=$(curl -s -w "%{http_code}" "$url" || echo "000")
    fi
    
    http_code="${response: -3}"
    body="${response%???}"
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ 通过 (HTTP $http_code)${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗ 失败 (HTTP $http_code)${NC}"
        if [ -n "$body" ]; then
            echo "响应: $body"
        fi
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# 检查后端是否运行
check_backend() {
    echo -e "${YELLOW}检查后端服务状态...${NC}"
    
    # 检查进程
    if pgrep -f "mib-platform" > /dev/null; then
        echo -e "${GREEN}✓ 后端服务正在运行${NC}"
        return 0
    else
        echo -e "${RED}✗ 后端服务未运行，正在启动...${NC}"
        return 1
    fi
}

# 启动后端服务
start_backend() {
    echo -e "${YELLOW}启动后端服务...${NC}"
    
    cd /workspace/snmp-mib-ui/backend
    
    # 创建必要的目录
    mkdir -p uploads/mibs
    mkdir -p /opt/monitoring/mibs
    mkdir -p /opt/monitoring/config/snmp_exporter
    mkdir -p /opt/monitoring/config/categraf/input.snmp
    
    # 启动服务
    nohup ./mib-platform > server.log 2>&1 &
    
    # 等待服务启动
    echo "等待服务启动..."
    sleep 5
    
    # 检查服务是否启动成功
    if pgrep -f "mib-platform" > /dev/null; then
        echo -e "${GREEN}✓ 后端服务启动成功${NC}"
        return 0
    else
        echo -e "${RED}✗ 后端服务启动失败${NC}"
        echo "日志内容:"
        tail -20 server.log
        return 1
    fi
}

# 测试基础 API
test_basic_apis() {
    echo -e "\n${YELLOW}=== 测试基础 API ===${NC}"
    
    local base_url="http://localhost:8080"
    
    # 健康检查
    test_api "健康检查" "$base_url/health"
    
    # MIB API
    test_api "获取 MIB 列表" "$base_url/api/v1/mibs"
    test_api "扫描 MIB 目录" "$base_url/api/v1/mibs/scan"
    
    # 设备 API
    test_api "获取设备列表" "$base_url/api/v1/devices"
    
    # 配置 API
    test_api "获取配置列表" "$base_url/api/v1/configs"
    
    # SNMP API
    test_api "获取 SNMP 配置" "$base_url/api/v1/snmp"
}

# 测试 MIB 功能
test_mib_functionality() {
    echo -e "\n${YELLOW}=== 测试 MIB 功能 ===${NC}"
    
    local base_url="http://localhost:8080"
    
    # 创建测试 MIB 文件
    cat > /tmp/test.mib << 'EOF'
TEST-MIB DEFINITIONS ::= BEGIN

IMPORTS
    MODULE-IDENTITY, OBJECT-TYPE, Integer32
        FROM SNMPv2-SMI;

testMIB MODULE-IDENTITY
    LAST-UPDATED "202406140000Z"
    ORGANIZATION "Test Organization"
    CONTACT-INFO "test@example.com"
    DESCRIPTION "Test MIB for platform testing"
    ::= { 1 3 6 1 4 1 99999 }

testObject OBJECT-TYPE
    SYNTAX      Integer32
    MAX-ACCESS  read-only
    STATUS      current
    DESCRIPTION "Test object"
    ::= { testMIB 1 }

END
EOF
    
    # 测试 MIB 文件上传
    echo -e "${BLUE}测试 MIB 文件上传${NC}"
    upload_response=$(curl -s -w "%{http_code}" \
        -X POST \
        -F "file=@/tmp/test.mib" \
        -F "description=Test MIB file" \
        "$base_url/api/v1/mibs/upload" || echo "000")
    
    upload_code="${upload_response: -3}"
    if [ "$upload_code" -ge 200 ] && [ "$upload_code" -lt 300 ]; then
        echo -e "${GREEN}✓ MIB 文件上传成功${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ MIB 文件上传失败 (HTTP $upload_code)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# 测试配置生成
test_config_generation() {
    echo -e "\n${YELLOW}=== 测试配置生成 ===${NC}"
    
    local base_url="http://localhost:8080"
    
    # 测试 SNMP 配置生成
    local snmp_data='{
        "config_name": "test-snmp-config",
        "config_type": "snmp_exporter",
        "device_info": {
            "ip": "192.168.1.1",
            "community": "public",
            "version": "2c"
        },
        "selected_oids": ["1.3.6.1.2.1.1.1.0", "1.3.6.1.2.1.1.3.0"]
    }'
    
    test_api "生成 SNMP 配置" "$base_url/api/v1/configs/generate" "POST" "$snmp_data"
    
    # 测试 Categraf 配置生成
    local categraf_data='{
        "config_name": "test-categraf-config",
        "config_type": "categraf",
        "device_info": {
            "ip": "192.168.1.2",
            "community": "public",
            "version": "2c"
        },
        "selected_oids": ["1.3.6.1.2.1.1.1.0", "1.3.6.1.2.1.1.3.0"]
    }'
    
    test_api "生成 Categraf 配置" "$base_url/api/v1/configs/generate" "POST" "$categraf_data"
}

# 测试 SNMP 工具
test_snmp_tools() {
    echo -e "\n${YELLOW}=== 测试 SNMP 工具 ===${NC}"
    
    # 检查 snmptranslate 是否可用
    if command -v snmptranslate >/dev/null 2>&1; then
        echo -e "${GREEN}✓ snmptranslate 工具可用${NC}"
        
        # 测试基本 OID 转换
        result=$(snmptranslate -On 1.3.6.1.2.1.1.1.0 2>/dev/null || echo "failed")
        if [ "$result" != "failed" ]; then
            echo -e "${GREEN}✓ SNMP 工具功能正常${NC}"
        else
            echo -e "${YELLOW}⚠ SNMP 工具可用但功能受限${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ snmptranslate 工具未安装，将使用备用解析器${NC}"
    fi
}

# 清理函数
cleanup() {
    echo -e "\n${YELLOW}清理测试环境...${NC}"
    
    # 停止后端服务
    pkill -f "mib-platform" 2>/dev/null || true
    
    # 清理测试文件
    rm -f /tmp/test.mib
    
    echo -e "${GREEN}✓ 清理完成${NC}"
}

# 显示测试结果
show_results() {
    echo -e "\n${YELLOW}=== 测试结果汇总 ===${NC}"
    echo -e "总测试数: $TOTAL_TESTS"
    echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
    echo -e "${RED}失败: $FAILED_TESTS${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 所有测试通过！平台功能正常${NC}"
        return 0
    else
        echo -e "\n${RED}❌ 有 $FAILED_TESTS 个测试失败${NC}"
        return 1
    fi
}

# 主测试流程
main() {
    echo -e "${BLUE}SNMP MIB Platform 功能测试${NC}"
    echo -e "${BLUE}================================${NC}"
    
    # 设置清理陷阱
    trap cleanup EXIT
    
    # 检查并启动后端
    if ! check_backend; then
        if ! start_backend; then
            echo -e "${RED}❌ 无法启动后端服务，测试终止${NC}"
            exit 1
        fi
    fi
    
    # 运行测试
    test_snmp_tools
    test_basic_apis
    test_mib_functionality
    test_config_generation
    
    # 显示结果
    show_results
}

# 运行主函数
main "$@"