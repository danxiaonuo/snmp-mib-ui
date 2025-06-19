# Build stage
FROM golang:1.23-alpine AS builder

# Set Go proxy for faster downloads
ENV GOPROXY=https://goproxy.cn,direct
ENV CGO_ENABLED=0
ENV GOOS=linux
# GOARCH will be automatically set by Docker buildx based on target platform
# ENV GOARCH=amd64  # Removed to support multi-architecture builds

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata upx

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download && go mod verify

# Copy source code
COPY . .

# Build the application with optimizations
RUN go build -a -installsuffix cgo \
    -ldflags='-w -s -extldflags "-static"' \
    -o main .

# Skip binary compression for better compatibility
# RUN upx --best --lzma main

# Development stage
FROM alpine:latest AS development

# Install runtime dependencies
RUN apk --no-cache add ca-certificates tzdata wget curl

# Create app user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Set timezone
ENV TZ=Asia/Shanghai

# Create directories
RUN mkdir -p /app/uploads /app/mibs /var/log/mibweb && \
    chown -R appuser:appgroup /app /var/log/mibweb

WORKDIR /app

# Copy the binary from builder stage
COPY --from=builder /app/main .
RUN chown appuser:appgroup main && chmod +x main

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run the application
CMD ["./main"]

# Production stage
FROM alpine:latest AS production

# Install minimal runtime dependencies
RUN apk --no-cache add ca-certificates tzdata wget && \
    apk --no-cache add --virtual .build-deps curl && \
    apk del .build-deps

# Create app user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Set timezone
ENV TZ=Asia/Shanghai
ENV GIN_MODE=release
ENV APP_ENV=production

# Create directories with proper permissions
RUN mkdir -p /app/uploads /app/mibs /var/log/mibweb && \
    chown -R appuser:appgroup /app /var/log/mibweb && \
    chmod 755 /app && \
    chmod 755 /app/uploads && \
    chmod 755 /app/mibs && \
    chmod 755 /var/log/mibweb

WORKDIR /app

# Copy the binary from builder stage
COPY --from=builder /app/main .
RUN chown appuser:appgroup main && chmod +x main

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check with longer timeouts for production
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run the application
CMD ["./main"]
