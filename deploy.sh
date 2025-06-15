#!/bin/bash

# SNMP MIB Platform - One-Click Deployment Script
# Comprehensive deployment solution for production use

set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Global variables
COMPOSE_CMD=""
PROJECT_NAME="snmp-mib-platform"
DOMAIN="${DOMAIN:-localhost}"
DEPLOY_MODE="${DEPLOY_MODE:-development}"

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${PURPLE}[STEP]${NC} $1"; }

show_banner() {
    echo -e "${CYAN}"
    echo "==========================================================="
    echo "    SNMP MIB Platform - One-Click Deployment"
    echo "    Professional Network Monitoring Solution"
    echo "==========================================================="
    echo -e "${NC}"
}

check_requirements() {
    log_step "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        log_info "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running. Please start Docker service."
        exit 1
    fi
    
    # Check Docker Compose
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
        log_success "Docker Compose V2 detected"
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
        log_success "Docker Compose V1 detected"
    else
        log_error "Docker Compose not found. Please install Docker Compose."
        exit 1
    fi
    
    # Check disk space (minimum 5GB)
    local available_space=$(df . | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 5242880 ]; then
        log_warning "Low disk space detected. At least 5GB recommended."
    fi
    
    log_success "System requirements check passed"
}

create_directories() {
    log_step "Creating project directories..."
    
    local dirs=(
        "data/postgres"
        "data/redis"
        "uploads"
        "mibs"
        "logs"
        "config/snmp-exporter"
        "config/categraf"
        "nginx/logs"
        "nginx/ssl"
        "monitoring/grafana/provisioning/dashboards"
        "monitoring/grafana/provisioning/datasources"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
    done
    
    # Set proper permissions
    chmod -R 755 data uploads mibs config logs
    chmod -R 755 nginx monitoring
    
    log_success "Directories created successfully"
}

generate_secrets() {
    log_step "Generating secure secrets..."
    
    # Generate strong passwords
    local postgres_password=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    local redis_password=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    local jwt_secret=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
    local nextauth_secret=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
    
    echo "$postgres_password:$redis_password:$jwt_secret:$nextauth_secret"
}

create_env_file() {
    log_step "Setting up environment configuration..."
    
    if [ -f .env ]; then
        log_info "Backing up existing .env file..."
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    fi
    
    local secrets=$(generate_secrets)
    local postgres_password=$(echo "$secrets" | cut -d: -f1)
    local redis_password=$(echo "$secrets" | cut -d: -f2)
    local jwt_secret=$(echo "$secrets" | cut -d: -f3)
    local nextauth_secret=$(echo "$secrets" | cut -d: -f4)
    
    cat > .env <<EOF
# === SNMP MIB Platform Configuration ===
# Generated on: $(date)

# Database Configuration
POSTGRES_DB=network_monitor
POSTGRES_USER=netmon_user
POSTGRES_PASSWORD=${postgres_password}
POSTGRES_PORT=5432
DATABASE_URL=postgresql://netmon_user:${postgres_password}@postgres:5432/network_monitor

# Redis Configuration
REDIS_PASSWORD=${redis_password}
REDIS_PORT=6379
REDIS_URL=redis://:${redis_password}@redis:6379

# Application Ports
BACKEND_PORT=8080
FRONTEND_PORT=3000
HTTP_PORT=80
HTTPS_PORT=443

# Security
JWT_SECRET=${jwt_secret}
NEXTAUTH_SECRET=${nextauth_secret}
NEXTAUTH_URL=http://${DOMAIN}:3000

# API Configuration
API_BASE_URL=http://backend:8080
NEXT_PUBLIC_API_URL=http://${DOMAIN}:8080

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://${DOMAIN}:3000,http://localhost,http://${DOMAIN}

# Environment
NODE_ENV=${DEPLOY_MODE}
ENVIRONMENT=${DEPLOY_MODE}

# Data Directory
DATA_DIR=./data

# Monitoring
MONITORING_ENABLED=true
GRAFANA_PORT=3001
PROMETHEUS_PORT=9090

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
EOF
    
    log_success "Environment file created with secure secrets"
}

create_docker_compose() {
    log_step "Creating optimized Docker Compose configuration..."
    
    cat > docker-compose.production.yml <<'EOF'
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: ${PROJECT_NAME:-snmp-mib}-postgres
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --locale=C"
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d:ro
    networks:
      - mib-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: ${PROJECT_NAME:-snmp-mib}-redis
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
    networks:
      - mib-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 256M
        reservations:
          memory: 128M

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: ${PROJECT_NAME:-snmp-mib}-backend
    environment:
      - ENVIRONMENT=${ENVIRONMENT}
      - PORT=${BACKEND_PORT}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGINS=${CORS_ORIGINS}
      - LOG_LEVEL=${LOG_LEVEL}
    ports:
      - "${BACKEND_PORT:-8080}:8080"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./uploads:/app/uploads
      - ./mibs:/app/mibs
      - ./logs:/app/logs
    networks:
      - mib-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  # Frontend Application
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ${PROJECT_NAME:-snmp-mib}-frontend
    environment:
      - NODE_ENV=${NODE_ENV}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - API_BASE_URL=${API_BASE_URL}
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    ports:
      - "${FRONTEND_PORT:-3000}:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      backend:
        condition: service_healthy
    volumes:
      - ./uploads:/app/uploads:ro
    networks:
      - mib-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: ${PROJECT_NAME:-snmp-mib}-nginx
    ports:
      - "${HTTP_PORT:-80}:80"
      - "${HTTPS_PORT:-443}:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - frontend
      - backend
    networks:
      - mib-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  mib-network:
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.20.0.0/16
EOF
    
    log_success "Docker Compose configuration created"
}

create_nginx_config() {
    log_step "Creating Nginx configuration..."
    
    mkdir -p nginx
    cat > nginx/nginx.conf <<'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log notice;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;
    
    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    
    # Upstream definitions
    upstream frontend {
        server frontend:3000;
        keepalive 32;
    }
    
    upstream backend {
        server backend:8080;
        keepalive 32;
    }
    
    # Main server block
    server {
        listen 80;
        server_name _;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
        
        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
        
        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_connect_timeout 10s;
            proxy_send_timeout 10s;
            proxy_read_timeout 10s;
        }
        
        # Static assets
        location /_next/static/ {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_connect_timeout 10s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
    }
}
EOF
    
    log_success "Nginx configuration created"
}

deploy_services() {
    log_step "Deploying services..."
    
    # Stop existing services
    log_info "Stopping existing services..."
    $COMPOSE_CMD -f docker-compose.production.yml down --remove-orphans 2>/dev/null || true
    
    # Pull base images
    log_info "Pulling base images..."
    $COMPOSE_CMD -f docker-compose.production.yml pull postgres redis nginx || true
    
    # Build and start services
    log_info "Building and starting services..."
    if $COMPOSE_CMD -f docker-compose.production.yml up -d --build; then
        log_success "Services deployed successfully"
    else
        log_error "Deployment failed"
        show_troubleshooting
        exit 1
    fi
}

wait_for_services() {
    log_step "Waiting for services to be ready..."
    
    local max_wait=300  # 5 minutes
    local wait_time=0
    local services=("postgres" "redis" "backend" "frontend")
    
    while [ $wait_time -lt $max_wait ]; do
        local all_healthy=true
        
        for service in "${services[@]}"; do
            if ! $COMPOSE_CMD -f docker-compose.production.yml ps --filter "health=healthy" | grep -q "$service"; then
                all_healthy=false
                break
            fi
        done
        
        if [ "$all_healthy" = true ]; then
            log_success "All services are healthy"
            return 0
        fi
        
        log_info "Waiting for services... ($wait_time/${max_wait}s)"
        sleep 10
        wait_time=$((wait_time + 10))
    done
    
    log_warning "Some services may not be fully ready yet"
    $COMPOSE_CMD -f docker-compose.production.yml ps
}

show_deployment_info() {
    log_step "Deployment Summary"
    
    echo ""
    echo -e "${CYAN}================================================================${NC}"
    echo -e "${GREEN}✅ SNMP MIB Platform deployed successfully!${NC}"
    echo -e "${CYAN}================================================================${NC}"
    echo ""
    echo -e "${YELLOW}🌐 Access URLs:${NC}"
    echo -e "  Frontend: ${BLUE}http://${DOMAIN}:3000${NC}"
    echo -e "  Backend API: ${BLUE}http://${DOMAIN}:8080${NC}"
    echo -e "  Health Check: ${BLUE}http://${DOMAIN}:8080/health${NC}"
    echo -e "  Nginx Status: ${BLUE}http://${DOMAIN}/health${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Management Commands:${NC}"
    echo -e "  Status: ${BLUE}$COMPOSE_CMD -f docker-compose.production.yml ps${NC}"
    echo -e "  Logs: ${BLUE}$COMPOSE_CMD -f docker-compose.production.yml logs -f${NC}"
    echo -e "  Stop: ${BLUE}$COMPOSE_CMD -f docker-compose.production.yml down${NC}"
    echo -e "  Restart: ${BLUE}$COMPOSE_CMD -f docker-compose.production.yml restart${NC}"
    echo ""
    echo -e "${YELLOW}📊 Service Status:${NC}"
    $COMPOSE_CMD -f docker-compose.production.yml ps
    echo ""
    echo -e "${GREEN}🎉 Platform is ready for use!${NC}"
    echo -e "${CYAN}================================================================${NC}"
}

show_troubleshooting() {
    echo ""
    echo -e "${YELLOW}🔍 Troubleshooting:${NC}"
    echo -e "  Check logs: ${BLUE}$COMPOSE_CMD -f docker-compose.production.yml logs${NC}"
    echo -e "  Check specific service: ${BLUE}$COMPOSE_CMD -f docker-compose.production.yml logs [service-name]${NC}"
    echo -e "  Restart services: ${BLUE}$COMPOSE_CMD -f docker-compose.production.yml restart${NC}"
    echo -e "  Clean restart: ${BLUE}$COMPOSE_CMD -f docker-compose.production.yml down && $COMPOSE_CMD -f docker-compose.production.yml up -d${NC}"
    echo ""
}

cleanup() {
    if [ $? -ne 0 ]; then
        log_error "Deployment failed"
        log_info "Cleaning up partial deployment..."
        $COMPOSE_CMD -f docker-compose.production.yml down 2>/dev/null || true
        show_troubleshooting
    fi
}

main() {
    show_banner
    trap cleanup EXIT
    
    check_requirements
    create_directories
    create_env_file
    create_docker_compose
    create_nginx_config
    deploy_services
    wait_for_services
    show_deployment_info
    
    trap - EXIT
}

# Command line handling
case "${1:-}" in
    "help"|"-h"|"--help")
        echo "SNMP MIB Platform Deployment Script"
        echo ""
        echo "Usage: $0 [command] [options]"
        echo ""
        echo "Commands:"
        echo "  deploy              Deploy the platform (default)"
        echo "  status              Show service status"
        echo "  logs [service]      Show logs (optionally for specific service)"
        echo "  restart [service]   Restart services (optionally specific service)"
        echo "  stop                Stop all services"
        echo "  clean               Remove all containers and data"
        echo "  update              Update and redeploy services"
        echo "  backup              Backup data and configuration"
        echo ""
        echo "Environment Variables:"
        echo "  DOMAIN              Domain name (default: localhost)"
        echo "  DEPLOY_MODE         Deployment mode: development|production (default: development)"
        echo ""
        echo "Examples:"
        echo "  $0                  # Deploy with defaults"
        echo "  DOMAIN=example.com DEPLOY_MODE=production $0"
        echo "  $0 logs backend     # Show backend logs"
        echo "  $0 restart frontend # Restart frontend service"
        echo ""
        exit 0
        ;;
    "status")
        $COMPOSE_CMD -f docker-compose.production.yml ps
        exit 0
        ;;
    "logs")
        if [ -n "${2:-}" ]; then
            $COMPOSE_CMD -f docker-compose.production.yml logs -f "$2"
        else
            $COMPOSE_CMD -f docker-compose.production.yml logs -f
        fi
        exit 0
        ;;
    "restart")
        if [ -n "${2:-}" ]; then
            $COMPOSE_CMD -f docker-compose.production.yml restart "$2"
            log_success "Service $2 restarted"
        else
            $COMPOSE_CMD -f docker-compose.production.yml restart
            log_success "All services restarted"
        fi
        exit 0
        ;;
    "stop")
        $COMPOSE_CMD -f docker-compose.production.yml down
        log_success "All services stopped"
        exit 0
        ;;
    "clean")
        read -p "This will remove all containers and data. Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            $COMPOSE_CMD -f docker-compose.production.yml down -v --remove-orphans
            docker system prune -f
            log_success "Environment cleaned"
        else
            log_info "Operation cancelled"
        fi
        exit 0
        ;;
    "update")
        log_info "Updating platform..."
        $COMPOSE_CMD -f docker-compose.production.yml pull
        $COMPOSE_CMD -f docker-compose.production.yml up -d --build
        log_success "Platform updated"
        exit 0
        ;;
    "backup")
        log_info "Creating backup..."
        backup_dir="backup-$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$backup_dir"
        cp -r data "$backup_dir/"
        cp .env "$backup_dir/" 2>/dev/null || true
        tar -czf "${backup_dir}.tar.gz" "$backup_dir"
        rm -rf "$backup_dir"
        log_success "Backup created: ${backup_dir}.tar.gz"
        exit 0
        ;;
    "deploy"|"")
        main
        ;;
    *)
        log_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac