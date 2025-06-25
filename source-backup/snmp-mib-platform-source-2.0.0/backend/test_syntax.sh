#!/bin/bash

# 检查Go代码语法错误的脚本
# 使用gofmt来检查语法

echo "检查Go代码语法..."

# 检查服务文件
echo "检查services目录..."
for file in services/*.go; do
    if [ -f "$file" ]; then
        echo "检查 $file"
        # 简单的语法检查
        gofmt -d "$file" >/dev/null 2>&1
        if [ $? -ne 0 ]; then
            echo "ERROR: $file 存在语法错误"
        else
            echo "OK: $file 语法正确"
        fi
    fi
done

# 检查模型文件
echo "检查models目录..."
for file in models/*.go; do
    if [ -f "$file" ]; then
        echo "检查 $file"
        gofmt -d "$file" >/dev/null 2>&1
        if [ $? -ne 0 ]; then
            echo "ERROR: $file 存在语法错误"
        else
            echo "OK: $file 语法正确"
        fi
    fi
done

echo "语法检查完成"