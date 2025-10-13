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
import { useImageGenerationPolling } from '@/hooks/useImageGenerationPolling'
import { Sparkles, Wand2, Image as ImageIcon, Loader2, Check, X } from 'lucide-react'


export default function Home() {
  const { 
    uploadedFile, 
    selectedStyle, 
    quantity,
    sceneDescription,
    generatedImages,
    generationProgress,
  } = useAppStore()

  const [isScrolled, setIsScrolled] = useState(false)
  
  // 使用新的轮询Hook
  const { 
    currentTask, 
    isPolling, 
    generateImages, 
    cancelGeneration,
    retryGeneration,
    retryCount,
    lastError,
    startTime,
    estimatedEndTime 
  } = useImageGenerationPolling()

  // 监听页面滚动
  useEffect(() => {
    const handleScroll = () => {
      // 当滚动超过200px时显示顶部导航栏
      setIsScrolled(window.scrollY > 200)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 新的生成函数，使用轮询机制
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
    console.log('📝 生成参数:')
    console.log('  - 文件:', uploadedFile.file.name)
    console.log('  - 风格:', selectedStyle.id)
    console.log('  - 数量:', quantity)
    console.log('  - 场景描述:', sceneDescription || '(无)')
    
    // 启动轮询生成
    await generateImages(
      uploadedFile.file,
      selectedStyle.id,
      quantity,
      sceneDescription
    )
  }

  // 计算是否可以生成
  const canGenerate = useMemo(() => {
    console.log('=== canGenerate 计算 ===')
    console.log('  uploadedFile:', !!uploadedFile)
    console.log('  selectedStyle:', !!selectedStyle, selectedStyle?.id, selectedStyle?.name)
    console.log('  isPolling:', isPolling)
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
    if (isPolling) {
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
  }, [uploadedFile, selectedStyle, isPolling, sceneDescription])

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
                  {isPolling ? (
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
            {(isPolling || currentTask) && (
              <div className="animate-in slide-in-from-top duration-500">
                <AgentWorkflowProgress 
                  currentTask={currentTask}
                  isPolling={isPolling}
                  cancelGeneration={cancelGeneration}
                  retryGeneration={retryGeneration}
                  retryCount={retryCount}
                  lastError={lastError}
                  startTime={startTime}
                  estimatedEndTime={estimatedEndTime}
                />
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
                  {isPolling ? (
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
                {isPolling && (
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

