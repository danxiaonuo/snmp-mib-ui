#!/bin/bash
export GIN_MODE=release
export PORT=${BACKEND_PORT:-8080}
export DB_PATH=${DB_PATH:-./data/mib-platform.db}

# 创建数据目录
mkdir -p data

echo "🚀 Starting SNMP MIB Platform Backend on port ${PORT}"
./mib-platform
