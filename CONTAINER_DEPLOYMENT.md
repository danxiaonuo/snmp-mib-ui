# MIB Web UI 容器化部署指南

## 概述

本项目已完全容器化，避免了复杂的二进制部署，提供了简单、可靠的部署方式。

## 快速开始

### 1. 一键启动（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd snmp-mib-platform

# 一键启动
./quick-start.sh
```

### 2. 手动部署

#### 生产环境部署

```bash
# 使用部署脚本
./scripts/docker-deploy.sh prod

# 或直接使用 docker-compose
docker-compose up -d --build
```

#### 开发环境部署

```bash
# 使用部署脚本
./scripts/docker-deploy.sh dev

# 或直接使用 docker-compose
docker-compose -f docker-compose.dev.yml up -d --build
```

## 服务访问

部署完成后，可以通过以下地址访问服务：

- **前端界面**: http://localhost:12300
- **后端API**: http://localhost:17880
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 部署架构

### 生产环境 (docker-compose.yml)
- **前端**: Next.js 应用，多阶段构建优化
- **后端**: Go API 服务
- **数据库**: PostgreSQL 15
- **缓存**: Redis 7
- **资源限制**: 已配置内存限制

### 开发环境 (docker-compose.dev.yml)
- **前端**: Next.js 开发模式，支持热重载
- **后端**: Go 开发模式
- **数据库**: PostgreSQL 15
- **缓存**: Redis 7
- **卷挂载**: 支持代码实时更新

## 容器优化特性

### 前端容器优化
- ✅ 多阶段构建，减小镜像体积
- ✅ Node.js 20 Alpine 基础镜像
- ✅ 生产依赖分离
- ✅ 非root用户运行
- ✅ 健康检查
- ✅ 资源限制

### 后端容器优化
- ✅ Go 静态编译
- ✅ Alpine 基础镜像
- ✅ 多架构支持
- ✅ 非root用户运行
- ✅ 健康检查
- ✅ 资源限制

## 常用命令

### 服务管理

```bash
# 启动服务
./scripts/docker-deploy.sh prod

# 停止服务
./scripts/docker-deploy.sh stop

# 重启服务
./scripts/docker-deploy.sh restart

# 查看状态
./scripts/docker-deploy.sh status

# 查看日志
./scripts/docker-deploy.sh logs

# 清理容器
./scripts/docker-deploy.sh cleanup
```

### Docker Compose 命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重新构建
docker-compose build --no-cache

# 进入容器
docker-compose exec frontend sh
docker-compose exec backend sh

# 查看资源使用
docker stats
```

## 环境变量配置

### 前端环境变量
```env
NODE_ENV=production
DATABASE_URL=postgresql://netmon_user:netmon_pass_2024@postgres:5432/network_monitor
REDIS_URL=redis://:redis_pass_2024@redis:6379
NEXTAUTH_SECRET=mibweb_secret_key_2024_very_secure
NEXTAUTH_URL=http://localhost:12300
API_BASE_URL=http://backend:8080
NEXT_PUBLIC_BACKEND_URL=http://localhost:17880
NEXT_PUBLIC_API_URL=http://localhost:17880/api/v1
```

### 后端环境变量
```env
ENVIRONMENT=production
PORT=8080
DATABASE_URL=postgresql://netmon_user:netmon_pass_2024@postgres:5432/network_monitor
REDIS_URL=redis://:redis_pass_2024@redis:6379
JWT_SECRET=jwt_secret_key_2024_very_secure
CORS_ORIGINS=http://localhost:12300
```

## 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :12300
   netstat -tulpn | grep :17880
   
   # 修改 docker-compose.yml 中的端口映射
   ```

2. **容器启动失败**
   ```bash
   # 查看详细日志
   docker-compose logs frontend
   docker-compose logs backend
   
   # 重新构建
   docker-compose build --no-cache
   ```

3. **数据库连接失败**
   ```bash
   # 检查数据库状态
   docker-compose exec postgres pg_isready -U netmon_user
   
   # 查看数据库日志
   docker-compose logs postgres
   ```

4. **内存不足**
   ```bash
   # 查看资源使用
   docker stats
   
   # 调整 docker-compose.yml 中的资源限制
   ```

### 健康检查

所有服务都配置了健康检查：

```bash
# 检查所有服务健康状态
docker-compose ps

# 手动测试健康检查
curl http://localhost:12300/api/health
curl http://localhost:17880/health
```

## 生产部署建议

### 安全配置
1. 修改默认密码
2. 配置 HTTPS
3. 设置防火墙规则
4. 定期更新镜像

### 监控配置
1. 配置日志收集
2. 设置资源监控
3. 配置告警规则

### 备份策略
1. 数据库定期备份
2. 配置文件备份
3. 容器镜像备份

## 开发指南

### 本地开发

```bash
# 启动开发环境
./scripts/docker-deploy.sh dev

# 前端热重载已启用
# 后端需要重新构建容器来更新代码
```

### 调试

```bash
# 进入前端容器
docker-compose exec frontend-dev sh

# 进入后端容器
docker-compose exec backend-dev sh

# 查看实时日志
docker-compose -f docker-compose.dev.yml logs -f
```

## 版本更新

```bash
# 拉取最新代码
git pull

# 重新构建并启动
./scripts/docker-deploy.sh prod
```

## 支持

如有问题，请查看：
1. 项目文档
2. GitHub Issues
3. 容器日志
4. 健康检查状态