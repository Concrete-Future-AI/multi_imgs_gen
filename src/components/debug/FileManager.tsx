'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, Trash2, FileText, Image } from 'lucide-react';

interface FileInfo {
  key: string;
  url: string;
  size: number;
  mimeType: string;
  originalName?: string;
  uploadedAt?: string;
}

export default function FileManager() {
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 上传文件
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'test-uploads');
      formData.append('preserveOriginalName', 'false');

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadedFiles(prev => [...prev, result.data]);
        setMessage({ type: 'success', text: `文件上传成功: ${result.data.originalName}` });
      } else {
        setMessage({ type: 'error', text: result.error || '上传失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '上传失败: ' + (error as Error).message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 下载文件
  const handleFileDownload = async (fileInfo: FileInfo) => {
    try {
      const response = await fetch(`/api/files/${fileInfo.key}?download=true`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileInfo.originalName || fileInfo.key.split('/').pop() || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setMessage({ type: 'success', text: '文件下载成功' });
      } else {
        setMessage({ type: 'error', text: '下载失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '下载失败: ' + (error as Error).message });
    }
  };

  // 删除文件
  const handleFileDelete = async (fileInfo: FileInfo) => {
    if (!confirm(`确定要删除文件 "${fileInfo.originalName || fileInfo.key}" 吗？`)) {
      return;
    }

    try {
      const response = await fetch('/api/files/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: fileInfo.key }),
      });

      const result = await response.json();

      if (result.success) {
        setUploadedFiles(prev => prev.filter(f => f.key !== fileInfo.key));
        setMessage({ type: 'success', text: '文件删除成功' });
      } else {
        setMessage({ type: 'error', text: result.error || '删除失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '删除失败: ' + (error as Error).message });
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 获取文件图标
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          文件管理工具 (API测试)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 上传区域 */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="flex-1"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="whitespace-nowrap"
            >
              {isUploading ? '上传中...' : '选择文件'}
            </Button>
          </div>
          
          {message && (
            <Alert className={message.type === 'error' ? 'border-red-500' : 'border-green-500'}>
              <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* 文件列表 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">已上传文件 ({uploadedFiles.length})</h3>
          
          {uploadedFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无文件，请上传文件进行测试
            </div>
          ) : (
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={file.key}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(file.mimeType)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {file.originalName || file.key.split('/').pop()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • {file.mimeType}
                      </div>
                      <div className="text-xs text-gray-400">
                        路径: {file.key}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {/* 预览图片 */}
                    {file.mimeType.startsWith('image/') && (
                      <img
                        src={file.url}
                        alt="预览"
                        className="w-12 h-12 object-cover rounded border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFileDownload(file)}
                      className="flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      下载
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFileDelete(file)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                      删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API信息 */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">API端点测试</h4>
          <div className="text-sm space-y-1 text-gray-600">
            <div>• POST /api/files/upload - 文件上传</div>
            <div>• GET /api/files/[...path] - 文件下载/访问</div>
            <div>• DELETE /api/files/delete - 文件删除</div>
            <div>• 存储服务: 本地存储 (已预留OSS扩展接口)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}