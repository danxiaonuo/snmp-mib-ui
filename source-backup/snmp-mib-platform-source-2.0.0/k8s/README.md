# Kubernetes 部署指南

本目录包含了 SNMP MIB Platform 在 Kubernetes 环境中的完整部署配置。

## 📋 组件列表

### 核心平台
- **snmp-mib-platform**: 主平台应用（前端 + 后端）
- **postgres**: PostgreSQL 数据库
- **redis**: Redis 缓存

### 监控组件
- **victoriametrics**: 时序数据库
- **grafana**: 可视化面板
- **vmalert**: 告警引擎
- **alertmanager**: 告警管理器
- **node-exporter**: 节点监控
- **snmp-exporter**: SNMP 监控

## 🚀 快速部署

### 1. 创建命名空间
```bash
kubectl apply -f namespace.yaml
```

### 2. 部署存储和数据库
```bash
kubectl apply -f snmp-mib-platform.yaml
```

### 3. 部署监控组件
```bash
kubectl apply -f victoriametrics.yaml
kubectl apply -f grafana.yaml
kubectl apply -f vmalert.yaml
kubectl apply -f alertmanager.yaml
kubectl apply -f node-exporter.yaml
kubectl apply -f snmp-exporter.yaml
```

### 4. 验证部署
```bash
# 检查所有 Pod 状态
kubectl get pods -n monitoring

# 检查服务状态
kubectl get svc -n monitoring

# 查看 PVC 状态
kubectl get pvc -n monitoring
```

## 🔧 配置说明

### 存储要求
- **PostgreSQL**: 20Gi
- **VictoriaMetrics**: 50Gi
- **Grafana**: 10Gi
- **SNMP MIB Platform**: 10Gi
- **Alertmanager**: 5Gi

### 资源要求

#### 最小配置
| 组件 | CPU 请求 | 内存请求 | CPU 限制 | 内存限制 |
|------|----------|----------|----------|----------|
| PostgreSQL | 250m | 512Mi | 1 | 2Gi |
| Redis | 100m | 128Mi | 500m | 512Mi |
| VictoriaMetrics | 500m | 1Gi | 2 | 4Gi |
| Grafana | 250m | 512Mi | 1 | 2Gi |
| VMAlert | 100m | 128Mi | 500m | 512Mi |
| Alertmanager | 100m | 128Mi | 500m | 512Mi |
| Node Exporter | 100m | 128Mi | 500m | 512Mi |
| SNMP Exporter | 100m | 128Mi | 500m | 512Mi |
| Platform Backend | 250m | 512Mi | 1 | 2Gi |
| Platform Frontend | 100m | 256Mi | 500m | 1Gi |

#### 推荐配置（生产环境）
- **总 CPU**: 4-8 核
- **总内存**: 16-32Gi
- **总存储**: 200Gi+

## 🌐 访问地址

部署完成后，可以通过以下 NodePort 访问各个服务：

- **SNMP MIB Platform**: http://\<node-ip\>:30080
- **Grafana**: http://\<node-ip\>:30300 (admin/admin123)
- **VictoriaMetrics**: http://\<node-ip\>:30428
- **Alertmanager**: http://\<node-ip\>:30093

## 🔐 安全配置

### 默认密码
- **Grafana**: admin/admin123
- **PostgreSQL**: postgres/postgres123

⚠️ **生产环境请务必修改默认密码！**

### 修改密码
```bash
# 修改 PostgreSQL 密码
kubectl create secret generic postgres-secret \
  --from-literal=postgres-password=<new-password> \
  -n monitoring --dry-run=client -o yaml | kubectl apply -f -

# 修改 Grafana 密码
kubectl patch deployment grafana -n monitoring -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"grafana","env":[{"name":"GF_SECURITY_ADMIN_PASSWORD","value":"<new-password>"}]}]}}}}'
```

## 📊 监控配置

### Grafana 数据源
Grafana 会自动配置 VictoriaMetrics 作为数据源：
- **URL**: http://victoriametrics:8428
- **类型**: Prometheus

### 告警规则
VMAlert 包含以下预配置告警规则：
- 主机宕机检测
- CPU 使用率过高 (>80%)
- 内存使用率过高 (>90%)
- 磁盘空间不足 (<15%)
- 网络流量异常
- 网络接口故障

### 自定义告警
编辑 `vmalert.yaml` 中的 ConfigMap 来添加自定义告警规则。

## 🔄 升级和维护

### 滚动更新
```bash
# 更新平台镜像
kubectl set image deployment/snmp-mib-platform-backend \
  backend=snmp-mib-platform:v2.0.0 -n monitoring

kubectl set image deployment/snmp-mib-platform-frontend \
  frontend=snmp-mib-platform-frontend:v2.0.0 -n monitoring
```

### 备份数据库
```bash
# 创建数据库备份
kubectl exec -it deployment/postgres -n monitoring -- \
  pg_dump -U postgres mib_platform > backup.sql
```

### 扩容
```bash
# 扩容前端副本
kubectl scale deployment snmp-mib-platform-frontend --replicas=3 -n monitoring

# 扩容后端副本
kubectl scale deployment snmp-mib-platform-backend --replicas=2 -n monitoring
```

## 🐛 故障排除

### 常见问题

#### 1. Pod 启动失败
```bash
# 查看 Pod 详情
kubectl describe pod <pod-name> -n monitoring

# 查看日志
kubectl logs <pod-name> -n monitoring
```

#### 2. 存储问题
```bash
# 检查 PVC 状态
kubectl get pvc -n monitoring

# 检查存储类
kubectl get storageclass
```

#### 3. 网络连接问题
```bash
# 测试服务连接
kubectl exec -it deployment/snmp-mib-platform-backend -n monitoring -- \
  curl http://postgres:5432

# 检查服务端点
kubectl get endpoints -n monitoring
```

#### 4. 配置问题
```bash
# 查看 ConfigMap
kubectl get configmap -n monitoring

# 编辑配置
kubectl edit configmap snmp-mib-platform-config -n monitoring
```

## 📈 性能优化

### 1. 资源调优
根据实际负载调整资源限制：
```bash
kubectl patch deployment victoriametrics -n monitoring -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"victoriametrics","resources":{"limits":{"cpu":"4","memory":"8Gi"}}}]}}}}'
```

### 2. 存储优化
- 使用 SSD 存储类提高 I/O 性能
- 为 VictoriaMetrics 配置更大的存储空间
- 启用存储压缩

### 3. 网络优化
- 使用 Ingress 替代 NodePort
- 配置负载均衡器
- 启用 HTTPS

## 🔧 高级配置

### Ingress 配置
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: snmp-mib-platform-ingress
  namespace: monitoring
spec:
  rules:
  - host: snmp.example.com
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

### 持久化存储配置
```yaml
apiVersion: v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/gce-pd
parameters:
  type: pd-ssd
  replication-type: regional-pd
```

## 📚 相关文档

- [Kubernetes 官方文档](https://kubernetes.io/docs/)
- [VictoriaMetrics 文档](https://docs.victoriametrics.com/)
- [Grafana 文档](https://grafana.com/docs/)
- [SNMP Exporter 文档](https://github.com/prometheus/snmp_exporter)

## 🆘 支持

如果遇到问题，请：
1. 查看本文档的故障排除部分
2. 检查 Kubernetes 集群状态
3. 查看应用日志
4. 提交 Issue 到项目仓库