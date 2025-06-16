#!/bin/bash

# 快速创建PR脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🚀 创建 Pull Request..."

# 获取当前分支和仓库信息
CURRENT_BRANCH=$(git branch --show-current)
REMOTE_URL=$(git remote get-url origin)
BASE_BRANCH="main"

# 清理仓库URL用于显示
CLEAN_REPO_URL=$(echo "$REMOTE_URL" | sed 's/\.git$//' | sed 's/git@github\.com:/https:\/\/github\.com\//')

echo -e "${BLUE}当前分支:${NC} $CURRENT_BRANCH"
echo -e "${BLUE}目标分支:${NC} $BASE_BRANCH"
echo -e "${BLUE}仓库地址:${NC} $CLEAN_REPO_URL"

# 生成PR信息
PR_TITLE="feat: project structure optimization and deployment improvements"

RECENT_COMMITS=$(git log --oneline -5 --format="- %s")

PR_BODY="## Summary
This PR includes project structure optimization and deployment improvements.

## Changes Made
$RECENT_COMMITS

## Key Improvements
- ✅ Cleaned up redundant files and documentation
- ✅ Added one-click deployment script (\`deploy.sh\`)
- ✅ Rewrote README for better clarity
- ✅ Optimized Docker configurations
- ✅ Improved project structure and maintainability
- ✅ Enhanced Git workflow scripts

## Testing
- [x] Verified build process works correctly
- [x] Tested deployment script functionality
- [x] Confirmed all core features remain intact
- [x] Removed redundant files without breaking functionality

## Deployment
Use the new one-click deployment:
\`\`\`bash
./deploy.sh
\`\`\`

## Files Changed
- Removed redundant documentation and backup files
- Added \`deploy.sh\` for one-click deployment
- Improved \`fix-git-and-pr.sh\` for better workflow
- Cleaned up project structure
- Updated README with current project state"

# 创建PR URL
PR_CREATE_URL="$CLEAN_REPO_URL/compare/$BASE_BRANCH...$CURRENT_BRANCH"

echo ""
echo "======================================"
echo -e "${GREEN}📝 创建 Pull Request${NC}"
echo "======================================"
echo ""
echo "🔗 点击以下链接创建PR:"
echo -e "${YELLOW}$PR_CREATE_URL${NC}"
echo ""
echo "📋 使用以下信息:"
echo ""
echo -e "${BLUE}标题:${NC}"
echo "$PR_TITLE"
echo ""
echo -e "${BLUE}描述:${NC}"
echo "=================="
echo "$PR_BODY"
echo "=================="
echo ""

# 尝试自动打开浏览器
if command -v xdg-open &> /dev/null; then
    echo -e "${GREEN}🌐 正在浏览器中打开PR创建页面...${NC}"
    xdg-open "$PR_CREATE_URL" 2>/dev/null &
elif command -v open &> /dev/null; then
    echo -e "${GREEN}🌐 正在浏览器中打开PR创建页面...${NC}"
    open "$PR_CREATE_URL" 2>/dev/null &
else
    echo -e "${YELLOW}⚠️  请手动复制上述链接在浏览器中打开${NC}"
fi

echo ""
echo -e "${GREEN}✅ PR信息已准备完成！${NC}"
echo "请在浏览器中完成PR创建流程。"