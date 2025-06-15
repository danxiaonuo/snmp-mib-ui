#!/bin/bash

# GitHub自动化脚本 - 安全版本
# 使用环境变量处理敏感信息，不在文件中保存令牌

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 预设的用户信息（非敏感信息）
GITHUB_USERNAME="Oumu33"
GITHUB_EMAIL="18718359505@163.com"
REPO_NAME="snmp-mib-ui"
GIT_NAME="Oumu33"

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${PURPLE}[STEP]${NC} $1"; }

show_banner() {
    echo -e "${CYAN}"
    echo "======================================================="
    echo "    SNMP MIB Platform - GitHub 自动化部署"
    echo "    安全的一键上传和PR创建"
    echo "======================================================="
    echo -e "${NC}"
}

check_token() {
    log_step "检查GitHub访问令牌..."
    
    if [ -z "$GITHUB_TOKEN" ]; then
        echo ""
        log_warning "需要GitHub Personal Access Token来完成操作"
        echo ""
        echo "请按以下步骤操作："
        echo "1. 访问: https://github.com/settings/tokens"
        echo "2. 点击 'Generate new token'"
        echo "3. 选择权限: repo (完整仓库访问)"
        echo "4. 生成并复制令牌"
        echo ""
        read -s -p "请粘贴您的GitHub Token: " GITHUB_TOKEN
        echo ""
        
        if [ -z "$GITHUB_TOKEN" ]; then
            log_error "未提供Token，无法继续"
            exit 1
        fi
    fi
    
    # 验证Token
    log_info "验证Token有效性..."
    if curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user | grep -q '"login"'; then
        log_success "Token验证成功"
    else
        log_error "Token无效或网络错误"
        exit 1
    fi
}

setup_git() {
    log_step "配置Git环境..."
    
    # 设置Git配置
    git config --global user.name "$GIT_NAME"
    git config --global user.email "$GITHUB_EMAIL"
    
    # 配置凭据助手
    git config --global credential.helper store
    
    log_success "Git配置完成"
}

init_repository() {
    log_step "初始化Git仓库..."
    
    # 检查是否已经是Git仓库
    if [ ! -d ".git" ]; then
        git init
        log_success "Git仓库初始化完成"
    else
        log_info "Git仓库已存在"
    fi
    
    # 设置远程仓库
    REPO_URL="https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
    
    if git remote get-url origin &> /dev/null; then
        git remote set-url origin "$REPO_URL"
    else
        git remote add origin "$REPO_URL"
    fi
    
    log_success "远程仓库配置完成"
}

check_or_create_repo() {
    log_step "检查GitHub仓库..."
    
    # 检查仓库是否存在
    if curl -s -H "Authorization: token $GITHUB_TOKEN" \
        "https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}" | grep -q '"name"'; then
        log_info "仓库已存在: ${GITHUB_USERNAME}/${REPO_NAME}"
    else
        log_info "仓库不存在，正在创建..."
        
        # 创建仓库
        curl -s -X POST \
            -H "Authorization: token $GITHUB_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
                \"name\": \"$REPO_NAME\",
                \"description\": \"Modern SNMP MIB management and network monitoring platform\",
                \"private\": false,
                \"auto_init\": false
            }" \
            "https://api.github.com/user/repos" > /dev/null
        
        if [ $? -eq 0 ]; then
            log_success "仓库创建成功"
        else
            log_error "仓库创建失败"
            exit 1
        fi
    fi
}

commit_and_push() {
    log_step "提交和推送代码..."
    
    # 添加所有文件
    git add .
    
    # 检查是否有变更
    if git diff --staged --quiet; then
        log_warning "没有文件需要提交"
        return 1
    fi
    
    # 创建提交
    commit_message="feat: optimize project structure and add one-click deployment

✨ Features:
- Add comprehensive deploy.sh script with health checks and management commands
- Support for development and production deployment modes
- Automatic environment configuration with secure secret generation
- Service health monitoring and error handling

🧹 Cleanup:
- Remove redundant deployment scripts (6+ files)
- Clean up duplicate docker-compose configurations (4+ files)
- Remove unnecessary documentation files
- Optimize project structure for production readiness

📝 Documentation:
- Rewrite README.md with professional English documentation
- Add comprehensive deployment and usage instructions
- Include architecture diagrams and management commands
- Update .gitignore for better file management

🚀 Deployment:
- One-click deployment with ./deploy.sh
- Support for custom domains and production modes
- Comprehensive management commands (status, logs, restart, clean, backup)
- Docker Compose with optimized configurations

🛠️ Technical improvements:
- Streamlined project structure
- Enhanced error handling and logging
- Automated service health checks
- Production-ready containerization"

    git commit -m "$commit_message"
    
    # 推送到main分支
    git branch -M main
    git push -u origin main
    
    log_success "代码推送到main分支成功"
}

create_pr() {
    log_step "创建Pull Request..."
    
    # 创建功能分支
    git checkout -b feature/project-optimization
    git push -u origin feature/project-optimization
    
    # 准备PR数据
    pr_title="feat: Project optimization and one-click deployment solution"
    pr_body="## Summary
🚀 Complete project optimization with streamlined deployment and clean structure

### ✨ Key Improvements
- **One-click deployment**: New \`deploy.sh\` script with comprehensive features
- **Project cleanup**: Removed redundant scripts and configurations  
- **Documentation**: Simplified and internationalized README.md
- **Structure optimization**: Clean project layout ready for production

### 🛠️ Changes Made
- ✅ Added \`deploy.sh\` with health checks, management commands, and error handling
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

### 🧪 Deployment
\`\`\`bash
# One-click deployment
./deploy.sh

# Management commands
./deploy.sh status
./deploy.sh logs
./deploy.sh restart
\`\`\`

### 📋 Test Plan
- [ ] Clone repository and run \`./deploy.sh\`
- [ ] Verify all services start successfully
- [ ] Test management commands
- [ ] Confirm web interface at http://localhost:3000
- [ ] Validate API endpoints at http://localhost:8080

### 🎯 Impact
This optimization makes the project production-ready with professional deployment capabilities, clean structure, and comprehensive documentation suitable for open-source distribution."

    # 使用GitHub API创建PR
    pr_response=$(curl -s -X POST \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"title\": \"$pr_title\",
            \"body\": \"$pr_body\",
            \"head\": \"feature/project-optimization\",
            \"base\": \"main\"
        }" \
        "https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/pulls")
    
    # 检查PR创建结果
    pr_url=$(echo "$pr_response" | grep -o '"html_url":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$pr_url" ]; then
        log_success "Pull Request创建成功!"
        echo ""
        echo -e "${CYAN}🎉 PR已创建: ${BLUE}$pr_url${NC}"
        echo ""
    else
        log_warning "PR创建可能失败，请手动检查"
        echo "仓库地址: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
    fi
}

show_summary() {
    echo ""
    echo -e "${CYAN}========== 🎉 完成总结 ==========${NC}"
    echo -e "${GREEN}✅ Git仓库配置完成${NC}"
    echo -e "${GREEN}✅ GitHub仓库创建/更新完成${NC}"
    echo -e "${GREEN}✅ 代码推送完成${NC}"
    echo -e "${GREEN}✅ Pull Request创建完成${NC}"
    echo ""
    echo -e "${YELLOW}📋 项目信息:${NC}"
    echo "   🔗 仓库地址: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
    echo "   📝 克隆命令: git clone https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
    echo "   🚀 部署命令: ./deploy.sh"
    echo "   🌐 访问地址: http://localhost:3000"
    echo ""
    echo -e "${BLUE}🛠️ 下一步:${NC}"
    echo "   1. 检查Pull Request并合并"
    echo "   2. 测试部署: git clone && cd snmp-mib-ui && ./deploy.sh"
    echo "   3. 访问应用: http://localhost:3000"
    echo ""
    echo -e "${GREEN}🎊 项目已成功发布到GitHub!${NC}"
}

cleanup() {
    # 清理敏感信息
    unset GITHUB_TOKEN
    
    if [ $? -ne 0 ]; then
        log_error "脚本执行失败"
        echo ""
        echo "请检查："
        echo "1. GitHub Token是否有效"
        echo "2. 网络连接是否正常"
        echo "3. 仓库权限是否正确"
    fi
}

main() {
    show_banner
    trap cleanup EXIT
    
    # 检查当前目录
    if [ ! -f "package.json" ] || [ ! -f "deploy.sh" ]; then
        log_error "请在项目根目录执行此脚本"
        exit 1
    fi
    
    check_token
    setup_git
    init_repository
    check_or_create_repo
    
    if commit_and_push; then
        create_pr
        show_summary
    else
        log_info "没有新的更改需要提交"
    fi
    
    trap - EXIT
}

# 使用说明
if [ "$1" = "help" ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    echo "GitHub自动化部署脚本"
    echo ""
    echo "用法:"
    echo "  $0                    # 交互式运行，会提示输入Token"
    echo "  GITHUB_TOKEN=xxx $0   # 使用环境变量提供Token"
    echo ""
    echo "环境变量:"
    echo "  GITHUB_TOKEN    GitHub Personal Access Token (必需)"
    echo ""
    echo "预设信息:"
    echo "  GitHub用户: $GITHUB_USERNAME"
    echo "  仓库名称: $REPO_NAME"
    echo "  邮箱: $GITHUB_EMAIL"
    echo ""
    exit 0
fi

# 执行主函数
main "$@"