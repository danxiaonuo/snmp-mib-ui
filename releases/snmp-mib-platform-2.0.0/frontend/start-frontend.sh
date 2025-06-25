#!/bin/bash
export NODE_ENV=production
export PORT=${PORT:-12300}
export HOSTNAME=${HOSTNAME:-0.0.0.0}
echo "🚀 Starting SNMP MIB Platform Frontend on ${HOSTNAME}:${PORT}"
node server.js
