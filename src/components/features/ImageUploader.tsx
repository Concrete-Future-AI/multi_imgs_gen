'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/stores/useAppStore'
import { formatFileSize } from '@/lib/utils'
import { Upload, X, Image as ImageIcon, CheckCircle, AlertCircle, FileImage } from 'lucide-react'
import { toast } from 'sonner'

interface ImageUploaderProps {
  onImageSelect?: () => void
}

export function ImageUploader({ onImageSelect }: ImageUploaderProps) {
  const { uploadedFile, setUploadedFile } = useAppStore()
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('请上传 JPG、PNG 或 WebP 格式的图片')
      return
    }

    // 验证文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('图片大小不能超过 10MB')
      return
    }

    setIsUploading(true)

    try {
      // 创建预览URL
      const previewUrl = URL.createObjectURL(file)
      
      // 模拟上传延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setUploadedFile({
        file,
        preview: previewUrl,
        id: Date.now().toString()
      })

      toast.success('图片上传成功！')
      onImageSelect?.()
    } catch (error) {
      toast.error('图片上传失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }, [setUploadedFile, onImageSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false,
    disabled: isUploading
  })

  const removeImage = () => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview)
    }
    setUploadedFile(null)
    toast.success('图片已移除')
  }

  if (uploadedFile) {
    return (
      <div className="space-y-6">
        {/* 上传成功状态 */}
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <div className="flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
              图片上传成功
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              您可以继续选择风格进行生成
            </p>
          </div>
        </div>

        {/* 图片预览卡片 */}
        <div className="relative group">
          <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="aspect-video relative">
              <img
                src={uploadedFile.preview}
                alt="上传的图片"
                className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* 删除按钮 */}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                onClick={removeImage}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* 图片信息栏 */}
            <div className="p-4 bg-card border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex-shrink-0">
                    <FileImage className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {uploadedFile.file.type}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {formatFileSize(uploadedFile.file.size)}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={removeImage}
          >
            <Upload className="w-4 h-4 mr-2" />
            重新上传
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 拖拽上传区域 */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 group
          ${isDragActive 
            ? 'border-primary bg-primary/5 scale-[1.02] shadow-lg shadow-primary/10' 
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }
          ${isUploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-6">
          {/* 图标 */}
          <div className="flex justify-center">
            <div className={`
              flex items-center justify-center w-20 h-20 rounded-2xl transition-all duration-300
              ${isDragActive 
                ? 'bg-primary/15 text-primary scale-110 shadow-lg' 
                : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-105'
              }
            `}>
              {isUploading ? (
                <div className="w-8 h-8 border-3 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-10 h-10" />
              )}
            </div>
          </div>

          {/* 文本内容 */}
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-foreground">
                {isUploading 
                  ? '正在上传图片...' 
                  : isDragActive 
                    ? '释放以上传图片' 
                    : '拖拽图片到此处'
                }
              </h3>
              <p className="text-sm text-muted-foreground">
                {isUploading 
                  ? '请稍候，正在处理您的图片' 
                  : '或点击下方按钮选择文件'
                }
              </p>
            </div>
            
            {/* 格式支持信息 */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 mx-auto w-fit">
              <FileImage className="w-3.5 h-3.5" />
              <span>支持 JPG、PNG、WebP 格式，最大 10MB</span>
            </div>
          </div>

          {/* 上传按钮 */}
          {!isDragActive && !isUploading && (
            <div className="pt-2">
              <Button 
                variant="outline" 
                size="lg"
                className="bg-background hover:bg-primary hover:text-primary-foreground transition-all duration-200"
              >
                <Upload className="w-4 h-4 mr-2" />
                选择文件
              </Button>
            </div>
          )}
        </div>

        {/* 拖拽活跃状态覆盖层 */}
        {isDragActive && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-primary border-dashed rounded-xl flex items-center justify-center backdrop-blur-sm">
            <div className="text-center">
              <div className="text-primary font-semibold text-lg">释放以上传图片</div>
              <div className="text-primary/70 text-sm mt-1">支持的格式将自动识别</div>
            </div>
          </div>
        )}
      </div>

      {/* 功能特性说明 */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="space-y-2">
          <div className="w-8 h-8 mx-auto bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xs text-muted-foreground">
            <div className="font-medium">快速上传</div>
            <div>拖拽或点击</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="w-8 h-8 mx-auto bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-xs text-muted-foreground">
            <div className="font-medium">自动验证</div>
            <div>格式检查</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="w-8 h-8 mx-auto bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-xs text-muted-foreground">
            <div className="font-medium">即时预览</div>
            <div>实时显示</div>
          </div>
        </div>
      </div>
    </div>
  )
}