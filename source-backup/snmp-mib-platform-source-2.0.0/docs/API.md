# API 文档

MIB Web UI 提供了一套完整的 RESTful API，用于管理和监控网络设备。本文档详细描述了所有可用的 API 端点。

## 📋 目录

- [基础信息](#基础信息)
- [认证](#认证)
- [响应格式](#响应格式)
- [错误处理](#错误处理)
- [速率限制](#速率限制)
- [API 端点](#api-端点)
  - [健康检查](#健康检查)
  - [分析和监控](#分析和监控)
  - [SNMP 管理](#snmp-管理)
  - [设备管理](#设备管理)
  - [用户管理](#用户管理)

## 🌐 基础信息

### Base URL

```
开发环境: http://localhost:3000/api
生产环境: https://your-domain.com/api
```

### API 版本

当前版本：`v1`

所有 API 端点都包含在 `/api` 路径下。

### 内容类型

- **请求**: `application/json`
- **响应**: `application/json`

## 🔐 认证

### JWT Token 认证

大多数 API 端点需要 JWT token 认证。在请求头中包含 token：

```http
Authorization: Bearer <your-jwt-token>
```

### 获取 Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name"
    }
  },
  "message": "Login successful",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 📄 响应格式

所有 API 响应都遵循统一的格式：

```typescript
interface ApiResponse<T> {
  success: boolean;          // 请求是否成功
  data?: T;                 // 响应数据（成功时）
  message: string;          // 响应消息
  timestamp: string;        // ISO 8601 时间戳
  errors?: string[];        // 错误信息（失败时）
  meta?: {                  // 元数据（可选）
    page?: number;
    limit?: number;
    total?: number;
  };
}
```

### 成功响应示例

```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Device Name"
  },
  "message": "Device retrieved successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 错误响应示例

```json
{
  "success": false,
  "message": "Validation failed",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "errors": [
    "Email is required",
    "Password must be at least 8 characters"
  ]
}
```

## ❌ 错误处理

### HTTP 状态码

| 状态码 | 含义 | 描述 |
|--------|------|------|
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证或认证失败 |
| 403 | Forbidden | 权限不足 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突 |
| 422 | Unprocessable Entity | 数据验证失败 |
| 429 | Too Many Requests | 请求过于频繁 |
| 500 | Internal Server Error | 服务器内部错误 |

### 错误代码

```typescript
enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}
```

## 🚦 速率限制

为了保护 API 免受滥用，我们实施了速率限制：

- **通用限制**: 每 15 分钟 100 请求
- **认证端点**: 每 15 分钟 5 次登录尝试
- **数据写入**: 每分钟 20 请求

### 速率限制响应头

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 🔗 API 端点

### 健康检查

#### 获取应用健康状态

```http
GET /api/health
```

**参数**：
- `detailed` (query, optional): 是否返回详细信息

**响应**：
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 3600,
    "version": "1.0.0",
    "environment": "production",
    "services": {
      "database": {
        "status": "healthy",
        "responseTime": 5
      },
      "redis": {
        "status": "healthy",
        "responseTime": 2
      }
    },
    "system": {
      "memory": {
        "used": 512,
        "total": 2048,
        "percentage": 25
      },
      "disk": {
        "used": 10,
        "total": 100,
        "percentage": 10
      }
    }
  },
  "message": "System is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 简单健康检查

```http
HEAD /api/health
```

返回 200 状态码表示服务正常。

### 分析和监控

#### 发送分析数据

```http
POST /api/analytics
Content-Type: application/json

{
  "type": "web-vitals",
  "data": {
    "name": "CLS",
    "value": 0.1,
    "rating": "good",
    "url": "/dashboard"
  }
}
```

**请求体**：
```typescript
interface AnalyticsData {
  type: 'web-vitals' | 'error' | 'interaction' | 'performance';
  data: {
    name?: string;
    value?: number;
    rating?: 'good' | 'needs-improvement' | 'poor';
    url?: string;
    userAgent?: string;
    [key: string]: any;
  };
}
```

**响应**：
```json
{
  "success": true,
  "message": "Analytics data recorded",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 获取分析数据

```http
GET /api/analytics?type=web-vitals&limit=100&since=2024-01-01
```

**查询参数**：
- `type` (optional): 数据类型过滤
- `limit` (optional): 返回数量限制 (默认: 100)
- `since` (optional): 起始时间 (ISO 8601)
- `until` (optional): 结束时间 (ISO 8601)

**响应**：
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": "entry-id",
        "type": "web-vitals",
        "data": {
          "name": "CLS",
          "value": 0.1,
          "rating": "good"
        },
        "timestamp": "2024-01-01T00:00:00.000Z",
        "clientIp": "192.168.1.1"
      }
    ],
    "stats": {
      "total": 1000,
      "byType": {
        "web-vitals": 500,
        "error": 100,
        "interaction": 300,
        "performance": 100
      },
      "byRating": {
        "good": 800,
        "needs-improvement": 150,
        "poor": 50
      },
      "averages": {
        "CLS": 0.05,
        "FID": 50,
        "FCP": 1200,
        "LCP": 2000,
        "TTFB": 200
      }
    }
  },
  "message": "Analytics data retrieved",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### SNMP 管理

#### 查询 SNMP 设备

```http
POST /api/snmp/query
Content-Type: application/json
Authorization: Bearer <token>

{
  "host": "192.168.1.1",
  "community": "public",
  "version": "2c",
  "oids": ["1.3.6.1.2.1.1.1.0", "1.3.6.1.2.1.1.3.0"]
}
```

**请求体**：
```typescript
interface SnmpQueryRequest {
  host: string;
  port?: number;
  community?: string;
  version?: '1' | '2c' | '3';
  oids: string[];
  timeout?: number;
  retries?: number;
  // SNMPv3 参数
  user?: string;
  authProtocol?: 'MD5' | 'SHA';
  authPassword?: string;
  privProtocol?: 'DES' | 'AES';
  privPassword?: string;
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "host": "192.168.1.1",
    "results": [
      {
        "oid": "1.3.6.1.2.1.1.1.0",
        "type": "OctetString",
        "value": "Cisco IOS Software"
      },
      {
        "oid": "1.3.6.1.2.1.1.3.0",
        "type": "TimeTicks",
        "value": 123456789
      }
    ],
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "message": "SNMP query successful",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 获取 MIB 信息

```http
GET /api/snmp/mibs?search=system
```

**查询参数**：
- `search` (optional): 搜索关键词
- `category` (optional): MIB 分类
- `page` (optional): 页码
- `limit` (optional): 每页数量

**响应**：
```json
{
  "success": true,
  "data": {
    "mibs": [
      {
        "oid": "1.3.6.1.2.1.1",
        "name": "system",
        "description": "System group",
        "syntax": "OBJECT IDENTIFIER",
        "access": "not-accessible",
        "children": [
          {
            "oid": "1.3.6.1.2.1.1.1",
            "name": "sysDescr",
            "description": "System description"
          }
        ]
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  },
  "message": "MIB information retrieved",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 设备管理

#### 获取设备列表

```http
GET /api/devices?status=active&page=1&limit=20
Authorization: Bearer <token>
```

**查询参数**：
- `status` (optional): 设备状态过滤
- `type` (optional): 设备类型过滤
- `search` (optional): 搜索关键词
- `page` (optional): 页码
- `limit` (optional): 每页数量

**响应**：
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "id": "device-1",
        "name": "Router-01",
        "host": "192.168.1.1",
        "type": "router",
        "status": "active",
        "lastSeen": "2024-01-01T00:00:00.000Z",
        "snmpConfig": {
          "version": "2c",
          "community": "public",
          "port": 161
        },
        "metrics": {
          "uptime": 3600,
          "cpuUsage": 25.5,
          "memoryUsage": 60.2
        }
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50
  },
  "message": "Devices retrieved successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 添加设备

```http
POST /api/devices
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "New Router",
  "host": "192.168.1.10",
  "type": "router",
  "snmpConfig": {
    "version": "2c",
    "community": "public",
    "port": 161,
    "timeout": 5000,
    "retries": 3
  },
  "description": "Main office router",
  "location": "Server Room A"
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "id": "device-new",
    "name": "New Router",
    "host": "192.168.1.10",
    "type": "router",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Device added successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 获取设备详情

```http
GET /api/devices/{deviceId}
Authorization: Bearer <token>
```

#### 更新设备

```http
PUT /api/devices/{deviceId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Updated Router Name",
  "description": "Updated description"
}
```

#### 删除设备

```http
DELETE /api/devices/{deviceId}
Authorization: Bearer <token>
```

### 用户管理

#### 获取用户信息

```http
GET /api/users/me
Authorization: Bearer <token>
```

#### 更新用户信息

```http
PUT /api/users/me
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Updated Name",
  "email": "new-email@example.com"
}
```

#### 修改密码

```http
POST /api/users/change-password
Content-Type: application/json
Authorization: Bearer <token>

{
  "currentPassword": "current-password",
  "newPassword": "new-password"
}
```

## 📊 Webhook

### 设备状态变更通知

当设备状态发生变更时，系统会向配置的 Webhook URL 发送通知：

```http
POST {webhook_url}
Content-Type: application/json

{
  "event": "device.status.changed",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": {
    "deviceId": "device-1",
    "deviceName": "Router-01",
    "previousStatus": "active",
    "currentStatus": "inactive",
    "reason": "Connection timeout"
  }
}
```

## 🔧 SDK 和工具

### JavaScript/TypeScript SDK

```bash
npm install @mibweb/api-client
```

```typescript
import { MibWebClient } from '@mibweb/api-client';

const client = new MibWebClient({
  baseUrl: 'https://your-domain.com/api',
  token: 'your-jwt-token'
});

// 获取设备列表
const devices = await client.devices.list();

// 查询 SNMP
const result = await client.snmp.query({
  host: '192.168.1.1',
  community: 'public',
  oids: ['1.3.6.1.2.1.1.1.0']
});
```

### cURL 示例

```bash
# 获取健康状态
curl -X GET "https://your-domain.com/api/health"

# 登录获取 token
curl -X POST "https://your-domain.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# 获取设备列表
curl -X GET "https://your-domain.com/api/devices" \
  -H "Authorization: Bearer your-jwt-token"
```

## 📝 更新日志

### v1.0.0
- 初始 API 版本
- 基础健康检查端点
- 分析数据收集
- SNMP 查询功能
- 设备管理 CRUD
- 用户认证和管理

---

## 📞 支持

如果您在使用 API 时遇到问题，请：

1. 查看本文档的相关部分
2. 检查 [常见问题](../FAQ.md)
3. 提交 [GitHub Issue](https://github.com/your-org/mibweb-ui/issues)
4. 联系技术支持：api-support@example.com

---

**注意**：本 API 文档会随着新版本的发布而更新。请定期查看最新版本。