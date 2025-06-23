#!/bin/bash

echo "移除 Redis 依赖..."

# 更新所有服务文件
for file in backend/services/*.go; do
    if [ -f "$file" ]; then
        echo "处理文件: $file"
        
        # 移除 Redis 导入
        sed -i 's/.*"github.com\/go-redis\/redis\/v8".*//' "$file"
        
        # 更新结构体定义
        sed -i 's/redis \*redis\.Client//' "$file"
        
        # 更新构造函数参数
        sed -i 's/, redis \*redis\.Client//' "$file"
        sed -i 's/redis: redis,//' "$file"
        
        # 更新服务调用
        sed -i 's/NewSNMPService(.*db.*redis)/NewSNMPService(db)/' "$file"
        sed -i 's/NewDeviceService(.*db.*redis)/NewDeviceService(db)/' "$file"
        sed -i 's/NewHostService(.*db.*redis)/NewHostService(db)/' "$file"
        sed -i 's/NewConfigService(.*db.*redis)/NewConfigService(db)/' "$file"
        sed -i 's/NewMIBService(.*db.*redis)/NewMIBService(db)/' "$file"
    fi
done

# 更新所有控制器文件
for file in backend/controllers/*.go; do
    if [ -f "$file" ]; then
        echo "处理文件: $file"
        
        # 移除 Redis 导入
        sed -i 's/.*"github.com\/go-redis\/redis\/v8".*//' "$file"
        
        # 更新结构体定义
        sed -i 's/redis \*redis\.Client//' "$file"
        
        # 更新构造函数参数
        sed -i 's/, redis \*redis\.Client//' "$file"
        sed -i 's/redis: redis,//' "$file"
    fi
done

echo "Redis 依赖移除完成"