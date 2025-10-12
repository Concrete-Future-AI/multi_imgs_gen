# 🚀 AI电商图片生成器 - 设置指南

## 📋 项目概述

这是一个基于豆包AI的电商产品图片生成器，可以将普通产品图片转换为专业的电商展示图。

### ✨ 核心功能

1. **产品特写图** - 纯净背景，突出产品细节
2. **产品场景图** - 真实场景环境，生活方式展示
3. **智能识别** - 自动分析产品特征
4. **多视角生成** - 每次生成1-8张不同角度的图片

---

## 🔧 环境配置

### 1. 安装依赖

```bash
npm install
```

### 2. 配置API密钥

创建 `.env.local` 文件（已创建示例）：

```env
# 豆包AI API密钥（必需）
DOUBAO_API_KEY=your_api_key_here
```

**获取豆包API密钥**：
1. 访问：https://www.volcengine.com/products/doubao
2. 注册/登录账号
3. 创建应用获取API密钥

### 3. 启动开发服务器

```bash
npm run dev
```

访问：http://localhost:3000

---

## 📖 使用指南

### 步骤1: 上传产品图片

- 支持格式：JPG, PNG, WebP
- 最大大小：10MB
- 建议：清晰的产品照片，背景简洁

### 步骤2: 选择生成风格

#### 选项A：产品特写图
- 纯白/浅灰背景
- 专业摄影棚效果
- 适合：电商主图、详情页

#### 选项B：产品场景图
- 真实场景环境
- 自然光线效果
- 适合：氛围营销、软文
- **需要填写场景描述**

### 步骤3: 设置生成数量

- 范围：1-8张
- 默认：3张
- AI会自动为每张图片选择最佳角度

### 步骤4: 生成图片

点击"开始生成"按钮，等待2-3分钟

---

## 🎨 场景描述技巧

### 好的场景描述包含：

1. **场景位置** - 木质桌面、户外草地、卧室床头柜
2. **环境元素** - 咖啡杯、书本、植物（2-3个即可）
3. **光线氛围** - 温暖的午后阳光、柔和的晨光
4. **整体风格** - 北欧简约、现代极简、温馨居家

### ✅ 推荐示例

```
"木质咖啡桌上，旁边有一杯拿铁咖啡和一本打开的书，温暖的午后阳光"

"现代办公桌面，MacBook旁边，极简北欧风格，自然光线"

"温馨卧室床头柜上，柔和的晨光透过纱帘，旁边有小台灯"

"户外阳台，柔和的傍晚光线，背景虚化的城市景观"
```

### ❌ 避免

```
"在桌子上"  ❌ 太简单
"豪华的金色宫殿..." ❌ 过于复杂
"随便什么地方" ❌ 不明确
```

---

## 🔄 完整Pipeline流程

```
1. 图片识别
   ↓ 使用豆包视觉模型分析产品
   ↓ 识别类别、特征、材质、颜色等
   
2. Prompt生成
   ↓ 基于产品分析生成专业提示词
   ↓ 强调主体一致性
   
3. 图片生成
   ↓ 为每张图片选择不同视角
   ↓ 生成高质量2K图片
   
4. 保存到本地
   ↓ 自动保存到 public/generated/
   ↓ 可直接下载使用
```

---

## 📊 技术规格

### API模型

- **图片识别**: doubao-seed-1-6-250615
- **Prompt生成**: doubao-seed-1-6-250615  
- **图片生成**: doubao-seedream-4-0-250828

### 生成参数

- **分辨率**: 2K (2656x1472)
- **格式**: PNG
- **平均耗时**: 2-3分钟/批次
- **成功率**: >95%

### 视角类型

**产品特写图**：
1. 正面特写
2. 45度俯视
3. 侧面轮廓
4. 微距细节
5. 整体展示

**产品场景图**：
1. 正面场景视角
2. 45度俯视场景
3. 侧面场景视角
4. 微距细节
5. 整体场景展示

---

## 🛠️ 开发说明

### 项目结构

```
multi_img_gen_2/
├── src/
│   ├── app/
│   │   ├── api/generate/    # 生成API路由
│   │   ├── page.tsx          # 主页面
│   │   └── layout.tsx        # 布局
│   ├── components/
│   │   ├── features/         # 功能组件
│   │   │   ├── ImageUploader.tsx
│   │   │   ├── StyleSelector.tsx
│   │   │   ├── QuantitySelector.tsx
│   │   │   └── ResultsDisplay.tsx
│   │   └── ui/               # UI组件
│   ├── lib/
│   │   ├── doubaoAI.ts       # 豆包AI集成
│   │   └── constants.ts      # 配置常量
│   ├── stores/
│   │   └── useAppStore.ts    # 状态管理
│   └── types/
│       └── index.ts          # 类型定义
├── public/
│   └── generated/            # 生成的图片
├── test-api/                 # 测试脚本
└── .env.local                # 环境变量
```

### 核心文件

- **`src/lib/doubaoAI.ts`** - 豆包AI三步骤Pipeline
  - `analyzeProduct()` - 产品识别
  - `generatePrompt()` - 提示词生成
  - `generateImages()` - 图片生成

- **`src/app/api/generate/route.ts`** - API端点
  - 处理图片上传
  - 调用AI Pipeline
  - 返回生成结果

- **`src/components/features/StyleSelector.tsx`** - 风格选择器
  - 产品特写图/场景图选择
  - 场景描述输入
  - UI交互

---

## 🧪 测试

### 测试Pipeline（test-api目录）

```bash
cd test-api

# 测试产品特写图
node pipeline-full.js stone_img.jpg closeup

# 测试场景图
node pipeline-full.js stone_img.jpg scene "咖啡桌上，旁边有咖啡和书"

# 交互式测试
npm run pipeline:interactive
```

### Web界面测试

1. 启动开发服务器：`npm run dev`
2. 访问 http://localhost:3000
3. 上传测试图片
4. 选择风格并生成

---

## 📋 常见问题

### Q: API密钥在哪里获取？
A: 访问 https://www.volcengine.com/products/doubao 注册获取

### Q: 为什么生成失败？
A: 检查：
1. API密钥是否正确配置
2. 网络连接是否正常
3. 图片格式和大小是否符合要求

### Q: 可以生成多少张图片？
A: 每次1-8张，推荐3-5张

### Q: 场景图必须填写场景描述吗？
A: 是的，场景描述是必填的

### Q: 生成的图片保存在哪里？
A: `public/generated/` 目录

---

## 🔐 安全注意事项

1. **不要提交 `.env.local` 到Git**
2. **定期轮换API密钥**
3. **生产环境使用HTTPS**
4. **限制上传文件大小**

---

## 📚 相关文档

- [测试Pipeline文档](./test-api/HOW-TO-USE.md)
- [快速测试指南](./test-api/QUICK-TEST.md)
- [集成指南](./INTEGRATION-GUIDE.md)

---

## 🎉 开始使用

```bash
# 1. 安装依赖
npm install

# 2. 配置API密钥（编辑 .env.local）
DOUBAO_API_KEY=your_key

# 3. 启动服务
npm run dev

# 4. 访问 http://localhost:3000
```

**立即体验AI电商图片生成！** 🚀
