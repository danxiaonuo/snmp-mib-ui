#!/bin/bash

# SNMP MIB Platform - 源码备份脚本
# 保留必要的源码文件，方便上传到GitHub

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
SOURCE_BACKUP_NAME="snmp-mib-platform-source-${VERSION}"
SOURCE_DIR="source-backup/${SOURCE_BACKUP_NAME}"

log_info "🚀 创建 SNMP MIB Platform 源码备份 v${VERSION}"

# 清理旧的备份目录
if [ -d "source-backup" ]; then
    log_info "清理旧的备份目录..."
    rm -rf source-backup
fi

# 创建源码备份目录结构
log_info "📁 创建源码备份目录结构..."
mkdir -p "${SOURCE_DIR}"

# 复制核心源码文件
log_info "📦 备份核心源码文件..."

# 前端源码
cp -r app "${SOURCE_DIR}/"
cp -r components "${SOURCE_DIR}/"
cp -r lib "${SOURCE_DIR}/"
cp -r hooks "${SOURCE_DIR}/"
cp -r contexts "${SOURCE_DIR}/"
cp -r types "${SOURCE_DIR}/"
cp -r styles "${SOURCE_DIR}/"
cp -r public "${SOURCE_DIR}/"
cp -r locales "${SOURCE_DIR}/"

# 后端源码
cp -r backend "${SOURCE_DIR}/"

# 配置文件
cp package.json "${SOURCE_DIR}/"
cp next.config.mjs "${SOURCE_DIR}/"
cp tailwind.config.ts "${SOURCE_DIR}/"
cp tsconfig.json "${SOURCE_DIR}/"
cp postcss.config.mjs "${SOURCE_DIR}/"
cp .eslintrc.json "${SOURCE_DIR}/"
cp .prettierrc "${SOURCE_DIR}/"
cp components.json "${SOURCE_DIR}/"

# 重要脚本
cp build-binary.sh "${SOURCE_DIR}/"
cp deploy-binary.sh "${SOURCE_DIR}/"
cp fix-git-and-pr.sh "${SOURCE_DIR}/"
cp create-binary-release.sh "${SOURCE_DIR}/"
cp Makefile "${SOURCE_DIR}/"

# 文档
cp README.md "${SOURCE_DIR}/"
cp README_EN.md "${SOURCE_DIR}/"
cp LICENSE "${SOURCE_DIR}/"
cp -r docs "${SOURCE_DIR}/" 2>/dev/null || true

# 数据库和配置
cp -r database "${SOURCE_DIR}/" 2>/dev/null || true
cp -r config "${SOURCE_DIR}/" 2>/dev/null || true
cp -r systemd "${SOURCE_DIR}/" 2>/dev/null || true
cp -r k8s "${SOURCE_DIR}/" 2>/dev/null || true

# 测试文件
cp -r __tests__ "${SOURCE_DIR}/" 2>/dev/null || true
cp jest.config.js "${SOURCE_DIR}/" 2>/dev/null || true
cp jest.setup.js "${SOURCE_DIR}/" 2>/dev/null || true

# Git 相关
cp .gitignore "${SOURCE_DIR}/"
cp -r .github "${SOURCE_DIR}/" 2>/dev/null || true

# 清理不需要的文件
log_info "🧹 清理不必要的文件..."
find "${SOURCE_DIR}" -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
find "${SOURCE_DIR}" -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true
find "${SOURCE_DIR}" -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
find "${SOURCE_DIR}" -name "*.log" -type f -delete 2>/dev/null || true
find "${SOURCE_DIR}" -name "*.pid" -type f -delete 2>/dev/null || true
find "${SOURCE_DIR}" -name "nohup.out" -type f -delete 2>/dev/null || true
find "${SOURCE_DIR}" -name "*.db" -type f -delete 2>/dev/null || true
find "${SOURCE_DIR}" -name "mib-platform" -type f -delete 2>/dev/null || true

# 创建源码专用的README
cat > "${SOURCE_DIR}/README-SOURCE.md" << 'EOF'
# SNMP MIB Platform - 源码版本

这是 SNMP MIB Platform 的完整源码版本，包含所有必要的开发文件。

## 📁 目录结构

```
snmp-mib-platform-source/
├── app/                    # Next.js 应用目录
├── components/             # React 组件
├── lib/                    # 工具库
├── hooks/                  # React Hooks
├── contexts/               # React Contexts
├── types/                  # TypeScript 类型定义
├── styles/                 # 样式文件
├── backend/                # Go 后端源码
├── docs/                   # 文档
├── __tests__/              # 测试文件
├── database/               # 数据库脚本
├── config/                 # 配置文件
├── systemd/                # 系统服务配置
├── k8s/                    # Kubernetes 配置
├── build-binary.sh         # 二进制构建脚本
├── deploy-binary.sh        # 部署脚本
├── fix-git-and-pr.sh       # Git 工具脚本
├── create-binary-release.sh # 发布包创建脚本
└── Makefile                # 构建工具
```

## 🚀 快速开始

### 开发环境

```bash
# 安装前端依赖
npm install

# 启动开发服务器
npm run dev

# 构建后端
cd backend
go build -o mib-platform .
./mib-platform
```

### 生产部署

```bash
# 构建二进制发布包
./create-binary-release.sh

# 或者直接构建前端
./build-binary.sh

# 部署
./deploy-binary.sh
```

## 🔧 开发工具

- `make dev` - 启动开发环境
- `make build` - 构建应用
- `make test` - 运行测试
- `make lint` - 代码检查
- `make format` - 代码格式化

## 📚 技术栈

### 前端
- **Next.js 15** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Radix UI** - 组件库
- **Recharts** - 图表库

### 后端
- **Go 1.23** - 后端语言
- **Gin** - Web 框架
- **GORM** - ORM 框架
- **SQLite** - 数据库

### 工具
- **Jest** - 测试框架
- **ESLint** - 代码检查
- **Prettier** - 代码格式化

## 🛠️ 构建说明

### 前端构建
```bash
# 开发构建
npm run build

# 生产构建（standalone）
npm run build:standalone
```

### 后端构建
```bash
cd backend
go mod download
go build -o mib-platform .
```

### 完整发布包
```bash
./create-binary-release.sh
```

## 📋 系统要求

### 开发环境
- Node.js 18+
- Go 1.23+
- Git

### 生产环境
- Linux x86_64
- 无需额外依赖（二进制部署）

## 🔄 Git 工作流

```bash
# 提交代码并创建PR
./fix-git-and-pr.sh

# 手动Git操作
git add .
git commit -m "feat: 新功能"
git push origin main
```

## 📞 支持

- 📖 查看 `docs/` 目录获取详细文档
- 🐛 提交 Issues 报告问题
- 💡 提交 Pull Request 贡献代码

---

**SNMP MIB Platform v2.0.0**  
现代化的 SNMP MIB 管理和网络监控平台
EOF

# 创建快速构建脚本
cat > "${SOURCE_DIR}/quick-build.sh" << 'EOF'
#!/bin/bash

# 快速构建脚本

set -e

echo "🚀 SNMP MIB Platform - 快速构建"

# 检查依赖
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi

if ! command -v go &> /dev/null; then
    echo "❌ Go 未安装"
    exit 1
fi

# 安装前端依赖
echo "📦 安装前端依赖..."
npm install

# 构建前端
echo "🔨 构建前端..."
npm run build

# 构建后端
echo "🔨 构建后端..."
cd backend
go mod download
go build -o mib-platform .
cd ..

echo "✅ 构建完成！"
echo ""
echo "启动方式:"
echo "  前端: npm start"
echo "  后端: cd backend && ./mib-platform"
echo ""
echo "或者使用二进制部署:"
echo "  ./build-binary.sh"
EOF

chmod +x "${SOURCE_DIR}/quick-build.sh"

# 创建开发环境启动脚本
cat > "${SOURCE_DIR}/dev-start.sh" << 'EOF'
#!/bin/bash

# 开发环境启动脚本

set -e

echo "🚀 启动 SNMP MIB Platform 开发环境"

# 启动后端
echo "启动后端服务..."
cd backend
if [ ! -f "mib-platform" ]; then
    echo "构建后端..."
    go build -o mib-platform .
fi
nohup ./mib-platform > ../backend-dev.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend-dev.pid
echo "后端服务已启动 (PID: $BACKEND_PID)"
cd ..

# 等待后端启动
sleep 2

# 启动前端
echo "启动前端服务..."
npm run dev &
FRONTEND_PID=$!
echo $FRONTEND_PID > frontend-dev.pid
echo "前端服务已启动 (PID: $FRONTEND_PID)"

echo ""
echo "✅ 开发环境启动完成！"
echo "前端: http://localhost:12300"
echo "后端: http://localhost:8080"
echo ""
echo "停止服务: ./dev-stop.sh"
EOF

chmod +x "${SOURCE_DIR}/dev-start.sh"

# 创建开发环境停止脚本
cat > "${SOURCE_DIR}/dev-stop.sh" << 'EOF'
#!/bin/bash

# 开发环境停止脚本

echo "🛑 停止开发环境"

# 停止前端
if [ -f "frontend-dev.pid" ]; then
    FRONTEND_PID=$(cat frontend-dev.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo "前端服务已停止"
    fi
    rm -f frontend-dev.pid
fi

# 停止后端
if [ -f "backend-dev.pid" ]; then
    BACKEND_PID=$(cat backend-dev.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo "后端服务已停止"
    fi
    rm -f backend-dev.pid
fi

echo "✅ 开发环境已停止"
EOF

chmod +x "${SOURCE_DIR}/dev-stop.sh"

# 创建压缩包
log_info "📦 创建源码压缩包..."
cd source-backup
tar -czf "${SOURCE_BACKUP_NAME}.tar.gz" "${SOURCE_BACKUP_NAME}"
cd ..

# 显示结果
log_success "🎉 源码备份创建完成！"
log_info ""
log_info "📦 备份位置:"
log_info "  目录: source-backup/${SOURCE_BACKUP_NAME}/"
log_info "  压缩包: source-backup/${SOURCE_BACKUP_NAME}.tar.gz"
log_info ""
log_info "📋 包含内容:"
log_info "  ✅ 完整前端源码 (Next.js + TypeScript)"
log_info "  ✅ 完整后端源码 (Go)"
log_info "  ✅ 构建和部署脚本"
log_info "  ✅ 配置文件"
log_info "  ✅ 文档"
log_info "  ✅ 测试文件"
log_info "  ✅ 开发工具脚本"
log_info ""
log_info "🚀 使用方法:"
log_info "  1. 解压: tar -xzf source-backup/${SOURCE_BACKUP_NAME}.tar.gz"
log_info "  2. 进入目录: cd ${SOURCE_BACKUP_NAME}"
log_info "  3. 快速构建: ./quick-build.sh"
log_info "  4. 开发模式: ./dev-start.sh"
log_info ""
log_info "📤 上传到GitHub:"
log_info "  cd ${SOURCE_BACKUP_NAME} && ./fix-git-and-pr.sh"

# 显示文件大小
SOURCE_SIZE=$(du -h "source-backup/${SOURCE_BACKUP_NAME}.tar.gz" | cut -f1)
log_info "📊 源码包大小: ${SOURCE_SIZE}"