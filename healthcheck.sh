#!/bin/bash
# Health check script for Next.js frontend

# Check if the application is responding
curl -f http://localhost:3000/api/health || curl -f http://localhost:3000/ || exit 1