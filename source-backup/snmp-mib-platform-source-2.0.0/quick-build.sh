#!/bin/bash

# 快速构建脚本

set -e

echo "🚀 SNMP MIB Platform - 快速构建"

# 检查依赖
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi

if ! command -v go &> /dev/null; then
    echo "❌ Go 未安装"
    exit 1
fi

# 安装前端依赖
echo "📦 安装前端依赖..."
npm install

# 构建前端
echo "🔨 构建前端..."
npm run build

# 构建后端
echo "🔨 构建后端..."
cd backend
go mod download
go build -o mib-platform .
cd ..

echo "✅ 构建完成！"
echo ""
echo "启动方式:"
echo "  前端: npm start"
echo "  后端: cd backend && ./mib-platform"
echo ""
echo "或者使用二进制部署:"
echo "  ./build-binary.sh"
