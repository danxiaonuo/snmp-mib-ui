#!/bin/bash

echo "SNMP监控平台 - 生产环境一键部署"
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

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker未安装${NC}"
    exit 1
fi

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

# 第一步：准备SQLite数据库
echo -e "${BLUE}准备SQLite数据库...${NC}"

# 创建数据目录
mkdir -p data

echo -e "${GREEN}SQLite数据库准备完成${NC}"

# 第二步：构建和启动后端
echo -e "${BLUE}构建和启动后端服务...${NC}"

cd backend

# 构建后端
go build -o mib-platform .

# 停止现有后端进程
pkill -f "mib-platform" 2>/dev/null || true

# 启动后端
export ENVIRONMENT=production
export SERVER_PORT=17880
export JWT_SECRET=your-production-jwt-secret-key-here
export UPLOAD_PATH=./uploads

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

# 停止现有前端进程
pkill -f "next" 2>/dev/null || true

# 启动前端
nohup npm run start > frontend.log 2>&1 &
FRONTEND_PID=$!

echo -e "${GREEN}前端服务已启动 (PID: $FRONTEND_PID)${NC}"

# 第四步：等待服务启动并验证
echo -e "${BLUE}验证服务状态...${NC}"

sleep 5

# 检查服务状态
echo -e "${YELLOW}服务状态检查:${NC}"
echo "=================================="

# 检查SQLite数据库文件
echo -e "${BLUE}SQLite数据库:${NC}"
if [ -f "backend/snmp_platform.db" ]; then
    echo "SQLite数据库文件存在: backend/snmp_platform.db"
    ls -lh backend/snmp_platform.db
else
    echo "SQLite数据库文件将在首次启动时创建"
fi

# 检查进程
echo -e "\n${BLUE}应用进程:${NC}"
ps aux | grep -E "(mib-platform|next)" | grep -v grep

# 检查端口
echo -e "\n${BLUE}端口监听:${NC}"
netstat -tlnp | grep -E "(17880|12300)" || true

# 第五步：健康检查
echo -e "\n${BLUE}健康检查...${NC}"

# 检查后端健康
echo -n "后端API健康检查: "
if curl -f -s http://localhost:17880/api/v1/health > /dev/null 2>&1; then
    echo -e "${GREEN}正常${NC}"
else
    echo -e "${YELLOW}启动中...${NC}"
fi

# 检查前端健康
echo -n "前端服务健康检查: "
if curl -f -s http://localhost:12300 > /dev/null 2>&1; then
    echo -e "${GREEN}正常${NC}"
else
    echo -e "${YELLOW}启动中...${NC}"
fi

# 输出访问信息
echo ""
echo "部署完成！"
echo "======================================="
echo -e "${GREEN}Web界面: http://localhost:12300${NC}"
echo -e "${GREEN}API接口: http://localhost:17880/api/v1${NC}"
echo -e "${GREEN}健康检查: http://localhost:12300/api/health${NC}"
echo ""
echo -e "${BLUE}管理命令:${NC}"
echo "  查看日志: tail -f frontend.log backend.log"
echo "  停止服务: pkill -f 'mib-platform|next'"
echo "  查看数据库: ls -la backend/snmp_platform.db"
echo ""
echo -e "${YELLOW}提示: 服务可能需要1-2分钟完全启动${NC}"

# 保存PID用于后续管理
echo "$BACKEND_PID" > backend.pid
echo "$FRONTEND_PID" > frontend.pid

exit 0