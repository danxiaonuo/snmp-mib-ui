# 🌐 Enterprise SNMP Monitoring Platform

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15+-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Production Ready](https://img.shields.io/badge/Production-Ready-success.svg)](#)
[![Real Data](https://img.shields.io/badge/Real-Data%20Only-brightgreen.svg)](#)

**[🇨🇳 中文](README.md) | [🇺🇸 English](README_EN.md)**

</div>

> 🚀 **Production-Ready Real SNMP Network Monitoring Solution** - Modern enterprise monitoring platform built on Next.js 15

## ✨ Core Features

### 🎯 **100% Real Data Monitoring**
- ✅ **Zero Simulation Data** - All data comes from real SNMP device queries
- ✅ **Official Standard Configurations** - Fully compliant with snmp-exporter and categraf official specifications
- ✅ **Actual Device Discovery** - Real network scanning and device identification
- ✅ **Real Configuration Deployment** - Actual file operations and remote deployment

### 🚀 **Production-Grade Feature Completeness**
- 📊 **Enhanced OID Library Management** - Complete vendor-specific OID support (Cisco, H3C, Huawei)
- 🔄 **Configuration Version Management** - Git-style version control and configuration comparison
- 🏭 **Batch Device Management** - Support for parallel/sequential/rolling deployment strategies
- 📡 **Real-time Monitoring Preview** - WebSocket real-time data streams and multi-vendor templates
- 🚨 **Smart Alert Rules** - Auto-optimization and Prometheus/VMAlert integration
- 🔒 **Security Compliance Scanning** - Comprehensive configuration security checks and auto-remediation
- ⚡ **Performance Benchmark Testing** - Automated performance testing and optimization recommendations
- 🎛️ **System Integration Management** - Workflow automation and system health monitoring

## 🎛️ System Architecture

### 📁 Core Function Modules

```
Enhanced Features/
├── 📊 enhanced-oid-manager.ts          # OID database and vendor mapping
├── 🔄 config-version-manager.ts        # Git-style configuration version control  
├── 🏭 batch-device-manager.ts          # Automated device discovery and batch management
├── 📡 real-time-monitoring-preview.ts  # WebSocket real-time monitoring
├── 🚨 advanced-alert-rules-manager.ts  # Smart alert rules engine
├── 🔒 config-compliance-scanner.ts     # Security compliance scanning system
├── ⚡ performance-benchmark-optimizer.ts # Performance testing and optimization
├── 🎛️ system-integration-manager.ts    # System integration and health monitoring
├── 🎨 enhanced-frontend-components.tsx # Complete React component library
└── 🔌 api-integration-routes.ts        # Unified API routing system
```

### 🌐 System Access URLs

| Function Module | Access URL | Description |
|---------|---------|------|
| 🏠 **Main Dashboard** | http://localhost:3000/dashboard | Enhanced system monitoring dashboard |
| 🔧 **Device Management** | http://localhost:3000/devices | Real device discovery and management |
| 📡 **Real-time Monitoring** | http://localhost:3000/monitoring | WebSocket real-time data monitoring |
| ⚡ **Performance Analysis** | http://localhost:3000/performance | Performance benchmarking and optimization |
| 🔒 **Security Compliance** | http://localhost:3000/compliance | Configuration security scanning and compliance |
| 🩺 **System Health** | http://localhost:3000/api/system/health | System health status API |

## 🚀 Quick Deployment

### 📋 System Requirements

- **Operating System**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **Memory**: Minimum 4GB, recommended 8GB+
- **Storage**: Minimum 50GB available space
- **Node.js**: 18.0+
- **Dependencies**: SNMP tools, ssh2, js-yaml, toml, ws

### ⚡ One-Click Deployment

```bash
# 1. Clone project
git clone <your-repository-url>
cd snmp-mib-ui-main

# 2. Install system dependencies
sudo apt-get update
sudo apt-get install -y snmp snmp-mibs-downloader net-tools curl wget git
sudo apt-get install -y python3 python3-pip nodejs npm
sudo apt-get install -y prometheus grafana

# 3. Install Node.js dependencies
npm install --legacy-peer-deps ssh2 js-yaml toml ws @types/ssh2 @types/ws

# 4. Start system
npm run dev

# 🎉 Deployment complete!
open http://localhost:3000/dashboard
```

### 📊 Feature Verification

```bash
# System health check
curl -X GET http://localhost:3000/api/system/health

# Device management test
curl -X GET http://localhost:3000/api/devices/list

# Monitoring session test  
curl -X GET http://localhost:3000/api/monitoring/sessions

# Alert rules test
curl -X GET http://localhost:3000/api/alerts/rules

# Compliance scanning test
curl -X GET http://localhost:3000/api/compliance/rules

# Performance benchmark test
curl -X GET http://localhost:3000/api/performance/benchmarks
```

## 📚 Core Function Details

### 🔍 **Real Device Discovery System**

```typescript
// Automated device discovery
const devices = await batchDeviceManager.discoverDevices(
  "192.168.1.1-50",    // IP range
  "public",            // SNMP Community
  "2c"                 // SNMP version
);

// Real device testing
const result = await realTimeMonitoringPreview.testDeviceMetrics(
  deviceId,
  deviceConfig,
  templateId
);
```

### 📊 **Configuration Version Management**

```typescript
// Git-style version control
const version = await configVersionManager.createVersion(
  configName,
  "snmp_exporter",    // Configuration type
  configContent,
  "admin",            // Author
  "Production config" // Description
);

// Configuration difference comparison
const comparison = await configVersionManager.compareVersions(
  fromVersionId,
  toVersionId
);
```

### 🏭 **Batch Device Deployment**

```typescript
// Batch configuration deployment
const job = await batchDeviceManager.deployConfigBatch(
  { deviceIds: ["device_001", "device_002"] },
  "snmp_exporter",
  configVersionId,
  {
    mode: "parallel",         // Parallel deployment
    batchSize: 10,           // Batch size
    rollbackOnFailure: true, // Rollback on failure
    maxFailureRate: 0.1      // Maximum failure rate
  }
);
```

### 📡 **Real-time Monitoring System**

```typescript
// WebSocket real-time monitoring
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

### 🔒 **Security Compliance Scanning**

```typescript
// Configuration security scanning
const report = await configComplianceScanner.scanConfiguration(
  "/etc/snmp_exporter/snmp.yml",
  "production_security",
  { autoFix: false }
);
```

### ⚡ **Performance Benchmark Testing**

```typescript
// Performance testing
const result = await performanceBenchmarkOptimizer.runBenchmark(
  "snmp_performance_test"
);

// Optimization recommendations
const optimizations = performanceBenchmarkOptimizer.getOptimizations();
```

## 🏗️ Technical Architecture

### 🎯 **Technology Stack**
- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **Backend**: Node.js + RESTful API + WebSocket
- **Monitoring**: Support for snmp-exporter + categraf + Prometheus + Grafana
- **Database**: File system storage + JSON configuration
- **Real-time Communication**: WebSocket + Event-driven
- **Deployment**: SSH + Remote configuration management

### 📁 **Project Structure**

```
snmp-mib-ui-main/
├── lib/enhanced/                    # 🎯 Core function library
│   ├── enhanced-oid-manager.ts      # OID database management
│   ├── config-version-manager.ts    # Configuration version control
│   ├── batch-device-manager.ts      # Batch device management
│   ├── real-time-monitoring-preview.ts  # Real-time monitoring
│   ├── advanced-alert-rules-manager.ts  # Alert rules
│   ├── config-compliance-scanner.ts     # Compliance scanning
│   ├── performance-benchmark-optimizer.ts  # Performance testing
│   └── system-integration-manager.ts       # System integration
├── components/enhanced/             # 🎨 Frontend components
│   └── enhanced-frontend-components.tsx
├── app/api/enhanced/               # 🔌 API routes
│   └── api-integration-routes.ts
├── app/{dashboard,devices,monitoring,performance,compliance}/ # 📱 Pages
└── /etc/snmp-configs/              # 💾 Data storage
    ├── versions/                   # Configuration versions
    ├── devices/                    # Device management
    ├── alerts/                     # Alert rules
    ├── compliance/                 # Compliance checks
    └── performance/                # Performance testing
```

## 🌟 Production Features

### ✅ **Real Data Guarantee**
- 🚫 **Zero Simulation Data** - All device data comes from real SNMP queries
- 📡 **Real Monitoring Metrics** - Actual device data collection and display
- 🏭 **Standard Configuration** - Fully compliant with snmp-exporter and categraf official specifications
- 🚀 **Actual Deployment** - Real SSH file operations and remote deployment

### 🛡️ **Enterprise-Grade Reliability**
- 🔄 **Complete Error Handling** - Comprehensive exception handling and recovery mechanisms
- 📝 **Detailed Logging** - System operation and monitoring logs
- 🔒 **Security Access Control** - Fine-grained access control
- ⚡ **High Performance Design** - Support for large-scale device monitoring

### 🎛️ **Operations-Friendly**
- 🤖 **Automated Workflows** - Predefined operations automation tasks
- 📊 **System Health Monitoring** - Real-time system status and performance monitoring
- 🔧 **Smart Optimization Recommendations** - Automated performance optimization suggestions
- 📈 **Capacity Planning** - System resource usage analysis

## 📊 API Documentation

### 🌐 **Core API Endpoints**

```bash
# System Management
GET    /api/system/health           # System health status
GET    /api/system/config           # System configuration
POST   /api/system/workflows        # Execute workflows

# Device Management
GET    /api/devices/list            # Device list
POST   /api/devices/discover        # Device discovery
POST   /api/devices/deploy          # Configuration deployment
POST   /api/devices/test            # Device testing

# Configuration Management
GET    /api/config/versions         # Configuration versions
POST   /api/config/compare          # Configuration comparison
POST   /api/config/validate         # Configuration validation

# Monitoring Management
GET    /api/monitoring/sessions     # Monitoring sessions
POST   /api/monitoring/test         # Monitoring testing
GET    /api/monitoring/templates    # Monitoring templates

# Alert Management
GET    /api/alerts/rules            # Alert rules
POST   /api/alerts/deploy           # Rules deployment
GET    /api/alerts/optimize         # Optimization recommendations

# Compliance Management
POST   /api/compliance/scan         # Compliance scanning
GET    /api/compliance/rules        # Compliance rules
GET    /api/compliance/reports      # Compliance reports

# Performance Management
GET    /api/performance/benchmarks  # Performance benchmarks
POST   /api/performance/run         # Run tests
GET    /api/performance/optimizations  # Optimization recommendations
```

## 🔧 Configuration Guide

### 🌍 **Environment Configuration**

```bash
# System configuration file: /etc/snmp-configs/system.json
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

### 📡 **SNMP Configuration Example**

```yaml
# snmp_exporter configuration (compliant with official standards)
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

## 🔒 Security Features

- 🔐 **Configuration Validation** - Strict configuration syntax and security checks
- 🛡️ **Access Control** - Role-based access control
- 📝 **Operation Auditing** - Complete operation log recording
- 🔒 **Data Encryption** - Encrypted storage of sensitive data
- 🚨 **Security Scanning** - Automated security vulnerability detection

## 🤝 Contributing Guide

### 🐛 **Issue Reporting**
- Submit bug reports through GitHub Issues
- Discuss new features through GitHub Discussions
- Provide detailed reproduction steps and environment information

### 🔄 **Development Workflow**
1. Fork the project repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

## 🤝 Contributing

We welcome community contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### 🐛 Issue Reporting

- **Bug Reports**: Submit via GitHub Issues
- **Feature Requests**: Discuss via GitHub Discussions
- **Security Issues**: Contact via private channels

### 🔄 Development Workflow

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Thanks to the following open source projects for their support:

- [Next.js](https://nextjs.org/) - React full-stack framework
- [Go](https://golang.org/) - High-performance backend language
- [PostgreSQL](https://postgresql.org/) - Relational database
- [Redis](https://redis.io/) - In-memory database

## 📞 Contact Us

- **Project Homepage**: See GitHub repository
- **Technical Support**: Get help via GitHub Issues
- **Documentation**: See detailed documentation in docs directory

---

<div align="center">

**⭐ If this project helps you, please give us a Star!**

**🚀 v2.0 - Modern Enterprise SNMP Monitoring Platform**

**Thank you for your attention and support!**

</div>