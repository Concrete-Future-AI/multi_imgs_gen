'use client'

import React, { useEffect, useState } from 'react'
import { Check, AlertTriangle, Upload, Brain, Wand2, ImageIcon, CheckCircle, Loader2, Sparkles, Camera } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface WorkflowStep {
  id: string
  name: string
  description: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
  estimatedTime?: string
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  { 
    id: 'upload', 
    name: '上传图片', 
    description: '正在准备产品图片数据',
    icon: Upload,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    estimatedTime: '2秒'
  },
  { 
    id: 'analyze', 
    name: '分析与理解', 
    description: 'AI正在深度分析产品特征、材质、颜色等信息',
    icon: Brain,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    estimatedTime: '30秒'
  },
  { 
    id: 'planning', 
    name: '规划创作方案', 
    description: '基于产品特征生成专业的摄影方案',
    icon: Wand2,
    color: 'from-indigo-500 to-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    estimatedTime: '30秒'
  },
  { 
    id: 'design', 
    name: '设计拍摄场景', 
    description: '为每个视角设计最佳的构图和光线',
    icon: Camera,
    color: 'from-pink-500 to-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-950/20',
    borderColor: 'border-pink-200 dark:border-pink-800',
    estimatedTime: '5秒'
  },
  { 
    id: 'generating', 
    name: '生成组图', 
    description: 'AI正在生成不同视角的专业产品图',
    icon: ImageIcon,
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    estimatedTime: '60-90秒'
  },
  { 
    id: 'completed', 
    name: '完成', 
    description: '所有图片生成完成，已保存到本地',
    icon: CheckCircle,
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800'
  },
]

export function AgentWorkflowProgress() {
  const { generationProgress, isGenerating, quantity } = useAppStore()
  const { status, progress, message, currentStep = 0 } = generationProgress
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState<string>('upload')
  const [generatingImageIndex, setGeneratingImageIndex] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)

  // 根据进度映射到工作流步骤
  useEffect(() => {
    if (progress === 0 || status === 'idle') {
      setCurrentWorkflowStep('upload')
      setElapsedTime(0)
    } else if (progress > 0 && progress <= 20) {
      setCurrentWorkflowStep('upload')
    } else if (progress > 20 && progress <= 40) {
      setCurrentWorkflowStep('analyze')
    } else if (progress > 40 && progress <= 50) {
      setCurrentWorkflowStep('planning')
    } else if (progress > 50 && progress <= 60) {
      setCurrentWorkflowStep('design')
    } else if (progress > 60 && progress < 100) {
      setCurrentWorkflowStep('generating')
      // 估算当前生成到第几张
      const generatingProgress = (progress - 60) / 40
      setGeneratingImageIndex(Math.floor(generatingProgress * quantity) + 1)
    } else if (progress === 100 || status === 'completed') {
      setCurrentWorkflowStep('completed')
    }
  }, [progress, status, quantity])

  // 计时器
  useEffect(() => {
    if (!isGenerating) {
      setElapsedTime(0)
      return
    }

    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [isGenerating])

  if (!isGenerating && status === 'idle') {
    return null
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'generating':
        return (
          <Badge variant="default" className="animate-pulse">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            生成中
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <Check className="w-3 h-3 mr-1" />
            已完成
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            失败
          </Badge>
        )
      default:
        return <Badge variant="secondary">准备中</Badge>
    }
  }

  return (
    <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-card via-card to-card/80">
      <CardHeader className="pb-4 space-y-0">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
            </div>
            <CardTitle className="text-lg font-bold">AI创作进行中</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <div className="flex items-center justify-between text-sm pl-11">
          <span className="text-muted-foreground">
            AI正在精心创作您的产品图片
          </span>
          <span className="text-muted-foreground font-medium">
            已耗时 {formatTime(elapsedTime)}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 p-6">
        {/* 总体进度 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              {message || '正在初始化...'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">完成度</span>
              <span className="text-2xl font-bold text-primary font-mono tabular-nums">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          
          <div className="relative h-3 rounded-full overflow-hidden bg-secondary/30 shadow-inner">
            <div 
              className={cn(
                "h-full transition-all duration-700 ease-out",
                "bg-gradient-to-r from-primary via-primary/90 to-primary",
                "relative overflow-hidden"
              )}
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* 工作流步骤 */}
        <div className="relative space-y-3">
          {/* 连接线 */}
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-border via-border/50 to-transparent" />
          
          {WORKFLOW_STEPS.map((step, index) => {
            const isCompleted = WORKFLOW_STEPS.findIndex(s => s.id === currentWorkflowStep) > index
            const isCurrent = step.id === currentWorkflowStep
            const isError = status === 'error' && isCurrent
            const isUpcoming = WORKFLOW_STEPS.findIndex(s => s.id === currentWorkflowStep) < index
            const StepIcon = step.icon

            return (
              <div
                key={step.id}
                className={cn(
                  'relative flex items-start space-x-4 p-4 rounded-xl transition-all duration-500',
                  'border backdrop-blur-sm',
                  isCompleted && `${step.bgColor} ${step.borderColor} shadow-md`,
                  isCurrent && !isError && `${step.bgColor} ${step.borderColor} shadow-lg scale-[1.02] ring-2 ring-primary/20`,
                  isError && 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 shadow-lg',
                  isUpcoming && 'bg-muted/20 border-muted-foreground/10 opacity-60'
                )}
              >
                {/* 步骤图标 */}
                <div
                  className={cn(
                    'relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-500',
                    'border-2 shadow-lg z-10',
                    isCompleted && 'border-green-500 bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/30 scale-110',
                    isCurrent && !isError && `border-transparent bg-gradient-to-br ${step.color} shadow-lg scale-105`,
                    isError && 'border-red-500 bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/30',
                    isUpcoming && 'border-muted-foreground/20 bg-muted'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6 text-white drop-shadow-md animate-in zoom-in duration-300" />
                  ) : isError ? (
                    <AlertTriangle className="h-6 w-6 text-white drop-shadow-md animate-bounce" />
                  ) : isCurrent ? (
                    <div className="relative">
                      <StepIcon className="h-6 w-6 text-white drop-shadow-md" />
                      <div className="absolute inset-0 rounded-xl bg-white/30 animate-ping" />
                    </div>
                  ) : (
                    <StepIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                
                {/* 步骤内容 */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-3">
                    <h4
                      className={cn(
                        'text-base font-bold transition-colors',
                        isCompleted && 'text-green-700 dark:text-green-300',
                        isCurrent && !isError && 'text-foreground',
                        isError && 'text-red-700 dark:text-red-300',
                        isUpcoming && 'text-muted-foreground'
                      )}
                    >
                      {step.name}
                    </h4>
                    
                    {step.estimatedTime && isCurrent && !isCompleted && (
                      <Badge variant="outline" className="text-xs">
                        预计 {step.estimatedTime}
                      </Badge>
                    )}
                    
                    {isCurrent && status === 'generating' && step.id !== 'completed' && (
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>
                  
                  <p
                    className={cn(
                      'text-sm transition-colors leading-relaxed',
                      isCompleted && 'text-green-600 dark:text-green-400',
                      isCurrent && !isError && 'text-muted-foreground',
                      isError && 'text-red-600 dark:text-red-400',
                      isUpcoming && 'text-muted-foreground/60'
                    )}
                  >
                    {isCurrent && isError ? message : step.description}
                  </p>

                  {/* 生成组图时显示子进度 */}
                  {isCurrent && step.id === 'generating' && status === 'generating' && (
                    <div className="mt-3 space-y-2 p-3 rounded-lg bg-background/50 border border-border/50">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">正在生成第 {generatingImageIndex} 张</span>
                        <span className="font-semibold text-primary">{generatingImageIndex}/{quantity}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {Array.from({ length: quantity }).map((_, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              'h-1.5 rounded-full transition-all duration-300',
                              idx < generatingImageIndex ? 'bg-primary shadow-sm' : 'bg-muted'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 状态标签 */}
                <div className="flex-shrink-0">
                  {isCompleted && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400">
                      <Check className="w-3 h-3 mr-1" />
                      完成
                    </Badge>
                  )}
                  
                  {isCurrent && status === 'generating' && !isError && (
                    <Badge variant="default" className="animate-pulse">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      进行中
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 错误提示 */}
        {status === 'error' && (
          <div className="p-5 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl shadow-lg animate-in slide-in-from-top duration-300">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-red-700 dark:text-red-300 mb-2">生成失败</h3>
                <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">{message}</p>
                <p className="text-xs text-red-500 dark:text-red-500 mt-2">请检查网络连接或稍后重试</p>
              </div>
            </div>
          </div>
        )}

        {/* 成功提示 */}
        {status === 'completed' && (
          <div className="p-5 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl shadow-lg animate-in slide-in-from-bottom duration-300">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-green-700 dark:text-green-300 mb-2">
                  🎉 创作完成！
                </h3>
                <p className="text-sm text-green-600 dark:text-green-400 leading-relaxed">
                  已成功生成 {quantity} 张专业产品图，总耗时 {formatTime(elapsedTime)}
                </p>
                <p className="text-xs text-green-500 dark:text-green-500 mt-2">
                  所有图片已保存，请在下方查看结果
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 提示信息 */}
        {status === 'generating' && currentWorkflowStep === 'generating' && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary mt-0.5 animate-pulse" />
              <div className="text-sm text-muted-foreground leading-relaxed">
                <p className="font-medium text-foreground mb-1">AI正在精心创作中</p>
                <p>每张图片都经过精心设计，包含不同的拍摄角度和光线效果，请耐心等待...</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
