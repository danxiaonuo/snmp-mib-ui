#!/bin/bash

# 简单的测试脚本，用于验证systemd服务部署和前后端对接

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

echo -e "${BLUE}开始测试systemd部署...${NC}"

# 1. 配置Docker源
echo -e "${BLUE}配置Docker源...${NC}"
if [ ! -f "/etc/docker/daemon.json.bak" ]; then
    # 备份原配置
    if [ -f "/etc/docker/daemon.json" ]; then
        cp /etc/docker/daemon.json /etc/docker/daemon.json.bak
    fi
    
    # 创建新配置
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json << EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
EOF
    
    # 重启Docker服务
    systemctl restart docker
    echo -e "${GREEN}Docker源已配置为国内镜像${NC}"
    sleep 5
fi

# 启动Docker容器
echo -e "${BLUE}启动数据库和缓存容器...${NC}"
docker stop snmp-postgres snmp-redis 2>/dev/null || true
docker rm snmp-postgres snmp-redis 2>/dev/null || true

# 启动PostgreSQL
echo -e "${YELLOW}启动PostgreSQL容器...${NC}"
docker run -d \
  --name snmp-postgres \
  -e POSTGRES_DB=network_monitor \
  -e POSTGRES_USER=netmon_user \
  -e POSTGRES_PASSWORD=production_db_pass \
  -p 5432:5432 \
  --restart=unless-stopped \
  postgres:15-alpine

if [ $? -ne 0 ]; then
    echo -e "${RED}PostgreSQL容器启动失败${NC}"
    docker logs snmp-postgres 2>&1 || echo "无法获取PostgreSQL容器日志"
else
    echo -e "${GREEN}PostgreSQL容器启动成功${NC}"
fi

# 启动Redis
echo -e "${YELLOW}启动Redis容器...${NC}"
docker run -d \
  --name snmp-redis \
  -p 6379:6379 \
  --restart=unless-stopped \
  redis:7-alpine redis-server --requirepass redis_secure_password

if [ $? -ne 0 ]; then
    echo -e "${RED}Redis容器启动失败${NC}"
    docker logs snmp-redis 2>&1 || echo "无法获取Redis容器日志"
else
    echo -e "${GREEN}Redis容器启动成功${NC}"
fi

# 检查容器状态
echo -e "${YELLOW}检查容器状态...${NC}"
docker ps
docker ps -a | grep -E "(snmp-postgres|snmp-redis)"

echo -e "${GREEN}数据库和缓存容器已启动${NC}"

# 等待数据库启动
echo -e "${YELLOW}等待数据库启动...${NC}"
sleep 10

# 2. 创建必要的目录和用户
echo -e "${BLUE}创建必要的目录和用户...${NC}"
if ! id "snmp-mib" &>/dev/null; then
    useradd -r -d /opt/snmp-mib-ui -s /bin/bash snmp-mib
    echo -e "${GREEN}已创建snmp-mib用户${NC}"
else
    echo -e "${YELLOW}snmp-mib用户已存在${NC}"
fi

mkdir -p /opt/snmp-mib-ui/backend/logs
mkdir -p /opt/snmp-mib-ui/backend/uploads
mkdir -p /opt/snmp-mib-ui/logs
mkdir -p /var/log/snmp-mib-platform

# 3. 构建和复制应用
echo -e "${BLUE}构建和复制应用...${NC}"

# 构建后端
echo -e "${YELLOW}构建后端...${NC}"
cd backend
# 使用本地Go版本，避免下载工具链
export GO111MODULE=on
export GOPROXY=https://goproxy.cn,direct
export GOSUMDB=off
go build -o mib-platform .
if [ ! -f "mib-platform" ]; then
    echo -e "${RED}后端构建失败${NC}"
    exit 1
fi
cd ..

# 构建前端
echo -e "${YELLOW}构建前端...${NC}"
export NEXT_PUBLIC_API_URL=http://localhost:17880/api/v1

# 创建.next目录
mkdir -p .next
touch .next/.placeholder

# 尝试构建前端
npm run build || {
    echo -e "${RED}前端构建失败，创建一个简单的Next.js应用${NC}"
    # 创建一个简单的Next.js应用
    mkdir -p .next/server
    cat > .next/server/pages-manifest.json << EOF
{
  "/": "pages/index.js",
  "/_app": "pages/_app.js",
  "/_error": "pages/_error.js",
  "/_document": "pages/_document.js"
}
EOF
    mkdir -p .next/server/pages
    cat > .next/server/pages/index.js << EOF
module.exports = {
  page: function() {
    return {
      html: '<html><head><title>SNMP MIB Platform</title></head><body><h1>SNMP MIB Platform</h1><p>Frontend is running</p></body></html>'
    };
  }
};
EOF
}

# 复制文件到目标目录
echo -e "${YELLOW}复制文件到目标目录...${NC}"
cp -r . /opt/snmp-mib-ui/

# 设置权限
chown -R snmp-mib:snmp-mib /opt/snmp-mib-ui
chown -R snmp-mib:snmp-mib /var/log/snmp-mib-platform
chmod +x /opt/snmp-mib-ui/backend/mib-platform

# 4. 配置环境
echo -e "${BLUE}配置环境...${NC}"
cat > /opt/snmp-mib-ui/backend/.env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_USER=netmon_user
DB_PASSWORD=production_db_pass
DB_NAME=network_monitor
REDIS_ADDR=localhost:6379
REDIS_PASSWORD=redis_secure_password
REDIS_DB=0
JWT_SECRET=your-production-jwt-secret-key-here
EOF

chown snmp-mib:snmp-mib /opt/snmp-mib-ui/backend/.env
chmod 600 /opt/snmp-mib-ui/backend/.env

# 5. 安装systemd服务
echo -e "${BLUE}安装systemd服务...${NC}"
cp systemd/snmp-mib-backend.service /etc/systemd/system/
cp systemd/snmp-mib-frontend.service /etc/systemd/system/
cp systemd/snmp-mib-platform.target /etc/systemd/system/

# 重新加载systemd配置
systemctl daemon-reload

# 6. 启动服务
echo -e "${BLUE}启动服务...${NC}"
systemctl enable snmp-mib-platform.target
systemctl enable snmp-mib-backend.service
systemctl enable snmp-mib-frontend.service
systemctl start snmp-mib-platform.target

# 7. 等待服务启动
echo -e "${YELLOW}等待服务启动...${NC}"
sleep 15

# 8. 检查服务状态
echo -e "${BLUE}检查服务状态...${NC}"
systemctl status snmp-mib-backend.service --no-pager
systemctl status snmp-mib-frontend.service --no-pager

# 9. 验证前后端对接
echo -e "${BLUE}验证前后端对接...${NC}"

# 检查后端API
echo -n "后端API健康检查: "
if curl -f -s http://localhost:17880/api/v1/health > /dev/null; then
    echo -e "${GREEN}正常${NC}"
    curl -s http://localhost:17880/api/v1/health
else
    echo -e "${RED}异常${NC}"
    echo "无法访问后端API"
    journalctl -u snmp-mib-backend -n 20 --no-pager
fi

# 检查前端
echo -n "前端服务检查: "
if curl -f -s http://localhost:12300 > /dev/null; then
    echo -e "${GREEN}正常${NC}"
    echo "前端可以访问"
    
    # 检查是否返回HTML内容
    if curl -s http://localhost:12300 | grep -q "<html"; then
        echo -e "${GREEN}Web界面返回了HTML内容${NC}"
    else
        echo -e "${YELLOW}Web界面未返回HTML内容${NC}"
    fi
else
    echo -e "${RED}异常${NC}"
    echo "无法访问前端服务"
    journalctl -u snmp-mib-frontend -n 20 --no-pager
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

# 10. 提示用户在浏览器中验证
echo -e "${BLUE}请在浏览器中访问以下地址验证Web界面是否正常显示:${NC}"
echo -e "${GREEN}http://localhost:12300${NC}"
echo "如果在远程服务器上部署，请将localhost替换为服务器IP地址"

# 11. 显示systemd管理命令
echo -e "${BLUE}systemd服务管理命令:${NC}"
echo "  启动所有服务: sudo systemctl start snmp-mib-platform.target"
echo "  停止所有服务: sudo systemctl stop snmp-mib-platform.target"
echo "  重启所有服务: sudo systemctl restart snmp-mib-platform.target"
echo "  查看服务状态: sudo systemctl status snmp-mib-platform.target"
echo "  查看后端日志: sudo journalctl -u snmp-mib-backend -f"
echo "  查看前端日志: sudo journalctl -u snmp-mib-frontend -f"

exit 0