#!/bin/bash

# 清理Docker相关文件脚本
# 移除不需要的Docker文件，保持纯二进制部署

echo "🧹 清理Docker相关文件..."

# 要删除的Docker文件列表
docker_files=(
    ".dockerignore"
    "docker-compose.yml"
    "scripts/docker-deploy.sh"
)

# 备份目录
backup_dir="docker-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$backup_dir"

echo "📦 备份Docker文件到: $backup_dir"

# 移动文件到备份目录
for file in "${docker_files[@]}"; do
    if [ -f "$file" ] || [ -L "$file" ]; then
        echo "  移动: $file -> $backup_dir/"
        mv "$file" "$backup_dir/"
    fi
done

# 检查是否还有其他Docker相关文件
echo ""
echo "🔍 检查剩余的Docker相关文件..."
remaining_docker_files=$(find . -name "*docker*" -o -name "*compose*" | grep -v node_modules | grep -v "$backup_dir")

if [ -z "$remaining_docker_files" ]; then
    echo "✅ 所有Docker文件已清理完成"
else
    echo "⚠️  发现剩余Docker相关文件:"
    echo "$remaining_docker_files"
fi

echo ""
echo "📋 清理总结:"
echo "  ✅ Docker文件已备份到: $backup_dir"
echo "  ✅ 项目现在是纯二进制部署"
echo "  ✅ 无需Docker依赖"

echo ""
echo "🚀 现在可以运行: ./deploy-simple.sh"