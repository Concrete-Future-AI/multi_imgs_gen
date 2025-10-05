import React, { useState } from 'react';
import { 
  Download, 
  Eye,
  X,
  Clock,
  Tag,
  RotateCcw,
  ImageIcon,
  Loader2,
  Grid3X3,
  Share2,
  Heart,
  Star,
  Maximize2
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { downloadFile } from '@/lib/utils';
import { cn } from '@/lib/utils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

export function ResultsDisplay() {
  const { generatedImages, resetGeneration } = useAppStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);

  if (generatedImages.length === 0) {
    return null;
  }

  const handleDownloadSingle = async (url: string, index: number) => {
    setDownloadingIndex(index);
    try {
      const filename = `generated-image-${index + 1}.jpg`;
      await downloadFile(url, filename);
      toast.success(`图片 ${index + 1} 下载成功`);
    } catch (error) {
      toast.error(`图片 ${index + 1} 下载失败`);
    } finally {
      setDownloadingIndex(null);
    }
  };

  const handleDownloadAll = async () => {
    if (generatedImages.length === 0) return;

    setIsDownloading(true);
    const toastId = toast.loading('正在打包下载...');
    
    try {
      const zip = new JSZip();
      
      // 下载所有图片并添加到zip
      const promises = generatedImages.map(async (image, index) => {
        try {
          const response = await fetch(image.url);
          const blob = await response.blob();
          const filename = `generated-image-${index + 1}.jpg`;
          zip.file(filename, blob);
        } catch (error) {
          console.error(`Failed to download image ${index + 1}:`, error);
        }
      });

      await Promise.all(promises);
      
      // 生成并下载zip文件
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `generated-images-${Date.now()}.zip`);
      
      toast.success('所有图片下载成功', { id: toastId });
    } catch (error) {
      console.error('Failed to create zip file:', error);
      toast.error('打包下载失败', { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-card to-card/80">
        <CardHeader className="pb-6 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg">
                  <Grid3X3 className="h-6 w-6 text-white" />
                </div>
                生成结果
              </CardTitle>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  成功生成
                </p>
                <Badge variant="default" className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md">
                  <Star className="w-3 h-3 mr-1" />
                  {generatedImages.length} 张图片
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="default"
                onClick={handleDownloadAll}
                disabled={isDownloading}
                className="gap-2 shadow-md hover:shadow-lg transition-all duration-200"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                下载全部
              </Button>
              <Button
                variant="ghost"
                size="default"
                onClick={resetGeneration}
                className="gap-2 hover:bg-muted/50"
              >
                <RotateCcw className="h-4 w-4" />
                重新生成
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {generatedImages.map((image, index) => (
              <div
                key={image.id}
                className="group relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 hover:scale-[1.02]"
                onClick={() => setSelectedImage(image.url)}
              >
                {/* 图片 */}
                <img
                  src={image.url}
                  alt={`生成的图片 ${index + 1}`}
                  className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* 渐变遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                
                {/* 悬停操作按钮 */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <div className="flex items-center gap-3 transform translate-y-8 group-hover:translate-y-0 transition-all duration-500">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/95 hover:bg-white text-foreground shadow-xl backdrop-blur-md border-0 rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(image.url);
                      }}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/95 hover:bg-white text-foreground shadow-xl backdrop-blur-md border-0 rounded-xl"
                      disabled={downloadingIndex === index}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadSingle(image.url, index);
                      }}
                    >
                      {downloadingIndex === index ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/95 hover:bg-white text-foreground shadow-xl backdrop-blur-md border-0 rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        // 分享功能可以在这里实现
                        toast.success('分享功能即将推出');
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* 图片信息标签 */}
                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-all duration-500">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="secondary" 
                        className="bg-white/95 text-foreground backdrop-blur-md text-xs shadow-lg border-0 rounded-lg"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {image.style}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-white/90 hover:text-red-400 hover:bg-white/10 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.success('已添加到收藏');
                        }}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-white/90 text-xs">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimestamp(image.timestamp)}</span>
                    </div>
                  </div>
                </div>

                {/* 图片序号 */}
                <div className="absolute top-3 left-3">
                  <Badge 
                    variant="secondary" 
                    className="bg-gradient-to-r from-primary to-primary/80 text-white backdrop-blur-md text-xs shadow-lg border-0 rounded-lg"
                  >
                    #{index + 1}
                  </Badge>
                </div>

                {/* 质量指示器 */}
                <div className="absolute top-3 right-3">
                  <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md rounded-lg px-2 py-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="text-white text-xs font-medium">HD</span>
                  </div>
                </div>

                {/* 悬浮光晕效果 */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
              </div>
            ))}
          </div>

          {/* 空状态提示 */}
          {generatedImages.length === 0 && (
            <div className="text-center py-16">
              <div className="relative">
                <div className="p-6 bg-gradient-to-br from-muted/50 to-muted/30 rounded-3xl inline-block mb-6">
                  <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-3xl blur-xl -z-10" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">暂无生成结果</h3>
              <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                请先上传产品图片，选择生成风格，然后开始创建您的专业产品展示图片
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 图片预览模态框 */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full">
            {/* 关闭按钮 */}
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-foreground shadow-lg backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
            
            {/* 预览图片 */}
            <img
              src={selectedImage}
              alt="预览图片"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl mx-auto block"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* 下载按钮 */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/90 hover:bg-white text-foreground shadow-lg backdrop-blur-sm gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  const index = generatedImages.findIndex(img => img.url === selectedImage);
                  if (index !== -1) {
                    handleDownloadSingle(selectedImage, index);
                  }
                }}
              >
                <Download className="h-4 w-4" />
                下载图片
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}