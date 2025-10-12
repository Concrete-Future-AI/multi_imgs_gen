# 🚀 快速测试指南

## 立即测试

### 测试1：产品特写图（~2分钟）
```bash
cd test-api
node pipeline-full.js stone_img.jpg closeup
```

### 测试2：场景图（~2分钟）
```bash
node pipeline-full.js stone_img.jpg scene "木质咖啡桌上，旁边有一杯拿铁咖啡和一本打开的书，温暖的午后阳光"
```

### 测试3：交互式运行
```bash
npm run pipeline:interactive
# 或
npm start

# 然后按提示操作：
# 1. 选择类型（输入 1 或 2）
# 2. 如果选择场景图，输入场景描述
# 3. 按 Enter 开始
```

---

## 查看结果

生成的图片位于：
```
test-api/output/generated/
```

每次生成5张图片，命名格式：
- `ecommerce_正面特写_时间戳_1.png`
- `ecommerce_45度俯视_时间戳_2.png`
- `ecommerce_侧面轮廓_时间戳_3.png`
- `ecommerce_微距细节_时间戳_4.png`
- `ecommerce_整体展示_时间戳_5.png`

---

## 测试场景示例

```bash
# 办公场景
node pipeline-full.js stone_img.jpg scene "现代办公桌面，MacBook旁边，极简北欧风格"

# 居家场景
node pipeline-full.js stone_img.jpg scene "温馨卧室床头柜上，柔和的晨光透过纱帘"

# 户外场景
node pipeline-full.js stone_img.jpg scene "户外草地上，阳光明媚，背景是模糊的绿色植物"

# 咖啡场景
node pipeline-full.js stone_img.jpg scene "木质咖啡桌上，旁边有一杯拿铁咖啡和一本打开的书"
```

---

## 预期结果

✅ 每次生成应该：
- 成功率：100% (5/5张)
- 耗时：~120-130秒
- 分辨率：2656x1472
- Token消耗：~76,000/次

✅ 产品特写图特点：
- 纯白或浅灰背景
- 专业打光
- 突出产品细节

✅ 场景图特点：
- 真实场景环境
- 自然光线
- 生活方式展示

---

## 故障排除

### 错误1：未找到DOUBAO_API_KEY
**解决**：检查 `test-api/.env.local` 文件是否存在并包含正确的API密钥

### 错误2：场景描述不能为空
**解决**：选择scene类型时必须提供场景描述

### 错误3：图片文件不存在
**解决**：确保 `stone_img.jpg` 在 test-api 目录下

---

## 快速验证清单

- [ ] 产品特写图生成成功
- [ ] 场景图生成成功
- [ ] 5张图片全部保存
- [ ] 图片清晰，分辨率正确
- [ ] 产品主体保持一致

---

**开始测试吧！** 🎉
