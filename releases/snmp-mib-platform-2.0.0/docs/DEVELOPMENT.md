# 开发者指南

欢迎加入 MIB Web UI 项目！本指南将帮助您快速设置开发环境并开始贡献代码。

## 📋 目录

- [开发环境要求](#开发环境要求)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [开发工作流](#开发工作流)
- [代码规范](#代码规范)
- [测试指南](#测试指南)
- [调试技巧](#调试技巧)
- [性能优化](#性能优化)
- [常见问题](#常见问题)

## 💻 开发环境要求

### 必需软件

- **Node.js**: 18.0+ (推荐使用 LTS 版本)
- **npm**: 8.0+ 或 **yarn**: 1.22+
- **Git**: 2.30+
- **Docker**: 20.10+ (可选，用于本地服务)
- **PostgreSQL**: 13+ (或使用 Docker)
- **Redis**: 6.0+ (或使用 Docker)

### 推荐工具

- **IDE**: Visual Studio Code, WebStorm, 或 Cursor
- **浏览器**: Chrome/Edge (带开发者工具)
- **API 测试**: Postman, Insomnia, 或 REST Client
- **数据库管理**: pgAdmin, DBeaver, 或 TablePlus

### VS Code 扩展推荐

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode-remote.remote-containers"
  ]
}
```

## 🚀 快速开始

### 1. 克隆项目

```bash
# 克隆仓库
git clone https://github.com/your-organization/your-repository-name.git
cd mibweb-ui # Or your-repository-name if that's the cloned folder name

# 安装依赖
npm install
# 或
yarn install
```

### 2. 环境配置

```bash
# 复制环境变量模板
# cp .env.development.example .env.local # .env.development.example does not exist
cp .env.example .env.local # Copy .env.example to .env.local and modify it for your development setup.

# 编辑环境变量
vim .env.local
```

**基本配置示例**：

```bash
# .env.local
NODE_ENV=development
NEXT_PUBLIC_APP_NAME="MIB Web UI (Dev)"
NEXT_PUBLIC_APP_VERSION="1.0.0-dev"

# 数据库 (for local development, differs from production)
DATABASE_URL="postgresql://mibweb:password@localhost:5432/mibweb_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# 认证
JWT_SECRET="dev-jwt-secret-key-min-32-chars"
NEXTAUTH_SECRET="dev-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# API
API_BASE_URL="http://localhost:3000/api" # <!-- TODO: Clarify if API_BASE_URL for dev refers to Next.js API routes (port 3000) or a separate backend (e.g., Go backend on port 8080). -->

# 调试
DEBUG=true
LOG_LEVEL=debug
```

### 3. 启动开发服务

#### 选项 A: 使用 Docker (推荐)

```bash
# 启动数据库和 Redis
docker-compose up -d postgres redis

# 等待服务启动
sleep 10

# 运行数据库迁移
npx prisma migrate dev

# 启动开发服务器
npm run dev
```

#### 选项 B: 本地安装服务

```bash
# 确保 PostgreSQL 和 Redis 正在运行
sudo systemctl start postgresql redis-server

# 创建数据库
createdb mibweb_dev

# 运行迁移
npx prisma migrate dev

# 启动开发服务器
npm run dev
```

### 4. 验证安装

打开浏览器访问：

- **应用**: http://localhost:3000
- **API 健康检查**: http://localhost:3000/api/health
- **Storybook**: http://localhost:6006 (运行 `npm run storybook`)

## 📁 项目结构

```
mibweb-ui/
├── app/                    # Next.js 13+ App Router
│   ├── (auth)/            # 认证相关页面
│   ├── (dashboard)/       # 仪表板页面
│   ├── api/               # API 路由
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # React 组件
│   ├── ui/               # 基础 UI 组件
│   ├── forms/            # 表单组件
│   ├── charts/           # 图表组件
│   └── layout/           # 布局组件
├── lib/                  # 工具库和配置
│   ├── auth.ts           # 认证配置
│   ├── db.ts             # 数据库配置
│   ├── redis.ts          # Redis 配置
│   ├── snmp.ts           # SNMP 工具
│   └── utils.ts          # 通用工具
├── hooks/                # React Hooks
├── types/                # TypeScript 类型定义
├── styles/               # 样式文件
├── public/               # 静态资源
├── docs/                 # 项目文档
├── tests/                # 测试文件
│   ├── __mocks__/        # Mock 文件
│   ├── components/       # 组件测试
│   ├── pages/            # 页面测试
│   └── utils/            # 工具测试
├── .storybook/           # Storybook 配置
├── prisma/               # 数据库 Schema
└── scripts/              # 构建和部署脚本
```

### 关键目录说明

#### `/app` - Next.js App Router

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx      # 登录页面
│   └── register/
│       └── page.tsx      # 注册页面
├── (dashboard)/
│   ├── devices/
│   │   ├── page.tsx      # 设备列表
│   │   └── [id]/
│   │       └── page.tsx  # 设备详情
│   ├── monitoring/
│   │   └── page.tsx      # 监控页面
│   └── layout.tsx        # 仪表板布局
└── api/
    ├── auth/
    ├── devices/
    ├── snmp/
    └── health/
```

#### `/components` - 组件库

```
components/
├── ui/                   # 基础组件 (shadcn/ui)
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   └── ...
├── forms/                # 表单组件
│   ├── device-form.tsx
│   ├── login-form.tsx
│   └── ...
├── charts/               # 图表组件
│   ├── line-chart.tsx
│   ├── bar-chart.tsx
│   └── ...
└── layout/               # 布局组件
    ├── header.tsx
    ├── sidebar.tsx
    └── ...
```

## 🔄 开发工作流

### Git 工作流

我们使用 **Git Flow** 分支策略：

```bash
# 1. 从 develop 分支创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# 2. 开发功能
# ... 编写代码 ...

# 3. 提交代码
git add .
git commit -m "feat: add new feature description"

# 4. 推送分支
git push origin feature/your-feature-name

# 5. 创建 Pull Request
# 在 GitHub 上创建 PR，目标分支为 develop
```

### 提交信息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
# 格式
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]

# 示例
feat(auth): add JWT token refresh mechanism
fix(snmp): resolve connection timeout issue
docs(api): update authentication documentation
style(ui): improve button component styling
refactor(db): optimize database query performance
test(components): add unit tests for device form
chore(deps): update dependencies to latest versions
```

**类型说明**：

- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更新
- `style`: 代码格式化（不影响功能）
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `perf`: 性能优化
- `ci`: CI/CD 相关

### 代码审查流程

1. **自检清单**：
   - [ ] 代码符合项目规范
   - [ ] 添加了必要的测试
   - [ ] 更新了相关文档
   - [ ] 通过了所有测试
   - [ ] 没有 console.log 等调试代码

2. **PR 模板**：

```markdown
## 变更描述

简要描述此 PR 的变更内容。

## 变更类型

- [ ] 新功能
- [ ] 错误修复
- [ ] 文档更新
- [ ] 性能优化
- [ ] 代码重构
- [ ] 其他

## 测试

- [ ] 单元测试
- [ ] 集成测试
- [ ] 手动测试

## 截图（如适用）

## 检查清单

- [ ] 代码遵循项目规范
- [ ] 自测通过
- [ ] 添加了测试
- [ ] 更新了文档
```

## 📝 代码规范

### TypeScript 规范

```typescript
// ✅ 好的示例
interface DeviceConfig {
  id: string;
  name: string;
  host: string;
  port?: number;
  snmpVersion: '1' | '2c' | '3';
  community?: string;
  timeout?: number;
}

const createDevice = async (config: DeviceConfig): Promise<Device> => {
  // 实现逻辑
};

// ❌ 避免的写法
const createDevice = async (config: any) => {
  // 缺少类型定义
};
```

### React 组件规范

```tsx
// ✅ 好的组件示例
import { FC, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className,
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        {
          'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
          'border border-gray-300 bg-transparent hover:bg-gray-50': variant === 'outline',
        },
        {
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4': size === 'md',
          'h-12 px-6 text-lg': size === 'lg',
        },
        {
          'opacity-50 cursor-not-allowed': disabled,
        },
        className
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

### API 路由规范

```typescript
// app/api/devices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const CreateDeviceSchema = z.object({
  name: z.string().min(1).max(100),
  host: z.string().ip(),
  type: z.enum(['router', 'switch', 'server']),
  snmpConfig: z.object({
    version: z.enum(['1', '2c', '3']),
    community: z.string().optional(),
    port: z.number().min(1).max(65535).default(161),
  }),
});

export async function POST(request: NextRequest) {
  try {
    // 认证检查
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 数据验证
    const body = await request.json();
    const validatedData = CreateDeviceSchema.parse(body);

    // 业务逻辑
    const device = await db.device.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: device,
      message: 'Device created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(e => e.message),
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    console.error('Device creation error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
```

### CSS/Tailwind 规范

```tsx
// ✅ 好的样式组织
const Card = ({ children, className }: CardProps) => {
  return (
    <div
      className={cn(
        // 基础样式
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        // 响应式
        'w-full max-w-md mx-auto',
        // 状态样式
        'hover:shadow-md transition-shadow',
        // 自定义样式
        className
      )}
    >
      {children}
    </div>
  );
};

// ❌ 避免内联大量样式
<div className="w-full max-w-md mx-auto rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow duration-200 p-6 space-y-4">
```

## 🧪 测试指南

### 测试策略

我们采用测试金字塔策略：

1. **单元测试** (70%): 测试单个函数和组件
2. **集成测试** (20%): 测试组件间交互
3. **端到端测试** (10%): 测试完整用户流程

### 单元测试

```typescript
// tests/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies correct variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByText('Secondary');
    expect(button).toHaveClass('bg-gray-200');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByText('Disabled');
    expect(button).toBeDisabled();
  });
});
```

### API 测试

```typescript
// tests/api/devices.test.ts
import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/devices/route';
import { prismaMock } from '../__mocks__/prisma';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(() => Promise.resolve({ user: { id: 'user-1' } })),
}));

describe('/api/devices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a device successfully', async () => {
    const deviceData = {
      name: 'Test Router',
      host: '192.168.1.1',
      type: 'router',
      snmpConfig: {
        version: '2c',
        community: 'public',
      },
    };

    prismaMock.device.create.mockResolvedValue({
      id: 'device-1',
      ...deviceData,
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { req } = createMocks({
      method: 'POST',
      body: deviceData,
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('Test Router');
  });

  it('returns validation error for invalid data', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: { name: '' }, // 无效数据
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Validation failed');
  });
});
```

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test Button.test.tsx

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch

# 运行 E2E 测试
npm run test:e2e
```

## 🐛 调试技巧

### 1. 浏览器调试

```typescript
// 使用 debugger 语句
const handleSubmit = (data: FormData) => {
  debugger; // 浏览器会在此处暂停
  console.log('Form data:', data);
};

// 使用 console 方法
console.log('Debug info:', data);
console.table(arrayData);
console.group('API Call');
console.log('Request:', request);
console.log('Response:', response);
console.groupEnd();
```

### 2. VS Code 调试配置

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### 3. 网络调试

```typescript
// lib/api-client.ts
const apiClient = axios.create({
  baseURL: process.env.API_BASE_URL,
  timeout: 10000,
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', config);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response);
    return response;
  },
  (error) => {
    console.error('Response Error:', error);
    return Promise.reject(error);
  }
);
```

### 4. 数据库调试

```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// 查询调试
const devices = await prisma.device.findMany({
  where: { userId: 'user-1' },
  include: { user: true },
});

console.log('Query result:', devices);
```

## ⚡ 性能优化

### 1. React 性能优化

```typescript
// 使用 React.memo 优化组件重渲染
import { memo } from 'react';

const DeviceCard = memo(({ device }: { device: Device }) => {
  return (
    <div className="p-4 border rounded">
      <h3>{device.name}</h3>
      <p>{device.host}</p>
    </div>
  );
});

// 使用 useMemo 优化计算
const ExpensiveComponent = ({ data }: { data: any[] }) => {
  const processedData = useMemo(() => {
    return data.map(item => {
      // 复杂计算
      return processItem(item);
    });
  }, [data]);

  return <div>{/* 渲染 processedData */}</div>;
};

// 使用 useCallback 优化函数引用
const ParentComponent = () => {
  const [count, setCount] = useState(0);
  
  const handleClick = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  return <ChildComponent onClick={handleClick} />;
};
```

### 2. Next.js 性能优化

```typescript
// 动态导入组件
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false, // 禁用服务端渲染
});

// 图片优化
import Image from 'next/image';

const OptimizedImage = () => {
  return (
    <Image
      src="/device-image.jpg"
      alt="Device"
      width={300}
      height={200}
      priority // 优先加载
      placeholder="blur" // 模糊占位符
      blurDataURL="data:image/jpeg;base64,..." // 占位符数据
    />
  );
};

// 字体优化
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});
```

### 3. 数据库性能优化

```typescript
// 使用索引
model Device {
  id       String @id @default(cuid())
  host     String @unique // 添加唯一索引
  userId   String
  status   String
  
  user User @relation(fields: [userId], references: [id])
  
  @@index([userId, status]) // 复合索引
  @@index([host]) // 单字段索引
}

// 优化查询
const getDevices = async (userId: string, status?: string) => {
  return await prisma.device.findMany({
    where: {
      userId,
      ...(status && { status }),
    },
    select: {
      id: true,
      name: true,
      host: true,
      status: true,
      // 只选择需要的字段
    },
    take: 20, // 限制结果数量
    orderBy: {
      updatedAt: 'desc',
    },
  });
};
```

## ❓ 常见问题

### Q: 如何添加新的 API 端点？

**A**: 在 `app/api/` 目录下创建新的路由文件：

```typescript
// app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Hello from my endpoint' });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // 处理 POST 请求
  return NextResponse.json({ received: body });
}
```

### Q: 如何添加新的数据库表？

**A**: 修改 Prisma schema 并运行迁移：

```prisma
// prisma/schema.prisma
model NewTable {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

```bash
# 生成迁移
npx prisma migrate dev --name add-new-table

# 生成客户端
npx prisma generate
```

### Q: 如何处理环境变量？

**A**: 在 `.env.local` 中添加变量，在代码中使用：

```typescript
// 服务端
const apiKey = process.env.API_KEY;

// 客户端（需要 NEXT_PUBLIC_ 前缀）
const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
```

### Q: 如何添加新的 UI 组件？

**A**: 使用 shadcn/ui 或创建自定义组件：

```bash
# 添加 shadcn/ui 组件
npx shadcn-ui@latest add button

# 或创建自定义组件
mkdir -p components/custom
touch components/custom/my-component.tsx
```

### Q: 如何调试 SNMP 连接问题？

**A**: 使用调试工具和日志：

```typescript
// lib/snmp.ts
import { createLogger } from './logger';

const logger = createLogger('snmp');

export const querySnmp = async (config: SnmpConfig) => {
  logger.debug('SNMP query started', { host: config.host, oids: config.oids });
  
  try {
    const result = await snmp.get(config);
    logger.debug('SNMP query successful', { result });
    return result;
  } catch (error) {
    logger.error('SNMP query failed', { error, config });
    throw error;
  }
};
```

### Q: 如何优化构建大小？

**A**: 使用 Bundle Analyzer 分析并优化：

```bash
# 安装分析工具
npm install --save-dev @next/bundle-analyzer

# 分析构建
ANALYZE=true npm run build
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // 其他配置
});
```

## 📚 学习资源

### 官方文档

- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev)
- [TypeScript 文档](https://www.typescriptlang.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Prisma 文档](https://www.prisma.io/docs)

### 推荐教程

- [Next.js 13 App Router 教程](https://nextjs.org/learn)
- [React Testing Library 教程](https://testing-library.com/docs/react-testing-library/intro)
- [TypeScript 深入理解](https://www.typescriptlang.org/docs/handbook/intro.html)

### 社区资源

- [Next.js GitHub](https://github.com/vercel/next.js)
- [React GitHub](https://github.com/facebook/react)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/next.js)

---

## 🤝 获得帮助

如果您在开发过程中遇到问题：

1. 查看本文档的相关部分
2. 搜索 [GitHub Issues](https://github.com/your-organization/your-repository-name/issues) <!-- Adjusted placeholder -->
3. 在团队 Slack 频道提问
4. 联系项目维护者

欢迎为项目做出贡献！🎉