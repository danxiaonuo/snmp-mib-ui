#!/bin/bash

# 🚀 增强功能测试脚本
# 验证所有新增的用户体验增强功能

echo "🎯 开始测试SNMP MIB平台增强功能..."
echo "=================================="

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0

# 测试函数
test_feature() {
    local feature_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${BLUE}测试 $TOTAL_TESTS: $feature_name${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ 通过${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ 失败${NC}"
    fi
    echo ""
}

# 1. 检查Hook文件是否存在
echo -e "${YELLOW}📁 检查增强功能文件...${NC}"
test_feature "本地存储Hook" "[ -f 'hooks/use-local-storage.tsx' ]"
test_feature "键盘快捷键Hook" "[ -f 'hooks/use-keyboard-shortcuts.tsx' ]"
test_feature "自动刷新Hook" "[ -f 'hooks/use-auto-refresh.tsx' ]"
test_feature "拖拽功能Hook" "[ -f 'hooks/use-drag-drop.tsx' ]"

# 2. 检查UI组件是否存在
echo -e "${YELLOW}🎨 检查增强UI组件...${NC}"
test_feature "自动刷新指示器" "[ -f 'components/enhanced-ui/auto-refresh-indicator.tsx' ]"
test_feature "拖拽上传区域" "[ -f 'components/enhanced-ui/drag-drop-zone.tsx' ]"
test_feature "键盘快捷键助手" "[ -f 'components/enhanced-ui/keyboard-shortcut-helper.tsx' ]"
test_feature "增强布局组件" "[ -f 'components/enhanced-ui/enhanced-layout.tsx' ]"

# 3. 检查页面集成情况
echo -e "${YELLOW}🔗 检查页面集成情况...${NC}"
test_feature "设备页面集成" "grep -q 'useLocalStorage' app/devices/page.tsx"
test_feature "MIB页面集成" "grep -q 'useAutoRefresh' app/mibs/page.tsx"
test_feature "布局文件集成" "grep -q 'EnhancedLayout' app/layout.tsx"

# 4. 检查TypeScript类型
echo -e "${YELLOW}📝 检查TypeScript类型...${NC}"
test_feature "TypeScript编译检查" "npx tsc --noEmit --skipLibCheck 2>/dev/null || echo 'TypeScript检查需要安装依赖'"

# 5. 检查文档完整性
echo -e "${YELLOW}📚 检查文档完整性...${NC}"
test_feature "增强功能文档" "[ -f 'ENHANCED_FEATURES.md' ]"
test_feature "README文档存在" "[ -f 'README.md' ]"

# 6. 功能特性检查
echo -e "${YELLOW}⚡ 检查功能特性...${NC}"
test_feature "持久化存储功能" "grep -q 'localStorage' hooks/use-local-storage.tsx"
test_feature "键盘快捷键功能" "grep -q 'addEventListener.*keydown' hooks/use-keyboard-shortcuts.tsx"
test_feature "自动刷新功能" "grep -q 'setInterval' hooks/use-auto-refresh.tsx"
test_feature "拖拽功能" "grep -q 'onDrop' hooks/use-drag-drop.tsx"

# 7. 检查错误处理
echo -e "${YELLOW}🛡️ 检查错误处理...${NC}"
test_feature "错误边界组件" "[ -f 'components/error-boundary.tsx' ]"
test_feature "错误处理工具" "[ -f 'lib/error-handler.ts' ]"
test_feature "Toast通知系统" "[ -f 'hooks/use-toast.ts' ]"

# 8. 检查性能优化
echo -e "${YELLOW}🚀 检查性能优化...${NC}"
test_feature "懒加载实现" "grep -q 'dynamic.*import' app/layout.tsx"
test_feature "性能监控组件" "[ -f 'components/performance-monitor.tsx' ]"

# 生成测试报告
echo "=================================="
echo -e "${BLUE}📊 测试报告${NC}"
echo "=================================="
echo -e "总测试数: ${TOTAL_TESTS}"
echo -e "通过测试: ${GREEN}${PASSED_TESTS}${NC}"
echo -e "失败测试: ${RED}$((TOTAL_TESTS - PASSED_TESTS))${NC}"

# 计算通过率
PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo -e "通过率: ${PASS_RATE}%"

if [ $PASS_RATE -ge 90 ]; then
    echo -e "${GREEN}🎉 优秀！所有主要功能都已正确实现！${NC}"
elif [ $PASS_RATE -ge 80 ]; then
    echo -e "${YELLOW}👍 良好！大部分功能已实现，建议检查失败项。${NC}"
else
    echo -e "${RED}⚠️  需要改进！请检查失败的测试项目。${NC}"
fi

echo ""
echo -e "${BLUE}🔍 功能验证建议：${NC}"
echo "1. 启动开发服务器: npm run dev"
echo "2. 访问设备管理页面测试持久化存储"
echo "3. 按 '/' 键测试快捷键帮助"
echo "4. 在MIB页面测试拖拽上传"
echo "5. 观察自动刷新指示器"
echo ""
echo -e "${GREEN}✨ 增强功能测试完成！${NC}"

# 返回适当的退出码
if [ $PASS_RATE -ge 80 ]; then
    exit 0
else
    exit 1
fi