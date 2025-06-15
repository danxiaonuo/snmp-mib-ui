# GitHub 上传指南

## 🚀 自动化上传（推荐）

我已经为您创建了一个自动化脚本，只需运行：

```bash
./github-setup.sh
```

## 📋 脚本功能

该脚本会自动帮您：
1. ✅ 检查系统要求（Git、curl等）
2. ✅ 设置Git配置（用户名、邮箱）
3. ✅ 初始化Git仓库
4. ✅ 添加并提交所有文件
5. ✅ 设置GitHub远程仓库
6. ✅ 推送代码到GitHub
7. ✅ 创建功能分支用于PR
8. ✅ 提供PR创建指导

## 🔧 手动步骤（备选）

如果自动化脚本遇到问题，您可以手动执行：

### 1. 初始化Git仓库
```bash
cd /etc/opt/snmp-mib-ui-main
git init
git add .
git commit -m "feat: optimize project structure and add one-click deployment"
```

### 2. 在GitHub创建仓库
1. 访问 https://github.com/new
2. 仓库名称：`snmp-mib-platform`
3. 描述：`Modern SNMP MIB management and network monitoring platform`
4. 设置为Public
5. 点击"Create repository"

### 3. 推送到GitHub
```bash
# 替换为您的实际用户名和仓库名
git remote add origin https://github.com/YOUR_USERNAME/snmp-mib-platform.git
git branch -M main
git push -u origin main
```

### 4. 创建PR
```bash
git checkout -b feature/project-optimization
git push -u origin feature/project-optimization
```

## 🔑 认证说明

推送时需要GitHub认证：
- **用户名**：您的GitHub用户名
- **密码**：使用Personal Access Token（不是GitHub密码）

### 创建Personal Access Token
1. 访问 GitHub Settings → Developer settings → Personal access tokens
2. 点击"Generate new token"
3. 选择权限：`repo`（完整仓库访问权限）
4. 生成并复制Token

## 📝 PR信息模板

**PR标题：**
```
feat: Project optimization and one-click deployment solution
```

**PR描述：**
```markdown
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
```

## ⚠️ 注意事项

1. **安全提醒**：不要在脚本中硬编码个人访问令牌
2. **分支策略**：建议使用功能分支进行开发
3. **代码审查**：大型更改建议通过PR进行代码审查
4. **备份**：推送前确保本地有代码备份

## 🆘 常见问题

### Q1: 推送失败，提示认证错误
**解决方案**：确保使用Personal Access Token而不是GitHub密码

### Q2: 仓库已存在
**解决方案**：删除现有仓库或使用不同的仓库名称

### Q3: Git配置问题
**解决方案**：
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Q4: 网络连接问题
**解决方案**：检查网络连接，或使用代理设置

## 📞 获取帮助

如果遇到问题：
1. 查看脚本输出的详细错误信息
2. 检查GitHub仓库权限设置
3. 验证网络连接状态
4. 确认Git配置正确

---

**开始上传：直接运行 `./github-setup.sh`**