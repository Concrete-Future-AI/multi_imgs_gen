/**
 * 完整的电商图片生成Pipeline
 * 
 * 流程：
 * 1. 图片识别 - 使用豆包视觉模型分析产品主体
 * 2. Prompt生成 - 基于识别结果生成专业prompt
 * 3. 图片生成 - 使用生成的prompt生成5张不同视角的电商图
 * 
 * 输入：外贸电商商家随手拍的产品图片
 * 输出：5张专业的多视角电商产品图
 * 
 * 使用方法：
 *   npm run pipeline
 *   或
 *   node pipeline-full.js [图片路径]
 */

import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeImage } from './analyze-image.js';
import { generatePrompt } from './generate-prompt.js';
import {
  createOutputDirs,
  downloadAndSaveImage,
  formatFileSize
} from './storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.env.local') });

const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY;
const DOUBAO_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';

if (!DOUBAO_API_KEY) {
  console.error('❌ 错误: 未找到DOUBAO_API_KEY');
  process.exit(1);
}

/**
 * 生成单张电商图片（指定视角）
 * 
 * @param {string} imageDataUri - 原始图片的data URI
 * @param {string} basePrompt - 基础prompt
 * @param {Object} viewpoint - 视角信息
 * @returns {Promise<Object>} API响应
 */
async function generateSingleImage(imageDataUri, basePrompt, viewpoint) {
  // 构建针对特定视角的简化prompt
  const viewPrompt = `${basePrompt}

【当前视角】：${viewpoint.name}
${viewpoint.description}

【要求】：
- 严格保持产品主体100%一致（颜色、材质、尺寸、特征不变）
- ${viewpoint.background || '纯白色或浅灰色背景'}
- 专业打光，突出产品质感
- 4K高清，细节清晰`;
  
  const requestBody = {
    model: 'doubao-seedream-4-0-250828',
    prompt: viewPrompt,
    image: [imageDataUri],
    size: '2K',
    response_format: 'url',
    watermark: false
  };
  
  try {
    const response = await axios.post(
      `${DOUBAO_BASE_URL}/images/generations`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DOUBAO_API_KEY}`
        },
        timeout: 120000
      }
    );
    
    return response.data;
    
  } catch (error) {
    console.error(`  ❌ 生成失败: ${error.message}`);
    throw error;
  }
}

/**
 * 循环生成多张电商图片（每次生成1张）
 * 
 * @param {string} imageDataUri - 原始图片的data URI
 * @param {string} basePrompt - 基础prompt（简化版）
 * @param {number} quantity - 生成数量
 * @param {string} imageType - 图片类型：'closeup' 或 'scene'
 * @returns {Promise<Array>} 所有生成结果
 */
async function generateEcommerceImages(imageDataUri, basePrompt, quantity = 5, imageType = 'closeup') {
  console.log('\n🎨 步骤3: 生成多视角电商图片');
  console.log('='.repeat(80));
  console.log(`📝 模型: doubao-seedream-4-0-250828`);
  console.log(`🔢 生成数量: ${quantity}张`);
  console.log(`📏 输出尺寸: 2K (2304x1728)`);
  console.log(`🎯 类型: ${imageType === 'closeup' ? '产品特写图' : '场景图'}`);
  console.log(`🔄 策略: 循环调用，每次生成1张不同视角`);
  console.log('');
  
  // 根据类型定义5个视角
  const viewpoints = imageType === 'closeup' ? [
    {
      name: '正面特写',
      description: '产品正面平铺，镜头垂直拍摄，完整展示所有珠子排列，突出整体色调和纹理',
      background: '纯白色背景'
    },
    {
      name: '45度俯视',
      description: '从45度角俯视，手链呈自然环形，展示珠子立体排列和圆润弧度',
      background: '浅灰色背景'
    },
    {
      name: '侧面轮廓',
      description: '侧面水平拍摄，展示珠子厚度、串制连接状态和整体轮廓',
      background: '纯白色背景'
    },
    {
      name: '微距细节',
      description: '聚焦1-2颗珠子，近距离展示表面纹理、虎眼效应光带和打磨工艺',
      background: '柔和背景虚化'
    },
    {
      name: '整体展示',
      description: '稍远距离拍摄，完整展示手链周长和自然垂挂状态，突出整体美感',
      background: '纯白色背景，留白构图'
    }
  ] : [
    {
      name: '正面场景视角',
      description: '产品在场景中正面展示，自然摆放，与场景元素和谐融合',
      background: '真实场景背景'
    },
    {
      name: '45度俯视场景',
      description: '从45度角俯视，展示产品与场景的空间关系，营造氛围感',
      background: '真实场景背景'
    },
    {
      name: '侧面场景视角',
      description: '侧面角度展示产品在场景中的状态，突出产品轮廓与环境对比',
      background: '真实场景背景'
    },
    {
      name: '微距细节',
      description: '聚焦产品细节特写，背景虚化，突出产品质感，场景作为氛围衬托',
      background: '场景虚化背景'
    },
    {
      name: '整体场景展示',
      description: '展示完整场景氛围，产品作为主体，场景元素营造生活方式感',
      background: '完整场景背景'
    }
  ];
  
  const results = [];
  let totalTokens = 0;
  
  // 从完整prompt中提取核心产品信息
  const coreInfo = basePrompt.split('【产品信息】')[1]?.split('【')[0] || '天然虎眼石手链';
  
  for (let i = 0; i < quantity; i++) {
    const viewpoint = viewpoints[i];
    console.log(`\n  ${i + 1}/${quantity} 生成 [${viewpoint.name}]`);
    
    try {
      const result = await generateSingleImage(imageDataUri, coreInfo, viewpoint);
      
      console.log(`  ✅ 成功生成`);
      console.log(`     图片数: ${result.data.length}`);
      
      if (result.usage) {
        console.log(`     Token: ${result.usage.total_tokens}`);
        totalTokens += result.usage.total_tokens;
      }
      
      results.push(...result.data.map(img => ({
        ...img,
        viewpoint: viewpoint.name
      })));
      
      // 添加延迟避免API限流
      if (i < quantity - 1) {
        console.log(`     ⏳ 等待2秒...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      console.error(`  ❌ 生成 [${viewpoint.name}] 失败，跳过`);
      // 继续生成其他视角
      continue;
    }
  }
  
  console.log('');
  console.log(`✅ 生成完成: ${results.length}/${quantity}张`);
  console.log(`💰 总Token使用: ${totalTokens}`);
  console.log('='.repeat(80));
  
  return { data: results, usage: { total_tokens: totalTokens } };
}

/**
 * 下载生成的图片到本地（每张图片独立保存）
 * 
 * @param {Array} imagesData - 图片数据数组
 * @returns {Promise<Array>} 下载结果
 */
async function downloadImages(imagesData) {
  console.log('\n📥 步骤4: 下载生成的图片到本地');
  console.log('='.repeat(80));
  
  const results = [];
  const timestamp = Date.now();
  
  for (let i = 0; i < imagesData.length; i++) {
    const imageData = imagesData[i];
    // 使用图片数据中的viewpoint字段，如果没有则用默认名称
    const viewName = imageData.viewpoint || `视角${i + 1}`;
    
    try {
      // 每张图片独立命名，确保不会覆盖
      const filename = `ecommerce_${viewName}_${timestamp}_${i + 1}.png`;
      
      console.log(`\n  ${i + 1}/${imagesData.length} [${viewName}]`);
      console.log(`    尺寸: ${imageData.size}`);
      console.log(`    文件: ${filename}`);
      
      // 下载并保存到本地
      const localPath = await downloadAndSaveImage(imageData.url, filename);
      
      results.push({
        success: true,
        localPath: localPath,
        filename: filename,
        viewpoint: viewName,
        size: imageData.size
      });
    } catch (error) {
      console.error(`    ❌ 下载失败: ${error.message}`);
      results.push({
        success: false,
        error: error.message,
        viewpoint: viewName
      });
    }
  }
  
  console.log('\n='.repeat(80));
  console.log(`📦 下载完成: ${results.filter(r => r.success).length}/${imagesData.length}张`);
  console.log(`💾 保存目录: test-api/output/generated/`);
  console.log('='.repeat(80));
  
  return results;
}

/**
 * 打印最终报告
 * 
 * @param {Object} stats - 统计信息
 * @param {Array} results - 下载结果
 * @param {string} imageType - 图片类型
 * @param {string} sceneDescription - 场景描述
 */
function printFinalReport(stats, results, imageType, sceneDescription) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 电商图片生成Pipeline完成报告');
  console.log('='.repeat(80));
  console.log(`⏰ 完成时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`⏱️  总耗时: ${(stats.totalTime / 1000).toFixed(2)}秒`);
  console.log('');
  console.log('🎯 生成配置:');
  console.log(`   类型: ${imageType === 'closeup' ? '产品特写图（纯背景）' : '场景图'}`);
  if (imageType === 'scene' && sceneDescription) {
    console.log(`   场景: ${sceneDescription}`);
  }
  console.log('');
  console.log('🔄 Pipeline步骤:');
  console.log(`   1. 图片识别 ✅ (耗时: ${(stats.analyzeTime / 1000).toFixed(2)}秒)`);
  console.log(`   2. Prompt生成 ✅ (耗时: ${(stats.promptTime / 1000).toFixed(2)}秒)`);
  console.log(`   3. 图片生成 ✅ (耗时: ${(stats.generateTime / 1000).toFixed(2)}秒)`);
  console.log(`   4. 图片下载 ✅ (耗时: ${(stats.downloadTime / 1000).toFixed(2)}秒)`);
  console.log('');
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
 * 主函数 - 执行完整pipeline
 * 
 * 命令行参数：
 *   node pipeline-full.js [图片路径] [类型] [场景描述]
 *   
 *   类型：closeup (产品特写图) 或 scene (场景图)
 *   场景描述：当类型为scene时必需
 *   
 * 示例：
 *   node pipeline-full.js stone_img.jpg closeup
 *   node pipeline-full.js stone_img.jpg scene "木质桌面上，旁边有咖啡杯"
 */
async function runPipeline() {
  console.log('\n🚀 电商图片生成完整Pipeline');
  console.log('📌 输入：外贸电商商家随手拍的产品图片');
  console.log('📌 输出：5张专业多视角电商产品图');
  console.log('');
  
  // 解析命令行参数
  const inputImagePath = process.argv[2] || path.join(__dirname, 'stone_img.jpg');
  const imageType = process.argv[3] || 'closeup'; // 默认产品特写图
  const sceneDescription = process.argv[4] || '';
  
  // 验证参数
  if (imageType === 'scene' && !sceneDescription) {
    console.error('❌ 错误：选择场景图时必须提供场景描述');
    console.log('💡 使用方法：node pipeline-full.js 图片路径 scene "场景描述"');
    console.log('💡 示例：node pipeline-full.js stone_img.jpg scene "木质桌面上，旁边有咖啡杯和书本"');
    process.exit(1);
  }
  
  if (imageType !== 'closeup' && imageType !== 'scene') {
    console.error('❌ 错误：图片类型必须是 closeup 或 scene');
    process.exit(1);
  }
  
  console.log('📋 生成配置:');
  console.log(`   类型: ${imageType === 'closeup' ? '产品特写图（纯背景）' : '场景图'}`);
  if (imageType === 'scene') {
    console.log(`   场景: ${sceneDescription}`);
  }
  console.log('');
  console.log('🔄 Pipeline流程:');
  console.log('   1️⃣  图片识别 → 2️⃣  Prompt生成 → 3️⃣  图片生成 → 4️⃣  保存到本地');
  console.log('');
  
  const overallStartTime = Date.now();
  const stats = {
    totalImages: 5,
    successCount: 0,
    failCount: 0,
    totalTime: 0,
    analyzeTime: 0,
    promptTime: 0,
    generateTime: 0,
    downloadTime: 0
  };
  
  try {
    // 创建输出目录
    createOutputDirs();
    
    if (!fs.existsSync(inputImagePath)) {
      throw new Error(`图片文件不存在: ${inputImagePath}`);
    }
    
    console.log('📸 输入图片:');
    console.log(`   文件: ${path.basename(inputImagePath)}`);
    console.log(`   路径: ${inputImagePath}`);
    const fileStats = fs.statSync(inputImagePath);
    console.log(`   大小: ${formatFileSize(fileStats.size)}`);
    
    // 准备图片的data URI（用于图片生成）
    const imageBuffer = fs.readFileSync(inputImagePath);
    const base64Image = imageBuffer.toString('base64');
    const imageDataUri = `data:image/jpeg;base64,${base64Image}`;
    
    // ========== 步骤1: 图片识别 ==========
    const step1Start = Date.now();
    const productDescription = await analyzeImage(inputImagePath);
    stats.analyzeTime = Date.now() - step1Start;
    
    // ========== 步骤2: Prompt生成 ==========
    const step2Start = Date.now();
    const generatedPrompt = await generatePrompt(productDescription, imageType, sceneDescription);
    stats.promptTime = Date.now() - step2Start;
    
    // ========== 步骤3: 图片生成 ==========
    const step3Start = Date.now();
    const generateResult = await generateEcommerceImages(
      imageDataUri,
      generatedPrompt,
      stats.totalImages,
      imageType
    );
    stats.generateTime = Date.now() - step3Start;
    
    // ========== 步骤4: 下载图片 ==========
    const step4Start = Date.now();
    const downloadResults = await downloadImages(generateResult.data);
    stats.downloadTime = Date.now() - step4Start;
    
    // 统计结果
    downloadResults.forEach(result => {
      if (result.success) {
        stats.successCount++;
      } else {
        stats.failCount++;
      }
    });
    
    stats.totalTime = Date.now() - overallStartTime;
    
    // 打印最终报告
    printFinalReport(stats, downloadResults, imageType, sceneDescription);
    
    console.log('\n✅ Pipeline执行完成！');
    console.log('💡 所有图片已保存到本地，可直接用于电商平台');
    
  } catch (error) {
    console.error('\n❌ Pipeline执行失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  }
}

// 运行pipeline
runPipeline();
