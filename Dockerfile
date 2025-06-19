# Multi-stage build for optimized production image
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    curl \
    bash \
    git \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Install dependencies only when needed
FROM base AS deps

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with npm (more reliable for production)
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

# Install dev dependencies for build
FROM base AS deps-build
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy build dependencies
COPY --from=deps-build /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set build environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV GENERATE_SOURCEMAP=false

# Build application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create system user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy public assets
COPY --from=builder /app/public ./public

# Create .next directory with correct permissions
RUN mkdir .next && chown nextjs:nodejs .next

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy package.json for runtime dependencies
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Health check script (optional)
# COPY --chown=nextjs:nodejs healthcheck.sh ./healthcheck.sh
# RUN chmod +x ./healthcheck.sh

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Add health check (using curl directly)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || curl -f http://localhost:3000/ || exit 1

# Add labels for better container management
LABEL maintainer="MIB Web UI Team" \
      version="2.0.0" \
      description="Enterprise SNMP MIB Management Platform" \
      org.opencontainers.image.title="MIB Web UI" \
      org.opencontainers.image.description="Professional enterprise-grade SNMP MIB management platform" \
      org.opencontainers.image.version="2.0.0" \
      org.opencontainers.image.vendor="MIB Web UI" \
      org.opencontainers.image.licenses="MIT"

# Start the application
CMD ["node", "server.js"]
