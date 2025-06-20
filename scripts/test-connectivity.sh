#!/bin/bash

# 测试脚本：验证前端和后端的连接

echo "===== 测试前端和后端连接 ====="

# 测试后端健康检查
echo "1. 测试后端健康检查..."
BACKEND_HEALTH=$(curl -s http://localhost:17880/health)
echo "后端健康状态: $BACKEND_HEALTH"

# 测试前端健康检查
echo "2. 测试前端健康检查..."
FRONTEND_HEALTH=$(curl -s http://localhost:12300/api/health)
echo "前端健康状态: $FRONTEND_HEALTH"

# 测试前端访问后端API
echo "3. 测试前端访问后端API..."
DEVICES_API=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:12300/api/devices)
echo "设备API响应状态码: $DEVICES_API"

# 测试公网IP访问
echo "4. 测试公网IP访问..."
PUBLIC_IP=$(hostname -I | awk '{print $1}')
echo "公网IP: $PUBLIC_IP"
echo "请尝试在浏览器中访问: http://$PUBLIC_IP:12300"

echo "===== 测试完成 ====="