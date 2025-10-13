import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * 将静态文件路径转换为文件API路径
 * @param staticPath 静态文件路径，如 "/generated/xxx.png"
 * @returns 文件API路径，如 "/api/files/generated/xxx.png"
 */
export function convertToFileApiUrl(staticPath: string): string {
  // 移除开头的斜杠（如果有的话）
  const cleanPath = staticPath.startsWith('/') ? staticPath.slice(1) : staticPath;
  return `/api/files/${cleanPath}`;
}

/**
 * 使用文件API下载文件
 * @param staticPath 静态文件路径，如 "/generated/xxx.png"
 * @param filename 下载文件名
 */
export function downloadFile(staticPath: string, filename: string) {
  // 转换为文件API下载URL
  const cleanPath = staticPath.startsWith('/') ? staticPath.slice(1) : staticPath;
  const downloadUrl = `/api/files/${cleanPath}?download=true&filename=${encodeURIComponent(filename)}`;
  
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}