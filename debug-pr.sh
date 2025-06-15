#!/bin/bash

# 调试PR创建问题的脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

GITHUB_USERNAME="Oumu33"
REPO_NAME="snmp-mib-ui"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo -e "${BLUE}========== PR创建调试信息 ==========${NC}"

# 1. 检查Git状态
echo ""
log_info "1. Git仓库状态:"
echo "当前分支: $(git rev-parse --abbrev-ref HEAD)"
echo "Git状态:"
git status --porcelain || echo "工作目录干净"

# 2. 检查远程分支
echo ""
log_info "2. 远程分支状态:"
git ls-remote --heads origin

# 3. 检查是否有现有PR
echo ""
log_info "3. 检查现有PR (需要Token):"
read -s -p "请输入GitHub Token: " GITHUB_TOKEN
echo ""

if [ -n "$GITHUB_TOKEN" ]; then
    echo "检查现有PR..."
    pr_response=$(curl -s \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/pulls?state=all")
    
    if echo "$pr_response" | jq -e '.[0]' > /dev/null 2>&1; then
        echo "找到PR:"
        echo "$pr_response" | jq -r '.[] | "PR #\(.number): \(.title) (\(.state)) - \(.html_url)"'
    else
        echo "没有找到PR或API调用失败"
        echo "API响应: $pr_response"
    fi
    
    # 4. 尝试创建PR
    echo ""
    log_info "4. 尝试创建新PR..."
    
    pr_data='{
        "title": "feat: Project optimization and one-click deployment solution", 
        "body": "## Summary\n🚀 Complete project optimization with streamlined deployment and clean structure\n\n### Key Changes\n- Added comprehensive deploy.sh script\n- Cleaned up redundant files\n- Optimized project structure\n- Updated documentation", 
        "head": "feature/project-optimization", 
        "base": "main"
    }'
    
    create_response=$(curl -s -X POST \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Content-Type: application/json" \
        -H "Accept: application/vnd.github.v3+json" \
        -d "$pr_data" \
        "https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/pulls")
    
    if echo "$create_response" | jq -e '.html_url' > /dev/null 2>&1; then
        pr_url=$(echo "$create_response" | jq -r '.html_url')
        pr_number=$(echo "$create_response" | jq -r '.number')
        log_success "PR创建成功! PR #${pr_number}"
        echo "链接: $pr_url"
    else
        log_error "PR创建失败"
        echo "错误信息:"
        echo "$create_response" | jq . 2>/dev/null || echo "$create_response"
        
        # 提供手动创建链接
        echo ""
        log_info "手动创建PR链接:"
        echo "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}/compare/main...feature/project-optimization"
    fi
else
    echo "未提供Token，跳过API检查"
fi

# 5. 仓库信息
echo ""
log_info "5. 仓库访问信息:"
echo "仓库地址: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
echo "手动PR: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}/compare/main...feature/project-optimization"
echo "所有PR: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}/pulls"

echo ""
echo -e "${GREEN}========== 调试完成 ==========${NC}"