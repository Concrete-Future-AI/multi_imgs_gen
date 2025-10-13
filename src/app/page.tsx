'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ImageUploader } from '@/components/features/ImageUploader'
import { StyleSelector } from '@/components/features/StyleSelector'
import { QuantitySelector } from '@/components/features/QuantitySelector'
import { AgentWorkflowProgress } from '@/components/features/AgentWorkflowProgress'
import { ResultsDisplay } from '@/components/features/ResultsDisplay'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { useAppStore } from '@/stores/useAppStore'
import type { GenerateApiResponse } from '@/types'
import { Sparkles, Wand2, Image as ImageIcon, Loader2, Check } from 'lucide-react'


export default function Home() {
  const { 
    uploadedFile, 
    selectedStyle, 
    quantity,
    sceneDescription,
    isGenerating, 
    generatedImages,
    setIsGenerating,
    setGenerationProgress,
    setGeneratedImages,
  } = useAppStore()

  const [isScrolled, setIsScrolled] = useState(false)

  // 监听页面滚动
  useEffect(() => {
    const handleScroll = () => {
      // 当滚动超过200px时显示顶部导航栏
      setIsScrolled(window.scrollY > 200)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const generateImages = async () => {
    console.log('=== generateImages 开始 ===')
    if (!uploadedFile || !selectedStyle) {
      console.log('❌ generateImages: 缺少必要条件')
      return
    }
    
    console.log('✅ 开始设置生成状态')
    
    // 清空之前生成的图片
    console.log('🗑️ 清空之前的图片')
    setGeneratedImages([])
    
    setIsGenerating(true)
    setGenerationProgress({
      status: 'uploading',
      progress: 10,
      message: '准备上传图片...',
      currentStep: 1,
      totalSteps: 4,
    })

    try {
      // 准备FormData
      console.log('📦 准备FormData')
      const formData = new FormData()
      formData.append('productImage', uploadedFile.file)
      formData.append('style', selectedStyle.id)
      formData.append('quantity', quantity.toString())
      // 如果有场景描述，添加到FormData
      if (sceneDescription) {
        console.log('✅ 添加场景描述:', sceneDescription)
        formData.append('sceneDescription', sceneDescription)
      } else {
        console.log('⚠️ 没有场景描述')
      }

      console.log('📝 FormData内容:')
      console.log('  - productImage:', uploadedFile.file.name)
      console.log('  - style:', selectedStyle.id)
      console.log('  - quantity:', quantity)
      console.log('  - sceneDescription:', sceneDescription || '(无)')

      // 模拟进度更新函数
      let progressInterval: NodeJS.Timeout | null = null
      let currentProgress = 10
      
      const startProgressSimulation = () => {
        progressInterval = setInterval(() => {
          currentProgress += 1
          
          // 根据进度显示不同的消息
          if (currentProgress <= 40) {
            setGenerationProgress({
              status: 'analyzing',
              progress: currentProgress,
              message: 'AI正在深度分析产品特征、材质、颜色等信息...',
              currentStep: 2,
              totalSteps: 4,
            })
          } else if (currentProgress <= 50) {
            setGenerationProgress({
              status: 'generating',
              progress: currentProgress,
              message: '基于产品特征生成专业的摄影方案...',
              currentStep: 3,
              totalSteps: 4,
            })
          } else if (currentProgress <= 60) {
            setGenerationProgress({
              status: 'generating',
              progress: currentProgress,
              message: '为每个视角设计最佳的构图和光线...',
              currentStep: 3,
              totalSteps: 4,
            })
          } else if (currentProgress < 90) {
            setGenerationProgress({
              status: 'generating',
              progress: currentProgress,
              message: `AI正在生成第 ${Math.floor((currentProgress - 60) / 30 * quantity) + 1} 张图片...`,
              currentStep: 3,
              totalSteps: 4,
            })
          }
          
          // 最多到90%，留10%给实际完成
          if (currentProgress >= 90) {
            if (progressInterval) {
              clearInterval(progressInterval)
            }
          }
        }, 1000) // 每秒更新一次
      }

      // 开始模拟进度
      startProgressSimulation()

      let result: GenerateApiResponse

      try {
        // 调用生成API
        console.log('🚀 发送API请求到 /api/generate')
        
        // 创建AbortController用于超时控制
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 300000) // 5分钟超时
        
        const response = await fetch('/api/generate', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        console.log('📥 收到API响应:', response.status, response.statusText)

        // 停止进度模拟
        if (progressInterval) {
          clearInterval(progressInterval)
        }

        result = await response.json()

        if (!response.ok || !result.success) {
          const errorMessage = result.error || '生成失败'
          
          // 检查是否是超时错误
          if (errorMessage.includes('timeout') || errorMessage.includes('超时')) {
            throw new Error('AI图片生成超时，这通常是由于网络延迟或服务器负载较高导致的。请稍后重试，或尝试减少生成数量。')
          }
          
          // 检查是否是网络错误
          if (errorMessage.includes('network') || errorMessage.includes('网络')) {
            throw new Error('网络连接错误，请检查网络连接后重试。')
          }
          
          throw new Error(errorMessage)
        }

        // API成功，显示最终生成阶段
        setGenerationProgress({
          status: 'generating',
          progress: 95,
          message: '正在保存生成的图片...',
          currentStep: 4,
          totalSteps: 4,
        })
      } catch (apiError) {
        // 停止进度模拟
        if (progressInterval) {
          clearInterval(progressInterval)
        }
        throw apiError
      }

      // 处理生成的图片
      console.log('📸 返回的图片数据:', result.images)
      if (result && result.images && result.images.length > 0) {
        console.log('🔄 开始添加图片到状态管理...')
        
        // 创建图片数据数组
        const baseTimestamp = Date.now()
        const newImages = result.images.map((imageUrl: string, index: number) => {
          console.log(`  图片${index + 1}: ${imageUrl}`)
          return {
            id: `generated-${baseTimestamp}-${index}`,
            url: imageUrl,
            prompt: result.prompt || selectedStyle.prompt,
            style: selectedStyle.name,
            timestamp: baseTimestamp + index,
          }
        })
        
        console.log('📝 准备设置的图片数据:', newImages)
        
        // 一次性设置所有图片
        setGeneratedImages(newImages)
        
        console.log(`✅ 成功设置 ${newImages.length} 张图片到展示区`)
        
        // 验证状态是否更新 - 使用store直接获取最新状态
        setTimeout(() => {
          const currentImages = useAppStore.getState().generatedImages;
          console.log('🔍 验证状态更新 - 当前generatedImages数量:', currentImages.length);
          console.log('🔍 验证状态更新 - 图片URLs:', currentImages.map(img => img.url));
        }, 500);
      } else {
        console.warn('⚠️ 未收到图片数据或images数组为空')
        console.log('🔍 result对象:', result);
      }

      setGenerationProgress({
        status: 'completed',
        progress: 100,
        message: `生成完成！共生成 ${result.images?.length || 0} 张图片`,
        currentStep: 4,
        totalSteps: 4,
      })
    } catch (error) {
      console.error('图片生成失败:', error)
      
      let errorMessage = '生成失败，请重试'
      if (error instanceof Error) {
        errorMessage = error.message
        
        // 为超时错误添加额外的建议
        if (error.message.includes('超时')) {
          errorMessage += '\n\n💡 建议：\n• 尝试减少生成数量\n• 检查网络连接\n• 稍后重试'
        }
      }
      
      setGenerationProgress({
        status: 'error',
        progress: 0,
        message: errorMessage,
        currentStep: 0,
        totalSteps: 4,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerate = async () => {
    console.log('=== handleGenerate 开始 ===')
    console.log('uploadedFile:', uploadedFile)
    console.log('selectedStyle:', selectedStyle)
    console.log('sceneDescription:', sceneDescription)
    console.log('requiresScene:', selectedStyle?.requiresScene)
    
    if (!uploadedFile || !selectedStyle) {
      console.log('❌ 缺少必要条件')
      return
    }
    
    // 如果选择了场景图，验证场景描述
    if (selectedStyle.requiresScene && !sceneDescription) {
      console.log('❌ 需要场景描述但未填写')
      alert('请填写场景描述')
      return
    }
    
    console.log('✅ 验证通过，开始生成')
    await generateImages()
  }

  // 计算是否可以生成
  const canGenerate = useMemo(() => {
    console.log('=== canGenerate 计算 ===')
    console.log('  uploadedFile:', !!uploadedFile)
    console.log('  selectedStyle:', !!selectedStyle, selectedStyle?.id, selectedStyle?.name)
    console.log('  isGenerating:', isGenerating)
    console.log('  requiresScene:', selectedStyle?.requiresScene)
    console.log('  sceneDescription:', `"${sceneDescription}"`)
    console.log('  sceneDescription.trim():', `"${sceneDescription?.trim()}"`)
    
    if (!uploadedFile) {
      console.log('  ❌ 没有上传文件')
      return false
    }
    if (!selectedStyle) {
      console.log('  ❌ 没有选择风格')
      return false
    }
    if (isGenerating) {
      console.log('  ❌ 正在生成中')
      return false
    }
    
    // 如果需要场景描述，检查是否已填写
    if (selectedStyle.requiresScene) {
      const hasSceneDesc = sceneDescription && sceneDescription.trim().length > 0
      console.log('  需要场景描述，hasSceneDesc:', hasSceneDesc)
      if (!hasSceneDesc) {
        console.log('  ❌ 需要场景描述但未填写')
        return false
      }
    }
    
    console.log('  ✅ 可以生成')
    return true
  }, [uploadedFile, selectedStyle, isGenerating, sceneDescription])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* 滚动时出现的顶部导航栏 */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0'
        }`}
      >
        <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <div className="container mx-auto px-4 py-3 max-w-7xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-md">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    AI电商组图生成器
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {uploadedFile ? '✓ 已上传' : '等待上传'} | {selectedStyle ? `${selectedStyle.name}` : '选择风格'} | {quantity}张
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {generatedImages.length > 0 && (
                  <Badge variant="secondary" className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <Check className="w-3 h-3 mr-1" />
                    {generatedImages.length} 张完成
                  </Badge>
                )}
                <ThemeToggle />
                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  size="sm"
                  className="shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      生成中
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      开始生成
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12 relative">
          {/* 主题切换按钮 - 右上角 */}
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-6">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent mb-4">
            波波老师AI电商组图生成器
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            上传产品图片，选择风格，AI为您生成专业的电商展示图片
          </p>
        </div>



        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Image Upload */}
            <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1 bg-primary/10 rounded-lg transition-all duration-300 group-hover:bg-primary/20">
                    <ImageIcon className="w-5 h-5 text-primary" />
                  </div>
                  上传产品图片
                </CardTitle>
                <CardDescription>
                  支持 JPG、PNG、WebP 格式，最大 10MB
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader />
              </CardContent>
            </Card>

            {/* Step 2: Style Selection */}
            <Card className={`transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in ${!uploadedFile ? 'opacity-50 pointer-events-none' : ''}`} style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1 bg-primary/10 rounded-lg transition-all duration-300 group-hover:bg-primary/20">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  选择生成风格
                </CardTitle>
                <CardDescription>
                  选择适合您产品的展示风格和场景
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StyleSelector />
              </CardContent>
            </Card>

            {/* Step 3: Quantity & Settings */}
            <Card className={`transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in ${!selectedStyle ? 'opacity-50 pointer-events-none' : ''}`} style={{ animationDelay: '0.3s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1 bg-primary/10 rounded-lg transition-all duration-300 group-hover:bg-primary/20">
                    <Wand2 className="w-5 h-5 text-primary" />
                  </div>
                  生成设置
                </CardTitle>
                <CardDescription>
                  设置生成数量，AI将自动为每张图片选择最佳角度
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuantitySelector />
              </CardContent>
            </Card>

            {/* AI工作流进度 - 生成时显示 */}
            {isGenerating && (
              <div className="animate-in slide-in-from-top duration-500">
                <AgentWorkflowProgress />
              </div>
            )}
          </div>

          {/* Right Column - Preview & Actions */}
          <div className="space-y-6">
            {/* Preview Card */}
            <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in sticky top-6" style={{ animationDelay: '0.4s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1 bg-primary/10 rounded-lg transition-all duration-300 group-hover:bg-primary/20">
                    <Wand2 className="w-5 h-5 text-primary" />
                  </div>
                  预览与操作
                </CardTitle>
                <CardDescription>
                  确认设置后开始生成
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Settings Summary */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">图片状态:</span>
                    <Badge variant={uploadedFile ? "default" : "outline"}>
                      {uploadedFile ? "已上传" : "未上传"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">选择风格:</span>
                    <Badge variant={selectedStyle ? "default" : "outline"}>
                      {selectedStyle?.name || "未选择"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">生成数量:</span>
                    <Badge variant="secondary">{quantity}张</Badge>
                  </div>

                </div>

                {/* Generate Button */}
                <Button 
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="w-full h-12 text-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-12" />
                      开始生成
                    </>
                  )}
                </Button>

                {/* 简化进度提示 */}
                {isGenerating && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="text-center p-4 border border-primary/20 rounded-xl bg-primary/5">
                      <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-primary" />
                      <p className="text-sm font-medium text-foreground">AI创作中</p>
                      <p className="text-xs text-muted-foreground mt-1">请查看左侧详细进度</p>
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center group">
                    <div className="text-2xl font-bold text-primary transition-all duration-300 group-hover:scale-110">
                      {generatedImages.length}
                    </div>
                    <div className="text-sm text-muted-foreground">已生成</div>
                  </div>
                  <div className="text-center group">
                    <div className="text-2xl font-bold text-primary transition-all duration-300 group-hover:scale-110">
                      {quantity}
                    </div>
                    <div className="text-sm text-muted-foreground">目标数量</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Results Section */}
        {generatedImages.length > 0 && (
          <div className="mt-8 animate-fade-in">
            <ResultsDisplay />
          </div>
        )}

        {/* Footer */}
        <div className="border-t bg-card/50 backdrop-blur-sm mt-16 pt-6 pb-6">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 mr-2" />
            波波老师工作室出品
          </div>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  )
}



