'use client'

import React, { useEffect, useState } from 'react'
import { Check, AlertTriangle, Upload, Brain, Wand2, ImageIcon, CheckCircle, Loader2, Sparkles, Camera, Zap } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  const { status, progress, message } = generationProgress
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
    <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <CardHeader className="pb-6 border-b border-border/50 bg-gradient-to-r from-transparent via-primary/5 to-transparent">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg">
              <Sparkles className="h-5 w-5 text-white relative z-10" />
              <div className="absolute inset-0 rounded-2xl bg-white/30 blur-sm animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI创作进行中
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">精心设计每一个细节</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span className="text-xs font-semibold text-primary">{formatTime(elapsedTime)}</span>
            </div>
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 p-6">
        {/* 总体进度 */}
        <div className="relative p-5 rounded-2xl bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border border-primary/10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground mb-1">
                {message || '正在初始化...'}
              </p>
              <p className="text-xs text-muted-foreground">
                请保持页面打开，AI正在为您创作
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-mono tabular-nums">
                {Math.round(progress)}%
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">完成度</p>
            </div>
          </div>
          
          <div className="relative h-2.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shadow-inner">
            <div 
              className={cn(
                "h-full transition-all duration-700 ease-out",
                "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500",
                "relative overflow-hidden shadow-lg"
              )}
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>

        {/* 工作流步骤 */}
        <div className="relative space-y-4">
          {/* 连接线 - 更精致的设计 */}
          <div className="absolute left-7 top-8 bottom-8 w-px bg-gradient-to-b from-blue-200 via-purple-200 to-pink-200 dark:from-blue-800 dark:via-purple-800 dark:to-pink-800" />
          
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
                  'relative flex items-start space-x-5 p-5 rounded-2xl transition-all duration-500',
                  'border-2 backdrop-blur-sm',
                  isCompleted && 'bg-gradient-to-r from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-300/50 dark:border-emerald-700/50 shadow-md',
                  isCurrent && !isError && 'bg-gradient-to-r from-blue-50/80 via-purple-50/80 to-pink-50/80 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 border-primary/40 shadow-xl ring-4 ring-primary/10',
                  isError && 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-300 dark:border-red-700 shadow-xl',
                  isUpcoming && 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-700/50 opacity-50'
                )}
              >
                {/* 步骤图标 - 更精致的设计 */}
                <div
                  className={cn(
                    'relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl transition-all duration-500',
                    'border-2 shadow-xl z-10',
                    isCompleted && 'border-emerald-400 bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/40',
                    isCurrent && !isError && 'border-white/50 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-purple-500/40 scale-105',
                    isError && 'border-white/50 bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/40',
                    isUpcoming && 'border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-700'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6 text-white drop-shadow-lg animate-in zoom-in duration-300" />
                  ) : isError ? (
                    <AlertTriangle className="h-6 w-6 text-white drop-shadow-lg animate-bounce" />
                  ) : isCurrent ? (
                    <div className="relative">
                      <StepIcon className="h-6 w-6 text-white drop-shadow-lg" />
                      <div className="absolute -inset-2 rounded-2xl bg-white/20 animate-ping" />
                    </div>
                  ) : (
                    <StepIcon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                  )}
                  
                  {/* 光晕效果 */}
                  {(isCompleted || isCurrent) && (
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-white/30 to-transparent blur-sm" />
                  )}
                </div>
                
                {/* 步骤内容 */}
                <div className="flex-1 min-w-0 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <h4
                      className={cn(
                        'text-lg font-bold transition-colors',
                        isCompleted && 'text-emerald-700 dark:text-emerald-300',
                        isCurrent && !isError && 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
                        isError && 'text-red-700 dark:text-red-300',
                        isUpcoming && 'text-slate-500 dark:text-slate-400'
                      )}
                    >
                      {step.name}
                    </h4>
                    
                    {step.estimatedTime && isCurrent && !isCompleted && (
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
                        <Sparkles className="w-3 h-3 mr-1" />
                        预计 {step.estimatedTime}
                      </Badge>
                    )}
                    
                    {isCurrent && status === 'generating' && step.id !== 'completed' && (
                      <div className="flex space-x-1.5">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>
                  
                  <p
                    className={cn(
                      'text-sm transition-colors leading-relaxed',
                      isCompleted && 'text-emerald-600 dark:text-emerald-400',
                      isCurrent && !isError && 'text-slate-600 dark:text-slate-300',
                      isError && 'text-red-600 dark:text-red-400',
                      isUpcoming && 'text-slate-400 dark:text-slate-500'
                    )}
                  >
                    {isCurrent && isError ? message : step.description}
                  </p>

                  {/* 生成组图时显示子进度 - 更精致的设计 */}
                  {isCurrent && step.id === 'generating' && status === 'generating' && (
                    <div className="mt-4 space-y-3 p-4 rounded-xl bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 border border-primary/20 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-primary animate-pulse" />
                          <span className="text-sm font-medium text-foreground">正在生成第 {generatingImageIndex} 张</span>
                        </div>
                        <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {generatingImageIndex}/{quantity}
                        </span>
                      </div>
                      <div className="grid grid-cols-8 gap-2">
                        {Array.from({ length: quantity }).map((_, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              'h-2 rounded-full transition-all duration-500',
                              idx < generatingImageIndex 
                                ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-md scale-110' 
                                : 'bg-slate-200 dark:bg-slate-700'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 状态标签 - 更精致的设计 */}
                <div className="flex-shrink-0">
                  {isCompleted && (
                    <Badge variant="secondary" className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-300 dark:from-emerald-900/30 dark:to-green-900/30 dark:text-emerald-400 dark:border-emerald-700 shadow-sm">
                      <Check className="w-3.5 h-3.5 mr-1" />
                      完成
                    </Badge>
                  )}
                  
                  {isCurrent && status === 'generating' && !isError && (
                    <Badge variant="default" className="bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse shadow-lg">
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      进行中
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 错误提示 - 更精致的设计 */}
        {status === 'error' && (
          <div className="p-6 bg-gradient-to-br from-red-50 via-rose-50 to-red-50 dark:from-red-950/30 dark:via-rose-950/30 dark:to-red-950/30 border-2 border-red-300 dark:border-red-700 rounded-2xl shadow-2xl animate-in slide-in-from-top duration-500">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-lg">
                <AlertTriangle className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-2 flex items-center gap-2">
                  生成失败
                  <Badge variant="destructive" className="text-xs">错误</Badge>
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed mb-3">{message}</p>
                <div className="flex items-center gap-2 text-xs text-red-500 dark:text-red-500 bg-red-100/50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>请检查网络连接或稍后重试</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 成功提示 - 更精致的设计 */}
        {status === 'completed' && (
          <div className="p-6 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/30 dark:to-teal-950/30 border-2 border-emerald-300 dark:border-emerald-700 rounded-2xl shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg animate-bounce">
                <CheckCircle className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-700 to-green-700 bg-clip-text text-transparent mb-2 flex items-center gap-2">
                  🎉 创作完成！
                  <Badge variant="secondary" className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-300">
                    <Check className="w-3 h-3 mr-1" />
                    成功
                  </Badge>
                </h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 leading-relaxed mb-3">
                  已成功生成 <span className="font-bold">{quantity}</span> 张专业产品图，总耗时 <span className="font-bold">{formatTime(elapsedTime)}</span>
                </p>
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>所有图片已保存，请在下方查看结果</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 提示信息 - 更精致的设计 */}
        {status === 'generating' && currentWorkflowStep === 'generating' && (
          <div className="p-5 bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 border border-primary/20 rounded-2xl shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-2 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-md">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div className="flex-1 text-sm leading-relaxed">
                <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  AI正在精心创作中
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  每张图片都经过精心设计，包含不同的拍摄角度和光线效果，请保持页面打开...
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
