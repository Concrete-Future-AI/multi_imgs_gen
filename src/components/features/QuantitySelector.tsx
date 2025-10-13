'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { Minus, Plus, Hash } from 'lucide-react'

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
    <div className="space-y-3">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">生成数量</span>
        </div>
        <Badge variant="secondary" className="text-xs px-2 py-0.5">
          {quantity}张
        </Badge>
      </div>

      {/* 数量控制 - 单行布局 */}
      <div className="flex items-center gap-2">
        {/* 减少按钮 */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'h-9 w-9 flex-shrink-0',
            disabled && 'pointer-events-none opacity-50'
          )}
          onClick={() => handleQuantityChange(quantity - 1)}
          disabled={disabled || quantity <= 3}
        >
          <Minus className="w-4 h-4" />
        </Button>

        {/* 快速选择按钮 */}
        <div className="flex items-center gap-1.5 flex-1">
          {quickQuantities.map((num) => (
            <Button
              key={num}
              variant={quantity === num ? "default" : "outline"}
              size="sm"
              className={cn(
                'h-9 flex-1 transition-all',
                disabled && 'pointer-events-none opacity-50'
              )}
              onClick={() => handleQuantityChange(num)}
            >
              {num}
            </Button>
          ))}
        </div>

        {/* 增加按钮 */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'h-9 w-9 flex-shrink-0',
            disabled && 'pointer-events-none opacity-50'
          )}
          onClick={() => handleQuantityChange(quantity + 1)}
          disabled={disabled || quantity >= 8}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
