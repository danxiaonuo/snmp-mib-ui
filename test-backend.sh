#!/bin/bash

echo "测试后端启动..."

# 清除所有可能的数据库环境变量
unset DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME
unset REDIS_HOST REDIS_PORT REDIS_PASSWORD
unset DATABASE_URL POSTGRES_HOST POSTGRES_PORT POSTGRES_USER POSTGRES_PASSWORD

# 设置SQLite环境
export ENVIRONMENT=production
export SERVER_PORT=17880
export JWT_SECRET=test-secret-key
export UPLOAD_PATH=./uploads

echo "环境变量:"
echo "ENVIRONMENT=$ENVIRONMENT"
echo "SERVER_PORT=$SERVER_PORT"
echo "JWT_SECRET已设置"

cd backend

# 创建必要目录
mkdir -p uploads data

echo "开始测试..."
timeout 15s go run . || echo "测试完成或超时"