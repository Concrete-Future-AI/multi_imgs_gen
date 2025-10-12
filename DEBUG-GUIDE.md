# 🔍 调试指南 - 场景图生成问题

## 📋 问题描述

用户报告：选择"产品场景图"后，点击生成按钮，分析图片API没有被调用。

---

## 🛠️ 已添加的调试功能

我已经在代码的关键位置添加了详细的调试日志，帮助你快速定位问题。

### 1. 前端 - handleGenerate 函数

**位置**: `src/app/page.tsx` 第117-156行

**调试日志**:
```
=== handleGenerate 开始 ===
uploadedFile: [文件对象]
selectedStyle: [风格对象]
sceneDescription: "咖啡桌上，旁边有咖啡和书"
requiresScene: true
✅ 验证通过，开始生成
```

### 2. 前端 - generateImages 函数

**位置**: `src/app/page.tsx` 第32-115行

**调试日志**:
```
=== generateImages 开始 ===
✅ 开始设置生成状态
📦 准备FormData
✅ 添加场景描述: 咖啡桌上，旁边有咖啡和书
📝 FormData内容:
  - productImage: product.jpg
  - style: product-scene
  - quantity: 3
  - sceneDescription: 咖啡桌上，旁边有咖啡和书
🚀 发送API请求到 /api/generate
📥 收到API响应: 200 OK
```

### 3. 前端 - canGenerate 计算

**位置**: `src/app/page.tsx` 第159-194行

**调试日志**:
```
=== canGenerate 计算 ===
  uploadedFile: true
  selectedStyle: true product-scene 产品场景图
  isGenerating: false
  requiresScene: true
  sceneDescription: "咖啡桌上，旁边有咖啡和书"
  sceneDescription.trim(): "咖啡桌上，旁边有咖啡和书"
  需要场景描述，hasSceneDesc: true
  ✅ 可以生成
```

### 4. 后端 - API路由

**位置**: `src/app/api/generate/route.ts` 第5-85行

**调试日志**:
```
=== API /api/generate 接收到请求 ===
📦 接收到的数据:
  - productImage: product.jpg image/jpeg 1234567
  - style: product-scene
  - quantity: 3
  - sceneDescription: 咖啡桌上，旁边有咖啡和书
🎨 选择的风格: [风格对象]
🔍 检查场景描述要求:
  - requiresScene: true
  - sceneDescription: 咖啡桌上，旁边有咖啡和书
✅ 场景描述验证通过
```

---

## 🧪 测试步骤

### 第一步：启动开发服务器

```bash
cd D:\Startup\multi_img_gen_2
npm run dev
```

### 第二步：打开浏览器开发者工具

1. 打开 http://localhost:3000
2. 按 F12 打开开发者工具
3. 切换到 **Console（控制台）** 标签

### 第三步：执行完整流程

1. **上传产品图片**
   - 查看Console是否有相关日志

2. **选择"产品场景图"**
   - 查看Console输出：
   ```
   === canGenerate 计算 ===
   ...
   ```

3. **填写场景描述**
   - 例如：`咖啡桌上，旁边有咖啡和书`
   - 每次输入字符时，Console都会重新计算canGenerate

4. **点击"开始生成"按钮**
   - 查看Console完整输出流程

---

## 🔎 可能的问题和对应日志

### 问题 1: 生成按钮禁用

**症状**: 点击不了生成按钮

**查看日志**:
```
=== canGenerate 计算 ===
  uploadedFile: true
  selectedStyle: true product-scene 产品场景图
  isGenerating: false
  requiresScene: true
  sceneDescription: ""                    ← 空字符串
  sceneDescription.trim(): ""             ← 空字符串
  需要场景描述，hasSceneDesc: false
  ❌ 需要场景描述但未填写              ← 这是原因
```

**解决方法**: 确保填写了场景描述

---

### 问题 2: 场景描述未传递到后端

**症状**: 点击生成后报错"请填写场景描述"

**前端日志**:
```
📝 FormData内容:
  - productImage: product.jpg
  - style: product-scene
  - quantity: 3
  - sceneDescription: (无)                ← 问题在这里
```

**解决方法**: 检查sceneDescription是否正确保存到store

---

### 问题 3: API请求未发送

**症状**: 没有看到API响应日志

**前端日志**:
```
=== generateImages 开始 ===
✅ 开始设置生成状态
📦 准备FormData
🚀 发送API请求到 /api/generate
(然后没有响应)
```

**查看**: 
1. Network标签是否有 `/api/generate` 请求
2. 是否有网络错误
3. 请求是否被CORS阻止

---

### 问题 4: 后端验证失败

**症状**: 后端返回400错误

**后端日志**:
```
=== API /api/generate 接收到请求 ===
📦 接收到的数据:
  - productImage: product.jpg image/jpeg 1234567
  - style: product-scene
  - quantity: 3
  - sceneDescription: (无)                ← 后端没收到
🔍 检查场景描述要求:
  - requiresScene: true
  - sceneDescription: undefined
❌ 需要场景描述但未提供
```

**解决方法**: 检查FormData是否正确发送

---

### 问题 5: API调用缓慢或超时

**症状**: 分析很慢或超时

**查看**:
1. 后端日志是否显示 `🔍 步骤1: 分析产品图片...`
2. 是否在60秒内返回
3. 检查豆包API状态和quota

**可能原因**:
- API key无效或过期
- 网络连接问题
- API服务器繁忙
- Quota耗尽

---

## 📊 完整的正常流程日志

### 前端 Console

```
=== canGenerate 计算 ===
  uploadedFile: true
  selectedStyle: true product-scene 产品场景图
  isGenerating: false
  requiresScene: true
  sceneDescription: "咖啡桌上，旁边有咖啡和书"
  sceneDescription.trim(): "咖啡桌上，旁边有咖啡和书"
  需要场景描述，hasSceneDesc: true
  ✅ 可以生成

=== handleGenerate 开始 ===
uploadedFile: {file: File, preview: "blob:..."}
selectedStyle: {id: "product-scene", name: "产品场景图", ...}
sceneDescription: 咖啡桌上，旁边有咖啡和书
requiresScene: true
✅ 验证通过，开始生成

=== generateImages 开始 ===
✅ 开始设置生成状态
📦 准备FormData
✅ 添加场景描述: 咖啡桌上，旁边有咖啡和书
📝 FormData内容:
  - productImage: product.jpg
  - style: product-scene
  - quantity: 3
  - sceneDescription: 咖啡桌上，旁边有咖啡和书
🚀 发送API请求到 /api/generate
📥 收到API响应: 200 OK
```

### 后端 Terminal/Console

```
=== API /api/generate 接收到请求 ===
📦 接收到的数据:
  - productImage: product.jpg image/jpeg 1234567
  - style: product-scene
  - quantity: 3
  - sceneDescription: 咖啡桌上，旁边有咖啡和书
🎨 选择的风格: {id: "product-scene", name: "产品场景图", ...}
🔍 检查场景描述要求:
  - requiresScene: true
  - sceneDescription: 咖啡桌上，旁边有咖啡和书
✅ 场景描述验证通过

开始分析产品...
🔍 步骤1: 分析产品图片...
✅ 产品分析完成

开始生成提示词...
✅ 提示词生成完成

开始生成图片...
🎨 步骤3: 生成图片...
   类型: 场景图
   数量: 3张
```

---

## 🚀 快速诊断

### 检查点 1: 按钮是否可点击？

**是** → 继续检查点 2
**否** → 查看canGenerate日志，找出禁用原因

### 检查点 2: 点击后是否有handleGenerate日志？

**是** → 继续检查点 3
**否** → 按钮事件可能未绑定，检查代码

### 检查点 3: 是否有generateImages日志？

**是** → 继续检查点 4
**否** → handleGenerate中的验证失败了

### 检查点 4: 是否有"发送API请求"日志？

**是** → 继续检查点 5
**否** → generateImages提前return了

### 检查点 5: 是否有"收到API响应"日志？

**是** → 继续检查点 6
**否** → 网络请求失败，查看Network标签

### 检查点 6: 是否有后端日志？

**是** → 查看后端处理流程
**否** → API路由未收到请求，检查路由配置

---

## 🔧 常见修复方法

### 修复 1: 清除缓存重启

```bash
# 删除.next目录
Remove-Item -Path ".next" -Recurse -Force

# 重启开发服务器
npm run dev
```

### 修复 2: 检查环境变量

```bash
# 查看.env.local
cat .env.local

# 确保有DOUBAO_API_KEY
DOUBAO_API_KEY=your-api-key-here
```

### 修复 3: 清除浏览器缓存

1. 按 Ctrl+Shift+Delete
2. 清除缓存和Cookie
3. 刷新页面

### 修复 4: 测试API密钥

在后端添加测试代码：
```typescript
console.log('DOUBAO_API_KEY:', process.env.DOUBAO_API_KEY ? '已设置' : '未设置')
```

---

## 📝 报告问题时需要提供的信息

如果问题仍然存在，请提供以下信息：

1. **完整的Console日志** (从打开页面到点击生成)
2. **Network标签截图** (显示API请求状态)
3. **Terminal/后端日志** (如果有)
4. **操作步骤** (详细描述你做了什么)
5. **浏览器和版本** (例如：Chrome 120)
6. **是否能生成产品特写图** (排除API问题)

---

## ✅ 验证修复

修复后，请验证以下场景：

### 场景 1: 产品特写图
- [ ] 上传图片
- [ ] 选择"产品特写图"
- [ ] 不填场景描述
- [ ] 生成按钮可点击
- [ ] 点击后正常生成

### 场景 2: 场景图（未填描述）
- [ ] 上传图片
- [ ] 选择"产品场景图"
- [ ] 不填场景描述
- [ ] 生成按钮禁用
- [ ] Console显示原因

### 场景 3: 场景图（已填描述）
- [ ] 上传图片
- [ ] 选择"产品场景图"
- [ ] 填写场景描述
- [ ] 生成按钮可点击
- [ ] 点击后正常生成
- [ ] 场景描述传递到后端

---

## 🎯 下一步

1. 启动开发服务器
2. 打开浏览器Console
3. 执行完整流程
4. **复制所有Console日志**
5. 告诉我看到了什么

我会根据日志帮你定位具体问题！🔍
