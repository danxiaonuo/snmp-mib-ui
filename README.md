# 🌐 SNMP 网络监控平台

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Go](https://img.shields.io/badge/Go-1.23-00ADD8.svg)](https://golang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![Production Ready](https://img.shields.io/badge/Production-Ready-success.svg)](#)

**[🇨🇳 中文](README.md) | [🇺🇸 English](README_EN.md)**

</div>

> 🚀 **企业级SNMP网络设备监控和管理平台** - 基于现代化技术栈构建的生产级解决方案，真正抓取设备数据的完整监控系统

## ✨ 核心特色

### 🎯 **完整的监控功能**
- 📊 **设备发现与管理** - 自动发现和管理网络设备，支持Cisco、华为、H3C等主流厂商
- 📈 **实时监控** - 基于SNMP协议的实时数据采集，支持v1/v2c/v3
- 🚨 **智能告警** - 支持Prometheus、VMAlert、Alertmanager多系统告警部署
- 📁 **MIB管理** - 完整的MIB文件管理和OID浏览器
- ⚙️ **配置自动化** - 自动生成SNMP Exporter、Categraf、VictoriaMetrics配置

### 🏭 **生产级特性**
- 🔐 **多用户支持** - 完整的用户权限管理系统
- 🌐 **多语言界面** - 支持中文和英文
- 📱 **响应式设计** - 完美支持桌面和移动设备
- 🎨 **现代化UI** - 基于最新设计规范的用户界面
- 🚀 **高性能** - 优化的数据库查询和Redis缓存策略

### 🛠️ **DevOps集成**
- 🐳 **容器化部署** - 完整的Docker Compose一键部署
- 🔄 **自动化运维** - SSH远程配置部署和组件管理
- 📊 **监控组件** - 集成Node Exporter、SNMP Exporter、Categraf等
- 🔧 **批量操作** - 支持批量设备管理和配置部署

### 🔧 **技术栈**
- **前端**: Next.js 15 + React 19 + TypeScript + Tailwind CSS + shadcn/ui
- **后端**: Go 1.23 + Gin + GORM + PostgreSQL + Redis
- **监控集成**: Prometheus + VictoriaMetrics + VMAlert + Alertmanager + Grafana
- **采集器**: SNMP Exporter + Node Exporter + Categraf (夜莺监控)
- **部署**: Docker + Docker Compose + SSH自动化
- **数据库**: PostgreSQL 15 + Redis 7 + 数据缓存优化

## 🚀 快速开始

### 📋 系统要求

- **操作系统**: Linux / macOS / Windows
- **内存**: 4GB+ (推荐8GB)
- **存储**: 20GB+ 可用空间
- **软件**: Docker 20.10+ 和 Docker Compose 2.0+

### ⚡ 一键部署

```bash
# 1. 克隆项目
git clone https://github.com/your-username/snmp-mib-ui.git
cd snmp-mib-ui

# 2. 一键部署 (推荐)
./deploy.sh

# 3. 或使用Docker Compose
docker compose up -d --build

# 4. 等待服务就绪 (约2-3分钟)
docker compose logs -f
```

### 📱 访问地址

部署完成后，您可以通过以下地址访问系统：

| 服务 | 地址 | 说明 |
|------|------|------|
| 🌐 **Web界面** | http://localhost:12300 | 主要管理界面 |
| 🔌 **API接口** | http://localhost:17880/api/v1 | RESTful API |
| 🏥 **健康检查** | http://localhost:12300/api/health | 系统状态检查 |

### 🔧 手动配置

```bash
# 1. 复制环境配置
cp .env.example .env

# 2. 编辑配置文件
vim .env

# 3. 修改关键配置
FRONTEND_PORT=12300
BACKEND_PORT=17880
NEXT_PUBLIC_API_URL=http://localhost:17880/api/v1
POSTGRES_PASSWORD=your-secure-password
REDIS_PASSWORD=your-redis-password
JWT_SECRET=your-super-secret-jwt-key
```

## 📖 功能介绍

### 🎛️ 核心功能模块

#### 📊 设备管理 (`/devices`)
- **设备发现**: 自动扫描和发现网络中的SNMP设备，支持IP段扫描
- **设备注册**: 手动添加设备和批量导入，支持Excel/CSV格式
- **状态监控**: 实时显示设备在线状态和关键指标
- **分组管理**: 按网段、类型、厂商或用途对设备进行分组管理
- **厂商支持**: 专门优化支持Cisco、华为、H3C、Juniper等主流设备

#### 📁 MIB管理 (`/mibs`)
- **文件上传**: 支持拖拽上传MIB文件，自动解析MIB树结构
- **解析验证**: 自动解析MIB文件并验证语法正确性
- **OID浏览器**: 树形结构展示OID层次关系，支持搜索和过滤
- **多厂商MIB**: 内置Cisco、华为、H3C等厂商的标准MIB库

#### ⚙️ 配置生成 (`/config-gen`)
- **SNMP Exporter配置**: 自动生成针对不同厂商的监控配置
- **Categraf配置**: 生成夜莺监控的采集器配置文件
- **Prometheus配置**: 生成Prometheus抓取任务配置
- **告警规则**: 根据设备类型生成对应的告警规则模板
- **配置验证**: 内置配置语法检查和最佳实践建议

#### 🚨 告警管理 (`/alert-rules`)
- **规则编辑器**: 可视化PromQL规则编写，支持语法高亮
- **多系统部署**: 支持Prometheus、VMAlert、Alertmanager的告警规则部署
- **通知配置**: 支持邮件、钉钉、企业微信、Slack等多种通知方式
- **告警模板**: 提供网络设备常用的告警规则模板库
- **批量操作**: 支持批量启用/禁用告警规则

#### 🔧 监控安装 (`/monitoring-installer`)
- **组件管理**: 管理Node Exporter、SNMP Exporter、Categraf等监控组件
- **远程部署**: 通过SSH自动部署监控组件到远程主机
- **配置同步**: 自动同步监控配置到目标主机
- **服务状态**: 实时监控已部署组件的运行状态
- **版本管理**: 支持监控组件的版本升级和回滚

#### 🛠️ 批量操作 (`/tools/bulk-ops`)
- **批量配置**: 批量修改设备SNMP配置信息
- **批量部署**: 批量部署监控配置到多台设备
- **批量测试**: 批量测试设备连通性和SNMP可用性
- **操作日志**: 完整的批量操作日志和结果追踪

#### 📈 实时监控 (`/monitoring`)
- **指标查询**: 实时查询设备监控指标数据
- **图表展示**: 动态图表展示设备性能趋势
- **阈值告警**: 自定义指标阈值和告警条件
- **数据导出**: 支持监控数据的CSV/JSON格式导出

## 🏗️ 架构设计

### 📁 项目结构

```
snmp-mib-ui/
├── app/                    # Next.js 应用目录
│   ├── api/               # API 路由
│   ├── components/        # React 组件
│   ├── devices/           # 设备管理页面
│   ├── mibs/              # MIB管理页面
│   ├── config-gen/        # 配置生成页面
│   └── ...
├── backend/               # Go 后端服务
│   ├── controllers/       # 控制器
│   ├── models/           # 数据模型
│   ├── services/         # 业务逻辑
│   └── utils/            # 工具函数
├── components/            # 共享组件
├── lib/                  # 工具库
├── types/                # TypeScript 类型定义
├── docker-compose.yml    # Docker 编排文件
├── deploy.sh            # 一键部署脚本
└── README.md            # 项目文档
```

### 🌐 技术架构

```mermaid
graph TB
    A[Web Browser :12300] --> B[Next.js Frontend]
    B --> C[Go Backend API :17880]
    C --> D[PostgreSQL Database :5432]
    C --> E[Redis Cache :6379]
    C --> F[SNMP Devices]
    
    G[Docker Compose] --> B
    G --> C
    G --> D
    G --> E
    
    H[Monitoring Stack] --> I[Prometheus]
    H --> J[Grafana]
    H --> K[VictoriaMetrics]
```

### 🔌 API文档

系统提供完整的RESTful API接口，支持第三方系统集成：

#### 核心API端点
```bash
# 设备管理
GET    /api/v1/devices          # 获取设备列表
POST   /api/v1/devices          # 添加新设备
GET    /api/v1/devices/{id}     # 获取设备详情
PUT    /api/v1/devices/{id}     # 更新设备信息
DELETE /api/v1/devices/{id}     # 删除设备

# SNMP操作
POST   /api/v1/snmp/get         # SNMP GET操作
POST   /api/v1/snmp/walk        # SNMP WALK操作
POST   /api/v1/snmp/test        # 测试SNMP连接

# 配置生成
POST   /api/v1/configs/generate # 生成监控配置
POST   /api/v1/configs/validate # 验证配置文件

# 告警规则
GET    /api/v1/alert-rules      # 获取告警规则
POST   /api/v1/alert-rules      # 创建告警规则
POST   /api/v1/alert-deployment/deploy # 部署告警规则

# 监控组件
GET    /api/v1/monitoring/components    # 获取可用组件
POST   /api/v1/monitoring/install       # 安装监控组件
GET    /api/v1/monitoring/status        # 获取组件状态

# 系统健康
GET    /api/v1/health           # 系统健康检查
```

## 🔧 配置说明

### 🌍 环境变量

```bash
# 应用端口配置
FRONTEND_PORT=12300          # 前端Web界面端口
BACKEND_PORT=17880           # 后端API端口

# 数据库配置
DATABASE_URL=postgresql://snmp_user:your_password@localhost:5432/snmp_platform
POSTGRES_DB=snmp_platform
POSTGRES_USER=snmp_user
POSTGRES_PASSWORD=your_secure_password

# Redis配置
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# API配置
NEXT_PUBLIC_API_URL=http://localhost:17880/api/v1
JWT_SECRET=your-super-secret-jwt-key

# CORS配置
CORS_ORIGINS=http://localhost:12300,http://localhost

# SNMP配置
SNMP_DEFAULT_COMMUNITY=public
SNMP_DEFAULT_VERSION=2c
SNMP_TIMEOUT=5s
```

### 🐳 Docker服务配置

```yaml
services:
  # 前端服务 - Next.js Web界面
  frontend:
    build: 
      context: .
      dockerfile: Dockerfile.dev
    ports: 
      - "12300:3000"     # 外部:内部端口映射
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:17880/api/v1

  # 后端服务 - Go API
  backend:
    build: ./backend
    ports: 
      - "17880:8080"     # 外部:内部端口映射
    environment:
      - DATABASE_URL=postgresql://snmp_user:password@postgres:5432/snmp_platform
      - REDIS_URL=redis://redis:6379

  # 数据库服务
  postgres:
    image: postgres:15-alpine
    ports: 
      - "5432:5432"
    environment:
      - POSTGRES_DB=snmp_platform
      - POSTGRES_USER=snmp_user
      - POSTGRES_PASSWORD=your_password

  # 缓存服务
  redis:
    image: redis:7-alpine
    ports: 
      - "6379:6379"
```

## 📊 监控集成

### 🔗 支持的监控系统

- **Prometheus + SNMP Exporter**: 原生支持，自动生成配置
- **Categraf (夜莺监控)**: 完整集成，支持配置导出
- **VictoriaMetrics**: 推荐的时序数据库
- **Grafana**: 可视化仪表板
- **VMAlert**: 告警规则管理
- **Alertmanager**: 告警通知路由

### 📈 监控指标

- **设备指标**: CPU使用率、内存使用率、网络接口流量、端口状态
- **系统指标**: 应用性能、API响应时间、错误率、并发连接数
- **业务指标**: 设备在线率、告警统计、配置变更频率
- **基础设施**: 数据库性能、缓存命中率、磁盘使用率

## 🔒 安全特性

- **认证授权**: JWT令牌 + 会话管理
- **权限控制**: 基于角色的访问控制(RBAC)
- **数据加密**: 传输和存储数据加密
- **安全审计**: 完整的操作日志记录
- **输入验证**: 严格的输入参数验证和XSS防护
- **SQL注入防护**: ORM框架安全查询
- **跨域保护**: 严格的CORS策略配置

## 🏭 生产环境部署

### 🔐 安全配置

生产环境部署时，请注意以下安全配置：

```bash
# 1. 修改默认密码
export POSTGRES_PASSWORD="your-strong-password-here"
export REDIS_PASSWORD="your-redis-password"
export JWT_SECRET="your-super-secure-jwt-secret-key-min-32-chars"

# 2. 启用HTTPS (推荐使用Nginx反向代理)
# 参考 nginx/nginx.conf 配置文件

# 3. 防火墙配置
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw deny 12300    # 禁止直接访问前端
sudo ufw deny 17880    # 禁止直接访问API
```

### 🌐 反向代理配置

推荐使用Nginx作为反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;
    
    # 前端代理
    location / {
        proxy_pass http://localhost:12300;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API代理
    location /api/ {
        proxy_pass http://localhost:17880/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 📊 监控告警

建议配置系统监控：

```bash
# 健康检查脚本
#!/bin/bash
curl -f http://localhost:12300/api/health || {
    echo "Frontend health check failed"
    # 发送告警通知
    curl -X POST "https://hooks.slack.com/your-webhook" \
         -H 'Content-type: application/json' \
         --data '{"text":"SNMP Platform Frontend Down"}'
}

# 系统资源监控
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" --no-stream

# 服务状态检查
docker compose ps --format "table {{.Name}}\t{{.State}}\t{{.Ports}}"
```

## ❓ 常见问题

### 🔧 部署问题

**Q: Docker容器启动失败？**
```bash
# 检查Docker服务状态
sudo systemctl status docker

# 检查端口占用
sudo netstat -tulpn | grep :12300
sudo netstat -tulpn | grep :17880

# 重新构建镜像
docker compose build --no-cache
docker compose up -d
```

**Q: 数据库连接失败？**
```bash
# 检查PostgreSQL状态
docker compose exec postgres pg_isready -U snmp_user

# 查看数据库日志
docker compose logs postgres

# 重置数据库
docker compose down -v
docker compose up -d
```

**Q: 前后端API调用失败？**
```bash
# 检查API健康状态
curl http://localhost:17880/api/v1/health

# 检查前端健康状态
curl http://localhost:12300/api/health

# 检查环境变量
echo $NEXT_PUBLIC_API_URL

# 查看容器日志
docker compose logs frontend
docker compose logs backend
```

**Q: 端口访问问题？**
```bash
# 检查端口映射
docker compose ps

# 检查防火墙
sudo ufw status

# 测试端口连通性
telnet localhost 12300
telnet localhost 17880
```

### 🖥️ 使用问题

**Q: SNMP设备无法发现？**
- 确认设备已启用SNMP服务
- 检查网络连通性：`ping device_ip`
- 验证SNMP Community字符串
- 确认SNMP版本匹配 (v1/v2c/v3)
- 检查防火墙UDP 161端口

**Q: 监控组件安装失败？**
- 检查SSH连接：`ssh user@host`
- 确认目标主机有足够权限
- 验证网络连通性
- 查看SSH操作日志
- 检查目标主机防火墙配置

**Q: 告警规则不生效？**
- 检查PromQL语法正确性
- 确认告警规则已正确部署
- 验证数据源配置
- 检查告警管理器配置
- 确认通知渠道配置

### 🔗 集成问题

**Q: 如何与现有监控系统集成？**
- 使用API接口进行数据同步
- 导出配置文件到现有系统
- 配置webhook通知集成
- 使用数据库直连方式

**Q: 性能优化建议？**
```bash
# 数据库优化
export DB_MAX_CONNECTIONS=100
export DB_MAX_IDLE_CONNECTIONS=10

# Redis缓存优化  
export REDIS_MAX_MEMORY=512mb
export REDIS_EVICTION_POLICY=allkeys-lru

# 应用层优化
export WORKER_PROCESSES=4
export MAX_REQUEST_SIZE=10MB
```

## 🛠️ 开发指南

### 🏁 开发环境搭建

```bash
# 1. 克隆项目
git clone https://github.com/your-username/snmp-mib-ui.git
cd snmp-mib-ui

# 2. 安装前端依赖
npm install

# 3. 安装后端依赖
cd backend
go mod tidy

# 4. 启动开发环境
cd ..
docker compose -f docker-compose.dev.yml up -d

# 5. 启动前端开发服务器
npm run dev

# 6. 启动后端开发服务器
cd backend
go run main.go
```

### 🔄 开发流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 🧪 测试

```bash
# 前端测试
npm run test
npm run test:coverage

# 后端测试
cd backend
go test ./...
go test -race ./...

# E2E测试
npm run test:e2e
```

## 📚 文档

- **[部署指南](docs/DEPLOYMENT.md)**: 详细的部署说明
- **[API文档](docs/API.md)**: 完整的API接口文档
- **[开发指南](docs/DEVELOPMENT.md)**: 开发环境搭建
- **[用户手册](docs/USER-GUIDE.md)**: 功能使用说明
- **[常见问题](docs/FAQ.md)**: 常见问题解答
- **[架构设计](docs/ARCHITECTURE.md)**: 系统架构说明

## 🤝 贡献指南

我们欢迎社区贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

### 🐛 问题报告

- **Bug报告**: 通过 GitHub Issues 提交
- **功能建议**: 通过 GitHub Discussions 讨论
- **安全问题**: 请通过私有渠道联系 security@example.com

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

感谢以下开源项目的支持：

- [Next.js](https://nextjs.org/) - React 全栈框架
- [Go](https://golang.org/) - 高性能后端语言  
- [PostgreSQL](https://postgresql.org/) - 关系型数据库
- [Redis](https://redis.io/) - 内存数据库
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [shadcn/ui](https://ui.shadcn.com/) - React UI 组件
- [Prometheus](https://prometheus.io/) - 监控告警系统

## 📞 联系方式

- **项目主页**: [GitHub Repository](https://github.com/your-username/snmp-mib-ui)
- **技术支持**: 通过 GitHub Issues 获取帮助
- **文档**: 查看 docs 目录下的详细文档
- **讨论**: GitHub Discussions

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给我们一个 Star！**

**🚀 SNMP网络监控平台 - 让网络监控变得简单高效**

Made with ❤️ by the Community

</div>