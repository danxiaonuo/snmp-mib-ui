#!/bin/bash

# GitHub自动化设置脚本
# 自动初始化Git仓库并推送到GitHub

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${PURPLE}[STEP]${NC} $1"; }

show_banner() {
    echo -e "${CYAN}"
    echo "======================================================="
    echo "    SNMP MIB Platform - GitHub 自动化设置"
    echo "    自动初始化Git仓库并推送到GitHub"
    echo "======================================================="
    echo -e "${NC}"
}

check_requirements() {
    log_step "检查系统要求..."
    
    # 检查Git
    if ! command -v git &> /dev/null; then
        log_error "Git未安装，请先安装Git"
        log_info "Ubuntu/Debian: sudo apt install git"
        log_info "CentOS/RHEL: sudo yum install git"
        exit 1
    fi
    
    # 检查curl
    if ! command -v curl &> /dev/null; then
        log_error "curl未安装，请先安装curl"
        exit 1
    fi
    
    log_success "系统要求检查通过"
}

setup_git_config() {
    log_step "设置Git配置..."
    
    # 检查Git配置
    if ! git config --global user.name &> /dev/null; then
        read -p "请输入您的Git用户名: " git_username
        git config --global user.name "$git_username"
    else
        log_info "Git用户名: $(git config --global user.name)"
    fi
    
    if ! git config --global user.email &> /dev/null; then
        read -p "请输入您的Git邮箱: " git_email
        git config --global user.email "$git_email"
    else
        log_info "Git邮箱: $(git config --global user.email)"
    fi
    
    log_success "Git配置完成"
}

init_repository() {
    log_step "初始化Git仓库..."
    
    # 检查是否已经是Git仓库
    if [ -d ".git" ]; then
        log_warning "已存在Git仓库，跳过初始化"
    else
        git init
        log_success "Git仓库初始化完成"
    fi
}

prepare_commit() {
    log_step "准备提交文件..."
    
    # 添加所有文件
    git add .
    
    # 检查是否有文件需要提交
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
- Production-ready containerization

This commit prepares the project for GitHub release with a clean,
professional structure and comprehensive deployment solution."

    git commit -m "$commit_message"
    log_success "文件提交完成"
}

setup_github_remote() {
    log_step "设置GitHub远程仓库..."
    
    # 获取GitHub信息
    read -p "请输入您的GitHub用户名: " github_username
    read -p "请输入仓库名称 (默认: snmp-mib-platform): " repo_name
    repo_name=${repo_name:-snmp-mib-platform}
    
    # 设置远程仓库
    github_url="https://github.com/${github_username}/${repo_name}.git"
    
    # 检查是否已有remote
    if git remote get-url origin &> /dev/null; then
        log_info "更新现有的远程仓库地址"
        git remote set-url origin "$github_url"
    else
        git remote add origin "$github_url"
    fi
    
    log_success "远程仓库设置完成: $github_url"
    
    # 返回仓库信息供后续使用
    echo "$github_username|$repo_name"
}

create_github_repo() {
    local repo_info="$1"
    local github_username=$(echo "$repo_info" | cut -d'|' -f1)
    local repo_name=$(echo "$repo_info" | cut -d'|' -f2)
    
    log_step "检查GitHub仓库是否存在..."
    
    echo ""
    echo -e "${YELLOW}请在GitHub上创建仓库:${NC}"
    echo "1. 访问: https://github.com/new"
    echo "2. 仓库名称: $repo_name"
    echo "3. 描述: Modern SNMP MIB management and network monitoring platform"
    echo "4. 设置为Public"
    echo "5. 不要初始化README、.gitignore或LICENSE"
    echo "6. 点击'Create repository'"
    echo ""
    
    read -p "仓库创建完成后，按Enter继续..." -n 1 -r
    echo ""
}

push_to_github() {
    log_step "推送到GitHub..."
    
    echo ""
    log_info "现在需要您的GitHub凭据来推送代码"
    log_info "您可以使用以下方式之一:"
    echo "1. GitHub用户名 + Personal Access Token"
    echo "2. 如果启用了2FA，必须使用Personal Access Token"
    echo ""
    log_warning "注意: 推送时如果要求输入密码，请使用Personal Access Token而不是GitHub密码"
    echo ""
    
    # 尝试推送
    if git push -u origin main 2>/dev/null || git push -u origin master 2>/dev/null; then
        log_success "代码推送成功!"
    else
        log_error "推送失败，可能是认证问题"
        echo ""
        echo "请尝试以下解决方案:"
        echo "1. 检查仓库是否存在且有写入权限"
        echo "2. 确认GitHub用户名和Token正确"
        echo "3. 手动执行: git push -u origin main"
        echo ""
        return 1
    fi
}

create_branch_and_pr() {
    log_step "创建功能分支..."
    
    # 创建功能分支
    git checkout -b feature/project-optimization
    
    # 推送分支
    if git push -u origin feature/project-optimization; then
        log_success "功能分支推送成功"
        
        # 显示PR创建信息
        echo ""
        echo -e "${CYAN}======== 创建Pull Request ========${NC}"
        echo "访问以下链接创建PR:"
        echo "https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\([^/]*\/[^/]*\)\.git/\1/')/compare/feature/project-optimization"
        echo ""
        echo "PR标题建议:"
        echo "feat: Project optimization and one-click deployment solution"
        echo ""
        echo "PR描述模板:"
        cat << 'EOF'
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

### 🚀 Deployment
```bash
# One-click deployment
./deploy.sh

# Management commands
./deploy.sh status
./deploy.sh logs
./deploy.sh restart
```

### 🧪 Test Plan
- [ ] Clone repository and run `./deploy.sh`
- [ ] Verify all services start successfully
- [ ] Test management commands
- [ ] Confirm web interface at http://localhost:3000
- [ ] Validate API endpoints at http://localhost:8080
EOF
        echo ""
    else
        log_error "分支推送失败"
        return 1
    fi
}

show_summary() {
    log_step "操作完成总结"
    
    echo ""
    echo -e "${CYAN}========== 操作完成 ==========${NC}"
    echo -e "${GREEN}✅ Git仓库初始化完成${NC}"
    echo -e "${GREEN}✅ 代码提交完成${NC}"
    echo -e "${GREEN}✅ 推送到GitHub完成${NC}"
    echo -e "${GREEN}✅ 功能分支创建完成${NC}"
    echo ""
    echo -e "${YELLOW}下一步操作:${NC}"
    echo "1. 访问GitHub仓库页面"
    echo "2. 创建Pull Request (使用上面提供的模板)"
    echo "3. 等待代码审查和合并"
    echo ""
    echo -e "${BLUE}项目访问方式:${NC}"
    echo "克隆: git clone $(git remote get-url origin)"
    echo "部署: ./deploy.sh"
    echo "访问: http://localhost:3000"
    echo ""
    echo -e "${GREEN}🎉 项目已成功准备好在GitHub上发布!${NC}"
}

cleanup() {
    if [ $? -ne 0 ]; then
        log_error "脚本执行失败"
        echo ""
        echo "如果遇到问题，您可以手动执行以下命令:"
        echo "git add ."
        echo "git commit -m 'Project optimization'"
        echo "git push -u origin main"
    fi
}

main() {
    show_banner
    trap cleanup EXIT
    
    check_requirements
    setup_git_config
    init_repository
    
    if prepare_commit; then
        repo_info=$(setup_github_remote)
        create_github_repo "$repo_info"
        
        if push_to_github; then
            create_branch_and_pr
            show_summary
        fi
    else
        log_info "没有需要提交的更改"
    fi
    
    trap - EXIT
}

# 检查是否在正确的目录
if [ ! -f "package.json" ] || [ ! -f "deploy.sh" ]; then
    log_error "请在项目根目录执行此脚本"
    log_info "当前目录: $(pwd)"
    log_info "请确保当前目录包含 package.json 和 deploy.sh 文件"
    exit 1
fi

# 执行主函数
main "$@"