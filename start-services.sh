#!/bin/bash

echo "SNMP监控平台 - 快速启动"
echo "======================"

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 第一步：清理现有服务
echo -e "${BLUE}清理现有服务...${NC}"

# 停止现有进程
pkill -f "mib-platform" 2>/dev/null || true
pkill -f "next" 2>/dev/null || true
pkill -f "node.*server.js" 2>/dev/null || true

echo -e "${GREEN}现有服务已清理${NC}"

# 第二步：启动后端
echo -e "${BLUE}启动后端服务...${NC}"

cd backend

# 检查二进制文件是否存在
if [ ! -f "mib-platform" ]; then
    echo -e "${RED}后端二进制文件不存在，请先运行构建${NC}"
    exit 1
fi

# 设置环境变量并启动后端
export ENVIRONMENT=development
export SERVER_PORT=17880
export JWT_SECRET=your-production-jwt-secret-key-here

# 清除可能冲突的PORT环境变量
unset PORT

nohup ./mib-platform > ../backend.log 2>&1 &
BACKEND_PID=$!

echo -e "${GREEN}后端服务已启动 (PID: $BACKEND_PID)${NC}"

cd ..

# 第三步：启动前端
echo -e "${BLUE}启动前端服务...${NC}"

# 检查是否已构建
if [ ! -d ".next" ]; then
    echo -e "${YELLOW}前端未构建，开始构建...${NC}"
    export NEXT_PUBLIC_API_URL=http://localhost:17880/api/v1
    npm run build
fi

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

# 第四步：等待服务启动
echo -e "${BLUE}等待服务启动...${NC}"
sleep 5

# 检查进程状态
echo -e "${YELLOW}服务状态检查:${NC}"
echo "=================================="

echo -e "${BLUE}应用进程:${NC}"
ps aux | grep -E "(mib-platform|server\.js|next)" | grep -v grep || echo "没有找到运行的进程"

echo -e "\n${BLUE}端口监听:${NC}"
netstat -tlnp | grep -E "(17880|12300)" || echo "没有找到监听端口"

# 第五步：健康检查
echo -e "\n${BLUE}健康检查...${NC}"

sleep 5

# 检查后端健康
echo -n "后端API健康检查: "
for i in {1..5}; do
    if curl -f -s http://localhost:17880/api/v1/health > /dev/null 2>&1; then
        echo -e "${GREEN}正常${NC}"
        BACKEND_OK=1
        break
    elif [ $i -eq 5 ]; then
        echo -e "${RED}失败${NC}"
        echo "后端日志 (最后10行)："
        tail -n 10 backend.log
        BACKEND_OK=0
    else
        echo -n "."
        sleep 2
    fi
done

# 检查前端健康
echo -n "前端服务健康检查: "
for i in {1..5}; do
    if curl -f -s http://localhost:12300 > /dev/null 2>&1; then
        echo -e "${GREEN}正常${NC}"
        FRONTEND_OK=1
        break
    elif [ $i -eq 5 ]; then
        echo -e "${RED}失败${NC}"
        echo "前端日志 (最后10行)："
        tail -n 10 frontend.log
        FRONTEND_OK=0
    else
        echo -n "."
        sleep 2
    fi
done

# 输出结果
echo ""
echo "启动完成！"
echo "======================================="

if [ "$BACKEND_OK" = "1" ] && [ "$FRONTEND_OK" = "1" ]; then
    echo -e "${GREEN}✓ 所有服务正常运行${NC}"
    echo -e "${GREEN}Web界面: http://localhost:12300${NC}"
    echo -e "${GREEN}API接口: http://localhost:17880/api/v1${NC}"
elif [ "$BACKEND_OK" = "1" ]; then
    echo -e "${YELLOW}⚠ 后端正常，前端启动失败${NC}"
    echo -e "${GREEN}API接口: http://localhost:17880/api/v1${NC}"
elif [ "$FRONTEND_OK" = "1" ]; then
    echo -e "${YELLOW}⚠ 前端正常，后端启动失败${NC}"
    echo -e "${GREEN}Web界面: http://localhost:12300${NC}"
else
    echo -e "${RED}✗ 所有服务启动失败${NC}"
fi

echo ""
echo -e "${BLUE}管理命令:${NC}"
echo "  查看日志: tail -f frontend.log backend.log"
echo "  停止服务: pkill -f 'mib-platform|server\.js|next'"

# 保存PID用于后续管理
echo "$BACKEND_PID" > backend.pid
echo "$FRONTEND_PID" > frontend.pid

exit 0