'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { STYLE_OPTIONS } from '@/lib/constants'
import { Palette, Sparkles, Camera, Zap, Check, Star, Wand2, Cpu, Clock } from 'lucide-react'

interface StyleSelectorProps {
  disabled?: boolean
  onStyleSelect?: () => void
}

// 为每个风格添加UI属性，保持原有的视觉设计
const styleUIConfig = {
  'modern-minimalist': {
    icon: Sparkles,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-700 dark:text-blue-300',
    iconColor: 'text-blue-600 dark:text-blue-400',
    tags: ['简约', '现代', '清新']
  },
  'luxury-elegant': {
    icon: Star,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    textColor: 'text-purple-700 dark:text-purple-300',
    iconColor: 'text-purple-600 dark:text-purple-400',
    tags: ['奢华', '高端', '质感']
  },
  'lifestyle-casual': {
    icon: Camera,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800',
    textColor: 'text-green-700 dark:text-green-300',
    iconColor: 'text-green-600 dark:text-green-400',
    tags: ['生活', '场景', '自然']
  },
  'creative-artistic': {
    icon: Wand2,
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    textColor: 'text-orange-700 dark:text-orange-300',
    iconColor: 'text-orange-600 dark:text-orange-400',
    tags: ['创意', '艺术', '个性']
  },
  'tech-futuristic': {
    icon: Cpu,
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/20',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    textColor: 'text-cyan-700 dark:text-cyan-300',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    tags: ['科技', '未来', '炫酷']
  },
  'vintage-retro': {
    icon: Clock,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    textColor: 'text-amber-700 dark:text-amber-300',
    iconColor: 'text-amber-600 dark:text-amber-400',
    tags: ['复古', '怀旧', '经典']
  }
}

// 合并 STYLE_OPTIONS 和 UI 配置
const styles = STYLE_OPTIONS.map(style => ({
  ...style,
  ...styleUIConfig[style.id as keyof typeof styleUIConfig]
}))

export function StyleSelector({ disabled = false, onStyleSelect }: StyleSelectorProps) {
  const { selectedStyle, setSelectedStyle } = useAppStore()
  const [hoveredStyle, setHoveredStyle] = useState<string | null>(null)

  const handleStyleSelect = (styleId: string) => {
    if (disabled) return
    const style = styles.find(s => s.id === styleId)
    if (style) {
      setSelectedStyle({
        id: style.id,
        name: style.name,
        description: style.description,
        preview: style.preview,
        prompt: style.prompt
      })
    }
    onStyleSelect?.()
  }

  return (
    <div className="space-y-6">
      {/* 标题和描述 */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground">选择生成风格</h3>
        <p className="text-sm text-muted-foreground">
          选择最适合您产品的摄影风格，AI将根据您的选择生成专业的产品图片
        </p>
      </div>

      {/* 风格选项卡 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {styles.map((style) => {
          const Icon = style.icon
          const isSelected = selectedStyle?.id === style.id
          const isHovered = hoveredStyle === style.id

          return (
            <div
              key={style.id}
              className={cn(
                'relative group cursor-pointer transition-all duration-300',
                disabled && 'pointer-events-none opacity-50'
              )}
              onMouseEnter={() => setHoveredStyle(style.id)}
              onMouseLeave={() => setHoveredStyle(null)}
              onClick={() => handleStyleSelect(style.id)}
            >
              {/* 主卡片 */}
              <div className={cn(
                'relative overflow-hidden rounded-xl border-2 transition-all duration-300 bg-card',
                isSelected 
                  ? 'border-primary shadow-lg shadow-primary/10 scale-[1.02]' 
                  : 'border-border hover:border-primary/50 hover:shadow-md'
              )}>
                {/* 预览图片区域 */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={style.preview}
                    alt={style.name}
                    className={cn(
                      'w-full h-full object-cover transition-all duration-500',
                      isHovered && 'scale-110',
                      isSelected && 'scale-105'
                    )}
                    loading="lazy"
                  />
                  
                  {/* 渐变覆盖层 */}
                  <div className={cn(
                    'absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300',
                    isHovered ? 'opacity-100' : 'opacity-70'
                  )} />

                  {/* 选中状态指示器 */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 bg-primary rounded-full shadow-lg">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}

                  {/* 风格图标 */}
                  <div className={cn(
                    'absolute top-3 left-3 flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 backdrop-blur-sm',
                    isSelected 
                      ? 'bg-primary/90 text-primary-foreground shadow-lg' 
                      : 'bg-background/80 text-foreground'
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* 底部标题 */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h4 className="text-white font-semibold text-lg mb-1">
                      {style.name}
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {style.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 内容区域 */}
                <div className={cn(
                  'p-4 transition-all duration-300',
                  isSelected ? style.bgColor : 'bg-card'
                )}>
                  <div className="space-y-3">
                    {/* 描述 */}
                    <p className={cn(
                      'text-sm leading-relaxed',
                      isSelected ? style.textColor : 'text-muted-foreground'
                    )}>
                      {style.description}
                    </p>

                    {/* 选择按钮 */}
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        'w-full transition-all duration-200',
                        isSelected && 'shadow-md'
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStyleSelect(style.id)
                      }}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          已选择此风格
                        </>
                      ) : (
                        <>
                          <Icon className="w-4 h-4 mr-2" />
                          选择此风格
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* 悬浮光晕效果 */}
              {isHovered && !disabled && (
                <div className={cn(
                  'absolute -inset-1 rounded-xl blur-sm -z-10 opacity-30',
                  `bg-gradient-to-r ${style.color}`
                )} />
              )}
            </div>
          )
        })}
      </div>

      {/* 当前选择状态 */}
      {selectedStyle && (
        <div className={cn(
          'flex items-center gap-4 p-4 rounded-xl border transition-all duration-300',
          styles.find(s => s.id === selectedStyle.id)?.bgColor,
          styles.find(s => s.id === selectedStyle.id)?.borderColor
        )}>
          <div className={cn(
            'flex items-center justify-center w-12 h-12 rounded-xl',
            'bg-gradient-to-br shadow-sm',
            styles.find(s => s.id === selectedStyle.id)?.color
          )}>
            {(() => {
              const style = styles.find(s => s.id === selectedStyle.id)
              const Icon = style?.icon || Sparkles
              return <Icon className="w-6 h-6 text-white" />
            })()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-foreground">
                已选择：{selectedStyle.name}
              </p>
              <Badge variant="default" className="text-xs">
                <Check className="w-3 h-3 mr-1" />
                确认
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedStyle.description}
            </p>
          </div>
        </div>
      )}

      {/* 提示信息 */}
      {!selectedStyle && !disabled && (
        <div className="text-center p-6 border border-dashed border-muted-foreground/25 rounded-xl bg-muted/30">
          <div className="space-y-2">
            <Palette className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              请选择一种风格
            </p>
            <p className="text-xs text-muted-foreground">
              选择最适合您产品的摄影风格来开始生成
            </p>
          </div>
        </div>
      )}
    </div>
  )
}