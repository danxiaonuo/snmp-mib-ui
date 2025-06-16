# SNMP MIB Web Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.23+-blue.svg)](https://golang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15+-black.svg)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

A modern SNMP MIB management and network monitoring platform built with Next.js and Go.

## Features

- **MIB Management** - Upload, parse, and browse MIB files with OID tree visualization
- **Configuration Generation** - Generate SNMP Exporter and Categraf configurations 
- **Device Management** - Manage network devices and SNMP credentials
- **Monitoring Integration** - Built-in VictoriaMetrics, Grafana, and Alertmanager stack
- **Modern UI** - Responsive web interface with dark/light themes
- **Multi-language** - Support for English and Chinese

## Quick Start

### Prerequisites

- Docker & Docker Compose
- 4GB+ RAM
- 20GB+ disk space

### Installation

#### Option 1: One-click Deploy (Recommended)

```bash
# Clone the repository
git clone https://github.com/evan7434/snmp-mib-ui.git
cd snmp-mib-ui

# One-click deployment
./deploy.sh

# Or clean deployment (removes old data)
./deploy.sh --clean
```

#### Option 2: Manual Deploy

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps
```

### Access

| Service | URL | Credentials |
|---------|-----|-------------|
| Web UI | http://localhost:3000 | - |
| Backend API | http://localhost:8080 | - |
| Grafana | http://localhost:3001 | admin/admin |
| VictoriaMetrics | http://localhost:8428 | - |
| Alertmanager | http://localhost:9093 | - |

## Development

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
go mod download
go run main.go
```

### Testing

```bash
# Frontend tests
npm test

# Platform integration test
./test_platform.sh

# API health check
curl http://localhost:8080/health
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Monitoring    │
│   (Next.js)     │◄──►│   (Go + Gin)    │◄──►│  (VictoriaM)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌────────┴────────┐
                       │                 │
                ┌──────▼──────┐   ┌──────▼──────┐
                │ PostgreSQL  │   │    Redis    │
                └─────────────┘   └─────────────┘
```

### Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Go 1.23+, Gin framework
- **Database**: PostgreSQL 15+, Redis 7+
- **Monitoring**: VictoriaMetrics, Grafana, Alertmanager
- **Deployment**: Docker, Docker Compose

## Documentation

- [API Reference](docs/API.md) - REST API documentation
- [Development Guide](docs/DEVELOPMENT.md) - Local development setup
- [System Architecture](docs/system-architecture.md) - Technical architecture details
- [Troubleshooting](docs/troubleshooting.md) - Common issues and solutions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](docs/)
- 🐛 [Issues](https://github.com/evan7434/snmp-mib-ui/issues)
- 💬 [Discussions](https://github.com/evan7434/snmp-mib-ui/discussions)