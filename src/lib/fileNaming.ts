import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * 文件命名工具类
 * 确保全生命周期的文件名唯一性
 */
export class FileNamingService {
  
  /**
   * 生成高精度时间戳（包含微秒）
   * 避免同一毫秒内的冲突
   */
  private static generateHighPrecisionTimestamp(): string {
    const now = Date.now();
    // 使用performance.now()获取高精度时间，兼容性更好
    const performanceTime = Math.floor(performance.now() * 1000) % 1000000;
    return `${now}_${performanceTime.toString().padStart(6, '0')}`;
  }

  /**
   * 生成短UUID（8位）
   * 减少文件名长度同时保持唯一性
   */
  private static generateShortUuid(): string {
    return uuidv4().replace(/-/g, '').substring(0, 8);
  }

  /**
   * 生成基于内容的哈希（可选）
   * 用于内容去重
   */
  private static generateContentHash(content: string | Buffer): string {
    return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
  }

  /**
   * 为上传文件生成唯一文件名
   * @param originalName 原始文件名
   * @param preserveOriginalName 是否保留原始文件名
   * @param content 文件内容（可选，用于内容去重）
   */
  static generateUploadFileName(
    originalName?: string, 
    preserveOriginalName: boolean = false,
    content?: string | Buffer
  ): string {
    const timestamp = FileNamingService.generateHighPrecisionTimestamp();
    const shortUuid = FileNamingService.generateShortUuid();
    
    // 提取文件扩展名
    const extension = originalName ? 
      originalName.split('.').pop()?.toLowerCase() || 'bin' : 
      'bin';
    
    if (preserveOriginalName && originalName) {
      // 清理原始文件名，移除特殊字符
      const cleanName = originalName
        .replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '');
      
      return `upload_${timestamp}_${shortUuid}_${cleanName}`;
    }
    
    // 如果提供了内容，添加内容哈希用于去重
    const contentHash = content ? `_${FileNamingService.generateContentHash(content)}` : '';
    
    return `upload_${timestamp}_${shortUuid}${contentHash}.${extension}`;
  }

  /**
   * 为AI生成的图片生成唯一文件名
   * @param aiProvider AI提供商标识 ('google' | 'doubao')
   * @param batchId 批次ID（可选）
   * @param index 在批次中的索引
   * @param style 生成风格（可选）
   */
  static generateAIImageFileName(
    aiProvider: 'google' | 'doubao',
    batchId?: string,
    index: number = 0,
    style?: string
  ): string {
    const timestamp = FileNamingService.generateHighPrecisionTimestamp();
    const shortUuid = FileNamingService.generateShortUuid();
    const batch = batchId || FileNamingService.generateShortUuid();
    
    // 清理风格名称
    const cleanStyle = style ? 
      `_${style.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').toLowerCase()}` : 
      '';
    
    return `ai_${aiProvider}_${timestamp}_${shortUuid}_batch${batch}_${index.toString().padStart(2, '0')}${cleanStyle}.png`;
  }

  /**
   * 为临时文件生成唯一文件名
   * @param prefix 前缀
   * @param extension 文件扩展名
   */
  static generateTempFileName(prefix: string = 'temp', extension: string = 'tmp'): string {
    const timestamp = FileNamingService.generateHighPrecisionTimestamp();
    const shortUuid = FileNamingService.generateShortUuid();
    
    return `${prefix}_${timestamp}_${shortUuid}.${extension}`;
  }

  /**
   * 验证文件名是否符合规范
   * @param fileName 文件名
   */
  static validateFileName(fileName: string): boolean {
    // 检查文件名长度（Windows限制255字符）
    if (fileName.length > 255) return false;
    
    // 检查是否包含非法字符
    const illegalChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (illegalChars.test(fileName)) return false;
    
    // 检查是否为保留名称（Windows）
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
    if (reservedNames.test(fileName)) return false;
    
    return true;
  }

  /**
   * 清理文件名，移除非法字符
   * @param fileName 原始文件名
   */
  static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 255);
  }
}

/**
 * 便捷函数导出
 */
export const generateUploadFileName = FileNamingService.generateUploadFileName;
export const generateAIImageFileName = FileNamingService.generateAIImageFileName;
export const generateTempFileName = FileNamingService.generateTempFileName;
export const validateFileName = FileNamingService.validateFileName;
export const sanitizeFileName = FileNamingService.sanitizeFileName;