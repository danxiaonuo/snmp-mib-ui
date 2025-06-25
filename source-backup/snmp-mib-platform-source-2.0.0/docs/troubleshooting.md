# 🔧 故障排除与常见问题解答

## 📋 目录

1. [快速诊断工具](#快速诊断工具)
2. [常见启动问题](#常见启动问题)
3. [数据收集问题](#数据收集问题)
4. [查询和可视化问题](#查询和可视化问题)
5. [性能问题](#性能问题)
6. [网络和连接问题](#网络和连接问题)
7. [存储和数据问题](#存储和数据问题)
8. [告警问题](#告警问题)
9. [配置问题](#配置问题)
10. [日志分析](#日志分析)
11. [性能调优](#性能调优)
12. [紧急恢复](#紧急恢复)

## 🩺 快速诊断工具

### 一键健康检查脚本

```bash
#!/bin/bash
# health-check.sh - 监控系统健康检查脚本

echo "🔍 开始监控系统健康检查..."
echo "======================================"

# 检查Docker服务
echo "📦 检查Docker服务状态..."
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker服务未运行"
    echo "解决方案: sudo systemctl start docker"
else
    echo "✅ Docker服务正常"
fi

# 检查容器状态
echo "\n🐳 检查容器状态..."
docker-compose ps --format "table {{.Name}}\t{{.State}}\t{{.Ports}}"

# 检查端口占用
echo "\n🌐 检查关键端口..."
ports=(3000 8080 5432 6379)
for port in "${ports[@]}"; do
    if netstat -tlnp 2>/dev/null | grep ":$port " >/dev/null; then
        echo "✅ 端口 $port 正在使用"
    else
        echo "❌ 端口 $port 未被占用"
    fi
done

# 检查磁盘空间
echo "\n💾 检查磁盘空间..."
df -h | grep -E '(Filesystem|/dev/)'
echo "\n警告: 如果使用率超过85%，请清理磁盘空间"

# 检查内存使用
echo "\n🧠 检查内存使用..."
free -h

# 检查服务健康状态
echo "\n🏥 检查服务健康状态..."
services=(
    "http://localhost:8080/health:Backend API"
    "http://localhost:3000:Frontend"
)

for service in "${services[@]}"; do
    url=$(echo $service | cut -d: -f1-2)
    name=$(echo $service | cut -d: -f3)
    
    if curl -s "$url" >/dev/null 2>&1; then
        echo "✅ $name 健康检查通过"
    else
        echo "❌ $name 健康检查失败"
        echo "   检查URL: $url"
    fi
done

# 检查数据收集
echo "\n📊 检查数据收集状态..."
if curl -s "http://localhost:8428/api/v1/label/__name__/values" | grep -q "node_"; then
    echo "✅ 正在收集系统指标数据"
else
    echo "❌ 未检测到系统指标数据"
    echo "   请检查Node Exporter和VMAgent配置"
fi

echo "\n======================================"
echo "🎯 健康检查完成！"
echo "如需详细诊断，请查看具体服务日志:"
echo "docker-compose logs [service-name]"
```

### 快速修复脚本

```bash
#!/bin/bash
# quick-fix.sh - 常见问题快速修复

echo "🔧 监控系统快速修复工具"
echo "======================================"

# 修复权限问题
echo "📁 修复数据目录权限..."
sudo chown -R $USER:$USER ./data
sudo chmod -R 755 ./data

# 清理Docker资源
echo "🧹 清理Docker资源..."
docker system prune -f
docker volume prune -f

# 重启服务
echo "🔄 重启监控服务..."
docker-compose down
sleep 5
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 验证服务状态
echo "✅ 验证服务状态..."
docker-compose ps

echo "\n🎉 快速修复完成！"
```

## 🚨 常见启动问题

### 问题1: Docker容器启动失败

**症状**:
```bash
$ docker-compose up -d
```

**原因分析**:
- 端口被占用
- Docker网络配置问题
- 防火墙阻止

**解决方案**:
```bash
# 1. 检查端口占用
netstat -tlnp | grep 8428
sudo lsof -i :8428

# 2. 停止占用端口的进程
sudo kill -9 [PID]

# 3. 重启Docker服务
sudo systemctl restart docker

# 4. 清理Docker网络
docker network prune -f

# 5. 重新启动服务
docker-compose down
docker-compose up -d
```

### 问题2: 内存不足导致容器被杀死

**症状**:
```bash
```

**原因分析**:
- 系统内存不足
- Docker内存限制过低
- 内存泄漏

**解决方案**:
```yaml
# docker-compose.yml 中调整内存限制
services:
    deploy:
      resources:
        limits:
          memory: 4G        # 增加内存限制
        reservations:
          memory: 2G        # 预留内存
    environment:
      - VM_MEMORY_ALLOWED_PERCENT=70  # 限制VM内存使用
```

### 问题3: 配置文件格式错误

**症状**:
```bash
$ docker-compose up -d
ERROR: yaml.scanner.ScannerError: mapping values are not allowed here
```

**解决方案**:
```bash
# 1. 验证YAML语法
python -c "import yaml; yaml.safe_load(open('docker-compose.yml'))"

# 2. 使用在线YAML验证器
# https://yamlchecker.com/

# 3. 检查缩进和特殊字符
cat -A docker-compose.yml | head -20

# 4. 重新生成配置文件
cp docker-compose.yml docker-compose.yml.backup
# 通过监控安装器重新生成配置
```

## 📊 数据收集问题

### 问题1: Node Exporter无法访问

**症状**:
- Grafana中看不到系统指标
- VMAgent targets页面显示DOWN状态

**诊断步骤**:
```bash
# 1. 检查Node Exporter状态
curl http://localhost:9100/metrics

# 2. 检查VMAgent配置
curl http://localhost:8429/targets

# 3. 检查网络连通性
telnet localhost 9100

# 4. 检查防火墙
sudo ufw status
sudo iptables -L
```

**解决方案**:
```yaml
# 确保Node Exporter正确配置
services:
    restart: unless-stopped
    ports:
      - "9100:9100"
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
```

### 问题2: 数据采集延迟过高

**症状**:
- 监控数据更新缓慢
- 图表显示数据滞后

**优化方案**:
```yaml
# VMAgent配置优化
services:
  vmagent:
    command:
      - '--remoteWrite.maxDiskUsagePerURL=1GB'
      - '--memory.allowedPercent=80'
      - '--promscrape.maxScrapeSize=100MB'
      - '--promscrape.streamParse=true'  # 启用流式解析
```

```yaml
global:
  scrape_interval: 15s     # 减少采集间隔
  evaluation_interval: 15s
  external_labels:
    cluster: 'production'

scrape_configs:
    static_configs:
    scrape_interval: 10s     # 高频采集关键指标
    scrape_timeout: 5s
    metrics_path: /metrics
```

### 问题3: 高基数指标导致性能问题

**症状**:
- 内存使用持续增长
- 查询响应缓慢
- 存储空间快速增长

**解决方案**:
```yaml
# 在VMAgent中配置指标过滤
services:
  vmagent:
    volumes:
      - ./configs/relabel.yml:/etc/vmagent/relabel.yml
    command:
      - '--remoteWrite.relabelConfig=/etc/vmagent/relabel.yml'
```

```yaml
# relabel.yml - 指标重标记配置
# 删除高基数标签
- source_labels: [__name__]
  regex: 'node_filesystem_.*'
  target_label: __tmp_drop_high_cardinality
  replacement: 'true'

# 只保留重要的文件系统
- source_labels: [mountpoint]
  regex: '/dev/.*|/proc/.*|/sys/.*'
  action: drop

# 限制标签值长度
- source_labels: [instance]
  regex: '(.{50}).*'
  target_label: instance
  replacement: '${1}'
```

## 📈 查询和可视化问题

### 问题1: Grafana无法连接数据源

**症状**:
```
HTTP Error Bad Gateway
data source connected, but no labels received
```

**解决步骤**:
```bash
# 1. 检查VictoriaMetrics状态
curl http://localhost:8428/api/v1/label/__name__/values

# 2. 检查网络连通性

# 3. 检查Grafana数据源配置
# 不是: http://localhost:8428
```

**正确的数据源配置**:
```json
{
  "name": "VictoriaMetrics",
  "access": "proxy",
  "isDefault": true,
  "jsonData": {
    "httpMethod": "POST",
    "timeInterval": "30s"
  }
}
```

### 问题2: 查询超时或响应缓慢

**症状**:
- Grafana面板显示"Query timeout"
- 查询响应时间超过30秒

**优化策略**:
```yaml
# VictoriaMetrics查询优化
services:
    command:
      - '--search.maxConcurrentRequests=16'    # 增加并发查询数
      - '--search.maxQueryDuration=60s'        # 增加查询超时时间
      - '--search.maxPointsPerTimeseries=10000' # 限制每个序列的点数
      - '--search.maxSeries=100000'            # 限制查询序列数
      - '--cache.size=2GB'                     # 增加缓存大小
```

**查询优化建议**:
```promql
# ❌ 避免高基数查询
sum by (instance, device, mountpoint) (node_filesystem_free_bytes)

# ✅ 使用标签过滤
sum by (instance) (node_filesystem_free_bytes{mountpoint="/"})

# ❌ 避免长时间范围的高精度查询
rate(http_requests_total[1h])

# ✅ 使用合适的时间窗口
rate(http_requests_total[5m])
```

### 问题3: 仪表盘显示"No data"

**诊断清单**:
```bash
# 1. 检查时间范围
# 确保选择的时间范围内有数据

# 2. 检查查询语法
# 在VictoriaMetrics UI中测试查询
curl 'http://localhost:8428/api/v1/query?query=up'

# 3. 检查标签匹配
# 确保标签选择器正确
curl 'http://localhost:8428/api/v1/label/job/values'

# 4. 检查数据保留期
# 确保数据未过期
curl 'http://localhost:8428/api/v1/query?query=up&time=2023-01-01T00:00:00Z'
```

## ⚡ 性能问题

### 问题1: VictoriaMetrics内存使用过高

**监控指标**:
```promql
# 内存使用率
vm_memory_usage_bytes / vm_available_memory_bytes * 100

# 缓存命中率
vm_cache_requests_total{type="hit"} / vm_cache_requests_total * 100

# 活跃时间序列数
vm_active_timeseries
```

**优化方案**:
```yaml
services:
    command:
      - '--memory.allowedPercent=70'           # 限制内存使用
      - '--retentionPeriod=30d'                # 减少数据保留期
      - '--dedup.minScrapeInterval=60s'        # 启用去重
      - '--search.cacheTimestampOffset=5m'     # 优化缓存
    deploy:
      resources:
        limits:
          memory: 8G
        reservations:
          memory: 4G
```

### 问题2: 磁盘I/O瓶颈

**监控指标**:
```bash
# 磁盘I/O使用率
iostat -x 1

# 磁盘空间使用
df -h

# VictoriaMetrics磁盘指标
curl 'http://localhost:8428/api/v1/query?query=vm_data_size_bytes'
```

**优化方案**:
```yaml
# 使用SSD存储
services:
    volumes:
      - /fast-ssd/victoria-metrics:/victoria-metrics-data
    command:
      - '--storageDataPath=/victoria-metrics-data'
      - '--insert.maxQueueDuration=30s'        # 优化写入队列
      - '--maxLabelsPerTimeseries=50'          # 限制标签数量
```

### 问题3: 网络带宽瓶颈

**监控和优化**:
```yaml
services:
  vmagent:
    command:
      - '--remoteWrite.maxBlockSize=8MB'       # 增加块大小
      - '--remoteWrite.concurrency=4'          # 增加并发数
      - '--remoteWrite.compress=true'          # 启用压缩
      - '--promscrape.streamParse=true'        # 流式解析
```

## 🌐 网络和连接问题

### 问题1: 容器间网络不通

**诊断步骤**:
```bash
# 1. 检查Docker网络
docker network ls
docker network inspect monitoring_default

# 2. 测试容器间连通性

# 3. 检查DNS解析
```

**解决方案**:
```yaml
# 确保所有服务在同一网络中
version: '3.8'

networks:
  monitoring:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

services:
    networks:
      - monitoring
  
  vmagent:
    networks:
      - monitoring
  
    networks:
      - monitoring
```

### 问题2: 外部网络访问问题

**防火墙配置**:
```bash
# Ubuntu/Debian
sudo ufw allow 3001/tcp  # Grafana
sudo ufw allow 8428/tcp  # VictoriaMetrics
sudo ufw allow 9093/tcp  # Alertmanager

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --permanent --add-port=8428/tcp
sudo firewall-cmd --permanent --add-port=9093/tcp
sudo firewall-cmd --reload
```

**反向代理配置** (Nginx):
```nginx
server {
    listen 80;
    server_name monitoring.example.com;
    
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
        proxy_pass http://localhost:8428/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 💾 存储和数据问题

### 问题1: 数据丢失或损坏

**数据恢复步骤**:
```bash
# 1. 停止服务
docker-compose down

# 2. 检查数据目录
ls -la ./data/victoria-metrics/

# 3. 从备份恢复
cp -r /backup/victoria-metrics-data/* ./data/victoria-metrics/

# 4. 修复权限
sudo chown -R 1000:1000 ./data/victoria-metrics/

# 5. 重启服务
docker-compose up -d
```

**数据一致性检查**:
```bash
# 检查VictoriaMetrics数据完整性
curl 'http://localhost:8428/api/v1/query?query=vm_data_size_bytes'
curl 'http://localhost:8428/api/v1/query?query=vm_rows_total'

# 检查时间序列数量
curl 'http://localhost:8428/api/v1/label/__name__/values' | jq length
```

### 问题2: 磁盘空间不足

**清理策略**:
```bash
# 1. 清理旧数据
curl -X POST 'http://localhost:8428/api/v1/admin/tsdb/delete_series?match[]={__name__=~".*"}&start=2023-01-01T00:00:00Z&end=2023-06-01T00:00:00Z'

# 2. 压缩数据
curl -X POST 'http://localhost:8428/api/v1/admin/tsdb/snapshot/create'

# 3. 清理Docker资源
docker system prune -a -f
docker volume prune -f

# 4. 调整数据保留期
# 在docker-compose.yml中修改 --retentionPeriod 参数
```

**监控磁盘使用**:
```promql
# 磁盘使用率告警
(node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100 > 85

# VictoriaMetrics数据大小
vm_data_size_bytes

# 数据增长率
rate(vm_data_size_bytes[1h]) * 3600 * 24  # 每天增长量
```

## 🚨 告警问题

### 问题1: 告警规则不触发

**诊断步骤**:
```bash
# 1. 检查VMAlert状态
curl http://localhost:8080/api/v1/rules

# 2. 检查告警规则语法
curl http://localhost:8080/api/v1/alerts

# 3. 测试查询表达式
curl 'http://localhost:8428/api/v1/query?query=up==0'

# 4. 检查评估间隔
# 确保evaluation_interval设置合理
```

**常见规则问题**:
```yaml
# ❌ 错误的规则配置
groups:
  - name: test
    rules:
      - alert: InstanceDown
        expr: up = 0  # 错误：应该使用 ==
        for: 5m

# ✅ 正确的规则配置
groups:
  - name: test
    interval: 30s  # 添加评估间隔
    rules:
      - alert: InstanceDown
        expr: up == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Instance {{ $labels.instance }} is down"
```

### 问题2: 告警通知不发送

**Alertmanager配置检查**:
```bash
# 1. 检查Alertmanager状态
curl http://localhost:9093/-/healthy

# 2. 检查配置语法

# 3. 测试通知
curl -X POST http://localhost:9093/api/v1/alerts \
  -H 'Content-Type: application/json' \
  -d '[{
    "labels": {
      "alertname": "TestAlert",
      "severity": "warning"
    },
    "annotations": {
      "summary": "Test alert"
    }
  }]'
```

**邮件通知配置示例**:
```yaml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@example.com'
  smtp_auth_username: 'alerts@example.com'
  smtp_auth_password: 'app-password'
  smtp_require_tls: true

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'default'

receivers:
  - name: 'default'
    email_configs:
      - to: 'admin@example.com'
        subject: '🚨 {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Labels: {{ .Labels }}
          {{ end }}
```

## 📋 日志分析

### 重要日志位置

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs vmagent

# 实时跟踪日志

# 导出日志到文件
docker-compose logs > monitoring-logs-$(date +%Y%m%d).log
```

### 常见错误日志分析

#### VictoriaMetrics错误
```bash
# 内存不足
ERROR: cannot allocate memory
# 解决：增加内存限制或减少数据保留期

# 磁盘空间不足
ERROR: cannot write data to disk
# 解决：清理磁盘空间或扩展存储

# 配置错误
ERROR: cannot parse config
# 解决：检查配置文件语法
```

#### VMAgent错误
```bash
# 连接失败
ERROR: cannot connect to remote storage
# 解决：检查网络连通性和VictoriaMetrics状态

# 采集超时
ERROR: scrape timeout
# 解决：增加scrape_timeout或优化目标响应时间

# 配置重载失败
ERROR: cannot reload config
```

#### Grafana错误
```bash
# 数据源连接失败
ERROR: data source proxy error
# 解决：检查数据源URL和网络连通性

# 插件加载失败
ERROR: plugin not found
# 解决：重新安装插件或检查插件兼容性

# 数据库连接失败
ERROR: database locked
# 解决：重启Grafana或检查数据库文件权限
```

### 日志级别配置

```yaml
# 调整日志级别以获取更多信息
services:
    command:
      - '--loggerLevel=DEBUG'  # DEBUG, INFO, WARN, ERROR
  
  vmagent:
    command:
      - '--loggerLevel=INFO'
  
    environment:
      - GF_LOG_LEVEL=debug
```

## ⚡ 性能调优

### VictoriaMetrics调优

```yaml
services:
    command:
      # 内存优化
      - '--memory.allowedPercent=80'
      - '--cache.size=4GB'
      
      # 查询优化
      - '--search.maxConcurrentRequests=16'
      - '--search.maxQueryDuration=120s'
      - '--search.maxPointsPerTimeseries=30000'
      
      # 写入优化
      - '--insert.maxQueueDuration=60s'
      - '--maxLabelsPerTimeseries=50'
      
      # 存储优化
      - '--dedup.minScrapeInterval=60s'
      - '--retentionPeriod=365d'
    deploy:
      resources:
        limits:
          memory: 16G
          cpus: '8'
        reservations:
          memory: 8G
          cpus: '4'
```

### VMAgent调优

```yaml
services:
  vmagent:
    command:
      # 内存优化
      - '--memory.allowedPercent=70'
      
      # 网络优化
      - '--remoteWrite.maxBlockSize=32MB'
      - '--remoteWrite.concurrency=8'
      - '--remoteWrite.compress=true'
      
      # 采集优化
      - '--promscrape.maxScrapeSize=100MB'
      - '--promscrape.streamParse=true'
      - '--promscrape.suppressScrapeErrors=true'
```

### 系统级优化

```bash
# 内核参数优化
echo 'vm.max_map_count=262144' >> /etc/sysctl.conf
echo 'fs.file-max=1000000' >> /etc/sysctl.conf
echo 'net.core.somaxconn=65535' >> /etc/sysctl.conf
sysctl -p

# 文件描述符限制
echo '* soft nofile 1000000' >> /etc/security/limits.conf
echo '* hard nofile 1000000' >> /etc/security/limits.conf

# Docker优化
echo '{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}' > /etc/docker/daemon.json

sudo systemctl restart docker
```

## 🆘 紧急恢复

### 完全系统恢复

```bash
#!/bin/bash
# emergency-recovery.sh - 紧急恢复脚本

echo "🚨 开始紧急恢复程序..."

# 1. 停止所有服务
echo "⏹️ 停止所有服务..."
docker-compose down -v

# 2. 备份当前状态
echo "💾 备份当前状态..."
cp -r ./data ./data.emergency.backup.$(date +%Y%m%d_%H%M%S)

# 3. 清理Docker资源
echo "🧹 清理Docker资源..."
docker system prune -a -f
docker volume prune -f

# 4. 重新拉取镜像
echo "📥 重新拉取镜像..."
docker-compose pull

# 5. 重置配置
echo "⚙️ 重置配置..."
cp docker-compose.yml.backup docker-compose.yml 2>/dev/null || echo "未找到备份配置"

# 6. 重新创建数据目录
echo "📁 重新创建数据目录..."
sudo chown -R 1000:1000 data/

# 7. 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 8. 等待服务就绪
echo "⏳ 等待服务就绪..."
sleep 60

# 9. 健康检查
echo "🏥 执行健康检查..."
./health-check.sh

echo "✅ 紧急恢复完成！"
echo "请检查服务状态并根据需要恢复数据"
```

### 数据恢复

```bash
# 从快照恢复VictoriaMetrics数据
#!/bin/bash

# 停止VictoriaMetrics

# 恢复数据
rm -rf ./data/victoria-metrics/*
tar -xzf victoria-metrics-snapshot-20231201.tar.gz -C ./data/victoria-metrics/

# 修复权限
sudo chown -R 1000:1000 ./data/victoria-metrics/

# 重启服务

# 验证数据
curl 'http://localhost:8428/api/v1/query?query=up'
```

### 配置恢复

```bash
# 恢复Grafana配置

# 恢复告警规则
cp alert-rules-backup.yml ./configs/alert-rules.yml
docker-compose restart vmalert

# 恢复Alertmanager配置
```

## 📞 获取帮助

### 自助诊断

1. **运行健康检查脚本**
   ```bash
   ./health-check.sh
   ```

2. **收集诊断信息**
   ```bash
   ./collect-diagnostics.sh
   ```

3. **查看相关文档**
   - [快速开始指南](./quick-start.md)
   - [完整使用手册](./monitoring-installer-guide.md)
   - [系统架构文档](./system-architecture.md)

### 社区支持

- **GitHub Issues**: 报告Bug和功能请求
- **讨论论坛**: 技术交流和经验分享
- **文档站点**: 最新文档和教程

### 商业支持

- **技术咨询**: 专业技术支持
- **培训服务**: 系统培训和认证
- **定制开发**: 企业级定制功能

---

**记住**: 大多数问题都可以通过重启服务、检查配置和查看日志来解决。保持冷静，按步骤排查！🔧