import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { toast } from 'sonner';

// 生成任务状态
export interface GenerationTask {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  images: string[];
  error?: string;
  createdAt: number;
  updatedAt: number;
}

// 轮询配置
const POLLING_CONFIG = {
  INTERVAL: 2000, // 2秒轮询一次
  MAX_ATTEMPTS: 150, // 最多轮询150次 (5分钟)
  TIMEOUT: 300000, // 5分钟超时
  MAX_RETRIES: 3, // 最大重试次数
  RETRY_DELAY: 1000, // 重试延迟 (毫秒)
};

// 时间估算配置
const TIME_ESTIMATES = {
  uploading: 5, // 上传阶段：5秒
  processing: 15, // 处理阶段：15秒
  generating: 30, // 生成阶段：30秒每张图片
  completed: 0, // 完成阶段：立即
} as const;

export function useImageGenerationPolling() {
  const [currentTask, setCurrentTask] = useState<GenerationTask | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [estimatedEndTime, setEstimatedEndTime] = useState<number | null>(null);
  
  // 轮询相关的引用
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef(0);
  const retryCountRef = useRef(0);
  const lastErrorRef = useRef<string | null>(null);

  // 计算预计完成时间
  const calculateEstimatedEndTime = useCallback((quantity: number) => {
    const now = Date.now();
    const totalEstimatedTime = 
      TIME_ESTIMATES.uploading + 
      TIME_ESTIMATES.processing + 
      (TIME_ESTIMATES.generating * quantity);
    return now + (totalEstimatedTime * 1000);
  }, []);
  
  const { 
    setIsGenerating, 
    setGenerationProgress, 
    setGeneratedImages,
    selectedStyle 
  } = useAppStore();

  // 清理轮询
  const clearPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
    attemptsRef.current = 0;
    retryCountRef.current = 0;
    lastErrorRef.current = null;
    setStartTime(null);
    setEstimatedEndTime(null);
  }, []);

  // 启动生成任务
  const startGeneration = useCallback(async (
    uploadedFile: File,
    style: string,
    quantity: number,
    sceneDescription?: string
  ) => {
    try {
      console.log('🚀 启动图片生成任务');
      
      // 清理之前的状态
      clearPolling();
      setGeneratedImages([]);
      setIsGenerating(true);
      
      // 设置时间跟踪
      const now = Date.now();
      setStartTime(now);
      setEstimatedEndTime(calculateEstimatedEndTime(quantity));
      
      // 准备FormData - 仍然发送文件，因为API期望File对象
      const formData = new FormData();
      formData.append('productImage', uploadedFile);
      formData.append('style', style);
      formData.append('quantity', quantity.toString());
      if (sceneDescription) {
        formData.append('sceneDescription', sceneDescription);
      }

      // 发起生成请求
      setGenerationProgress({
        status: 'uploading',
        progress: 5,
        message: '正在提交生成任务...',
        currentStep: 1,
        totalSteps: 4,
      });

      const response = await fetch('/api/generate-async', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success || !result.taskId) {
        throw new Error(result.error || '任务创建失败');
      }

      // 创建任务对象
      const task: GenerationTask = {
        id: result.taskId,
        status: 'pending',
        progress: 10,
        message: '任务已创建，等待处理...',
        images: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setCurrentTask(task);
      
      // 开始轮询
      startPolling(task.id);
      
      console.log('✅ 生成任务已启动，任务ID:', task.id);
      
    } catch (error) {
      console.error('❌ 启动生成任务失败:', error);
      setIsGenerating(false);
      setGenerationProgress({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : '启动任务失败',
        currentStep: 0,
        totalSteps: 4,
      });
      toast.error('启动生成任务失败');
    }
  }, [clearPolling, setGeneratedImages, setIsGenerating, setGenerationProgress]);

  // 开始轮询
  const startPolling = useCallback((taskId: string) => {
    console.log('🔄 开始轮询任务状态，任务ID:', taskId);
    setIsPolling(true);
    attemptsRef.current = 0;
    retryCountRef.current = 0;
    lastErrorRef.current = null;

    const poll = async () => {
      try {
        attemptsRef.current += 1;
        
        // 检查是否超过最大尝试次数
        if (attemptsRef.current > POLLING_CONFIG.MAX_ATTEMPTS) {
          throw new Error('轮询超时，请重试');
        }

        console.log(`🔍 轮询第 ${attemptsRef.current} 次，任务ID: ${taskId}`);

        const response = await fetch(`/api/task-status/${taskId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const taskData: GenerationTask = await response.json();
        
        // 更新任务状态
        setCurrentTask(taskData);
        
        // 更新进度显示
        setGenerationProgress({
          status: taskData.status === 'completed' ? 'completed' : 
                  taskData.status === 'failed' ? 'error' : 'generating',
          progress: taskData.progress,
          message: taskData.message,
          currentStep: Math.ceil(taskData.progress / 25),
          totalSteps: 4,
        });

        // 检查任务状态
        if (taskData.status === 'completed') {
          console.log('✅ 任务完成，图片数量:', taskData.images.length);
          
          // 处理生成的图片
          if (taskData.images.length > 0) {
            const baseTimestamp = Date.now();
            const newImages = taskData.images.map((imageUrl: string, index: number) => ({
              id: `generated-${baseTimestamp}-${index}`,
              url: imageUrl,
              prompt: selectedStyle?.prompt || '',
              style: selectedStyle?.name || '',
              timestamp: baseTimestamp + index,
            }));
            
            setGeneratedImages(newImages);
            console.log(`✅ 成功设置 ${newImages.length} 张图片到展示区`);
          }
          
          setIsGenerating(false);
          clearPolling();
          toast.success(`生成完成！共生成 ${taskData.images.length} 张图片`);
          
        } else if (taskData.status === 'failed') {
          console.error('❌ 任务失败:', taskData.error);
          setIsGenerating(false);
          clearPolling();
          toast.error(taskData.error || '生成失败');
          
        } else {
          // 任务仍在进行中，继续轮询
          console.log(`⏳ 任务进行中，进度: ${taskData.progress}%`);
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '轮询失败';
        console.error('❌ 轮询错误:', errorMessage);
        
        // 检查是否可以重试
        if (retryCountRef.current < POLLING_CONFIG.MAX_RETRIES) {
          retryCountRef.current += 1;
          lastErrorRef.current = errorMessage;
          
          console.log(`🔄 准备重试，第 ${retryCountRef.current}/${POLLING_CONFIG.MAX_RETRIES} 次`);
          
          // 延迟后重试
          setTimeout(() => {
            if (pollingIntervalRef.current) { // 确保轮询还在进行
              poll();
            }
          }, POLLING_CONFIG.RETRY_DELAY * retryCountRef.current); // 递增延迟
          
          return; // 不终止轮询，等待重试
        }
        
        // 重试次数用完，终止轮询
        console.error('❌ 重试次数用完，终止轮询');
        setIsGenerating(false);
        clearPolling();
        
        // 更新任务状态为失败
        if (currentTask) {
          setCurrentTask({
            ...currentTask,
            status: 'failed',
            error: `网络错误: ${errorMessage}`,
            updatedAt: Date.now(),
          });
        }
        
        setGenerationProgress({
          status: 'error',
          progress: 0,
          message: `网络错误: ${errorMessage}`,
          currentStep: 0,
          totalSteps: 4,
        });
        
        toast.error(`获取任务状态失败: ${errorMessage}`);
      }
    };

    // 立即执行一次
    poll();
    
    // 设置定时轮询
    pollingIntervalRef.current = setInterval(poll, POLLING_CONFIG.INTERVAL);
  }, [clearPolling, setGenerationProgress, setGeneratedImages, setIsGenerating, selectedStyle]);

  // 取消任务
  const cancelGeneration = useCallback(() => {
    console.log('🛑 取消生成任务');
    clearPolling();
    setIsGenerating(false);
    setCurrentTask(null);
    setGenerationProgress({
      status: 'idle',
      progress: 0,
      message: '已取消',
      currentStep: 0,
      totalSteps: 4,
    });
  }, [clearPolling, setIsGenerating, setGenerationProgress]);

  // 手动重试
  const retryGeneration = useCallback(() => {
    if (!currentTask) {
      console.warn('⚠️ 没有当前任务，无法重试');
      return;
    }
    
    console.log('🔄 手动重试生成任务，任务ID:', currentTask.id);
    
    // 重置重试计数器
    retryCountRef.current = 0;
    lastErrorRef.current = null;
    
    // 重新开始轮询
    startPolling(currentTask.id);
    
    toast.info('正在重试...');
  }, [currentTask, startPolling]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  return {
    currentTask,
    isPolling,
    generateImages: startGeneration,
    cancelGeneration,
    retryGeneration,
    retryCount: retryCountRef.current,
    lastError: lastErrorRef.current,
    startTime,
    estimatedEndTime,
  };
}