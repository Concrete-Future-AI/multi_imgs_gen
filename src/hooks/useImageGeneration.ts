import { useState, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { ImageGenerationRequest, ImageGenerationResponse } from '@/types';
import { API_ENDPOINTS, ERROR_MESSAGES } from '@/lib/constants';
import { handleApiError } from '@/utils';
import toast from 'react-hot-toast';

export function useImageGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const {
    uploadedFile,
    selectedStyle,
    quantity,
    customPrompt,
    setGenerationProgress,
    setGeneratedImages,
    setIsGenerating,
    addGeneratedImage,
  } = useAppStore();

  const generateImages = useCallback(async () => {
    if (!uploadedFile || !selectedStyle) {
      toast.error('请先上传图片并选择风格');
      return;
    }

    setIsLoading(true);
    setIsGenerating(true);
    
    try {
      // 更新进度：开始上传
      setGenerationProgress({
        status: 'uploading',
        progress: 10,
        message: '正在上传图片...',
        currentStep: 1,
        totalSteps: 4,
      });

      // 创建FormData
      const formData = new FormData();
      formData.append('productImage', uploadedFile.file);
      formData.append('style', selectedStyle.id);
      formData.append('quantity', quantity.toString());
      if (customPrompt) {
        formData.append('customPrompt', customPrompt);
      }

      // 更新进度：分析图片
      setGenerationProgress({
        status: 'analyzing',
        progress: 30,
        message: '正在分析产品图片...',
        currentStep: 2,
        totalSteps: 4,
      });

      // 发送生成请求
      const response = await fetch(API_ENDPOINTS.GENERATE, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ImageGenerationResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || ERROR_MESSAGES.GENERATION_FAILED);
      }

      // 更新进度：生成中
      setGenerationProgress({
        status: 'generating',
        progress: 60,
        message: '正在生成图片...',
        currentStep: 3,
        totalSteps: 4,
      });

      // 模拟生成过程的进度更新
      for (let i = 60; i < 90; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setGenerationProgress({
          status: 'generating',
          progress: i,
          message: '正在生成图片...',
          currentStep: 3,
          totalSteps: 4,
        });
      }

      // 处理生成结果
      if (result.images && result.images.length > 0) {
        const generatedImages = result.images.map((url, index) => ({
          id: `${Date.now()}-${index}`,
          url,
          prompt: `${selectedStyle.prompt}${customPrompt ? ` ${customPrompt}` : ''}`,
          style: selectedStyle.name,
          timestamp: Date.now(),
        }));

        setGeneratedImages(generatedImages);

        // 更新进度：完成
        setGenerationProgress({
          status: 'completed',
          progress: 100,
          message: `成功生成 ${result.images.length} 张图片`,
          currentStep: 4,
          totalSteps: 4,
        });

        toast.success(`成功生成 ${result.images.length} 张图片！`);
      } else {
        throw new Error('未收到生成的图片');
      }

    } catch (error) {
      console.error('Image generation error:', error);
      const errorMessage = handleApiError(error as { response?: { data?: { message?: string } }; message?: string });
      
      setGenerationProgress({
        status: 'error',
        progress: 0,
        message: errorMessage,
        currentStep: 0,
        totalSteps: 4,
      });

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  }, [uploadedFile, selectedStyle, quantity, customPrompt, setGenerationProgress, setGeneratedImages, setIsGenerating]);

  return {
    generateImages,
    isLoading,
  };
}