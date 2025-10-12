# 豆包AI电商图片生成器

## 📝 项目说明

本项目使用豆包Seedream 4.0 API生成专业的电商产品图片，支持多角度、多视角的批量生成。

### 核心特性

✅ **本地存储** - 所有图片保存在本地，避免跨域问题  
✅ **主体一致性** - 强调产品特征保持100%一致  
✅ **电商风格** - 干净背景、专业打光、高分辨率  
✅ **多视角生成** - 5个不同拍摄角度自动生成  
✅ **S3/OSS接口** - 预留云存储接口供生产环境使用  

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置API密钥

编辑 `.env.local` 文件：

```env
DOUBAO_API_KEY=你的豆包API密钥
```

### 3. 运行生成

```bash
npm run generate
```

生成的图片将保存在 `output/generated/` 目录。

---

## 📂 项目结构

```
test-api/
├── .env.local              # API密钥配置（不提交到Git）
├── package.json            # 项目配置
├── storage.js              # 本地存储和S3/OSS模块
├── generate-ecommerce.js   # 主生成脚本
└── output/
    └── generated/          # 生成的图片存储目录
```

---

## 🎯 功能说明

### 生成的5个视角

1. **正面特写** - 产品正面直视，居中构图，纯白背景
2. **45度俯视** - 从45度角俯视，展示立体感和结构
3. **侧面轮廓** - 90度侧面视角，突出产品轮廓线条
4. **微距细节** - 近距离特写，展示材质纹理和工艺
5. **整体展示** - 稍远距离，展示产品全貌和留白

### Prompt设计要点

✅ **主体一致性强调**
- 产品颜色、材质、大小、形状100%相同
- 设计细节、纹理、图案完全一致
- 严禁改变产品任何特征

✅ **电商摄影标准**
- 纯净背景：纯白色或浅灰色
- 柔和打光：无强烈阴影
- 高分辨率：2K以上清晰度

---

## 💻 代码说明

### storage.js - 存储模块

提供以下功能：

1. **本地存储**
   - `createOutputDirs()` - 创建输出目录
   - `downloadAndSaveImage()` - 下载图片到本地
   - `saveBase64Image()` - 保存Base64图片
   - `readImageAsBase64()` - 读取图片为Base64

2. **S3/OSS接口（预留）**
   - `uploadToS3()` - 上传到云存储
   - 支持AWS S3、阿里云OSS、腾讯云COS

### generate-ecommerce.js - 主脚本

核心流程：

```javascript
1. 准备产品图片URL
   └─ 测试环境：使用豆包示例图片
   └─ 生产环境：上传到S3/OSS获取URL

2. 调用豆包API生成图片
   └─ 模型：doubao-seedream-4-0-250828
   └─ 数量：5张
   └─ 尺寸：2K (2304x1728)

3. 下载图片到本地
   └─ 保存位置：output/generated/
   └─ 命名格式：ecommerce_视角_时间戳_序号.png
```

---

## 🔧 生产环境配置

### 使用S3/OSS存储

1. **安装对应SDK**

```bash
# AWS S3
npm install @aws-sdk/client-s3

# 阿里云OSS
npm install ali-oss

# 腾讯云COS
npm install cos-nodejs-sdk-v5
```

2. **配置环境变量**

在 `.env.local` 添加：

```env
# 云存储配置
S3_PROVIDER=aws          # aws | aliyun | tencent
S3_ACCESS_KEY_ID=你的密钥ID
S3_SECRET_ACCESS_KEY=你的密钥
S3_BUCKET=你的桶名
S3_REGION=区域
```

3. **修改代码使用S3上传**

在 `generate-ecommerce.js` 中：

```javascript
// 将产品图片上传到S3获取公网URL
import { uploadToS3 } from './storage.js';

const localImagePath = './test-product.jpg';
const productImageUrl = await uploadToS3(localImagePath);

// 然后使用URL调用豆包API
const result = await generateWithDoubao(productImageUrl, prompt, 5);
```

### S3接口实现

在 `storage.js` 的 `uploadToS3()` 函数中已预留接口，需要根据实际云服务商实现：

- `uploadToAWS()` - AWS S3上传
- `uploadToAliyunOSS()` - 阿里云OSS上传  
- `uploadToTencentCOS()` - 腾讯云COS上传

---

## 📊 API说明

### 豆包Seedream 4.0 API

**请求示例：**

```json
{
  "model": "doubao-seedream-4-0-250828",
  "prompt": "生成提示词...",
  "image": ["图片URL"],
  "size": "2K",
  "sequential_image_generation": "auto",
  "sequential_image_generation_options": {
    "max_images": 5
  },
  "response_format": "url",
  "watermark": false
}
```

**响应示例：**

```json
{
  "model": "doubao-seedream-4-0-250828",
  "created": 1760278344,
  "data": [
    {
      "url": "https://...",
      "size": "2304x1728"
    }
  ],
  "usage": {
    "generated_images": 5,
    "total_tokens": 77760
  }
}
```

### 关键参数说明

| 参数 | 说明 | 值 |
|-----|------|-----|
| model | 模型名称 | doubao-seedream-4-0-250828 |
| image | 参考图片URL数组 | ["https://..."] |
| size | 输出尺寸 | "2K" (2304x1728) |
| max_images | 最大生成数量 | 1-10 |
| watermark | 是否添加水印 | true/false |

---

## ⚠️ 注意事项

### 图片URL要求

豆包API的 `image` 参数**必须是公网可访问的URL**，不能是：
- ❌ 本地文件路径
- ❌ Base64编码
- ❌ localhost URL
- ❌ 内网IP

### 解决方案

**开发测试：**
- 使用豆包官方示例图片URL
- 当前脚本已配置默认使用

**生产环境：**
- 上传产品图片到S3/OSS
- 获取公网URL后调用API
- 使用 `storage.js` 中的 `uploadToS3()` 接口

---

## 📈 性能数据

基于实际测试：

| 指标 | 数值 |
|-----|------|
| 生成数量 | 5张 |
| 总耗时 | ~115秒 |
| 平均耗时 | ~23秒/张 |
| 成功率 | 100% |
| Token使用 | ~77760 |
| 输出尺寸 | 2304x1728 |

---

## 🎨 Prompt优化建议

### 主体一致性关键词

```
【严格要求：主体一致性】
- 产品的颜色、材质、大小、形状必须完全相同
- 所有设计细节、纹理、图案必须一致
- 禁止改变产品的任何特征
```

### 电商风格关键词

```
- 纯净背景：纯白色(#FFFFFF)或浅灰色(#F5F5F5)
- 柔和均匀的打光，无强烈阴影
- 4K分辨率，清晰锐利
- 产品居中或遵循三分法
- 留白适当，视觉平衡
```

### 禁止事项

```
❌ 禁止改变产品特征
❌ 禁止添加其他物品
❌ 禁止复杂背景
❌ 禁止过度修饰和滤镜
```

---

## 🔍 常见问题

### Q: 为什么生成的图片主体不一致？

A: 需要在prompt中强调主体一致性，使用如下关键词：
- "保持产品完全一致"
- "100%相同的颜色、材质、大小"
- "禁止改变产品任何特征"

### Q: 如何使用自己的产品图片？

A: 有两种方式：
1. 测试环境：将图片命名为 `test-product.jpg` 放在test-api目录（仍需上传到S3）
2. 生产环境：使用 `uploadToS3()` 上传获取URL

### Q: 生成的图片在哪里？

A: 所有图片保存在 `test-api/output/generated/` 目录

### Q: 如何配置S3/OSS？

A: 参考上文"生产环境配置"章节，需要：
1. 安装对应SDK
2. 配置环境变量
3. 实现 `storage.js` 中的上传函数

---

## 📚 参考资料

- [豆包API文档](../Docs_for_refer/doubao_call_api_doc.md)
- [Seedream 4.0 官方文档](https://www.volcengine.com/docs/82379/1357754)
- [AWS S3文档](https://docs.aws.amazon.com/s3/)
- [阿里云OSS文档](https://help.aliyun.com/product/31815.html)
- [腾讯云COS文档](https://cloud.tencent.com/product/cos)

---

## 📝 更新日志

### v1.0.0 (2025-10-12)

- ✅ 初始版本发布
- ✅ 支持豆包API调用
- ✅ 本地存储实现
- ✅ 5视角自动生成
- ✅ S3/OSS接口预留
- ✅ 主体一致性优化

---

## 📧 联系方式

如有问题，请查看项目文档或提交Issue。

---

**License**: MIT  
**Author**: Factory Droid  
**Date**: 2025-10-12
