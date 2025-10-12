# AI 开发指南 (AI Development Guide)

> 🤖 **专为AI开发设计**: 本文档专门为AI助手在项目开发和设计时提供技术规范和代码模板
> 
> 🎯 **核心原则**: 严格遵循技术栈规范，确保代码质量和架构一致性

## 📋 快速导航

- [1. 核心技术栈规范](#1-核心技术栈规范)
- [2. 安全架构设计原则](#2-安全架构设计原则)
- [3. 项目结构规范](#3-项目结构规范)
- [4. 核心代码实现模板](#4-核心代码实现模板)
- [5. 开发策略与最佳实践](#5-开发策略与最佳实践)
- [6. AI协助请求格式](#6-ai协助请求格式)

---

## 1. 核心技术栈规范

> ⚠️ **严格遵守**: 所有代码生成必须严格遵循以下技术栈规范
> 
> 🔧 **可选组件**: 标记为"可选"的组件可根据项目需求灵活选择

### 1.1 必需技术栈

- **应用框架**: **Next.js 15+**
  - 严格使用 **App Router** (`/src/app` 目录结构)
  - 默认使用 **React Server Components (RSC)**
  - 仅在需要交互性时使用 `'use client'`
  - 优先使用 **Server Actions** 处理表单和数据变更

- **认证**: **NextAuth.js**
  - 与中间件集成，提供用户身份信息

- **UI & 样式**:
  - **组件库**: **shadcn/ui** (安装到 `/src/components/ui`)
  - **CSS框架**: **Tailwind CSS** (原子化CSS类)
  - 避免使用原生CSS文件，除全局样式 (`/src/app/globals.css`)

- **AI 核心**: **Vercel AI SDK**
  - 使用 React Hooks (`useChat`, `useCompletion`) 实现流式响应
  - 在 Server Actions/Route Handlers 中调用核心函数

- **数据库**: **PostgreSQL + pgvector**
  - 必须启用 `pgvector` 扩展支持向量搜索
  - 启用行级安全 (RLS) 确保数据访问权限

- **ORM**: **Prisma**
  - 唯一数据源: `/prisma/schema.prisma`
  - 工作流: 修改schema → `npx prisma generate` → `npx prisma migrate dev`
  - 单例客户端: `/src/lib/prisma.ts`

- **静态文件**: **阿里云 OSS (S3兼容)**
  - 使用预签名URL实现安全上传
  - 数据库仅存储文件key/URL

### 1.2 可选技术栈

- **缓存**: **Redis** 🔧 可选
  - 高性能缓存层，预留"即插即用"逻辑
  - 项目初期可不配置

### 1.3 开发规范

- **语言**: **TypeScript** (启用 `strict` 模式)
- **🚫 严禁使用 `any` 类型**
- 遵循 ESLint 和 Prettier 配置

## 2. 安全架构设计原则

### 2.1 核心目标

- **极致安全**: 数据访问权限在数据库层面强制执行 (RLS)
- **关注点分离**: API路由 → 服务层 → 数据层
- **性能就绪**: 为缓存预留位置，无需重构即可优化
- **开发体验**: 业务代码简洁直观

### 2.2 请求生命周期

```
1. Next.js Middleware → 解析用户身份，注入 AsyncLocalStorage
2. API路由/Server Component → 调用服务层函数
3. 服务层 → 封装业务逻辑，决定数据来源 (数据库/缓存)
4. Prisma Client Extension → 设置 PostgreSQL 会话变量
5. PostgreSQL RLS → 根据策略过滤数据
6. 返回安全数据
```

## 3. 项目结构规范

```
/
├── prisma/
│   └── schema.prisma      # 数据库模型定义
├── public/                # 静态资源
└── src/
    ├── app/                 # Next.js 路由和页面
    │   ├── api/             # API Route Handlers
    │   └── (routes)/...     # 页面组件
    ├── components/
    │   ├── ui/              # shadcn/ui 官方组件
    │   └── shared/          # 项目自定义组件
    ├── services/            # 业务逻辑服务层
    │   └── *.ts             # 各种业务服务
    └── lib/
        ├── prisma.ts        # Prisma Client 单例 (带安全扩展)
        ├── context.ts       # 请求上下文管理
        ├── redis.ts         # Redis 客户端 (预留)
        ├── ai.ts            # AI SDK 配置
        ├── oss.ts           # OSS/S3 客户端
        └── utils.ts         # 通用工具函数
```

## 4. 核心代码实现模板

### 4.1 PostgreSQL 安全规则

```sql
-- 启用 RLS
ALTER TABLE "public"."Post" ENABLE ROW LEVEL SECURITY;

-- 创建安全策略
CREATE POLICY "user_can_manage_own_posts"
ON "public"."Post" FOR ALL
USING ("authorId"::text = current_setting('app.current_user_id', true))
WITH CHECK ("authorId"::text = current_setting('app.current_user_id', true));
```

### 4.2 请求上下文管理 (`lib/context.ts`)

```typescript
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  userId: string;
}

export const requestContextStore = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext {
  const context = requestContextStore.getStore();
  if (!context) {
    throw new Error('请求上下文未找到。请确保请求已被中间件处理。');
  }
  return context;
}
```

### 4.3 增强的 Prisma Client (`lib/prisma.ts`)

```typescript
import { PrismaClient } from '@prisma/client';
import { getRequestContext } from './context';

const prismaClientSingleton = () => {
  return new PrismaClient().$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          try {
            const { userId } = getRequestContext();
            const [_, result] = await prisma.$transaction([
              prisma.$executeRawUnsafe(`SET app.current_user_id = '${userId}'`),
              query(args),
            ]);
            return result;
          } catch (error) {
            // 无上下文时直接执行查询，让RLS策略处理
            return query(args);
          }
        },
      },
    },
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}
```

### 4.4 中间件配置 (`middleware.ts`)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { requestContextStore } from '@/lib/context';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const userId = token?.sub;

  if (userId) {
    return await requestContextStore.run({ userId }, () => {
      return NextResponse.next();
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
};
```

### 4.5 Redis 客户端预留 (`lib/redis.ts`)

```typescript
import Redis from 'ioredis';

const redisClientSingleton = () => {
  if (process.env.REDIS_URL) {
    console.log('正在初始化 Redis 客户端...');
    return new Redis(process.env.REDIS_URL);
  }
  console.warn('未找到 REDIS_URL，Redis 客户端未初始化。');
  return null;
};

declare global {
  var redis: undefined | Redis | null;
}

export const redis = globalThis.redis ?? redisClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.redis = redis;
}
```

### 4.6 服务层模板 (`services/postService.ts`)

```typescript
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { getRequestContext } from '@/lib/context';
import type { Post } from '@prisma/client';

/**
 * 获取当前用户的帖子列表
 */
export async function getPostsForCurrentUser(): Promise<Post[]> {
  const { userId } = getRequestContext();
  const cacheKey = `user:${userId}:posts`;

  // --- 缓存逻辑预留位置 ---
  // if (redis) {
  //   try {
  //     const cachedData = await redis.get(cacheKey);
  //     if (cachedData) return JSON.parse(cachedData);
  //   } catch (e) { console.error('Redis读取错误:', e); }
  // }
  
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // --- 缓存写入预留位置 ---
  // if (redis) {
  //   try {
  //     await redis.set(cacheKey, JSON.stringify(posts), 'EX', 120);
  //   } catch (e) { console.error('Redis写入错误:', e); }
  // }

  return posts;
}

/**
 * 为当前用户创建新帖子
 */
export async function createPostForCurrentUser(data: { title: string; content?: string }): Promise<Post> {
  const { userId } = getRequestContext();

  const newPost = await prisma.post.create({
    data: {
      ...data,
      authorId: userId,
    },
  });

  // --- 缓存失效逻辑预留位置 ---
  const cacheKey = `user:${userId}:posts`;
  // if (redis) {
  //   try {
  //     await redis.del(cacheKey);
  //   } catch (e) { console.error('Redis缓存失效错误:', e); }
  // }

  return newPost;
}
```

### 4.7 API 路由模板 (`app/api/my-posts/route.ts`)

```typescript
import { getPostsForCurrentUser, createPostForCurrentUser } from '@/services/postService';
import { NextResponse } from 'next/server';

// 获取帖子列表
export async function GET() {
  try {
    const posts = await getPostsForCurrentUser();
    return NextResponse.json(posts);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: '获取帖子失败' }, { status: 500 });
  }
}

// 创建新帖子
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title) {
        return NextResponse.json({ message: '标题不能为空' }, { status: 400 });
    }
    const newPost = await createPostForCurrentUser({ title: body.title, content: body.content });
    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: '创建帖子失败' }, { status: 500 });
  }
}
```

## 5. 开发策略与最佳实践

### 5.1 架构优势

- **清晰边界**: 每个模块职责单一
- **高度可维护**: 业务逻辑集中在服务层
- **即插即用性能**: 缓存逻辑预留，无需重构
- **数据安全**: PostgreSQL RLS 在数据库层强制执行安全策略

### 5.2 开发原则

1. **API路由**: 只处理HTTP层事务，不含业务逻辑
2. **服务层**: 封装所有业务逻辑和数据访问策略
3. **数据层**: 负责数据持久化和安全过滤
4. **组件**: 优先使用 Server Components，必要时才用 Client Components

### 5.3 性能优化策略

- 服务层预留缓存逻辑位置
- 取消注释即可启用 Redis 缓存
- 无需修改其他代码，低风险优化

## 6. AI协助请求格式

当请求AI协助时，请提供以下信息：

- **目标 (Goal)**: 简要说明想实现的功能
- **上下文 (Context)**: 说明功能所在的具体文件或组件路径
- **数据模型 (Data Models)**: 指出需要参考的 `prisma.schema` 中的模型
- **具体请求 (Request)**: 详细说明需要生成的代码片段、函数或组件

### 示例请求格式

```
目标: 实现用户帖子的CRUD操作
上下文: /src/app/api/posts 和 /src/services/postService.ts
数据模型: Post, User (来自 prisma.schema)
具体请求: 生成完整的帖子服务层函数和对应的API路由
```

---

> 📝 **重要提醒**: 
> - 严格遵循技术栈规范
> - 禁止使用 `any` 类型
> - 优先使用提供的代码模板
> - 确保所有数据访问通过服务层
> - 利用 PostgreSQL RLS 确保数据安全