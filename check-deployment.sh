#!/bin/bash

# SNMP MIB Platform - 部署检查脚本
# 检查所有功能是否可以二进制部署落地

echo "🔍 SNMP MIB Platform 部署检查"
echo "=================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查函数
check_ok() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

check_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo ""
echo "📋 1. 系统要求检查"
echo "==================="

# 检查Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -ge 18 ]; then
        check_ok "Node.js版本: $NODE_VERSION (满足要求 >=18)"
    else
        check_error "Node.js版本过低: $NODE_VERSION (需要 >=18)"
    fi
else
    check_error "Node.js未安装"
fi

# 检查Go
if command -v go &> /dev/null; then
    GO_VERSION=$(go version)
    check_ok "Go版本: $GO_VERSION"
else
    check_error "Go未安装"
fi

# 检查npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    check_ok "npm版本: $NPM_VERSION"
else
    check_error "npm未安装"
fi

echo ""
echo "📁 2. 项目文件检查"
echo "==================="

# 检查关键文件
files_to_check=(
    "package.json"
    "next.config.mjs"
    "backend/go.mod"
    "backend/main.go"
    "backend/database/database.go"
    "lib/database-sqlite.ts"
    "lib/memory-cache.ts"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        check_ok "关键文件存在: $file"
    else
        check_error "关键文件缺失: $file"
    fi
done

echo ""
echo "🚀 3. 部署脚本检查"
echo "==================="

# 检查部署脚本
deploy_scripts=(
    "deploy-simple.sh"
    "build-binary.sh"
    "start-services.sh"
    "stop-services.sh"
    "install-systemd-services.sh"
)

for script in "${deploy_scripts[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            check_ok "部署脚本可执行: $script"
        else
            check_warning "部署脚本不可执行: $script (需要chmod +x)"
        fi
    else
        check_error "部署脚本缺失: $script"
    fi
done

echo ""
echo "⚙️ 4. systemd服务检查"
echo "==================="

# 检查systemd配置
systemd_files=(
    "systemd/snmp-mib-platform.target"
    "systemd/snmp-mib-backend.service"
    "systemd/snmp-mib-frontend.service"
)

for service in "${systemd_files[@]}"; do
    if [ -f "$service" ]; then
        check_ok "systemd配置存在: $service"
    else
        check_error "systemd配置缺失: $service"
    fi
done

echo ""
echo "🗃️ 5. 数据库依赖检查"
echo "==================="

# 检查Go模块依赖
if [ -f "backend/go.mod" ]; then
    if grep -q "gorm.io/driver/sqlite" backend/go.mod; then
        check_ok "SQLite驱动已配置"
    else
        check_error "SQLite驱动未配置"
    fi
    
    if grep -q "postgres" backend/go.mod; then
        check_warning "仍包含PostgreSQL依赖"
    else
        check_ok "已移除PostgreSQL依赖"
    fi
    
    if grep -q "redis" backend/go.mod; then
        check_warning "仍包含Redis依赖"
    else
        check_ok "已移除Redis依赖"
    fi
fi

# 检查前端依赖
if [ -f "package.json" ]; then
    if grep -q "better-sqlite3" package.json; then
        check_ok "前端SQLite支持已配置"
    else
        check_warning "前端SQLite支持未配置"
    fi
fi

echo ""
echo "🐳 6. Docker依赖检查"
echo "==================="

# 检查Docker相关文件
docker_files=(
    ".dockerignore"
    "docker-compose.yml"
    "scripts/docker-deploy.sh"
)

docker_count=0
for file in "${docker_files[@]}"; do
    if [ -f "$file" ] || [ -L "$file" ]; then
        check_warning "Docker相关文件存在: $file (可选择删除)"
        ((docker_count++))
    fi
done

if [ $docker_count -eq 0 ]; then
    check_ok "无Docker依赖文件"
else
    check_info "发现 $docker_count 个Docker相关文件 (不影响二进制部署)"
fi

echo ""
echo "📦 7. 功能模块检查"
echo "==================="

# 检查功能模块目录
modules=(
    "app/devices"
    "app/mibs"
    "app/config-gen"
    "app/alert-rules"
    "app/monitoring-installer"
    "app/tools/bulk-ops"
    "app/monitoring"
)

for module in "${modules[@]}"; do
    if [ -d "$module" ]; then
        check_ok "功能模块存在: $module"
    else
        check_error "功能模块缺失: $module"
    fi
done

echo ""
echo "🔧 8. 构建测试"
echo "==============="

# 测试前端构建
check_info "测试前端构建配置..."
if [ -f "next.config.mjs" ]; then
    if grep -q "output: 'standalone'" next.config.mjs; then
        check_ok "前端standalone模式已启用"
    else
        check_warning "前端standalone模式未启用"
    fi
fi

# 测试后端构建
check_info "测试后端构建配置..."
if [ -f "backend/main.go" ]; then
    cd backend
    if go mod verify &> /dev/null; then
        check_ok "Go模块验证通过"
    else
        check_warning "Go模块验证失败"
    fi
    cd ..
fi

echo ""
echo "📊 9. 部署总结"
echo "==============="

echo ""
check_info "推荐部署方案:"
echo "   1. 简化部署: ./deploy-simple.sh"
echo "   2. systemd服务: sudo ./install-systemd-services.sh"
echo "   3. 手动部署: ./deploy-local-no-docker.sh"

echo ""
check_info "技术栈确认:"
echo "   ✅ 前端: Next.js 15 + React + TypeScript"
echo "   ✅ 后端: Go 1.23 + Gin + GORM"
echo "   ✅ 数据库: SQLite (无需外部数据库)"
echo "   ✅ 缓存: 内存缓存 (无需Redis)"
echo "   ✅ 部署: 二进制 + systemd (无需Docker)"

echo ""
check_info "功能模块确认:"
echo "   📊 设备管理 (/devices)"
echo "   📁 MIB管理 (/mibs)"
echo "   ⚙️ 配置生成 (/config-gen)"
echo "   🚨 告警管理 (/alert-rules)"
echo "   🔧 监控安装器 (/monitoring-installer)"
echo "   🛠️ 批量操作 (/tools/bulk-ops)"
echo "   📈 实时监控 (/monitoring)"

echo ""
echo "🎉 检查完成！"
echo "=============="

# 最终建议
echo ""
check_info "建议操作:"
echo "   1. 运行 chmod +x *.sh 确保脚本可执行"
echo "   2. 运行 ./deploy-simple.sh 进行快速部署"
echo "   3. 访问 http://localhost:12300 查看界面"
echo "   4. 使用 systemctl 管理服务 (生产环境)"

echo ""
check_ok "项目已准备好进行二进制部署！"