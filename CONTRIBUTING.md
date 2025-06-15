# 贡献指南

感谢您对 MIB Web UI 项目的关注！我们欢迎所有形式的贡献，包括但不限于：

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复
- ✨ 开发新功能

## 📋 开始之前

### 行为准则

参与本项目即表示您同意遵守我们的行为准则：

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 专注于对社区最有利的事情
- 对其他社区成员表现出同理心

### 开发环境要求

- Node.js 18.17+ 或 20.5+
- npm 9+ 或 yarn 1.22+
- Git 2.25+
- Docker 20.10+ (可选，用于容器化测试)

## 🚀 快速开始

### 1. Fork 和克隆项目

```bash
# Fork 项目到您的 GitHub 账户
# 然后克隆您的 fork
git clone https://github.com/YOUR_USERNAME/your-repository-name.git
cd your-repository-name # Or mibweb-ui if that's the consistent local name

# 添加上游仓库
git remote add upstream https://github.com/original-organization/original-repository-name.git
```

### 2. 安装依赖

```bash
npm install
# 或
yarn install
```

### 3. 配置开发环境

```bash
# 复制环境变量模板
# cp .env.development.example .env.local # .env.development.example does not exist
cp .env.example .env.local # Copy .env.example to .env.local and modify it for your development setup.

# 编辑 .env.local 文件，配置必要的环境变量
```

### 4. 启动开发服务器

```bash
npm run dev
# 或
yarn dev
```

## 🔄 开发流程

### 分支策略

我们使用 Git Flow 分支模型：

- `main`: 生产分支，包含稳定的发布版本
- `develop`: 开发分支，包含最新的开发功能
- `feature/*`: 功能分支，用于开发新功能
- `bugfix/*`: 修复分支，用于修复 bug
- `hotfix/*`: 热修复分支，用于紧急修复生产问题

### 创建功能分支

```bash
# 确保您在最新的 develop 分支
git checkout develop
git pull upstream develop

# 创建新的功能分支
git checkout -b feature/your-feature-name
```

### 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
type(scope): description

[optional body]

[optional footer]
```

#### 类型 (type)

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式化（不影响代码逻辑）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `ci`: CI/CD 相关

#### 范围 (scope)

- `ui`: UI 组件
- `api`: API 相关
- `auth`: 认证相关
- `snmp`: SNMP 功能
- `monitoring`: 监控功能
- `security`: 安全相关
- `docs`: 文档
- `config`: 配置

#### 示例

```bash
git commit -m "feat(snmp): add device discovery functionality"
git commit -m "fix(ui): resolve responsive layout issue on mobile"
git commit -m "docs(api): update API documentation for health endpoint"
```

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

### 测试要求

- 新功能必须包含相应的单元测试
- 测试覆盖率应保持在 80% 以上
- 所有测试必须通过才能合并

### 编写测试

```typescript
// 示例：组件测试
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Updated Text')).toBeInTheDocument();
  });
});
```

## 📝 代码规范

### TypeScript

- 使用严格的 TypeScript 配置
- 为所有函数和组件提供类型注解
- 避免使用 `any` 类型
- 使用接口定义复杂对象类型

```typescript
// 好的示例
interface UserData {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

const fetchUser = async (id: string): Promise<UserData> => {
  // 实现
};

// 避免
const fetchUser = async (id: any): Promise<any> => {
  // 实现
};
```

### React 组件

- 使用函数组件和 Hooks
- 组件名使用 PascalCase
- 文件名使用 kebab-case
- 使用 TypeScript 接口定义 Props

```typescript
// components/user-profile.tsx
interface UserProfileProps {
  user: UserData;
  onEdit: (user: UserData) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onEdit }) => {
  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <button onClick={() => onEdit(user)}>Edit</button>
    </div>
  );
};
```

### CSS 和样式

- 使用 Tailwind CSS 进行样式设计
- 避免内联样式，除非必要
- 使用语义化的类名
- 遵循响应式设计原则

```tsx
// 好的示例
<div className="flex flex-col space-y-4 p-6 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-semibold text-gray-800">Title</h2>
  <p className="text-gray-600">Description</p>
</div>
```

### API 设计

- 使用 RESTful API 设计原则
- 统一的响应格式
- 适当的 HTTP 状态码
- 完整的错误处理

```typescript
// 统一的 API 响应格式
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  timestamp: string;
  errors?: string[];
}

// API 路由示例
export async function GET(request: Request) {
  try {
    const data = await fetchData();
    
    return NextResponse.json({
      success: true,
      data,
      message: 'Data fetched successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch data',
      timestamp: new Date().toISOString(),
      errors: [error.message]
    }, { status: 500 });
  }
}
```

## 🔍 代码审查

### 提交 Pull Request

1. **确保代码质量**
   ```bash
   # 运行代码检查
   npm run lint
   npm run type-check
   npm run test
   ```

2. **创建 Pull Request**
   - 使用清晰的标题和描述
   - 引用相关的 Issue
   - 包含测试截图（如果适用）
   - 列出重大变更

3. **PR 模板**
   ```markdown
   ## 变更类型
   - [ ] Bug 修复
   - [ ] 新功能
   - [ ] 重大变更
   - [ ] 文档更新
   
   ## 描述
   简要描述此 PR 的变更内容
   
   ## 相关 Issue
   Fixes #(issue number)
   
   ## 测试
   - [ ] 单元测试通过
   - [ ] 集成测试通过
   - [ ] 手动测试完成
   
   ## 截图
   （如果适用）
   
   ## 检查清单
   - [ ] 代码遵循项目规范
   - [ ] 自我审查完成
   - [ ] 添加了必要的注释
   - [ ] 更新了相关文档
   ```

### 审查标准

- **功能性**: 代码是否按预期工作？
- **可读性**: 代码是否清晰易懂？
- **性能**: 是否有性能问题？
- **安全性**: 是否存在安全漏洞？
- **测试**: 是否有足够的测试覆盖？
- **文档**: 是否需要更新文档？

## 📚 文档贡献

### 文档类型

- **API 文档**: 描述 API 端点和使用方法
- **用户指南**: 面向最终用户的使用说明
- **开发者文档**: 面向开发者的技术文档
- **部署指南**: 部署和运维相关文档

### 文档规范

- 使用 Markdown 格式
- 包含代码示例
- 提供清晰的步骤说明
- 保持文档与代码同步

## 🐛 报告 Bug

### Bug 报告模板

```markdown
**Bug 描述**
简要描述 bug 的现象

**复现步骤**
1. 进入 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

**期望行为**
描述您期望发生的行为

**实际行为**
描述实际发生的行为

**截图**
如果适用，添加截图来帮助解释问题

**环境信息**
- OS: [e.g. macOS 12.0]
- Browser: [e.g. Chrome 95.0]
- Node.js: [e.g. 18.17.0]
- 项目版本: [e.g. 1.0.0]

**附加信息**
添加任何其他相关信息
```

## 💡 功能建议

### 功能请求模板

```markdown
**功能描述**
简要描述您希望添加的功能

**问题背景**
描述这个功能要解决的问题

**解决方案**
描述您希望的解决方案

**替代方案**
描述您考虑过的其他解决方案

**附加信息**
添加任何其他相关信息或截图
```

## 🏷️ 发布流程

### 版本号规范

我们使用 [Semantic Versioning](https://semver.org/)：

- `MAJOR.MINOR.PATCH`
- `MAJOR`: 不兼容的 API 变更
- `MINOR`: 向后兼容的功能新增
- `PATCH`: 向后兼容的问题修正

### 发布检查清单

- [ ] 所有测试通过
- [ ] 文档已更新
- [ ] CHANGELOG 已更新
- [ ] 版本号已更新
- [ ] 创建 Git 标签
- [ ] 发布到 npm（如果适用）

## 🤝 社区

### 获取帮助

- 📧 邮箱: project-support@example.com <!-- Generic placeholder -->
- 💬 讨论: [GitHub Discussions](https://github.com/your-organization/your-repository-name/discussions) <!-- Adjusted placeholder -->
- 🐛 问题: [GitHub Issues](https://github.com/your-organization/your-repository-name/issues) <!-- Adjusted placeholder -->

### 贡献者

感谢所有为项目做出贡献的开发者！

<!-- 这里可以添加贡献者列表 -->

## 📄 许可证

通过贡献代码，您同意您的贡献将在 [MIT License](LICENSE) 下授权。

---

再次感谢您的贡献！🎉