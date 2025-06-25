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
