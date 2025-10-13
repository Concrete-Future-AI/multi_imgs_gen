import { useState, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { ImageGenerationResponse } from '@/types';
import { API_ENDPOINTS, ERROR_MESSAGES } from '@/lib/constants';
import { handleApiError } from '@/utils';
import toast from 'react-hot-toast';

export function useImageGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const {
    uploadedFile,
    selectedStyle,
    quantity,
    sceneDescription,
    setGenerationProgress,
    setGeneratedImages,
    setIsGenerating,
  } = useAppStore();

  const generateImages = useCallback(async () => {
    if (!uploadedFile || !selectedStyle) {
      toast.error('请先上传图片并选择风格');
      return;
    }

    // 如果选择的是场景图，验证场景描述
    if (selectedStyle.requiresScene && !sceneDescription) {
      toast.error('请填写场景描述');
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
      if (sceneDescription) {
        formData.append('sceneDescription', sceneDescription);
      }

      // 更新进度：分析图片
      setGenerationProgress({
        status: 'analyzing',
        progress: 30,
        message: '正在分析产品图片...',
        currentStep: 2,
        totalSteps: 4,
      });

      // 创建带超时的请求
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 720000); // 12分钟超时

      // 发送生成请求
      const response = await fetch(API_ENDPOINTS.GENERATE, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      // 检查响应状态
      if (!response.ok) {
        let errorMessage = `HTTP错误: ${response.status}`;
        try {
          const errorText = await response.text();
          if (errorText) {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          }
        } catch (parseError) {
          console.warn('无法解析错误响应:', parseError);
        }
        throw new Error(errorMessage);
      }

      // 检查响应内容类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('非JSON响应:', responseText);
        throw new Error('服务器返回了无效的响应格式');
      }

      // 安全地解析JSON响应
      let result: ImageGenerationResponse;
      try {
        const responseText = await response.text();
        if (!responseText.trim()) {
          throw new Error('服务器返回了空响应');
        }
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON解析错误:', parseError);
        throw new Error('服务器响应格式错误，请稍后重试');
      }

      // 验证响应结构
      if (typeof result !== 'object' || result === null) {
        throw new Error('服务器返回了无效的数据格式');
      }

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
          prompt: selectedStyle.prompt,
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
      
      // 更详细的错误处理
      let errorMessage = '生成失败，请稍后重试';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = '请求超时，请检查网络连接后重试';
        } else {
          errorMessage = error.message;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        // 处理其他类型的错误
        const apiError = error as { response?: { data?: { message?: string } }; message?: string };
        errorMessage = handleApiError(apiError);
      }
      
      // 记录详细错误信息用于调试
      console.error('详细错误信息:', {
        error,
        errorMessage,
        uploadedFile: uploadedFile?.file?.name,
        selectedStyle: selectedStyle?.id,
        quantity,
        sceneDescription
      });
      
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
  }, [uploadedFile, selectedStyle, quantity, sceneDescription, setGenerationProgress, setGeneratedImages, setIsGenerating]);

  return {
    generateImages,
    isLoading,
  };
}