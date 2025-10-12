/**
 * 本地存储和S3/OSS上传工具模块
 * 用于处理图片的本地保存和云存储上传
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 创建本地输出目录
 * @returns {Object} 包含各类输出目录的路径对象
 */
export function createOutputDirs() {
  const outputDir = path.join(__dirname, 'output');
  const generatedDir = path.join(outputDir, 'generated');
  const tempDir = path.join(outputDir, 'temp');
  
  // 确保目录存在
  [outputDir, generatedDir, tempDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  return { outputDir, generatedDir, tempDir };
}

/**
 * 从URL下载图片并保存到本地
 * 避免跨域问题，所有图片保存在本地文件系统
 * 
 * @param {string} imageUrl - 图片的URL地址
 * @param {string} filename - 保存的文件名
 * @returns {Promise<string>} 返回本地文件路径
 */
export async function downloadAndSaveImage(imageUrl, filename) {
  const { generatedDir } = createOutputDirs();
  const filePath = path.join(generatedDir, filename);
  
  try {
    // 使用fetch下载图片
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`下载失败: HTTP ${response.status}`);
    }
    
    // 将响应转为Buffer并保存
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);
    
    console.log(`  ✅ 已保存: ${filename}`);
    return filePath;
  } catch (error) {
    console.error(`  ❌ 下载失败 (${filename}):`, error.message);
    throw error;
  }
}

/**
 * 读取本地图片文件为Base64
 * 用于某些需要Base64编码的场景
 * 
 * @param {string} imagePath - 本地图片路径
 * @returns {string} Base64编码的图片数据
 */
export function readImageAsBase64(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString('base64');
  } catch (error) {
    console.error('读取图片失败:', error.message);
    throw error;
  }
}

/**
 * 保存Base64图片到本地文件
 * 
 * @param {string} base64Data - Base64编码的图片数据
 * @param {string} filename - 保存的文件名
 * @returns {string} 返回本地文件路径
 */
export function saveBase64Image(base64Data, filename) {
  const { generatedDir } = createOutputDirs();
  const filePath = path.join(generatedDir, filename);
  
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    console.log(`  ✅ 已保存: ${filename}`);
    return filePath;
  } catch (error) {
    console.error(`保存图片失败 (${filename}):`, error.message);
    throw error;
  }
}

/**
 * ========== S3/OSS云存储接口（预留） ==========
 * 
 * 生产环境建议：
 * 1. 将产品图片上传到S3/OSS获取公网URL
 * 2. 使用公网URL调用豆包API
 * 3. 生成的图片下载到本地或再次上传到S3/OSS
 * 
 * 支持的云存储服务：
 * - AWS S3
 * - 阿里云 OSS
 * - 腾讯云 COS
 * - 七牛云 Kodo
 */

/**
 * 上传图片到S3/OSS（接口预留）
 * 
 * 使用方法：
 * 1. 安装对应的SDK：
 *    - AWS: npm install @aws-sdk/client-s3
 *    - 阿里云: npm install ali-oss
 *    - 腾讯云: npm install cos-nodejs-sdk-v5
 * 
 * 2. 配置环境变量（.env.local）：
 *    S3_PROVIDER=aws|aliyun|tencent
 *    S3_ACCESS_KEY_ID=你的密钥ID
 *    S3_SECRET_ACCESS_KEY=你的密钥
 *    S3_BUCKET=你的桶名
 *    S3_REGION=区域
 * 
 * 3. 调用此函数上传图片
 * 
 * @param {string} localFilePath - 本地文件路径
 * @param {Object} options - 上传配置选项
 * @returns {Promise<string>} 返回公网可访问的图片URL
 */
export async function uploadToS3(localFilePath, options = {}) {
  const {
    provider = process.env.S3_PROVIDER || 'aws', // 'aws' | 'aliyun' | 'tencent'
    bucket = process.env.S3_BUCKET,
    region = process.env.S3_REGION,
    accessKeyId = process.env.S3_ACCESS_KEY_ID,
    secretAccessKey = process.env.S3_SECRET_ACCESS_KEY,
    customEndpoint = process.env.S3_ENDPOINT, // 自定义端点（可选）
  } = options;
  
  // 验证配置
  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new Error('S3配置不完整，请检查环境变量');
  }
  
  const fileName = path.basename(localFilePath);
  const fileBuffer = fs.readFileSync(localFilePath);
  
  console.log(`\n📤 上传到云存储 (${provider})...`);
  console.log(`  文件: ${fileName}`);
  console.log(`  桶: ${bucket}`);
  
  // TODO: 根据provider选择对应的SDK实现上传
  switch (provider) {
    case 'aws':
      // return await uploadToAWS(fileBuffer, fileName, { bucket, region, accessKeyId, secretAccessKey });
      console.log('  ⚠️  AWS S3上传功能待实现');
      break;
      
    case 'aliyun':
      // return await uploadToAliyunOSS(fileBuffer, fileName, { bucket, region, accessKeyId, secretAccessKey });
      console.log('  ⚠️  阿里云OSS上传功能待实现');
      break;
      
    case 'tencent':
      // return await uploadToTencentCOS(fileBuffer, fileName, { bucket, region, accessKeyId, secretAccessKey });
      console.log('  ⚠️  腾讯云COS上传功能待实现');
      break;
      
    default:
      throw new Error(`不支持的云存储提供商: ${provider}`);
  }
  
  // 临时返回示例URL（实际使用时需要返回真实的上传结果）
  const mockUrl = `https://${bucket}.${provider}.example.com/${fileName}`;
  console.log(`  ✅ 上传成功: ${mockUrl}`);
  return mockUrl;
}

/**
 * AWS S3上传实现示例（待实现）
 */
async function uploadToAWS(fileBuffer, fileName, config) {
  // 示例代码：
  // import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
  // 
  // const s3Client = new S3Client({
  //   region: config.region,
  //   credentials: {
  //     accessKeyId: config.accessKeyId,
  //     secretAccessKey: config.secretAccessKey
  //   }
  // });
  // 
  // const command = new PutObjectCommand({
  //   Bucket: config.bucket,
  //   Key: `uploads/${fileName}`,
  //   Body: fileBuffer,
  //   ContentType: 'image/jpeg'
  // });
  // 
  // await s3Client.send(command);
  // return `https://${config.bucket}.s3.${config.region}.amazonaws.com/uploads/${fileName}`;
  
  throw new Error('AWS S3上传功能待实现');
}

/**
 * 阿里云OSS上传实现示例（待实现）
 */
async function uploadToAliyunOSS(fileBuffer, fileName, config) {
  // 示例代码：
  // import OSS from 'ali-oss';
  // 
  // const client = new OSS({
  //   region: config.region,
  //   accessKeyId: config.accessKeyId,
  //   accessKeySecret: config.secretAccessKey,
  //   bucket: config.bucket
  // });
  // 
  // const result = await client.put(`uploads/${fileName}`, fileBuffer);
  // return result.url;
  
  throw new Error('阿里云OSS上传功能待实现');
}

/**
 * 腾讯云COS上传实现示例（待实现）
 */
async function uploadToTencentCOS(fileBuffer, fileName, config) {
  // 示例代码：
  // import COS from 'cos-nodejs-sdk-v5';
  // 
  // const cos = new COS({
  //   SecretId: config.accessKeyId,
  //   SecretKey: config.secretAccessKey
  // });
  // 
  // const result = await cos.putObject({
  //   Bucket: config.bucket,
  //   Region: config.region,
  //   Key: `uploads/${fileName}`,
  //   Body: fileBuffer
  // });
  // 
  // return `https://${config.bucket}.cos.${config.region}.myqcloud.com/uploads/${fileName}`;
  
  throw new Error('腾讯云COS上传功能待实现');
}

/**
 * 获取文件的MIME类型
 * @param {string} filename - 文件名
 * @returns {string} MIME类型
 */
export function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  };
  return mimeTypes[ext] || 'image/jpeg';
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
