'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ImageUploader } from '@/components/features/ImageUploader'
import { StyleSelector } from '@/components/features/StyleSelector'
import { QuantitySelector } from '@/components/features/QuantitySelector'
import { ProgressIndicator } from '@/components/features/ProgressIndicator'
import { ResultsDisplay } from '@/components/features/ResultsDisplay'
import { useAppStore } from '@/stores/useAppStore'
import { Sparkles, Wand2, Image as ImageIcon, Download, Eye, Loader2, Check, Zap, Clock, Grid3X3 } from 'lucide-react'

export default function Home() {
  const { 
    uploadedFile, 
    selectedStyle, 
    quantity, 
    customPrompt,
    isGenerating, 
    generationProgress, 
    generatedImages,
    setIsGenerating,
    setGenerationProgress,
    addGeneratedImage
  } = useAppStore()

  const [activeStep, setActiveStep] = useState(1)

  const generateImages = async () => {
    if (!uploadedFile || !selectedStyle) return
    
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
      const formData = new FormData()
      formData.append('productImage', uploadedFile.file)
      formData.append('style', selectedStyle.id)
      formData.append('quantity', quantity.toString())
      if (customPrompt) {
        formData.append('customPrompt', customPrompt)
      }

      setGenerationProgress({
        status: 'analyzing',
        progress: 30,
        message: '正在分析产品图片...',
        currentStep: 2,
        totalSteps: 4,
      })

      // 调用生成API
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || '生成失败')
      }

      setGenerationProgress({
        status: 'generating',
        progress: 70,
        message: '正在生成图片...',
        currentStep: 3,
        totalSteps: 4,
      })

      // 处理生成的图片
      if (result.images && result.images.length > 0) {
        result.images.forEach((imageUrl: string, index: number) => {
          addGeneratedImage({
            id: `generated-${Date.now()}-${index}`,
            url: imageUrl,
            prompt: result.prompt || (selectedStyle.prompt + (customPrompt ? ' ' + customPrompt : '')),
            style: selectedStyle.name,
            timestamp: Date.now(),
          })
        })
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
      setGenerationProgress({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : '生成失败，请重试',
        currentStep: 0,
        totalSteps: 4,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerate = async () => {
    if (!uploadedFile || !selectedStyle) return
    
    setActiveStep(4)
    await generateImages()
  }

  const canGenerate = uploadedFile && selectedStyle && !isGenerating

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: '0s' }}>
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 transition-all duration-500 hover:scale-110 hover:rotate-12">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">AI电商组图生成器</h1>
                <p className="text-sm text-muted-foreground">专业的AI产品图片生成工具</p>
              </div>
            </div>
            <div className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <Badge variant="secondary" className="hidden sm:flex transition-all duration-300 hover:scale-105 hover:shadow-md">
                <Wand2 className="w-3 h-3 mr-1" />
                AI驱动
              </Badge>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {[
              { step: 1, title: '上传图片', icon: ImageIcon },
              { step: 2, title: '选择风格', icon: Sparkles },
              { step: 3, title: '设置参数', icon: Wand2 },
              { step: 4, title: '生成结果', icon: Download }
            ].map(({ step, title, icon: Icon }) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-500 hover:scale-105 ${
                  activeStep >= step 
                    ? 'bg-primary border-primary text-primary-foreground shadow-lg' 
                    : 'border-muted-foreground/30 text-muted-foreground'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`ml-2 text-sm font-medium hidden sm:block transition-all duration-300 ${
                  activeStep >= step ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {title}
                </span>
                {step < 4 && (
                  <div className={`w-8 h-0.5 mx-4 transition-all duration-500 ${
                    activeStep > step ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  设置生成数量和自定义提示词
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuantitySelector />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview & Actions */}
          <div className="space-y-6">
            {/* Preview Card */}
            <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in sticky top-6" style={{ animationDelay: '0.4s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1 bg-primary/10 rounded-lg transition-all duration-300 group-hover:bg-primary/20">
                    <Eye className="w-5 h-5 text-primary" />
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
                  {customPrompt && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">自定义提示:</span>
                      <p className="mt-1 p-2 bg-muted rounded text-xs">{customPrompt}</p>
                    </div>
                  )}
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

                {/* Progress */}
                {isGenerating && (
                  <div className="space-y-2 animate-fade-in">
                    <ProgressIndicator />
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
          <div className="mt-8">
            <Card className="transition-all duration-500 hover:shadow-lg hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1 bg-primary/10 rounded-lg transition-all duration-300 group-hover:bg-primary/20">
                    <Download className="w-5 h-5 text-primary" />
                  </div>
                  生成结果
                  <Badge variant="secondary" className="ml-auto animate-pulse">
                    {generatedImages.length} 张图片
                  </Badge>
                </CardTitle>
                <CardDescription>
                  点击图片可以预览和下载
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResultsDisplay />
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 mr-2" />
            波波老师工作室出品
          </div>
        </div>
      </footer>
    </div>
  )
}
