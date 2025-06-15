# SNMP MIB Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.23+-blue.svg)](https://golang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15+-black.svg)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

**A modern SNMP MIB management and network monitoring platform**

## Overview

A comprehensive SNMP MIB management and network monitoring platform designed for network engineers and system administrators. The platform provides an intuitive web interface for managing MIB files, configuring SNMP monitoring, generating configuration files, and integrating with various monitoring tools.

## Features

- **MIB Management**: Upload, parse, and browse SNMP MIB files with visual OID tree structure
- **Smart Configuration**: Auto-generate Prometheus SNMP Exporter and Categraf configurations  
- **Device Management**: Unified management of network devices and SNMP credentials
- **Monitoring Integration**: Built-in VictoriaMetrics + Grafana monitoring stack
- **Container Deployment**: One-click Docker Compose deployment with multi-architecture support
- **Modern Interface**: Responsive web interface built with Next.js 15

## Quick Start

### Prerequisites
- Docker and Docker Compose
- 4GB+ RAM
- 5GB+ disk space

### One-Click Deployment

```bash
# Clone the repository
git clone https://github.com/evan7434/snmp-mib-ui.git
cd snmp-mib-ui

# Run the deployment script
./deploy.sh

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
```

### Custom Configuration

```bash
# Set environment variables for custom deployment
DOMAIN=yourdomain.com DEPLOY_MODE=production ./deploy.sh

# View deployment status
./deploy.sh status

# View logs
./deploy.sh logs

# Stop services
./deploy.sh stop
```

### Access URLs

After deployment, access the following services:

| Service | URL | Description |
|---------|-----|-------------|
| **Web Interface** | http://localhost:3000 | Main management interface |
| **Backend API** | http://localhost:8080 | RESTful API |
| **Health Check** | http://localhost:8080/health | Service status |

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js       │    │   Go Backend     │    │   PostgreSQL    │
│   Frontend      │◄──►│   API Server     │◄──►│   Database      │
│   (Port 3000)   │    │   (Port 8080)    │    │   (Port 5432)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────▼──────────────┐
                    │       Redis Cache          │
                    │       (Port 6379)          │
                    └────────────────────────────┘
```

## Management Commands

The deployment script provides several management commands:

```bash
./deploy.sh help          # Show help information
./deploy.sh status        # Show service status  
./deploy.sh logs          # Show all logs
./deploy.sh logs backend  # Show specific service logs
./deploy.sh restart       # Restart all services
./deploy.sh stop          # Stop all services
./deploy.sh clean         # Remove containers and data
./deploy.sh update        # Update and redeploy
./deploy.sh backup        # Create data backup
```

## Development

### Local Development Setup

```bash
# Install dependencies
npm install

# Start development database
docker compose up -d postgres redis

# Start development server
npm run dev

# Start backend (in separate terminal)
cd backend
go run main.go
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
npm run test         # Run tests
```

## Environment Configuration

Key environment variables:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
POSTGRES_PASSWORD=your_secure_password

# Redis  
REDIS_URL=redis://:password@localhost:6379
REDIS_PASSWORD=your_redis_password

# Security
JWT_SECRET=your_jwt_secret
NEXTAUTH_SECRET=your_nextauth_secret

# API
API_BASE_URL=http://backend:8080
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## API Documentation

The backend provides a RESTful API with the following endpoints:

- `GET /health` - Health check
- `GET /api/devices` - List network devices
- `POST /api/devices` - Add new device
- `GET /api/mibs` - List MIB files
- `POST /api/mibs/upload` - Upload MIB file
- `GET /api/monitoring/config` - Get monitoring configuration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

- All passwords are hashed using bcrypt
- JWT tokens for API authentication
- CORS protection enabled
- SQL injection protection
- XSS protection headers
- Rate limiting on API endpoints

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:

- Create an issue in the GitHub repository
- Check the [troubleshooting guide](docs/troubleshooting.md)
- Review the [API documentation](docs/API.md)

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Backend powered by [Go](https://golang.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)