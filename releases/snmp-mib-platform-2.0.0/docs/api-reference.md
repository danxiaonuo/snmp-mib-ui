# 📡 API参考文档

## 📋 目录

1. [API概述](#api概述)
2. [认证和授权](#认证和授权)
3. [VictoriaMetrics API](#victoriametrics-api)
4. [VMAgent API](#vmagent-api)
5. [VMAlert API](#vmalert-api)
6. [Grafana API](#grafana-api)
7. [Alertmanager API](#alertmanager-api)
8. [监控安装器API](#监控安装器api)
9. [错误处理](#错误处理)
10. [SDK和客户端库](#sdk和客户端库)
11. [API使用示例](#api使用示例)

## 🎯 API概述

监控安装器系统提供了完整的RESTful API，支持所有核心功能的编程访问。API遵循OpenAPI 3.0规范，提供JSON格式的请求和响应。

### 基础信息

- **API版本**: v1
- **基础URL**: `http://localhost:8428` (VictoriaMetrics)
- **内容类型**: `application/json`
- **字符编码**: UTF-8
- **时间格式**: RFC3339 (ISO 8601)

### 通用响应格式

```json
{
  "status": "success|error",
  "data": {},
  "error": "error message",
  "warnings": ["warning messages"],
  "timestamp": "2024-01-20T10:30:00Z"
}
```

## 🔐 认证和授权

### 基础认证

```bash
# HTTP Basic Auth
curl -u username:password http://localhost:8428/api/v1/query

# Bearer Token
curl -H "Authorization: Bearer <token>" http://localhost:8428/api/v1/query
```

### API Key认证

```bash
# 通过Header传递
curl -H "X-API-Key: your-api-key" http://localhost:8428/api/v1/query

# 通过查询参数传递
curl "http://localhost:8428/api/v1/query?api_key=your-api-key&query=up"
```

## 📊 VictoriaMetrics API

### 查询API

#### 即时查询

**端点**: `GET /api/v1/query`

**参数**:
- `query` (必需): PromQL查询表达式
- `time` (可选): 查询时间戳 (RFC3339格式)
- `timeout` (可选): 查询超时时间

**示例**:
```bash
# 查询当前所有实例状态
curl 'http://localhost:8428/api/v1/query?query=up'

# 查询特定时间点的CPU使用率
curl 'http://localhost:8428/api/v1/query?query=cpu_usage&time=2024-01-20T10:30:00Z'
```

**响应**:
```json
{
  "status": "success",
  "data": {
    "resultType": "vector",
    "result": [
      {
        "metric": {
          "__name__": "up",
          "instance": "localhost:9100",
          "job": "node-exporter"
        },
        "value": [1642680600, "1"]
      }
    ]
  }
}
```

#### 范围查询

**端点**: `GET /api/v1/query_range`

**参数**:
- `query` (必需): PromQL查询表达式
- `start` (必需): 开始时间戳
- `end` (必需): 结束时间戳
- `step` (必需): 查询步长

**示例**:
```bash
# 查询过去1小时的CPU使用率
curl 'http://localhost:8428/api/v1/query_range?query=rate(cpu_usage[5m])&start=2024-01-20T09:30:00Z&end=2024-01-20T10:30:00Z&step=60s'
```

**响应**:
```json
{
  "status": "success",
  "data": {
    "resultType": "matrix",
    "result": [
      {
        "metric": {
          "instance": "localhost:9100"
        },
        "values": [
          [1642680600, "0.25"],
          [1642680660, "0.30"],
          [1642680720, "0.28"]
        ]
      }
    ]
  }
}
```

### 元数据API

#### 获取标签名称

**端点**: `GET /api/v1/labels`

```bash
curl 'http://localhost:8428/api/v1/labels'
```

**响应**:
```json
{
  "status": "success",
  "data": [
    "__name__",
    "instance",
    "job",
    "cpu",
    "mode"
  ]
}
```

#### 获取标签值

**端点**: `GET /api/v1/label/{label_name}/values`

```bash
# 获取所有job标签的值
curl 'http://localhost:8428/api/v1/label/job/values'
```

**响应**:
```json
{
  "status": "success",
  "data": [
    "node-exporter",
    "victoriametrics",
    "vmagent"
  ]
}
```

#### 获取指标名称

**端点**: `GET /api/v1/label/__name__/values`

```bash
curl 'http://localhost:8428/api/v1/label/__name__/values'
```

### 数据写入API

#### 远程写入

**端点**: `POST /api/v1/write`

**Content-Type**: `application/x-protobuf`

```bash
# 使用VMAgent进行数据写入
curl -X POST 'http://localhost:8428/api/v1/write' \
  -H 'Content-Type: application/x-protobuf' \
  --data-binary @metrics.pb
```

#### InfluxDB格式写入

**端点**: `POST /api/v1/influx/write`

```bash
# InfluxDB line protocol格式
curl -X POST 'http://localhost:8428/api/v1/influx/write' \
  -d 'cpu_usage,host=server01,region=us-west value=0.64 1642680600000000000'
```

### 管理API

#### 健康检查

**端点**: `GET /health`

```bash
curl 'http://localhost:8428/health'
```

**响应**:
```json
{
  "status": "ok"
}
```

#### 创建快照

**端点**: `POST /snapshot/create`

```bash
curl -X POST 'http://localhost:8428/snapshot/create'
```

**响应**:
```json
{
  "status": "ok",
  "snapshot": "20240120T103000Z-1234567890"
}
```

#### 删除时间序列

**端点**: `POST /api/v1/admin/tsdb/delete_series`

**参数**:
- `match[]`: 匹配表达式
- `start`: 开始时间
- `end`: 结束时间

```bash
# 删除特定时间范围的数据
curl -X POST 'http://localhost:8428/api/v1/admin/tsdb/delete_series?match[]={job="old-job"}&start=2024-01-01T00:00:00Z&end=2024-01-10T00:00:00Z'
```

## 🕷️ VMAgent API

### 配置管理

#### 重载配置

**端点**: `POST /-/reload`

```bash
curl -X POST 'http://localhost:8429/-/reload'
```

#### 获取配置

**端点**: `GET /config`

```bash
curl 'http://localhost:8429/config'
```

### 目标管理

#### 获取采集目标

**端点**: `GET /targets`

```bash
curl 'http://localhost:8429/targets'
```

**响应**:
```json
{
  "status": "success",
  "data": {
    "activeTargets": [
      {
        "discoveredLabels": {
          "__address__": "localhost:9100",
          "__metrics_path__": "/metrics",
          "__scheme__": "http",
          "job": "node-exporter"
        },
        "labels": {
          "instance": "localhost:9100",
          "job": "node-exporter"
        },
        "scrapePool": "node-exporter",
        "scrapeUrl": "http://localhost:9100/metrics",
        "globalUrl": "http://localhost:9100/metrics",
        "lastError": "",
        "lastScrape": "2024-01-20T10:30:00Z",
        "lastScrapeDuration": 0.002,
        "health": "up"
      }
    ],
    "droppedTargets": []
  }
}
```

### 指标API

#### 获取内部指标

**端点**: `GET /metrics`

```bash
curl 'http://localhost:8429/metrics'
```

## 🚨 VMAlert API

### 告警规则管理

#### 获取告警规则

**端点**: `GET /api/v1/rules`

```bash
curl 'http://localhost:8080/api/v1/rules'
```

**响应**:
```json
{
  "status": "success",
  "data": {
    "groups": [
      {
        "name": "system.rules",
        "file": "/etc/vmalert/rules.yml",
        "rules": [
          {
            "state": "inactive",
            "name": "InstanceDown",
            "query": "up == 0",
            "duration": 300,
            "labels": {
              "severity": "critical"
            },
            "annotations": {
              "summary": "Instance {{ $labels.instance }} down"
            },
            "alerts": [],
            "health": "ok",
            "evaluationTime": 0.001,
            "lastEvaluation": "2024-01-20T10:30:00Z"
          }
        ],
        "interval": 30,
        "evaluationTime": 0.001,
        "lastEvaluation": "2024-01-20T10:30:00Z"
      }
    ]
  }
}
```

#### 获取活跃告警

**端点**: `GET /api/v1/alerts`

```bash
curl 'http://localhost:8080/api/v1/alerts'
```

**响应**:
```json
{
  "status": "success",
  "data": {
    "alerts": [
      {
        "labels": {
          "alertname": "InstanceDown",
          "instance": "localhost:9100",
          "job": "node-exporter",
          "severity": "critical"
        },
        "annotations": {
          "summary": "Instance localhost:9100 down"
        },
        "state": "firing",
        "activeAt": "2024-01-20T10:25:00Z",
        "value": "0"
      }
    ]
  }
}
```

### 配置管理

#### 重载配置

**端点**: `POST /-/reload`

```bash
curl -X POST 'http://localhost:8080/-/reload'
```

#### 验证配置

**端点**: `POST /api/v1/rules/validate`

```bash
curl -X POST 'http://localhost:8080/api/v1/rules/validate' \
  -H 'Content-Type: application/yaml' \
  --data-binary @rules.yml
```

## 🎨 Grafana API

### 仪表盘管理

#### 搜索仪表盘

**端点**: `GET /api/search`

```bash
curl -H "Authorization: Bearer <api-key>" \
  'http://localhost:3001/api/search?type=dash-db'
```

**响应**:
```json
[
  {
    "id": 1,
    "uid": "system-overview",
    "title": "System Overview",
    "uri": "db/system-overview",
    "url": "/d/system-overview/system-overview",
    "slug": "system-overview",
    "type": "dash-db",
    "tags": ["system", "monitoring"],
    "isStarred": false,
    "folderId": 0,
    "folderUid": "",
    "folderTitle": "General",
    "folderUrl": ""
  }
]
```

#### 获取仪表盘

**端点**: `GET /api/dashboards/uid/{uid}`

```bash
curl -H "Authorization: Bearer <api-key>" \
  'http://localhost:3001/api/dashboards/uid/system-overview'
```

#### 创建仪表盘

**端点**: `POST /api/dashboards/db`

```bash
curl -X POST \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "dashboard": {
      "title": "New Dashboard",
      "panels": [],
      "time": {
        "from": "now-1h",
        "to": "now"
      },
      "refresh": "30s"
    },
    "overwrite": false
  }' \
  'http://localhost:3001/api/dashboards/db'
```

### 数据源管理

#### 获取数据源列表

**端点**: `GET /api/datasources`

```bash
curl -H "Authorization: Bearer <api-key>" \
  'http://localhost:3001/api/datasources'
```

#### 创建数据源

**端点**: `POST /api/datasources`

```bash
curl -X POST \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "VictoriaMetrics",
    "type": "prometheus",
    "url": "http://victoriametrics:8428",
    "access": "proxy",
    "isDefault": true
  }' \
  'http://localhost:3001/api/datasources'
```

### 用户管理

#### 获取用户列表

**端点**: `GET /api/users`

```bash
curl -H "Authorization: Bearer <api-key>" \
  'http://localhost:3001/api/users'
```

#### 创建用户

**端点**: `POST /api/admin/users`

```bash
curl -X POST \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "login": "john",
    "password": "password123"
  }' \
  'http://localhost:3001/api/admin/users'
```

## 📢 Alertmanager API

### 告警管理

#### 获取告警列表

**端点**: `GET /api/v1/alerts`

```bash
curl 'http://localhost:9093/api/v1/alerts'
```

**响应**:
```json
[
  {
    "labels": {
      "alertname": "InstanceDown",
      "instance": "localhost:9100",
      "job": "node-exporter",
      "severity": "critical"
    },
    "annotations": {
      "summary": "Instance localhost:9100 down"
    },
    "startsAt": "2024-01-20T10:25:00Z",
    "endsAt": "0001-01-01T00:00:00Z",
    "generatorURL": "http://vmalert:8080/...",
    "status": {
      "state": "active",
      "silencedBy": [],
      "inhibitedBy": []
    },
    "receivers": ["default"],
    "fingerprint": "abc123def456"
  }
]
```

#### 发送告警

**端点**: `POST /api/v1/alerts`

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '[
    {
      "labels": {
        "alertname": "TestAlert",
        "severity": "warning"
      },
      "annotations": {
        "summary": "This is a test alert"
      },
      "startsAt": "2024-01-20T10:30:00Z"
    }
  ]' \
  'http://localhost:9093/api/v1/alerts'
```

### 静默管理

#### 获取静默列表

**端点**: `GET /api/v1/silences`

```bash
curl 'http://localhost:9093/api/v1/silences'
```

#### 创建静默

**端点**: `POST /api/v1/silences`

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "matchers": [
      {
        "name": "alertname",
        "value": "InstanceDown",
        "isRegex": false
      }
    ],
    "startsAt": "2024-01-20T10:30:00Z",
    "endsAt": "2024-01-20T12:30:00Z",
    "createdBy": "admin",
    "comment": "Maintenance window"
  }' \
  'http://localhost:9093/api/v1/silences'
```

#### 删除静默

**端点**: `DELETE /api/v1/silence/{id}`

```bash
curl -X DELETE 'http://localhost:9093/api/v1/silence/abc123def456'
```

## 🛠️ 监控安装器API

### 部署管理

#### 获取部署状态

**端点**: `GET /api/v1/deployment/status`

```bash
curl 'http://localhost:3000/api/v1/deployment/status'
```

**响应**:
```json
{
  "status": "success",
  "data": {
    "deploymentMode": "standalone",
    "components": {
      "victoriametrics": {
        "status": "running",
        "health": "healthy",
        "version": "v1.95.1",
        "uptime": "2h30m"
      },
      "grafana": {
        "status": "running",
        "health": "healthy",
        "version": "10.2.0",
        "uptime": "2h30m"
      }
    },
    "lastUpdate": "2024-01-20T10:30:00Z"
  }
}
```

#### 开始部署

**端点**: `POST /api/v1/deployment/start`

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "standalone",
    "components": [
      "victoriametrics",
      "grafana",
      "node-exporter",
      "vmagent"
    ],
    "config": {
      "retentionPeriod": "30d",
      "scrapeInterval": "15s"
    }
  }' \
  'http://localhost:3000/api/v1/deployment/start'
```

#### 停止部署

**端点**: `POST /api/v1/deployment/stop`

```bash
curl -X POST 'http://localhost:3000/api/v1/deployment/stop'
```

### 配置管理

#### 生成配置

**端点**: `POST /api/v1/config/generate`

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "template": "enterprise",
    "mode": "cluster",
    "components": [
      "vmstorage",
      "vminsert",
      "vmselect",
      "grafana"
    ],
    "customConfig": {
      "storageNodes": 3,
      "retentionPeriod": "1y"
    }
  }' \
  'http://localhost:3000/api/v1/config/generate'
```

**响应**:
```json
{
  "status": "success",
  "data": {
    "dockerCompose": "version: '3.8'\nservices:...",
    "configs": {
      "prometheus.yml": "global:\n  scrape_interval: 15s...",
      "grafana.ini": "[server]\nhttp_port = 3001..."
    },
    "checksum": "abc123def456"
  }
}
```

#### 验证配置

**端点**: `POST /api/v1/config/validate`

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "dockerCompose": "version: '3.8'\nservices:...",
    "configs": {
      "prometheus.yml": "global:\n  scrape_interval: 15s..."
    }
  }' \
  'http://localhost:3000/api/v1/config/validate'
```

### 模板管理

#### 获取模板列表

**端点**: `GET /api/v1/templates`

```bash
curl 'http://localhost:3000/api/v1/templates'
```

**响应**:
```json
{
  "status": "success",
  "data": [
    {
      "id": "simple",
      "name": "简单监控套件",
      "description": "适合个人项目和学习环境",
      "category": "basic",
      "components": ["node-exporter", "victoriametrics", "grafana"],
      "author": "监控团队",
      "version": "1.0.0",
      "downloads": 1250,
      "rating": 4.8
    }
  ]
}
```

#### 获取模板详情

**端点**: `GET /api/v1/templates/{id}`

```bash
curl 'http://localhost:3000/api/v1/templates/enterprise'
```

## ❌ 错误处理

### 错误响应格式

```json
{
  "status": "error",
  "error": "详细错误信息",
  "errorType": "bad_data|timeout|internal|not_found",
  "code": 400,
  "timestamp": "2024-01-20T10:30:00Z"
}
```

### 常见错误码

| HTTP状态码 | 错误类型 | 描述 |
|------------|----------|------|
| 400 | bad_data | 请求参数错误 |
| 401 | unauthorized | 认证失败 |
| 403 | forbidden | 权限不足 |
| 404 | not_found | 资源不存在 |
| 422 | unprocessable_entity | 查询语法错误 |
| 429 | too_many_requests | 请求频率过高 |
| 500 | internal | 服务器内部错误 |
| 503 | service_unavailable | 服务不可用 |
| 504 | timeout | 请求超时 |

### 错误处理示例

```bash
# 使用jq处理错误响应
response=$(curl -s 'http://localhost:8428/api/v1/query?query=invalid_syntax')
status=$(echo $response | jq -r '.status')

if [ "$status" = "error" ]; then
    error=$(echo $response | jq -r '.error')
    echo "查询失败: $error"
else
    echo "查询成功"
fi
```

## 📚 SDK和客户端库

### Python客户端

```python
import requests
import json
from datetime import datetime, timedelta

class VictoriaMetricsClient:
    def __init__(self, base_url="http://localhost:8428"):
        self.base_url = base_url
    
    def query(self, query, time=None):
        """执行即时查询"""
        params = {'query': query}
        if time:
            params['time'] = time
        
        response = requests.get(f"{self.base_url}/api/v1/query", params=params)
        return response.json()
    
    def query_range(self, query, start, end, step):
        """执行范围查询"""
        params = {
            'query': query,
            'start': start,
            'end': end,
            'step': step
        }
        
        response = requests.get(f"{self.base_url}/api/v1/query_range", params=params)
        return response.json()
    
    def get_labels(self):
        """获取所有标签名称"""
        response = requests.get(f"{self.base_url}/api/v1/labels")
        return response.json()

# 使用示例
client = VictoriaMetricsClient()

# 查询当前CPU使用率
result = client.query('100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)')
print(json.dumps(result, indent=2))

# 查询过去1小时的内存使用率
end_time = datetime.now()
start_time = end_time - timedelta(hours=1)

result = client.query_range(
    'node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100',
    start_time.isoformat(),
    end_time.isoformat(),
    '60s'
)
print(json.dumps(result, indent=2))
```

### JavaScript客户端

```javascript
class VictoriaMetricsClient {
    constructor(baseUrl = 'http://localhost:8428') {
        this.baseUrl = baseUrl;
    }
    
    async query(query, time = null) {
        const params = new URLSearchParams({ query });
        if (time) {
            params.append('time', time);
        }
        
        const response = await fetch(`${this.baseUrl}/api/v1/query?${params}`);
        return await response.json();
    }
    
    async queryRange(query, start, end, step) {
        const params = new URLSearchParams({
            query,
            start,
            end,
            step
        });
        
        const response = await fetch(`${this.baseUrl}/api/v1/query_range?${params}`);
        return await response.json();
    }
    
    async getLabels() {
        const response = await fetch(`${this.baseUrl}/api/v1/labels`);
        return await response.json();
    }
}

// 使用示例
const client = new VictoriaMetricsClient();

// 查询系统负载
client.query('node_load1')
    .then(result => {
        console.log('System Load:', result);
    })
    .catch(error => {
        console.error('Query failed:', error);
    });

// 查询过去24小时的磁盘使用率
const endTime = new Date();
const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

client.queryRange(
    '(node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100',
    startTime.toISOString(),
    endTime.toISOString(),
    '1h'
).then(result => {
    console.log('Disk Usage:', result);
});
```

### Go客户端

```go
package main

import (
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
    "net/url"
    "time"
)

type VictoriaMetricsClient struct {
    BaseURL string
    Client  *http.Client
}

type QueryResult struct {
    Status string      `json:"status"`
    Data   interface{} `json:"data"`
    Error  string      `json:"error,omitempty"`
}

func NewClient(baseURL string) *VictoriaMetricsClient {
    return &VictoriaMetricsClient{
        BaseURL: baseURL,
        Client:  &http.Client{Timeout: 30 * time.Second},
    }
}

func (c *VictoriaMetricsClient) Query(query string, t *time.Time) (*QueryResult, error) {
    params := url.Values{}
    params.Add("query", query)
    if t != nil {
        params.Add("time", t.Format(time.RFC3339))
    }
    
    resp, err := c.Client.Get(fmt.Sprintf("%s/api/v1/query?%s", c.BaseURL, params.Encode()))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }
    
    var result QueryResult
    err = json.Unmarshal(body, &result)
    return &result, err
}

func (c *VictoriaMetricsClient) QueryRange(query string, start, end time.Time, step string) (*QueryResult, error) {
    params := url.Values{}
    params.Add("query", query)
    params.Add("start", start.Format(time.RFC3339))
    params.Add("end", end.Format(time.RFC3339))
    params.Add("step", step)
    
    resp, err := c.Client.Get(fmt.Sprintf("%s/api/v1/query_range?%s", c.BaseURL, params.Encode()))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }
    
    var result QueryResult
    err = json.Unmarshal(body, &result)
    return &result, err
}

func main() {
    client := NewClient("http://localhost:8428")
    
    // 查询当前时间的up指标
    result, err := client.Query("up", nil)
    if err != nil {
        fmt.Printf("Query failed: %v\n", err)
        return
    }
    
    fmt.Printf("Query result: %+v\n", result)
    
    // 查询过去1小时的CPU使用率
    endTime := time.Now()
    startTime := endTime.Add(-1 * time.Hour)
    
    result, err = client.QueryRange(
        "100 - (avg by(instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
        startTime,
        endTime,
        "60s",
    )
    if err != nil {
        fmt.Printf("Range query failed: %v\n", err)
        return
    }
    
    fmt.Printf("Range query result: %+v\n", result)
}
```

## 🎯 API使用示例

### 监控仪表盘数据获取

```bash
#!/bin/bash
# dashboard-data.sh - 获取仪表盘数据

BASE_URL="http://localhost:8428"
TIME_RANGE="1h"
STEP="60s"

# 获取当前时间
END_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
START_TIME=$(date -u -d "1 hour ago" +"%Y-%m-%dT%H:%M:%SZ")

echo "📊 获取监控仪表盘数据..."
echo "时间范围: $START_TIME 到 $END_TIME"
echo "======================================"

# CPU使用率
echo "🖥️ CPU使用率:"
curl -s "$BASE_URL/api/v1/query_range?query=100%20-%20(avg%20by(instance)%20(rate(node_cpu_seconds_total{mode="idle"}[5m]))%20*%20100)&start=$START_TIME&end=$END_TIME&step=$STEP" | jq '.data.result[0].values[-1][1]' | xargs printf "%.2f%%\n"

# 内存使用率
echo "🧠 内存使用率:"
curl -s "$BASE_URL/api/v1/query?query=(node_memory_MemTotal_bytes%20-%20node_memory_MemAvailable_bytes)%20/%20node_memory_MemTotal_bytes%20*%20100" | jq '.data.result[0].value[1]' | xargs printf "%.2f%%\n"

# 磁盘使用率
echo "💾 磁盘使用率:"
curl -s "$BASE_URL/api/v1/query?query=(node_filesystem_size_bytes{mountpoint="/"}%20-%20node_filesystem_free_bytes{mountpoint="/"})%20/%20node_filesystem_size_bytes{mountpoint="/"}%20*%20100" | jq '.data.result[0].value[1]' | xargs printf "%.2f%%\n"

# 网络流量
echo "🌐 网络接收流量 (MB/s):"
curl -s "$BASE_URL/api/v1/query?query=rate(node_network_receive_bytes_total{device!="lo"}[5m])%20/%201024%20/%201024" | jq '.data.result[0].value[1]' | xargs printf "%.2f MB/s\n"

echo "🌐 网络发送流量 (MB/s):"
curl -s "$BASE_URL/api/v1/query?query=rate(node_network_transmit_bytes_total{device!="lo"}[5m])%20/%201024%20/%201024" | jq '.data.result[0].value[1]' | xargs printf "%.2f MB/s\n"

echo "======================================"
echo "✅ 数据获取完成！"
```

### 告警规则管理

```python
#!/usr/bin/env python3
# alert-manager.py - 告警规则管理脚本

import requests
import json
import yaml
from datetime import datetime, timedelta

class AlertManager:
    def __init__(self, vmalert_url="http://localhost:8080", alertmanager_url="http://localhost:9093"):
        self.vmalert_url = vmalert_url
        self.alertmanager_url = alertmanager_url
    
    def get_alert_rules(self):
        """获取所有告警规则"""
        response = requests.get(f"{self.vmalert_url}/api/v1/rules")
        return response.json()
    
    def get_active_alerts(self):
        """获取活跃告警"""
        response = requests.get(f"{self.vmalert_url}/api/v1/alerts")
        return response.json()
    
    def get_alertmanager_alerts(self):
        """获取Alertmanager中的告警"""
        response = requests.get(f"{self.alertmanager_url}/api/v1/alerts")
        return response.json()
    
    def create_silence(self, matchers, duration_hours=2, comment="Maintenance"):
        """创建告警静默"""
        start_time = datetime.utcnow()
        end_time = start_time + timedelta(hours=duration_hours)
        
        silence_data = {
            "matchers": matchers,
            "startsAt": start_time.isoformat() + "Z",
            "endsAt": end_time.isoformat() + "Z",
            "createdBy": "api",
            "comment": comment
        }
        
        response = requests.post(
            f"{self.alertmanager_url}/api/v1/silences",
            json=silence_data
        )
        return response.json()
    
    def validate_rules(self, rules_yaml):
        """验证告警规则"""
        response = requests.post(
            f"{self.vmalert_url}/api/v1/rules/validate",
            headers={"Content-Type": "application/yaml"},
            data=rules_yaml
        )
        return response.json()

# 使用示例
if __name__ == "__main__":
    alert_mgr = AlertManager()
    
    # 获取当前告警规则
    print("📋 当前告警规则:")
    rules = alert_mgr.get_alert_rules()
    for group in rules.get('data', {}).get('groups', []):
        print(f"  规则组: {group['name']}")
        for rule in group['rules']:
            print(f"    - {rule['name']}: {rule['state']}")
    
    # 获取活跃告警
    print("\n🚨 活跃告警:")
    alerts = alert_mgr.get_active_alerts()
    for alert in alerts.get('data', {}).get('alerts', []):
        print(f"  - {alert['labels']['alertname']}: {alert['state']}")
    
    # 创建维护窗口静默
    print("\n🔇 创建维护窗口静默...")
    matchers = [
        {
            "name": "alertname",
            "value": "InstanceDown",
            "isRegex": False
        }
    ]
    
    silence_result = alert_mgr.create_silence(
        matchers,
        duration_hours=1,
        comment="Scheduled maintenance"
    )
    print(f"静默ID: {silence_result.get('silenceID')}")
```

### 性能监控脚本

```bash
#!/bin/bash
# performance-monitor.sh - 性能监控脚本

VICTORIAMETRICS_URL="http://localhost:8428"
GRAFANA_URL="http://localhost:3001"
ALERTMANAGER_URL="http://localhost:9093"

echo "🔍 监控系统性能检查"
echo "======================================"

# 检查VictoriaMetrics性能
echo "📊 VictoriaMetrics性能指标:"

# 查询QPS
qps=$(curl -s "$VICTORIAMETRICS_URL/api/v1/query?query=rate(vm_http_requests_total[5m])" | jq '.data.result[0].value[1]' | tr -d '"')
echo "  查询QPS: $(printf "%.2f" $qps)"

# 内存使用
memory_usage=$(curl -s "$VICTORIAMETRICS_URL/api/v1/query?query=vm_memory_usage_bytes" | jq '.data.result[0].value[1]' | tr -d '"')
memory_mb=$(echo "scale=2; $memory_usage / 1024 / 1024" | bc)
echo "  内存使用: ${memory_mb} MB"

# 活跃时间序列数
active_series=$(curl -s "$VICTORIAMETRICS_URL/api/v1/query?query=vm_active_timeseries" | jq '.data.result[0].value[1]' | tr -d '"')
echo "  活跃时间序列: $active_series"

# 数据大小
data_size=$(curl -s "$VICTORIAMETRICS_URL/api/v1/query?query=vm_data_size_bytes" | jq '.data.result[0].value[1]' | tr -d '"')
data_gb=$(echo "scale=2; $data_size / 1024 / 1024 / 1024" | bc)
echo "  数据大小: ${data_gb} GB"

# 检查查询延迟
echo "\n⏱️ 查询性能测试:"
start_time=$(date +%s%N)
curl -s "$VICTORIAMETRICS_URL/api/v1/query?query=up" > /dev/null
end_time=$(date +%s%N)
latency=$(echo "scale=3; ($end_time - $start_time) / 1000000" | bc)
echo "  简单查询延迟: ${latency} ms"

# 复杂查询测试
start_time=$(date +%s%N)
curl -s "$VICTORIAMETRICS_URL/api/v1/query?query=rate(node_cpu_seconds_total[5m])" > /dev/null
end_time=$(date +%s%N)
latency=$(echo "scale=3; ($end_time - $start_time) / 1000000" | bc)
echo "  复杂查询延迟: ${latency} ms"

# 检查Grafana性能
echo "\n🎨 Grafana性能检查:"
start_time=$(date +%s%N)
status_code=$(curl -s -o /dev/null -w "%{http_code}" "$GRAFANA_URL/api/health")
end_time=$(date +%s%N)
latency=$(echo "scale=3; ($end_time - $start_time) / 1000000" | bc)

if [ "$status_code" = "200" ]; then
    echo "  健康检查: ✅ 正常 (${latency} ms)"
else
    echo "  健康检查: ❌ 异常 (状态码: $status_code)"
fi

# 检查Alertmanager性能
echo "\n📢 Alertmanager性能检查:"
start_time=$(date +%s%N)
status_code=$(curl -s -o /dev/null -w "%{http_code}" "$ALERTMANAGER_URL/-/healthy")
end_time=$(date +%s%N)
latency=$(echo "scale=3; ($end_time - $start_time) / 1000000" | bc)

if [ "$status_code" = "200" ]; then
    echo "  健康检查: ✅ 正常 (${latency} ms)"
else
    echo "  健康检查: ❌ 异常 (状态码: $status_code)"
fi

# 性能建议
echo "\n💡 性能优化建议:"
if (( $(echo "$qps > 1000" | bc -l) )); then
    echo "  ⚠️ 查询QPS较高，考虑启用查询缓存"
fi

if (( $(echo "$memory_mb > 4000" | bc -l) )); then
    echo "  ⚠️ 内存使用较高，考虑调整内存限制"
fi

if (( $(echo "$active_series > 100000" | bc -l) )); then
    echo "  ⚠️ 时间序列数量较多，考虑优化标签使用"
fi

echo "\n======================================"
echo "✅ 性能检查完成！"
```

---

## 📚 相关文档

- [快速开始指南](./quick-start.md)
- [完整使用手册](./monitoring-installer-guide.md)
- [故障排除指南](./troubleshooting.md)
- [系统架构文档](./system-architecture.md)

---

**API文档版本**: v1.0.0  
**最后更新**: 2024-01-20  
**维护者**: 监控团队