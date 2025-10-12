# API集成指南

本文档说明如何将测试验证的API功能集成到主项目中。

## 📊 测试结果总结

根据 `test-api/` 中的测试结果：

### ✅ 豆包 API - 推荐使用
- **状态**: 完全可用
- **成功率**: 100% (3/3张)
- **平均耗时**: 25秒/张
- **分辨率**: 1664x2496 (2K)
- **成本**: 按使用量付费，配额充足

### ⚠️ Google AI - 需要付费
- **分析功能**: ✅ 优秀（免费可用）
- **提示词生成**: ✅ 专业（免费可用）
- **图片生成**: ❌ 需要付费计划
- **产品一致性**: 更强

## 🚀 集成方案

### 方案A：纯豆包方案（推荐，快速上线）

#### 1. 安装依赖
```bash
npm install axios
```

#### 2. 创建豆包客户端
```typescript
// src/lib/doubaoAI.ts
import axios from 'axios';

const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY;
const DOUBAO_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';

export async function generateImagesWithDoubao(
  prompt: string,
  imageUrls: string[],
  quantity: number = 3
) {
  const response = await axios.post(
    `${DOUBAO_BASE_URL}/images/generations`,
    {
      model: 'doubao-seedream-4-0-250828',
      prompt,
      image: imageUrls,
      size: '2K',
      sequential_image_generation: 'auto',
      sequential_image_generation_options: {
        max_images: quantity
      },
      response_format: 'url',
      watermark: false // 可选：是否添加水印
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DOUBAO_API_KEY}`
      },
      timeout: 120000
    }
  );
  
  return response.data;
}
```

#### 3. 修改生成流程
```typescript
// src/app/api/generate/route.ts
import { generateImagesWithDoubao } from '@/lib/doubaoAI';
import { downloadImageFromUrl } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    // ... 验证输入 ...
    
    // 步骤1: 上传产品图到临时存储获取公网URL
    const imageUrl = await uploadToPublicStorage(productImage);
    
    // 步骤2: 构建提示词
    const prompt = buildPrompt(selectedStyle, sceneDescription);
    
    // 步骤3: 使用豆包生成图片
    const result = await generateImagesWithDoubao(
      prompt,
      [imageUrl],
      quantity
    );
    
    // 步骤4: 下载图片到本地
    const localImages = [];
    for (const imgData of result.data) {
      const fileName = `generated_${Date.now()}_${localImages.length}.png`;
      const localPath = await downloadImageFromUrl(
        imgData.url,
        path.join(process.cwd(), 'public', 'generated'),
        fileName
      );
      localImages.push(`/generated/${fileName}`);
    }
    
    return NextResponse.json({
      success: true,
      images: localImages
    });
  } catch (error) {
    // ... 错误处理 ...
  }
}
```

#### 4. 添加环境变量
```env
# .env.local
DOUBAO_API_KEY=476b9e37-0cb0-4158-979d-1f4d44cf8c5a
```

---

### 方案B：混合方案（推荐，最佳质量）

使用Google AI进行分析和提示词生成，豆包进行实际图片生成。

#### 1. 保留现有的Google AI分析
```typescript
// src/lib/googleAI.ts 中的 analyzeProduct 和 generatePrompt 保持不变
// 这两个功能免费可用且效果优秀
```

#### 2. 替换图片生成部分
```typescript
// src/lib/googleAI.ts
import { generateImagesWithDoubao } from './doubaoAI';

export async function generateImages(
  prompt: string,
  quantity: number,
  productAnalysis?: string,
  imageBuffer?: Buffer,
  mimeType?: string
): Promise<string[]> {
  try {
    // 步骤1: 上传原图获取公网URL
    const imageUrl = await uploadBufferToPublic(imageBuffer, mimeType);
    
    // 步骤2: 使用豆包生成
    const result = await generateImagesWithDoubao(prompt, [imageUrl], quantity);
    
    // 步骤3: 下载到本地
    const images: string[] = [];
    for (const imgData of result.data) {
      const fileName = `generated_${Date.now()}_${images.length}.png`;
      const localPath = await downloadAndSave(imgData.url, fileName);
      images.push(localPath);
    }
    
    return images;
  } catch (error) {
    console.error('Image generation error:', error);
    throw new Error('图片生成失败');
  }
}
```

---

### 方案C：保持Google AI（需付费）

如果你已有Google AI付费计划，可以继续使用现有代码。

---

## 📦 本地存储实现

### 复制工具函数
```typescript
// src/lib/storage.ts
import fs from 'fs';
import path from 'path';

/**
 * 保存Base64图片到本地
 */
export function saveBase64Image(
  base64Data: string,
  outputDir: string,
  filename: string
): string {
  const buffer = Buffer.from(base64Data, 'base64');
  const filePath = path.join(outputDir, filename);
  
  // 确保目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

/**
 * 下载URL图片到本地
 */
export async function downloadImageFromUrl(
  url: string,
  outputDir: string,
  filename: string
): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  
  const buffer = await response.arrayBuffer();
  
  // 确保目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, Buffer.from(buffer));
  
  return filePath;
}
```

---

## 🌐 图片上传服务（必需for豆包）

豆包API需要公网可访问的图片URL，有以下几种方案：

### 选项1：使用图床服务（快速）
```typescript
// src/lib/imageUpload.ts
import axios from 'axios';
import FormData from 'form-data';

// 示例：使用imgbb（免费）
export async function uploadToImgbb(imageBuffer: Buffer): Promise<string> {
  const formData = new FormData();
  formData.append('image', imageBuffer.toString('base64'));
  
  const response = await axios.post(
    'https://api.imgbb.com/1/upload',
    formData,
    {
      params: {
        key: process.env.IMGBB_API_KEY
      }
    }
  );
  
  return response.data.data.url;
}
```

### 选项2：使用S3/OSS（推荐生产）
```typescript
// src/lib/s3Upload.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

export async function uploadToS3(
  imageBuffer: Buffer,
  filename: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: `uploads/${filename}`,
    Body: imageBuffer,
    ContentType: 'image/jpeg'
  });
  
  await s3Client.send(command);
  
  return `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${filename}`;
}
```

### 选项3：使用临时服务器（开发测试）
```typescript
// 在Next.js中创建临时公开路由
// src/app/api/temp-image/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const imagePath = path.join(process.cwd(), 'temp', params.id);
  const imageBuffer = fs.readFileSync(imagePath);
  
  return new Response(imageBuffer, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
```

---

## ⚙️ 配置清单

### 环境变量
```env
# .env.local

# Google AI（用于分析和提示词）
GOOGLE_AI_API_KEY=你的密钥

# 豆包（用于图片生成）
DOUBAO_API_KEY=476b9e37-0cb0-4158-979d-1f4d44cf8c5a

# 图片上传服务（三选一）
IMGBB_API_KEY=你的imgbb密钥        # 选项1
AWS_ACCESS_KEY_ID=你的AWS密钥       # 选项2
AWS_SECRET_ACCESS_KEY=你的AWS密钥   # 选项2
S3_BUCKET=你的桶名                  # 选项2
```

### package.json依赖
```json
{
  "dependencies": {
    "@google/genai": "^1.22.0",
    "axios": "^1.7.9",
    "@aws-sdk/client-s3": "^3.x.x"  // 如果使用S3
  }
}
```

---

## 🧪 测试流程

### 1. 单元测试
```bash
cd test-api
npm run test:doubao
```

### 2. 集成测试
在主项目中测试完整流程：
1. 上传产品图片
2. 选择生成风格
3. 开始生成
4. 验证生成的图片

### 3. 性能测试
- 测试不同数量的图片生成（3-8张）
- 测试不同分辨率
- 测试并发请求

---

## 📊 成本估算

### 豆包 API
- 按生成的图片数量计费
- 每张约 ¥0.X（具体参考官方定价）
- 月估算（按100次使用，每次3张）：约¥XXX

### Google AI
- 免费层级：有限配额
- 付费层级：需查看官方定价

---

## 🚨 注意事项

1. **豆包限制**
   - 需要图片公网URL
   - 图片URL有效期通常24小时
   - 建议下载到本地后立即删除临时URL

2. **安全考虑**
   - API密钥不要提交到Git
   - 使用环境变量管理敏感信息
   - 生产环境使用HTTPS

3. **错误处理**
   - 实现重试机制
   - 添加超时控制
   - 记录详细错误日志

---

## 📚 参考资料

- [测试报告](./test-api/TEST-SUMMARY.md)
- [快速结果](./test-api/QUICK-RESULTS.md)
- [测试数据](./test-api/output/test-results.json)
- [对比报告](./test-api/output/comparison-report.json)

---

更新时间：2025-10-12  
版本：v1.0  
状态：✅ 已验证可用
