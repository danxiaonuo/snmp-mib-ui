.PHONY: build run test clean docker-build docker-run dev deps

# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod
BINARY_NAME=mib-platform
BINARY_UNIX=$(BINARY_NAME)_unix

# Build the application
build:
	$(GOBUILD) -o $(BINARY_NAME) -v ./...

# Run the application
run:
	$(GOBUILD) -o $(BINARY_NAME) -v ./...
	./$(BINARY_NAME)

# Run tests
test:
	$(GOTEST) -v ./...

# Clean build files
clean:
	$(GOCLEAN)
	rm -f $(BINARY_NAME)
	rm -f $(BINARY_UNIX)

# Download dependencies
deps:
	$(GOMOD) download
	$(GOMOD) tidy

# Development with hot reload
dev:
	air

# Build for Linux
build-linux:
	# Build for current architecture (auto-detected)
	CGO_ENABLED=0 GOOS=linux $(GOBUILD) -o $(BINARY_UNIX) -v

build-linux-amd64:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GOBUILD) -o $(BINARY_UNIX)-amd64 -v

build-linux-arm64:
	CGO_ENABLED=0 GOOS=linux GOARCH=arm64 $(GOBUILD) -o $(BINARY_UNIX)-arm64 -v

build-multi-arch: build-linux-amd64 build-linux-arm64
	@echo "Multi-architecture builds completed"

# Docker commands
docker-build:
	docker build -t mib-platform-backend .

docker-build-dev:
	docker build -f Dockerfile.dev -t mib-platform-backend-dev .

docker-run:
	docker run -p 8080:8080 mib-platform-backend

docker-run-dev:
	docker run -p 8080:8080 -v $(PWD):/app mib-platform-backend-dev

# Database commands
db-migrate:
	migrate -path ./migrations -database "$(DATABASE_URL)" up

db-rollback:
	migrate -path ./migrations -database "$(DATABASE_URL)" down

# Linting
lint:
	golangci-lint run

# Format code
fmt:
	go fmt ./...

# Security check
security:
	gosec ./...

# Generate API documentation
docs:
	swag init

# Install development tools
install-tools:
	go install github.com/cosmtrek/air@latest
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest
	go install github.com/swaggo/swag/cmd/swag@latest
