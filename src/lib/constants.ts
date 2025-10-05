import { StyleOption } from '@/types';

// 文件上传配置
export const FILE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
} as const;

// 图片生成配置
export const GENERATION_CONFIG = {
  MAX_IMAGES: 8,
  MIN_IMAGES: 1,
  DEFAULT_IMAGES: 3,
  TIMEOUT: 60000, // 60秒
} as const;

// 摄影角度和拍摄方式配置
export const PHOTOGRAPHY_ANGLES = [
  {
    id: 'front-view',
    name: '正面视角',
    description: '产品正面直视角度，展示主要特征',
    prompt: 'front view, straight-on angle, centered composition, eye-level perspective',
    priority: 1, // 优先级，数字越小优先级越高
  },
  {
    id: 'three-quarter',
    name: '3/4视角',
    description: '45度角展示，显示产品立体感',
    prompt: '3/4 angle view, 45-degree perspective, dynamic composition, showing depth and dimension',
    priority: 2,
  },
  {
    id: 'top-down',
    name: '俯视角度',
    description: '自上而下拍摄，展示产品全貌',
    prompt: 'top-down view, bird\'s eye perspective, overhead shot, flat lay composition',
    priority: 3,
  },
  {
    id: 'side-profile',
    name: '侧面轮廓',
    description: '侧面拍摄，突出产品轮廓线条',
    prompt: 'side profile view, lateral perspective, silhouette emphasis, clean side angle',
    priority: 4,
  },
  {
    id: 'close-up-detail',
    name: '特写细节',
    description: '近距离拍摄，展示产品细节和质感',
    prompt: 'close-up detail shot, macro photography, texture focus, intimate perspective',
    priority: 5,
  },
  {
    id: 'diagonal-dynamic',
    name: '对角动感',
    description: '对角线构图，增加视觉动感',
    prompt: 'diagonal composition, dynamic angle, tilted perspective, energetic positioning',
    priority: 6,
  },
  {
    id: 'low-angle',
    name: '低角度仰视',
    description: '低角度仰拍，增强产品气势感',
    prompt: 'low angle view, upward perspective, heroic angle, powerful composition',
    priority: 7,
  },
  {
    id: 'high-angle',
    name: '高角度俯视',
    description: '高角度俯拍，展示产品在环境中的位置',
    prompt: 'high angle view, downward perspective, contextual positioning, environmental overview',
    priority: 8,
  }
] as const;

// 拍摄距离配置
export const PHOTOGRAPHY_DISTANCES = [
  {
    id: 'extreme-close-up',
    name: '极近特写',
    description: '极近距离，展示材质纹理',
    prompt: 'extreme close-up, macro detail, texture emphasis, material focus',
  },
  {
    id: 'close-up',
    name: '近景',
    description: '近距离拍摄，突出产品主体',
    prompt: 'close-up shot, product focus, detailed view, intimate framing',
  },
  {
    id: 'medium-shot',
    name: '中景',
    description: '中等距离，平衡产品与背景',
    prompt: 'medium shot, balanced composition, product and context, standard framing',
  },
  {
    id: 'wide-shot',
    name: '远景',
    description: '较远距离，展示产品在环境中',
    prompt: 'wide shot, environmental context, lifestyle setting, spacious composition',
  }
] as const;

// 预定义风格选项
export const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'modern-minimalist',
    name: '现代简约',
    description: '简洁现代的设计风格，突出产品本身',
    preview: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20minimalist%20product%20photography%20style&image_size=square',
    prompt: 'modern minimalist product photography, clean white background, soft diffused lighting, professional studio setup, centered composition, negative space, sleek design, contemporary aesthetic, high contrast, sharp focus, commercial quality, ultra-detailed, 4K resolution'
  },
  {
    id: 'luxury-elegant',
    name: '奢华典雅',
    description: '高端奢华的展示效果，适合高价值产品',
    preview: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20elegant%20product%20photography%20style&image_size=square',
    prompt: 'luxury elegant product photography, premium materials, sophisticated rim lighting, marble or velvet background, golden hour ambiance, dramatic shadows, high-end commercial style, refined composition, rich textures, opulent atmosphere, professional studio lighting, ultra-detailed, 4K resolution'
  },
  {
    id: 'lifestyle-casual',
    name: '生活休闲',
    description: '自然生活化的场景，贴近日常使用',
    preview: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=lifestyle%20casual%20product%20photography%20style&image_size=square',
    prompt: 'lifestyle casual product photography, natural environment, everyday use scenario, warm soft lighting, cozy home setting, organic composition, authentic atmosphere, natural textures, comfortable ambiance, relatable context, soft shadows, natural color palette, 4K resolution'
  },
  {
    id: 'creative-artistic',
    name: '创意艺术',
    description: '富有创意和艺术感的展示方式',
    preview: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=creative%20artistic%20product%20photography%20style&image_size=square',
    prompt: 'creative artistic product photography, unique composition, artistic lighting, innovative presentation, abstract elements, dynamic angles, experimental shadows, bold color schemes, avant-garde styling, conceptual design, artistic interpretation, dramatic contrasts, 4K resolution'
  },
  {
    id: 'tech-futuristic',
    name: '科技未来',
    description: '科技感十足的未来主义风格',
    preview: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=tech%20futuristic%20product%20photography%20style&image_size=square',
    prompt: 'tech futuristic product photography, high-tech environment, neon lighting, cyberpunk aesthetic, holographic elements, digital interface, sleek metallic surfaces, LED accents, sci-fi atmosphere, geometric patterns, electric blue and purple tones, ultra-modern, 4K resolution'
  },
  {
    id: 'vintage-retro',
    name: '复古怀旧',
    description: '经典复古的怀旧风格展示',
    preview: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20retro%20product%20photography%20style&image_size=square',
    prompt: 'vintage retro product photography, classic styling, warm sepia tones, nostalgic atmosphere, aged textures, film grain effect, antique props, weathered surfaces, golden hour lighting, timeless composition, heritage aesthetic, old-fashioned charm, 4K resolution'
  }
];

// API端点
export const API_ENDPOINTS = {
  UPLOAD: '/api/upload',
  GENERATE: '/api/generate',
} as const;

// 错误消息
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: '文件大小超过限制（最大10MB）',
  INVALID_FILE_TYPE: '不支持的文件类型，请上传JPG、PNG或WebP格式的图片',
  UPLOAD_FAILED: '文件上传失败，请重试',
  GENERATION_FAILED: '图片生成失败，请重试',
  NETWORK_ERROR: '网络连接错误，请检查网络后重试',
  UNKNOWN_ERROR: '发生未知错误，请稍后重试',
} as const;

// 成功消息
export const SUCCESS_MESSAGES = {
  UPLOAD_SUCCESS: '文件上传成功',
  GENERATION_SUCCESS: '图片生成完成',
} as const;