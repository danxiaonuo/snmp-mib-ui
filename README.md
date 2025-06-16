# SNMP MIB 网络监控平台

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.23+-blue.svg)](https://golang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15+-black.svg)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

基于 Next.js 和 Go 构建的现代化 SNMP MIB 管理与网络监控平台。

## 📋 目录

- [项目特性](#-项目特性)
- [快速开始](#-快速开始)
  - [系统要求](#系统要求)
  - [安装部署](#安装部署)
  - [服务访问](#服务访问)
- [开发指南](#-开发指南)
  - [前端开发](#前端开发)
  - [后端开发](#后端开发)
  - [测试运行](#测试运行)
- [系统架构](#-系统架构)
  - [架构图](#架构图)
  - [技术栈](#技术栈)
- [功能模块](#-功能模块)
- [部署方案](#-部署方案)
- [文档资源](#-文档资源)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)
- [技术支持](#-技术支持)

## 🚀 项目特性

### 核心功能
- **📁 MIB文件管理** - 支持MIB文件上传、解析、浏览，提供OID树状可视化
- **⚙️ 配置生成器** - 自动生成SNMP Exporter和Categraf监控配置
- **🖥️ 设备管理** - 统一管理网络设备和SNMP认证信息
- **📊 监控集成** - 内置VictoriaMetrics、Grafana和Alertmanager监控栈
- **🎨 现代化界面** - 响应式Web界面，支持深色/浅色主题切换
- **🌍 多语言支持** - 完整支持中文和英文界面

### 高级特性
- **🔍 设备自动发现** - 智能扫描网络设备并自动配置
- **📈 实时监控** - 实时数据采集和性能指标监控
- **🚨 告警管理** - 灵活的告警规则配置和通知系统
- **📱 移动端适配** - 完整的移动端界面支持
- **🔐 安全管理** - 完善的用户认证和权限控制
- **📊 报表分析** - 丰富的数据报表和趋势分析

## 🚀 快速开始

### 系统要求

- Docker & Docker Compose（必需）
- 内存：4GB以上
- 磁盘空间：20GB以上
- 操作系统：Linux/macOS/Windows

### 安装部署

#### 方式一：一键部署（推荐）

```bash
# 克隆项目仓库
git clone https://github.com/YOUR_USERNAME/snmp-mib-ui.git
cd snmp-mib-ui

# 一键部署
./deploy.sh

# 或者全新部署（清除旧数据）
./deploy.sh --clean
```

#### 方式二：手动部署

```bash
# 启动所有服务
docker-compose up -d

# 检查服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f
```

#### 方式三：Kubernetes部署

```bash
# 部署到Kubernetes集群
kubectl apply -f k8s/

# 检查部署状态
kubectl get pods -n snmp-mib-platform
```

### 服务访问

| 服务名称 | 访问地址 | 默认账号 | 说明 |
|----------|----------|----------|------|
| 🌐 Web管理界面 | http://localhost:3000 | - | 主要操作界面 |
| 🔧 后端API | http://localhost:8080 | - | REST API服务 |
| 📊 Grafana | http://localhost:3001 | admin/admin | 监控仪表盘 |
| 📈 VictoriaMetrics | http://localhost:8428 | - | 时序数据库 |
| 🚨 Alertmanager | http://localhost:9093 | - | 告警管理器 |

## 💻 开发指南

### 前端开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm test

# 代码格式化
npm run lint
```

### 后端开发

```bash
# 进入后端目录
cd backend

# 下载Go模块
go mod download

# 启动开发服务器
go run main.go

# 构建二进制文件
go build -o snmp-mib-platform

# 运行测试
go test ./...
```

### 测试运行

```bash
# 前端单元测试
npm test

# 后端测试
cd backend && go test ./...

# 平台集成测试
./test_platform.sh

# API健康检查
curl http://localhost:8080/health

# 数据库连接测试
curl http://localhost:8080/api/test-db
```

## 🏗️ 系统架构

### 架构图

```
                    ┌─────────────────────────────────┐
                    │         负载均衡器               │
                    │        (Nginx)                 │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │         前端应用                │
                    │      (Next.js + React)         │
                    └──────────────┬──────────────────┘
                                   │ REST API
                    ┌──────────────▼──────────────────┐
                    │         后端服务                │
                    │       (Go + Gin)               │
                    └─────┬────────────────┬─────────┘
                          │                │
              ┌───────────▼───────────┐   │   ┌─────▼─────────┐
              │     主数据库           │   │   │   缓存数据库   │
              │   (PostgreSQL)        │   │   │   (Redis)     │
              └───────────────────────┘   │   └───────────────┘
                                         │
                          ┌──────────────▼──────────────────┐
                          │         监控系统                │
                          │ VictoriaMetrics + Grafana      │
                          │    + Alertmanager             │
                          └───────────────────────────────┘
```

### 技术栈

#### 前端技术
- **框架**: Next.js 15 + React 19
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **组件库**: Radix UI + Shadcn/ui
- **状态管理**: React Context + useState
- **国际化**: React i18next

#### 后端技术
- **语言**: Go 1.23+
- **框架**: Gin Web框架
- **数据库**: PostgreSQL 15+ (主库) + Redis 7+ (缓存)
- **ORM**: GORM
- **配置**: Viper
- **日志**: Logrus

#### 监控技术
- **时序数据库**: VictoriaMetrics
- **可视化**: Grafana
- **告警**: Alertmanager
- **数据采集**: Prometheus + SNMP Exporter

#### 部署技术
- **容器化**: Docker + Docker Compose
- **编排**: Kubernetes (可选)
- **代理**: Nginx
- **CI/CD**: GitHub Actions

## 📦 功能模块

### MIB管理模块
- MIB文件上传和验证
- OID树状结构浏览
- MIB文件导入导出
- MIB内容搜索和查询

### 设备管理模块
- 设备信息录入和编辑
- SNMP认证配置
- 设备模板管理
- 批量设备操作

### 配置生成模块
- SNMP Exporter配置生成
- Categraf配置生成
- 配置模板管理
- 配置验证和测试

### 监控管理模块
- 监控指标配置
- 告警规则管理
- 仪表盘配置
- 历史数据查询

### 系统管理模块
- 用户权限管理
- 系统设置配置
- 日志审计
- 备份恢复

## 🚀 部署方案

### Docker部署（推荐）
适合快速体验和小规模部署，一键启动所有服务。

### Kubernetes部署
适合生产环境和大规模部署，提供高可用性和扩展性。

### 物理机部署
适合特殊环境要求，需要手动安装各个组件。

详细部署文档请参考：[部署指南](docs/DEVELOPMENT.md)

## 📚 文档资源

- 📖 [API参考文档](docs/API.md) - 完整的REST API文档
- 🛠️ [开发环境搭建](docs/DEVELOPMENT.md) - 本地开发环境配置
- 🏗️ [系统架构文档](docs/system-architecture.md) - 技术架构详细说明
- 🔧 [故障排除指南](docs/troubleshooting.md) - 常见问题和解决方案
- 📊 [性能基准测试](docs/performance-benchmarks.md) - 系统性能数据
- 🚨 [告警规则模块](docs/alert-rules-module.md) - 告警系统使用指南
- 📦 [监控安装器](docs/monitoring-installer-guide.md) - 监控组件安装指南

## 🤝 贡献指南

我们欢迎所有形式的贡献！请遵循以下步骤：

1. **Fork项目** - 点击右上角Fork按钮
2. **创建分支** - `git checkout -b feature/amazing-feature`
3. **提交更改** - `git commit -m '添加某个很棒的功能'`
4. **推送分支** - `git push origin feature/amazing-feature`
5. **提交PR** - 在GitHub上创建Pull Request

### 开发规范
- 遵循现有代码风格
- 添加必要的测试用例
- 更新相关文档
- 确保所有测试通过

## 📄 许可证

本项目采用 MIT 许可证 - 详情请查看 [LICENSE](LICENSE) 文件。

## 🆘 技术支持

- 📖 [完整文档](docs/) - 查看详细使用文档
- 🐛 [问题反馈](https://github.com/YOUR_USERNAME/snmp-mib-ui/issues) - 提交Bug和功能请求
- 💬 [讨论区](https://github.com/YOUR_USERNAME/snmp-mib-ui/discussions) - 技术交流和讨论
- 📧 联系方式 - 发送邮件获取技术支持

---

⭐ 如果这个项目对您有帮助，请给我们一个Star！