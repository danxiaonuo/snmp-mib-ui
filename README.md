# SNMP MIB 监控平台 (SQLite版本)

SNMP MIB监控平台是一个轻量级网络设备监控和管理解决方案，采用SQLite数据库和内存缓存，支持零配置快速部署。

## ✨ 特性

- 🗃️ **SQLite数据库** - 无需外部数据库，文件存储
- 💾 **内存缓存** - 高性能缓存系统，无需Redis
- 🚀 **零配置部署** - 一键启动，无需Docker
- 📱 **响应式设计** - 支持桌面和移动设备
- 🌐 **多语言支持** - 中文/英文界面
- 🔒 **安全认证** - JWT认证和权限管理
- 📊 **实时监控** - SNMP设备监控和告警
- 🔧 **配置管理** - 设备模板和批量配置

## 🎯 系统要求

- **操作系统**: Linux/macOS/Windows
- **Node.js**: 18+ 
- **Go**: 1.21+
- **内存**: 最低512MB，推荐1GB+
- **磁盘**: 最低1GB可用空间

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/evan7434/snmp-mib-ui.git
cd snmp-mib-ui
```

### 2. 一键部署

```bash
# 运行部署脚本
./deploy-simple.sh

# 启动服务
./start.sh

# 查看服务状态
./status.sh
```

### 3. 访问应用

- **前端界面**: http://localhost:12300
- **后端API**: http://localhost:17880
- **健康检查**: http://localhost:12300/api/health

## 📁 目录结构

```
snmp-mib-ui/
├── app/              # Next.js 前端应用
├── backend/          # Go 后端服务
├── components/       # React 组件
├── lib/              # 共享库和工具
├── data/             # SQLite 数据库文件
├── logs/             # 应用日志
├── start.sh          # 启动脚本
├── stop.sh           # 停止脚本
└── status.sh         # 状态检查脚本
```

## 🔧 管理命令

```bash
# 启动所有服务
./start.sh

# 停止所有服务
./stop.sh

# 检查服务状态
./status.sh

# 查看前端日志
tail -f logs/frontend.log

# 查看后端日志
tail -f logs/backend.log

# 重启服务
./stop.sh && ./start.sh
```

## 📊 性能优化

### 数据库优化
- SQLite WAL模式，提高并发性能
- 自动索引优化
- 定期数据清理

### 缓存策略
- 内存LRU缓存
- 智能过期策略
- 缓存预热机制

### 前端优化
- 代码分割和懒加载
- 静态资源压缩
- Service Worker缓存

## 🐛 故障排除

### 常见问题

1. **服务启动失败**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :12300
   netstat -tulpn | grep :17880
   
   # 检查日志
   tail -f logs/frontend.log
   tail -f logs/backend.log
   ```

2. **数据库连接错误**
   ```bash
   # 检查数据库文件权限
   ls -la data/snmp_platform.db
   
   # 重新初始化数据库
   rm -f data/snmp_platform.db
   ./start.sh
   ```

3. **内存不足**
   ```bash
   # 检查内存使用
   free -h
   
   # 清理缓存
   curl -X POST http://localhost:17880/api/cache/clear
   ```

### 日志级别

- **DEBUG**: 详细调试信息
- **INFO**: 一般运行信息
- **WARN**: 警告信息
- **ERROR**: 错误信息

## 🔒 安全配置

### 生产环境建议

1. **修改默认端口**
   ```bash
   export FRONTEND_PORT=8080
   export SERVER_PORT=8081
   ```

2. **启用HTTPS**
   - 配置反向代理 (Nginx/Apache)
   - 使用SSL证书

3. **防火墙配置**
   ```bash
   # 只允许必要端口
   ufw allow 12300
   ufw allow 17880
   ```

4. **数据备份**
   ```bash
   # 定期备份数据库
   cp data/snmp_platform.db backup/snmp_platform_$(date +%Y%m%d).db
   ```

## 📈 监控和维护

### 系统监控

```bash
# 检查系统资源
curl http://localhost:17880/api/system/health

# 查看缓存统计
curl http://localhost:17880/api/cache/stats

# 数据库统计
curl http://localhost:17880/api/database/stats
```

### 定期维护

1. **清理日志文件**
   ```bash
   # 清理7天前的日志
   find logs/ -name "*.log" -mtime +7 -delete
   ```

2. **数据库优化**
   ```bash
   # SQLite优化
   sqlite3 data/snmp_platform.db "VACUUM;"
   sqlite3 data/snmp_platform.db "ANALYZE;"
   ```

3. **更新检查**
   ```bash
   git pull origin main
   ./deploy-simple.sh
   ```

## 🎨 自定义配置

### 环境变量

```bash
# 数据库配置
export SQLITE_DB_PATH=./data/snmp_platform.db

# 服务端口
export FRONTEND_PORT=12300
export SERVER_PORT=17880

# 缓存配置
export CACHE_MAX_MEMORY=256  # MB
export CACHE_TTL=3600        # 秒

# 日志配置
export LOG_LEVEL=INFO
export LOG_FILE=./logs/app.log
```

### 主题自定义

编辑 `app/globals.css` 文件来自定义主题颜色和样式。

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📝 更新日志

### v2.0.0 (2024-12-25)
- ✅ 移除PostgreSQL依赖，改用SQLite
- ✅ 移除Redis依赖，改用内存缓存
- ✅ 简化部署流程，支持一键启动
- ✅ 优化性能和资源使用
- ✅ 完善错误处理和日志记录

### v1.x.x
- 基于PostgreSQL + Redis的版本

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

- 🐛 **Bug报告**: [GitHub Issues](https://github.com/evan7434/snmp-mib-ui/issues)
- 💡 **功能请求**: [GitHub Discussions](https://github.com/evan7434/snmp-mib-ui/discussions)
- 📧 **邮件支持**: evan@example.com

---

⭐ 如果这个项目对你有帮助，请给它一个星标！