#!/bin/bash

echo "SNMP监控平台 - 本地部署 (无Docker版)"
echo "======================================="

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 错误处理
set -e
trap 'echo -e "${RED}部署失败！${NC}"' ERR

echo -e "${BLUE}检查系统要求...${NC}"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js未安装${NC}"
    exit 1
fi

# 检查Go
if ! command -v go &> /dev/null; then
    echo -e "${RED}Go未安装${NC}"
    exit 1
fi

echo -e "${GREEN}系统要求检查通过${NC}"

# 第一步：清理现有服务
echo -e "${BLUE}清理现有服务...${NC}"

# 停止现有进程
pkill -f "mib-platform" 2>/dev/null || true
pkill -f "next" 2>/dev/null || true
pkill -f "node.*server.js" 2>/dev/null || true

echo -e "${GREEN}现有服务已清理${NC}"

# 第二步：构建和启动后端 (使用内存数据库)
echo -e "${BLUE}构建和启动后端服务...${NC}"

cd backend

# 构建后端
go build -o mib-platform .

# 设置环境变量并启动后端 (使用SQLite内存数据库)
export ENVIRONMENT=development
export SERVER_PORT=17880
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=netmon_user
export DB_PASSWORD=netmon_secure_password
export DB_NAME=network_monitor
export JWT_SECRET=your-production-jwt-secret-key-here

# 清除可能冲突的PORT环境变量
unset PORT

nohup ./mib-platform > ../backend.log 2>&1 &
BACKEND_PID=$!

echo -e "${GREEN}后端服务已启动 (PID: $BACKEND_PID)${NC}"

cd ..

# 第三步：构建和启动前端
echo -e "${BLUE}构建和启动前端服务...${NC}"

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}安装前端依赖...${NC}"
    npm install
fi

# 构建前端
echo -e "${YELLOW}构建前端应用...${NC}"
export NEXT_PUBLIC_API_URL=http://localhost:17880/api/v1
npm run build

# 检查是否使用standalone模式
if [ -f ".next/standalone/server.js" ]; then
    echo -e "${YELLOW}使用standalone模式启动前端...${NC}"
    cd .next/standalone
    export PORT=12300
    nohup node server.js > ../../frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ../..
else
    echo -e "${YELLOW}使用标准模式启动前端...${NC}"
    nohup npm run start > frontend.log 2>&1 &
    FRONTEND_PID=$!
fi

echo -e "${GREEN}前端服务已启动 (PID: $FRONTEND_PID)${NC}"

# 第四步：等待服务启动并验证
echo -e "${BLUE}验证服务状态...${NC}"

sleep 10

# 检查服务状态
echo -e "${YELLOW}服务状态检查:${NC}"
echo "=================================="

# 检查进程
echo -e "\n${BLUE}应用进程:${NC}"
ps aux | grep -E "(mib-platform|server\.js|next)" | grep -v grep

# 检查端口
echo -e "\n${BLUE}端口监听:${NC}"
netstat -tlnp | grep -E "(17880|12300)" || true

# 第五步：健康检查
echo -e "\n${BLUE}健康检查...${NC}"

# 等待服务完全启动
sleep 5

# 检查后端健康
echo -n "后端API健康检查: "
for i in {1..10}; do
    if curl -f -s http://localhost:17880/api/v1/health > /dev/null 2>&1; then
        echo -e "${GREEN}正常${NC}"
        break
    elif [ $i -eq 10 ]; then
        echo -e "${RED}失败${NC}"
        echo "后端日志："
        tail -n 20 backend.log
    else
        echo -n "."
        sleep 2
    fi
done

# 检查前端健康
echo -n "前端服务健康检查: "
for i in {1..10}; do
    if curl -f -s http://localhost:12300 > /dev/null 2>&1; then
        echo -e "${GREEN}正常${NC}"
        break
    elif [ $i -eq 10 ]; then
        echo -e "${RED}失败${NC}"
        echo "前端日志："
        tail -n 20 frontend.log
    else
        echo -n "."
        sleep 2
    fi
done

# 输出访问信息
echo ""
echo "部署完成！"
echo "======================================="
echo -e "${GREEN}Web界面: http://localhost:12300${NC}"
echo -e "${GREEN}API接口: http://localhost:17880/api/v1${NC}"
echo -e "${GREEN}健康检查: http://localhost:17880/api/v1/health${NC}"
echo ""
echo -e "${BLUE}管理命令:${NC}"
echo "  查看日志: tail -f frontend.log backend.log"
echo "  停止服务: pkill -f 'mib-platform|server\.js|next'"
echo ""
echo -e "${YELLOW}注意: 此版本使用内存数据库，重启后数据会丢失${NC}"

# 保存PID用于后续管理
echo "$BACKEND_PID" > backend.pid
echo "$FRONTEND_PID" > frontend.pid

# 显示当前监听的端口
echo ""
echo -e "${BLUE}当前监听端口:${NC}"
netstat -tlnp | grep -E "(17880|12300)" || echo "端口检查失败"

exit 0