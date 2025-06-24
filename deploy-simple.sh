#!/bin/bash

# SNMP MIB Platform - 简化部署脚本
# 纯SQLite + 内存缓存方案，无需Docker和外部数据库

set -e

echo "🚀 开始部署 SNMP MIB Platform (SQLite版本)"

# 创建必要的目录
mkdir -p data logs

# 检查Node.js版本
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到Node.js，请先安装Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js版本过低，需要18+，当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js版本检查通过: $(node -v)"

# 检查Go版本 (后端)
if ! command -v go &> /dev/null; then
    echo "❌ 未检测到Go，请先安装Go 1.21+"
    exit 1
fi

GO_VERSION=$(go version | awk '{print $3}' | cut -d'o' -f2 | cut -d'.' -f2)
if [ "$GO_VERSION" -lt 21 ]; then
    echo "❌ Go版本过低，需要1.21+，当前版本: $(go version)"
    exit 1
fi

echo "✅ Go版本检查通过: $(go version)"

# 安装前端依赖
echo "📦 安装前端依赖..."
npm install

# 构建前端
echo "🔨 构建前端..."
npm run build

# 构建后端
echo "🔨 构建后端..."
cd backend
go mod tidy
go build -o mib-platform .
cd ..

# 创建运行脚本
cat > start.sh << 'EOF'
#!/bin/bash

# 启动脚本
echo "🚀 启动 SNMP MIB Platform"

# 设置环境变量
export NODE_ENV=production
export SQLITE_DB_PATH=./data/snmp_platform.db
export SERVER_PORT=17880
export FRONTEND_PORT=12300

# 启动后端
echo "🔧 启动后端服务 (端口: $SERVER_PORT)..."
cd backend
nohup ./mib-platform > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid
cd ..

# 等待后端启动
sleep 3

# 启动前端
echo "🌐 启动前端服务 (端口: $FRONTEND_PORT)..."
nohup npm start > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > frontend.pid

echo "✅ 部署完成！"
echo ""
echo "📊 服务信息:"
echo "   前端地址: http://localhost:$FRONTEND_PORT"
echo "   后端地址: http://localhost:$SERVER_PORT"
echo "   数据库:   SQLite (./data/snmp_platform.db)"
echo "   日志目录: ./logs/"
echo ""
echo "🔧 管理命令:"
echo "   停止服务: ./stop.sh"
echo "   查看日志: tail -f logs/frontend.log 或 tail -f logs/backend.log"
echo "   重启服务: ./stop.sh && ./start.sh"

EOF

# 创建停止脚本
cat > stop.sh << 'EOF'
#!/bin/bash

echo "🛑 停止 SNMP MIB Platform"

# 停止前端
if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
    fi
    rm -f frontend.pid
fi

# 停止后端
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
    fi
    rm -f backend.pid
fi

echo "✅ 服务已停止"

EOF

# 创建状态检查脚本
cat > status.sh << 'EOF'
#!/bin/bash

echo "📊 SNMP MIB Platform 状态检查"
echo ""

# 检查前端
if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "✅ 前端服务运行中 (PID: $FRONTEND_PID)"
        echo "   访问地址: http://localhost:12300"
    else
        echo "❌ 前端服务未运行"
    fi
else
    echo "❌ 前端服务未启动"
fi

# 检查后端
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "✅ 后端服务运行中 (PID: $BACKEND_PID)"
        echo "   API地址: http://localhost:17880"
    else
        echo "❌ 后端服务未运行"
    fi
else
    echo "❌ 后端服务未启动"
fi

# 检查数据库
if [ -f data/snmp_platform.db ]; then
    DB_SIZE=$(du -h data/snmp_platform.db | cut -f1)
    echo "✅ SQLite数据库 (大小: $DB_SIZE)"
else
    echo "⚠️  SQLite数据库文件不存在，将在首次运行时创建"
fi

echo ""
echo "📂 文件结构:"
echo "   - 数据库: ./data/snmp_platform.db"
echo "   - 日志: ./logs/"
echo "   - 前端构建: ./.next/"
echo "   - 后端二进制: ./backend/mib-platform"

EOF

# 设置脚本权限
chmod +x start.sh stop.sh status.sh

echo ""
echo "✅ 部署完成！"
echo ""
echo "🎯 快速开始:"
echo "   1. 启动服务: ./start.sh"
echo "   2. 查看状态: ./status.sh"
echo "   3. 停止服务: ./stop.sh"
echo ""
echo "📊 访问地址:"
echo "   前端: http://localhost:12300"
echo "   后端API: http://localhost:17880"
echo ""
echo "💡 特性:"
echo "   ✅ 无需Docker"
echo "   ✅ 无需PostgreSQL/Redis"
echo "   ✅ 纯SQLite数据库"
echo "   ✅ 内存缓存"
echo "   ✅ 单机部署"
echo "   ✅ 零配置运行"