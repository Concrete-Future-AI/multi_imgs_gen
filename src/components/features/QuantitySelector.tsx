'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { Minus, Plus, Hash, Wand2, Type } from 'lucide-react'

interface QuantitySelectorProps {
  disabled?: boolean
}

export function QuantitySelector({ disabled = false }: QuantitySelectorProps) {
  const { quantity, setQuantity, customPrompt, setCustomPrompt } = useAppStore()
  const [localPrompt, setLocalPrompt] = useState(customPrompt || '')

  const handleQuantityChange = (newQuantity: number) => {
    if (disabled) return
    const clampedQuantity = Math.max(3, Math.min(8, newQuantity))
    setQuantity(clampedQuantity)
  }

  const handlePromptChange = (value: string) => {
    setLocalPrompt(value)
    setCustomPrompt(value)
  }

  const quickQuantities = [3, 4, 5, 6, 8]

  return (
    <div className="space-y-6">
      {/* 生成数量选择 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">生成数量</h3>
          <Badge variant="secondary" className="text-xs">
            {quantity}张
          </Badge>
        </div>

        {/* 快速选择按钮 */}
        <div className="flex items-center gap-2 flex-wrap">
          {quickQuantities.map((num) => (
            <Button
              key={num}
              variant={quantity === num ? "default" : "outline"}
              size="sm"
              className={cn(
                'transition-all',
                disabled && 'pointer-events-none opacity-50'
              )}
              onClick={() => handleQuantityChange(num)}
            >
              {num}张
            </Button>
          ))}
        </div>

        {/* 精确数量控制 */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className={cn(
              'h-9 w-9',
              disabled && 'pointer-events-none opacity-50'
            )}
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={disabled || quantity <= 3}
          >
            <Minus className="w-4 h-4" />
          </Button>

          <div className="flex-1 max-w-[100px]">
            <Input
              type="number"
              min={3}
              max={8}
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 3)}
              className="text-center"
              disabled={disabled}
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            className={cn(
              'h-9 w-9',
              disabled && 'pointer-events-none opacity-50'
            )}
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={disabled || quantity >= 8}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* 数量说明 */}
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <Wand2 className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            建议生成 3-8 张图片，数量越多生成时间越长
          </p>
        </div>
      </div>

      {/* 自定义提示词 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">自定义提示词</h3>
          <Badge variant="outline" className="text-xs">
            可选
          </Badge>
        </div>

        <div className="space-y-3">
          <textarea
            placeholder="描述您希望的特殊效果、背景、光线等要求..."
            value={localPrompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            className={cn(
              'w-full min-h-[100px] p-3 text-sm border rounded-lg resize-none transition-colors',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-1 focus:ring-ring',
              disabled && 'pointer-events-none opacity-50'
            )}
            disabled={disabled}
          />

          {/* 字符计数 */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>提示词将与选择的风格结合使用</span>
            <span>{localPrompt.length}/200</span>
          </div>
        </div>

        {/* 提示词建议 */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">建议关键词：</p>
          <div className="flex flex-wrap gap-2">
            {[
              '高清画质',
              '专业摄影',
              '柔和光线',
              '简洁背景',
              '产品特写',
              '质感突出'
            ].map((keyword) => (
              <Button
                key={keyword}
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 px-2 text-xs border border-dashed border-muted-foreground/30',
                  'hover:border-primary hover:text-primary',
                  disabled && 'pointer-events-none opacity-50'
                )}
                onClick={() => {
                  if (!disabled) {
                    const newPrompt = localPrompt 
                      ? `${localPrompt}, ${keyword}` 
                      : keyword
                    handlePromptChange(newPrompt)
                  }
                }}
              >
                + {keyword}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* 设置摘要 */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
        <h4 className="font-medium text-sm">当前设置</h4>
        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>生成数量:</span>
            <Badge variant="secondary">{quantity}张图片</Badge>
          </div>
          {localPrompt && (
            <div className="space-y-1">
              <span>自定义要求:</span>
              <p className="text-xs bg-background p-2 rounded border">
                {localPrompt || '无特殊要求'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}