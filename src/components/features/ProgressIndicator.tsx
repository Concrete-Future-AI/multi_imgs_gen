import React from 'react';
import { Check, AlertTriangle, Clock, Upload, Search, Palette, Sparkles, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STEPS = [
  { 
    id: 1, 
    name: '上传图片', 
    description: '正在上传产品图片',
    icon: Upload,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  { 
    id: 2, 
    name: '分析产品', 
    description: '正在分析产品特征',
    icon: Search,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  { 
    id: 3, 
    name: '生成图片', 
    description: '正在生成展示图片',
    icon: Palette,
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-800'
  },
  { 
    id: 4, 
    name: '完成', 
    description: '图片生成完成',
    icon: CheckCircle,
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800'
  },
];

export function ProgressIndicator() {
  const { generationProgress, isGenerating } = useAppStore();
  const { status, progress, message, currentStep = 0 } = generationProgress;

  if (!isGenerating && status === 'idle') {
    return null;
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'generating':
        return <Badge variant="default" className="animate-pulse">生成中</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">已完成</Badge>;
      case 'error':
        return <Badge variant="destructive">生成失败</Badge>;
      default:
        return <Badge variant="secondary">准备中</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-6 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            生成进度
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8 p-6">
        {/* 总体进度条 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-foreground">
              {message || '准备开始...'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">进度</span>
              <span className="text-lg font-bold text-primary font-mono">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          
          <div className="relative">
            <Progress 
              value={progress} 
              className={cn(
                "h-3 transition-all duration-500 shadow-sm",
                status === 'error' && 'opacity-50'
              )}
            />
            {status === 'generating' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-pulse rounded-full" />
            )}
          </div>
        </div>

        {/* 步骤指示器 */}
        <div className="relative space-y-4">
          {/* 连接线背景 */}
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-border via-border to-transparent" />
          
          {STEPS.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const isError = status === 'error' && isCurrent;
            const isUpcoming = currentStep < step.id;
            const StepIcon = step.icon;

            return (
              <div
                key={step.id}
                className={cn(
                  'relative flex items-center space-x-4 p-4 rounded-2xl transition-all duration-500',
                  'border backdrop-blur-sm',
                  isCompleted && `${step.bgColor} ${step.borderColor} shadow-md`,
                  isCurrent && !isError && `${step.bgColor} ${step.borderColor} shadow-lg scale-[1.02]`,
                  isError && 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 shadow-lg',
                  isUpcoming && 'bg-muted/30 border-muted-foreground/20'
                )}
              >
                {/* 步骤图标 */}
                <div
                  className={cn(
                    'relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-500',
                    'border-2 shadow-lg z-10',
                    isCompleted && 'border-green-500 bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/25',
                    isCurrent && !isError && `border-transparent bg-gradient-to-br ${step.color} shadow-lg`,
                    isError && 'border-red-500 bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/25',
                    isUpcoming && 'border-muted-foreground/30 bg-muted'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6 text-white drop-shadow-sm" />
                  ) : isError ? (
                    <AlertTriangle className="h-6 w-6 text-white drop-shadow-sm" />
                  ) : isCurrent ? (
                    <>
                      <StepIcon className="h-6 w-6 text-white drop-shadow-sm" />
                      <div className="absolute inset-0 rounded-2xl bg-white/20 animate-ping" />
                    </>
                  ) : (
                    <StepIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                
                {/* 步骤内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
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
                    {isCurrent && status === 'generating' && (
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>
                  <p
                    className={cn(
                      'text-sm transition-colors leading-relaxed',
                      isCompleted && 'text-green-600 dark:text-green-400',
                      isCurrent && !isError && 'text-muted-foreground',
                      isError && 'text-red-600 dark:text-red-400',
                      isUpcoming && 'text-muted-foreground/70'
                    )}
                  >
                    {isCurrent && isError ? message : step.description}
                  </p>
                </div>

                {/* 完成时间或状态指示 */}
                {isCompleted && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                      <Check className="w-3 h-3 mr-1" />
                      完成
                    </Badge>
                  </div>
                )}
                
                {isCurrent && status === 'generating' && (
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="animate-pulse">
                      进行中
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 错误状态提示 */}
        {status === 'error' && (
          <div className="p-6 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl shadow-lg">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-2">生成失败</h3>
                <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">{message}</p>
              </div>
            </div>
          </div>
        )}

        {/* 成功状态提示 */}
        {status === 'completed' && (
          <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl shadow-lg">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-700 dark:text-green-300 mb-2">生成完成</h3>
                <p className="text-sm text-green-600 dark:text-green-400 leading-relaxed">所有图片已成功生成，请查看结果</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}