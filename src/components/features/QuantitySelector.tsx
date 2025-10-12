'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { Minus, Plus, Hash, Wand2 } from 'lucide-react'

interface QuantitySelectorProps {
  disabled?: boolean
}

export function QuantitySelector({ disabled = false }: QuantitySelectorProps) {
  const { quantity, setQuantity } = useAppStore()

  const handleQuantityChange = (newQuantity: number) => {
    if (disabled) return
    const clampedQuantity = Math.max(3, Math.min(8, newQuantity))
    setQuantity(clampedQuantity)
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
            系统会自动为每张图片生成不同的拍摄角度和距离，建议生成 3-8 张
          </p>
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
          <p className="text-xs mt-2 text-muted-foreground">
            AI将根据产品特征和选择的风格，自动为每张图片生成最佳的拍摄角度
          </p>
        </div>
      </div>
    </div>
  )
}
