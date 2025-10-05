import { clsx, type ClassValue } from 'clsx';

// 合并CSS类名
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// 文件大小格式化
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 验证文件类型
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

// 验证文件大小
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

// 生成唯一ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// 延迟函数
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 下载文件
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 将文件转换为Base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// 创建图片预览URL
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

// 清理图片预览URL
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}

// 错误处理
export function handleApiError(error: any): string {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return '发生未知错误，请稍后重试';
}