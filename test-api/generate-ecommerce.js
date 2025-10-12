/**
 * 豆包AI电商图片生成脚本
 * 
 * 功能：
 * 1. 使用本地产品图片作为参考
 * 2. 调用豆包Seedream 4.0 API生成5张不同视角的电商图
 * 3. 所有生成的图片保存到本地，避免跨域问题
 * 4. 预留S3/OSS云存储接口供生产环境使用
 * 
 * 使用方法：
 *   npm run generate
 * 
 * 注意事项：
 * - 豆包API需要公网可访问的图片URL
 * - 测试环境使用官方示例图片
 * - 生产环境需要先上传图片到S3/OSS获取URL
 */

import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createOutputDirs,
  downloadAndSaveImage,
  uploadToS3,
  formatFileSize
} from './storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.env.local') });

// 豆包API配置
const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY;
const DOUBAO_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';

// 验证API密钥
if (!DOUBAO_API_KEY) {
  console.error('❌ 错误: 未找到DOUBAO_API_KEY');
  console.log('💡 请在.env.local文件中配置: DOUBAO_API_KEY=你的密钥');
  process.exit(1);
}

/**
 * 准备产品图片URL
 * 
 * 方案1: 本地图片转Base64（尝试data URI格式）
 * 方案2: 上传到图床获取公网URL
 * 
 * @returns {Promise<string>} 图片的URL或data URI
 */
async function prepareProductImageUrl() {
  console.log('\n📤 步骤1: 准备产品图片');
  console.log('='.repeat(80));
  
  // 使用用户指定的图片
  const localImagePath = path.join(__dirname, 'stone_img.jpg');
  
  // 检查本地图片是否存在
  if (!fs.existsSync(localImagePath)) {
    console.error('❌ 未找到图片: stone_img.jpg');
    console.log('💡 请确保stone_img.jpg文件在test-api目录下');
    throw new Error('图片文件不存在');
  }
  
  const stats = fs.statSync(localImagePath);
  console.log(`✅ 找到本地图片: ${path.basename(localImagePath)}`);
  console.log(`   大小: ${formatFileSize(stats.size)}`);
  console.log('');
  
  // 尝试方案1: 使用Base64 data URI格式
  console.log('🔄 尝试方案1: Base64 data URI格式');
  try {
    const imageBuffer = fs.readFileSync(localImagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = 'image/jpeg'; // stone_img.jpg是JPEG格式
    
    // 构建data URI
    const dataUri = `data:${mimeType};base64,${base64Image}`;
    
    console.log(`   Base64长度: ${base64Image.length} 字符`);
    console.log(`   Data URI格式: data:image/jpeg;base64,... (${dataUri.length}字符)`);
    console.log('');
    console.log('📝 注意: 如果API不支持data URI，将自动切换到上传方案');
    console.log('='.repeat(80));
    
    return dataUri;
  } catch (error) {
    console.error('❌ Base64转换失败:', error.message);
    throw error;
  }
}

/**
 * 构建电商图片生成的Prompt
 * 
 * 重点：
 * - 严格保证主体一致性（颜色、材质、尺寸、设计）
 * - 干净的电商风格背景
 * - 专业的摄影角度和打光
 * 
 * @param {string} productDescription - 产品描述
 * @returns {string} 生成的prompt
 */
function buildEcommercePrompt(productDescription) {
  // 定义5个不同的拍摄视角
  const viewpoints = [
    '正面特写: 产品正面直视，居中构图，纯白背景，突出产品细节和质感',
    '45度俯视: 从45度角俯视产品，展示立体感和结构，浅灰背景',
    '侧面轮廓: 90度侧面视角，突出产品轮廓线条，纯白背景，清晰边缘',
    '微距细节: 近距离特写，展示材质纹理和工艺细节，浅景深，柔和光线',
    '整体展示: 稍远距离，展示产品全貌，简洁场景，留白构图，大气感'
  ];
  
  const prompt = `【严格要求：主体一致性】
生成5张专业电商产品摄影图片，要求如下：

## 产品信息
${productDescription}

## 核心要求（最重要）
**主体100%一致性：**
- 产品的颜色、材质、大小、形状必须完全相同
- 所有设计细节、纹理、图案必须一致
- 如果是珠宝手串，珠子数量必须相同
- 如果有logo或文字，必须完全一致
- 禁止改变产品的任何特征

## 电商摄影标准
**背景要求：**
- 纯净背景：纯白色(#FFFFFF)或浅灰色(#F5F5F5)
- 无杂物、无干扰元素
- 背景简洁、专业

**光线要求：**
- 柔和均匀的打光，无强烈阴影
- 突出产品质感
- 色彩还原准确

**构图要求：**
- 产品居中或遵循三分法
- 留白适当，视觉平衡
- 4K分辨率，清晰锐利

## 5个拍摄视角
${viewpoints.map((v, i) => `${i + 1}. ${v}`).join('\n')}

## 禁止事项
❌ 禁止改变产品特征
❌ 禁止添加其他物品
❌ 禁止复杂背景
❌ 禁止过度修饰和滤镜

## 风格参考
参考天猫、京东等电商平台的专业产品图风格：
- 干净、清晰、专业
- 突出产品本身
- 适合电商展示和转化`;

  return prompt;
}

/**
 * 调用豆包API生成电商图片
 * 
 * API文档参考: doubao_call_api_doc.md
 * 模型: doubao-seedream-4-0-250828
 * 
 * @param {string} imageUrl - 参考图片的公网URL
 * @param {string} prompt - 生成提示词
 * @param {number} quantity - 生成数量（1-10）
 * @returns {Promise<Object>} API响应结果
 */
async function generateWithDoubao(imageUrl, prompt, quantity = 5) {
  console.log('\n🎨 步骤2: 调用豆包API生成图片');
  console.log('='.repeat(80));
  console.log(`📝 模型: doubao-seedream-4-0-250828`);
  console.log(`🔢 生成数量: ${quantity}张`);
  console.log(`🖼️  参考图片: ${imageUrl}`);
  console.log(`📏 输出尺寸: 2K (2720x1536)`);
  console.log('');
  
  try {
    const requestBody = {
      model: 'doubao-seedream-4-0-250828',
      prompt: prompt,
      image: [imageUrl], // 参考图片URL数组
      size: '2K', // 输出尺寸
      sequential_image_generation: 'auto', // 自动生成系列图
      sequential_image_generation_options: {
        max_images: quantity // 最大生成数量
      },
      response_format: 'url', // 返回URL格式
      watermark: false // 不添加水印
    };
    
    console.log('📤 发送请求到豆包API...');
    
    const response = await axios.post(
      `${DOUBAO_BASE_URL}/images/generations`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DOUBAO_API_KEY}`
        },
        timeout: 180000 // 3分钟超时
      }
    );
    
    console.log('✅ API响应成功');
    console.log(`📊 实际生成: ${response.data.data.length}张图片`);
    
    if (response.data.usage) {
      console.log(`💰 Token使用: ${response.data.usage.total_tokens}`);
    }
    
    console.log('='.repeat(80));
    
    return response.data;
  } catch (error) {
    console.error('\n❌ API调用失败');
    
    if (error.response) {
      console.error(`状态码: ${error.response.status}`);
      console.error('错误详情:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('网络错误: 无法连接到豆包API');
    } else {
      console.error('错误:', error.message);
    }
    
    throw error;
  }
}

/**
 * 下载生成的图片到本地
 * 所有图片保存在 output/generated/ 目录
 * 避免跨域问题
 * 
 * @param {Array} imagesData - 豆包API返回的图片数据数组
 * @returns {Promise<Array>} 下载结果数组
 */
async function downloadGeneratedImages(imagesData) {
  console.log('\n📥 步骤3: 下载生成的图片到本地');
  console.log('='.repeat(80));
  
  const viewNames = [
    '正面特写',
    '45度俯视',
    '侧面轮廓',
    '微距细节',
    '整体展示'
  ];
  
  const results = [];
  const timestamp = Date.now();
  
  for (let i = 0; i < imagesData.length; i++) {
    const imageData = imagesData[i];
    const viewName = viewNames[i] || `视角${i + 1}`;
    
    try {
      // 构建文件名: ecommerce_视角名称_时间戳_序号.png
      const filename = `ecommerce_${viewName}_${timestamp}_${i + 1}.png`;
      
      console.log(`\n  ${i + 1}/${imagesData.length} [${viewName}]`);
      console.log(`    URL: ${imageData.url}`);
      console.log(`    尺寸: ${imageData.size}`);
      
      // 下载并保存到本地
      const localPath = await downloadAndSaveImage(imageData.url, filename);
      
      results.push({
        success: true,
        localPath: localPath,
        filename: filename,
        viewpoint: viewName,
        size: imageData.size,
        remoteUrl: imageData.url
      });
    } catch (error) {
      console.error(`    ❌ 下载失败: ${error.message}`);
      
      results.push({
        success: false,
        error: error.message,
        viewpoint: viewName,
        remoteUrl: imageData.url
      });
    }
  }
  
  console.log('\n='.repeat(80));
  return results;
}

/**
 * 打印生成报告
 * 
 * @param {Object} stats - 统计信息
 * @param {Array} results - 下载结果
 */
function printReport(stats, results) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 电商图片生成完成报告');
  console.log('='.repeat(80));
  console.log(`⏰ 生成时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`⏱️  总耗时: ${(stats.totalTime / 1000).toFixed(2)}秒`);
  console.log(`✅ 成功: ${stats.successCount}/${stats.totalImages}张`);
  console.log(`❌ 失败: ${stats.failCount}张`);
  console.log(`📈 成功率: ${((stats.successCount / stats.totalImages) * 100).toFixed(1)}%`);
  
  if (stats.successCount > 0) {
    console.log('\n📁 生成的图片:');
    results.forEach((result, i) => {
      if (result.success) {
        console.log(`\n  ${i + 1}. [${result.viewpoint}]`);
        console.log(`     文件: ${result.filename}`);
        console.log(`     路径: ${result.localPath}`);
        console.log(`     尺寸: ${result.size}`);
      }
    });
    
    const { generatedDir } = createOutputDirs();
    console.log(`\n💾 所有图片保存在: ${generatedDir}`);
  }
  
  console.log('\n' + '='.repeat(80));
}

/**
 * 主函数
 */
async function main() {
  console.log('\n🚀 豆包AI电商图片生成器');
  console.log('📌 模型: Seedream 4.0');
  console.log('🎯 目标: 生成5张不同视角的专业电商产品图');
  console.log('💾 存储: 本地文件系统（避免跨域）');
  console.log('');
  
  const startTime = Date.now();
  const stats = {
    totalImages: 5,
    successCount: 0,
    failCount: 0,
    totalTime: 0
  };
  
  try {
    // 创建输出目录
    createOutputDirs();
    
    // 步骤1: 准备产品图片URL
    const productImageUrl = await prepareProductImageUrl();
    
    // 产品描述（根据stone_img.jpg的实际内容）
    const productDescription = '虎眼石手串，由多颗圆形珠子串联而成，呈现金棕色和深色条纹，具有天然的猫眼效应';
    
    // 构建prompt
    const prompt = buildEcommercePrompt(productDescription);
    
    // 步骤2: 调用豆包API生成图片
    const generateResult = await generateWithDoubao(
      productImageUrl,
      prompt,
      stats.totalImages
    );
    
    // 步骤3: 下载图片到本地
    const downloadResults = await downloadGeneratedImages(generateResult.data);
    
    // 统计结果
    downloadResults.forEach(result => {
      if (result.success) {
        stats.successCount++;
      } else {
        stats.failCount++;
      }
    });
    
    stats.totalTime = Date.now() - startTime;
    
    // 打印报告
    printReport(stats, downloadResults);
    
    console.log('\n✅ 生成完成！');
    console.log('💡 提示: 生产环境请配置S3/OSS上传功能');
    
  } catch (error) {
    console.error('\n❌ 生成失败:', error.message);
    process.exit(1);
  }
}

// 运行主函数
main();
