# 🌐 SNMP Network Monitoring Platform

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Go](https://img.shields.io/badge/Go-1.23-00ADD8.svg)](https://golang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![Production Ready](https://img.shields.io/badge/Production-Ready-success.svg)](#)

**[🇨🇳 中文](README.md) | [🇺🇸 English](README_EN.md)**

</div>

> 🚀 **Enterprise-grade SNMP network device monitoring and management platform** - Production-ready solution that actually captures real device data, built with modern technology stack

## ✨ Key Features

### 🎯 **Complete Monitoring Functions**
- 📊 **Device Discovery & Management** - Auto-discover network devices with support for Cisco, Huawei, H3C and other major vendors
- 📈 **Real-time Monitoring** - SNMP-based real-time data collection, supports v1/v2c/v3
- 🚨 **Intelligent Alerting** - Multi-system alert deployment for Prometheus, VMAlert, and Alertmanager
- 📁 **MIB Management** - Complete MIB file management and OID browser
- ⚙️ **Configuration Automation** - Auto-generate SNMP Exporter, Categraf, VictoriaMetrics configurations

### 🏭 **Production-grade Features**
- 🔐 **Multi-user Support** - Complete user permission management system
- 🌐 **Multi-language Interface** - Support for Chinese and English
- 📱 **Responsive Design** - Perfect support for desktop and mobile devices
- 🎨 **Modern UI** - Built with latest design specifications
- 🚀 **High Performance** - Optimized database queries and Redis caching

### 🛠️ **DevOps Integration**
- 🐳 **Containerized Deployment** - Complete Docker Compose one-click deployment
- 🔄 **Automated Operations** - SSH remote configuration deployment and component management
- 📊 **Monitoring Components** - Integrated Node Exporter, SNMP Exporter, Categraf, etc.
- 🔧 **Batch Operations** - Support for batch device management and configuration deployment
- 🎨 **Modern UI** - User interface based on latest design specifications
- 🚀 **High Performance** - Optimized database queries and caching strategies

### 🔧 **Technology Stack**
- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **Backend**: Go 1.23 + Gin + GORM + PostgreSQL
- **Cache**: Redis
- **Deployment**: Docker + Docker Compose
- **Monitoring**: Prometheus + Grafana (Optional)

## 🚀 Quick Start

### 📋 System Requirements

- **Operating System**: Linux / macOS / Windows
- **Memory**: 4GB+ (8GB recommended)
- **Storage**: 20GB+ available space
- **Software**: Docker 20.10+ and Docker Compose 2.0+

### ⚡ One-Click Deployment

```bash
# 1. Clone the project
git clone https://github.com/your-username/snmp-mib-ui.git
cd snmp-mib-ui

# 2. One-click deployment (Recommended)
./deploy.sh

# 3. Or use production-grade deployment
./scripts/production-deployment.sh
```

### 🔧 Manual Deployment

```bash
# 1. Copy environment configuration
cp .env.example .env

# 2. Start services
docker-compose up -d

# 3. Wait for services to be ready (about 2-3 minutes)
docker-compose logs -f

# 4. Access the system
open http://localhost:12300
```

### 📱 Access URLs

After deployment, you can access the system through the following URLs:

| Service | URL | Description |
|---------|-----|-------------|
| 🌐 **Web Interface** | http://localhost:12300 | Main management interface |
| 🔌 **API Interface** | http://localhost:17880 | RESTful API |
| 🏥 **Health Check** | http://localhost:12300/api/health | System status check |

## 📖 Feature Introduction

### 🎛️ Core Function Modules

#### 📊 Device Management (`/devices`)
- **Device Discovery**: Automatically scan and discover SNMP devices in the network
- **Device Registration**: Manually add devices and batch import
- **Status Monitoring**: Real-time display of device online status and key metrics
- **Group Management**: Group devices by network segment, type, or purpose

#### 📁 MIB Management (`/mibs`)
- **File Upload**: Support drag-and-drop upload of MIB files
- **Parsing Validation**: Automatically parse MIB files and validate syntax
- **OID Browsing**: Browse OID objects in tree structure
- **Search Function**: Quickly search MIB objects and descriptions

#### ⚙️ Configuration Generation (`/config-gen`)
- **SNMP Exporter**: Generate Prometheus SNMP Exporter configuration
- **Categraf**: Generate Categraf monitoring configuration
- **Template Management**: Predefined and custom configuration templates
- **Batch Generation**: Support batch device configuration generation

#### 🚨 Alert Management (`/alert-rules`)
- **Rule Editor**: Visual alert rule editor
- **Multiple Notifications**: Email, SMS, Webhook and other notification methods
- **Alert History**: Complete alert records and statistics
- **Suppression Rules**: Intelligent alert suppression and aggregation

#### 🛠️ Monitoring Installer (`/monitoring-installer`)
- **Smart Installation**: Automatically detect and install monitoring components
- **Remote Deployment**: SSH remote deployment to target hosts
- **Status Check**: Real-time monitoring of installation progress and component status
- **Configuration Management**: Unified management of monitoring configuration files

#### 🔧 Toolset (`/tools`)
- **SNMP Browser**: Real-time query of SNMP device data
- **Batch Operations**: Batch device configuration and management
- **Configuration Comparison**: Configuration file version comparison and difference analysis
- **Performance Testing**: Device response performance testing tools

### 🎨 User Interface Features

- **🌓 Theme Switching**: Support for light and dark themes
- **📱 Mobile Optimization**: Perfect mobile experience
- **🔍 Smart Search**: Global search and quick navigation
- **📊 Data Visualization**: Rich charts and dashboards
- **⌨️ Keyboard Shortcuts**: Complete keyboard shortcut support

## 🏗️ Architecture Design

### 📁 Project Structure

```
snmp-mib-ui/
├── app/                    # Next.js application directory
│   ├── api/               # API routes
│   ├── components/        # React components
│   ├── devices/           # Device management pages
│   ├── mibs/              # MIB management pages
│   ├── config-gen/        # Configuration generation pages
│   └── ...
├── backend/               # Go backend service
│   ├── controllers/       # Controllers
│   ├── models/           # Data models
│   ├── services/         # Business logic
│   └── utils/            # Utility functions
├── components/            # Shared components
├── lib/                  # Utility libraries
├── types/                # TypeScript type definitions
├── docker-compose.yml    # Docker orchestration file
├── deploy.sh            # One-click deployment script
└── README.md            # Project documentation
```

### 🌐 Technical Architecture

```mermaid
graph TB
    A[Web Browser] --> B[Next.js Frontend]
    B --> C[Go Backend API]
    C --> D[PostgreSQL Database]
    C --> E[Redis Cache]
    C --> F[SNMP Devices]
    
    G[Docker Compose] --> B
    G --> C
    G --> D
    G --> E
    
    H[Monitoring Stack] --> I[Prometheus]
    H --> J[Grafana]
    H --> K[VictoriaMetrics]
```

## 🔧 Configuration

### 🌍 Environment Variables

```bash
# Database configuration
DATABASE_URL=postgresql://user:pass@localhost:5432/snmp_platform
POSTGRES_DB=snmp_platform
POSTGRES_USER=snmp_user
POSTGRES_PASSWORD=your_password

# Redis configuration
REDIS_URL=redis://localhost:6379

# Application configuration
NEXT_PUBLIC_API_URL=http://localhost:17880/api/v1
JWT_SECRET=your-super-secret-jwt-key
API_PORT=8080

# SNMP configuration
SNMP_DEFAULT_COMMUNITY=public
SNMP_DEFAULT_VERSION=2c
SNMP_TIMEOUT=5s
```

### 🐳 Docker Configuration

Main service port configuration:

```yaml
services:
  frontend:     # Frontend service
    ports: ["3000:3000"]
  backend:      # Backend API
    ports: ["8080:8080"]
  postgres:     # Database
    ports: ["5432:5432"]
  redis:        # Cache
    ports: ["6379:6379"]
```

## 📊 Monitoring Integration

### 🔗 Supported Monitoring Systems

- **Prometheus + SNMP Exporter**: Native support
- **Categraf**: Complete integration
- **VictoriaMetrics**: Recommended time-series database
- **Grafana**: Visualization dashboard
- **Zabbix**: Support through configuration export

### 📈 Monitoring Metrics

- **Device Metrics**: CPU, memory, network interface traffic
- **System Metrics**: Application performance, response time, error rate
- **Business Metrics**: Device online rate, alert statistics
- **Infrastructure**: Database performance, cache hit rate

## 🔒 Security Features

- **Authentication & Authorization**: JWT tokens + session management
- **Access Control**: Role-based access control (RBAC)
- **Data Encryption**: Transmission and storage data encryption
- **Security Audit**: Complete operation log recording
- **Input Validation**: Strict input parameter validation
- **SQL Injection Protection**: ORM framework secure queries

## 📚 Documentation

- **[Deployment Guide](docs/deployment.md)**: Detailed deployment instructions
- **[API Documentation](docs/api.md)**: Complete API interface documentation
- **[Development Guide](docs/development.md)**: Development environment setup
- **[User Manual](docs/user-guide.md)**: Feature usage instructions
- **[FAQ](docs/faq.md)**: Frequently asked questions

## 🤝 Contributing

We welcome community contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### 🐛 Issue Reporting

- **Bug Reports**: Submit via GitHub Issues
- **Feature Requests**: Discuss via GitHub Discussions
- **Security Issues**: Please contact through private channels

### 🔄 Development Workflow

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

## 📄 License

This project is open source under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Thanks to the following open source projects for their support:

- [Next.js](https://nextjs.org/) - React full-stack framework
- [Go](https://golang.org/) - High-performance backend language
- [PostgreSQL](https://postgresql.org/) - Relational database
- [Redis](https://redis.io/) - In-memory database
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

## 📞 Contact

- **Project Homepage**: [GitHub Repository](https://github.com/your-username/snmp-mib-ui)
- **Technical Support**: Get help through GitHub Issues
- **Documentation**: See detailed documentation in the docs directory

---

<div align="center">

**⭐ If this project helps you, please give us a Star!**

**🚀 SNMP Network Monitoring Platform - Making Network Monitoring Simple and Efficient**

</div>