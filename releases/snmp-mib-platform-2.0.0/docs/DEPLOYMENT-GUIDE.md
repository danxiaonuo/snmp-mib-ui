# MIB Web UI 监控系统 - 完整部署指南

> 🚀 **企业级 SNMP/MIB 监控系统** - 支持在线/离线部署，零配置快速上手

## 📚 目录导航

### 🎯 [快速开始](#快速开始)
- [系统要求](#系统要求)
- [5分钟快速部署](#5分钟快速部署)
- [验证部署](#验证部署)

### 🌐 [在线部署方案](#在线部署方案)
- [自动化部署（推荐）](#自动化部署推荐)
- [Docker Compose 部署](#docker-compose-部署)
- [手动部署](#手动部署)
- [开发环境部署](#开发环境部署)

### 📦 [离线部署方案](#离线部署方案)
- [离线部署概述](#离线部署概述)
- [构建离线包](#构建离线包)
- [离线安装](#离线安装)
- [跨平台部署](#跨平台部署)

### ⚙️ [配置管理](#配置管理)
- [环境变量配置](#环境变量配置)
- [数据库配置](#数据库配置)
- [安全配置](#安全配置)
- [性能优化](#性能优化)

### 🔧 [运维管理](#运维管理)
- [服务管理](#服务管理)
- [监控告警](#监控告警)
- [备份恢复](#备份恢复)
- [故障排查](#故障排查)

### 📋 [附录](#附录)
- [常见问题](#常见问题)
- [端口说明](#端口说明)
- [目录结构](#目录结构)
- [更新升级](#更新升级)

---

## 快速开始

### 系统要求

#### 最低配置
| 组件 | 要求 |
|------|------|
| **操作系统** | Ubuntu 18.04+ / CentOS 7+ / Debian 10+ |
| **CPU** | 2 核心 |
| **内存** | 4GB RAM |
| **存储** | 20GB 可用空间 |
| **网络** | 互联网连接（在线部署） |

#### 推荐配置
| 组件 | 要求 |
|------|------|
| **操作系统** | Ubuntu 22.04+ LTS |
| **CPU** | 4 核心或更多 |
| **内存** | 8GB RAM 或更多 |
| **存储** | 50GB SSD |
| **网络** | 千兆网络 |

#### 软件依赖
- Docker 20.10+
- Docker Compose 2.0+
- Git
- curl/wget

### 5分钟快速部署

#### 方案一：一键自动部署 ⭐ **推荐**

```bash
# 1. 下载项目
git clone <your-repository-url> mibweb-ui
cd mibweb-ui

# 2. 运行自动部署脚本
chmod +x deploy-ubuntu.sh
sudo ./deploy-ubuntu.sh

# 3. 等待部署完成（约3-5分钟）
# 部署完成后会显示访问地址
```

#### 方案二：Docker Compose 快速启动

```bash
# 1. 克隆项目
git clone <your-repository-url> mibweb-ui
cd mibweb-ui

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件设置密码等配置

# 3. 启动服务
docker-compose up -d

# 4. 查看服务状态
docker-compose ps
```

### 验证部署

部署完成后，通过以下方式验证：

```bash
# 1. 检查服务状态
./health-check.sh

# 2. 访问 Web 界面
# 浏览器打开: http://your-server-ip:3000
# 默认账号: admin
# 默认密码: admin123 <!-- 重要: 首次登录后请立即修改密码 -->

# 3. 检查 API 接口
curl -f http://localhost:8080/health # Backend health
curl -f http://localhost:3000/api/health # Frontend health (if available)
```

---

## 在线部署方案

### 自动化部署（推荐）

#### Ubuntu/Debian 系统

```bash
# 克隆项目
git clone <repository-url>
cd mib-web-ui

# 启动服务
docker-compose up -d
```

**部署脚本功能：**
- ✅ 自动检测系统环境
- ✅ 安装 Docker 和 Docker Compose
- ✅ 配置防火墙规则
- ✅ 创建系统服务
- ✅ 设置开机自启动
- ✅ 生成 SSL 证书（可选）

#### CentOS/RHEL 系统

```bash
# 使用 CentOS 专用脚本
wget -O deploy-centos.sh https://raw.githubusercontent.com/your-repo/mibweb-ui/main/deploy-centos.sh <!-- TODO: Verify URL and consider adding this script to the repository -->
chmod +x deploy-centos.sh
sudo ./deploy-centos.sh
```

#### 部署选项

```bash
# 显示帮助信息
./deploy-ubuntu.sh --help

# 跳过 Docker 安装
./deploy-ubuntu.sh --skip-docker

# 开发模式部署
./deploy-ubuntu.sh --dev

# 指定端口
./deploy-ubuntu.sh --port 8080

# 启用 HTTPS
./deploy-ubuntu.sh --ssl --domain your-domain.com
```

### Docker Compose 部署

#### 生产环境部署

```bash
# 1. 准备环境
git clone <your-repository-url> mibweb-ui
cd mibweb-ui

# 2. 配置生产环境变量
cp .env.production .env # Ensure .env.production is available or use .env.example
vim .env  # 编辑配置

# 3. 启动生产环境 (Assuming docker-compose.yml is the primary production file)
docker-compose -f docker-compose.yml up -d

# 4. 查看日志
docker-compose -f docker-compose.yml logs -f
```

#### 开发环境部署

```bash
# 1. 启动开发环境
docker-compose -f docker-compose.dev.yml up -d

# 2. 进入开发容器
docker-compose exec frontend bash

# 3. 热重载开发
npm run dev
```

#### 完整功能部署

```bash
# 包含监控、告警、日志等完整功能
docker-compose -f docker-compose.complete.yml up -d
```

### 手动部署

#### 1. 安装 Docker

**Ubuntu/Debian:**
```bash
# 更新包索引
sudo apt update

# 安装依赖
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# 添加 Docker GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加 Docker 仓库
# 检测系统架构并配置相应的软件源
ARCH=$(dpkg --print-architecture)
echo "deb [arch=${ARCH} signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 添加用户到 docker 组
sudo usermod -aG docker $USER
```

**CentOS/RHEL:**
```bash
# 安装依赖
sudo yum install -y yum-utils

# 添加 Docker 仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 添加用户到 docker 组
sudo usermod -aG docker $USER
```

#### 2. 安装 Docker Compose

```bash
# 下载 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

#### 3. 部署应用

```bash
# 1. 克隆项目
git clone <your-repository-url> mibweb-ui
cd mibweb-ui

# 2. 配置环境
cp .env.example .env
vim .env

# 3. 创建网络和卷
docker network create mibweb-network
docker volume create postgres_data
docker volume create redis_data

# 4. 启动服务
docker-compose up -d

# 5. 初始化数据库
docker-compose exec postgres psql -U netmon_user -d network_monitor -f /docker-entrypoint-initdb.d/init.sql
```

### 开发环境部署

#### 本地开发环境

```bash
# 1. 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 启动后端服务（另一个终端）
cd backend
go mod tidy
go run main.go
```

#### 开发环境配置

```bash
# 1. 配置开发环境变量
cp .env.local.example .env.local
vim .env.local

# 2. 启动数据库（Docker）
docker-compose -f docker-compose.dev.yml up -d postgres redis

# 3. 运行数据库迁移 (Assuming Prisma based on DEVELOPMENT.md)
npx prisma migrate dev # Or use `npm run db:migrate` if defined in package.json

# 4. 启动前端开发服务器
npm run dev
```

---

## 离线部署方案

### 离线部署概述

离线部署适用于以下场景：
- 🔒 内网环境，无法访问外网
- 🏢 企业安全要求，禁止外网连接
- 🌐 网络环境不稳定
- ⚡ 需要快速批量部署

**部署架构：**
```
构建机器 (有外网)     目标服务器 (无外网/内网)
     ↓                      ↑
  构建依赖包          ←─── 传输
  Docker镜像
  配置文件
```

### 构建离线包

#### 在有网络的构建机器上操作

```bash
# 1. 克隆项目
git clone <your-repository-url> mibweb-ui
cd mibweb-ui

# 2. 运行离线构建脚本
chmod +x build-local-deps.sh
./build-local-deps.sh

# 3. 查看构建结果
ls -la mibweb-offline-deployment-*/
```

#### 构建选项

```bash
# 完整构建（默认）
./build-local-deps.sh

# 跳过前端构建
./build-local-deps.sh --skip-frontend

# 跳过后端构建
./build-local-deps.sh --skip-backend

# 基础构建（默认，仅Web UI）
./build-local-deps.sh

# 完整构建（包含监控组件）
./build-local-deps.sh --include-monitoring

# 跳过 Docker 镜像构建
./build-local-deps.sh --skip-docker

# 仅生成配置文件
./build-local-deps.sh --config-only

# 详细输出
./build-local-deps.sh --verbose

# 显示帮助信息
./build-local-deps.sh --help
```

#### 构建产物说明

构建完成后生成的离线部署包结构：

**基础版本（默认）：**
```
mibweb-offline-deployment-YYYYMMDD-HHMMSS/
├── docker-images/                 # Docker 镜像文件
│   ├── mibweb-frontend.tar       # 前端应用镜像
│   ├── mibweb-backend.tar        # 后端 API 镜像
│   ├── postgres-15.tar           # PostgreSQL 数据库
│   ├── redis-7.tar               # Redis 缓存
│   └── nginx-alpine.tar          # Nginx 反向代理
```

**完整版本（--include-monitoring）：**
```
mibweb-offline-deployment-YYYYMMDD-HHMMSS/
├── docker-images/                 # Docker 镜像文件
│   ├── mibweb-frontend.tar       # 前端应用镜像
│   ├── mibweb-backend.tar        # 后端 API 镜像
│   ├── postgres-15.tar           # PostgreSQL 数据库
│   ├── redis-7.tar               # Redis 缓存
│   ├── nginx-alpine.tar          # Nginx 反向代理
│   ├── categraf-latest.tar       # Categraf 数据采集
│   ├── vmagent-latest.tar        # VMAgent 数据代理
│   ├── vmalert-latest.tar        # VMAlert 告警引擎
│   └── snmp-exporter-latest.tar  # SNMP Exporter 网络设备监控
├── build-cache/                   # 构建缓存
│   ├── node_modules.tar.gz       # Node.js 依赖包
│   ├── .next.tar.gz              # Next.js 构建产物
│   └── go-modules.tar.gz         # Go 模块缓存
├── configs/                       # 配置文件
│   ├── .env.offline              # 离线环境变量
│   ├── docker-compose.offline.yml # 离线 Docker Compose
│   ├── database-setup.sql        # 数据库初始化
│   ├── nginx/                    # Nginx 配置
├── scripts/                       # 部署脚本
│   ├── offline-install.sh        # 离线安装主脚本
│   ├── load-images.sh            # Docker 镜像加载
│   ├── setup-database.sh         # 数据库初始化
│   ├── start-services.sh         # 服务启动
│   └── health-check.sh           # 健康检查
├── project-files/                 # 项目源码
│   ├── app/                      # 前端应用代码
│   ├── backend/                  # 后端 API 代码
│   ├── components/               # React 组件
│   └── ...
├── docs/                          # 文档
│   ├── README-OFFLINE.md         # 离线部署说明
│   ├── TROUBLESHOOTING.md        # 故障排查
│   └── API-DOCS.md               # API 文档
└── checksums.txt                  # 文件校验和
```

### 离线安装

#### 传输离线包到目标服务器

**方式一：SCP 传输**
```bash
# 压缩离线包
tar -czf mibweb-offline-$(date +%Y%m%d).tar.gz mibweb-offline-deployment-*/

# 传输到目标服务器
scp mibweb-offline-$(date +%Y%m%d).tar.gz user@target-server:/tmp/
```

**方式二：Rsync 传输（推荐）**
```bash
# 支持断点续传，适合大文件
rsync -avz --progress mibweb-offline-deployment-*/ user@target-server:/opt/mibweb/
```

**方式三：U盘/移动硬盘**
```bash
# 复制到移动存储设备
cp -r mibweb-offline-deployment-* /media/usb-drive/

# 在目标服务器上复制
cp -r /media/usb-drive/mibweb-offline-deployment-* /opt/mibweb/
```

#### 在目标服务器上安装

```bash
# 1. 解压离线包（如果是压缩包）
cd /tmp
tar -xzf mibweb-offline-*.tar.gz

# 2. 进入离线部署目录
cd mibweb-offline-deployment-*/

# 3. 运行离线安装脚本
chmod +x scripts/offline-install.sh
sudo ./scripts/offline-install.sh

# 4. 等待安装完成
# 安装脚本会自动完成以下操作：
# - 检查系统环境
# - 安装 Docker（如果未安装）
# - 加载 Docker 镜像
# - 配置服务
# - 启动应用
```

#### 离线安装选项

```bash
# 显示帮助信息
./scripts/offline-install.sh --help

# 跳过 Docker 安装（如果已安装）
./scripts/offline-install.sh --skip-docker

# 指定安装目录
./scripts/offline-install.sh --install-dir /opt/mibweb

# 指定端口
./scripts/offline-install.sh --port 8080

# 仅加载镜像，不启动服务
./scripts/offline-install.sh --load-only

# 详细输出
./scripts/offline-install.sh --verbose
```

### 跨平台部署

#### 支持的平台

| 平台 | 架构 | 状态 |
|------|------|------|
| Ubuntu 18.04+ | x86_64 | ✅ 完全支持 |
| Ubuntu 20.04+ | x86_64 | ✅ 完全支持 |
| Ubuntu 22.04+ | x86_64 | ✅ 完全支持 |
| Ubuntu 18.04+ | ARM64 | ✅ 完全支持 |
| Ubuntu 20.04+ | ARM64 | ✅ 完全支持 |
| Ubuntu 22.04+ | ARM64 | ✅ 完全支持 |
| CentOS 7+ | x86_64 | ✅ 完全支持 |
| CentOS 8+ | x86_64 | ✅ 完全支持 |
| RHEL 7+ | x86_64 | ✅ 完全支持 |
| Rocky Linux 8+ | x86_64 | ✅ 完全支持 |
| Debian 10+ | x86_64 | ✅ 完全支持 |
| Debian 10+ | ARM64 | ✅ 完全支持 |
| 国产 Linux | x86_64 | ⚠️ 部分支持 |
| ARM64 服务器 | aarch64 | ✅ 完全支持 |
| Apple Silicon | ARM64 | ✅ 完全支持 |

#### 国产 Linux 系统适配

**统信 UOS / 深度 Deepin:**
```bash
# 使用 Debian 兼容模式
./scripts/offline-install.sh --os-type debian
```

**银河麒麟 / 中标麒麟:**
```bash
# 使用 CentOS 兼容模式
./scripts/offline-install.sh --os-type centos
```

**华为 EulerOS:**
```bash
# 使用 RHEL 兼容模式
./scripts/offline-install.sh --os-type rhel
```

---

## 配置管理

### 环境变量配置

#### 主要配置文件

| 文件 | 用途 | 说明 |
|------|------|------|
| `.env` | 主配置文件 | 生产环境配置 |
| `.env.local` | 本地配置 | 开发环境配置 |
| `.env.production` | 生产配置 | 生产环境模板 |
| `.env.example` | 配置模板 | 配置示例 |

#### 核心配置项

```bash
# ==================== 应用配置 ====================
# 应用名称
APP_NAME="MIB Web UI"

# 应用版本
APP_VERSION="1.0.0"

# 运行环境 (development/production)
NODE_ENV=production

# 应用端口
PORT=3000

# 应用域名
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ==================== 数据库配置 ====================
# PostgreSQL 数据库
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=network_monitor
POSTGRES_USER=netmon_user
POSTGRES_PASSWORD=netmon_pass_2024

# 数据库连接池
POSTGRES_MAX_CONNECTIONS=20
POSTGRES_IDLE_TIMEOUT=30000

# ==================== Redis 配置 ====================
# Redis 缓存
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_pass_2024
REDIS_DB=0

# Redis 连接池
REDIS_MAX_CONNECTIONS=10
REDIS_IDLE_TIMEOUT=60000

# ==================== 安全配置 ====================
# JWT 密钥（请修改为随机字符串）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# JWT 过期时间
JWT_EXPIRES_IN=7d

# 密码加密轮数
BCRYPT_ROUNDS=12

# CORS 允许的域名
CORS_ORIGIN=http://localhost:3000

# ==================== SNMP 配置 ====================
# SNMP 默认社区字符串
SNMP_COMMUNITY=public

# SNMP 超时时间（毫秒）
SNMP_TIMEOUT=5000

# SNMP 重试次数
SNMP_RETRIES=3

# ==================== 监控配置 ====================
# Prometheus 指标端口
PROMETHEUS_PORT=9090

# Grafana 端口
GRAFANA_PORT=3001

# AlertManager 端口
ALERTMANAGER_PORT=9093

# ==================== 日志配置 ====================
# 日志级别 (debug/info/warn/error)
LOG_LEVEL=info

# 日志格式 (json/text)
LOG_FORMAT=json

# 日志文件路径
LOG_FILE=/var/log/mibweb/app.log

# ==================== 文件上传配置 ====================
# 最大文件大小（字节）
MAX_FILE_SIZE=10485760  # 10MB

# 允许的文件类型
ALLOWED_FILE_TYPES=.mib,.txt,.json

# 文件存储路径
UPLOAD_PATH=/var/lib/mibweb/uploads

# ==================== 邮件配置 ====================
# SMTP 服务器
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=smtp_password
SMTP_FROM=MIB Web UI <noreply@example.com>

# ==================== 备份配置 ====================
# 备份存储路径
BACKUP_PATH=/var/backups/mibweb

# 备份保留天数
BACKUP_RETENTION_DAYS=30

# 自动备份时间（cron 格式）
BACKUP_SCHEDULE="0 2 * * *"  # 每天凌晨2点
```

### 数据库配置

#### PostgreSQL 优化配置

```sql
-- /etc/postgresql/15/main/postgresql.conf

# 内存配置
shared_buffers = 256MB                # 共享缓冲区
effective_cache_size = 1GB            # 有效缓存大小
work_mem = 4MB                        # 工作内存
maintenance_work_mem = 64MB           # 维护工作内存

# 连接配置
max_connections = 100                 # 最大连接数
listen_addresses = '*'                # 监听地址
port = 5432                          # 端口

# 日志配置
logging_collector = on               # 启用日志收集
log_directory = 'pg_log'             # 日志目录
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d                # 日志轮转时间
log_rotation_size = 100MB            # 日志轮转大小

# 性能配置
checkpoint_completion_target = 0.9   # 检查点完成目标
wal_buffers = 16MB                   # WAL 缓冲区
default_statistics_target = 100      # 统计目标
random_page_cost = 1.1              # 随机页面成本
effective_io_concurrency = 200       # 有效 IO 并发
```

#### Redis 优化配置

```conf
# /etc/redis/redis.conf

# 基本配置
bind 0.0.0.0
port 6379
requirepass redis_pass_2024

# 内存配置
maxmemory 512mb
maxmemory-policy allkeys-lru

# 持久化配置
save 900 1
save 300 10
save 60 10000

# AOF 配置
appendonly yes
appendfsync everysec

# 网络配置
tcp-keepalive 300
timeout 0

# 日志配置
loglevel notice
logfile /var/log/redis/redis-server.log

# 安全配置
protected-mode yes
```

### 安全配置

#### SSL/TLS 配置

**生成自签名证书：**
```bash
# 创建证书目录
sudo mkdir -p /etc/ssl/mibweb

# 生成私钥
sudo openssl genrsa -out /etc/ssl/mibweb/server.key 2048

# 生成证书签名请求
sudo openssl req -new -key /etc/ssl/mibweb/server.key -out /etc/ssl/mibweb/server.csr

# 生成自签名证书
sudo openssl x509 -req -days 365 -in /etc/ssl/mibweb/server.csr -signkey /etc/ssl/mibweb/server.key -out /etc/ssl/mibweb/server.crt

# 设置权限
sudo chmod 600 /etc/ssl/mibweb/server.key
sudo chmod 644 /etc/ssl/mibweb/server.crt
```

**Nginx SSL 配置：**
```nginx
# /etc/nginx/sites-available/mibweb-ssl
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/ssl/mibweb/server.crt;
    ssl_certificate_key /etc/ssl/mibweb/server.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

#### 防火墙配置

**Ubuntu/Debian (UFW):**
```bash
# 启用防火墙
sudo ufw enable

# 允许 SSH
sudo ufw allow ssh

# 允许 HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 允许应用端口
sudo ufw allow 3000/tcp

# 查看状态
sudo ufw status
```

**CentOS/RHEL (firewalld):**
```bash
# 启动防火墙
sudo systemctl start firewalld
sudo systemctl enable firewalld

# 允许 HTTP/HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# 允许应用端口
sudo firewall-cmd --permanent --add-port=3000/tcp

# 重载配置
sudo firewall-cmd --reload

# 查看状态
sudo firewall-cmd --list-all
```

### 性能优化

#### 系统级优化

```bash
# /etc/sysctl.conf

# 网络优化
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.core.netdev_max_backlog = 5000

# 文件描述符限制
fs.file-max = 65536

# 内存优化
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5

# 应用生效
sudo sysctl -p
```

#### Docker 优化

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ],
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 65536,
      "Soft": 65536
    }
  }
}
```

---

## 运维管理

### 服务管理

#### 系统服务控制

```bash
# 查看服务状态
sudo systemctl status mibweb

# 启动服务
sudo systemctl start mibweb

# 停止服务
sudo systemctl stop mibweb

# 重启服务
sudo systemctl restart mibweb

# 重载配置
sudo systemctl reload mibweb

# 开机自启动
sudo systemctl enable mibweb

# 禁用自启动
sudo systemctl disable mibweb

# 查看服务日志
sudo journalctl -u mibweb -f
```

#### Docker 服务管理

```bash
# 查看容器状态
docker-compose ps

# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启特定服务
docker-compose restart frontend

# 查看服务日志
docker-compose logs -f frontend

# 进入容器
docker-compose exec frontend bash

# 更新镜像
docker-compose pull
docker-compose up -d
```

#### 健康检查

```bash
# 运行健康检查脚本
./health-check.sh

# 持续监控（每60秒检查一次）
./health-check.sh --interval 60 --count 0

# JSON 格式输出
./health-check.sh --json

# 检查特定服务
./health-check.sh --service frontend
./health-check.sh --service database
./health-check.sh --service redis
```

### 监控告警

#### Prometheus 监控配置

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
    - static_configs:
        - targets:

scrape_configs:
  - job_name: 'mibweb-frontend'
    static_configs:
      - targets: ['frontend:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 30s

  - job_name: 'mibweb-backend'
    static_configs:
      - targets: ['backend:8080']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

#### 告警规则配置

```yaml
# alert_rules.yml
groups:
  - name: mibweb_alerts
    rules:
      - alert: HighCPUUsage
        expr: cpu_usage_percent > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is above 80% for more than 5 minutes"

      - alert: HighMemoryUsage
        expr: memory_usage_percent > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 85% for more than 5 minutes"

      - alert: DatabaseConnectionFailed
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failed"
          description: "Cannot connect to PostgreSQL database"

      - alert: RedisConnectionFailed
        expr: up{job="redis"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Redis connection failed"
          description: "Cannot connect to Redis cache"

      - alert: ApplicationDown
        expr: up{job="mibweb-frontend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Application is down"
          description: "MIB Web UI application is not responding"
```

#### AlertManager 配置

```yaml
global:
  smtp_smarthost: 'smtp.example.com:587'
  smtp_from: 'alerts@example.com'
  smtp_auth_username: 'alerts@example.com'
  smtp_auth_password: 'password'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
  - name: 'web.hook'
    email_configs:
      - to: 'admin@example.com'
        subject: 'MIB Web UI Alert: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}
    webhook_configs:
      - url: 'http://localhost:3000/api/webhooks/alerts'
        send_resolved: true
```

### 备份恢复

#### 自动备份脚本

```bash
#!/bin/bash
# backup.sh

set -e

# 配置
BACKUP_DIR="/var/backups/mibweb"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# 创建备份目录
mkdir -p "$BACKUP_DIR"

echo "Starting backup at $(date)"

# 备份数据库
echo "Backing up PostgreSQL database..."
docker-compose exec -T postgres pg_dump -U netmon_user network_monitor | gzip > "$BACKUP_DIR/database_$DATE.sql.gz" # DB name and user verified

# 备份 Redis 数据
echo "Backing up Redis data..."
docker-compose exec -T redis redis-cli --rdb /tmp/dump.rdb
docker cp $(docker-compose ps -q redis):/tmp/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb"

# 备份配置文件
echo "Backing up configuration files..."

# 备份上传文件
echo "Backing up uploaded files..."
if [ -d "uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" uploads/
fi

# 清理旧备份
echo "Cleaning up old backups..."
find "$BACKUP_DIR" -name "*.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.rdb" -mtime +$RETENTION_DAYS -delete

echo "Backup completed at $(date)"
echo "Backup files saved to: $BACKUP_DIR"
ls -la "$BACKUP_DIR" | grep "$DATE"
```

#### 恢复脚本

```bash
#!/bin/bash
# restore.sh

set -e

if [ $# -ne 1 ]; then
    echo "Usage: $0 <backup_date>"
    echo "Example: $0 20241201_143000"
    exit 1
fi

BACKUP_DATE=$1
BACKUP_DIR="/var/backups/mibweb"

echo "Starting restore from backup: $BACKUP_DATE"

# 停止服务
echo "Stopping services..."
docker-compose down

# 恢复数据库
if [ -f "$BACKUP_DIR/database_$BACKUP_DATE.sql.gz" ]; then
    echo "Restoring PostgreSQL database..."
    docker-compose up -d postgres
    sleep 10
    gunzip -c "$BACKUP_DIR/database_$BACKUP_DATE.sql.gz" | docker-compose exec -T postgres psql -U netmon_user -d network_monitor # DB name and user verified
fi

# 恢复 Redis 数据
if [ -f "$BACKUP_DIR/redis_$BACKUP_DATE.rdb" ]; then
    echo "Restoring Redis data..."
    docker-compose up -d redis
    sleep 5
    docker cp "$BACKUP_DIR/redis_$BACKUP_DATE.rdb" $(docker-compose ps -q redis):/data/dump.rdb
    docker-compose restart redis
fi

# 恢复配置文件
if [ -f "$BACKUP_DIR/config_$BACKUP_DATE.tar.gz" ]; then
    echo "Restoring configuration files..."
    tar -xzf "$BACKUP_DIR/config_$BACKUP_DATE.tar.gz"
fi

# 恢复上传文件
if [ -f "$BACKUP_DIR/uploads_$BACKUP_DATE.tar.gz" ]; then
    echo "Restoring uploaded files..."
    tar -xzf "$BACKUP_DIR/uploads_$BACKUP_DATE.tar.gz"
fi

# 启动所有服务
echo "Starting all services..."
docker-compose up -d

echo "Restore completed successfully!"
echo "Please verify the application is working correctly."
```

#### 设置定时备份

```bash
# 添加到 crontab
crontab -e

# 每天凌晨 2 点执行备份
0 2 * * * /opt/mibweb/backup.sh >> /var/log/mibweb-backup.log 2>&1

# 每周日凌晨 3 点执行完整备份
0 3 * * 0 /opt/mibweb/backup-full.sh >> /var/log/mibweb-backup-full.log 2>&1
```

### 故障排查

#### 常见问题诊断

**1. 应用无法启动**
```bash
# 检查 Docker 服务
sudo systemctl status docker

# 检查容器状态
docker-compose ps

# 查看容器日志
docker-compose logs frontend
docker-compose logs backend
docker-compose logs postgres
docker-compose logs redis

# 检查端口占用
sudo netstat -tlnp | grep :3000

# 检查磁盘空间
df -h

# 检查内存使用
free -h
```

**2. 数据库连接失败**
```bash
# 检查 PostgreSQL 容器
docker-compose exec postgres pg_isready -U netmon_user

# 检查数据库连接
docker-compose exec postgres psql -U netmon_user -d network_monitor -c "SELECT version();"

# 查看数据库日志
docker-compose logs postgres

# 检查数据库配置
docker-compose exec postgres cat /var/lib/postgresql/data/postgresql.conf
```

**3. Redis 连接失败**
```bash
# 检查 Redis 容器
docker-compose exec redis redis-cli ping

# 使用密码连接
docker-compose exec redis redis-cli -a redis_pass_2024 ping

# 查看 Redis 日志
docker-compose logs redis

# 检查 Redis 配置
docker-compose exec redis cat /usr/local/etc/redis/redis.conf
```

**4. 前端页面无法访问**
```bash
# 检查前端容器
docker-compose exec frontend curl -f http://localhost:3000/api/health

# 查看前端日志
docker-compose logs frontend

# 检查 Nginx 配置（如果使用）
nginx -t
sudo systemctl status nginx

# 检查防火墙
sudo ufw status
sudo firewall-cmd --list-all
```

#### 性能问题诊断

```bash
# 系统资源监控
top
htop
iotop

# 容器资源使用
docker stats

# 数据库性能
docker-compose exec postgres psql -U netmon_user -d network_monitor -c "SELECT * FROM pg_stat_activity;"

# Redis 性能
docker-compose exec redis redis-cli -a redis_pass_2024 info stats

# 网络连接
ss -tlnp
netstat -tlnp
```

#### 日志分析

```bash
# 应用日志
tail -f /var/log/mibweb/app.log

# 系统日志
sudo journalctl -f

# Docker 日志
docker-compose logs -f --tail=100

# Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 数据库日志
docker-compose exec postgres tail -f /var/lib/postgresql/data/log/postgresql-*.log
```

---

## 附录

### 常见问题

#### Q1: 如何修改默认端口？

**A:** 编辑 `.env` 文件中的 `PORT` 变量，然后重启服务：
```bash
# 编辑配置
vim .env
# PORT=8080

# 重启服务
docker-compose down
docker-compose up -d
```

#### Q2: 如何重置管理员密码？

**A:** 使用数据库命令重置：
```bash
# 进入数据库容器
docker-compose exec postgres psql -U netmon_user -d network_monitor

# 重置密码（密码：admin123）
UPDATE users SET password = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO8u' WHERE username = 'admin';
```

#### Q3: 如何启用 HTTPS？

**A:** 使用 SSL 部署选项：
```bash
# 自动部署时启用 SSL
./deploy-ubuntu.sh --ssl --domain your-domain.com

# 手动配置 SSL
# 1. 生成证书
# 2. 配置 Nginx
# 3. 更新 .env 文件
```

#### Q4: 如何备份和恢复数据？

**A:** 使用备份脚本：
```bash
# 创建备份
./backup.sh

# 恢复备份
./restore.sh 20241201_143000
```

#### Q5: 如何扩展到多台服务器？

**A:** 使用 Docker Swarm 或 Kubernetes：
```bash
# Docker Swarm 模式
docker swarm init
docker stack deploy -c docker-compose.swarm.yml mibweb

# Kubernetes 部署
kubectl apply -f k8s/
```

### 端口说明

| 端口 | 服务 | 说明 |
|------|------|------|
| 3000 | 前端应用 | Web UI 主界面 |
| 8080 | 后端 API | REST API 服务 |
| 5432 | PostgreSQL | 数据库服务 |
| 6379 | Redis | 缓存服务 |
| 80 | HTTP | Web 服务（生产环境） |
| 443 | HTTPS | 安全 Web 服务 |

### 目录结构

```
mibweb-ui/
├── app/                          # Next.js 应用目录
│   ├── api/                     # API 路由
│   ├── components/              # React 组件
│   └── pages/                   # 页面组件
├── backend/                      # Go 后端服务
│   ├── controllers/             # 控制器
│   ├── models/                  # 数据模型
│   ├── services/                # 业务逻辑
│   └── utils/                   # 工具函数
├── components/                   # 共享组件
│   ├── ui/                      # UI 组件
│   └── forms/                   # 表单组件
├── configs/                      # 配置文件
│   ├── nginx/                   # Nginx 配置
├── database/                     # 数据库相关
│   ├── migrations/              # 数据库迁移
│   └── seeds/                   # 初始数据
├── docs/                         # 文档
├── scripts/                      # 部署脚本
│   ├── deploy-ubuntu.sh         # Ubuntu 部署脚本
│   ├── deploy-centos.sh         # CentOS 部署脚本
│   ├── backup.sh                # 备份脚本
│   └── restore.sh               # 恢复脚本
├── docker-compose.yml           # Docker Compose 配置
├── docker-compose.prod.yml      # 生产环境配置
├── docker-compose.dev.yml       # 开发环境配置
├── Dockerfile                    # Docker 镜像构建
├── .env.example                 # 环境变量模板
└── README.md                    # 项目说明
```

### 更新升级

#### 版本更新流程

```bash
# 1. 备份当前版本
./backup.sh

# 2. 停止服务
docker-compose down

# 3. 更新代码
git pull origin main

# 4. 更新镜像
docker-compose pull

# 5. 运行数据库迁移（如果需要）
docker-compose run --rm backend npx prisma migrate deploy # For production, or `npx prisma migrate dev` if that's the flow

# 6. 启动服务
docker-compose up -d

# 7. 验证更新
./health-check.sh
```

#### 回滚操作

```bash
# 如果更新失败，回滚到之前版本
git checkout <previous-version-tag>
docker-compose down
docker-compose up -d

# 或者恢复备份
./restore.sh <backup-date>
```

---

## 🎉 部署完成

恭喜！您已经成功部署了 MIB Web UI 监控系统。

### 下一步操作

1. **访问系统**: 打开浏览器访问 `http://your-server-ip:3000`
2. **登录系统**: 使用默认账号 `admin` / `admin123`
3. **修改密码**: 首次登录后请立即修改默认密码
4. **配置监控**: 添加需要监控的网络设备
5. **设置告警**: 配置告警规则和通知方式

### 获取帮助

- 📖 [在线文档](https://docs.example.com)
- 🐛 [问题反馈](https://github.com/your-repo/issues)
- 💬 [社区讨论](https://github.com/your-repo/discussions)
- 📧 [技术支持](mailto:support@example.com)

### 贡献代码

欢迎提交 Pull Request 和 Issue，让我们一起完善这个项目！

---