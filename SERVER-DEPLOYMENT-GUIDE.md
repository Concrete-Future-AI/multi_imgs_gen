# 🚀 服务器部署指南

## 📋 问题描述

**症状**: 图片在本地环境正常生成和显示，但在服务器环境中图片生成成功（文件夹中可见），前端却无法显示，生成完成后回到初始状态。

**根本原因**: 缺少 `NEXT_PUBLIC_BASE_URL` 环境变量配置，导致图片URL指向错误的地址。

---

## 🔧 解决方案

### 1. 环境变量配置

#### 本地开发环境
```bash
# .env 或 .env.local
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

#### 生产服务器环境
```bash
# .env 或 .env.production
# 替换为你的实际域名或IP地址
NEXT_PUBLIC_BASE_URL=https://your-domain.com
# 或者使用IP地址
NEXT_PUBLIC_BASE_URL=http://your-server-ip:3000
```

### 2. 部署步骤

#### 步骤1: 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量文件
nano .env
```

#### 步骤2: 设置正确的BASE_URL
根据你的部署环境，修改 `NEXT_PUBLIC_BASE_URL`：

**Vercel部署**:
```bash
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

**自建服务器**:
```bash
NEXT_PUBLIC_BASE_URL=https://your-domain.com
# 或使用IP地址（不推荐生产环境）
NEXT_PUBLIC_BASE_URL=http://123.456.789.123:3000
```

**Docker部署**:
```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000
# 或映射的端口
NEXT_PUBLIC_BASE_URL=http://localhost:8080
```

#### 步骤3: 重新构建和启动
```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 启动生产服务器
npm start
```

---

## 🔍 技术原理

### 图片URL生成逻辑

项目使用存储服务生成图片URL：

```typescript
// src/lib/storage.ts
private static getStorageConfig(): StorageConfig {
  return {
    type: 'local',
    local: {
      uploadDir: path.join(process.cwd(), 'public'),
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    },
  };
}
```

### 问题分析

1. **本地环境**: 默认 `http://localhost:3000` 正确指向本地服务器
2. **服务器环境**: 仍使用 `http://localhost:3000`，但前端无法访问服务器的localhost
3. **结果**: 图片文件存在，但URL无法访问，导致前端显示失败

---

## 🛠️ 验证方法

### 1. 检查环境变量
```bash
# 在服务器上运行
echo $NEXT_PUBLIC_BASE_URL
```

### 2. 检查图片URL
生成图片后，检查返回的URL格式：
```javascript
// 正确格式
"https://your-domain.com/generated/image_123456.png"

// 错误格式（会导致显示失败）
"http://localhost:3000/generated/image_123456.png"
```

### 3. 手动测试图片访问
```bash
# 替换为实际的图片URL
curl https://your-domain.com/generated/image_123456.png
```

---

## 🚨 常见问题

### Q1: 设置了环境变量但仍然不显示
**解决方案**: 
1. 确保重新构建了项目 (`npm run build`)
2. 重启服务器
3. 清除浏览器缓存

### Q2: 使用IP地址访问
**注意事项**:
- HTTP协议在生产环境不安全
- 某些浏览器可能阻止混合内容（HTTPS页面加载HTTP资源）
- 推荐使用HTTPS域名

### Q3: Docker部署端口映射
```bash
# 如果容器内部是3000端口，外部映射到8080
docker run -p 8080:3000 -e NEXT_PUBLIC_BASE_URL=http://localhost:8080 your-app
```

---

## 📝 部署检查清单

- [ ] 复制 `.env.example` 到 `.env`
- [ ] 设置正确的 `NEXT_PUBLIC_BASE_URL`
- [ ] 配置API密钥 (`GOOGLE_AI_API_KEY`, `DOUBAO_API_KEY`)
- [ ] 运行 `npm run build`
- [ ] 启动生产服务器 `npm start`
- [ ] 测试图片生成和显示功能
- [ ] 检查浏览器网络面板中的图片请求状态

---

## 🔗 相关文件

- **环境配置**: `.env`, `.env.example`
- **存储服务**: `src/lib/storage.ts`
- **图片生成**: `src/lib/googleAI.ts`, `src/lib/doubaoAI.ts`
- **API路由**: `src/app/api/generate/route.ts`

---

## 💡 最佳实践

1. **使用HTTPS**: 生产环境始终使用HTTPS域名
2. **环境分离**: 不同环境使用不同的 `.env` 文件
3. **安全性**: 不要在代码中硬编码域名，使用环境变量
4. **监控**: 定期检查图片生成和显示功能
5. **备份**: 定期备份 `public/generated` 目录（如果需要）