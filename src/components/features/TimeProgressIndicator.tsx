'use client';

import { useEffect, useState } from 'react';
import { Clock, Timer, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface TimeProgressIndicatorProps {
  startTime: number | null;
  estimatedEndTime: number | null;
  status: 'idle' | 'uploading' | 'processing' | 'generating' | 'completed' | 'failed' | 'error';
  className?: string;
}

export function TimeProgressIndicator({
  startTime,
  estimatedEndTime,
  status,
  className
}: TimeProgressIndicatorProps) {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // 每秒更新当前时间
  useEffect(() => {
    if (!startTime || !estimatedEndTime || status === 'completed' || status === 'failed' || status === 'error') {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, estimatedEndTime, status]);

  // 如果没有时间信息或任务已完成/失败，不显示
  if (!startTime || !estimatedEndTime || status === 'idle' || status === 'completed' || status === 'failed' || status === 'error') {
    return null;
  }

  const totalDuration = estimatedEndTime - startTime;
  const elapsed = currentTime - startTime;
  const remaining = Math.max(0, estimatedEndTime - currentTime);
  const progress = Math.min(100, (elapsed / totalDuration) * 100);

  // 格式化时间显示
  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) {
      return `${seconds}秒`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Zap className="w-4 h-4 text-blue-500" />;
      case 'processing':
        return <Timer className="w-4 h-4 text-purple-500" />;
      case 'generating':
        return <Clock className="w-4 h-4 text-pink-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return '上传中';
      case 'processing':
        return '处理中';
      case 'generating':
        return '生成中';
      default:
        return '进行中';
    }
  };

  return (
    <div className={cn(
      'p-4 bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20',
      'border border-primary/20 rounded-xl shadow-sm space-y-3',
      className
    )}>
      {/* 状态和剩余时间 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-foreground">
            {getStatusText()}
          </span>
        </div>
        <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
          <Clock className="w-3 h-3 mr-1" />
          剩余 {formatTime(remaining)}
        </Badge>
      </div>

      {/* 进度条 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>已用时 {formatTime(elapsed)}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress 
          value={progress} 
          className="h-2 bg-slate-200 dark:bg-slate-700"
        />
      </div>

      {/* 预计完成时间 */}
      <div className="text-xs text-muted-foreground text-center">
        预计 {new Date(estimatedEndTime).toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        })} 完成
      </div>
    </div>
  );
}