doubao_key = 476b9e37-0cb0-4158-979d-1f4d44cf8c5a


# Doubao 图片生成 API（Seedream 4.0 API）
## doubao-seedream-4.0-多参考图生组图
### 输入示例
```curl
curl -X POST https://ark.cn-beijing.volces.com/api/v3/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -d '{
    "model": "doubao-seedream-4-0-250828",
    "prompt": "生成3张女孩和奶牛玩偶在游乐园开心地坐过山车的图片，涵盖早晨、中午、晚上",
    "image": ["https://ark-project.tos-cn-beijing.volces.com/doc_image/seedream4_imagesToimages_1.png", "https://ark-project.tos-cn-beijing.volces.com/doc_image/seedream4_imagesToimages_2.png"],
    "sequential_image_generation": "auto",
    "sequential_image_generation_options": {
        "max_images": 3
    },
    "size": "2K"
}'
```

### 输出示例
```curl
{
  "model": "doubao-seedream-4-0-250828",
  "created": 1757388756,
  "data": [
    {
      "url": "https://...",
      "size": "2720x1536"
    },
    {
      "url": "https://...",
      "size": "2720x1536"
    },
    {
      "url": "https://...",
      "size": "2720x1536"
    }
  ],
  "usage": {
    "generated_images": 3,
    "output_tokens": 48960,
    "total_tokens": 48960
  }
}
```

