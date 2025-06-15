# SNMP MIB Platform 部署指南

本文档提供了 SNMP MIB Platform 的完整部署指南，包括 Docker Compose 和 Kubernetes 两种部署方式，并针对中国大陆网络环境进行了优化。

## 📋 目录

- [系统要求](#-系统要求)
- [快速开始](#-快速开始)
- [中国大陆部署](#-中国大陆部署)
- [Docker Compose 部署](#-docker-compose-部署)
- [Kubernetes 部署](#️-kubernetes-部署)
- [高级配置](#-高级配置)
- [监控和告警](#-监控和告警)
- [安全配置](#-安全配置)
- [性能优化](#-性能优化)
- [故障排除](#-故障排除)
- [维护和备份](#-维护和备份)

---

## 📋 系统要求

### 最小配置
- **CPU**: 4 核
- **内存**: 8GB
- **存储**: 100GB
- **操作系统**: Linux (Ubuntu 20.04+, CentOS 8+)

### 推荐配置
- **CPU**: 8 核
- **内存**: 16GB
- **存储**: 200GB SSD
- **操作系统**: Linux (Ubuntu 22.04, CentOS Stream 9)

### 软件依赖
- Docker 20.10+
- Docker Compose 2.0+
- Kubernetes 1.24+ (可选)
- Git

---

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/evan7434/snmp-mib-ui.git
cd snmp-mib-ui
```

### 2. 选择部署方式

#### 🇨🇳 中国大陆用户（推荐）
```bash
# 一键部署（国内优化）
./deploy-china.sh
```

#### 🌍 国际用户
```bash
# 标准部署
docker-compose up -d
```

### 3. 访问平台
- **前端界面**: http://localhost:3000
- **后端 API**: http://localhost:8080
- **Grafana**: http://localhost:3001 (admin/admin)
- **VictoriaMetrics**: http://localhost:8428

---

## 🇨🇳 中国大陆部署

### 特性优势

- ✅ **国内镜像源**: 使用阿里云镜像，下载速度快
- ✅ **代理配置**: 自动配置 npm/Go 国内代理
- ✅ **网络优化**: 优化连接超时和重试机制
- ✅ **自动检查**: 环境检查和依赖验证
- ✅ **错误处理**: 完善的错误处理和回滚机制

### 一键部署脚本

```bash
# 执行部署脚本
./deploy-china.sh

# 查看帮助
./deploy-china.sh help

# 其他命令
./deploy-china.sh status    # 查看服务状态
./deploy-china.sh logs      # 查看日志
./deploy-china.sh restart   # 重启服务
./deploy-china.sh clean     # 清理环境
```

### 部署过程

1. **环境检查**: 检查 Docker、内存、磁盘空间
2. **镜像源配置**: 配置国内镜像源和代理
3. **目录创建**: 创建必要的数据目录
4. **配置生成**: 自动生成安全的环境配置
5. **镜像拉取**: 从国内镜像源拉取基础镜像
6. **应用构建**: 构建前端和后端应用镜像
7. **服务启动**: 启动所有服务容器
8. **健康检查**: 等待服务就绪并验证
9. **信息展示**: 显示访问地址和管理命令

### 配置文件

#### docker-compose.china.yml
针对中国大陆优化的 Docker Compose 配置：
- 使用阿里云镜像源
- 优化资源限制和健康检查
- 配置中国时区
- 使用本地数据卷

#### Dockerfile.china
针对中国大陆优化的 Dockerfile：
- 使用国内 Go 代理
- 配置 npm 国内镜像
- 优化构建缓存
- 安全用户配置

---

## 🐳 Docker Compose 部署

### 标准部署

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 生产环境部署

```bash
# 使用生产配置
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# 查看所有服务
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml ps
```

### 服务说明

#### 核心服务
- **frontend**: Next.js 前端应用 (端口 3000)
- **backend**: Go 后端 API 服务 (端口 8080)
- **postgres**: PostgreSQL 数据库 (端口 5432)
- **redis**: Redis 缓存 (端口 6379)

#### 监控服务
- **victoriametrics**: 时序数据库 (端口 8428)
- **grafana**: 可视化面板 (端口 3001)
- **vmalert**: 告警引擎 (端口 8880)
- **alertmanager**: 告警管理器 (端口 9093)
- **node-exporter**: 节点监控 (端口 9100)
- **snmp-exporter**: SNMP 监控 (端口 9116)

### 环境配置

#### .env 文件示例
```bash
# 数据库配置
POSTGRES_DB=mib_platform
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# Redis 配置
REDIS_PASSWORD=your_redis_password

# 应用配置
BACKEND_PORT=8080
FRONTEND_PORT=3000
JWT_SECRET=your_super_secret_jwt_key

# 监控配置
GRAFANA_ADMIN_PASSWORD=admin123
PROMETHEUS_RETENTION=15d

# 网络配置
CORS_ORIGINS=http://localhost:3000,http://localhost
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 数据持久化

```bash
# 查看数据卷
docker volume ls | grep snmp-mib

# 备份数据库
docker-compose exec postgres pg_dump -U postgres mib_platform > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U postgres mib_platform < backup.sql

# 备份 Redis
docker-compose exec redis redis-cli --rdb /data/backup.rdb

# 备份配置文件
tar -czf config-backup.tar.gz .env docker-compose*.yml nginx/
```

---

## ☸️ Kubernetes 部署

### 前置条件

```bash
# 检查 Kubernetes 集群
kubectl cluster-info

# 检查节点状态
kubectl get nodes

# 检查存储类
kubectl get storageclass
```

### 快速部署

```bash
# 创建命名空间
kubectl apply -f k8s/namespace.yaml

# 部署核心服务
kubectl apply -f k8s/snmp-mib-platform.yaml

# 部署监控组件
kubectl apply -f k8s/monitoring/

# 检查部署状态
kubectl get pods -n monitoring
kubectl get svc -n monitoring
```

### 详细部署步骤

#### 1. 创建命名空间和配置
```bash
# 创建命名空间
kubectl apply -f k8s/namespace.yaml

# 创建 ConfigMap
kubectl create configmap app-config \
  --from-env-file=.env \
  -n monitoring

# 创建 Secret
kubectl create secret generic app-secrets \
  --from-literal=postgres-password=your_password \
  --from-literal=jwt-secret=your_jwt_secret \
  -n monitoring
```

#### 2. 部署数据库和缓存
```bash
# 部署 PostgreSQL
kubectl apply -f k8s/postgres.yaml

# 部署 Redis
kubectl apply -f k8s/redis.yaml

# 等待数据库就绪
kubectl wait --for=condition=ready pod -l app=postgres -n monitoring --timeout=300s
```

#### 3. 部署应用服务
```bash
# 部署后端服务
kubectl apply -f k8s/backend.yaml

# 部署前端服务
kubectl apply -f k8s/frontend.yaml

# 等待应用就绪
kubectl wait --for=condition=ready pod -l app=snmp-mib-backend -n monitoring --timeout=300s
```

#### 4. 部署监控组件
```bash
# 部署 VictoriaMetrics
kubectl apply -f k8s/monitoring/victoriametrics.yaml

# 部署 Grafana
kubectl apply -f k8s/monitoring/grafana.yaml

# 部署告警组件
kubectl apply -f k8s/monitoring/vmalert.yaml
kubectl apply -f k8s/monitoring/alertmanager.yaml

# 部署 Exporters
kubectl apply -f k8s/monitoring/node-exporter.yaml
kubectl apply -f k8s/monitoring/snmp-exporter.yaml
```

### 访问服务

#### NodePort 方式
```bash
# 获取 NodePort 端口
kubectl get svc -n monitoring | grep NodePort

# 访问地址示例
# Frontend: http://<node-ip>:30080
# Backend: http://<node-ip>:30800
# Grafana: http://<node-ip>:30300
```

#### Ingress 方式
```bash
# 部署 Ingress
kubectl apply -f k8s/ingress.yaml

# 配置域名解析
# snmp.yourdomain.com -> Ingress IP
```

### 扩容和更新

```bash
# 扩容前端服务
kubectl scale deployment snmp-mib-platform-frontend --replicas=3 -n monitoring

# 扩容后端服务
kubectl scale deployment snmp-mib-platform-backend --replicas=2 -n monitoring

# 更新镜像
kubectl set image deployment/snmp-mib-platform-backend \
  backend=snmp-mib-platform:v2.0.0 -n monitoring

# 查看更新状态
kubectl rollout status deployment/snmp-mib-platform-backend -n monitoring

# 回滚更新
kubectl rollout undo deployment/snmp-mib-platform-backend -n monitoring
```

---

## 🔧 高级配置

### SSL/TLS 配置

#### Docker Compose SSL
```yaml
# docker-compose.override.yml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
```

#### Kubernetes SSL
```yaml
# k8s/ingress-ssl.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: snmp-mib-platform-ingress
  namespace: monitoring
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - snmp.yourdomain.com
    secretName: snmp-tls
  rules:
  - host: snmp.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: snmp-mib-platform-frontend
            port:
              number: 3000
```

### 负载均衡配置

#### HAProxy 配置
```bash
# haproxy.cfg
global
    daemon
    maxconn 4096

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms
    option httplog

frontend snmp_frontend
    bind *:80
    bind *:443 ssl crt /etc/ssl/certs/snmp.pem
    redirect scheme https if !{ ssl_fc }
    default_backend snmp_backend

backend snmp_backend
    balance roundrobin
    option httpchk GET /health
    server web1 node1:30080 check
    server web2 node2:30080 check
    server web3 node3:30080 check
```

### 数据库集群配置

#### PostgreSQL 主从配置
```yaml
# k8s/postgres-cluster.yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: postgres-cluster
  namespace: monitoring
spec:
  instances: 3
  primaryUpdateStrategy: unsupervised
  
  postgresql:
    parameters:
      max_connections: "200"
      shared_buffers: "256MB"
      effective_cache_size: "1GB"
      
  bootstrap:
    initdb:
      database: mib_platform
      owner: postgres
      secret:
        name: postgres-credentials
        
  storage:
    size: 100Gi
    storageClass: fast-ssd
```

---

## 📊 监控和告警

### 监控组件架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │───►│ VictoriaMetrics │───►│     Grafana     │
│   (Metrics)     │    │   (Storage)     │    │ (Visualization) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌────────┴────────┐
                       │                 │
                ┌──────▼──────┐   ┌──────▼──────┐
                │   VMAlert   │   │ Alertmanager│
                │ (Rules)     │   │ (Routing)   │
                └─────────────┘   └─────────────┘
```

### Grafana 仪表板

#### 预配置仪表板
1. **系统监控**: CPU、内存、磁盘、网络
2. **应用监控**: API 响应时间、错误率、吞吐量
3. **数据库监控**: 连接数、查询性能、锁等待
4. **SNMP 设备监控**: 设备状态、接口流量、错误计数
5. **业务监控**: 用户活动、功能使用情况

#### 导入仪表板
```bash
# 导入预配置仪表板
kubectl create configmap grafana-dashboards \
  --from-file=dashboards/ -n monitoring

# 重启 Grafana 加载仪表板
kubectl rollout restart deployment/grafana -n monitoring
```

### 告警规则配置

#### VictoriaMetrics 告警规则
```yaml
# alerts/platform-alerts.yml
groups:
- name: platform
  rules:
  - alert: HighCPUUsage
    expr: cpu_usage_percent > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High CPU usage detected"
      description: "CPU usage is above 80% for more than 5 minutes"

  - alert: DatabaseDown
    expr: up{job="postgres"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Database is down"
      description: "PostgreSQL database is not responding"

  - alert: APIHighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "High API error rate"
      description: "API error rate is above 10%"
```

#### Alertmanager 配置
```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@yourdomain.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
- name: 'web.hook'
  email_configs:
  - to: 'admin@yourdomain.com'
    subject: 'SNMP Platform Alert: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      {{ end }}
```

---

## 🔐 安全配置

### 认证和授权

#### JWT 配置
```bash
# 生成强密钥
openssl rand -base64 64 | tr -d "=+/" | cut -c1-50

# 配置 JWT 过期时间
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=7d
```

#### 用户管理
```bash
# 创建管理员用户
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "SecurePassword123!",
    "email": "admin@yourdomain.com",
    "role": "admin"
  }'
```

### 网络安全

#### 防火墙配置
```bash
# Ubuntu/Debian
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# CentOS/RHEL
firewall-cmd --permanent --add-service=ssh
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

#### Docker 网络隔离
```yaml
# docker-compose.security.yml
version: '3.8'
networks:
  frontend:
    driver: bridge
    internal: false
  backend:
    driver: bridge
    internal: true
  database:
    driver: bridge
    internal: true

services:
  frontend:
    networks:
      - frontend
      - backend
  backend:
    networks:
      - backend
      - database
  postgres:
    networks:
      - database
```

### 数据加密

#### 数据库加密
```sql
-- 启用 PostgreSQL SSL
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = 'server.crt';
ALTER SYSTEM SET ssl_key_file = 'server.key';
SELECT pg_reload_conf();
```

#### 应用层加密
```go
// 敏感数据加密存储
func EncryptSensitiveData(data string) (string, error) {
    key := []byte(os.Getenv("ENCRYPTION_KEY"))
    block, err := aes.NewCipher(key)
    if err != nil {
        return "", err
    }
    
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return "", err
    }
    
    nonce := make([]byte, gcm.NonceSize())
    if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
        return "", err
    }
    
    ciphertext := gcm.Seal(nonce, nonce, []byte(data), nil)
    return base64.StdEncoding.EncodeToString(ciphertext), nil
}
```

---

## 📈 性能优化

### 数据库优化

#### PostgreSQL 配置
```sql
-- 性能优化配置
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- 重启数据库使配置生效
SELECT pg_reload_conf();
```

#### 索引优化
```sql
-- 创建必要的索引
CREATE INDEX CONCURRENTLY idx_mibs_name ON mibs(name);
CREATE INDEX CONCURRENTLY idx_devices_ip ON devices(ip_address);
CREATE INDEX CONCURRENTLY idx_oids_mib_id ON oids(mib_id);
CREATE INDEX CONCURRENTLY idx_configs_created_at ON configs(created_at);

-- 分析表统计信息
ANALYZE mibs;
ANALYZE devices;
ANALYZE oids;
ANALYZE configs;
```

### Redis 优化

#### 内存配置
```bash
# redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000

# 启用压缩
rdbcompression yes
rdbchecksum yes

# 优化网络
tcp-keepalive 300
timeout 0
```

### 应用优化

#### Go 后端优化
```bash
# 环境变量优化
export GOMAXPROCS=4
export GOGC=100
export GOMEMLIMIT=1GiB

# 编译优化
go build -ldflags="-s -w" -o mib-platform
```

#### Next.js 前端优化
```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizeImages: true,
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  },
};
```

---

## 🐛 故障排除

### 常见问题

#### 1. 服务启动失败
```bash
# 查看容器日志
docker-compose logs backend
docker-compose logs frontend

# 查看 Kubernetes Pod 日志
kubectl logs deployment/snmp-mib-platform-backend -n monitoring
kubectl describe pod <pod-name> -n monitoring

# 检查配置文件
docker-compose config
kubectl get configmap app-config -o yaml -n monitoring
```

#### 2. 数据库连接问题
```bash
# 测试数据库连接
docker-compose exec backend ping postgres
kubectl exec -it deployment/snmp-mib-platform-backend -n monitoring -- ping postgres

# 检查数据库状态
docker-compose exec postgres pg_isready -U postgres
kubectl exec -it deployment/postgres -n monitoring -- pg_isready -U postgres

# 查看数据库日志
docker-compose logs postgres
kubectl logs deployment/postgres -n monitoring
```

#### 3. 网络连接问题
```bash
# 检查端口占用
netstat -tlnp | grep :8080
ss -tlnp | grep :8080

# 测试服务连接
curl -I http://localhost:8080/health
kubectl port-forward svc/snmp-mib-platform-backend 8080:8080 -n monitoring

# 检查防火墙
ufw status
firewall-cmd --list-all
```

#### 4. 性能问题
```bash
# 查看资源使用情况
docker stats
kubectl top pods -n monitoring
kubectl top nodes

# 查看系统负载
top
htop
iostat -x 1

# 分析慢查询
# PostgreSQL
SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

# 应用性能分析
go tool pprof http://localhost:8080/debug/pprof/profile
```

### 日志分析

#### 集中化日志收集
```yaml
# docker-compose.logging.yml
version: '3.8'
services:
  fluentd:
    image: fluent/fluentd:v1.14
    volumes:
      - ./fluentd/conf:/fluentd/etc
    ports:
      - "24224:24224"
    
  elasticsearch:
    image: elasticsearch:7.17.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"
      
  kibana:
    image: kibana:7.17.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

#### 日志查看命令
```bash
# Docker Compose 日志
docker-compose logs -f --tail=100 backend
docker-compose logs -f --tail=100 frontend

# Kubernetes 日志
kubectl logs -f deployment/snmp-mib-platform-backend -n monitoring
kubectl logs --previous deployment/snmp-mib-platform-backend -n monitoring

# 系统日志
journalctl -u docker -f
journalctl -u kubelet -f

# 应用日志
tail -f /var/log/snmp-mib-platform/app.log
```

---

## 🔧 维护和备份

### 定期维护

#### 数据库维护
```bash
#!/bin/bash
# db-maintenance.sh

# 数据库备份
docker-compose exec postgres pg_dump -U postgres mib_platform > \
  /backup/postgres_$(date +%Y%m%d_%H%M%S).sql

# 数据库清理
docker-compose exec postgres psql -U postgres -d mib_platform -c "
  DELETE FROM logs WHERE created_at < NOW() - INTERVAL '30 days';
  VACUUM ANALYZE;
"

# 重建索引
docker-compose exec postgres psql -U postgres -d mib_platform -c "
  REINDEX DATABASE mib_platform;
"
```

#### 系统清理
```bash
#!/bin/bash
# system-cleanup.sh

# 清理 Docker 资源
docker system prune -f
docker volume prune -f
docker image prune -f

# 清理日志文件
find /var/log -name "*.log" -mtime +7 -delete
journalctl --vacuum-time=7d

# 清理临时文件
find /tmp -mtime +3 -delete
```

### 备份策略

#### 自动备份脚本
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup"
RETENTION_DAYS=7

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
echo "备份数据库..."
docker-compose exec postgres pg_dump -U postgres mib_platform | \
  gzip > $BACKUP_DIR/postgres_$DATE.sql.gz

# 备份 Redis
echo "备份 Redis..."
docker-compose exec redis redis-cli --rdb /data/backup.rdb
docker cp $(docker-compose ps -q redis):/data/backup.rdb \
  $BACKUP_DIR/redis_$DATE.rdb

# 备份配置文件
echo "备份配置文件..."
tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
  .env docker-compose*.yml k8s/ nginx/

# 备份上传文件
echo "备份上传文件..."
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz uploads/

# 清理旧备份
echo "清理旧备份..."
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.rdb" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "备份完成: $BACKUP_DIR"
```

#### 恢复脚本
```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1
if [ -z "$BACKUP_FILE" ]; then
    echo "用法: $0 <backup_file>"
    exit 1
fi

# 停止服务
echo "停止服务..."
docker-compose down

# 恢复数据库
echo "恢复数据库..."
gunzip -c $BACKUP_FILE | \
  docker-compose exec -T postgres psql -U postgres mib_platform

# 重启服务
echo "重启服务..."
docker-compose up -d

echo "恢复完成"
```

### 监控和告警

#### 系统监控脚本
```bash
#!/bin/bash
# monitor.sh

# 检查服务状态
check_service() {
    local service=$1
    local url=$2
    
    if curl -f -s $url > /dev/null; then
        echo "✅ $service 正常"
    else
        echo "❌ $service 异常"
        # 发送告警
        curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
          -d "chat_id=$CHAT_ID" \
          -d "text=🚨 $service 服务异常，请检查！"
    fi
}

# 检查各个服务
check_service "前端" "http://localhost:3000"
check_service "后端" "http://localhost:8080/health"
check_service "Grafana" "http://localhost:3001"
check_service "VictoriaMetrics" "http://localhost:8428"

# 检查磁盘空间
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "⚠️ 磁盘使用率过高: $DISK_USAGE%"
fi

# 检查内存使用
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEMORY_USAGE -gt 80 ]; then
    echo "⚠️ 内存使用率过高: $MEMORY_USAGE%"
fi
```

---

## 📚 参考文档

- [Docker 官方文档](https://docs.docker.com/)
- [Kubernetes 官方文档](https://kubernetes.io/docs/)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [Redis 文档](https://redis.io/documentation)
- [VictoriaMetrics 文档](https://docs.victoriametrics.com/)
- [Grafana 文档](https://grafana.com/docs/)
- [Next.js 文档](https://nextjs.org/docs)
- [Go 文档](https://golang.org/doc/)

---

## 🆘 技术支持

如果遇到问题，请：

1. **查看文档**: 首先查看本部署指南和故障排除部分
2. **检查日志**: 查看应用和系统日志获取错误信息
3. **搜索问题**: 在 GitHub Issues 中搜索类似问题
4. **提交 Issue**: 如果问题未解决，请提交详细的 Issue
5. **联系支持**: 发送邮件至技术支持团队

---

**注意**: 本部署指南适用于生产环境，请根据实际情况调整配置参数和安全设置。