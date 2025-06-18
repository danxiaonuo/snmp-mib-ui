# 🌐 企业级SNMP监控平台

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15+-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Production Ready](https://img.shields.io/badge/Production-Ready-success.svg)](#)
[![Real Data](https://img.shields.io/badge/Real-Data%20Only-brightgreen.svg)](#)

**[🇨🇳 中文](README.md) | [🇺🇸 English](README_EN.md)**

</div>

> 🚀 **生产就绪的真实SNMP网络监控解决方案** - 基于Next.js 15构建的现代化企业级监控平台

## ✨ 核心特色

### 🎯 **100%真实数据监控**
- ✅ **零模拟数据** - 所有数据来自真实SNMP设备查询
- ✅ **官方标准配置** - 完全符合snmp-exporter和categraf官方规范
- ✅ **实际设备发现** - 真实网络扫描和设备识别
- ✅ **真实配置部署** - 实际文件操作和远程部署

### 🚀 **生产级功能完整性**
- 📊 **增强的OID库管理** - 完整的厂商特定OID支持 (Cisco, H3C, 华为)
- 🔄 **配置版本管理** - Git风格的版本控制和配置对比
- 🏭 **批量设备管理** - 支持并行/顺序/滚动部署策略
- 📡 **实时监控预览** - WebSocket实时数据流和多厂商模板
- 🚨 **智能告警规则** - 自动优化和Prometheus/VMAlert集成
- 🔒 **安全合规扫描** - 全面的配置安全检查和自动修复
- ⚡ **性能基准测试** - 自动化性能测试和优化建议
- 🎛️ **系统集成管理** - 工作流自动化和系统健康监控

## 🎛️ 系统架构

### 📁 核心功能模块

```
Enhanced Features/
├── 📊 enhanced-oid-manager.ts          # OID数据库和厂商映射
├── 🔄 config-version-manager.ts        # Git风格配置版本控制  
├── 🏭 batch-device-manager.ts          # 自动设备发现和批量管理
├── 📡 real-time-monitoring-preview.ts  # WebSocket实时监控
├── 🚨 advanced-alert-rules-manager.ts  # 智能告警规则引擎
├── 🔒 config-compliance-scanner.ts     # 安全合规扫描系统
├── ⚡ performance-benchmark-optimizer.ts # 性能测试和优化
├── 🎛️ system-integration-manager.ts    # 系统集成和健康监控
├── 🎨 enhanced-frontend-components.tsx # 完整React组件库
└── 🔌 api-integration-routes.ts        # 统一API路由系统
```

### 🌐 系统访问地址

| 功能模块 | 访问地址 | 说明 |
|---------|---------|------|
| 🏠 **主仪表板** | http://localhost:3000/dashboard | 增强的系统监控仪表板 |
| 🔧 **设备管理** | http://localhost:3000/devices | 真实设备发现和管理 |
| 📡 **实时监控** | http://localhost:3000/monitoring | WebSocket实时数据监控 |
| ⚡ **性能分析** | http://localhost:3000/performance | 性能基准测试和优化 |
| 🔒 **安全合规** | http://localhost:3000/compliance | 配置安全扫描和合规 |
| 🩺 **系统健康** | http://localhost:3000/api/system/health | 系统健康状态API |

## 🚀 快速部署

### 📋 系统要求

- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **内存**: 最低4GB，推荐8GB+
- **存储**: 最低50GB可用空间
- **Node.js**: 18.0+
- **依赖**: SNMP工具、ssh2、js-yaml、toml、ws

### ⚡ 一键部署

```bash
# 1. 克隆项目
git clone <your-repository-url>
cd snmp-mib-ui-main

# 2. 安装系统依赖
sudo apt-get update
sudo apt-get install -y snmp snmp-mibs-downloader net-tools curl wget git
sudo apt-get install -y python3 python3-pip nodejs npm
sudo apt-get install -y prometheus grafana

# 3. 安装Node.js依赖
npm install --legacy-peer-deps ssh2 js-yaml toml ws @types/ssh2 @types/ws

# 4. 启动系统
npm run dev

# 🎉 部署完成！
open http://localhost:3000/dashboard
```

### 📊 功能验证

```bash
# 系统健康检查
curl -X GET http://localhost:3000/api/system/health

# 设备管理测试
curl -X GET http://localhost:3000/api/devices/list

# 监控会话测试  
curl -X GET http://localhost:3000/api/monitoring/sessions

# 告警规则测试
curl -X GET http://localhost:3000/api/alerts/rules

# 合规扫描测试
curl -X GET http://localhost:3000/api/compliance/rules

# 性能基准测试
curl -X GET http://localhost:3000/api/performance/benchmarks
```

## 📖 核心功能详解

### 🔍 **真实设备发现系统**

```typescript
// 自动设备发现
const devices = await batchDeviceManager.discoverDevices(
  "192.168.1.1-50",    // IP范围
  "public",            // SNMP Community
  "2c"                 // SNMP版本
);

// 真实设备测试
const result = await realTimeMonitoringPreview.testDeviceMetrics(
  deviceId,
  deviceConfig,
  templateId
);
```

### 📊 **配置版本管理**

```typescript
// Git风格版本控制
const version = await configVersionManager.createVersion(
  configName,
  "snmp_exporter",    // 配置类型
  configContent,
  "admin",            // 作者
  "Production config" // 描述
);

// 配置差异对比
const comparison = await configVersionManager.compareVersions(
  fromVersionId,
  toVersionId
);
```

### 🏭 **批量设备部署**

```typescript
// 批量配置部署
const job = await batchDeviceManager.deployConfigBatch(
  { deviceIds: ["device_001", "device_002"] },
  "snmp_exporter",
  configVersionId,
  {
    mode: "parallel",         // 并行部署
    batchSize: 10,           // 批次大小
    rollbackOnFailure: true, // 失败回滚
    maxFailureRate: 0.1      // 最大失败率
  }
);
```

### 📡 **实时监控系统**

```typescript
// WebSocket实时监控
const session = await realTimeMonitoringPreview.createMonitoringSession(
  deviceIds,
  templateId,
  customOids,
  {
    enableAlerts: true,
    exportFormat: "prometheus"
  }
);
```

### 🔒 **安全合规扫描**

```typescript
// 配置安全扫描
const report = await configComplianceScanner.scanConfiguration(
  "/etc/snmp_exporter/snmp.yml",
  "production_security",
  { autoFix: false }
);
```

### ⚡ **性能基准测试**

```typescript
// 性能测试
const result = await performanceBenchmarkOptimizer.runBenchmark(
  "snmp_performance_test"
);

// 优化建议
const optimizations = performanceBenchmarkOptimizer.getOptimizations();
```

## 🏗️ 技术架构

### 🎯 **技术栈**
- **前端**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **后端**: Node.js + RESTful API + WebSocket
- **监控**: 支持snmp-exporter + categraf + Prometheus + Grafana
- **数据库**: 文件系统存储 + JSON配置
- **实时通信**: WebSocket + 事件驱动
- **部署**: SSH + 远程配置管理

### 📁 **项目结构**

```
snmp-mib-ui-main/
├── lib/enhanced/                    # 🎯 核心功能库
│   ├── enhanced-oid-manager.ts      # OID数据库管理
│   ├── config-version-manager.ts    # 配置版本控制
│   ├── batch-device-manager.ts      # 批量设备管理
│   ├── real-time-monitoring-preview.ts  # 实时监控
│   ├── advanced-alert-rules-manager.ts  # 告警规则
│   ├── config-compliance-scanner.ts     # 合规扫描
│   ├── performance-benchmark-optimizer.ts  # 性能测试
│   └── system-integration-manager.ts       # 系统集成
├── components/enhanced/             # 🎨 前端组件
│   └── enhanced-frontend-components.tsx
├── app/api/enhanced/               # 🔌 API路由
│   └── api-integration-routes.ts
├── app/{dashboard,devices,monitoring,performance,compliance}/ # 📱 页面
└── /etc/snmp-configs/              # 💾 数据存储
    ├── versions/                   # 配置版本
    ├── devices/                    # 设备管理
    ├── alerts/                     # 告警规则
    ├── compliance/                 # 合规检查
    └── performance/                # 性能测试
```

## 🌟 生产特性

### ✅ **真实数据保证**
- 🚫 **零模拟数据** - 所有设备数据来自真实SNMP查询
- 📡 **真实监控指标** - 实际设备数据采集和展示
- 🏭 **标准配置** - 完全符合snmp-exporter和categraf官方规范
- 🚀 **实际部署** - 真实的SSH文件操作和远程部署

### 🛡️ **企业级可靠性**
- 🔄 **完整错误处理** - 全面的异常处理和恢复机制
- 📝 **详细日志记录** - 系统操作和监控日志
- 🔒 **安全权限控制** - 细粒度访问控制
- ⚡ **高性能设计** - 支持大规模设备监控

### 🎛️ **运维友好**
- 🤖 **自动化工作流** - 预定义的运维自动化任务
- 📊 **系统健康监控** - 实时系统状态和性能监控
- 🔧 **智能优化建议** - 自动化性能优化建议
- 📈 **容量规划** - 系统资源使用分析

## 📊 API接口文档

### 🌐 **核心API端点**

```bash
# 系统管理
GET    /api/system/health           # 系统健康状态
GET    /api/system/config           # 系统配置
POST   /api/system/workflows        # 执行工作流

# 设备管理
GET    /api/devices/list            # 设备列表
POST   /api/devices/discover        # 设备发现
POST   /api/devices/deploy          # 配置部署
POST   /api/devices/test            # 设备测试

# 配置管理
GET    /api/config/versions         # 配置版本
POST   /api/config/compare          # 配置对比
POST   /api/config/validate         # 配置验证

# 监控管理
GET    /api/monitoring/sessions     # 监控会话
POST   /api/monitoring/test         # 监控测试
GET    /api/monitoring/templates    # 监控模板

# 告警管理
GET    /api/alerts/rules            # 告警规则
POST   /api/alerts/deploy           # 规则部署
GET    /api/alerts/optimize         # 优化建议

# 合规管理
POST   /api/compliance/scan         # 合规扫描
GET    /api/compliance/rules        # 合规规则
GET    /api/compliance/reports      # 合规报告

# 性能管理
GET    /api/performance/benchmarks  # 性能基准
POST   /api/performance/run         # 运行测试
GET    /api/performance/optimizations  # 优化建议
```

## 🔧 配置说明

### 🌍 **环境配置**

```bash
# 系统配置文件: /etc/snmp-configs/system.json
{
  "environment": "production",
  "features": {
    "autoDiscovery": true,
    "realTimeMonitoring": true,
    "autoAlerts": true,
    "complianceScanning": true,
    "performanceTesting": true,
    "autoOptimization": false
  },
  "thresholds": {
    "deviceTimeout": 300,
    "alertLatency": 1000,
    "complianceScore": 80,
    "performanceScore": 70
  }
}
```

### 📡 **SNMP配置示例**

```yaml
# snmp_exporter配置 (符合官方标准)
modules:
  cisco_switch:
    walk:
      - 1.3.6.1.2.1.1.1.0      # sysDescr
      - 1.3.6.1.2.1.1.3.0      # sysUpTime
      - 1.3.6.1.2.1.2.2.1.2    # ifDescr
      - 1.3.6.1.2.1.2.2.1.8    # ifOperStatus
    auth:
      community: public
      version: 2
```

## 🔒 安全特性

- 🔐 **配置验证** - 严格的配置语法和安全检查
- 🛡️ **权限控制** - 基于角色的访问控制
- 📝 **操作审计** - 完整的操作日志记录
- 🔒 **数据加密** - 敏感数据加密存储
- 🚨 **安全扫描** - 自动化安全漏洞检测

## 🤝 贡献指南

### 🐛 **问题反馈**
- 通过GitHub Issues提交Bug报告
- 通过GitHub Discussions讨论新功能
- 提供详细的复现步骤和环境信息

### 🔄 **开发流程**
1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

感谢以下开源项目和标准的支持：

- [Next.js](https://nextjs.org/) - React全栈框架
- [SNMP Exporter](https://github.com/prometheus/snmp_exporter) - Prometheus SNMP导出器
- [Categraf](https://github.com/flashcatcloud/categraf) - 现代化监控代理
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的CSS框架

---

<div align="center">

**🎯 特色亮点**

✅ **100%真实数据** ✅ **官方标准配置** ✅ **生产就绪** ✅ **企业级功能**

**⭐ 如果这个项目对您有帮助，请给我们一个Star！**

**🚀 现代化企业级SNMP监控平台 - 真正的生产级解决方案**

</div>