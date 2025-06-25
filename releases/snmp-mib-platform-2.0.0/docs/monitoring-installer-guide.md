<!-- WARNING: This guide may contain outdated information or references to components/scripts not directly part of the main mib-web-ui repository. It requires review and updates to align with the current project's monitoring deployment strategy, which primarily uses Docker Compose and potentially a UI-based installer feature. -->
# 监控安装器完整使用手册

## 📖 目录

1. [系统概述](#系统概述)
2. [组件详解](#组件详解)
3. [部署模式](#部署模式)
4. [安装指南](#安装指南)
5. [配置说明](#配置说明)
6. [故障排除](#故障排除)
7. [最佳实践](#最佳实践)
8. [API参考](#api参考)

## 🎯 系统概述

监控安装器是一个智能化的监控系统部署工具，支持一键部署完整的监控解决方案。系统基于VictoriaMetrics生态，提供单机和集群两种部署模式，适用于从小型项目到企业级应用的各种场景。

### 核心特性

- 🚀 **一键部署**: 自动化安装和配置所有监控组件
- 🎨 **可视化界面**: 直观的Web界面，无需命令行操作
- 🔧 **智能配置**: 根据环境自动生成最优配置
- 📊 **多种模板**: 预置多种监控方案模板
- 🔄 **动态扩容**: 支持集群模式的水平扩展
- 🛡️ **高可用**: 企业级高可用部署方案

## 🧩 组件详解

### 数据收集层

#### Node Exporter 🏥
**角色**: 系统体检医生

**功能说明**:
- 收集Linux/Windows主机的硬件和操作系统指标
- 监控CPU、内存、磁盘、网络等系统资源
- 通过HTTP接口暴露指标数据

**技术规格**:
- 默认端口: 9100
- 支持1000+种指标类型
- 内存占用: 通常 < 50MB
- CPU占用: < 1%

**配置要点**:
```yaml
# 启用特定收集器
--collector.systemd
--collector.processes
--collector.tcpstat

# 禁用不需要的收集器
--no-collector.arp
--no-collector.netdev
```

#### Categraf 🕵️
**角色**: 万能侦探

**功能说明**:
- 全能型指标采集器，支持200+种数据源
- 插件化架构，配置简单
- 可替代多种专用Exporter

**支持的数据源**:
- 数据库: MySQL, PostgreSQL, MongoDB, Redis
- 中间件: Kafka, RabbitMQ, Nginx, Apache
- 云服务: AWS, Azure, GCP
- 应用: JVM, .NET, Python应用

**配置示例**:
```toml
# MySQL监控配置
[[inputs.mysql]]
  servers = ["user:password@tcp(localhost:3306)/"]
  gather_table_schema = true
  gather_process_list = true

# Redis监控配置
[[inputs.redis]]
  servers = ["tcp://localhost:6379"]
```

#### VMAgent 🕷️
**角色**: 勤劳小爬虫

**功能说明**:
- 轻量级指标收集代理
- 支持服务发现和指标过滤
- 高效数据压缩和转发

**核心特性**:
- 数据压缩率: 高达90%
- 支持多种服务发现: Kubernetes, Consul, DNS
- 内存占用: 比Prometheus Agent低50%

**配置示例**:
```yaml
global:
  scrape_interval: 15s
  external_labels:
    cluster: 'production'

scrape_configs:
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
    scrape_interval: 30s
    metrics_path: /metrics
```

### 存储层

#### VictoriaMetrics (单机版) 📚
**角色**: 超级图书馆管理员

**功能说明**:
- 高性能时序数据库单机版
- 完全兼容Prometheus API
- 适合中小规模部署

**性能指标**:
- 压缩比: 比Prometheus高10倍
- 查询速度: 比Prometheus快20倍
- 内存占用: 仅为Prometheus的1/7
- 支持时间序列: 单实例可处理百万级

**配置参数**:
```bash
# 数据保留期
-retentionPeriod=1y

# 内存限制
-memory.allowedPercent=80

# 存储路径
-storageDataPath=/var/lib/victoria-metrics

# HTTP端口
-httpListenAddr=:8428
```

#### VM集群组件

##### VMStorage 🏛️
**角色**: 仓库管理员

**功能说明**:
- 负责数据的持久化存储
- 支持水平扩展
- 高压缩比和快速查询

**部署建议**:
- 最小节点数: 1个
- 推荐节点数: 3个（高可用）
- 磁盘要求: SSD推荐，机械硬盘可用
- 内存要求: 8GB起步，16GB推荐

##### VMInsert 📮
**角色**: 前台接待员

**功能说明**:
- 处理所有写入请求
- 数据分片和负载均衡
- 支持多种协议

**支持协议**:
- Prometheus remote write
- InfluxDB line protocol
- OpenTSDB format
- Graphite plaintext

##### VMSelect 🔍
**角色**: 查询专家

**功能说明**:
- 处理所有查询请求
- 分布式查询和结果合并
- 查询结果缓存

**查询优化**:
- 支持查询缓存
- 并行查询处理
- 智能查询路由

### 告警层

#### VMAlert 🚨
**角色**: 智能警报器

**功能说明**:
- 告警规则评估引擎
- 支持PromQL和MetricsQL
- 记录规则预计算

**告警规则示例**:
```yaml
groups:
  - name: system.rules
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is above 80% for more than 5 minutes"
```

#### Alertmanager 📢
**角色**: 告警管家

**功能说明**:
- 告警处理和路由
- 支持多种通知方式
- 告警去重和静默

**通知渠道**:
- 邮件 (SMTP)
- 微信企业号
- 钉钉机器人
- Slack
- Webhook
- PagerDuty

### 可视化层

#### Grafana 🎨
**角色**: 数据艺术家

**功能说明**:
- 数据可视化和分析平台
- 丰富的图表类型
- 交互式仪表盘

**图表类型**:
- 时间序列图
- 单值面板
- 表格
- 热力图
- 地图
- 饼图
- 柱状图

### 网络监控

#### SNMP Exporter 📡
**角色**: 网络设备翻译官

**功能说明**:
- 通过SNMP协议监控网络设备
- 支持路由器、交换机、防火墙等
- 自动生成配置

**支持设备**:
- Cisco设备
- Juniper设备
- HP/HPE设备
- Dell设备
- 通用SNMP设备

## 🏗️ 部署模式

### 单机模式

**适用场景**:
- 小型项目和开发环境
- 监控目标 < 1000个
- 数据保留期 < 6个月
- 团队规模 < 10人

**架构组成**:
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Data Sources  │───▶│   VictoriaMetrics │───▶│     Grafana     │
│                 │    │    (Single Node)  │    │                 │
│ • Node Exporter │    │                  │    │ • Dashboards    │
│ • VMAgent       │    │ • Storage        │    │ • Alerting      │
│ • Categraf      │    │ • Query Engine   │    │ • Users         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

**资源要求**:
- CPU: 4核心
- 内存: 8GB
- 磁盘: 100GB SSD
- 网络: 1Gbps

### 集群模式

**适用场景**:
- 企业级生产环境
- 监控目标 > 1000个
- 数据保留期 > 6个月
- 需要高可用保障

**架构组成**:
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Data Sources  │───▶│    VMInsert      │    │    VMSelect     │───▶┌─────────────────┐
│                 │    │   (Load Balancer)│    │  (Query Layer)  │    │     Grafana     │
│ • Node Exporter │    └──────────────────┘    └─────────────────┘    │                 │
│ • VMAgent       │             │                        │             │ • Dashboards    │
│ • Categraf      │             ▼                        │             │ • Alerting      │
└─────────────────┘    ┌──────────────────┐              │             │ • Users         │
                       │    VMStorage     │◀─────────────┘             └─────────────────┘
                       │  (Storage Layer) │
                       │                  │
                       │ • Node 1         │
                       │ • Node 2         │
                       │ • Node 3         │
                       └──────────────────┘
```

**资源要求**:
- VMInsert: 2核心, 4GB内存 (每个实例)
- VMSelect: 4核心, 8GB内存 (每个实例)
- VMStorage: 8核心, 16GB内存, 500GB SSD (每个节点)

## 📋 安装指南

### 前置要求

**系统要求**:
- 操作系统: Ubuntu 20.04+, CentOS 7+, RHEL 7+
- Docker: 20.10+
- Docker Compose: 1.29+
- 可用内存: 最少4GB
- 可用磁盘: 最少50GB

**网络要求**:
- 互联网连接（用于下载镜像）
- 内网连通性（集群模式）
- 防火墙端口开放

### 快速安装

#### 1. 下载安装脚本
```bash
# <!-- TODO: This installation method refers to an external script/repo. Verify relevance. -->
# curl -fsSL https://raw.githubusercontent.com/your-repo/monitoring-installer/main/install.sh -o install.sh
# chmod +x install.sh
```

#### 2. 运行安装
```bash
# <!-- TODO: This installation method refers to an external script/repo. Verify relevance. -->
# # 单机模式
# ./install.sh --mode=standalone
#
# # 集群模式
# ./install.sh --mode=cluster --nodes=3
```

#### 3. 访问界面
```bash
# 监控安装器界面
http://your-server:3000/monitoring-installer

# Grafana界面
http://your-server:3001
```

### 手动安装

#### 1. 克隆代码库
```bash
# <!-- TODO: This refers to an external repository. Verify relevance. -->
# git clone https://github.com/your-repo/monitoring-installer.git
# cd monitoring-installer
```

#### 2. 配置环境变量
```bash
cp .env.example .env
vim .env
```

#### 3. 启动服务
```bash
# <!-- TODO: These Docker Compose files are not present in the root. Refer to existing files like 'docker-compose.yml' or 'docker-compose.multiarch.yml' or specify how these should be obtained/created. -->
# # 单机模式
# docker-compose -f docker-compose.standalone.yml up -d
#
# # 集群模式
# docker-compose -f docker-compose.cluster.yml up -d
```

## ⚙️ 配置说明

### 环境变量配置

```bash
# 基础配置
MONITORING_MODE=standalone  # standalone | cluster
DATA_RETENTION=30d          # 数据保留期
STORAGE_PATH=/data          # 数据存储路径

# 网络配置
HTTP_PORT=8428              # VictoriaMetrics HTTP端口
GRAFANA_PORT=3001           # Grafana端口
ALERTMANAGER_PORT=9093      # Alertmanager端口

# 集群配置（仅集群模式）
VMSTORAGE_NODES=3           # VMStorage节点数
VMINSERT_REPLICAS=2         # VMInsert副本数
VMSELECT_REPLICAS=2         # VMSelect副本数

# 安全配置
GRAFANA_ADMIN_PASSWORD=admin123  # Grafana管理员密码
ENABLE_AUTH=true                 # 启用认证
SSL_ENABLED=false                # 启用SSL
```

### 告警规则配置

创建告警规则文件 `alerts/rules.yml`:

```yaml
groups:
  - name: system
    rules:
      - alert: InstanceDown
        expr: up == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Instance {{ $labels.instance }} down"
          description: "{{ $labels.instance }} has been down for more than 5 minutes."

      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is {{ $value }}% for more than 10 minutes."

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is {{ $value }}% for more than 10 minutes."

      - alert: DiskSpaceLow
        expr: (node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100 > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Disk space low on {{ $labels.instance }}"
          description: "Disk usage is {{ $value }}% on {{ $labels.mountpoint }}."
```

### Grafana仪表盘配置

系统预置了多个仪表盘模板:

1. **系统概览仪表盘**: 显示整体系统状态
2. **主机监控仪表盘**: 详细的主机指标
3. **应用监控仪表盘**: 应用程序性能指标
4. **网络监控仪表盘**: 网络设备和流量监控
5. **告警仪表盘**: 告警状态和历史

## 🔧 故障排除

### 常见问题

#### 1. 服务无法启动

**症状**: Docker容器启动失败

**排查步骤**:
```bash
# 查看容器状态
docker-compose ps

# 查看容器日志
docker-compose logs [service-name]

# 检查端口占用
netstat -tlnp | grep [port]

# 检查磁盘空间
df -h
```

**常见解决方案**:
- 检查端口是否被占用
- 确保有足够的磁盘空间
- 检查Docker服务是否正常运行
- 验证配置文件语法

#### 2. 数据收集异常

**症状**: Grafana中看不到数据

**排查步骤**:
```bash
# 检查VMAgent状态
curl http://localhost:8429/metrics

# 检查VictoriaMetrics状态
curl http://localhost:8428/api/v1/label/__name__/values

# 检查目标状态
curl http://localhost:8429/targets
```

**常见解决方案**:
- 检查网络连通性
- 验证Exporter是否正常运行
- 检查防火墙设置
- 确认配置文件中的目标地址正确

#### 3. 查询性能问题

**症状**: Grafana查询缓慢或超时

**优化建议**:
- 调整查询时间范围
- 使用更精确的标签过滤
- 启用查询缓存
- 增加VMSelect实例数量

#### 4. 存储空间不足

**症状**: 磁盘空间告警

**解决方案**:
```bash
# 清理旧数据
curl -X POST http://localhost:8428/api/v1/admin/tsdb/delete_series?match[]={__name__=~".*"}&start=2023-01-01T00:00:00Z&end=2023-06-01T00:00:00Z

# 调整数据保留期
# 修改 -retentionPeriod 参数

# 扩展存储空间
# 添加新的存储卷或扩展现有卷
```

### 日志分析

#### 重要日志位置
```bash
# VictoriaMetrics日志
docker-compose logs victoriametrics

# VMAgent日志
docker-compose logs vmagent

# Grafana日志
docker-compose logs grafana

# Alertmanager日志
docker-compose logs alertmanager
```

#### 日志级别配置
```yaml
# 在docker-compose.yml中设置
environment:
  - LOG_LEVEL=debug  # debug, info, warn, error
```

## 🎯 最佳实践

### 性能优化

#### 1. 存储优化
- 使用SSD存储提高I/O性能
- 定期清理过期数据
- 合理设置数据保留期
- 启用数据压缩

#### 2. 查询优化
- 使用标签过滤减少查询范围
- 避免高基数标签
- 合理设置查询时间范围
- 使用记录规则预计算常用查询

#### 3. 网络优化
- 使用内网通信减少延迟
- 启用数据压缩传输
- 合理设置采集间隔
- 使用负载均衡分散请求

### 安全建议

#### 1. 访问控制
- 启用Grafana用户认证
- 配置RBAC权限控制
- 使用HTTPS加密传输
- 定期更新密码

#### 2. 网络安全
- 配置防火墙规则
- 使用VPN或专网
- 限制管理接口访问
- 启用审计日志

#### 3. 数据安全
- 定期备份配置和数据
- 加密敏感配置信息
- 监控异常访问行为
- 实施数据脱敏

### 监控策略

#### 1. 分层监控
```
基础设施层 → 平台层 → 应用层 → 业务层
     ↓         ↓       ↓       ↓
   系统指标   容器指标  应用指标  业务指标
```

#### 2. 告警策略
- **P0级别**: 影响业务的严重故障，立即通知
- **P1级别**: 可能影响业务的问题，5分钟内通知
- **P2级别**: 性能问题或潜在风险，30分钟内通知
- **P3级别**: 一般性问题，工作时间通知

#### 3. 仪表盘设计
- **概览仪表盘**: 显示整体健康状态
- **详细仪表盘**: 深入分析特定组件
- **故障仪表盘**: 快速定位问题根因
- **容量仪表盘**: 资源使用趋势分析

## 📚 API参考

### VictoriaMetrics API

#### 查询API
```bash
# 即时查询
GET /api/v1/query?query=up&time=2023-01-01T00:00:00Z

# 范围查询
GET /api/v1/query_range?query=up&start=2023-01-01T00:00:00Z&end=2023-01-01T01:00:00Z&step=60s

# 标签查询
GET /api/v1/labels
GET /api/v1/label/{label_name}/values
```

#### 管理API
```bash
# 删除时间序列
POST /api/v1/admin/tsdb/delete_series?match[]={__name__=~".*"}

# 快照备份
POST /api/v1/admin/tsdb/snapshot

# 健康检查
GET /health
```

### Grafana API

#### 仪表盘管理
```bash
# 获取仪表盘列表
GET /api/search?type=dash-db

# 创建仪表盘
POST /api/dashboards/db

# 更新仪表盘
PUT /api/dashboards/db

# 删除仪表盘
DELETE /api/dashboards/uid/{uid}
```

#### 用户管理
```bash
# 获取用户列表
GET /api/users

# 创建用户
POST /api/admin/users

# 更新用户
PUT /api/users/{id}
```

### Alertmanager API

#### 告警管理
```bash
# 获取告警列表
GET /api/v1/alerts

# 静默告警
POST /api/v1/silences

# 获取静默列表
GET /api/v1/silences

# 删除静默
DELETE /api/v1/silence/{id}
```

## 📈 性能基准

### 单机模式性能

| 指标 | 数值 |
|------|------|
| 最大时间序列数 | 100万 |
| 写入速率 | 10万点/秒 |
| 查询延迟 | < 100ms |
| 内存使用 | 2-4GB |
| 磁盘使用 | 1GB/天（1万序列） |

### 集群模式性能

| 指标 | 3节点集群 | 6节点集群 |
|------|-----------|----------|
| 最大时间序列数 | 1000万 | 5000万 |
| 写入速率 | 100万点/秒 | 500万点/秒 |
| 查询延迟 | < 200ms | < 300ms |
| 内存使用 | 6-12GB | 12-24GB |
| 磁盘使用 | 10GB/天 | 50GB/天 |

## 🔄 版本更新

### 更新策略

1. **滚动更新**: 逐个更新节点，保证服务连续性
2. **蓝绿部署**: 部署新版本环境，切换流量
3. **金丝雀发布**: 小流量验证新版本稳定性

### 更新步骤

```bash
# 1. 备份当前配置
cp -r /opt/monitoring /opt/monitoring.backup

# 2. 下载新版本
wget https://releases.../monitoring-installer-v2.0.tar.gz

# 3. 停止服务
docker-compose down

# 4. 更新代码
tar -xzf monitoring-installer-v2.0.tar.gz

# 5. 迁移配置
# ./migrate-config.sh # <!-- TODO: Verify relevance of this script. -->

# 6. 启动服务
docker-compose up -d

# 7. 验证服务
./health-check.sh
```

## 📞 技术支持

### 社区支持
<!-- - GitHub Issues: https://github.com/your-repo/monitoring-installer/issues -->
<!-- - 讨论论坛: https://forum.your-domain.com -->
- 文档站点: https://docs.your-domain.com <!-- Keeping this one as it's generic -->

### 商业支持
- 技术咨询: support@your-domain.com
- 培训服务: training@your-domain.com
- 定制开发: custom@your-domain.com

---

**文档版本**: v1.0.0  
**维护者**: 监控团队