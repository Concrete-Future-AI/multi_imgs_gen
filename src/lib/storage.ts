import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { generateUploadFileName } from './fileNaming';

// 存储配置接口
export interface StorageConfig {
  type: 'local' | 'oss';
  local?: {
    uploadDir: string;
    baseUrl: string;
  };
  oss?: {
    region: string;
    bucket: string;
    accessKeyId: string;
    accessKeySecret: string;
    endpoint?: string;
  };
}

// 文件信息接口
export interface FileInfo {
  key: string;
  url: string;
  size: number;
  mimeType: string;
  originalName?: string;
}

// 上传选项接口
export interface UploadOptions {
  folder?: string;
  filename?: string;
  preserveOriginalName?: boolean;
}

// 存储服务抽象接口
export interface IStorageService {
  upload(buffer: Buffer, options?: UploadOptions): Promise<FileInfo>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getUrl(key: string): string;
  getSignedUrl?(key: string, expiresIn?: number): Promise<string>;
}

// 本地存储服务实现
export class LocalStorageService implements IStorageService {
  private config: StorageConfig['local'];

  constructor(config: StorageConfig['local']) {
    if (!config) {
      throw new Error('Local storage config is required');
    }
    this.config = config;
  }

  async upload(buffer: Buffer, options: UploadOptions = {}): Promise<FileInfo> {
    if (!this.config) {
      throw new Error('LocalStorageService not properly configured');
    }

    const { folder = 'generated', filename, preserveOriginalName = false } = options;
    
    // 使用新的文件命名服务生成唯一文件名
    const finalFilename = generateUploadFileName(filename, preserveOriginalName, buffer);

    // 构建文件路径
    const relativePath = path.join(folder, finalFilename);
    const fullPath = path.join(this.config.uploadDir, relativePath);
    
    // 确保目录存在
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    
    // 写入文件
    await fs.writeFile(fullPath, buffer);
    
    // 获取文件信息
    const stats = await fs.stat(fullPath);
    
    // 从文件名中提取扩展名
    const extension = path.extname(finalFilename).toLowerCase();
    
    const fileInfo = {
      key: relativePath.replace(/\\/g, '/'), // 统一使用正斜杠
      url: `${this.config.baseUrl}/${relativePath.replace(/\\/g, '/')}`,
      size: stats.size,
      mimeType: this.getMimeTypeFromExtension(extension),
    };
    
    // 调试日志：输出生成的图片信息
    console.log('📸 图片保存成功:');
    console.log(`   文件名: ${finalFilename}`);
    console.log(`   本地路径: ${fullPath}`);
    console.log(`   相对路径: ${fileInfo.key}`);
    console.log(`   访问URL: ${fileInfo.url}`);
    console.log(`   文件大小: ${fileInfo.size} bytes`);
    
    return fileInfo;
  }

  async download(key: string): Promise<Buffer> {
    if (!this.config) {
      throw new Error('LocalStorageService not properly configured');
    }

    const fullPath = path.join(this.config.uploadDir, key);
    
    try {
      return await fs.readFile(fullPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`File not found: ${key}`);
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.config) {
      throw new Error('LocalStorageService not properly configured');
    }

    const fullPath = path.join(this.config.uploadDir, key);
    
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // 文件不存在，视为删除成功
        return;
      }
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.config) {
      throw new Error('LocalStorageService not properly configured');
    }

    const fullPath = path.join(this.config.uploadDir, key);
    
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  getUrl(key: string): string {
    if (!this.config) {
      throw new Error('LocalStorageService not properly configured');
    }

    return `${this.config.baseUrl}/${key}`;
  }

  private getExtensionFromBuffer(buffer: Buffer): string {
    // 检查文件头来确定文件类型
    const header = buffer.subarray(0, 4);
    
    if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
      return '.png';
    }
    if (header[0] === 0xFF && header[1] === 0xD8) {
      return '.jpg';
    }
    if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) {
      return '.gif';
    }
    if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46) {
      return '.webp';
    }
    
    return '.png'; // 默认为PNG
  }

  private getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }
}

// OSS存储服务实现（预留接口）
export class OSSStorageService implements IStorageService {
  private config: StorageConfig['oss'];

  constructor(config: StorageConfig['oss']) {
    if (!config) {
      throw new Error('OSS storage config is required');
    }
    this.config = config;
  }

  async upload(buffer: Buffer, options: UploadOptions = {}): Promise<FileInfo> {
    // TODO: 实现OSS上传逻辑
    throw new Error('OSS storage not implemented yet');
  }

  async download(key: string): Promise<Buffer> {
    // TODO: 实现OSS下载逻辑
    throw new Error('OSS storage not implemented yet');
  }

  async delete(key: string): Promise<void> {
    // TODO: 实现OSS删除逻辑
    throw new Error('OSS storage not implemented yet');
  }

  async exists(key: string): Promise<boolean> {
    // TODO: 实现OSS存在性检查逻辑
    throw new Error('OSS storage not implemented yet');
  }

  getUrl(key: string): string {
    if (!this.config) {
      throw new Error('OSSStorageService not properly configured');
    }

    // TODO: 实现OSS URL生成逻辑
    return `https://${this.config.bucket}.${this.config.endpoint}/${key}`;
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // TODO: 实现OSS预签名URL生成逻辑
    throw new Error('OSS storage not implemented yet');
  }
}

// 存储服务工厂
export class StorageServiceFactory {
  private static instance: IStorageService;

  static getInstance(): IStorageService {
    if (!this.instance) {
      this.instance = this.createStorageService();
    }
    return this.instance;
  }

  private static createStorageService(): IStorageService {
    const config = this.getStorageConfig();
    
    switch (config.type) {
      case 'local':
        return new LocalStorageService(config.local);
      case 'oss':
        return new OSSStorageService(config.oss);
      default:
        throw new Error(`Unsupported storage type: ${config.type}`);
    }
  }

  private static getStorageConfig(): StorageConfig {
    // 从环境变量读取配置
    const storageType = process.env.STORAGE_TYPE || 'local';
    
    if (storageType === 'local') {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      
      // 调试日志：输出当前使用的baseUrl
      console.log('🔧 存储服务配置:');
      console.log(`   STORAGE_TYPE: ${storageType}`);
      console.log(`   NEXT_PUBLIC_BASE_URL: ${process.env.NEXT_PUBLIC_BASE_URL || '未设置'}`);
      console.log(`   实际使用的baseUrl: ${baseUrl}`);
      
      return {
        type: 'local',
        local: {
          uploadDir: path.join(process.cwd(), 'public'),
          baseUrl: baseUrl,
        },
      };
    }
    
    if (storageType === 'oss') {
      return {
        type: 'oss',
        oss: {
          region: process.env.OSS_REGION!,
          bucket: process.env.OSS_BUCKET!,
          accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
          accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
          endpoint: process.env.OSS_ENDPOINT,
        },
      };
    }
    
    throw new Error(`Invalid storage type: ${storageType}`);
  }

  // 重置实例（主要用于测试）
  static resetInstance(): void {
    // @ts-expect-error - 仅用于测试环境重置实例
    this.instance = undefined;
  }
}

// 导出默认实例
export const storageService = StorageServiceFactory.getInstance();