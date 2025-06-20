#!/bin/bash
# Health check script for Next.js frontend

# Get port from environment variable or use default
PORT=${PORT:-12300}

# Check if the application is responding
curl -f http://localhost:${PORT}/api/health || curl -f http://localhost:${PORT}/ || exit 1