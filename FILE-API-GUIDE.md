# 文件API使用指南

## 概述

本项目实现了一套完整的文件管理API系统，支持文件的上传、下载、删除等操作，并预留了OSS云存储的扩展接口。

## 架构设计

### 存储服务抽象层

- **位置**: `src/lib/storage.ts`
- **设计模式**: 工厂模式 + 策略模式
- **支持的存储类型**: 
  - 本地存储 (`LocalStorageService`)
  - OSS云存储 (`OSSStorageService` - 预留接口)

### API路由

| 路由 | 方法 | 功能 | 文件位置 |
|------|------|------|----------|
| `/api/files/upload` | POST | 文件上传 | `src/app/api/files/upload/route.ts` |
| `/api/files/[...path]` | GET/HEAD | 文件下载/访问 | `src/app/api/files/[...path]/route.ts` |
| `/api/files/delete` | DELETE/POST | 文件删除 | `src/app/api/files/delete/route.ts` |

## API详细说明

### 1. 文件上传 API

**端点**: `POST /api/files/upload`

**请求格式**: `multipart/form-data`

**参数**:
- `file` (必需): 要上传的文件
- `folder` (可选): 存储文件夹，默认为 `uploads`
- `preserveOriginalName` (可选): 是否保留原始文件名，默认为 `false`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "key": "generated/generated_1760340558123_0.png",
    "url": "http://localhost:3000/generated/generated_1760340558123_0.png",
    "size": 1145362,
    "mimeType": "image/png",
    "originalName": "test.png",
    "uploadedAt": "2025-01-13T07:30:00.000Z"
  }
}
```

**限制**:
- 支持的文件类型: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`
- 最大文件大小: 10MB

### 2. 文件下载/访问 API

**端点**: `GET /api/files/[...path]`

**参数**:
- `path`: 文件路径（URL路径参数）
- `download` (查询参数): 设置为 `true` 时强制下载
- `filename` (查询参数): 自定义下载文件名

**示例**:
```
GET /api/files/generated/test.png
GET /api/files/generated/test.png?download=true
GET /api/files/generated/test.png?download=true&filename=my-image.png
```

**响应**: 直接返回文件内容，设置适当的 Content-Type 和缓存头

### 3. 文件删除 API

**端点**: `DELETE /api/files/delete` 或 `POST /api/files/delete`

**请求格式**: `application/json`

**单文件删除**:
```json
{
  "path": "generated/test.png"
}
```

**批量删除**:
```json
{
  "paths": [
    "generated/test1.png",
    "generated/test2.png"
  ]
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "文件删除成功",
  "deletedPath": "generated/test.png"
}
```

## 配置说明

### 环境变量

在 `.env.local` 文件中配置：

```env
# 存储类型配置
STORAGE_TYPE=local  # 可选: local, oss

# 本地存储配置
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# OSS存储配置（当 STORAGE_TYPE=oss 时使用）
OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=your-bucket-name
OSS_ACCESS_KEY_ID=your-access-key-id
OSS_ACCESS_KEY_SECRET=your-access-key-secret
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
```

### 存储服务切换

通过修改 `STORAGE_TYPE` 环境变量即可切换存储服务：

- `local`: 使用本地文件系统存储
- `oss`: 使用阿里云OSS存储（需要实现OSS服务类）

## 使用示例

### 前端上传文件

```typescript
const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'uploads');
  
  const response = await fetch('/api/files/upload', {
    method: 'POST',
    body: formData,
  });
  
  const result = await response.json();
  return result;
};
```

### 前端下载文件

```typescript
const downloadFile = async (filePath: string, filename?: string) => {
  const url = `/api/files/${filePath}?download=true${filename ? `&filename=${filename}` : ''}`;
  const a = document.createElement('a');
  a.href = url;
  a.click();
};
```

### 前端删除文件

```typescript
const deleteFile = async (filePath: string) => {
  const response = await fetch('/api/files/delete', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path: filePath }),
  });
  
  const result = await response.json();
  return result;
};
```

## 测试工具

项目包含了一个文件管理测试组件：

**位置**: `src/components/debug/FileManager.tsx`

**功能**:
- 文件上传测试
- 文件下载测试
- 文件删除测试
- 图片预览
- API状态显示

## 扩展OSS存储

要启用OSS存储，需要完成以下步骤：

1. **安装OSS SDK**:
```bash
npm install ali-oss
```

2. **实现OSSStorageService类**:
在 `src/lib/storage.ts` 中完善 `OSSStorageService` 类的方法实现。

3. **配置环境变量**:
设置 `STORAGE_TYPE=oss` 和相关OSS配置。

4. **测试验证**:
使用文件管理工具测试OSS存储功能。

## 安全考虑

1. **文件类型验证**: 严格限制允许上传的文件类型
2. **文件大小限制**: 防止大文件攻击
3. **路径安全**: 防止路径遍历攻击
4. **访问控制**: 可根据需要添加身份验证
5. **CORS配置**: 适当配置跨域访问策略

## 性能优化

1. **缓存策略**: 文件访问API设置了长期缓存头
2. **流式传输**: 大文件支持流式下载
3. **压缩**: 可配置文件压缩
4. **CDN**: OSS存储天然支持CDN加速

## 故障排除

### 常见问题

1. **文件上传失败**:
   - 检查文件大小和类型限制
   - 确认存储目录权限
   - 查看服务器日志

2. **文件访问404**:
   - 确认文件路径正确
   - 检查存储服务配置
   - 验证文件是否存在

3. **OSS配置问题**:
   - 验证OSS凭证
   - 检查bucket权限
   - 确认网络连接

### 调试方法

1. 查看浏览器开发者工具网络面板
2. 检查服务器控制台日志
3. 使用文件管理测试工具
4. 验证环境变量配置