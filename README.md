# 🌐 SNMP MIB 监控平台 (SQLite版本)

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Go](https://img.shields.io/badge/Go-1.23-00ADD8.svg)](https://golang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57.svg)](https://sqlite.org/)
[![Production Ready](https://img.shields.io/badge/Production-Ready-success.svg)](#)

**[🇨🇳 中文](README.md) | [🇺🇸 English](README_EN.md)**

</div>

> 🚀 **企业级SNMP网络设备监控管理平台** - 轻量级网络设备监控和管理解决方案，采用SQLite数据库和内存缓存，支持零配置快速部署，无需Docker和外部数据库依赖。

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

### 📋 系统要求

- **操作系统**: Linux/macOS/Windows
- **Node.js**: 18+ 
- **Go**: 1.21+
- **内存**: 最低512MB，推荐1GB+
- **磁盘**: 最低1GB可用空间

### 1. 克隆项目

```bash
git clone https://github.com/evan7434/snmp-mib-ui.git
cd snmp-mib-ui
```

### 2. 一键部署

```bash
# 方式一：简化部署（推荐）
./deploy-simple.sh

# 方式二：无Docker部署
./deploy-local-no-docker.sh

# 方式三：systemd服务部署
sudo ./install-systemd-services.sh
```

### 3. 服务管理

```bash
# 启动服务
./start-services.sh

# 停止服务
./stop-services.sh

# 查看服务状态
systemctl status snmp-mib-platform.target
```

### 4. 访问应用

| 服务 | URL | 描述 |
|------|-----|------|
| 🌐 **Web界面** | http://localhost:12300 | 主要管理界面 |
| 🔌 **API接口** | http://localhost:17880/api/v1 | RESTful API |
| 🏥 **健康检查** | http://localhost:12300/api/health | 系统状态检查 |

## 📖 功能模块

### 🎛️ 核心功能模块

#### 📊 设备管理 (`/devices`)
- **设备发现**: 自动扫描发现网络中的SNMP设备，支持IP范围扫描
- **设备注册**: 手动添加设备和批量导入，支持Excel/CSV格式
- **状态监控**: 实时显示设备在线状态和关键指标
- **分组管理**: 按网段、类型、厂商或用途对设备进行分组
- **厂商支持**: 专门优化支持Cisco、华为、H3C、Juniper等主流设备

#### 📁 MIB管理 (`/mibs`)
- **文件上传**: 支持拖拽上传MIB文件，自动解析MIB树结构
- **解析验证**: 自动解析MIB文件并验证语法正确性
- **OID浏览器**: 树状结构显示OID层级关系，支持搜索和过滤
- **多厂商MIB**: 内置Cisco、华为、H3C等厂商的标准MIB库

#### ⚙️ 配置生成 (`/config-gen`)
- **SNMP Exporter配置**: 自动生成不同厂商的监控配置
- **Categraf配置**: 生成夜莺监控采集器配置文件
- **Prometheus配置**: 生成Prometheus抓取任务配置
- **告警规则**: 根据设备类型生成对应的告警规则模板
- **配置验证**: 内置配置语法检查和最佳实践建议

#### 🚨 告警管理 (`/alert-rules`)
- **规则编辑器**: 可视化PromQL规则编写，支持语法高亮
- **多系统部署**: 支持Prometheus、VMAlert、Alertmanager的告警规则部署
- **通知配置**: 支持邮件、钉钉、企业微信、Slack等通知方式
- **告警模板**: 提供网络设备常用告警规则模板库
- **批量操作**: 支持批量启用/禁用告警规则

#### 🔧 监控安装器 (`/monitoring-installer`)
- **组件管理**: 管理Node Exporter、SNMP Exporter、Categraf等监控组件
- **远程部署**: 通过SSH自动部署监控组件到远程主机
- **配置同步**: 自动同步监控配置到目标主机
- **服务状态**: 实时监控已部署组件的运行状态
- **版本管理**: 支持监控组件版本升级和回滚

#### 🛠️ 批量操作 (`/tools/bulk-ops`)
- **批量配置**: 批量修改设备SNMP配置信息
- **批量部署**: 批量部署监控配置到多个设备
- **批量测试**: 批量测试设备连通性和SNMP可用性
- **操作日志**: 完整的批量操作日志和结果跟踪

#### 📈 实时监控 (`/monitoring`)
- **指标查询**: 实时查询设备监控指标数据
- **图表展示**: 动态图表展示设备性能趋势
- **阈值告警**: 自定义指标阈值和告警条件
- **数据导出**: 支持监控数据CSV/JSON格式导出

## 📁 项目结构

```
snmp-mib-ui/
├── app/                    # Next.js 应用目录
│   ├── api/               # API路由
│   ├── devices/           # 设备管理页面
│   ├── mibs/              # MIB管理页面
│   ├── config-gen/        # 配置生成页面
│   ├── alert-rules/       # 告警规则页面
│   ├── monitoring-installer/ # 监控安装器页面
│   ├── tools/             # 工具页面
│   └── monitoring/        # 实时监控页面
├── backend/               # Go 后端服务
│   ├── controllers/       # 控制器
│   ├── models/           # 数据模型
│   ├── services/         # 业务逻辑
│   └── utils/            # 工具函数
├── components/            # 共享组件
├── lib/                  # 工具库
├── systemd/              # systemd服务配置
├── data/                 # SQLite 数据库文件
├── logs/                 # 应用日志
├── deploy-simple.sh      # 简化部署脚本
├── start-services.sh     # 启动脚本
├── stop-services.sh      # 停止脚本
└── install-systemd-services.sh # systemd安装脚本
```

## 🔧 服务管理

### 脚本方式管理

```bash
# 启动所有服务
./start-services.sh

# 停止所有服务
./stop-services.sh

# 查看前端日志
tail -f frontend.log

# 查看后端日志
tail -f backend.log

# 重启服务
./stop-services.sh && ./start-services.sh
```

### systemd服务管理

```bash
# 安装systemd服务
sudo ./install-systemd-services.sh

# 启动平台服务
sudo systemctl start snmp-mib-platform.target

# 停止平台服务
sudo systemctl stop snmp-mib-platform.target

# 查看服务状态
sudo systemctl status snmp-mib-platform.target

# 查看各组件状态
sudo systemctl status snmp-mib-backend.service
sudo systemctl status snmp-mib-frontend.service

# 开机自启
sudo systemctl enable snmp-mib-platform.target

# 查看服务日志
sudo journalctl -u snmp-mib-backend.service -f
sudo journalctl -u snmp-mib-frontend.service -f
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