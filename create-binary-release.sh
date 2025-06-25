#!/bin/bash

# SNMP MIB Platform - 二进制发布包创建脚本
# 创建包含前后端的完整二进制部署包

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 版本信息
VERSION="2.0.0"
RELEASE_NAME="snmp-mib-platform-${VERSION}"
RELEASE_DIR="releases/${RELEASE_NAME}"

log_info "🚀 创建 SNMP MIB Platform 二进制发布包 v${VERSION}"

# 清理旧的发布目录
if [ -d "releases" ]; then
    log_info "清理旧的发布目录..."
    rm -rf releases
fi

# 创建发布目录结构
log_info "📁 创建发布目录结构..."
mkdir -p "${RELEASE_DIR}"/{frontend,backend,scripts,docs,config}

# 构建前端
log_info "🔨 构建前端应用..."
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# 构建 Next.js 应用
npx next build --no-lint

# 复制前端文件
log_info "📦 打包前端文件..."
cp -r .next/standalone/* "${RELEASE_DIR}/frontend/"
mkdir -p "${RELEASE_DIR}/frontend/.next"
cp -r .next/static "${RELEASE_DIR}/frontend/.next/"
cp -r public "${RELEASE_DIR}/frontend/"

# 创建前端启动脚本
cat > "${RELEASE_DIR}/frontend/start-frontend.sh" << 'EOF'
#!/bin/bash
export NODE_ENV=production
export PORT=${PORT:-12300}
export HOSTNAME=${HOSTNAME:-0.0.0.0}
echo "🚀 Starting SNMP MIB Platform Frontend on ${HOSTNAME}:${PORT}"
node server.js
EOF

chmod +x "${RELEASE_DIR}/frontend/start-frontend.sh"

# 构建后端（如果可能）
log_info "🔨 构建后端应用..."
if [ -f "backend/mib-platform" ]; then
    log_info "使用现有的后端二进制文件..."
    cp backend/mib-platform "${RELEASE_DIR}/backend/"
else
    log_warning "后端二进制文件不存在，尝试构建..."
    cd backend
    if go build -o mib-platform . 2>/dev/null; then
        log_success "后端构建成功"
        cp mib-platform "../${RELEASE_DIR}/backend/"
    else
        log_error "后端构建失败，请手动构建"
        # 复制源码以便用户自行构建
        cp -r . "../${RELEASE_DIR}/backend-source/"
    fi
    cd ..
fi

# 复制后端配置和脚本
log_info "📦 打包后端文件..."
cp -r backend/{config,controllers,database,middleware,models,routes,services,utils} "${RELEASE_DIR}/backend/" 2>/dev/null || true
cp backend/{go.mod,go.sum,main.go} "${RELEASE_DIR}/backend/" 2>/dev/null || true

# 创建后端启动脚本
cat > "${RELEASE_DIR}/backend/start-backend.sh" << 'EOF'
#!/bin/bash
export GIN_MODE=release
export PORT=${BACKEND_PORT:-8080}
export DB_PATH=${DB_PATH:-./data/mib-platform.db}

# 创建数据目录
mkdir -p data

echo "🚀 Starting SNMP MIB Platform Backend on port ${PORT}"
./mib-platform
EOF

chmod +x "${RELEASE_DIR}/backend/start-backend.sh"

# 复制部署脚本
log_info "📦 打包部署脚本..."
cp build-binary.sh "${RELEASE_DIR}/scripts/"
cp deploy-binary.sh "${RELEASE_DIR}/scripts/"
cp fix-git-and-pr.sh "${RELEASE_DIR}/scripts/"
cp Makefile "${RELEASE_DIR}/scripts/"

# 复制配置文件
log_info "📦 打包配置文件..."
cp next.config.mjs "${RELEASE_DIR}/config/"
cp package.json "${RELEASE_DIR}/config/"
cp -r database "${RELEASE_DIR}/config/" 2>/dev/null || true
cp -r systemd "${RELEASE_DIR}/config/" 2>/dev/null || true

# 复制文档
log_info "📦 打包文档..."
cp README.md "${RELEASE_DIR}/docs/"
cp README_EN.md "${RELEASE_DIR}/docs/"
cp DEPLOYMENT-GUIDE.md "${RELEASE_DIR}/docs/" 2>/dev/null || true
cp -r docs/* "${RELEASE_DIR}/docs/" 2>/dev/null || true

# 创建主启动脚本
cat > "${RELEASE_DIR}/start-platform.sh" << 'EOF'
#!/bin/bash

# SNMP MIB Platform 一键启动脚本
# 同时启动前端和后端服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 配置
FRONTEND_PORT=${FRONTEND_PORT:-12300}
BACKEND_PORT=${BACKEND_PORT:-8080}

log_info "🚀 启动 SNMP MIB Platform"
log_info "前端端口: ${FRONTEND_PORT}"
log_info "后端端口: ${BACKEND_PORT}"

# 检查端口是否被占用
check_port() {
    local port=$1
    if netstat -tlnp 2>/dev/null | grep -q ":${port} "; then
        log_warning "端口 ${port} 已被占用"
        return 1
    fi
    return 0
}

# 启动后端
log_info "启动后端服务..."
cd backend
if [ -f "mib-platform" ]; then
    export BACKEND_PORT=${BACKEND_PORT}
    nohup ./start-backend.sh > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    log_success "后端服务已启动 (PID: ${BACKEND_PID})"
else
    log_error "后端二进制文件不存在，请先构建后端"
    exit 1
fi
cd ..

# 等待后端启动
sleep 3

# 启动前端
log_info "启动前端服务..."
cd frontend
export PORT=${FRONTEND_PORT}
nohup ./start-frontend.sh > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid
log_success "前端服务已启动 (PID: ${FRONTEND_PID})"
cd ..

log_success "🎉 SNMP MIB Platform 启动完成！"
log_info "前端访问地址: http://localhost:${FRONTEND_PORT}"
log_info "后端API地址: http://localhost:${BACKEND_PORT}"
log_info ""
log_info "查看日志:"
log_info "  前端日志: tail -f frontend.log"
log_info "  后端日志: tail -f backend.log"
log_info ""
log_info "停止服务:"
log_info "  ./stop-platform.sh"
EOF

chmod +x "${RELEASE_DIR}/start-platform.sh"

# 创建停止脚本
cat > "${RELEASE_DIR}/stop-platform.sh" << 'EOF'
#!/bin/bash

# SNMP MIB Platform 停止脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

log_info "🛑 停止 SNMP MIB Platform"

# 停止前端
if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        log_success "前端服务已停止"
    fi
    rm -f frontend.pid
fi

# 停止后端
if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        log_success "后端服务已停止"
    fi
    rm -f backend.pid
fi

log_success "🎉 SNMP MIB Platform 已完全停止"
EOF

chmod +x "${RELEASE_DIR}/stop-platform.sh"

# 创建安装脚本
cat > "${RELEASE_DIR}/install.sh" << 'EOF'
#!/bin/bash

# SNMP MIB Platform 安装脚本
# 安装为系统服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查权限
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 sudo 运行此脚本"
    exit 1
fi

INSTALL_DIR="/opt/snmp-mib-platform"
SERVICE_USER="snmp-mib"

log_info "🚀 安装 SNMP MIB Platform 到系统"

# 创建用户
if ! id "$SERVICE_USER" &>/dev/null; then
    log_info "创建服务用户: $SERVICE_USER"
    useradd -r -s /bin/false -d "$INSTALL_DIR" "$SERVICE_USER"
fi

# 创建安装目录
log_info "创建安装目录: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cp -r . "$INSTALL_DIR/"
chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
chmod +x "$INSTALL_DIR"/*.sh
chmod +x "$INSTALL_DIR"/frontend/*.sh
chmod +x "$INSTALL_DIR"/backend/*.sh

# 创建systemd服务文件
log_info "创建systemd服务..."

# 后端服务
cat > /etc/systemd/system/snmp-mib-backend.service << 'EOFSERVICE'
[Unit]
Description=SNMP MIB Platform Backend
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR/backend
ExecStart=$INSTALL_DIR/backend/start-backend.sh
Restart=always
RestartSec=10
Environment=GIN_MODE=release
Environment=BACKEND_PORT=8080

[Install]
WantedBy=multi-user.target
EOFSERVICE

# 前端服务
cat > /etc/systemd/system/snmp-mib-frontend.service << 'EOFFRONTEND'
[Unit]
Description=SNMP MIB Platform Frontend
After=network.target snmp-mib-backend.service
Requires=snmp-mib-backend.service

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$INSTALL_DIR/frontend
ExecStart=$INSTALL_DIR/frontend/start-frontend.sh
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=12300

[Install]
WantedBy=multi-user.target
EOFFRONTEND

# 平台目标服务
cat > /etc/systemd/system/snmp-mib-platform.target << 'EOFTARGET'
[Unit]
Description=SNMP MIB Platform
Requires=snmp-mib-backend.service snmp-mib-frontend.service
After=snmp-mib-backend.service snmp-mib-frontend.service

[Install]
WantedBy=multi-user.target
EOFTARGET

# 重新加载systemd
systemctl daemon-reload

log_success "✅ 安装完成！"
log_info ""
log_info "启动服务:"
log_info "  sudo systemctl start snmp-mib-platform.target"
log_info "  sudo systemctl enable snmp-mib-platform.target"
log_info ""
log_info "查看状态:"
log_info "  sudo systemctl status snmp-mib-platform.target"
log_info ""
log_info "查看日志:"
log_info "  sudo journalctl -u snmp-mib-backend.service -f"
log_info "  sudo journalctl -u snmp-mib-frontend.service -f"
EOF

chmod +x "${RELEASE_DIR}/install.sh"

# 创建README文件
cat > "${RELEASE_DIR}/README.md" << EOF
# SNMP MIB Platform v${VERSION} - 二进制发布包

这是 SNMP MIB Platform 的二进制发布包，包含完整的前端和后端服务。

## 📁 目录结构

\`\`\`
${RELEASE_NAME}/
├── frontend/           # 前端应用（Next.js standalone）
├── backend/           # 后端应用（Go 二进制）
├── scripts/           # 构建和部署脚本
├── config/            # 配置文件
├── docs/              # 文档
├── start-platform.sh  # 一键启动脚本
├── stop-platform.sh   # 停止脚本
├── install.sh         # 系统安装脚本
└── README.md          # 本文件
\`\`\`

## 🚀 快速开始

### 方式1: 直接运行（推荐用于测试）

\`\`\`bash
# 启动平台
./start-platform.sh

# 访问应用
# 前端: http://localhost:12300
# 后端API: http://localhost:8080

# 停止平台
./stop-platform.sh
\`\`\`

### 方式2: 安装为系统服务（推荐用于生产）

\`\`\`bash
# 安装到系统
sudo ./install.sh

# 启动服务
sudo systemctl start snmp-mib-platform.target
sudo systemctl enable snmp-mib-platform.target

# 查看状态
sudo systemctl status snmp-mib-platform.target
\`\`\`

## 🔧 配置

### 环境变量

- \`FRONTEND_PORT\`: 前端端口（默认: 12300）
- \`BACKEND_PORT\`: 后端端口（默认: 8080）
- \`DB_PATH\`: 数据库路径（默认: ./data/mib-platform.db）

### 自定义配置

\`\`\`bash
# 自定义端口启动
FRONTEND_PORT=3000 BACKEND_PORT=9000 ./start-platform.sh
\`\`\`

## 📋 系统要求

- Linux x86_64
- Node.js 18+ （前端）
- 无需额外依赖（后端为静态编译）

## 🛠️ 开发

如果需要修改源码：

1. 前端源码在 \`config/\` 目录中的配置文件
2. 后端源码需要从原始仓库获取
3. 使用 \`scripts/\` 目录中的脚本重新构建

## 📚 文档

详细文档请查看 \`docs/\` 目录：

- \`README.md\` - 项目介绍
- \`DEPLOYMENT-GUIDE.md\` - 部署指南
- 其他技术文档

## 🐛 故障排除

### 端口被占用

\`\`\`bash
# 检查端口占用
netstat -tlnp | grep :12300
netstat -tlnp | grep :8080

# 杀死占用进程
sudo kill -9 <PID>
\`\`\`

### 权限问题

\`\`\`bash
# 确保脚本有执行权限
chmod +x *.sh
chmod +x frontend/*.sh
chmod +x backend/*.sh
\`\`\`

### 查看日志

\`\`\`bash
# 直接运行模式
tail -f frontend.log
tail -f backend.log

# 系统服务模式
sudo journalctl -u snmp-mib-frontend.service -f
sudo journalctl -u snmp-mib-backend.service -f
\`\`\`

## 📞 支持

如有问题，请查看：
1. 日志文件
2. 文档目录
3. GitHub Issues

---

**SNMP MIB Platform v${VERSION}**  
现代化的 SNMP MIB 管理和网络监控平台
EOF

# 创建压缩包
log_info "📦 创建压缩包..."
cd releases
tar -czf "${RELEASE_NAME}.tar.gz" "${RELEASE_NAME}"
cd ..

# 显示结果
log_success "🎉 二进制发布包创建完成！"
log_info ""
log_info "📦 发布包位置:"
log_info "  目录: releases/${RELEASE_NAME}/"
log_info "  压缩包: releases/${RELEASE_NAME}.tar.gz"
log_info ""
log_info "📋 包含内容:"
log_info "  ✅ 前端应用 (Next.js standalone)"
log_info "  ✅ 后端应用 (Go 二进制)"
log_info "  ✅ 启动/停止脚本"
log_info "  ✅ 系统安装脚本"
log_info "  ✅ 配置文件"
log_info "  ✅ 文档"
log_info ""
log_info "🚀 使用方法:"
log_info "  1. 解压: tar -xzf releases/${RELEASE_NAME}.tar.gz"
log_info "  2. 进入目录: cd ${RELEASE_NAME}"
log_info "  3. 启动: ./start-platform.sh"
log_info ""
log_info "📤 上传到GitHub:"
log_info "  ./fix-git-and-pr.sh"

# 显示文件大小
PACKAGE_SIZE=$(du -h "releases/${RELEASE_NAME}.tar.gz" | cut -f1)
log_info "📊 压缩包大小: ${PACKAGE_SIZE}"