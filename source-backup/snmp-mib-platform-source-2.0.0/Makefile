# =============================================================================
# MIB Web Platform - Makefile
# =============================================================================
# Convenient commands for development, testing, and deployment
# =============================================================================

.PHONY: help dev build start stop restart status logs clean test lint format install deploy backup restore health update

# Default target
help: ## Show this help message
	@echo "MIB Web Platform - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Examples:"
	@echo "  make dev          # Start development environment"
	@echo "  make build        # Build all services"
	@echo "  make deploy       # Deploy to production"
	@echo "  make logs         # View all service logs"
	@echo "  make test         # Run all tests"

# =============================================================================
# Development Commands
# =============================================================================

install: ## Install dependencies for both frontend and backend
	@echo "Installing dependencies..."
	cd frontend && npm install
	cd backend && go mod download
	@echo "Dependencies installed successfully!"

dev: ## Start development environment
	@echo "Starting development environment..."
	docker-compose up -d postgres redis
	@echo "Database and Redis started. Starting application..."
	docker-compose up --build frontend backend

dev-detached: ## Start development environment in detached mode
	@echo "Starting development environment in detached mode..."
	docker-compose up -d --build

dev-frontend: ## Start only frontend in development mode
	@echo "Starting frontend development server..."
	cd frontend && npm run dev

dev-backend: ## Start only backend in development mode
	@echo "Starting backend development server..."
	cd backend && go run main.go

dev-db: ## Start only database services
	@echo "Starting database services..."
	docker-compose up -d postgres redis

# =============================================================================
# Build Commands
# =============================================================================

build: ## Build all services
	@echo "Building all services..."
	docker-compose build

build-frontend: ## Build frontend service
	@echo "Building frontend..."
	docker-compose build frontend

build-backend: ## Build backend service
	@echo "Building backend..."
	docker-compose build backend

build-prod: ## Build for production
	@echo "Building for production..."
	docker-compose -f docker-compose.prod.yml build

# =============================================================================
# Production Commands
# =============================================================================

start: ## Start production services
	@echo "Starting production services..."
	docker-compose -f docker-compose.prod.yml up -d

stop: ## Stop all services
	@echo "Stopping all services..."
	docker-compose down
	docker-compose -f docker-compose.prod.yml down

restart: ## Restart all services
	@echo "Restarting services..."
	make stop
	make start

status: ## Show service status
	@echo "Service Status:"
	docker-compose ps
	@echo ""
	@echo "Production Service Status:"
	docker-compose -f docker-compose.prod.yml ps

deploy: ## Deploy to production (Docker)
	@echo "Deploying to production..."
	docker-compose up -d

# =============================================================================
# Monitoring Commands
# =============================================================================

logs: ## View all service logs
	@echo "Viewing all service logs (Ctrl+C to exit)..."
	docker-compose logs -f

logs-frontend: ## View frontend logs
	@echo "Viewing frontend logs (Ctrl+C to exit)..."
	docker-compose logs -f frontend

logs-backend: ## View backend logs
	@echo "Viewing backend logs (Ctrl+C to exit)..."
	docker-compose logs -f backend

logs-db: ## View database logs
	@echo "Viewing database logs (Ctrl+C to exit)..."
	docker-compose logs -f postgres

logs-redis: ## View Redis logs
	@echo "Viewing Redis logs (Ctrl+C to exit)..."
	docker-compose logs -f redis

logs-nginx: ## View Nginx logs
	@echo "Viewing Nginx logs (Ctrl+C to exit)..."
	docker-compose -f docker-compose.prod.yml logs -f nginx

health: ## Check service health
	@echo "Checking service health..."
	@echo "Frontend: "
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "Not responding"
	@echo ""
	@echo "Backend: "
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health || echo "Not responding"
	@echo ""
	@echo "Database: "
	@docker-compose exec -T postgres pg_isready -U mibweb || echo "Not ready"
	@echo "Redis: "
	@docker-compose exec -T redis redis-cli ping || echo "Not responding"

# =============================================================================
# Database Commands
# =============================================================================

db-migrate: ## Run database migrations
	@echo "Running database migrations..."
	docker-compose exec backend go run migrate.go up

db-rollback: ## Rollback database migrations
	@echo "Rolling back database migrations..."
	docker-compose exec backend go run migrate.go down

db-seed: ## Seed database with sample data
	@echo "Seeding database..."
	docker-compose exec backend go run seed.go

db-reset: ## Reset database (drop and recreate)
	@echo "Resetting database..."
	docker-compose exec postgres psql -U mibweb -c "DROP DATABASE IF EXISTS mibweb;"
	docker-compose exec postgres psql -U mibweb -c "CREATE DATABASE mibweb;"
	make db-migrate

db-backup: ## Create database backup
	@echo "Creating database backup..."
	@mkdir -p backups
	docker-compose exec postgres pg_dump -U mibweb mibweb > backups/mibweb_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup created in backups/ directory"

db-restore: ## Restore database from backup (usage: make db-restore BACKUP=filename)
	@echo "Restoring database from backup..."
	@if [ -z "$(BACKUP)" ]; then \
		echo "Usage: make db-restore BACKUP=filename"; \
		echo "Available backups:"; \
		ls -la backups/*.sql 2>/dev/null || echo "No backups found"; \
		exit 1; \
	fi
	docker-compose exec -T postgres psql -U mibweb mibweb < backups/$(BACKUP)

# =============================================================================
# Testing Commands
# =============================================================================

test: ## Run all tests
	@echo "Running all tests..."
	make test-backend
	make test-frontend

test-backend: ## Run backend tests
	@echo "Running backend tests..."
	cd backend && go test -v ./...

test-frontend: ## Run frontend tests
	@echo "Running frontend tests..."
	cd frontend && npm test

test-e2e: ## Run end-to-end tests
	@echo "Running E2E tests..."
	cd frontend && npm run test:e2e

test-coverage: ## Generate test coverage report
	@echo "Generating test coverage report..."
	cd backend && go test -coverprofile=coverage.out ./...
	cd backend && go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: backend/coverage.html"

# =============================================================================
# Code Quality Commands
# =============================================================================

lint: ## Run linters for all code
	@echo "Running linters..."
	make lint-backend
	make lint-frontend

lint-backend: ## Run Go linter
	@echo "Running Go linter..."
	cd backend && golangci-lint run

lint-frontend: ## Run frontend linter
	@echo "Running frontend linter..."
	cd frontend && npm run lint

format: ## Format all code
	@echo "Formatting code..."
	make format-backend
	make format-frontend

format-backend: ## Format Go code
	@echo "Formatting Go code..."
	cd backend && go fmt ./...
	cd backend && goimports -w .

format-frontend: ## Format frontend code
	@echo "Formatting frontend code..."
	cd frontend && npm run format

# =============================================================================
# Maintenance Commands
# =============================================================================

clean: ## Clean up containers, images, and volumes
	@echo "Cleaning up Docker resources..."
	docker-compose down -v --remove-orphans
	docker-compose -f docker-compose.prod.yml down -v --remove-orphans
	docker system prune -f
	docker volume prune -f

clean-all: ## Clean up everything including images
	@echo "Cleaning up all Docker resources..."
	make clean
	docker image prune -a -f

backup: ## Create full backup (database + files)
	@echo "Creating full backup..."
	@mkdir -p backups
	make db-backup
	@if [ -d "uploads" ]; then \
		tar -czf backups/uploads_$(shell date +%Y%m%d_%H%M%S).tar.gz uploads/; \
		echo "Files backup created"; \
	fi

restore: ## Restore from backup (usage: make restore DB_BACKUP=db_file FILES_BACKUP=files_file)
	@echo "Restoring from backup..."
	@if [ ! -z "$(DB_BACKUP)" ]; then \
		make db-restore BACKUP=$(DB_BACKUP); \
	fi
	@if [ ! -z "$(FILES_BACKUP)" ]; then \
		tar -xzf backups/$(FILES_BACKUP); \
		echo "Files restored"; \
	fi

update: ## Update application to latest version
	@echo "Updating application..."
	git pull origin main
	make build-prod
	make restart
	@echo "Application updated successfully!"

# =============================================================================
# Utility Commands
# =============================================================================

shell-backend: ## Open shell in backend container
	docker-compose exec backend sh

shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend sh

shell-db: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U mibweb mibweb

shell-redis: ## Open Redis shell
	docker-compose exec redis redis-cli

env-check: ## Check environment configuration
	@echo "Checking environment configuration..."
	@if [ ! -f .env ]; then \
		echo "❌ .env file not found"; \
		echo "💡 Run: cp .env.example .env"; \
	else \
		echo "✅ .env file exists"; \
	fi
	@if command -v docker >/dev/null 2>&1; then \
		echo "✅ Docker is installed"; \
	else \
		echo "❌ Docker is not installed"; \
	fi
	@if command -v docker-compose >/dev/null 2>&1; then \
		echo "✅ Docker Compose is installed"; \
	else \
		echo "❌ Docker Compose is not installed"; \
	fi

ports-check: ## Check if required ports are available
	@echo "Checking port availability..."
	@for port in 3000 8080 5432 6379 80 443; do \
		if lsof -Pi :$$port -sTCP:LISTEN -t >/dev/null 2>&1; then \
			echo "❌ Port $$port is in use"; \
		else \
			echo "✅ Port $$port is available"; \
		fi; \
	done

info: ## Show system information
	@echo "=== MIB Web Platform Information ==="
	@echo "Version: 1.0.0"
	@echo "Environment: $$(cat .env 2>/dev/null | grep APP_ENV | cut -d'=' -f2 || echo 'Not configured')"
	@echo "Docker Version: $$(docker --version 2>/dev/null || echo 'Not installed')"
	@echo "Docker Compose Version: $$(docker-compose --version 2>/dev/null || echo 'Not installed')"
	@echo "System: $$(uname -s) $$(uname -m)"
	@echo "Available Memory: $$(free -h 2>/dev/null | grep Mem | awk '{print $$2}' || echo 'Unknown')"
	@echo "Available Disk: $$(df -h . | tail -1 | awk '{print $$4}' || echo 'Unknown')"

# =============================================================================
# Quick Start Commands
# =============================================================================

quick-start: ## Quick start for new users
	@echo "🚀 MIB Web Platform Quick Start"
	@echo "=============================="
	make env-check
	make ports-check
	@if [ ! -f .env ]; then \
		echo "📝 Creating .env file..."; \
		cp .env.example .env; \
	fi
	@echo "📦 Installing dependencies..."
	make install
	@echo "🏗️  Building services..."
	make build
	@echo "🚀 Starting services..."
	make dev-detached
	@echo "⏳ Waiting for services to start..."
	sleep 10
	make health
	@echo ""
	@echo "🎉 Quick start completed!"
	@echo "📱 Frontend: http://localhost:3000"
	@echo "🔧 Backend API: http://localhost:8080"
	@echo "📊 Health Check: http://localhost:8080/health"
	@echo ""
	@echo "📖 Run 'make help' for more commands"

first-time: ## First time setup (includes everything)
	@echo "🎯 First Time Setup for MIB Web Platform"
	@echo "========================================"
	make quick-start
	@echo "🗄️  Setting up database..."
	make db-migrate
	@echo "🌱 Seeding sample data..."
	make db-seed
	@echo ""
	@echo "✅ Setup completed successfully!"
	@echo "🎉 Your MIB Web Platform is ready to use!"

# =============================================================================
# End of Makefile
# =============================================================================