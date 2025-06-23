# SNMP MIB 监控平台 - 快速启动指南

## 🚀 一键启动（推荐）

### 方式一：使用优化启动脚本

```bash
# 进入项目目录
cd /etc/opt/snmp-mib-ui

# 一键启动（包含依赖检查、构建、启动）
./start-optimized.sh
```

### 方式二：使用生产部署脚本

```bash
# 进入项目目录
cd /etc/opt/snmp-mib-ui

# 生产环境部署
./deploy-production.sh
```

## 🛠️ 手动启动步骤

### 1. 系统要求确认

```bash
# 检查 Node.js (需要 16+)
node --version

# 检查 Go (需要 1.22+)
go version
```

### 2. 准备后端

```bash
cd backend

# 构建后端（如果没有二进制文件）
go build -o mib-platform .

# 设置环境变量
export ENVIRONMENT=production
export SERVER_PORT=17880
export JWT_SECRET=snmp-mib-platform-jwt-secret-2024

# 创建必要目录
mkdir -p uploads data

# 启动后端
./mib-platform &
```

### 3. 准备前端

```bash
# 返回根目录
cd ..

# 安装依赖（如果没有 node_modules）
npm install

# 构建前端（如果没有 .next 目录）
export NEXT_PUBLIC_API_URL=http://localhost:17880/api/v1
npm run build

# 启动前端
npm run start &
```

## 🔍 验证启动

### 检查服务状态

```bash
# 检查进程
ps aux | grep -E "(mib-platform|next)" | grep -v grep

# 检查端口
netstat -tlnp | grep -E "(17880|12300)"

# 检查数据库文件
ls -la backend/snmp_platform.db
```

### 健康检查

```bash
# 后端 API
curl http://localhost:17880/health

# 前端页面
curl http://localhost:12300
```

## 🌐 访问地址

- **Web界面**: http://localhost:12300
- **API接口**: http://localhost:17880/api/v1  
- **健康检查**: http://localhost:17880/health

## 🛑 停止服务

```bash
# 使用停止脚本
./stop-services.sh

# 或手动停止
pkill -f "mib-platform|next"
```

## 📁 重要文件位置

### 数据文件
- **SQLite数据库**: `backend/snmp_platform.db`
- **上传文件**: `backend/uploads/`
- **日志文件**: `backend.log`, `frontend.log`

### 配置文件  
- **后端配置**: `backend/config/`
- **前端配置**: `next.config.mjs`

### 脚本文件
- **优化启动**: `start-optimized.sh`
- **停止服务**: `stop-services.sh`
- **生产部署**: `deploy-production.sh`

## 🐛 故障排除

### 1. 端口被占用

```bash
# 查看占用端口的进程
lsof -i :17880
lsof -i :12300

# 停止相关进程
./stop-services.sh
```

### 2. 构建失败

```bash
# 清理依赖并重新构建
cd backend
go clean -modcache
go mod tidy
go build -o mib-platform .

# 前端重新构建
cd ..
rm -rf node_modules .next
npm install
npm run build
```

### 3. 数据库问题

```bash
# 删除数据库文件（重置所有数据）
rm -f backend/snmp_platform.db

# 重新启动让系统自动创建
./start-optimized.sh
```

### 4. 查看详细日志

```bash
# 后端日志
tail -f backend.log

# 前端日志  
tail -f frontend.log

# 实时查看启动过程
./start-optimized.sh | tee startup.log
```

## ⚡ 性能优化

### 数据库优化
- SQLite数据库文件会自动增长
- 定期备份：`cp backend/snmp_platform.db backup_$(date +%Y%m%d).db`
- 压缩备份：`sqlite3 backend/snmp_platform.db 'VACUUM;'`

### 系统优化
- 确保有足够磁盘空间用于日志和数据库
- 定期清理老旧日志文件
- 考虑使用 systemd 服务进行生产环境部署

## 🔧 高级配置

### 环境变量

```bash
# 生产环境
export ENVIRONMENT=production
export SERVER_PORT=17880
export JWT_SECRET=your-secure-secret-key
export UPLOAD_PATH=./uploads

# 开发环境
export ENVIRONMENT=development
export SERVER_PORT=17880
export JWT_SECRET=dev-secret
```

### systemd 服务（生产环境推荐）

```bash
# 安装 systemd 服务
sudo ./deploy.sh --systemd

# 服务管理
sudo systemctl start snmp-mib-platform.target
sudo systemctl stop snmp-mib-platform.target
sudo systemctl restart snmp-mib-platform.target
sudo systemctl status snmp-mib-platform.target
```

---

## 📞 支持

如果遇到问题：

1. 查看 [故障排除](#-故障排除) 部分
2. 检查 `backend.log` 和 `frontend.log` 日志文件
3. 确认系统要求是否满足
4. 尝试重新构建和启动

🎉 **祝您使用愉快！**