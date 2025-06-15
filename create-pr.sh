#!/bin/bash

# 专门用于创建PR的脚本
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 预设信息
GITHUB_USERNAME="Oumu33"
REPO_NAME="snmp-mib-ui"

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${PURPLE}[STEP]${NC} $1"; }

show_banner() {
    echo -e "${CYAN}"
    echo "======================================================="
    echo "    创建 Pull Request"
    echo "======================================================="
    echo -e "${NC}"
}

get_token() {
    if [ -z "$GITHUB_TOKEN" ]; then
        echo ""
        read -s -p "请输入您的GitHub Token: " GITHUB_TOKEN
        echo ""
    fi
    
    if [ -z "$GITHUB_TOKEN" ]; then
        log_error "需要GitHub Token"
        exit 1
    fi
}

check_branches() {
    log_step "检查分支状态..."
    
    # 检查当前分支
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    log_info "当前分支: $current_branch"
    
    # 检查远程分支
    git fetch origin
    
    # 确保我们在正确的分支上
    if [ "$current_branch" != "feature/project-optimization" ]; then
        if git show-ref --verify --quiet refs/heads/feature/project-optimization; then
            git checkout feature/project-optimization
        else
            log_error "feature/project-optimization 分支不存在"
            exit 1
        fi
    fi
    
    # 确保分支已推送
    if ! git ls-remote --heads origin feature/project-optimization | grep -q feature/project-optimization; then
        log_info "推送feature分支到远程..."
        git push -u origin feature/project-optimization
    fi
    
    log_success "分支检查完成"
}

create_pr_api() {
    log_step "通过API创建Pull Request..."
    
    # PR内容
    pr_title="feat: Project optimization and one-click deployment solution"
    
    # 转义JSON的PR描述
    pr_body=$(cat << 'EOF'
## Summary
🚀 Complete project optimization with streamlined deployment and clean structure

### ✨ Key Improvements
- **One-click deployment**: New `deploy.sh` script with comprehensive features
- **Project cleanup**: Removed redundant scripts and configurations  
- **Documentation**: Simplified and internationalized README.md
- **Structure optimization**: Clean project layout ready for production

### 🛠️ Changes Made
- ✅ Added `deploy.sh` with health checks, management commands, and error handling
- ✅ Removed 6+ redundant deployment scripts
- ✅ Cleaned up 4+ duplicate docker-compose files
- ✅ Updated .gitignore for better file management
- ✅ Rewrote README.md with professional English documentation
- ✅ Optimized project structure for GitHub standards

### 🚀 New Features
- **Management commands**: status, logs, restart, clean, backup
- **Environment configuration**: Automatic secure secret generation
- **Health monitoring**: Service readiness checks
- **Multi-mode deployment**: Development and production modes
- **Error handling**: Comprehensive failure recovery

### 🧪 Deployment Test
```bash
# Clone and test
git clone https://github.com/Oumu33/snmp-mib-ui.git
cd snmp-mib-ui
./deploy.sh

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:8080
```

### 📋 Test Plan
- [ ] Clone repository and run `./deploy.sh`
- [ ] Verify all services start successfully  
- [ ] Test management commands (`status`, `logs`, `restart`)
- [ ] Confirm web interface at http://localhost:3000
- [ ] Validate API endpoints at http://localhost:8080
- [ ] Test one-click deployment from scratch

### 🎯 Impact
This optimization makes the project production-ready with:
- Professional deployment capabilities
- Clean and maintainable structure  
- Comprehensive documentation
- Enterprise-grade containerization
- Suitable for open-source distribution

Ready for immediate use and community contribution!
EOF
)

    # 创建临时JSON文件
    cat > pr_data.json << EOF
{
    "title": "$pr_title",
    "body": $(echo "$pr_body" | jq -R -s .),
    "head": "feature/project-optimization",
    "base": "main"
}
EOF

    # 调用GitHub API
    log_info "正在创建Pull Request..."
    
    response=$(curl -s -X POST \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Content-Type: application/json" \
        -H "Accept: application/vnd.github.v3+json" \
        -d @pr_data.json \
        "https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/pulls")
    
    # 清理临时文件
    rm -f pr_data.json
    
    # 检查响应
    echo "$response" > pr_response.json
    
    if echo "$response" | jq -e '.html_url' > /dev/null 2>&1; then
        pr_url=$(echo "$response" | jq -r '.html_url')
        pr_number=$(echo "$response" | jq -r '.number')
        
        log_success "Pull Request创建成功!"
        echo ""
        echo -e "${CYAN}🎉 PR #${pr_number} 已创建${NC}"
        echo -e "${BLUE}📎 链接: $pr_url${NC}"
        echo ""
        
        # 显示额外信息
        echo -e "${YELLOW}📋 下一步操作:${NC}"
        echo "1. 访问PR链接查看详情"
        echo "2. 检查所有更改是否正确"
        echo "3. 如果一切正常，点击 'Merge pull request'"
        echo "4. 测试部署: git clone && ./deploy.sh"
        echo ""
        
    else
        log_error "PR创建失败"
        echo ""
        echo "API响应:"
        echo "$response" | jq . 2>/dev/null || echo "$response"
        echo ""
        
        # 检查常见错误
        if echo "$response" | grep -q "already exists"; then
            log_warning "PR可能已经存在，请检查仓库页面"
            echo "访问: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}/pulls"
        elif echo "$response" | grep -q "validation failed"; then
            log_warning "验证失败，可能是分支问题"
        elif echo "$response" | grep -q "Bad credentials"; then
            log_error "Token无效或权限不足"
        fi
        
        exit 1
    fi
    
    # 清理响应文件
    rm -f pr_response.json
}

create_pr_manual() {
    log_step "提供手动创建PR的信息..."
    
    echo ""
    echo -e "${CYAN}========== 手动创建PR ==========${NC}"
    echo ""
    echo "如果API创建失败，请手动创建PR:"
    echo ""
    echo "1. 访问仓库页面:"
    echo "   https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
    echo ""
    echo "2. 点击 'Compare & pull request' 按钮"
    echo ""
    echo "3. 或者直接访问:"
    echo "   https://github.com/${GITHUB_USERNAME}/${REPO_NAME}/compare/main...feature/project-optimization"
    echo ""
    echo "4. 使用以下信息:"
    echo ""
    echo "标题:"
    echo "feat: Project optimization and one-click deployment solution"
    echo ""
    echo "描述: (已保存在 pr_template.md 文件中)"
    
    # 创建PR模板文件
    cat > pr_template.md << 'EOF'
## Summary
🚀 Complete project optimization with streamlined deployment and clean structure

### ✨ Key Improvements
- **One-click deployment**: New `deploy.sh` script with comprehensive features
- **Project cleanup**: Removed redundant scripts and configurations  
- **Documentation**: Simplified and internationalized README.md
- **Structure optimization**: Clean project layout ready for production

### 🛠️ Changes Made
- ✅ Added `deploy.sh` with health checks, management commands, and error handling
- ✅ Removed 6+ redundant deployment scripts
- ✅ Cleaned up 4+ duplicate docker-compose files
- ✅ Updated .gitignore for better file management
- ✅ Rewrote README.md with professional English documentation
- ✅ Optimized project structure for GitHub standards

### 🚀 New Features
- **Management commands**: status, logs, restart, clean, backup
- **Environment configuration**: Automatic secure secret generation
- **Health monitoring**: Service readiness checks
- **Multi-mode deployment**: Development and production modes
- **Error handling**: Comprehensive failure recovery

### 🧪 Deployment Test
```bash
# Clone and test
git clone https://github.com/Oumu33/snmp-mib-ui.git
cd snmp-mib-ui
./deploy.sh

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:8080
```

### 📋 Test Plan
- [ ] Clone repository and run `./deploy.sh`
- [ ] Verify all services start successfully  
- [ ] Test management commands (`status`, `logs`, `restart`)
- [ ] Confirm web interface at http://localhost:3000
- [ ] Validate API endpoints at http://localhost:8080
- [ ] Test one-click deployment from scratch

### 🎯 Impact
This optimization makes the project production-ready with:
- Professional deployment capabilities
- Clean and maintainable structure  
- Comprehensive documentation
- Enterprise-grade containerization
- Suitable for open-source distribution

Ready for immediate use and community contribution!
EOF

    echo ""
    log_success "PR模板已保存到 pr_template.md"
}

check_existing_pr() {
    log_step "检查是否已存在PR..."
    
    existing_prs=$(curl -s \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/pulls?head=${GITHUB_USERNAME}:feature/project-optimization")
    
    if echo "$existing_prs" | jq -e '.[0].html_url' > /dev/null 2>&1; then
        existing_url=$(echo "$existing_prs" | jq -r '.[0].html_url')
        existing_number=$(echo "$existing_prs" | jq -r '.[0].number')
        
        log_warning "已存在PR #${existing_number}"
        echo ""
        echo -e "${BLUE}📎 现有PR链接: $existing_url${NC}"
        echo ""
        echo "选项:"
        echo "1. 查看现有PR"
        echo "2. 关闭现有PR并创建新的"
        echo "3. 取消操作"
        echo ""
        read -p "请选择 (1-3): " choice
        
        case $choice in
            1)
                echo "请访问: $existing_url"
                exit 0
                ;;
            2)
                log_info "关闭现有PR..."
                curl -s -X PATCH \
                    -H "Authorization: token $GITHUB_TOKEN" \
                    -H "Accept: application/vnd.github.v3+json" \
                    -d '{"state": "closed"}' \
                    "https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/pulls/${existing_number}" > /dev/null
                log_success "现有PR已关闭"
                return 0
                ;;
            3)
                exit 0
                ;;
            *)
                log_error "无效选择"
                exit 1
                ;;
        esac
    fi
    
    log_info "没有找到现有的PR"
    return 0
}

main() {
    show_banner
    
    # 检查依赖
    if ! command -v jq &> /dev/null; then
        log_error "需要安装jq工具: sudo apt install jq"
        exit 1
    fi
    
    get_token
    check_branches
    check_existing_pr
    
    # 尝试API创建
    if create_pr_api; then
        log_success "PR创建完成!"
    else
        log_warning "API创建失败，提供手动创建信息"
        create_pr_manual
    fi
}

main "$@"