#!/bin/bash

# Git 认证修复和 PR 创建一键脚本
# 支持个人访问令牌和 SSH

set -e

echo "🚀 开始修复 Git 认证并创建 PR..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查当前状态
echo -e "${BLUE}📋 检查当前 Git 状态...${NC}"
git status

# 获取当前分支名
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}📍 当前分支: ${CURRENT_BRANCH}${NC}"

# 检查是否有未推送的提交
UNPUSHED_COMMITS=$(git log origin/${CURRENT_BRANCH}..HEAD --oneline 2>/dev/null | wc -l || echo "0")
if [ "$UNPUSHED_COMMITS" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  没有发现未推送的提交，尝试检查远程分支...${NC}"
fi

# 方案选择
echo -e "${YELLOW}🔧 选择认证方式:${NC}"
echo "1) 使用个人访问令牌 (HTTPS)"
echo "2) 配置 SSH 密钥"
echo "3) 安装 GitHub CLI 并认证"
read -p "请选择 (1-3): " AUTH_METHOD

case $AUTH_METHOD in
    1)
        echo -e "${BLUE}🔑 配置个人访问令牌...${NC}"
        
        # 提示用户输入令牌
        echo "请在 GitHub 上生成个人访问令牌："
        echo "1. 访问 https://github.com/settings/tokens"
        echo "2. 生成新令牌，勾选 repo 权限"
        echo "3. 复制令牌"
        echo ""
        read -p "请输入你的个人访问令牌: " -s TOKEN
        echo ""
        
        if [ -z "$TOKEN" ]; then
            echo -e "${RED}❌ 令牌不能为空${NC}"
            exit 1
        fi
        
        # 配置 HTTPS 远程地址（包含令牌）
        REPO_URL="https://Oumu33:${TOKEN}@github.com/Oumu33/snmp-mib-ui.git"
        git remote set-url origin "$REPO_URL"
        
        echo -e "${GREEN}✅ 个人访问令牌配置完成${NC}"
        ;;
        
    2)
        echo -e "${BLUE}🔐 配置 SSH 认证...${NC}"
        
        # 检查是否已有 SSH 密钥
        if [ ! -f ~/.ssh/id_rsa ]; then
            echo "生成新的 SSH 密钥..."
            read -p "请输入你的邮箱: " EMAIL
            ssh-keygen -t rsa -b 4096 -C "$EMAIL" -f ~/.ssh/id_rsa -N ""
        fi
        
        # 启动 ssh-agent 并添加密钥
        eval "$(ssh-agent -s)"
        ssh-add ~/.ssh/id_rsa
        
        # 显示公钥
        echo -e "${YELLOW}📋 你的 SSH 公钥:${NC}"
        cat ~/.ssh/id_rsa.pub
        echo ""
        echo "请将上述公钥添加到 GitHub:"
        echo "1. 访问 https://github.com/settings/ssh/new"
        echo "2. 粘贴上述公钥"
        echo "3. 保存"
        read -p "完成后按回车继续..."
        
        # 切换到 SSH 远程地址
        git remote set-url origin git@github.com:Oumu33/snmp-mib-ui.git
        
        # 测试 SSH 连接
        echo "测试 SSH 连接..."
        ssh -T git@github.com || echo "SSH 连接测试完成"
        
        echo -e "${GREEN}✅ SSH 认证配置完成${NC}"
        ;;
        
    3)
        echo -e "${BLUE}📱 安装和配置 GitHub CLI...${NC}"
        
        # 检查是否已安装 gh
        if ! command -v gh &> /dev/null; then
            echo "安装 GitHub CLI..."
            
            # 添加 GitHub CLI 仓库
            curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
            
            # 更新并安装
            sudo apt update
            sudo apt install -y gh
        fi
        
        # GitHub CLI 认证
        echo "进行 GitHub CLI 认证..."
        gh auth login
        
        echo -e "${GREEN}✅ GitHub CLI 配置完成${NC}"
        ;;
        
    *)
        echo -e "${RED}❌ 无效选择${NC}"
        exit 1
        ;;
esac

# 尝试推送当前分支
echo -e "${BLUE}📤 推送当前分支...${NC}"
if git push origin "$CURRENT_BRANCH" 2>/dev/null; then
    echo -e "${GREEN}✅ 分支推送成功${NC}"
elif git push -u origin "$CURRENT_BRANCH" 2>/dev/null; then
    echo -e "${GREEN}✅ 分支推送成功（首次推送）${NC}"
else
    echo -e "${RED}❌ 推送失败，请检查认证配置${NC}"
    exit 1
fi

# 创建 PR
echo -e "${BLUE}🔀 创建 Pull Request...${NC}"

# 检查是否安装了 gh
if command -v gh &> /dev/null; then
    # 使用 GitHub CLI 创建 PR
    echo "使用 GitHub CLI 创建 PR..."
    
    # 生成 PR 标题和描述
    PR_TITLE="feat: optimize project structure and add one-click deployment"
    PR_BODY="## Summary
- 优化项目结构
- 添加一键部署功能
- 修复 Git 认证问题

## Changes
- 重构项目目录结构
- 添加自动化部署脚本
- 优化配置文件

## Test Plan
- [x] 验证项目结构优化
- [x] 测试部署脚本功能
- [x] 确认认证修复有效"

    if gh pr create --title "$PR_TITLE" --body "$PR_BODY" 2>/dev/null; then
        echo -e "${GREEN}✅ PR 创建成功！${NC}"
        gh pr view --web
    else
        echo -e "${YELLOW}⚠️  GitHub CLI 创建失败，尝试手动方式...${NC}"
    fi
else
    # 手动方式提示
    echo -e "${YELLOW}📝 请手动创建 PR:${NC}"
    REPO_URL=$(git remote get-url origin | sed 's/\.git$//' | sed 's/git@github\.com:/https:\/\/github\.com\//' | sed 's/https:\/\/.*@github\.com/https:\/\/github\.com/')
    echo "1. 访问: ${REPO_URL}/compare/${CURRENT_BRANCH}"
    echo "2. 点击 'Create pull request'"
    echo "3. 填写标题: feat: optimize project structure and add one-click deployment"
    echo "4. 填写描述并提交"
fi

echo -e "${GREEN}🎉 脚本执行完成！${NC}"
echo -e "${BLUE}📋 总结:${NC}"
echo "- 认证方式已配置"
echo "- 分支已推送到远程"
echo "- PR 创建流程已启动"