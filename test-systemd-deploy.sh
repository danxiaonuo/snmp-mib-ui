#!/bin/bash

# 简单的systemd部署测试脚本
# 用于验证前后端对接是否成功

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查是否以root权限运行
if [[ $EUID -ne 0 ]]; then
    echo -e "${RED}此脚本必须以root权限运行${NC}"
    echo -e "请使用: sudo $0"
    exit 1
fi

echo "开始测试systemd部署..."

# 1. 安装systemd服务
echo -e "${BLUE}安装systemd服务...${NC}"
cp systemd/snmp-mib-frontend.service /etc/systemd/system/
cp systemd/snmp-mib-backend.service /etc/systemd/system/
cp systemd/snmp-mib-platform.target /etc/systemd/system/

# 重新加载systemd配置
systemctl daemon-reload

# 2. 启动Docker容器
echo -e "${BLUE}启动数据库和缓存容器...${NC}"
docker stop snmp-postgres snmp-redis 2>/dev/null || true
docker rm snmp-postgres snmp-redis 2>/dev/null || true

# 启动PostgreSQL
docker run -d \
  --name snmp-postgres \
  -e POSTGRES_DB=network_monitor \
  -e POSTGRES_USER=netmon_user \
  -e POSTGRES_PASSWORD=production_db_pass \
  -p 5432:5432 \
  --restart=unless-stopped \
  postgres:15-alpine

# 启动Redis
docker run -d \
  --name snmp-redis \
  -p 6379:6379 \
  --restart=unless-stopped \
  redis:7-alpine redis-server --requirepass redis_secure_password

echo -e "${GREEN}数据库和缓存容器已启动${NC}"

# 等待数据库启动
echo -e "${YELLOW}等待数据库启动...${NC}"
sleep 10

# 3. 启动服务
echo -e "${BLUE}启动服务...${NC}"
systemctl start snmp-mib-platform.target

# 4. 等待服务启动
echo -e "${YELLOW}等待服务启动...${NC}"
sleep 15

# 5. 检查服务状态
echo -e "${BLUE}检查服务状态...${NC}"
systemctl status snmp-mib-backend.service --no-pager
systemctl status snmp-mib-frontend.service --no-pager

# 6. 验证前后端对接
echo -e "${BLUE}验证前后端对接...${NC}"

# 检查后端API
echo -n "后端API健康检查: "
if curl -f -s http://localhost:17880/api/v1/health > /dev/null; then
    echo -e "${GREEN}正常${NC}"
    curl -s http://localhost:17880/api/v1/health
else
    echo -e "${RED}异常${NC}"
    echo "无法访问后端API"
fi

# 检查前端
echo -n "前端服务检查: "
if curl -f -s http://localhost:12300 > /dev/null; then
    echo -e "${GREEN}正常${NC}"
    echo "前端可以访问"
else
    echo -e "${RED}异常${NC}"
    echo "无法访问前端服务"
fi

# 检查前端是否能调用后端API
echo -n "前端调用后端API检查: "
if curl -f -s http://localhost:12300/api/health > /dev/null; then
    echo -e "${GREEN}正常${NC}"
    echo "前端可以成功调用后端API"
else
    echo -e "${RED}异常${NC}"
    echo "前端无法调用后端API"
fi

# 7. 提示用户在浏览器中验证
echo -e "${BLUE}请在浏览器中访问以下地址验证Web界面是否正常显示:${NC}"
echo -e "${GREEN}http://localhost:12300${NC}"
echo "如果在远程服务器上部署，请将localhost替换为服务器IP地址"

# 8. 显示日志查看命令
echo -e "${BLUE}查看日志命令:${NC}"
echo "  查看后端日志: journalctl -u snmp-mib-backend -f"
echo "  查看前端日志: journalctl -u snmp-mib-frontend -f"

exit 0