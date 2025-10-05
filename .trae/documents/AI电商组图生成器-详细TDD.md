# AI电商组图生成器 - 详细技术设计文档 (TDD)

## 1. 架构设计

### 1.1 整体架构图

```mermaid
graph TD
    A[用户浏览器] --> B[Next.js Frontend]
    B --> C[Next.js API Routes]
    C --> D[Gemini Vision API]
    C --> E[Gemini Pro API]
    C --> F[本地文件存储]
    
    subgraph "前端层"
        B
    end
    
    subgraph "后端层"
        C
    end
    
    subgraph "AI服务层"
        D
        E
    end
    
    subgraph "存储层"
        F
    end
```

### 1.2 技术架构选择依据

#### Next.js 15 选择依据

1. **App Router优势：** 提供更好的性能和开发体验
2. **Server Components：** 减少客户端JavaScript包大小
3. **API Routes：** 内置后端API支持，简化架构
4. **图像优化：** 内置图像优化功能，提升加载性能
5. **TypeScript支持：** 原生TypeScript支持，提高代码质量

#### 简化架构选择依据

1. **开发效率：** 本地开发，快速测试和迭代
2. **维护成本：** 最小化复杂度，专注核心功能
3. **性能优化：** 单用户使用，无需考虑并发
4. **部署简单：** 本地 npm run dev 即可运行

## 2. 技术栈详细说明

### 2.1 前端技术栈

#### 核心框架

* **Next.js 15.0+** - React全栈框架

* **React 18.2+** - 用户界面库

* **TypeScript 5.0+** - 类型安全的JavaScript

#### UI组件库

* **Tailwind CSS 3.4+** - 原子化CSS框架

* **Headless UI 2.0+** - 无样式组件库

* **Heroicons 2.0+** - SVG图标库

* **Framer Motion 10.0+** - 动画库

#### 状态管理

* **Zustand 4.4+** - 轻量级状态管理

* **React Hook Form 7.45+** - 表单状态管理



#### 工具库

* **clsx 2.0+** - 条件类名工具

* **date-fns 2.30+** - 日期处理库

* **file-saver 2.0+** - 文件下载工具

* **jszip 3.10+** - ZIP文件处理

### 2.2 后端技术栈

#### 核心服务

* **Next.js API Routes** - 后端API服务

* **Node.js 18+** - 运行时环境

#### AI服务集成

* **@google/genai 0.2+** - Google Gemini SDK

#### 数据处理

* **Sharp 0.32+** - 图像处理库

* **Multer 1.4+** - 文件上传中间件

#### 本地存储

* **Node.js fs模块** - 本地文件系统操作

* **path模块** - 文件路径处理

### 2.3 开发工具

#### 代码质量

* **ESLint 8.45+** - 代码检查工具

* **Prettier 3.0+** - 代码格式化工具

* **Husky 8.0+** - Git钩子工具

* **lint-staged 13.2+** - 暂存文件检查

#### 测试工具

* **Jest 29.6+** - 单元测试框架

* **Testing Library 13.4+** - React组件测试

* **Playwright 1.36+** - 端到端测试

* **MSW 1.2+** - API模拟工具

#### 本地开发

* **npm run dev** - 本地开发服务器

* **localhost部署** - 本地端口访问

## 3. 系统架构详细设计

### 3.1 前端架构

#### 组件架构

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局组件
│   ├── page.tsx           # 主页面
│   ├── globals.css        # 全局样式
│   └── api/               # API路由
├── components/            # 可复用组件
│   ├── ui/               # 基础UI组件
│   ├── forms/            # 表单组件
│   ├── layout/           # 布局组件
│   └── features/         # 功能组件
├── lib/                  # 工具库
│   ├── utils.ts          # 通用工具函数
│   ├── validations.ts    # 数据验证
│   ├── constants.ts      # 常量定义
│   └── types.ts          # 类型定义
├── hooks/                # 自定义Hooks
├── stores/               # 状态管理
└── styles/               # 样式文件
```

#### 核心组件设计

**1. ImageUploader组件**

```typescript
// components/features/ImageUploader.tsx
'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'react-hot-toast'

interface ImageUploaderProps {
  onImageUpload: (file: File) => void
  isLoading?: boolean
}

export function ImageUploader({ onImageUpload, isLoading }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    
    // 文件验证
    if (!file) return
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('文件大小不能超过10MB')
      return
    }
    
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('只支持JPG、PNG、WebP格式')
      return
    }
    
    // 创建预览
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
    
    onImageUpload(file)
  }, [onImageUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false,
    disabled: isLoading
  })

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {preview ? (
          <div className="space-y-4">
            <img 
              src={preview} 
              alt="预览" 
              className="max-h-64 mx-auto rounded-lg shadow-md"
            />
            <p className="text-sm text-gray-600">
              点击或拖拽新图片来替换
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 text-gray-400">
              <UploadIcon />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? '释放文件' : '上传产品图片'}
              </p>
              <p className="text-sm text-gray-600">
                支持JPG、PNG、WebP格式，最大10MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

**2. StyleSelector组件**

```typescript
// components/features/StyleSelector.tsx
'use client'

import { useState } from 'react'
import { RadioGroup } from '@headlessui/react'

export type ImageStyle = 'white_background' | 'modern_living' | 'cozy_bedroom' | 'office_desk' | 'outdoor_natural' | 'coffee_shop'

interface StyleOption {
  id: ImageStyle
  name: string
  description: string
  preview: string
  examples: string[]
  sceneDescription: string
}

const styleOptions: StyleOption[] = [
  {
    id: 'white_background',
    name: '纯白背景',
    description: '专业电商主图，突出产品细节',
    preview: '/previews/white-bg-preview.jpg',
    examples: ['适用于电商平台主图', '突出产品特征', '专业摄影棚效果'],
    sceneDescription: 'on a seamless, pure white background with professional studio lighting'
  },
  {
    id: 'modern_living',
    name: '现代简约客厅',
    description: '现代简约风格客厅场景，展现产品的时尚感',
    preview: '/previews/modern-living-preview.jpg',
    examples: ['适用于家居产品', '展现现代生活方式', '突出设计感'],
    sceneDescription: 'in a modern minimalist living room with clean lines, neutral colors, and contemporary furniture'
  },
  {
    id: 'cozy_bedroom',
    name: '温馨卧室',
    description: '温馨舒适的卧室环境，营造居家氛围',
    preview: '/previews/cozy-bedroom-preview.jpg',
    examples: ['适用于个人用品', '营造温馨感', '展现私密空间'],
    sceneDescription: 'in a cozy bedroom with warm lighting, soft textiles, and comfortable furnishings'
  },
  {
    id: 'office_desk',
    name: '时尚办公桌',
    description: '现代办公环境，适合展示商务产品',
    preview: '/previews/office-desk-preview.jpg',
    examples: ['适用于办公用品', '展现专业形象', '突出实用性'],
    sceneDescription: 'on a stylish modern office desk with clean workspace, natural light from window, and professional accessories'
  },
  {
    id: 'outdoor_natural',
    name: '户外自然',
    description: '自然户外环境，展现产品的活力与自然感',
    preview: '/previews/outdoor-natural-preview.jpg',
    examples: ['适用于运动产品', '展现自然活力', '突出户外使用'],
    sceneDescription: 'in a natural outdoor setting with soft sunlight, green plants, and fresh air atmosphere'
  },
  {
    id: 'coffee_shop',
    name: '咖啡厅休闲',
    description: '温馨咖啡厅环境，营造休闲生活氛围',
    preview: '/previews/coffee-shop-preview.jpg',
    examples: ['适用于生活用品', '营造休闲感', '展现社交场景'],
    sceneDescription: 'in a cozy coffee shop with warm ambient lighting, wooden tables, and relaxed atmosphere'
  }
]

interface StyleSelectorProps {
  value: ImageStyle
  onChange: (style: ImageStyle) => void
  disabled?: boolean
}

export function StyleSelector({ value, onChange, disabled }: StyleSelectorProps) {
  const [previewMode, setPreviewMode] = useState<'grid' | 'list'>('grid')
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">选择图片风格</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPreviewMode('grid')}
            className={`p-2 rounded-md ${previewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setPreviewMode('list')}
            className={`p-2 rounded-md ${previewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 12a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
            </svg>
          </button>
        </div>
      </div>
      
      <RadioGroup value={value} onChange={onChange} disabled={disabled}>
        <div className={`grid gap-4 ${
          previewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {styleOptions.map((option) => (
            <RadioGroup.Option
              key={option.id}
              value={option.id}
              className={({ active, checked }) =>
                `${active ? 'ring-2 ring-blue-500' : ''}
                 ${checked ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'}
                 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                 relative rounded-lg border border-gray-300 p-4 shadow-sm hover:shadow-md transition-all`
              }
            >
              {({ checked }) => (
                <div className={`space-y-3 ${previewMode === 'list' ? 'flex items-center space-x-4 space-y-0' : ''}`}>
                  <div className={`${previewMode === 'list' ? 'flex-shrink-0' : ''}`}>
                    <img 
                      src={option.preview} 
                      alt={option.name}
                      className={`object-cover rounded-md ${
                        previewMode === 'list' ? 'w-20 h-20' : 'w-full h-32'
                      }`}
                    />
                  </div>
                  
                  <div className={`${previewMode === 'list' ? 'flex-1' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{option.name}</h4>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                      }`}>
                        {checked && (
                          <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                    
                    <ul className="text-xs text-gray-500 space-y-1">
                      {option.examples.map((example, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-1 h-1 bg-gray-400 rounded-full mr-2" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </RadioGroup.Option>
          ))}
        </div>
      </RadioGroup>
    </div>
  )
}
```

**3. QuantitySelector组件**

```typescript
// components/features/QuantitySelector.tsx
'use client'

import { useState } from 'react'

interface QuantitySelectorProps {
  value: number
  onChange: (quantity: number) => void
  min?: number
  max?: number
  disabled?: boolean
}

export function QuantitySelector({ 
  value, 
  onChange, 
  min = 3, 
  max = 8, 
  disabled 
}: QuantitySelectorProps) {
  const [inputValue, setInputValue] = useState(value.toString())

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value)
    onChange(newValue)
    setInputValue(newValue.toString())
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    const numValue = parseInt(newValue)
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue)
    }
  }

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue)
    if (isNaN(numValue) || numValue < min || numValue > max) {
      setInputValue(value.toString())
    }
  }

  // 预估生成时间（每张图片约1.5分钟）
  const estimatedTime = Math.ceil(value * 1.5)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">生成数量</h3>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min={min}
            max={max}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            disabled={disabled}
            className="w-16 px-2 py-1 text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <span className="text-sm text-gray-600">张</span>
        </div>
      </div>

      <div className="space-y-2">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={handleSliderChange}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50"
        />
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>{min}张</span>
          <span>{max}张</span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">预估生成时间：</span>
          <span className="font-medium text-gray-900">
            约 {estimatedTime} 分钟
          </span>
        </div>
      </div>
    </div>
  )
}
```

**4. ProgressIndicator组件**

```typescript
// components/features/ProgressIndicator.tsx
'use client'

import { useEffect, useState } from 'react'

export interface GenerationProgress {
  stage: 'analyzing' | 'generating_prompts' | 'generating_images'
  progress: number
  currentImage?: number
  totalImages?: number
  message: string
  estimatedTimeRemaining?: number
}

interface ProgressIndicatorProps {
  progress: GenerationProgress
  onCancel?: () => void
}

export function ProgressIndicator({ progress, onCancel }: ProgressIndicatorProps) {
  const [timeRemaining, setTimeRemaining] = useState(progress.estimatedTimeRemaining || 0)

  useEffect(() => {
    if (progress.estimatedTimeRemaining) {
      setTimeRemaining(progress.estimatedTimeRemaining)
      
      const interval = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1))
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [progress.estimatedTimeRemaining])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStageInfo = (stage: string) => {
    switch (stage) {
      case 'analyzing':
        return { name: '分析产品', icon: '🔍', color: 'blue' }
      case 'generating_prompts':
        return { name: '生成提示词', icon: '✨', color: 'purple' }
      case 'generating_images':
        return { name: '生成图片', icon: '🎨', color: 'green' }
      default:
        return { name: '处理中', icon: '⏳', color: 'gray' }
    }
  }

  const stageInfo = getStageInfo(progress.stage)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="space-y-6">
        {/* 标题和取消按钮 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">正在生成图片</h3>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              取消
            </button>
          )}
        </div>

        {/* 当前阶段 */}
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{stageInfo.icon}</span>
          <div>
            <p className="font-medium text-gray-900">{stageInfo.name}</p>
            <p className="text-sm text-gray-600">{progress.message}</p>
          </div>
        </div>

        {/* 进度条 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">总体进度</span>
            <span className="font-medium">{Math.round(progress.progress)}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 bg-${stageInfo.color}-500`}
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>

        {/* 图片生成进度 */}
        {progress.stage === 'generating_images' && progress.currentImage && progress.totalImages && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">当前图片</span>
              <span className="font-medium">
                {progress.currentImage} / {progress.totalImages}
              </span>
            </div>
            
            <div className="mt-2 grid grid-cols-8 gap-1">
              {Array.from({ length: progress.totalImages }, (_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-sm ${
                    index < progress.currentImage
                      ? 'bg-green-500'
                      : index === progress.currentImage - 1
                      ? 'bg-blue-500 animate-pulse'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* 预估剩余时间 */}
        {timeRemaining > 0 && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              预估剩余时间：
              <span className="font-medium text-gray-900 ml-1">
                {formatTime(timeRemaining)}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
```

**5. ResultsDisplay组件（增强版）**

```typescript
// components/features/ResultsDisplay.tsx
'use client'

import { useState, useRef } from 'react'
import { GeneratedImage } from '@/lib/types'
import { ImageEditor } from './ImageEditor'
import { QualityIndicator } from './QualityIndicator'
import { DownloadManager } from './DownloadManager'

interface ResultsDisplayProps {
  images: GeneratedImage[]
  onRegenerateImage: (imageId: string) => void
  onDownload: (imageId: string, format?: string, resolution?: string) => void
  onBatchDownload: (imageIds: string[], format?: string) => void
}

export function ResultsDisplay({ 
  images, 
  onRegenerateImage, 
  onDownload, 
  onBatchDownload 
}: ResultsDisplayProps) {
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [editingImage, setEditingImage] = useState<GeneratedImage | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid')
  const [showQualityScores, setShowQualityScores] = useState(true)
  const [sortBy, setSortBy] = useState<'quality' | 'order'>('order')

  const sortedImages = [...images].sort((a, b) => {
    if (sortBy === 'quality') {
      return b.quality_score - a.quality_score
    }
    return 0 // 保持原始顺序
  })

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  const selectAllImages = () => {
    setSelectedImages(images.map(img => img.id))
  }

  const clearSelection = () => {
    setSelectedImages([])
  }

  return (
    <div className="space-y-6">
      {/* 工具栏 */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">
            生成结果 ({images.length}张)
          </h3>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('masonry')}
              className={`p-2 rounded-md ${viewMode === 'masonry' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 12a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'quality' | 'order')}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="order">按生成顺序</option>
            <option value="quality">按质量评分</option>
          </select>

          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showQualityScores}
              onChange={(e) => setShowQualityScores(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span>显示质量评分</span>
          </label>

          {selectedImages.length > 0 && (
            <DownloadManager
              selectedImages={selectedImages}
              onBatchDownload={onBatchDownload}
              onClearSelection={clearSelection}
            />
          )}
        </div>
      </div>

      {/* 批量操作栏 */}
      {selectedImages.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              已选择 {selectedImages.length} 张图片
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={selectAllImages}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                全选
              </button>
              <button
                onClick={clearSelection}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                取消选择
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 图片网格 */}
      <div className={`grid gap-4 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4'
      }`}>
        {sortedImages.map((image) => (
          <div
            key={image.id}
            className={`relative group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all ${
              selectedImages.includes(image.id) ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            {/* 选择复选框 */}
            <div className="absolute top-2 left-2 z-10">
              <input
                type="checkbox"
                checked={selectedImages.includes(image.id)}
                onChange={() => toggleImageSelection(image.id)}
                className="w-4 h-4 rounded border-gray-300 bg-white/80 backdrop-blur-sm"
              />
            </div>

            {/* 质量评分 */}
            {showQualityScores && (
              <div className="absolute top-2 right-2 z-10">
                <QualityIndicator score={image.quality_score} />
              </div>
            )}

            {/* 图片 */}
            <div className="relative">
              <img
                src={image.thumbnail || image.url}
                alt={`Generated image ${image.id}`}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
              
              {/* 悬停操作按钮 */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                <button
                  onClick={() => window.open(image.url, '_blank')}
                  className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                  title="查看大图"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                
                <button
                  onClick={() => setEditingImage(image)}
                  className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                  title="编辑图片"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                
                <button
                  onClick={() => onDownload(image.id)}
                  className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                  title="下载图片"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                
                <button
                  onClick={() => onRegenerateImage(image.id)}
                  className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                  title="重新生成"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 图片信息 */}
            <div className="p-3 space-y-2">
              <div className="text-xs text-gray-500 truncate" title={image.prompt}>
                {image.prompt}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{image.width} × {image.height}</span>
                <span>{(image.fileSize / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 图片编辑器模态框 */}
      {editingImage && (
        <ImageEditor
          image={editingImage}
          onClose={() => setEditingImage(null)}
          onSave={(editedImage) => {
            // 处理编辑后的图片
            setEditingImage(null)
          }}
        />
      )}
    </div>
  )
}
```

**6. QualityIndicator组件**

```typescript
// components/features/QualityIndicator.tsx
'use client'

interface QualityIndicatorProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function QualityIndicator({ score, size = 'sm', showLabel = false }: QualityIndicatorProps) {
  const getQualityLevel = (score: number) => {
    if (score >= 0.9) return { level: 'excellent', color: 'green', label: '优秀' }
    if (score >= 0.8) return { level: 'good', color: 'blue', label: '良好' }
    if (score >= 0.7) return { level: 'fair', color: 'yellow', label: '一般' }
    return { level: 'poor', color: 'red', label: '较差' }
  }

  const quality = getQualityLevel(score)
  const percentage = Math.round(score * 100)

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  }

  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200'
  }

  return (
    <div className="flex items-center space-x-1">
      <div
        className={`${sizeClasses[size]} ${colorClasses[quality.color]} 
          rounded-full border flex items-center justify-center font-medium`}
        title={`质量评分: ${percentage}% (${quality.label})`}
      >
        {percentage}
      </div>
      {showLabel && (
        <span className={`text-sm font-medium text-${quality.color}-600`}>
          {quality.label}
        </span>
      )}
    </div>
  )
}
```

**7. ImageEditor组件**

```typescript
// components/features/ImageEditor.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { GeneratedImage } from '@/lib/types'

interface ImageEditorProps {
  image: GeneratedImage
  onClose: () => void
  onSave: (editedImage: Blob) => void
}

export function ImageEditor({ image, onClose, onSave }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editMode, setEditMode] = useState<'crop' | 'adjust'>('crop')
  
  // 裁剪相关状态
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  
  // 调色相关状态
  const [adjustments, setAdjustments] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hue: 0
  })

  useEffect(() => {
    loadImage()
  }, [image])

  const loadImage = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      setCropArea({
        x: 0,
        y: 0,
        width: img.width,
        height: img.height
      })
      
      setIsLoading(false)
    }
    
    img.src = image.url
  }

  const applyCrop = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(cropArea.x, cropArea.y, cropArea.width, cropArea.height)
    
    canvas.width = cropArea.width
    canvas.height = cropArea.height
    ctx.putImageData(imageData, 0, 0)
  }

  const applyAdjustments = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      // 亮度调整
      data[i] = Math.min(255, Math.max(0, data[i] + adjustments.brightness))
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + adjustments.brightness))
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + adjustments.brightness))

      // 对比度调整
      const contrastFactor = (259 * (adjustments.contrast + 255)) / (255 * (259 - adjustments.contrast))
      data[i] = Math.min(255, Math.max(0, contrastFactor * (data[i] - 128) + 128))
      data[i + 1] = Math.min(255, Math.max(0, contrastFactor * (data[i + 1] - 128) + 128))
      data[i + 2] = Math.min(255, Math.max(0, contrastFactor * (data[i + 2] - 128) + 128))
    }

    ctx.putImageData(imageData, 0, 0)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob((blob) => {
      if (blob) {
        onSave(blob)
      }
    }, 'image/png')
  }

  const resetAdjustments = () => {
    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      hue: 0
    })
    loadImage() // 重新加载原始图片
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">编辑图片</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setEditMode('crop')}
              className={`px-3 py-1 rounded-md text-sm ${
                editMode === 'crop' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
              }`}
            >
              裁剪
            </button>
            <button
              onClick={() => setEditMode('adjust')}
              className={`px-3 py-1 rounded-md text-sm ${
                editMode === 'adjust' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
              }`}
            >
              调色
            </button>
          </div>
        </div>

        {/* 编辑区域 */}
        <div className="flex">
          {/* 画布区域 */}
          <div className="flex-1 p-4 bg-gray-50">
            <div className="relative inline-block">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-96 border border-gray-300"
                style={{ display: isLoading ? 'none' : 'block' }}
              />
              {isLoading && (
                <div className="w-96 h-96 bg-gray-200 animate-pulse flex items-center justify-center">
                  <span className="text-gray-500">加载中...</span>
                </div>
              )}
            </div>
          </div>

          {/* 控制面板 */}
          <div className="w-80 p-4 border-l border-gray-200 space-y-4">
            {editMode === 'crop' && (
              <div className="space-y-4">
                <h4 className="font-medium">裁剪设置</h4>
                <div className="space-y-2">
                  <label className="block text-sm text-gray-600">宽高比</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="free">自由裁剪</option>
                    <option value="1:1">1:1 (正方形)</option>
                    <option value="4:3">4:3</option>
                    <option value="16:9">16:9</option>
                    <option value="3:4">3:4 (竖版)</option>
                  </select>
                </div>
                <button
                  onClick={applyCrop}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  应用裁剪
                </button>
              </div>
            )}

            {editMode === 'adjust' && (
              <div className="space-y-4">
                <h4 className="font-medium">色彩调整</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">亮度</label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments.brightness}
                      onChange={(e) => setAdjustments(prev => ({ ...prev, brightness: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{adjustments.brightness}</span>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">对比度</label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments.contrast}
                      onChange={(e) => setAdjustments(prev => ({ ...prev, contrast: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{adjustments.contrast}</span>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">饱和度</label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments.saturation}
                      onChange={(e) => setAdjustments(prev => ({ ...prev, saturation: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{adjustments.saturation}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={applyAdjustments}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    应用调整
                  </button>
                  <button
                    onClick={resetAdjustments}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    重置
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
```

**8. DownloadManager组件**

```typescript
// components/features/DownloadManager.tsx
'use client'

import { useState } from 'react'

interface DownloadManagerProps {
  selectedImages: string[]
  onBatchDownload: (imageIds: string[], format?: string, resolution?: string) => void
  onClearSelection: () => void
}

export function DownloadManager({ 
  selectedImages, 
  onBatchDownload, 
  onClearSelection 
}: DownloadManagerProps) {
  const [showOptions, setShowOptions] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState<'jpg' | 'png' | 'webp'>('jpg')
  const [downloadResolution, setDownloadResolution] = useState<'original' | 'large' | 'medium' | 'small'>('original')

  const handleDownload = () => {
    onBatchDownload(selectedImages, downloadFormat, downloadResolution)
    setShowOptions(false)
  }

  const resolutionOptions = {
    original: '原始尺寸',
    large: '大尺寸 (2048px)',
    medium: '中等尺寸 (1024px)',
    small: '小尺寸 (512px)'
  }

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center space-x-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>下载 ({selectedImages.length})</span>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        <button
          onClick={onClearSelection}
          className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
        >
          取消选择
        </button>
      </div>

      {showOptions && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">下载格式</label>
              <div className="grid grid-cols-3 gap-2">
                {(['jpg', 'png', 'webp'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => setDownloadFormat(format)}
                    className={`px-3 py-2 text-sm rounded-md border ${
                      downloadFormat === format
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">下载尺寸</label>
              <select
                value={downloadResolution}
                onChange={(e) => setDownloadResolution(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                {Object.entries(resolutionOptions).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleDownload}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                开始下载
              </button>
              <button
                onClick={() => setShowOptions(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 3.2 后端架构

#### API路由设计

**1. 图片生成API**

```typescript
// app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import sharp from 'sharp'
import { z } from 'zod'

// 请求验证schema
const generateRequestSchema = z.object({
  style: z.enum(['white_background', 'lifestyle_scene']),
  count: z.number().min(3).max(8),
})

// 初始化Gemini客户端
const ai = new GoogleGenAI({})
// 注意：所有模型都使用统一的ai.models.generateContent方法

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File
    const style = formData.get('style') as string
    const count = parseInt(formData.get('count') as string)

    // 验证请求参数
    const validation = generateRequestSchema.safeParse({ style, count })
    if (!validation.success) {
      return NextResponse.json(
        { error: '请求参数无效', details: validation.error.errors },
        { status: 400 }
      )
    }

    // 验证图片文件
    if (!image || !image.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '请上传有效的图片文件' },
        { status: 400 }
      )
    }

    // 图片预处理
    const imageBuffer = await image.arrayBuffer()
    const processedImage = await sharp(Buffer.from(imageBuffer))
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer()

    // 步骤1: 使用Gemini Vision分析产品
    const productDescription = await analyzeProduct(processedImage)
    
    // 步骤2: 生成提示词
    const prompts = await generatePrompts(productDescription, style, count)
    
    // 步骤3: 生成图片
    const images = await generateImages(prompts)

    return NextResponse.json({
      success: true,
      images,
      metadata: {
        productDescription,
        style,
        count,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('图片生成失败:', error)
    return NextResponse.json(
      { error: '图片生成失败，请稍后重试' },
      { status: 500 }
    )
  }
}

// 产品分析函数
async function analyzeProduct(imageBuffer: Buffer): Promise<string> {
  const prompt = `
    请详细分析这张产品图片，描述产品的：
    1. 类型和名称
    2. 主要特征（颜色、材质、形状、尺寸等）
    3. 设计风格
    4. 适用场景
    
    请用简洁准确的英文描述，适合用于AI图片生成。
  `

  const contents = [
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBuffer.toString('base64'),
      },
    },
    { text: prompt },
  ]

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contents,
  })
  
  return response.text
}

// 提示词生成函数
async function generatePrompts(
  productDescription: string, 
  style: ImageStyle, 
  count: number
): Promise<string[]> {
  // 根据选择的风格获取场景描述
  const getSceneDescription = (style: ImageStyle): string => {
    const sceneMap: Record<ImageStyle, string> = {
      'white_background': 'on a seamless, pure white background with professional studio lighting',
      'modern_living': 'in a modern minimalist living room with clean lines, neutral colors, and contemporary furniture',
      'cozy_bedroom': 'in a cozy bedroom with warm lighting, soft textiles, and comfortable furnishings',
      'office_desk': 'on a stylish modern office desk with clean workspace, natural light from window, and professional accessories',
      'outdoor_natural': 'in a natural outdoor setting with soft sunlight, green plants, and fresh air atmosphere',
      'coffee_shop': 'in a cozy coffee shop with warm ambient lighting, wooden tables, and relaxed atmosphere'
    }
    return sceneMap[style] || sceneMap['white_background']
  }
  
  const sceneDescription = getSceneDescription(style)

  const metaPrompt = `
You are an expert product photography director. 
A user has provided a photo of a product, which I have identified as: "${productDescription}".
The user wants to generate ${count} images in a "${style}" style.
The scene should be: "${sceneDescription}".

Your task is to generate ${count} distinct and detailed prompts for an AI image generator. 
Each prompt must describe a different shot of the product within this exact same scene. 
The prompts should vary in angle, composition, and focus while maintaining consistency in lighting and environment.

Requirements:
- Each prompt should be detailed and specific
- Include camera angles (top-down, 45-degree, close-up, etc.)
- Specify composition and framing
- Maintain consistent lighting and environment
- Focus on different product features in each shot
- Use professional photography terminology

Output the result as a single JSON array of strings, with exactly ${count} elements.

Example format:
[
  "A top-down shot of [product] ${sceneDescription}, showcasing the overall design and proportions",
  "A 45-degree angle close-up shot focusing on [specific feature] of [product] ${sceneDescription}",
  ...
]
`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: metaPrompt,
  })
  const promptsText = response.text
  
  try {
    const prompts = JSON.parse(promptsText)
    if (Array.isArray(prompts) && prompts.length === count) {
      return prompts
    }
    throw new Error('Invalid prompts format')
  } catch (error) {
    console.error('提示词解析失败:', error)
    throw new Error('提示词生成失败')
  }
}

// 图片生成函数
async function generateImages(prompts: string[]): Promise<string[]> {
  const images: string[] = []
  
  for (const prompt of prompts) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: prompt,
      })
      
      // 处理响应中的图片数据
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data
          images.push(imageData)
          break // 只取第一张图片
        }
      }
      
      // 添加延迟避免API限流
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`图片生成失败 (prompt: ${prompt}):`, error)
      throw error
    }
  }
  
  return images
}
```

**2. 进度查询API**

```typescript
// app/api/generate/progress/route.ts
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('taskId')

  if (!taskId) {
    return NextResponse.json(
      { error: '缺少taskId参数' },
      { status: 400 }
    )
  }

  try {
    const progressFile = path.join(process.cwd(), 'temp', `progress_${taskId}.json`)
    
    if (!fs.existsSync(progressFile)) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      )
    }

    const progressData = fs.readFileSync(progressFile, 'utf-8')
    const progress = JSON.parse(progressData)
    return NextResponse.json(progress)
  } catch (error) {
    console.error('获取进度失败:', error)
    return NextResponse.json(
      { error: '获取进度失败' },
      { status: 500 }
    )
  }
}
```

### 3.3 数据流设计

#### 完整数据流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as Frontend
    participant A as API Routes
    participant V as Gemini Vision
    participant T as Gemini Text
    participant I as Gemini 2.5-flash-image
    participant S as Storage

    U->>F: 上传图片 + 选择参数
    F->>A: POST /api/generate
    A->>S: 保存任务记录
    A->>V: 分析产品图片
    V-->>A: 返回产品描述
    A->>S: 更新进度 (20%)
    A->>T: 生成提示词
    T-->>A: 返回提示词数组
    A->>R: 更新进度 (40%)
    
    loop 生成每张图片
        A->>I: 调用图片生成API
        I-->>A: 返回生成的图片
        A->>S: 存储图片
        A->>R: 更新进度
    end
    
    A-->>F: 返回生成结果
    F-->>U: 展示生成的图片
```

## 4. 性能和安全要求技术实现

### 4.1 性能要求实现

#### 4.1.1 页面加载性能优化

**目标：页面加载时间 < 3秒**

```typescript
// next.config.js - 性能优化配置
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用实验性功能
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@heroicons/react'],
  },
  
  // 图片优化
  images: {
    unoptimized: true, // 简化图片处理
    domains: ['localhost'],
  },
  
  // 压缩配置
  compress: true,
  
  // 静态资源优化
  assetPrefix: process.env.NODE_ENV === 'production' ? '/static' : '',
  
  // 构建优化
  swcMinify: true,
  
  // 头部优化
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

**前端性能优化策略：**

```typescript
// components/performance/LazyLoader.tsx
'use client'

import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// 懒加载重型组件
const ImageEditor = lazy(() => import('@/components/features/ImageEditor'))
const ResultsDisplay = lazy(() => import('@/components/features/ResultsDisplay'))

export function LazyImageEditor(props: any) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ImageEditor {...props} />
    </Suspense>
  )
}

export function LazyResultsDisplay(props: any) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResultsDisplay {...props} />
    </Suspense>
  )
}
```

```typescript
// lib/performance/imageOptimization.ts
import sharp from 'sharp'

export class ImageOptimizer {
  // 图片压缩和格式转换
  static async optimizeImage(
    buffer: Buffer, 
    options: {
      width?: number
      height?: number
      quality?: number
      format?: 'webp' | 'jpeg' | 'png'
    } = {}
  ): Promise<Buffer> {
    const { width = 1024, height = 1024, quality = 85, format = 'webp' } = options
    
    let pipeline = sharp(buffer)
      .resize(width, height, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
    
    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({ quality })
        break
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, progressive: true })
        break
      case 'png':
        pipeline = pipeline.png({ quality, progressive: true })
        break
    }
    
    return pipeline.toBuffer()
  }
  
  // 生成多种尺寸的响应式图片
  static async generateResponsiveImages(buffer: Buffer): Promise<{
    thumbnail: Buffer
    medium: Buffer
    large: Buffer
    original: Buffer
  }> {
    const [thumbnail, medium, large, original] = await Promise.all([
      this.optimizeImage(buffer, { width: 300, height: 300, quality: 80 }),
      this.optimizeImage(buffer, { width: 800, height: 800, quality: 85 }),
      this.optimizeImage(buffer, { width: 1600, height: 1600, quality: 90 }),
      this.optimizeImage(buffer, { quality: 95 })
    ])
    
    return { thumbnail, medium, large, original }
  }
}
```

#### 4.1.2 图片生成性能优化

**目标：图片生成时间 < 2分钟/张**

```typescript
// lib/services/generationService.ts
import { GeneratedImage } from '@/lib/types'

export class GenerationService {
  private static readonly GENERATION_TIMEOUT = 120000 // 2分钟超时
  
  // 顺序生成图片（简化版本）
  static async generateImages(
    prompts: string[],
    generateFunction: (prompt: string) => Promise<Buffer | null>
  ): Promise<GeneratedImage[]> {
    const results: GeneratedImage[] = []
    
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i]
      const startTime = Date.now()
      
      try {
        // 设置超时
        const timeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => reject(new Error('Generation timeout')), this.GENERATION_TIMEOUT)
        })
        
        const generationPromise = generateFunction(prompt)
        const buffer = await Promise.race([generationPromise, timeoutPromise])
        
        if (buffer) {
          const generationTime = Date.now() - startTime
          
          const result: GeneratedImage = {
            id: `img_${i + 1}`,
            url: `data:image/png;base64,${buffer.toString('base64')}`,
            thumbnail: await this.generateThumbnail(buffer),
            prompt,
            width: 1024,
            height: 1024,
            fileSize: buffer.length,
            format: 'png',
            generationTime
          }
          
          results.push(result)
        }
      } catch (error) {
        console.error(`图片生成失败 (${prompt.substring(0, 50)}...):`, error)
      }
    }
    
    return results
  }
  
  // 数组分块
  private static chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }
  
  // 生成缩略图
  private static async generateThumbnail(buffer: Buffer): Promise<string> {
    const thumbnailBuffer = await ImageOptimizer.optimizeImage(buffer, {
      width: 300,
      height: 300,
      quality: 80
    })
    return `data:image/webp;base64,${thumbnailBuffer.toString('base64')}`
  }
  
  // 计算图片质量评分
  private static async calculateQualityScore(buffer: Buffer): Promise<number> {
    // 基于图片特征计算质量评分
    const sharp = require('sharp')
    const metadata = await sharp(buffer).metadata()
    const stats = await sharp(buffer).stats()
    
    // 简单的质量评分算法
    let score = 0.7 // 基础分
    
    // 分辨率评分
    if (metadata.width >= 1024 && metadata.height >= 1024) {
      score += 0.1
    }
    
    // 清晰度评分（基于标准差）
    const avgStdDev = stats.channels.reduce((sum, ch) => sum + ch.stdev, 0) / stats.channels.length
    if (avgStdDev > 30) score += 0.1
    if (avgStdDev > 50) score += 0.1
    
    return Math.min(score, 1.0)
  }
}
```

#### 4.1.3 简化处理模式

**目标：单用户本地使用，简化处理流程**

```typescript
// lib/performance/simpleProcessor.ts
export class SimpleProcessor {
  private static isProcessing = false
  
  // 简单的单任务处理检查
  static async checkProcessingStatus(): Promise<{ allowed: boolean; message?: string }> {
    if (this.isProcessing) {
      return { 
        allowed: false, 
        message: '当前有任务正在处理中，请等待完成后再试' 
      }
    }
    
    return { allowed: true }
  }
  
  // 开始处理
  static startProcessing(): void {
    this.isProcessing = true
  }
  
  // 结束处理
  static finishProcessing(): void {
    this.isProcessing = false
  }
}
```

### 4.2 简化文件处理

#### 4.2.1 基础文件验证

```typescript
// lib/utils/fileValidator.ts
import sharp from 'sharp'

export class SimpleFileValidator {
  private static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
  
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  
  // 基础文件验证
  static async validateFile(file: File): Promise<{ valid: boolean; error?: string }> {
    // 检查文件大小
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: '文件大小不能超过10MB' }
    }
    
    // 检查MIME类型
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      return { valid: false, error: '不支持的文件格式，请上传 JPG、PNG、WebP 或 GIF 格式的图片' }
    }
    
    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      
      // 验证图片是否可读
      const metadata = await sharp(buffer).metadata()
      if (!metadata.width || !metadata.height) {
        return { valid: false, error: '无法读取图片信息，请检查文件是否损坏' }
      }
      
      return { valid: true }
    } catch (error) {
      return { valid: false, error: '文件处理失败，请重新选择图片' }
    }
  }
}
```
 
 ## 5. 兼容性要求技术保障措施
 
 ### 5.1 浏览器兼容性实现
 
 **目标：支持 Chrome 90+, Firefox 88+, Safari 14+, Edge 90+**
 
 ```typescript
 // lib/compatibility/browserDetection.ts
 export class BrowserCompatibility {
   // 检测浏览器版本
   static detectBrowser(): {
     name: string
     version: number
     isSupported: boolean
   } {
     const userAgent = navigator.userAgent
     
     // Chrome 检测
     if (userAgent.includes('Chrome/')) {
       const version = parseInt(userAgent.match(/Chrome\/(\d+)/)?.[1] || '0')
       return {
         name: 'Chrome',
         version,
         isSupported: version >= 90
       }
     }
     
     // Firefox 检测
     if (userAgent.includes('Firefox/')) {
       const version = parseInt(userAgent.match(/Firefox\/(\d+)/)?.[1] || '0')
       return {
         name: 'Firefox',
         version,
         isSupported: version >= 88
       }
     }
     
     // Safari 检测
     if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
       const version = parseInt(userAgent.match(/Version\/(\d+)/)?.[1] || '0')
       return {
         name: 'Safari',
         version,
         isSupported: version >= 14
       }
     }
     
     // Edge 检测
     if (userAgent.includes('Edg/')) {
       const version = parseInt(userAgent.match(/Edg\/(\d+)/)?.[1] || '0')
       return {
         name: 'Edge',
         version,
         isSupported: version >= 90
       }
     }
     
     return {
       name: 'Unknown',
       version: 0,
       isSupported: false
     }
   }
   
   // 检测必要的Web API支持
   static checkWebAPISupport(): {
     fileAPI: boolean
     formData: boolean
     fetch: boolean
     webp: boolean
     intersectionObserver: boolean
   } {
     return {
       fileAPI: typeof File !== 'undefined' && typeof FileReader !== 'undefined',
       formData: typeof FormData !== 'undefined',
       fetch: typeof fetch !== 'undefined',
       webp: this.checkWebPSupport(),
       intersectionObserver: typeof IntersectionObserver !== 'undefined'
     }
   }
   
   // 检测WebP支持
   private static checkWebPSupport(): boolean {
     const canvas = document.createElement('canvas')
     canvas.width = 1
     canvas.height = 1
     return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
   }
   
   // 显示兼容性警告
   static showCompatibilityWarning(): void {
     const browser = this.detectBrowser()
     const apiSupport = this.checkWebAPISupport()
     
     if (!browser.isSupported) {
       this.displayWarning(
         '浏览器版本过低',
         `您的${browser.name} ${browser.version}版本可能无法正常使用所有功能。建议升级到最新版本。`
       )
     }
     
     const unsupportedAPIs = Object.entries(apiSupport)
       .filter(([_, supported]) => !supported)
       .map(([api]) => api)
     
     if (unsupportedAPIs.length > 0) {
       this.displayWarning(
         '功能支持不完整',
         `您的浏览器不支持以下功能：${unsupportedAPIs.join(', ')}。部分功能可能无法正常使用。`
       )
     }
   }
   
   private static displayWarning(title: string, message: string): void {
     // 创建警告弹窗
     const warning = document.createElement('div')
     warning.className = 'compatibility-warning'
     warning.innerHTML = `
       <div class="warning-content">
         <h3>${title}</h3>
         <p>${message}</p>
         <button onclick="this.parentElement.parentElement.remove()">我知道了</button>
       </div>
     `
     document.body.appendChild(warning)
   }
 }
 ```
 
 ### 5.2 响应式设计技术实现
 
 **目标：支持1920x1080、1366x768、375x667分辨率**
 
 ```typescript
 // styles/responsive.css
 /* 基础响应式断点 */
 :root {
   --container-max-width: 1200px;
   --container-padding: 1rem;
   --grid-gap: 1rem;
 }
 
 /* 大屏幕 (1920x1080+) */
 @media (min-width: 1920px) {
   :root {
     --container-max-width: 1600px;
     --container-padding: 2rem;
     --grid-gap: 2rem;
   }
   
   .main-container {
     max-width: var(--container-max-width);
     margin: 0 auto;
     padding: var(--container-padding);
   }
   
   .image-grid {
     grid-template-columns: repeat(4, 1fr);
     gap: var(--grid-gap);
   }
 }
 
 /* 标准桌面 (1366x768 - 1919px) */
 @media (min-width: 1366px) and (max-width: 1919px) {
   :root {
     --container-max-width: 1200px;
     --container-padding: 1.5rem;
     --grid-gap: 1.5rem;
   }
   
   .main-container {
     max-width: var(--container-max-width);
     margin: 0 auto;
     padding: var(--container-padding);
   }
   
   .image-grid {
     grid-template-columns: repeat(3, 1fr);
     gap: var(--grid-gap);
   }
   
   .upload-area {
     min-height: 300px;
   }
 }
 
 /* 平板 (768px - 1365px) */
 @media (min-width: 768px) and (max-width: 1365px) {
   :root {
     --container-padding: 1rem;
     --grid-gap: 1rem;
   }
   
   .main-container {
     padding: var(--container-padding);
   }
   
   .image-grid {
     grid-template-columns: repeat(2, 1fr);
     gap: var(--grid-gap);
   }
   
   .controls-panel {
     flex-direction: column;
     gap: 1rem;
   }
   
   .style-selector {
     flex-direction: column;
   }
 }
 
 /* 手机 (375x667及以下) */
 @media (max-width: 767px) {
   :root {
     --container-padding: 0.75rem;
     --grid-gap: 0.75rem;
   }
   
   .main-container {
     padding: var(--container-padding);
   }
   
   .image-grid {
     grid-template-columns: 1fr;
     gap: var(--grid-gap);
   }
   
   .upload-area {
     min-height: 200px;
     padding: 1rem;
   }
   
   .controls-panel {
     flex-direction: column;
     gap: 0.75rem;
     padding: 1rem;
   }
   
   .style-option {
     padding: 0.75rem;
     font-size: 0.875rem;
   }
   
   .generate-button {
     width: 100%;
     padding: 1rem;
     font-size: 1rem;
   }
   
   /* 移动端特殊优化 */
   .image-preview {
     max-height: 60vh;
     object-fit: contain;
   }
   
   .results-grid {
     grid-template-columns: 1fr;
   }
   
   .download-button {
     width: 100%;
     margin-top: 0.5rem;
   }
 }
 ```
 
 ```typescript
 // hooks/useResponsive.ts
 'use client'
 
 import { useState, useEffect } from 'react'
 
 export type BreakpointType = 'mobile' | 'tablet' | 'desktop' | 'large'
 
 export function useResponsive() {
   const [breakpoint, setBreakpoint] = useState<BreakpointType>('desktop')
   const [windowSize, setWindowSize] = useState({
     width: 0,
     height: 0
   })
   
   useEffect(() => {
     function updateSize() {
       const width = window.innerWidth
       const height = window.innerHeight
       
       setWindowSize({ width, height })
       
       if (width < 768) {
         setBreakpoint('mobile')
       } else if (width < 1366) {
         setBreakpoint('tablet')
       } else if (width < 1920) {
         setBreakpoint('desktop')
       } else {
         setBreakpoint('large')
       }
     }
     
     updateSize()
     window.addEventListener('resize', updateSize)
     
     return () => window.removeEventListener('resize', updateSize)
   }, [])
   
   return {
     breakpoint,
     windowSize,
     isMobile: breakpoint === 'mobile',
     isTablet: breakpoint === 'tablet',
     isDesktop: breakpoint === 'desktop',
     isLarge: breakpoint === 'large'
   }
 }
 ```
 
 ### 5.3 设备适配技术方案
 
 ```typescript
 // components/adaptive/AdaptiveLayout.tsx
 'use client'
 
 import { useResponsive } from '@/hooks/useResponsive'
 import { ReactNode } from 'react'
 
 interface AdaptiveLayoutProps {
   children: ReactNode
 }
 
 export function AdaptiveLayout({ children }: AdaptiveLayoutProps) {
   const { breakpoint, isMobile } = useResponsive()
   
   return (
     <div className={`adaptive-layout layout-${breakpoint}`}>
       {/* 移动端导航 */}
       {isMobile && (
         <div className="mobile-header">
           <h1 className="text-lg font-bold">AI商品图生成器</h1>
         </div>
       )}
       
       {/* 主要内容区域 */}
       <main className="main-content">
         {children}
       </main>
       
       {/* 移动端底部操作栏 */}
       {isMobile && (
         <div className="mobile-footer">
           <div className="footer-actions">
             {/* 移动端特殊操作按钮 */}
           </div>
         </div>
       )}
     </div>
   )
 }
 ```
 
 ```typescript
 // components/adaptive/AdaptiveImageGrid.tsx
 'use client'
 
 import { useResponsive } from '@/hooks/useResponsive'
 import { GeneratedImage } from '@/lib/types'
 
 interface AdaptiveImageGridProps {
   images: GeneratedImage[]
 }
 
 export function AdaptiveImageGrid({ images }: AdaptiveImageGridProps) {
   const { breakpoint, isMobile } = useResponsive()
   
   // 根据设备类型调整网格列数
   const getGridColumns = () => {
     switch (breakpoint) {
       case 'mobile': return 1
       case 'tablet': return 2
       case 'desktop': return 3
       case 'large': return 4
       default: return 2
     }
   }
   
   const gridStyle = {
     gridTemplateColumns: `repeat(${getGridColumns()}, 1fr)`
   }
   
   return (
     <div 
       className="adaptive-image-grid"
       style={gridStyle}
     >
       {images.map((image, index) => (
         <div key={image.id} className="image-item">
           <img
             src={image.url}
             alt={`Generated image ${index + 1}`}
             className="w-full h-auto rounded-lg"
             loading="lazy"
           />
           
           {/* 移动端显示简化信息 */}
           {isMobile ? (
             <div className="mobile-image-info">
               <span className="quality-score">
                 评分: {(image.quality_score * 100).toFixed(0)}
               </span>
             </div>
           ) : (
             <div className="desktop-image-info">
               <div className="image-details">
                 <span>质量评分: {(image.quality_score * 100).toFixed(0)}</span>
                 <span>尺寸: {image.width}x{image.height}</span>
                 <span>大小: {(image.fileSize / 1024).toFixed(1)}KB</span>
               </div>
             </div>
           )}
         </div>
       ))}
     </div>
   )
 }
 ```
 
 ### 5.4 桌面端性能优化
 
 ```typescript
 // lib/performance/desktopOptimization.ts
 export class DesktopOptimization {
   // 简化的性能配置
   static getOptimizedConfig() {
     return {
       imageQuality: 85,
       enableAnimations: true,
       preloadImages: false, // 简化预加载逻辑
       maxFileSize: 10 * 1024 * 1024 // 10MB
     }
   }
   
   // 图片质量设置
   static getImageQuality(): number {
     return 85 // 固定质量，简化配置
   }
 }
 ```
 
 ## 6. UI设计规范和技术实现方案
 
 ### 6.1 设计系统配置
 
 **主色调：蓝色系（#2563EB）**
 **辅助色：绿色（#10B981）表示成功，红色（#EF4444）表示错误**
 **字体：中文使用苹方/微软雅黑，英文使用Inter/Roboto**
 **采用12列栅格系统**
 **使用Heroicons图标库**
 
 ```typescript
 // tailwind.config.js - 设计系统配置
 /** @type {import('tailwindcss').Config} */
 module.exports = {
   content: [
     './pages/**/*.{js,ts,jsx,tsx,mdx}',
     './components/**/*.{js,ts,jsx,tsx,mdx}',
     './app/**/*.{js,ts,jsx,tsx,mdx}',
   ],
   theme: {
     extend: {
       // 主色调配置
       colors: {
         primary: {
           50: '#eff6ff',
           100: '#dbeafe',
           200: '#bfdbfe',
           300: '#93c5fd',
           400: '#60a5fa',
           500: '#3b82f6',
           600: '#2563eb', // 主色调
           700: '#1d4ed8',
           800: '#1e40af',
           900: '#1e3a8a',
         },
         success: {
           50: '#ecfdf5',
           100: '#d1fae5',
           200: '#a7f3d0',
           300: '#6ee7b7',
           400: '#34d399',
           500: '#10b981', // 成功色
           600: '#059669',
           700: '#047857',
           800: '#065f46',
           900: '#064e3b',
         },
         error: {
           50: '#fef2f2',
           100: '#fee2e2',
           200: '#fecaca',
           300: '#fca5a5',
           400: '#f87171',
           500: '#ef4444', // 错误色
           600: '#dc2626',
           700: '#b91c1c',
           800: '#991b1b',
           900: '#7f1d1d',
         },
         neutral: {
           50: '#f9fafb',
           100: '#f3f4f6',
           200: '#e5e7eb',
           300: '#d1d5db',
           400: '#9ca3af',
           500: '#6b7280',
           600: '#4b5563',
           700: '#374151',
           800: '#1f2937',
           900: '#111827',
         }
       },
       
       // 字体配置
       fontFamily: {
         'sans': [
           'Inter', 
           'PingFang SC', 
           'Microsoft YaHei', 
           'Roboto', 
           'system-ui', 
           'sans-serif'
         ],
         'mono': ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace']
       },
       
       // 12列栅格系统
       gridTemplateColumns: {
         '12': 'repeat(12, minmax(0, 1fr))',
         'auto-fit': 'repeat(auto-fit, minmax(250px, 1fr))',
         'auto-fill': 'repeat(auto-fill, minmax(200px, 1fr))'
       },
       
       // 间距系统
       spacing: {
         '18': '4.5rem',
         '88': '22rem',
         '128': '32rem'
       },
       
       // 阴影系统
       boxShadow: {
         'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
         'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
         'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.04)'
       },
       
       // 动画配置
       animation: {
         'fade-in': 'fadeIn 0.5s ease-in-out',
         'slide-up': 'slideUp 0.3s ease-out',
         'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
         'bounce-gentle': 'bounceGentle 1s ease-in-out infinite'
       },
       
       keyframes: {
         fadeIn: {
           '0%': { opacity: '0' },
           '100%': { opacity: '1' }
         },
         slideUp: {
           '0%': { transform: 'translateY(10px)', opacity: '0' },
           '100%': { transform: 'translateY(0)', opacity: '1' }
         },
         bounceGentle: {
           '0%, 100%': { transform: 'translateY(-5%)' },
           '50%': { transform: 'translateY(0)' }
         }
       }
     },
   },
   plugins: [
     require('@tailwindcss/forms'),
     require('@tailwindcss/typography'),
     require('@tailwindcss/aspect-ratio')
   ],
 }
 ```
 
 ### 6.2 组件设计系统
 
 ```typescript
 // components/ui/DesignSystem.tsx
 'use client'
 
 import { ReactNode } from 'react'
 import { cva, type VariantProps } from 'class-variance-authority'
 import { cn } from '@/lib/utils'
 
 // 按钮组件变体
 const buttonVariants = cva(
   "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
   {
     variants: {
       variant: {
         primary: "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800",
         secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300",
         success: "bg-success-500 text-white hover:bg-success-600 active:bg-success-700",
         error: "bg-error-500 text-white hover:bg-error-600 active:bg-error-700",
         outline: "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100",
         ghost: "text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200"
       },
       size: {
         sm: "h-8 px-3 text-xs",
         md: "h-10 px-4 text-sm",
         lg: "h-12 px-6 text-base",
         xl: "h-14 px-8 text-lg"
       }
     },
     defaultVariants: {
       variant: "primary",
       size: "md"
     }
   }
 )
 
 interface ButtonProps 
   extends React.ButtonHTMLAttributes<HTMLButtonElement>,
     VariantProps<typeof buttonVariants> {
   children: ReactNode
 }
 
 export function Button({ className, variant, size, children, ...props }: ButtonProps) {
   return (
     <button
       className={cn(buttonVariants({ variant, size, className }))}
       {...props}
     >
       {children}
     </button>
   )
 }
 
 // 卡片组件
 const cardVariants = cva(
   "rounded-xl border bg-white shadow-soft transition-shadow",
   {
     variants: {
       variant: {
         default: "border-neutral-200",
         elevated: "border-neutral-200 shadow-medium hover:shadow-strong",
         outlined: "border-2 border-primary-200 bg-primary-50/30"
       },
       padding: {
         none: "p-0",
         sm: "p-4",
         md: "p-6",
         lg: "p-8"
       }
     },
     defaultVariants: {
       variant: "default",
       padding: "md"
     }
   }
 )
 
 interface CardProps 
   extends React.HTMLAttributes<HTMLDivElement>,
     VariantProps<typeof cardVariants> {
   children: ReactNode
 }
 
 export function Card({ className, variant, padding, children, ...props }: CardProps) {
   return (
     <div
       className={cn(cardVariants({ variant, padding, className }))}
       {...props}
     >
       {children}
     </div>
   )
 }
 
 // 输入框组件
 const inputVariants = cva(
   "flex w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
   {
     variants: {
       variant: {
         default: "border-neutral-300 focus:border-primary-500",
         error: "border-error-300 focus:border-error-500 focus-visible:ring-error-500",
         success: "border-success-300 focus:border-success-500 focus-visible:ring-success-500"
       },
       size: {
         sm: "h-8 px-2 text-xs",
         md: "h-10 px-3 text-sm",
         lg: "h-12 px-4 text-base"
       }
     },
     defaultVariants: {
       variant: "default",
       size: "md"
     }
   }
 )
 
 interface InputProps 
   extends React.InputHTMLAttributes<HTMLInputElement>,
     VariantProps<typeof inputVariants> {}
 
 export function Input({ className, variant, size, ...props }: InputProps) {
   return (
     <input
       className={cn(inputVariants({ variant, size, className }))}
       {...props}
     />
   )
 }
 ```
 
 ### 6.3 图标系统集成
 
 ```typescript
 // components/ui/Icons.tsx
 'use client'
 
 import {
   PhotoIcon,
   CloudArrowUpIcon,
   Cog6ToothIcon,
   SparklesIcon,
   DownloadIcon,
   EyeIcon,
   PencilIcon,
   TrashIcon,
   CheckCircleIcon,
   XCircleIcon,
   ExclamationTriangleIcon,
   InformationCircleIcon,
   ArrowPathIcon,
   PlusIcon,
   MinusIcon,
   HeartIcon,
   ShareIcon,
   AdjustmentsHorizontalIcon,
   MagnifyingGlassIcon,
   Bars3Icon,
   XMarkIcon
 } from '@heroicons/react/24/outline'
 
 import {
   PhotoIcon as PhotoIconSolid,
   CloudArrowUpIcon as CloudArrowUpIconSolid,
   SparklesIcon as SparklesIconSolid,
   CheckCircleIcon as CheckCircleIconSolid,
   XCircleIcon as XCircleIconSolid,
   ExclamationTriangleIcon as ExclamationTriangleIconSolid,
   InformationCircleIcon as InformationCircleIconSolid,
   HeartIcon as HeartIconSolid
 } from '@heroicons/react/24/solid'
 
 // 图标映射
 export const Icons = {
   // 功能图标
   photo: PhotoIcon,
   photoSolid: PhotoIconSolid,
   upload: CloudArrowUpIcon,
   uploadSolid: CloudArrowUpIconSolid,
   settings: Cog6ToothIcon,
   generate: SparklesIcon,
   generateSolid: SparklesIconSolid,
   download: DownloadIcon,
   view: EyeIcon,
   edit: PencilIcon,
   delete: TrashIcon,
   loading: ArrowPathIcon,
   plus: PlusIcon,
   minus: MinusIcon,
   search: MagnifyingGlassIcon,
   menu: Bars3Icon,
   close: XMarkIcon,
   adjustments: AdjustmentsHorizontalIcon,
   
   // 状态图标
   success: CheckCircleIcon,
   successSolid: CheckCircleIconSolid,
   error: XCircleIcon,
   errorSolid: XCircleIconSolid,
   warning: ExclamationTriangleIcon,
   warningSolid: ExclamationTriangleIconSolid,
   info: InformationCircleIcon,
   infoSolid: InformationCircleIconSolid,
   
   // 交互图标
   heart: HeartIcon,
   heartSolid: HeartIconSolid,
   share: ShareIcon
 }
 
 // 图标组件
 interface IconProps {
   name: keyof typeof Icons
   className?: string
   size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 }
 
 const iconSizes = {
   xs: 'w-3 h-3',
   sm: 'w-4 h-4',
   md: 'w-5 h-5',
   lg: 'w-6 h-6',
   xl: 'w-8 h-8'
 }
 
 export function Icon({ name, className = '', size = 'md' }: IconProps) {
   const IconComponent = Icons[name]
   
   if (!IconComponent) {
     console.warn(`Icon "${name}" not found`)
     return null
   }
   
   return (
     <IconComponent 
       className={cn(iconSizes[size], className)} 
     />
   )
 }
 ```
 
 ### 6.4 布局系统
 
 ```typescript
 // components/layout/GridSystem.tsx
 'use client'
 
 import { ReactNode } from 'react'
 import { cn } from '@/lib/utils'
 
 // 12列栅格容器
 interface ContainerProps {
   children: ReactNode
   className?: string
   maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
 }
 
 const containerSizes = {
   sm: 'max-w-screen-sm',
   md: 'max-w-screen-md', 
   lg: 'max-w-screen-lg',
   xl: 'max-w-screen-xl',
   '2xl': 'max-w-screen-2xl',
   full: 'max-w-full'
 }
 
 export function Container({ children, className = '', maxWidth = 'xl' }: ContainerProps) {
   return (
     <div className={cn(
       'mx-auto px-4 sm:px-6 lg:px-8',
       containerSizes[maxWidth],
       className
     )}>
       {children}
     </div>
   )
 }
 
 // 栅格行
 interface RowProps {
   children: ReactNode
   className?: string
   gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
 }
 
 const gapSizes = {
   none: 'gap-0',
   sm: 'gap-2',
   md: 'gap-4',
   lg: 'gap-6',
   xl: 'gap-8'
 }
 
 export function Row({ children, className = '', gap = 'md' }: RowProps) {
   return (
     <div className={cn(
       'grid grid-cols-12',
       gapSizes[gap],
       className
     )}>
       {children}
     </div>
   )
 }
 
 // 栅格列
 interface ColProps {
   children: ReactNode
   className?: string
   span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
   spanSm?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
   spanMd?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
   spanLg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
   spanXl?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
 }
 
 export function Col({ 
   children, 
   className = '', 
   span = 12,
   spanSm,
   spanMd,
   spanLg,
   spanXl
 }: ColProps) {
   const colClasses = cn(
     `col-span-${span}`,
     spanSm && `sm:col-span-${spanSm}`,
     spanMd && `md:col-span-${spanMd}`,
     spanLg && `lg:col-span-${spanLg}`,
     spanXl && `xl:col-span-${spanXl}`,
     className
   )
   
   return (
     <div className={colClasses}>
       {children}
     </div>
   )
 }
 ```
 
 ### 6.5 主题化组件实现
 
 ```typescript
 // components/themed/ThemedComponents.tsx
 'use client'
 
 import { Button, Card, Input, Icon } from '@/components/ui/DesignSystem'
 import { Container, Row, Col } from '@/components/layout/GridSystem'
 
 // 主题化上传区域
 export function ThemedUploadArea() {
   return (
     <Card variant="outlined" padding="lg" className="text-center">
       <div className="space-y-4">
         <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
           <Icon name="uploadSolid" size="xl" className="text-primary-600" />
         </div>
         
         <div className="space-y-2">
           <h3 className="text-lg font-semibold text-neutral-900">
             上传商品图片
           </h3>
           <p className="text-sm text-neutral-600">
             支持 JPG、PNG、WebP 格式，最大 10MB
           </p>
         </div>
         
         <Button variant="primary" size="lg" className="w-full sm:w-auto">
           <Icon name="photo" size="sm" className="mr-2" />
           选择图片
         </Button>
       </div>
     </Card>
   )
 }
 
 // 主题化风格选择器
 export function ThemedStyleSelector() {
   const styles = [
     {
       id: 'white_background',
       name: '纯白背景',
       description: '专业产品摄影，突出商品细节',
       icon: 'photo'
     },
     {
       id: 'modern_living',
       name: '现代客厅',
       description: '时尚家居环境，展现生活场景',
       icon: 'view'
     },
     {
       id: 'cozy_bedroom',
       name: '温馨卧室',
       description: '舒适私密空间，营造温馨氛围',
       icon: 'heart'
     }
   ]
   
   return (
     <div className="space-y-4">
       <h3 className="text-lg font-semibold text-neutral-900">
         选择拍摄风格
       </h3>
       
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {styles.map((style) => (
           <Card 
             key={style.id}
             variant="default"
             padding="md"
             className="cursor-pointer hover:shadow-medium transition-all duration-200 hover:border-primary-300"
           >
             <div className="space-y-3">
               <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                   <Icon name={style.icon as any} className="text-primary-600" />
                 </div>
                 <div>
                   <h4 className="font-medium text-neutral-900">{style.name}</h4>
                 </div>
               </div>
               <p className="text-sm text-neutral-600">{style.description}</p>
             </div>
           </Card>
         ))}
       </div>
     </div>
   )
 }
 
 // 主题化结果展示
 export function ThemedResultsDisplay() {
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <h3 className="text-lg font-semibold text-neutral-900">
           生成结果
         </h3>
         <Button variant="outline" size="sm">
           <Icon name="download" size="sm" className="mr-2" />
           下载全部
         </Button>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {/* 图片卡片示例 */}
         <Card variant="default" padding="none" className="overflow-hidden">
           <div className="aspect-square bg-neutral-100 relative">
             {/* 图片占位 */}
             <div className="absolute inset-0 flex items-center justify-center">
               <Icon name="photo" size="xl" className="text-neutral-400" />
             </div>
             
             {/* 质量评分 */}
             <div className="absolute top-2 right-2">
               <div className="bg-success-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                 95分
               </div>
             </div>
           </div>
           
           <div className="p-4 space-y-3">
             <div className="flex items-center justify-between">
               <span className="text-sm text-neutral-600">1024×1024</span>
               <span className="text-sm text-neutral-600">2.3MB</span>
             </div>
             
             <div className="flex space-x-2">
               <Button variant="primary" size="sm" className="flex-1">
                 <Icon name="download" size="sm" className="mr-1" />
                 下载
               </Button>
               <Button variant="outline" size="sm">
                 <Icon name="edit" size="sm" />
               </Button>
               <Button variant="outline" size="sm">
                 <Icon name="view" size="sm" />
               </Button>
             </div>
           </div>
         </Card>
       </div>
     </div>
   )
 }
 ```
 
 ### 6.6 响应式设计实现
 
 ```typescript
 // components/responsive/ResponsiveLayout.tsx
 'use client'
 
 import { useResponsive } from '@/hooks/useResponsive'
 import { Container, Row, Col } from '@/components/layout/GridSystem'
 import { 
   ThemedUploadArea, 
   ThemedStyleSelector, 
   ThemedResultsDisplay 
 } from '@/components/themed/ThemedComponents'
 
 export function ResponsiveMainLayout() {
   const { isMobile, isTablet } = useResponsive()
   
   return (
     <Container maxWidth="2xl" className="py-8">
       <Row gap={isMobile ? 'md' : 'lg'}>
         {/* 左侧控制面板 */}
         <Col 
           span={12} 
           spanLg={4} 
           spanXl={3}
           className="space-y-6"
         >
           <ThemedUploadArea />
           <ThemedStyleSelector />
           
           {/* 移动端隐藏的额外控制 */}
           {!isMobile && (
             <Card variant="default" padding="md">
               <h4 className="font-medium text-neutral-900 mb-3">
                 高级设置
               </h4>
               <div className="space-y-3">
                 <div>
                   <label className="text-sm text-neutral-600 mb-1 block">
                     生成数量
                   </label>
                   <Input type="number" min="1" max="8" defaultValue="4" />
                 </div>
                 <div>
                   <label className="text-sm text-neutral-600 mb-1 block">
                     图片质量
                   </label>
                   <select className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm">
                     <option value="high">高质量</option>
                     <option value="medium">中等质量</option>
                     <option value="low">快速生成</option>
                   </select>
                 </div>
               </div>
             </Card>
           )}
         </Col>
         
         {/* 右侧主要内容区域 */}
         <Col 
           span={12} 
           spanLg={8} 
           spanXl={9}
         >
           <ThemedResultsDisplay />
         </Col>
       </Row>
     </Container>
   )
 }
  ```
  
  ## 7. 预设场景模板实现
  
  ### 7.1 场景模板数据结构
  
  ```typescript
  // types/scene.ts
  export interface SceneTemplate {
    id: string
    name: string
    description: string
    category: 'indoor' | 'outdoor' | 'studio'
    thumbnail: string
    prompt: {
      base: string
      lighting: string
      environment: string
      style: string
      quality: string
    }
    settings: {
      aspectRatio: '1:1' | '16:9' | '4:3' | '3:4'
      resolution: '512x512' | '1024x1024' | '1920x1080'
      quality: 'standard' | 'high' | 'ultra'
    }
    tags: string[]
    isPopular: boolean
    usageCount: number
  }
  
  export interface SceneCategory {
    id: string
    name: string
    description: string
    icon: string
    scenes: SceneTemplate[]
  }
  ```
  
  ### 7.2 预设场景模板配置
  
  ```typescript
  // data/sceneTemplates.ts
  import { SceneTemplate, SceneCategory } from '@/types/scene'
  
  // 1. 现代简约客厅场景
  const modernLivingRoom: SceneTemplate = {
    id: 'modern_living_room',
    name: '现代简约客厅',
    description: '时尚简约的现代客厅环境，突出产品的现代感和实用性',
    category: 'indoor',
    thumbnail: '/images/scenes/modern-living-room.jpg',
    prompt: {
      base: 'modern minimalist living room with clean lines and neutral colors',
      lighting: 'soft natural lighting from large windows, warm ambient lighting',
      environment: 'spacious living room with modern furniture, white walls, wooden floors',
      style: 'contemporary, minimalist, Scandinavian design',
      quality: 'professional interior photography, high resolution, sharp focus'
    },
    settings: {
      aspectRatio: '16:9',
      resolution: '1920x1080',
      quality: 'high'
    },
    tags: ['现代', '简约', '客厅', '家居', '时尚'],
    isPopular: true,
    usageCount: 1250
  }
  
  // 2. 温馨卧室场景
  const cozyBedroom: SceneTemplate = {
    id: 'cozy_bedroom',
    name: '温馨卧室场景',
    description: '舒适温馨的卧室环境，营造私密温暖的氛围',
    category: 'indoor',
    thumbnail: '/images/scenes/cozy-bedroom.jpg',
    prompt: {
      base: 'cozy warm bedroom with soft textures and comfortable atmosphere',
      lighting: 'warm golden hour lighting, soft bedside lamps, gentle shadows',
      environment: 'comfortable bedroom with soft bedding, warm colors, personal touches',
      style: 'cozy, intimate, hygge style, warm tones',
      quality: 'lifestyle photography, warm color grading, soft focus'
    },
    settings: {
      aspectRatio: '4:3',
      resolution: '1024x1024',
      quality: 'high'
    },
    tags: ['温馨', '卧室', '舒适', '私密', '暖色调'],
    isPopular: true,
    usageCount: 980
  }
  
  // 3. 时尚办公桌场景
  const fashionOfficeDesk: SceneTemplate = {
    id: 'fashion_office_desk',
    name: '时尚办公桌场景',
    description: '现代化办公环境，展现产品的专业性和商务感',
    category: 'indoor',
    thumbnail: '/images/scenes/fashion-office-desk.jpg',
    prompt: {
      base: 'modern stylish office desk setup with professional atmosphere',
      lighting: 'bright clean lighting, natural daylight, minimal shadows',
      environment: 'organized desk with modern computer, plants, clean workspace',
      style: 'professional, modern, business casual, tech-savvy',
      quality: 'commercial photography, crisp details, professional lighting'
    },
    settings: {
      aspectRatio: '16:9',
      resolution: '1920x1080',
      quality: 'ultra'
    },
    tags: ['办公', '商务', '专业', '现代', '科技'],
    isPopular: true,
    usageCount: 756
  }
  
  // 4. 户外自然场景
  const outdoorNature: SceneTemplate = {
    id: 'outdoor_nature',
    name: '户外自然场景',
    description: '清新自然的户外环境，展现产品的自然亲和力',
    category: 'outdoor',
    thumbnail: '/images/scenes/outdoor-nature.jpg',
    prompt: {
      base: 'beautiful natural outdoor setting with fresh air and greenery',
      lighting: 'natural sunlight, golden hour, soft outdoor lighting',
      environment: 'lush green landscape, trees, natural background, fresh air',
      style: 'natural, organic, eco-friendly, fresh and clean',
      quality: 'nature photography, vibrant colors, natural lighting'
    },
    settings: {
      aspectRatio: '3:4',
      resolution: '1024x1024',
      quality: 'high'
    },
    tags: ['户外', '自然', '绿色', '清新', '环保'],
    isPopular: false,
    usageCount: 432
  }
  
  // 5. 咖啡厅休闲场景
  const cafeLeisure: SceneTemplate = {
    id: 'cafe_leisure',
    name: '咖啡厅休闲场景',
    description: '轻松惬意的咖啡厅环境，营造休闲生活氛围',
    category: 'indoor',
    thumbnail: '/images/scenes/cafe-leisure.jpg',
    prompt: {
      base: 'cozy coffee shop atmosphere with relaxed and comfortable vibe',
      lighting: 'warm ambient lighting, soft cafe lighting, window light',
      environment: 'coffee shop interior with wooden tables, comfortable seating, coffee aroma',
      style: 'casual, relaxed, bohemian, artisanal, lifestyle',
      quality: 'lifestyle photography, warm tones, inviting atmosphere'
    },
    settings: {
      aspectRatio: '1:1',
      resolution: '1024x1024',
      quality: 'standard'
    },
    tags: ['咖啡厅', '休闲', '轻松', '生活方式', '社交'],
    isPopular: true,
    usageCount: 623
  }
  
  // 场景分类
  export const sceneCategories: SceneCategory[] = [
    {
      id: 'indoor',
      name: '室内场景',
      description: '各种室内环境，适合展示家居、办公用品等',
      icon: 'home',
      scenes: [modernLivingRoom, cozyBedroom, fashionOfficeDesk, cafeLeisure]
    },
    {
      id: 'outdoor',
      name: '户外场景',
      description: '自然户外环境，适合展示运动、旅行用品等',
      icon: 'sun',
      scenes: [outdoorNature]
    },
    {
      id: 'studio',
      name: '工作室场景',
      description: '专业摄影棚环境，适合产品特写和商业摄影',
      icon: 'camera',
      scenes: []
    }
  ]
  
  // 获取所有场景模板
  export const getAllScenes = (): SceneTemplate[] => {
    return sceneCategories.flatMap(category => category.scenes)
  }
  
  // 获取热门场景
  export const getPopularScenes = (): SceneTemplate[] => {
    return getAllScenes()
      .filter(scene => scene.isPopular)
      .sort((a, b) => b.usageCount - a.usageCount)
  }
  
  // 根据ID获取场景
  export const getSceneById = (id: string): SceneTemplate | undefined => {
    return getAllScenes().find(scene => scene.id === id)
  }
  
  // 根据分类获取场景
  export const getScenesByCategory = (categoryId: string): SceneTemplate[] => {
    const category = sceneCategories.find(cat => cat.id === categoryId)
    return category ? category.scenes : []
  }
  ```
  
  ### 7.3 场景选择器组件
  
  ```typescript
  // components/scene/SceneSelector.tsx
  'use client'
  
  import { useState } from 'react'
  import { SceneTemplate, SceneCategory } from '@/types/scene'
  import { sceneCategories, getPopularScenes } from '@/data/sceneTemplates'
  import { Button, Card, Icon } from '@/components/ui/DesignSystem'
  import { cn } from '@/lib/utils'
  
  interface SceneSelectorProps {
    selectedScene?: SceneTemplate
    onSceneSelect: (scene: SceneTemplate) => void
    className?: string
  }
  
  export function SceneSelector({ 
    selectedScene, 
    onSceneSelect, 
    className 
  }: SceneSelectorProps) {
    const [activeCategory, setActiveCategory] = useState<string>('popular')
    const [showPreview, setShowPreview] = useState<SceneTemplate | null>(null)
    
    const popularScenes = getPopularScenes()
    
    const getCurrentScenes = () => {
      if (activeCategory === 'popular') {
        return popularScenes
      }
      const category = sceneCategories.find(cat => cat.id === activeCategory)
      return category ? category.scenes : []
    }
    
    return (
      <div className={cn('space-y-6', className)}>
        {/* 分类标签 */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeCategory === 'popular' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory('popular')}
          >
            <Icon name="heart" size="sm" className="mr-1" />
            热门推荐
          </Button>
          
          {sceneCategories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(category.id)}
            >
              <Icon name={category.icon as any} size="sm" className="mr-1" />
              {category.name}
            </Button>
          ))}
        </div>
        
        {/* 场景网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getCurrentScenes().map((scene) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              isSelected={selectedScene?.id === scene.id}
              onSelect={() => onSceneSelect(scene)}
              onPreview={() => setShowPreview(scene)}
            />
          ))}
        </div>
        
        {/* 场景预览模态框 */}
        {showPreview && (
          <ScenePreviewModal
            scene={showPreview}
            onClose={() => setShowPreview(null)}
            onSelect={() => {
              onSceneSelect(showPreview)
              setShowPreview(null)
            }}
          />
        )}
      </div>
    )
  }
  
  // 场景卡片组件
  interface SceneCardProps {
    scene: SceneTemplate
    isSelected: boolean
    onSelect: () => void
    onPreview: () => void
  }
  
  function SceneCard({ scene, isSelected, onSelect, onPreview }: SceneCardProps) {
    return (
      <Card
        variant={isSelected ? 'outlined' : 'default'}
        padding="none"
        className={cn(
          'cursor-pointer transition-all duration-200 hover:shadow-medium',
          isSelected && 'ring-2 ring-primary-500 ring-offset-2'
        )}
        onClick={onSelect}
      >
        {/* 缩略图 */}
        <div className="aspect-video bg-neutral-100 relative overflow-hidden rounded-t-xl">
          <img
            src={scene.thumbnail}
            alt={scene.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // 缩略图加载失败时显示占位符
              e.currentTarget.style.display = 'none'
            }}
          />
          
          {/* 占位符 */}
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
            <Icon name="photo" size="xl" className="text-neutral-400" />
          </div>
          
          {/* 热门标签 */}
          {scene.isPopular && (
            <div className="absolute top-2 left-2">
              <div className="bg-error-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
                <Icon name="heart" size="xs" className="mr-1" />
                热门
              </div>
            </div>
          )}
          
          {/* 预览按钮 */}
          <div className="absolute top-2 right-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onPreview()
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Icon name="view" size="sm" />
            </Button>
          </div>
          
          {/* 使用次数 */}
          <div className="absolute bottom-2 right-2">
            <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
              {scene.usageCount.toLocaleString()} 次使用
            </div>
          </div>
        </div>
        
        {/* 场景信息 */}
        <div className="p-4 space-y-3">
          <div>
            <h4 className="font-medium text-neutral-900">{scene.name}</h4>
            <p className="text-sm text-neutral-600 mt-1">{scene.description}</p>
          </div>
          
          {/* 标签 */}
          <div className="flex flex-wrap gap-1">
            {scene.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
            {scene.tags.length > 3 && (
              <span className="text-xs text-neutral-400">
                +{scene.tags.length - 3}
              </span>
            )}
          </div>
          
          {/* 设置信息 */}
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>{scene.settings.aspectRatio}</span>
            <span>{scene.settings.resolution}</span>
            <span className="capitalize">{scene.settings.quality}</span>
          </div>
        </div>
      </Card>
    )
  }
  ```
  
  ### 7.4 场景预览模态框
  
  ```typescript
  // components/scene/ScenePreviewModal.tsx
  'use client'
  
  import { SceneTemplate } from '@/types/scene'
  import { Button, Card, Icon } from '@/components/ui/DesignSystem'
  import { cn } from '@/lib/utils'
  
  interface ScenePreviewModalProps {
    scene: SceneTemplate
    onClose: () => void
    onSelect: () => void
  }
  
  export function ScenePreviewModal({ scene, onClose, onSelect }: ScenePreviewModalProps) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* 背景遮罩 */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* 模态框内容 */}
        <Card 
          variant="default" 
          padding="none" 
          className="relative w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden"
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">
                {scene.name}
              </h3>
              <p className="text-sm text-neutral-600 mt-1">
                {scene.description}
              </p>
            </div>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <Icon name="close" size="sm" />
            </Button>
          </div>
          
          {/* 内容区域 */}
          <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {/* 预览图 */}
            <div className="aspect-video bg-neutral-100 rounded-lg overflow-hidden">
              <img
                src={scene.thumbnail}
                alt={scene.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* 详细信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h4 className="font-medium text-neutral-900">基本信息</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">分类</span>
                    <span className="text-sm text-neutral-900 capitalize">
                      {scene.category === 'indoor' ? '室内' : 
                       scene.category === 'outdoor' ? '户外' : '工作室'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">宽高比</span>
                    <span className="text-sm text-neutral-900">{scene.settings.aspectRatio}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">分辨率</span>
                    <span className="text-sm text-neutral-900">{scene.settings.resolution}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">质量</span>
                    <span className="text-sm text-neutral-900 capitalize">
                      {scene.settings.quality === 'standard' ? '标准' :
                       scene.settings.quality === 'high' ? '高质量' : '超高质量'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">使用次数</span>
                    <span className="text-sm text-neutral-900">
                      {scene.usageCount.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {/* 标签 */}
                <div>
                  <span className="text-sm text-neutral-600 block mb-2">标签</span>
                  <div className="flex flex-wrap gap-1">
                    {scene.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* 提示词详情 */}
              <div className="space-y-4">
                <h4 className="font-medium text-neutral-900">提示词构成</h4>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-neutral-600 block mb-1">基础描述</span>
                    <p className="text-sm text-neutral-900 bg-neutral-50 p-2 rounded">
                      {scene.prompt.base}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-sm text-neutral-600 block mb-1">光照设置</span>
                    <p className="text-sm text-neutral-900 bg-neutral-50 p-2 rounded">
                      {scene.prompt.lighting}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-sm text-neutral-600 block mb-1">环境描述</span>
                    <p className="text-sm text-neutral-900 bg-neutral-50 p-2 rounded">
                      {scene.prompt.environment}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-sm text-neutral-600 block mb-1">风格定义</span>
                    <p className="text-sm text-neutral-900 bg-neutral-50 p-2 rounded">
                      {scene.prompt.style}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-sm text-neutral-600 block mb-1">质量要求</span>
                    <p className="text-sm text-neutral-900 bg-neutral-50 p-2 rounded">
                      {scene.prompt.quality}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 底部操作 */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button variant="primary" onClick={onSelect}>
              <Icon name="check" size="sm" className="mr-2" />
              选择此场景
            </Button>
          </div>
        </Card>
      </div>
    )
  }
  ```
  
  ### 7.5 场景管理服务
  
  ```typescript
  // lib/services/sceneService.ts
  import { SceneTemplate } from '@/types/scene'
  import { getSceneById } from '@/data/sceneTemplates'
  
  export class SceneService {
    // 构建完整的提示词
    static buildPrompt(scene: SceneTemplate, productDescription: string): string {
      const { prompt } = scene
      
      // 组合提示词
      const fullPrompt = [
        `${productDescription} in ${prompt.base}`,
        prompt.environment,
        prompt.lighting,
        prompt.style,
        prompt.quality
      ].join(', ')
      
      return fullPrompt
    }
    
    // 获取场景的生成参数
    static getGenerationParams(scene: SceneTemplate) {
      const { settings } = scene
      
      // 根据宽高比计算具体尺寸
      const dimensions = this.getImageDimensions(settings.aspectRatio, settings.resolution)
      
      return {
        width: dimensions.width,
        height: dimensions.height,
        quality: this.mapQualityToSteps(settings.quality),
        guidance_scale: this.getGuidanceScale(scene.category),
        num_inference_steps: this.getInferenceSteps(settings.quality)
      }
    }
    
    // 根据宽高比和分辨率计算图片尺寸
    private static getImageDimensions(aspectRatio: string, resolution: string) {
      const [resWidth, resHeight] = resolution.split('x').map(Number)
      
      switch (aspectRatio) {
        case '1:1':
          return { width: Math.min(resWidth, resHeight), height: Math.min(resWidth, resHeight) }
        case '16:9':
          return { width: resWidth, height: Math.round(resWidth * 9 / 16) }
        case '4:3':
          return { width: resWidth, height: Math.round(resWidth * 3 / 4) }
        case '3:4':
          return { width: Math.round(resHeight * 3 / 4), height: resHeight }
        default:
          return { width: resWidth, height: resHeight }
      }
    }
    
    // 映射质量等级到生成步数
    private static mapQualityToSteps(quality: string): number {
      switch (quality) {
        case 'standard': return 20
        case 'high': return 30
        case 'ultra': return 50
        default: return 20
      }
    }
    
    // 获取引导比例
    private static getGuidanceScale(category: string): number {
      switch (category) {
        case 'studio': return 7.5  // 工作室需要更精确的控制
        case 'indoor': return 7.0  // 室内场景
        case 'outdoor': return 6.5 // 户外场景更自然
        default: return 7.0
      }
    }
    
    // 获取推理步数
    private static getInferenceSteps(quality: string): number {
      switch (quality) {
        case 'standard': return 20
        case 'high': return 30
        case 'ultra': return 50
        default: return 20
      }
    }
    
    // 记录场景使用
    static async recordSceneUsage(sceneId: string): Promise<void> {
      try {
        // 这里可以调用API记录使用统计
        await fetch('/api/scenes/usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sceneId })
        })
      } catch (error) {
        console.error('Failed to record scene usage:', error)
      }
    }
    
    // 获取推荐场景
    static getRecommendedScenes(productCategory?: string): SceneTemplate[] {
      // 根据产品类别推荐合适的场景
      // 这里可以实现更复杂的推荐算法
      return []
    }
  }
   ```
   
   ## 8. 新增功能需求技术实现
   
   ### 8.1 风格预览功能 (F-ST-003)
   
   ```typescript
   // components/style/StylePreview.tsx
   'use client'
   
   import { useState, useEffect } from 'react'
   import { Button, Card, Icon } from '@/components/ui/DesignSystem'
   import { SceneTemplate } from '@/types/scene'
   import { cn } from '@/lib/utils'
   
   interface StylePreviewProps {
     scene: SceneTemplate
     productImage?: string
     onApply: () => void
     className?: string
   }
   
   export function StylePreview({ scene, productImage, onApply, className }: StylePreviewProps) {
     const [previewImage, setPreviewImage] = useState<string | null>(null)
     const [isGenerating, setIsGenerating] = useState(false)
     
     // 生成风格预览
     const generatePreview = async () => {
       if (!productImage) return
       
       setIsGenerating(true)
       try {
         const response = await fetch('/api/style/preview', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             productImage,
             sceneId: scene.id,
             quality: 'low', // 预览使用低质量快速生成
             size: '256x256'
           })
         })
         
         const data = await response.json()
         if (data.success) {
           setPreviewImage(data.previewUrl)
         }
       } catch (error) {
         console.error('Failed to generate style preview:', error)
       } finally {
         setIsGenerating(false)
       }
     }
     
     useEffect(() => {
       if (productImage) {
         generatePreview()
       }
     }, [scene.id, productImage])
     
     return (
       <Card variant="default" padding="md" className={cn('space-y-4', className)}>
         <div className="flex items-center justify-between">
           <h4 className="font-medium text-neutral-900">风格预览</h4>
           <Button
             variant="outline"
             size="sm"
             onClick={generatePreview}
             disabled={!productImage || isGenerating}
           >
             <Icon 
               name={isGenerating ? "loading" : "generate"} 
               size="sm" 
               className={cn("mr-1", isGenerating && "animate-spin")} 
             />
             {isGenerating ? '生成中...' : '重新生成'}
           </Button>
         </div>
         
         {/* 预览区域 */}
         <div className="grid grid-cols-2 gap-4">
           {/* 原图 */}
           <div className="space-y-2">
             <span className="text-sm text-neutral-600">原始图片</span>
             <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden">
               {productImage ? (
                 <img
                   src={productImage}
                   alt="原始产品图片"
                   className="w-full h-full object-cover"
                 />
               ) : (
                 <div className="w-full h-full flex items-center justify-center">
                   <Icon name="photo" size="xl" className="text-neutral-400" />
                 </div>
               )}
             </div>
           </div>
           
           {/* 预览图 */}
           <div className="space-y-2">
             <span className="text-sm text-neutral-600">风格预览</span>
             <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden relative">
               {isGenerating ? (
                 <div className="w-full h-full flex items-center justify-center">
                   <div className="text-center space-y-2">
                     <Icon name="loading" size="xl" className="text-primary-500 animate-spin mx-auto" />
                     <p className="text-sm text-neutral-600">生成预览中...</p>
                   </div>
                 </div>
               ) : previewImage ? (
                 <img
                   src={previewImage}
                   alt="风格预览"
                   className="w-full h-full object-cover"
                 />
               ) : (
                 <div className="w-full h-full flex items-center justify-center">
                   <div className="text-center space-y-2">
                     <Icon name="view" size="xl" className="text-neutral-400" />
                     <p className="text-sm text-neutral-600">
                       {productImage ? '点击生成预览' : '请先上传产品图片'}
                     </p>
                   </div>
                 </div>
               )}
             </div>
           </div>
         </div>
         
         {/* 风格说明 */}
         <div className="space-y-2">
           <span className="text-sm text-neutral-600">风格说明</span>
           <p className="text-sm text-neutral-900 bg-neutral-50 p-3 rounded-lg">
             {scene.description}
           </p>
         </div>
         
         {/* 使用建议 */}
         <div className="space-y-2">
           <span className="text-sm text-neutral-600">使用建议</span>
           <div className="space-y-1">
             {getStyleSuggestions(scene).map((suggestion, index) => (
               <div key={index} className="flex items-start space-x-2">
                 <Icon name="check" size="sm" className="text-success-500 mt-0.5 flex-shrink-0" />
                 <span className="text-sm text-neutral-700">{suggestion}</span>
               </div>
             ))}
           </div>
         </div>
         
         {/* 应用按钮 */}
         <Button
           variant="primary"
           className="w-full"
           onClick={onApply}
           disabled={!productImage}
         >
           <Icon name="generate" size="sm" className="mr-2" />
           应用此风格生成图片
         </Button>
       </Card>
     )
   }
   
   // 获取风格使用建议
   function getStyleSuggestions(scene: SceneTemplate): string[] {
     const suggestions: Record<string, string[]> = {
       modern_living_room: [
         '适合展示家居用品、电子产品、装饰品',
         '突出产品的现代感和实用性',
         '建议使用简洁的产品描述'
       ],
       cozy_bedroom: [
         '适合展示床上用品、护肤品、个人用品',
         '营造温馨私密的使用场景',
         '强调产品的舒适性和温暖感'
       ],
       fashion_office_desk: [
         '适合展示办公用品、数码产品、商务配件',
         '体现产品的专业性和效率',
         '突出产品在工作场景中的价值'
       ],
       outdoor_nature: [
         '适合展示运动用品、户外装备、环保产品',
         '强调产品的自然属性和健康理念',
         '展现产品与自然的和谐关系'
       ],
       cafe_leisure: [
         '适合展示食品饮料、休闲用品、社交产品',
         '营造轻松惬意的生活氛围',
         '突出产品的社交属性和生活方式'
       ]
     }
     
     return suggestions[scene.id] || ['通用风格，适合多种产品类型']
   }
   ```
   
   ### 8.2 实时预估生成时间显示 (F-QT-003)
   
   ```typescript
   // components/generation/TimeEstimator.tsx
   'use client'
   
   import { useState, useEffect } from 'react'
   import { Icon } from '@/components/ui/DesignSystem'
   import { cn } from '@/lib/utils'
   
   interface TimeEstimatorProps {
     imageCount: number
     quality: 'standard' | 'high' | 'ultra'
     sceneComplexity: 'simple' | 'medium' | 'complex'
     className?: string
   }
   
   export function TimeEstimator({ 
     imageCount, 
     quality, 
     sceneComplexity, 
     className 
   }: TimeEstimatorProps) {
     const [estimatedTime, setEstimatedTime] = useState<number>(0)
   
   // 计算预估时间
   useEffect(() => {
     const baseTime = calculateBaseTime(quality, sceneComplexity)
     const totalTime = baseTime * imageCount
     
     setEstimatedTime(totalTime)
   }, [imageCount, quality, sceneComplexity])
     
     const formatTime = (seconds: number): string => {
       if (seconds < 60) {
         return `${Math.round(seconds)} 秒`
       } else if (seconds < 3600) {
         const minutes = Math.floor(seconds / 60)
         const remainingSeconds = Math.round(seconds % 60)
         return `${minutes} 分 ${remainingSeconds} 秒`
       } else {
         const hours = Math.floor(seconds / 3600)
         const minutes = Math.floor((seconds % 3600) / 60)
         return `${hours} 小时 ${minutes} 分钟`
       }
     }
     
     return (
       <div className={cn('space-y-3', className)}>
         {/* 预估时间 */}
         <div className="flex items-center space-x-2">
           <Icon name="clock" size="sm" className="text-primary-500" />
           <span className="text-sm text-neutral-600">预估生成时间：</span>
           <span className="text-sm font-medium text-neutral-900">
             {formatTime(estimatedTime)}
           </span>
         </div>
         
         {/* 时间分解 */}
         <div className="bg-neutral-50 p-3 rounded-lg space-y-2">
           <div className="text-xs text-neutral-600 font-medium">时间分解：</div>
           <div className="space-y-1">
             <div className="flex justify-between text-xs">
               <span className="text-neutral-600">单张图片基础时间：</span>
               <span className="text-neutral-900">
                 {formatTime(calculateBaseTime(quality, sceneComplexity))}
               </span>
             </div>
             <div className="flex justify-between text-xs">
               <span className="text-neutral-600">图片数量：</span>
               <span className="text-neutral-900">{imageCount} 张</span>
             </div>
             <div className="flex justify-between text-xs">
               <span className="text-neutral-600">服务器负载调整：</span>
               <span className="text-neutral-900">
                 {serverLoad === 'low' ? '-20%' : serverLoad === 'high' ? '+50%' : '标准'}
               </span>
             </div>
             <div className="border-t border-neutral-200 pt-1 flex justify-between text-xs font-medium">
               <span className="text-neutral-900">总预估时间：</span>
               <span className="text-primary-600">{formatTime(estimatedTime)}</span>
             </div>
           </div>
         </div>
       </div>
     )
   }
   
   // 计算基础生成时间
   function calculateBaseTime(quality: string, complexity: string): number {
     const qualityMultiplier = {
       standard: 1.0,
       high: 1.5,
       ultra: 2.5
     }
     
     const complexityMultiplier = {
       simple: 0.8,
       medium: 1.0,
       complex: 1.3
     }
     
     const baseTime = 45 // 基础45秒
     return baseTime * qualityMultiplier[quality] * complexityMultiplier[complexity]
   }
   
   // 根据服务器负载调整时间
   function adjustTimeForLoad(baseTime: number, load: string): number {
     const loadMultiplier = {
       low: 0.8,
       medium: 1.0,
       high: 1.5
     }
     
     return baseTime * loadMultiplier[load]
   }
   ```
   
   ### 8.3 图片质量评分显示 (F-RS-004)
   
   ```typescript
   // components/results/QualityScore.tsx
   'use client'
   
   import { useState, useEffect } from 'react'
   import { Icon } from '@/components/ui/DesignSystem'
   import { cn } from '@/lib/utils'
   
   interface QualityScoreProps {
     imageUrl: string
     onScoreCalculated?: (score: number) => void
     className?: string
   }
   
   interface QualityMetrics {
     overall: number
     sharpness: number
     composition: number
     lighting: number
     colorBalance: number
     details: string[]
   }
   
   export function QualityScore({ imageUrl, onScoreCalculated, className }: QualityScoreProps) {
     const [metrics, setMetrics] = useState<QualityMetrics | null>(null)
     const [isAnalyzing, setIsAnalyzing] = useState(false)
     
     // 分析图片质量
     useEffect(() => {
       if (imageUrl) {
         analyzeImageQuality()
       }
     }, [imageUrl])
     
     const analyzeImageQuality = async () => {
       setIsAnalyzing(true)
       try {
         const response = await fetch('/api/image/analyze-quality', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ imageUrl })
         })
         
         const data = await response.json()
         if (data.success) {
           setMetrics(data.metrics)
           onScoreCalculated?.(data.metrics.overall)
         }
       } catch (error) {
         console.error('Failed to analyze image quality:', error)
       } finally {
         setIsAnalyzing(false)
       }
     }
     
     const getScoreColor = (score: number) => {
       if (score >= 90) return 'text-success-500'
       if (score >= 80) return 'text-success-400'
       if (score >= 70) return 'text-warning-500'
       if (score >= 60) return 'text-warning-600'
       return 'text-error-500'
     }
     
     const getScoreBgColor = (score: number) => {
       if (score >= 90) return 'bg-success-500'
       if (score >= 80) return 'bg-success-400'
       if (score >= 70) return 'bg-warning-500'
       if (score >= 60) return 'bg-warning-600'
       return 'bg-error-500'
     }
     
     const getScoreLabel = (score: number) => {
       if (score >= 90) return '优秀'
       if (score >= 80) return '良好'
       if (score >= 70) return '一般'
       if (score >= 60) return '较差'
       return '差'
     }
     
     if (isAnalyzing) {
       return (
         <div className={cn('flex items-center space-x-2', className)}>
           <Icon name="loading" size="sm" className="text-primary-500 animate-spin" />
           <span className="text-sm text-neutral-600">分析图片质量中...</span>
         </div>
       )
     }
     
     if (!metrics) {
       return null
     }
     
     return (
       <div className={cn('space-y-3', className)}>
         {/* 总体评分 */}
         <div className="flex items-center space-x-3">
           <div className="relative">
             <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center">
               <span className={cn('text-lg font-bold', getScoreColor(metrics.overall))}>
                 {metrics.overall}
               </span>
             </div>
             <div className={cn(
               'absolute inset-0 rounded-full border-4 border-transparent',
               getScoreBgColor(metrics.overall)
             )} style={{
               background: `conic-gradient(currentColor ${metrics.overall * 3.6}deg, transparent 0deg)`
             }} />
           </div>
           
           <div>
             <div className="flex items-center space-x-2">
               <span className="text-sm font-medium text-neutral-900">图片质量评分</span>
               <span className={cn('text-xs px-2 py-1 rounded-full text-white', getScoreBgColor(metrics.overall))}>
                 {getScoreLabel(metrics.overall)}
               </span>
             </div>
             <p className="text-xs text-neutral-600">基于AI算法综合评估</p>
           </div>
         </div>
         
         {/* 详细指标 */}
         <div className="space-y-2">
           <div className="text-xs font-medium text-neutral-700">详细指标：</div>
           
           <div className="space-y-1">
             {[
               { label: '清晰度', value: metrics.sharpness, icon: 'eye' },
               { label: '构图', value: metrics.composition, icon: 'adjustments' },
               { label: '光照', value: metrics.lighting, icon: 'sun' },
               { label: '色彩平衡', value: metrics.colorBalance, icon: 'palette' }
             ].map((metric) => (
               <div key={metric.label} className="flex items-center justify-between">
                 <div className="flex items-center space-x-2">
                   <Icon name={metric.icon as any} size="xs" className="text-neutral-500" />
                   <span className="text-xs text-neutral-600">{metric.label}</span>
                 </div>
                 <div className="flex items-center space-x-2">
                   <div className="w-16 h-1 bg-neutral-200 rounded-full overflow-hidden">
                     <div 
                       className={cn('h-full transition-all duration-300', getScoreBgColor(metric.value))}
                       style={{ width: `${metric.value}%` }}
                     />
                   </div>
                   <span className={cn('text-xs font-medium', getScoreColor(metric.value))}>
                     {metric.value}
                   </span>
                 </div>
               </div>
             ))}
           </div>
         </div>
         
         {/* 改进建议 */}
         {metrics.details.length > 0 && (
           <div className="space-y-2">
             <div className="text-xs font-medium text-neutral-700">改进建议：</div>
             <div className="space-y-1">
               {metrics.details.map((detail, index) => (
                 <div key={index} className="flex items-start space-x-2">
                   <Icon name="info" size="xs" className="text-primary-500 mt-0.5 flex-shrink-0" />
                   <span className="text-xs text-neutral-600">{detail}</span>
                 </div>
               ))}
             </div>
           </div>
         )}
       </div>
     )
   }
   ```
   
   ### 8.4 重新生成单张图片功能 (F-RS-005)
   
   ```typescript
   // components/results/RegenerateButton.tsx
   'use client'
   
   import { useState } from 'react'
   import { Button, Icon } from '@/components/ui/DesignSystem'
   import { cn } from '@/lib/utils'
   
   interface RegenerateButtonProps {
     imageId: string
     originalPrompt: string
     onRegenerate: (newImageUrl: string) => void
     className?: string
   }
   
   export function RegenerateButton({ 
     imageId, 
     originalPrompt, 
     onRegenerate, 
     className 
   }: RegenerateButtonProps) {
     const [isRegenerating, setIsRegenerating] = useState(false)
     const [progress, setProgress] = useState(0)
     
     const handleRegenerate = async () => {
       setIsRegenerating(true)
       setProgress(0)
       
       try {
         // 创建进度更新的WebSocket连接
         const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/regenerate/${imageId}`)
         
         ws.onmessage = (event) => {
           const data = JSON.parse(event.data)
           
           if (data.type === 'progress') {
             setProgress(data.progress)
           } else if (data.type === 'completed') {
             onRegenerate(data.imageUrl)
             setIsRegenerating(false)
             ws.close()
           } else if (data.type === 'error') {
             console.error('Regeneration failed:', data.error)
             setIsRegenerating(false)
             ws.close()
           }
         }
         
         // 发起重新生成请求
         const response = await fetch('/api/image/regenerate', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             imageId,
             prompt: originalPrompt,
             variations: true // 生成变体而不是完全相同的图片
           })
         })
         
         if (!response.ok) {
           throw new Error('Failed to start regeneration')
         }
         
       } catch (error) {
         console.error('Regeneration error:', error)
         setIsRegenerating(false)
       }
     }
     
     return (
       <Button
         variant="outline"
         size="sm"
         onClick={handleRegenerate}
         disabled={isRegenerating}
         className={cn('relative overflow-hidden', className)}
       >
         {/* 进度条背景 */}
         {isRegenerating && (
           <div 
             className="absolute inset-0 bg-primary-100 transition-all duration-300"
             style={{ width: `${progress}%` }}
           />
         )}
         
         {/* 按钮内容 */}
         <div className="relative flex items-center space-x-1">
           <Icon 
             name={isRegenerating ? "loading" : "generate"} 
             size="sm" 
             className={cn(isRegenerating && "animate-spin")} 
           />
           <span>
             {isRegenerating ? `重新生成中 ${progress}%` : '重新生成'}
           </span>
         </div>
       </Button>
     )
   }
   ```
   
   ### 8.5 图片编辑功能 (F-RS-006)
   
   ```typescript
   // components/editor/ImageEditor.tsx
   'use client'
   
   import { useState, useRef, useEffect } from 'react'
   import { Button, Card, Icon } from '@/components/ui/DesignSystem'
   import { cn } from '@/lib/utils'
   
   interface ImageEditorProps {
     imageUrl: string
     onSave: (editedImageUrl: string) => void
     onClose: () => void
   }
   
   interface EditState {
     brightness: number
     contrast: number
     saturation: number
     hue: number
     crop: {
       x: number
       y: number
       width: number
       height: number
     }
   }
   
   export function ImageEditor({ imageUrl, onSave, onClose }: ImageEditorProps) {
     const canvasRef = useRef<HTMLCanvasElement>(null)
     const [editState, setEditState] = useState<EditState>({
       brightness: 0,
       contrast: 0,
       saturation: 0,
       hue: 0,
       crop: { x: 0, y: 0, width: 100, height: 100 }
     })
     const [activeTab, setActiveTab] = useState<'adjust' | 'crop'>('adjust')
     const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null)
     
     // 加载原始图片
     useEffect(() => {
       const img = new Image()
       img.crossOrigin = 'anonymous'
       img.onload = () => {
         setOriginalImage(img)
         drawImage()
       }
       img.src = imageUrl
     }, [imageUrl])
     
     // 绘制图片到画布
     const drawImage = () => {
       if (!canvasRef.current || !originalImage) return
       
       const canvas = canvasRef.current
       const ctx = canvas.getContext('2d')
       if (!ctx) return
       
       canvas.width = originalImage.width
       canvas.height = originalImage.height
       
       // 应用滤镜
       ctx.filter = `
         brightness(${100 + editState.brightness}%)
         contrast(${100 + editState.contrast}%)
         saturate(${100 + editState.saturation}%)
         hue-rotate(${editState.hue}deg)
       `
       
       ctx.drawImage(originalImage, 0, 0)
     }
     
     // 更新编辑状态
     const updateEditState = (updates: Partial<EditState>) => {
       setEditState(prev => ({ ...prev, ...updates }))
     }
     
     // 重绘图片
     useEffect(() => {
       drawImage()
     }, [editState, originalImage])
     
     // 保存编辑后的图片
     const handleSave = async () => {
       if (!canvasRef.current) return
       
       try {
         const canvas = canvasRef.current
         const blob = await new Promise<Blob>((resolve) => {
           canvas.toBlob((blob) => {
             if (blob) resolve(blob)
           }, 'image/jpeg', 0.9)
         })
         
         // 上传编辑后的图片
         const formData = new FormData()
         formData.append('image', blob, 'edited-image.jpg')
         
         const response = await fetch('/api/image/upload-edited', {
           method: 'POST',
           body: formData
         })
         
         const data = await response.json()
         if (data.success) {
           onSave(data.imageUrl)
         }
       } catch (error) {
         console.error('Failed to save edited image:', error)
       }
     }
     
     // 重置编辑
     const handleReset = () => {
       setEditState({
         brightness: 0,
         contrast: 0,
         saturation: 0,
         hue: 0,
         crop: { x: 0, y: 0, width: 100, height: 100 }
       })
     }
     
     return (
       <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
         <Card variant="default" padding="none" className="w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
           {/* 头部 */}
           <div className="flex items-center justify-between p-4 border-b border-neutral-200">
             <h3 className="text-lg font-semibold text-neutral-900">图片编辑</h3>
             <Button variant="ghost" size="sm" onClick={onClose}>
               <Icon name="close" size="sm" />
             </Button>
           </div>
           
           <div className="flex h-[calc(90vh-120px)]">
             {/* 左侧工具栏 */}
             <div className="w-80 border-r border-neutral-200 p-4 space-y-4 overflow-y-auto">
               {/* 标签切换 */}
               <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1">
                 <Button
                   variant={activeTab === 'adjust' ? 'primary' : 'ghost'}
                   size="sm"
                   onClick={() => setActiveTab('adjust')}
                   className="flex-1"
                 >
                   <Icon name="adjustments" size="sm" className="mr-1" />
                   调色
                 </Button>
                 <Button
                   variant={activeTab === 'crop' ? 'primary' : 'ghost'}
                   size="sm"
                   onClick={() => setActiveTab('crop')}
                   className="flex-1"
                 >
                   <Icon name="crop" size="sm" className="mr-1" />
                   裁剪
                 </Button>
               </div>
               
               {/* 调色工具 */}
               {activeTab === 'adjust' && (
                 <div className="space-y-4">
                   {[
                     { label: '亮度', key: 'brightness', min: -50, max: 50, step: 1 },
                     { label: '对比度', key: 'contrast', min: -50, max: 50, step: 1 },
                     { label: '饱和度', key: 'saturation', min: -50, max: 50, step: 1 },
                     { label: '色相', key: 'hue', min: -180, max: 180, step: 1 }
                   ].map((control) => (
                     <div key={control.key} className="space-y-2">
                       <div className="flex justify-between">
                         <label className="text-sm text-neutral-600">{control.label}</label>
                         <span className="text-sm text-neutral-900">
                           {editState[control.key as keyof EditState]}
                         </span>
                       </div>
                       <input
                         type="range"
                         min={control.min}
                         max={control.max}
                         step={control.step}
                         value={editState[control.key as keyof EditState] as number}
                         onChange={(e) => updateEditState({ 
                           [control.key]: parseInt(e.target.value) 
                         })}
                         className="w-full"
                       />
                     </div>
                   ))}
                 </div>
               )}
               
               {/* 裁剪工具 */}
               {activeTab === 'crop' && (
                 <div className="space-y-4">
                   <div className="text-sm text-neutral-600">
                     拖拽调整裁剪区域
                   </div>
                   {/* 这里可以添加裁剪控制组件 */}
                 </div>
               )}
               
               {/* 操作按钮 */}
               <div className="space-y-2 pt-4 border-t border-neutral-200">
                 <Button variant="outline" onClick={handleReset} className="w-full">
                   <Icon name="refresh" size="sm" className="mr-2" />
                   重置
                 </Button>
                 <Button variant="primary" onClick={handleSave} className="w-full">
                   <Icon name="check" size="sm" className="mr-2" />
                   保存编辑
                 </Button>
               </div>
             </div>
             
             {/* 右侧画布区域 */}
             <div className="flex-1 p-4 bg-neutral-50 flex items-center justify-center">
               <canvas
                 ref={canvasRef}
                 className="max-w-full max-h-full border border-neutral-200 bg-white shadow-lg"
               />
             </div>
           </div>
         </Card>
       </div>
     )
   }
   ```
   
   ### 8.6 自定义下载功能 (F-DL-003, F-DL-004)
   
   ```typescript
   // components/download/CustomDownload.tsx
   'use client'
   
   import { useState } from 'react'
   import { Button, Card, Icon } from '@/components/ui/DesignSystem'
   import { cn } from '@/lib/utils'
   
   interface CustomDownloadProps {
     imageUrl: string
     originalFormat: string
     onDownload: (downloadUrl: string) => void
     className?: string
   }
   
   interface DownloadOptions {
     format: 'jpg' | 'png' | 'webp'
     quality: number
     resolution: string
     customWidth?: number
     customHeight?: number
   }
   
   export function CustomDownload({ 
     imageUrl, 
     originalFormat, 
     onDownload, 
     className 
   }: CustomDownloadProps) {
     const [options, setOptions] = useState<DownloadOptions>({
       format: 'jpg',
       quality: 90,
       resolution: 'original',
       customWidth: undefined,
       customHeight: undefined
     })
     const [isProcessing, setIsProcessing] = useState(false)
     const [showAdvanced, setShowAdvanced] = useState(false)
     
     const resolutionPresets = [
       { label: '原始尺寸', value: 'original' },
       { label: '4K (3840×2160)', value: '3840x2160' },
       { label: '2K (2560×1440)', value: '2560x1440' },
       { label: 'Full HD (1920×1080)', value: '1920x1080' },
       { label: 'HD (1280×720)', value: '1280x720' },
       { label: '自定义', value: 'custom' }
     ]
     
     const handleDownload = async () => {
       setIsProcessing(true)
       
       try {
         const response = await fetch('/api/image/convert', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             imageUrl,
             format: options.format,
             quality: options.quality,
             resolution: options.resolution,
             customWidth: options.customWidth,
             customHeight: options.customHeight
           })
         })
         
         const data = await response.json()
         if (data.success) {
           onDownload(data.downloadUrl)
         }
       } catch (error) {
         console.error('Download conversion failed:', error)
       } finally {
         setIsProcessing(false)
       }
     }
     
     const updateOptions = (updates: Partial<DownloadOptions>) => {
       setOptions(prev => ({ ...prev, ...updates }))
     }
     
     const getFormatSize = (format: string) => {
       // 估算不同格式的文件大小
       const baseSizeMB = 2.5 // 假设原始大小
       const formatMultiplier = {
         jpg: 0.3,
         png: 1.0,
         webp: 0.25
       }
       return (baseSizeMB * formatMultiplier[format]).toFixed(1)
     }
     
     return (
       <Card variant="default" padding="md" className={cn('space-y-4', className)}>
         <div className="flex items-center justify-between">
           <h4 className="font-medium text-neutral-900">自定义下载</h4>
           <Button
             variant="ghost"
             size="sm"
             onClick={() => setShowAdvanced(!showAdvanced)}
           >
             <Icon name="settings" size="sm" className="mr-1" />
             {showAdvanced ? '简单模式' : '高级选项'}
           </Button>
         </div>
         
         {/* 格式选择 */}
         <div className="space-y-2">
           <label className="text-sm text-neutral-600">文件格式</label>
           <div className="grid grid-cols-3 gap-2">
             {[
               { value: 'jpg', label: 'JPG', desc: '小文件，适合分享' },
               { value: 'png', label: 'PNG', desc: '无损质量，支持透明' },
               { value: 'webp', label: 'WebP', desc: '最小文件，现代格式' }
             ].map((format) => (
               <Button
                 key={format.value}
                 variant={options.format === format.value ? 'primary' : 'outline'}
                 size="sm"
                 onClick={() => updateOptions({ format: format.value as any })}
                 className="flex-col h-auto p-3"
               >
                 <span className="font-medium">{format.label}</span>
                 <span className="text-xs opacity-75">{format.desc}</span>
                 <span className="text-xs opacity-60">
                   ~{getFormatSize(format.value)}MB
                 </span>
               </Button>
             ))}
           </div>
         </div>
         
         {/* 分辨率选择 */}
         <div className="space-y-2">
           <label className="text-sm text-neutral-600">分辨率</label>
           <select
             value={options.resolution}
             onChange={(e) => updateOptions({ resolution: e.target.value })}
             className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
           >
             {resolutionPresets.map((preset) => (
               <option key={preset.value} value={preset.value}>
                 {preset.label}
               </option>
             ))}
           </select>
           
           {/* 自定义尺寸 */}
           {options.resolution === 'custom' && (
             <div className="grid grid-cols-2 gap-2">
               <div>
                 <label className="text-xs text-neutral-500">宽度 (px)</label>
                 <input
                   type="number"
                   value={options.customWidth || ''}
                   onChange={(e) => updateOptions({ customWidth: parseInt(e.target.value) || undefined })}
                   placeholder="1920"
                   className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
                 />
               </div>
               <div>
                 <label className="text-xs text-neutral-500">高度 (px)</label>
                 <input
                   type="number"
                   value={options.customHeight || ''}
                   onChange={(e) => updateOptions({ customHeight: parseInt(e.target.value) || undefined })}
                   placeholder="1080"
                   className="w-full rounded border border-neutral-300 px-2 py-1 text-sm"
                 />
               </div>
             </div>
           )}
         </div>
         
         {/* 高级选项 */}
         {showAdvanced && (
           <div className="space-y-3 pt-3 border-t border-neutral-200">
             {/* 质量设置 */}
             {options.format !== 'png' && (
               <div className="space-y-2">
                 <div className="flex justify-between">
                   <label className="text-sm text-neutral-600">图片质量</label>
                   <span className="text-sm text-neutral-900">{options.quality}%</span>
                 </div>
                 <input
                   type="range"
                   min="10"
                   max="100"
                   step="5"
                   value={options.quality}
                   onChange={(e) => updateOptions({ quality: parseInt(e.target.value) })}
                   className="w-full"
                 />
                 <div className="flex justify-between text-xs text-neutral-500">
                   <span>文件更小</span>
                   <span>质量更高</span>
                 </div>
               </div>
             )}
           </div>
         )}
         
         {/* 下载按钮 */}
         <Button
           variant="primary"
           onClick={handleDownload}
           disabled={isProcessing}
           className="w-full"
         >
           <Icon 
             name={isProcessing ? "loading" : "download"} 
             size="sm" 
             className={cn("mr-2", isProcessing && "animate-spin")} 
           />
           {isProcessing ? '处理中...' : '下载图片'}
         </Button>
         
         {/* 预估信息 */}
         <div className="text-xs text-neutral-500 space-y-1">
           <div className="flex justify-between">
             <span>预估文件大小：</span>
             <span>~{getFormatSize(options.format)}MB</span>
           </div>
           <div className="flex justify-between">
             <span>格式：</span>
             <span>{options.format.toUpperCase()}</span>
           </div>
           <div className="flex justify-between">
             <span>质量：</span>
             <span>{options.format === 'png' ? '无损' : `${options.quality}%`}</span>
           </div>
         </div>
       </Card>
     )
   }
   ```
   
   ### 8.7 下载历史记录 (F-DL-006)
   
   ```typescript
   // components/download/DownloadHistory.tsx
   'use client'
   
   import { useState, useEffect } from 'react'
   import { Button, Card, Icon } from '@/components/ui/DesignSystem'
   import { cn } from '@/lib/utils'
   
   interface DownloadRecord {
     id: string
     imageUrl: string
     downloadUrl: string
     filename: string
     format: string
     size: number
     downloadedAt: string
     expiresAt: string
   }
   
   interface DownloadHistoryProps {
     className?: string
   }
   
   export function DownloadHistory({ className }: DownloadHistoryProps) {
     const [records, setRecords] = useState<DownloadRecord[]>([])
     const [isLoading, setIsLoading] = useState(true)
     
     // 获取下载历史
     useEffect(() => {
       fetchDownloadHistory()
     }, [])
     
     const fetchDownloadHistory = async () => {
       try {
         const response = await fetch('/api/download/history')
         const data = await response.json()
         
         if (data.success) {
           setRecords(data.records)
         }
       } catch (error) {
         console.error('Failed to fetch download history:', error)
       } finally {
         setIsLoading(false)
       }
     }
     
     const handleRedownload = async (record: DownloadRecord) => {
       try {
         // 检查文件是否仍然可用
         const response = await fetch(`/api/download/check/${record.id}`)
         const data = await response.json()
         
         if (data.available) {
           // 直接下载
           const link = document.createElement('a')
           link.href = record.downloadUrl
           link.download = record.filename
           link.click()
         } else {
           // 重新生成下载链接
           const regenerateResponse = await fetch('/api/download/regenerate', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ recordId: record.id })
           })
           
           const regenerateData = await regenerateResponse.json()
           if (regenerateData.success) {
             const link = document.createElement('a')
             link.href = regenerateData.downloadUrl
             link.download = record.filename
             link.click()
           }
         }
       } catch (error) {
         console.error('Failed to redownload:', error)
       }
     }
     
     const formatFileSize = (bytes: number): string => {
       if (bytes === 0) return '0 B'
       const k = 1024
       const sizes = ['B', 'KB', 'MB', 'GB']
       const i = Math.floor(Math.log(bytes) / Math.log(k))
       return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
     }
     
     const formatDate = (dateString: string): string => {
       const date = new Date(dateString)
       return date.toLocaleDateString('zh-CN', {
         year: 'numeric',
         month: 'short',
         day: 'numeric',
         hour: '2-digit',
         minute: '2-digit'
       })
     }
     
     const isExpired = (expiresAt: string): boolean => {
       return new Date(expiresAt) < new Date()
     }
     
     if (isLoading) {
       return (
         <Card variant="default" padding="md" className={cn('text-center', className)}>
           <Icon name="loading" size="lg" className="text-primary-500 animate-spin mx-auto mb-2" />
           <p className="text-sm text-neutral-600">加载下载历史...</p>
         </Card>
       )
     }
     
     if (records.length === 0) {
       return (
         <Card variant="default" padding="md" className={cn('text-center', className)}>
           <Icon name="download" size="lg" className="text-neutral-400 mx-auto mb-2" />
           <p className="text-sm text-neutral-600">暂无下载记录</p>
         </Card>
       )
     }
     
     return (
       <Card variant="default" padding="md" className={cn('space-y-4', className)}>
         <div className="flex items-center justify-between">
           <h4 className="font-medium text-neutral-900">下载历史</h4>
           <Button variant="outline" size="sm" onClick={fetchDownloadHistory}>
             <Icon name="refresh" size="sm" className="mr-1" />
             刷新
           </Button>
         </div>
         
         <div className="space-y-3 max-h-96 overflow-y-auto">
           {records.map((record) => (
             <div
               key={record.id}
               className="flex items-center space-x-3 p-3 border border-neutral-200 rounded-lg"
             >
               {/* 缩略图 */}
               <div className="w-12 h-12 bg-neutral-100 rounded overflow-hidden flex-shrink-0">
                 <img
                   src={record.imageUrl}
                   alt="下载图片"
                   className="w-full h-full object-cover"
                 />
               </div>
               
               {/* 文件信息 */}
               <div className="flex-1 min-w-0">
                 <div className="flex items-center space-x-2">
                   <span className="text-sm font-medium text-neutral-900 truncate">
                     {record.filename}
                   </span>
                   <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded">
                     {record.format.toUpperCase()}
                   </span>
                 </div>
                 
                 <div className="flex items-center space-x-4 mt-1 text-xs text-neutral-500">
                   <span>{formatFileSize(record.size)}</span>
                   <span>{formatDate(record.downloadedAt)}</span>
                   {isExpired(record.expiresAt) && (
                     <span className="text-error-500">已过期</span>
                   )}
                 </div>
               </div>
               
               {/* 操作按钮 */}
               <div className="flex items-center space-x-2">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => handleRedownload(record)}
                   disabled={isExpired(record.expiresAt)}
                 >
                   <Icon name="download" size="sm" className="mr-1" />
                   {isExpired(record.expiresAt) ? '已过期' : '重新下载'}
                 </Button>
               </div>
             </div>
           ))}
         </div>
         
         {/* 说明文字 */}
         <div className="text-xs text-neutral-500 pt-2 border-t border-neutral-200">
           <p>• 下载链接有效期为7天</p>
           <p>• 过期文件可以重新生成下载链接</p>
         </div>
       </Card>
     )
   }
   ```
   
   ## 9. 路由定义

### 5.1 前端路由

| 路由         | 组件                     | 描述           | 权限 |
| ---------- | ---------------------- | ------------ | -- |
| `/`        | `app/page.tsx`         | 主页面，包含所有功能模块 | 公开 |
| `/help`    | `app/help/page.tsx`    | 帮助文档页面       | 公开 |
| `/privacy` | `app/privacy/page.tsx` | 隐私政策页面       | 公开 |
| `/terms`   | `app/terms/page.tsx`   | 使用条款页面       | 公开 |

### 4.2 API路由

| 路由                       | 方法   | 描述     | 参数                            |
| ------------------------ | ---- | ------ | ----------------------------- |
| `/api/generate`          | POST | 生成产品图片 | FormData: image, style, count |
| `/api/generate/progress` | GET  | 查询生成进度 | Query: taskId                 |
| `/api/health`            | GET  | 健康检查   | 无                             |
| `/api/upload`            | POST | 文件上传   | FormData: file                |

## 5. API定义详细说明

### 5.1 核心API接口

#### 5.1.1 图片生成接口

**接口地址：** `POST /api/generate`

**请求格式：** `multipart/form-data`

**请求参数：**

| 参数名   | 类型     | 必填 | 描述     | 示例                                       |
| ----- | ------ | -- | ------ | ---------------------------------------- |
| image | File   | 是  | 产品图片文件 | product.jpg                              |
| style | string | 是  | 图片风格   | "white\_background" 或 "lifestyle\_scene" |
| count | string | 是  | 生成数量   | "3" 到 "8"                                |

**响应格式：** `application/json`

**成功响应 (200)：**

```json
{
  "success": true,
  "taskId": "task_123456789",
  "images": [
    {
      "id": "img_001",
      "url": "https://storage.googleapis.com/bucket/img_001.jpg",
      "thumbnail": "https://storage.googleapis.com/bucket/thumb_img_001.jpg",
      "prompt": "A top-down shot of a silver bracelet...",
      "quality_score": 0.95
    }
  ],
  "metadata": {
    "productDescription": "A silver bracelet with blue gems",
    "style": "white_background",
    "count": 5,
    "generatedAt": "2024-01-15T10:30:00Z",
    "processingTime": 180
  }
}
```

**错误响应：**

```json
{
  "success": false,
  "error": "图片生成失败",
  "code": "GENERATION_FAILED",
  "details": "API调用超时",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 5.1.2 进度查询接口

**接口地址：** `GET /api/generate/progress?taskId={taskId}`

**请求参数：**

| 参数名    | 类型     | 必填 | 描述   |
| ------ | ------ | -- | ---- |
| taskId | string | 是  | 任务ID |

**响应示例：**

```json
{
  "taskId": "task_123456789",
  "status": "processing",
  "stage": "generating_images",
  "progress": 75,
  "currentImage": 3,
  "totalImages": 5,
  "message": "正在生成第3张图片...",
  "estimatedTimeRemaining": 120,
  "startedAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:32:30Z"
}
```

### 5.2 TypeScript类型定义

```typescript
// lib/types.ts

// 基础类型
export type ImageStyle = 'white_background' | 'lifestyle_scene'
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type GenerationStage = 'analyzing' | 'generating_prompts' | 'generating_images'

// 请求类型
export interface GenerateImageRequest {
  image: File
  style: ImageStyle
  count: number
}

// 响应类型
export interface GeneratedImage {
  id: string
  url: string
  thumbnail: string
  prompt: string
  quality_score: number
  width: number
  height: number
  fileSize: number
  format: string
}

export interface GenerateImageResponse {
  success: boolean
  taskId: string
  images: GeneratedImage[]
  metadata: {
    productDescription: string
    style: ImageStyle
    count: number
    generatedAt: string
    processingTime: number
  }
}

export interface GenerationProgress {
  taskId: string
  status: TaskStatus
  stage: GenerationStage
  progress: number
  currentImage?: number
  totalImages?: number
  message: string
  estimatedTimeRemaining?: number
  startedAt: string
  updatedAt: string
  error?: string
}

// 错误类型
export interface APIError {
  success: false
  error: string
  code: string
  details?: string
  timestamp: string
}

// 配置类型
export interface AppConfig {
  maxFileSize: number
  supportedFormats: string[]
  maxImageCount: number
  minImageCount: number
  apiTimeout: number
  retryAttempts: number
}

// 用户偏好类型
export interface UserPreferences {
  theme: 'light' | 'dark'
  language: 'zh' | 'en'
  defaultStyle: ImageStyle
  defaultCount: number
}
```

## 6. 服务器架构设计

### 6.1 服务器架构图

```mermaid
graph TB
    subgraph "负载均衡层"
        LB[Nginx Load Balancer]
    end
    
    subgraph "应用层"
        APP[Next.js App]
    end
    
    subgraph "存储层"
        LOCAL[本地文件系统]
    end
    
    subgraph "AI服务层"
        GEMINI[Google Gemini APIs]
    end
    
    USER --> APP
    APP --> LOCAL
    APP --> GEMINI
```

### 6.2 分层架构设计

```mermaid
graph TD
    subgraph "表现层 (Presentation Layer)"
        UI[React Components]
        PAGES[Next.js Pages]
    end
    
    subgraph "业务逻辑层 (Business Logic Layer)"
        HOOKS[Custom Hooks]
        SERVICES[Service Layer]
        UTILS[Utility Functions]
    end
    
    subgraph "数据访问层 (Data Access Layer)"
        API[API Routes]
        CACHE[Cache Layer]
        STORAGE[Storage Layer]
    end
    
    subgraph "外部服务层 (External Services)"
        GEMINI_API[Gemini APIs]
    end
    
    UI --> HOOKS
    PAGES --> SERVICES
    HOOKS --> SERVICES
    SERVICES --> API
    API --> STORAGE
    API --> GEMINI_API
```

### 6.3 核心服务设计

#### 6.3.1 图片处理服务

```typescript
// lib/services/imageService.ts
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

export class ImageService {
  private uploadDir: string

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads')
    // 确保上传目录存在
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true })
    }
  }

  // 图片预处理
  async preprocessImage(buffer: Buffer): Promise<Buffer> {
    return await sharp(buffer)
      .resize(1024, 1024, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .jpeg({ quality: 90 })
      .toBuffer()
  }

  // 生成缩略图
  async generateThumbnail(buffer: Buffer): Promise<Buffer> {
    return await sharp(buffer)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer()
  }

  // 保存到本地存储
  async saveToLocal(
    buffer: Buffer, 
    filename: string
  ): Promise<string> {
    const filePath = path.join(this.uploadDir, filename)
    fs.writeFileSync(filePath, buffer)
    return `/uploads/${filename}`
  }

  // 批量处理图片
  async processImages(images: Buffer[]): Promise<string[]> {
    const urls: string[] = []
    
    for (let i = 0; i < images.length; i++) {
      const filename = `generated_${Date.now()}_${i}.jpg`
      const url = await this.saveToLocal(images[i], filename)
      urls.push(url)
    }
    
    return urls
  }
}
```

#### 6.3.2 AI服务集成

```typescript
// lib/services/aiService.ts
import { GoogleGenAI } from '@google/genai'

export class AIService {
  private ai: GoogleGenAI

  constructor() {
    this.ai = new GoogleGenAI({})
  }

  // 产品分析
  async analyzeProduct(imageBuffer: Buffer): Promise<string> {
    const prompt = this.buildAnalysisPrompt()
    const contents = [
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBuffer.toString('base64'),
        },
      },
      { text: prompt },
    ]

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
    })
    
    return response.text
  }

  // 生成提示词
  async generatePrompts(
    productDescription: string,
    style: string,
    count: number
  ): Promise<string[]> {
    const metaPrompt = this.buildMetaPrompt(productDescription, style, count)
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: metaPrompt,
    })
    const promptsText = response.text
    
    return this.parsePrompts(promptsText, count)
  }

  // 生成图片
  async generateImage(prompt: string): Promise<Buffer> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
    })
    
    // 处理响应中的图片数据
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data
        return Buffer.from(imageData, 'base64')
      }
    }
    
    throw new Error('No image data found in response')
  }

  // 批量生成图片
  async generateImages(prompts: string[]): Promise<Buffer[]> {
    const images: Buffer[] = []
    
    for (const prompt of prompts) {
      const image = await this.generateImage(prompt)
      images.push(image)
      
      // 避免API限流
      await this.delay(1000)
    }
    
    return images
  }

  private buildAnalysisPrompt(): string {
    return `
      请详细分析这张产品图片，描述产品的：
      1. 类型和名称
      2. 主要特征（颜色、材质、形状、尺寸等）
      3. 设计风格
      4. 适用场景
      
      请用简洁准确的英文描述，适合用于AI图片生成。
    `
  }

  private buildMetaPrompt(
    productDescription: string,
    style: string,
    count: number
  ): string {
    const sceneDescription = style === 'white_background'
      ? 'on a seamless, pure white background with professional studio lighting'
      : 'in a bright, minimalist modern living room with natural lighting'

    return `
      You are an expert product photography director.
      Product: "${productDescription}"
      Style: "${style}"
      Scene: "${sceneDescription}"
      Count: ${count}
      
      Generate ${count} distinct photography prompts as a JSON array.
      Each prompt should describe a different angle/composition of the product.
      
      Output format: ["prompt1", "prompt2", ...]
    `
  }

  private parsePrompts(promptsText: string, expectedCount: number): string[] {
    try {
      const prompts = JSON.parse(promptsText)
      if (Array.isArray(prompts) && prompts.length === expectedCount) {
        return prompts
      }
      throw new Error('Invalid prompts format')
    } catch (error) {
      throw new Error('Failed to parse prompts')
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

#### 6.3.3 本地存储服务

```typescript
// lib/services/storageService.ts
import fs from 'fs'
import path from 'path'

export class StorageService {
  private tempDir: string

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp')
    // 确保临时目录存在
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true })
    }
  }

  // 设置任务进度
  async setProgress(taskId: string, progress: any): Promise<void> {
    const progressFile = path.join(this.tempDir, `progress_${taskId}.json`)
    fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2))
  }

  // 获取任务进度
  async getProgress(taskId: string): Promise<any | null> {
    const progressFile = path.join(this.tempDir, `progress_${taskId}.json`)
    if (!fs.existsSync(progressFile)) {
      return null
    }
    const data = fs.readFileSync(progressFile, 'utf-8')
    return JSON.parse(data)
  }

  // 保存生成结果
  async saveResult(taskId: string, result: any): Promise<void> {
    const resultFile = path.join(this.tempDir, `result_${taskId}.json`)
    fs.writeFileSync(resultFile, JSON.stringify(result, null, 2))
  }

  // 获取生成结果
  async getResult(taskId: string): Promise<any | null> {
    const resultFile = path.join(this.tempDir, `result_${taskId}.json`)
    if (!fs.existsSync(resultFile)) {
      return null
    }
    const data = fs.readFileSync(resultFile, 'utf-8')
    return JSON.parse(data)
  }

  // 清理临时文件
  async cleanup(): Promise<void> {
    const files = fs.readdirSync(this.tempDir)
    const now = Date.now()
    const oneHour = 60 * 60 * 1000

    files.forEach(file => {
      const filePath = path.join(this.tempDir, file)
      const stats = fs.statSync(filePath)
      if (now - stats.mtime.getTime() > oneHour) {
        fs.unlinkSync(filePath)
      }
    })
  }
}
```

## 7. 简化数据存储设计

### 7.1 本地文件存储结构

```
project-root/
├── public/
│   └── uploads/               # 用户上传的图片（临时存储）
│       ├── task_123456789_original.jpg
│       └── task_123456790_original.jpg
├── generated/                 # AI生成的图片
│   ├── task_123456789_img_001.jpg
│   ├── task_123456789_img_002.jpg
│   └── ...
└── temp/                     # 临时处理文件
    └── processing/
```

### 7.2 内存状态管理

```typescript
// lib/storage/memoryStore.ts
interface TaskProgress {
  taskId: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  currentImage: number
  totalImages: number
  message: string
  startedAt: Date
  updatedAt: Date
}

interface GeneratedResult {
  taskId: string
  images: string[]
  metadata: any
  generatedAt: Date
}

export class MemoryStore {
  private static progressMap = new Map<string, TaskProgress>()
  private static resultMap = new Map<string, GeneratedResult>()
  
  // 任务进度管理
  static setProgress(taskId: string, progress: TaskProgress): void {
    this.progressMap.set(taskId, progress)
  }
  
  static getProgress(taskId: string): TaskProgress | undefined {
    return this.progressMap.get(taskId)
  }
  
  // 结果管理
  static setResult(taskId: string, result: GeneratedResult): void {
    this.resultMap.set(taskId, result)
  }
  
  static getResult(taskId: string): GeneratedResult | undefined {
    return this.resultMap.get(taskId)
  }
  
  // 清理过期数据
  static cleanup(): void {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    // 清理1小时前的进度数据
    for (const [taskId, progress] of this.progressMap.entries()) {
      if (progress.updatedAt < oneHourAgo) {
        this.progressMap.delete(taskId)
      }
    }
    
    // 清理24小时前的结果数据
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    for (const [taskId, result] of this.resultMap.entries()) {
      if (result.generatedAt < oneDayAgo) {
        this.resultMap.delete(taskId)
      }
    }
  }
}
```

## 8. 本地文件管理

### 8.1 本地文件存储

#### 8.1.1 文件目录结构

```
public/
├── uploads/           # 用户上传的图片
│   └── [timestamp]/   # 按时间戳分组
├── generated/         # AI生成的图片
│   └── [timestamp]/   # 按时间戳分组
└── temp/             # 临时文件
    └── [session]/    # 按会话分组
```

#### 8.1.2 文件管理服务

```typescript
// lib/services/fileManager.ts
import fs from 'fs/promises'
import path from 'path'

export class LocalFileManager {
  private static readonly UPLOAD_DIR = 'public/uploads'
  private static readonly GENERATED_DIR = 'public/generated'
  private static readonly TEMP_DIR = 'public/temp'

  // 确保目录存在
  static async ensureDirectories(): Promise<void> {
    const dirs = [this.UPLOAD_DIR, this.GENERATED_DIR, this.TEMP_DIR]
    
    for (const dir of dirs) {
      try {
        await fs.access(dir)
      } catch {
        await fs.mkdir(dir, { recursive: true })
      }
    }
  }

  // 保存上传文件
  static async saveUploadedFile(
    file: File, 
    timestamp: string
  ): Promise<string> {
    const uploadDir = path.join(this.UPLOAD_DIR, timestamp)
    await fs.mkdir(uploadDir, { recursive: true })
    
    const fileName = `${Date.now()}-${file.name}`
    const filePath = path.join(uploadDir, fileName)
    
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, buffer)
    
    return `/uploads/${timestamp}/${fileName}`
  }

  // 保存生成的图片
  static async saveGeneratedImage(
    imageBuffer: Buffer,
    timestamp: string,
    fileName: string
  ): Promise<string> {
    const generatedDir = path.join(this.GENERATED_DIR, timestamp)
    await fs.mkdir(generatedDir, { recursive: true })
    
    const filePath = path.join(generatedDir, fileName)
    await fs.writeFile(filePath, imageBuffer)
    
    return `/generated/${timestamp}/${fileName}`
  }

  // 清理过期文件（超过24小时）
  static async cleanupOldFiles(): Promise<void> {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000 // 24小时前
    
    const dirs = [this.UPLOAD_DIR, this.GENERATED_DIR, this.TEMP_DIR]
    
    for (const baseDir of dirs) {
      try {
        const entries = await fs.readdir(baseDir)
        
        for (const entry of entries) {
          const entryPath = path.join(baseDir, entry)
          const stats = await fs.stat(entryPath)
          
          if (stats.isDirectory() && stats.ctimeMs < cutoffTime) {
            await fs.rm(entryPath, { recursive: true, force: true })
            console.log(`已清理过期目录: ${entryPath}`)
          }
        }
      } catch (error) {
        console.error(`清理目录失败 ${baseDir}:`, error)
      }
    }
  }
}
```

### 8.2 环境配置

#### 8.2.1 简化的环境变量

```bash
# .env.local
GEMINI_API_KEY=AIzaSyD8xGsF1WrnRhIr4RQOThZ5jxgkbgCarfs
```

## 9. 本地开发配置

### 9.1 开发环境设置

#### 9.1.1 package.json脚本

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

#### 9.1.2 next.config.js配置

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sharp']
  },
  images: {
    domains: ['localhost'],
    unoptimized: true
  }
}

module.exports = nextConfig
```

### 9.2 本地启动

#### 9.2.1 启动开发服务器

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

#### 9.2.2 访问应用

- 本地地址：http://localhost:3000
- 支持热重载，修改代码自动刷新

## 10. 简化部署方案

### 10.1 本地部署

#### 10.1.1 生产构建

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

## 11. 简化日志

### 11.1 基础日志

#### 11.1.1 控制台日志

```typescript
// lib/utils/logger.ts
export class SimpleLogger {
  static info(message: string, data?: any) {
    console.log(`[INFO] ${message}`, data || '')
  }

  static error(message: string, error?: Error) {
    console.error(`[ERROR] ${message}`, error || '')
  }

  static warn(message: string, data?: any) {
    console.warn(`[WARN] ${message}`, data || '')
  }
}
```

## 12. 简化测试

### 12.1 手动测试

#### 12.1.1 基本功能测试

1. **图片上传测试**
   - 上传JPG、PNG、WebP格式图片
   - 验证文件大小限制（10MB）
   - 检查图片预览显示

2. **场景选择测试**
   - 测试5个预设场景模板
   - 验证场景描述显示正确

3. **图片生成测试**
   - 测试不同数量生成（1-5张）
   - 验证生成进度显示
   - 检查生成结果展示

4. **下载功能测试**
   - 测试单张图片下载
   - 测试批量下载功能

### 12.2 开发调试

#### 12.2.1 浏览器开发者工具

- 使用Console查看日志输出
- 使用Network面板监控API请求
- 使用Elements面板检查UI渲染

## 13. 快速开始指南

### 13.1 环境要求

- Node.js 18.0+
- npm 或 yarn
- Gemini API Key

### 13.2 项目初始化

```bash
# 1. 创建Next.js项目
npx create-next-app@latest ai-image-generator --typescript --tailwind --eslint --app

# 2. 进入项目目录
cd ai-image-generator

# 3. 安装核心依赖
npm install @google/genai sharp

# 4. 配置环境变量
echo "GEMINI_API_KEY=AIzaSyD8xGsF1WrnRhIr4RQOThZ5jxgkbgCarfs" > .env.local

# 5. 启动开发服务器
npm run dev
```

### 13.3 简化的package.json

```json
{
  "name": "ai-image-generator",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.0.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "@google/genai": "^0.2.0",
    "sharp": "^0.32.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "eslint": "^8.45.0",
    "eslint-config-next": "15.0.0"
  }
}
```

## 14. Google AI API 更新说明

### 14.1 API调用方式修正

根据最新的Google AI官方文档，本文档已更新为使用正确的API调用方式：

#### 14.1.1 主要变更
1. **SDK包名更新**：`@google/generative-ai` → `@google/genai`
2. **类名更新**：`GoogleGenerativeAI` → `GoogleGenAI`
3. **模型名称更新**：
   - `gemini-pro-vision` → `gemini-2.5-flash` (图片理解)
   - `gemini-pro` → `gemini-2.5-flash` (文本生成)
   - `nano-banana` → `gemini-2.5-flash-image` (图片生成)

#### 14.1.2 API调用方式更新
- **统一调用方法**：使用 `ai.models.generateContent()` 方法
- **响应处理更新**：使用 `response.candidates[0].content.parts` 结构处理图片数据
- **内容格式更新**：图片理解使用 `contents` 数组格式

#### 14.1.3 环境配置
- **API密钥**：已配置为提供的密钥 `AIzaSyD8xGsF1WrnRhIr4RQOThZ5jxgkbgCarfs`
- **依赖包**：package.json已更新为使用 `@google/genai`

## 15. 总结

本简化版TDD文档专注于本地开发和快速测试，主要特点：

1. **简化架构**：Next.js 15 + Gemini API，去掉复杂的云服务和并发处理
2. **本地存储**：使用本地文件系统，无需云存储配置
3. **单用户模式**：专注核心功能，去掉用户认证和权限管理
4. **快速启动**：最小化依赖，快速本地部署测试

核心功能保留：
- 图片上传和预览
- 5个预设场景模板
- Gemini AI图片理解和生成
- 进度显示和结果展示
- 图片下载功能

通过本文档，可以快速搭建一个功能完整的AI电商组图生成器原型，便于快速验证和测试核心功能。
