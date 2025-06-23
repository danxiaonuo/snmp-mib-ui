#!/bin/bash

echo "SNMP监控平台 - 生产环境一键部署 (systemd版)"
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

# 检查是否以root权限运行
if [[ $EUID -ne 0 ]]; then
    echo -e "${RED}此脚本必须以root权限运行${NC}"
    echo -e "${YELLOW}请使用: sudo $0${NC}"
    exit 1
fi

echo -e "${BLUE}检查系统要求...${NC}"

# 检查systemd
if ! command -v systemctl &> /dev/null; then
    echo -e "${RED}系统不支持systemd${NC}"
    exit 1
fi

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

# 第一步：构建应用
echo -e "${BLUE}构建应用...${NC}"

# 构建后端
echo -e "${YELLOW}构建后端服务...${NC}"
cd backend
go build -o mib-platform .
cd ..

# 构建前端
echo -e "${YELLOW}构建前端应用...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}安装前端依赖...${NC}"
    npm install
fi
export NEXT_PUBLIC_API_URL=http://localhost:17880/api/v1
npm run build

echo -e "${GREEN}应用构建完成${NC}"

# 第二步：安装systemd服务
echo -e "${BLUE}安装systemd服务...${NC}"

# 创建用户和目录
echo -e "${YELLOW}创建snmp-mib用户和目录...${NC}"
if ! id "snmp-mib" &>/dev/null; then
    useradd -r -d /opt/snmp-mib-ui -s /bin/bash snmp-mib
    echo -e "${GREEN}已创建snmp-mib用户${NC}"
else
    echo -e "${YELLOW}snmp-mib用户已存在${NC}"
fi

# 创建目录结构
mkdir -p /opt/snmp-mib-ui
mkdir -p /opt/snmp-mib-ui/logs
mkdir -p /opt/snmp-mib-ui/backend/logs
mkdir -p /opt/snmp-mib-ui/backend/uploads
mkdir -p /var/log/snmp-mib-platform

# 复制应用文件到目标目录
echo -e "${YELLOW}复制应用文件到 /opt/snmp-mib-ui${NC}"
cp -r . /opt/snmp-mib-ui/

# 设置权限
chown -R snmp-mib:snmp-mib /opt/snmp-mib-ui
chown -R snmp-mib:snmp-mib /var/log/snmp-mib-platform
chmod +x /opt/snmp-mib-ui/backend/mib-platform

# 安装systemd服务文件
echo -e "${YELLOW}安装systemd服务文件...${NC}"
cp systemd/snmp-mib-frontend.service /etc/systemd/system/
cp systemd/snmp-mib-backend.service /etc/systemd/system/
cp systemd/snmp-mib-platform.target /etc/systemd/system/

# 重新加载systemd配置
systemctl daemon-reload

# 配置日志轮转
echo -e "${YELLOW}配置日志轮转...${NC}"
cat > /etc/logrotate.d/snmp-mib-platform << 'EOF'
/var/log/snmp-mib-platform/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 snmp-mib snmp-mib
    postrotate
        systemctl reload snmp-mib-frontend snmp-mib-backend || true
    endscript
}

/opt/snmp-mib-ui/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 snmp-mib snmp-mib
}
EOF

echo -e "${GREEN}systemd服务安装完成${NC}"

# 第三步：启动数据库和缓存
echo -e "${BLUE}启动数据库和缓存服务...${NC}"

# 停止现有容器
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

echo -e "${GREEN}数据库和缓存服务已启动${NC}"

# 等待数据库启动
echo -e "${YELLOW}等待数据库启动...${NC}"
sleep 10

# 第四步：启用和启动服务
echo -e "${BLUE}启用和启动服务...${NC}"

# 启用服务
systemctl enable snmp-mib-platform.target
systemctl enable snmp-mib-frontend.service
systemctl enable snmp-mib-backend.service

# 启动服务
systemctl start snmp-mib-platform.target

echo -e "${GREEN}服务启动完成${NC}"

# 第五步：验证服务状态
echo -e "${BLUE}验证服务状态...${NC}"

sleep 10

# 检查服务状态
echo -e "${YELLOW}服务状态检查:${NC}"
echo "=================================="

# 检查Docker容器
echo -e "${BLUE}数据库容器:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(snmp-postgres|snmp-redis)"

# 检查systemd服务
echo -e "\n${BLUE}应用服务:${NC}"
systemctl status snmp-mib-backend.service --no-pager -n 5
systemctl status snmp-mib-frontend.service --no-pager -n 5

# 检查端口
echo -e "\n${BLUE}端口监听:${NC}"
netstat -tlnp | grep -E "(5432|6379|17880|12300)" || true

# 第六步：健康检查
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
echo -e "${BLUE}systemd服务管理命令:${NC}"
echo "  启动所有服务: sudo systemctl start snmp-mib-platform.target"
echo "  停止所有服务: sudo systemctl stop snmp-mib-platform.target"
echo "  重启所有服务: sudo systemctl restart snmp-mib-platform.target"
echo "  查看服务状态: sudo systemctl status snmp-mib-platform.target"
echo "  查看后端日志: sudo journalctl -u snmp-mib-backend -f"
echo "  查看前端日志: sudo journalctl -u snmp-mib-frontend -f"
echo ""
echo -e "${YELLOW}提示: 服务可能需要1-2分钟完全启动${NC}"

exit 0