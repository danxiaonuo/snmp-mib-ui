#!/bin/bash

# SNMP MIB Platform - systemd部署脚本
# 此脚本用于使用systemd方式部署前后端服务

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 错误处理
set -e
trap 'echo -e "${RED}部署失败！${NC}"' ERR

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否以root权限运行
if [[ $EUID -ne 0 ]]; then
    log_error "此脚本必须以root权限运行"
    log_info "请使用: sudo $0"
    exit 1
fi

# 检查系统要求
log_info "检查系统要求..."

# 检查systemd
if ! command -v systemctl &> /dev/null; then
    log_error "系统不支持systemd"
    exit 1
fi

# 检查Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker未安装，请先安装Docker"
    log_info "可以使用以下命令安装Docker："
    log_info "  curl -fsSL https://get.docker.com | sh  # 通用安装脚本"
    log_info "  sudo apt install docker.io  # Debian/Ubuntu"
    log_info "  sudo yum install docker  # CentOS/RHEL"
    exit 1
fi

# 检查Docker服务状态
if ! systemctl is-active --quiet docker; then
    log_warning "Docker服务未运行，尝试启动..."
    systemctl start docker
    if ! systemctl is-active --quiet docker; then
        log_error "无法启动Docker服务，请手动检查"
        exit 1
    fi
fi

log_success "Docker检查通过"

# 检查Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js未安装，请先安装Node.js"
    exit 1
fi

# 检查Go
if ! command -v go &> /dev/null; then
    log_error "Go未安装，请先安装Go"
    exit 1
fi

log_success "系统要求检查通过"

# 第一步：构建应用
log_info "构建应用..."

# 构建后端
log_info "构建后端服务..."
cd backend
# 使用本地Go版本，设置代理避免网络问题
export GO111MODULE=on
export GOPROXY=direct,https://goproxy.cn,https://proxy.golang.org
go build -o mib-platform .
if [ ! -f "mib-platform" ]; then
    log_error "后端构建失败"
    exit 1
fi
cd ..

# 构建前端
log_info "构建前端应用..."
if [ ! -d "node_modules" ]; then
    log_info "安装前端依赖..."
    npm install
fi
export NEXT_PUBLIC_API_URL=http://localhost:17880/api/v1
npm run build

log_success "应用构建完成"

# 第二步：安装systemd服务
log_info "安装systemd服务..."

# 创建用户和目录
log_info "创建snmp-mib用户和目录..."
if ! id "snmp-mib" &>/dev/null; then
    useradd -r -d /opt/snmp-mib-ui -s /bin/bash snmp-mib
    log_success "已创建snmp-mib用户"
else
    log_warning "snmp-mib用户已存在"
fi

# 创建目录结构
mkdir -p /opt/snmp-mib-ui
mkdir -p /opt/snmp-mib-ui/logs
mkdir -p /opt/snmp-mib-ui/backend/logs
mkdir -p /opt/snmp-mib-ui/backend/uploads
mkdir -p /var/log/snmp-mib-platform

# 复制应用文件到目标目录
log_info "复制应用文件到 /opt/snmp-mib-ui"
cp -r . /opt/snmp-mib-ui/

# 设置权限
chown -R snmp-mib:snmp-mib /opt/snmp-mib-ui
chown -R snmp-mib:snmp-mib /var/log/snmp-mib-platform
chmod +x /opt/snmp-mib-ui/backend/mib-platform

# 安装systemd服务文件
log_info "安装systemd服务文件..."
cp systemd/snmp-mib-frontend.service /etc/systemd/system/
cp systemd/snmp-mib-backend.service /etc/systemd/system/
cp systemd/snmp-mib-platform.target /etc/systemd/system/

# 重新加载systemd配置
systemctl daemon-reload

# 配置日志轮转
log_info "配置日志轮转..."
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

log_success "systemd服务安装完成"

# 第三步：启动数据库和缓存容器
log_info "启动数据库和缓存容器..."

# 停止现有容器
docker stop snmp-postgres snmp-redis 2>/dev/null || true
docker rm snmp-postgres snmp-redis 2>/dev/null || true

# 启动PostgreSQL
log_info "启动PostgreSQL容器..."
docker run -d \
  --name snmp-postgres \
  -e POSTGRES_DB=network_monitor \
  -e POSTGRES_USER=netmon_user \
  -e POSTGRES_PASSWORD=production_db_pass \
  -p 5432:5432 \
  --restart=unless-stopped \
  postgres:15-alpine

# 启动Redis
log_info "启动Redis容器..."
docker run -d \
  --name snmp-redis \
  -p 6379:6379 \
  --restart=unless-stopped \
  redis:7-alpine redis-server --requirepass redis_secure_password

log_success "数据库和缓存容器已启动"

# 等待数据库启动
log_info "等待数据库启动..."
sleep 10

# 配置数据库和缓存连接
log_info "配置数据库和缓存连接..."

# 创建环境配置文件
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

# 设置权限
chown snmp-mib:snmp-mib /opt/snmp-mib-ui/backend/.env
chmod 600 /opt/snmp-mib-ui/backend/.env

log_success "数据库和缓存连接配置完成"

# 第四步：启用和启动服务
log_info "启用和启动服务..."

# 启用服务
systemctl enable snmp-mib-platform.target
systemctl enable snmp-mib-frontend.service
systemctl enable snmp-mib-backend.service

# 启动服务
systemctl start snmp-mib-platform.target

log_success "服务启动完成"

# 第五步：验证服务状态
log_info "验证服务状态..."

sleep 10

# 检查服务状态
log_info "服务状态检查:"
echo "=================================="

# 检查Docker容器状态
log_info "Docker容器状态:"
if docker ps --format "{{.Names}}" | grep -q "snmp-postgres"; then
    log_success "PostgreSQL容器运行正常"
else
    log_error "PostgreSQL容器未运行，请检查"
fi

if docker ps --format "{{.Names}}" | grep -q "snmp-redis"; then
    log_success "Redis容器运行正常"
else
    log_error "Redis容器未运行，请检查"
fi

# 检查数据库和缓存连接状态
log_info "数据库和缓存连接状态:"
if nc -z localhost 5432 2>/dev/null; then
    log_success "PostgreSQL连接正常 (端口5432)"
else
    log_warning "PostgreSQL连接异常，请检查容器状态"
fi

if nc -z localhost 6379 2>/dev/null; then
    log_success "Redis连接正常 (端口6379)"
else
    log_warning "Redis连接异常，请检查容器状态"
fi

# 显示容器详细信息
log_info "容器详细信息:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(snmp-postgres|snmp-redis)"

# 检查systemd服务
log_info "应用服务:"
systemctl status snmp-mib-backend.service --no-pager -n 5
systemctl status snmp-mib-frontend.service --no-pager -n 5

# 检查端口
log_info "端口监听:"
netstat -tlnp | grep -E "(5432|6379|17880|12300)" || true

# 第六步：健康检查
log_info "健康检查..."

# 检查后端健康
echo -n "后端API健康检查: "
if curl -f -s http://localhost:17880/api/v1/health > /dev/null 2>&1; then
    echo -e "${GREEN}正常${NC}"
    
    # 保存API响应以供检查
    log_info "获取后端API详细信息..."
    API_RESPONSE=$(curl -s http://localhost:17880/api/v1/health)
    echo "$API_RESPONSE" > /opt/snmp-mib-ui/backend_health_check.json
    log_success "后端API响应已保存到 /opt/snmp-mib-ui/backend_health_check.json"
    
    # 检查API响应是否包含正确的状态
    if echo "$API_RESPONSE" | grep -q "\"status\":\"ok\""; then
        log_success "后端API状态正常"
    else
        log_warning "后端API返回了异常状态"
        echo "$API_RESPONSE"
    fi
else
    echo -e "${YELLOW}启动中...${NC}"
    log_warning "无法连接到后端API，请检查服务状态"
fi

# 检查前端健康
echo -n "前端服务健康检查: "
if curl -f -s http://localhost:12300 > /dev/null 2>&1; then
    echo -e "${GREEN}正常${NC}"
    
    # 检查是否返回HTML内容
    if curl -s http://localhost:12300 | grep -q "<html"; then
        log_success "Web界面可以正常访问，返回了HTML内容"
    else
        log_warning "Web界面返回了非HTML内容，可能存在问题"
    fi
else
    echo -e "${YELLOW}启动中...${NC}"
    log_warning "无法访问Web界面，请稍后再试"
fi

# 等待一段时间，确保服务完全启动
log_info "等待服务完全启动..."
sleep 10

# 再次检查前端
echo -n "再次检查前端服务: "
if curl -f -s http://localhost:12300 > /dev/null 2>&1; then
    echo -e "${GREEN}正常${NC}"
    
    # 检查是否返回HTML内容
    FRONTEND_RESPONSE=$(curl -s http://localhost:12300)
    if echo "$FRONTEND_RESPONSE" | grep -q "<html"; then
        log_success "Web界面可以正常访问，返回了HTML内容"
        
        # 保存HTML响应以供检查
        echo "$FRONTEND_RESPONSE" > /opt/snmp-mib-ui/frontend_response.html
        log_success "前端HTML响应已保存到 /opt/snmp-mib-ui/frontend_response.html"
        
        # 检查是否包含关键UI元素
        if echo "$FRONTEND_RESPONSE" | grep -q "SNMP MIB"; then
            log_success "Web界面包含预期的UI元素"
        else
            log_warning "Web界面可能未正确加载，未找到预期的UI元素"
        fi
        
        # 验证前后端对接
        log_info "验证前后端对接..."
        
        # 尝试通过前端访问后端API
        FRONTEND_API_TEST=$(curl -s http://localhost:12300/api/health)
        if [ $? -eq 0 ]; then
            log_success "通过前端访问API成功"
            echo "$FRONTEND_API_TEST" > /opt/snmp-mib-ui/frontend_api_test.json
        else
            log_warning "通过前端访问API失败，前后端可能未正确对接"
        fi
        
        # 保存一个截图，如果系统支持的话
        if command -v wkhtmltoimage &> /dev/null; then
            log_info "正在保存Web界面截图..."
            wkhtmltoimage http://localhost:12300 /opt/snmp-mib-ui/web_screenshot.png
            log_success "截图已保存到 /opt/snmp-mib-ui/web_screenshot.png"
        fi
        
        # 使用curl模拟浏览器请求，检查是否能获取完整页面
        log_info "模拟浏览器请求，检查完整页面加载..."
        BROWSER_RESPONSE=$(curl -s -H "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" http://localhost:12300)
        if echo "$BROWSER_RESPONSE" | grep -q "<script"; then
            log_success "完整页面加载正常，包含JavaScript脚本"
            
            # 检查是否包含API URL配置
            if echo "$BROWSER_RESPONSE" | grep -q "NEXT_PUBLIC_API_URL"; then
                log_success "找到API URL配置，前后端对接配置正确"
            else
                log_warning "未找到API URL配置，前后端对接可能存在问题"
            fi
        else
            log_warning "页面可能未完全加载，未找到JavaScript脚本"
        fi
    else
        log_warning "Web界面返回了非HTML内容，可能存在问题"
        echo "$FRONTEND_RESPONSE" | head -20
    fi
else
    echo -e "${RED}异常${NC}"
    log_error "Web界面无法访问，请检查前端服务"
    
    # 检查前端日志
    log_info "检查前端服务日志..."
    journalctl -u snmp-mib-frontend -n 20 --no-pager
fi

# 进行最终的前后端对接验证
log_info "进行最终的前后端对接验证..."

# 检查前端环境变量是否正确配置
log_info "检查前端环境变量配置..."
FRONTEND_ENV=$(systemctl show snmp-mib-frontend -p Environment)
if echo "$FRONTEND_ENV" | grep -q "NEXT_PUBLIC_API_URL=http://localhost:17880/api/v1"; then
    log_success "前端API URL配置正确"
else
    log_warning "前端API URL配置可能不正确"
    echo "$FRONTEND_ENV"
fi

# 检查前端是否能成功调用后端API
log_info "测试前端调用后端API..."
TEST_RESULT=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:12300/api/health)
if [ "$TEST_RESULT" = "200" ]; then
    log_success "前端成功调用后端API，返回状态码: $TEST_RESULT"
else
    log_warning "前端调用后端API可能存在问题，返回状态码: $TEST_RESULT"
fi

# 输出访问信息
echo ""
echo "部署完成！"
echo "======================================="
echo -e "${GREEN}Web界面: http://localhost:12300${NC}"
echo -e "${GREEN}API接口: http://localhost:17880/api/v1${NC}"
echo -e "${GREEN}健康检查: http://localhost:12300/api/health${NC}"

# 提供浏览器访问建议
log_info "请使用浏览器访问 http://localhost:12300 验证Web界面是否正常显示"
log_info "如果在远程服务器上部署，请将localhost替换为服务器IP地址"
echo ""
log_info "systemd服务管理命令:"
echo "  启动所有服务: sudo systemctl start snmp-mib-platform.target"
echo "  停止所有服务: sudo systemctl stop snmp-mib-platform.target"
echo "  重启所有服务: sudo systemctl restart snmp-mib-platform.target"
echo "  查看服务状态: sudo systemctl status snmp-mib-platform.target"
echo "  查看后端日志: sudo journalctl -u snmp-mib-backend -f"
echo "  查看前端日志: sudo journalctl -u snmp-mib-frontend -f"
echo ""
log_warning "提示: 服务可能需要1-2分钟完全启动"

exit 0