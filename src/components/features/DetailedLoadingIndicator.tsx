'use client';

import { useEffect, useState } from 'react';
import { Loader2, Upload, Cpu, Palette, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DetailedLoadingIndicatorProps {
  status: 'idle' | 'uploading' | 'processing' | 'generating' | 'completed' | 'failed' | 'error';
  progress: number;
  generatingImageIndex?: number;
  quantity?: number;
  className?: string;
}

export function DetailedLoadingIndicator({
  status,
  progress,
  generatingImageIndex = 0,
  quantity = 1,
  className
}: DetailedLoadingIndicatorProps) {
  const [dots, setDots] = useState('');

  // 动态点点点效果
  useEffect(() => {
    if (status === 'idle' || status === 'completed' || status === 'failed' || status === 'error') {
      setDots('');
      return;
    }

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [status]);

  const getStatusConfig = () => {
    switch (status) {
      case 'uploading':
        return {
          icon: Upload,
          text: '上传图片',
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          description: '正在上传您的产品图片到服务器'
        };
      case 'processing':
        return {
          icon: Cpu,
          text: '分析处理',
          color: 'text-purple-500',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/20',
          description: 'AI正在分析图片内容和特征'
        };
      case 'generating':
        return {
          icon: Palette,
          text: '创作生成',
          color: 'text-pink-500',
          bgColor: 'bg-pink-500/10',
          borderColor: 'border-pink-500/20',
          description: `正在生成第 ${generatingImageIndex} 张，共 ${quantity} 张图片`
        };
      case 'completed':
        return {
          icon: CheckCircle,
          text: '生成完成',
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          description: '所有图片已成功生成'
        };
      case 'failed':
      case 'error':
        return {
          icon: AlertTriangle,
          text: '生成失败',
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          description: '生成过程中遇到问题，请重试'
        };
      default:
        return {
          icon: Loader2,
          text: '准备中',
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20',
          description: '正在初始化...'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const isActive = !['idle', 'completed', 'failed', 'error'].includes(status);

  return (
    <div className={cn(
      'flex items-center gap-4 p-4 rounded-xl border transition-all duration-500',
      config.bgColor,
      config.borderColor,
      isActive && 'shadow-lg',
      className
    )}>
      {/* 图标 */}
      <div className={cn(
        'flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-500',
        config.color,
        config.borderColor,
        isActive && 'animate-pulse'
      )}>
        <Icon className={cn(
          'w-6 h-6',
          config.color,
          isActive && status !== 'completed' && status !== 'failed' && status !== 'error' && 'animate-spin'
        )} />
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className={cn('font-semibold', config.color)}>
            {config.text}{isActive && dots}
          </h4>
          {status === 'generating' && (
            <div className="flex space-x-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full animate-bounce',
                    config.color.replace('text-', 'bg-')
                  )}
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {config.description}
        </p>
        
        {/* 生成进度条 */}
        {status === 'generating' && quantity > 1 && (
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>图片进度</span>
              <span>{generatingImageIndex}/{quantity}</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: quantity }).map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'h-1.5 rounded-full flex-1 transition-all duration-300',
                    index < generatingImageIndex
                      ? 'bg-gradient-to-r from-pink-400 to-pink-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 进度百分比 */}
      {isActive && status !== 'completed' && (
        <div className="text-right">
          <div className={cn('text-lg font-bold', config.color)}>
            {Math.round(progress)}%
          </div>
          <div className="text-xs text-muted-foreground">
            完成
          </div>
        </div>
      )}
    </div>
  );
}