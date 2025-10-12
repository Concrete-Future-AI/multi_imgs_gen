/**
 * 交互式电商图片生成Pipeline
 * 
 * 功能：通过交互式菜单选择生成类型
 * 1. 产品特写图（纯背景，突出产品）
 * 2. 场景图（产品在真实场景中，需要输入场景描述）
 * 
 * 使用方法：
 *   npm run pipeline:interactive
 *   或
 *   node pipeline-interactive.js [图片路径]
 */

import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
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
 * 创建readline接口用于交互式输入
 */
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * 异步询问问题
 */
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

/**
 * 生成单张电商图片（指定视角）
 */
async function generateSingleImage(imageDataUri, basePrompt, viewpoint) {
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
 * 循环生成多张电商图片
 */
async function generateEcommerceImages(imageDataUri, basePrompt, quantity = 5, imageType = 'closeup') {
  console.log('\n🎨 步骤3: 生成多视角电商图片');
  console.log('='.repeat(80));
  console.log(`📝 模型: doubao-seedream-4-0-250828`);
  console.log(`🔢 生成数量: ${quantity}张`);
  console.log(`📏 输出尺寸: 2K (2304x1728)`);
  console.log(`🎯 类型: ${imageType === 'closeup' ? '产品特写图' : '场景图'}`);
  console.log('');
  
  // 定义5个视角（根据类型调整）
  const viewpoints = imageType === 'closeup' ? [
    {
      name: '正面特写',
      description: '产品正面平铺，镜头垂直拍摄，完整展示所有特征，突出整体造型',
      background: '纯白色背景'
    },
    {
      name: '45度俯视',
      description: '从45度角俯视，产品呈自然摆放，展示立体感和空间关系',
      background: '浅灰色背景'
    },
    {
      name: '侧面轮廓',
      description: '侧面水平拍摄，展示产品厚度、边缘细节和整体轮廓线条',
      background: '纯白色背景'
    },
    {
      name: '微距细节',
      description: '近距离特写，聚焦产品表面纹理、材质质感和工艺细节',
      background: '柔和背景虚化'
    },
    {
      name: '整体展示',
      description: '稍远距离拍摄，完整展示产品全貌，突出整体美感和比例',
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
  const coreInfo = basePrompt.split('【产品信息】')[1]?.split('【')[0] || basePrompt.substring(0, 200);
  
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
 * 下载生成的图片到本地
 */
async function downloadImages(imagesData) {
  console.log('\n📥 步骤4: 下载生成的图片到本地');
  console.log('='.repeat(80));
  
  const results = [];
  const timestamp = Date.now();
  
  for (let i = 0; i < imagesData.length; i++) {
    const imageData = imagesData[i];
    const viewName = imageData.viewpoint || `视角${i + 1}`;
    
    try {
      const filename = `ecommerce_${viewName}_${timestamp}_${i + 1}.png`;
      
      console.log(`\n  ${i + 1}/${imagesData.length} [${viewName}]`);
      console.log(`    尺寸: ${imageData.size}`);
      console.log(`    文件: ${filename}`);
      
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
 * 显示欢迎界面和选项菜单
 */
async function showWelcomeAndGetOptions() {
  console.log('\n' + '='.repeat(80));
  console.log('🎨 欢迎使用AI电商图片生成Pipeline（交互式版本）');
  console.log('='.repeat(80));
  console.log('\n📖 功能说明：');
  console.log('   将您的产品图片转换为专业的电商展示组图');
  console.log('   支持两种类型：产品特写图、场景图\n');
  
  // 获取图片路径
  const defaultImagePath = path.join(__dirname, 'stone_img.jpg');
  const inputImagePath = process.argv[2] || defaultImagePath;
  
  if (!fs.existsSync(inputImagePath)) {
    console.error(`❌ 错误：图片文件不存在: ${inputImagePath}`);
    rl.close();
    process.exit(1);
  }
  
  console.log('📸 输入图片：');
  console.log(`   文件: ${path.basename(inputImagePath)}`);
  console.log(`   路径: ${inputImagePath}`);
  const fileStats = fs.statSync(inputImagePath);
  console.log(`   大小: ${formatFileSize(fileStats.size)}`);
  console.log('');
  
  // 选择图片类型
  console.log('🎯 请选择生成类型：');
  console.log('   1️⃣  产品特写图');
  console.log('      • 纯净背景（纯白/浅灰）');
  console.log('      • 突出产品本身');
  console.log('      • 适合：电商主图、详情页\n');
  console.log('   2️⃣  场景图');
  console.log('      • 真实场景环境');
  console.log('      • 生活方式展示');
  console.log('      • 适合：氛围营销、软文\n');
  
  const typeChoice = await question('请输入数字选择 (1 或 2): ');
  
  let imageType, sceneDescription = '';
  
  if (typeChoice.trim() === '1') {
    imageType = 'closeup';
    console.log('\n✅ 已选择：产品特写图（纯背景）\n');
  } else if (typeChoice.trim() === '2') {
    imageType = 'scene';
    console.log('\n✅ 已选择：场景图\n');
    
    // 获取场景描述
    console.log('📝 请输入场景描述：');
    console.log('   提示：描述产品应该放置的环境和氛围');
    console.log('   示例：');
    console.log('   • "木质咖啡桌上，旁边有一杯拿铁咖啡和一本打开的书"');
    console.log('   • "现代办公桌面，MacBook旁边，极简北欧风格"');
    console.log('   • "温馨卧室床头柜上，柔和的晨光透过纱帘"\n');
    
    sceneDescription = await question('场景描述: ');
    
    if (!sceneDescription.trim()) {
      console.error('❌ 错误：场景描述不能为空');
      rl.close();
      process.exit(1);
    }
    
    console.log(`\n✅ 场景描述：${sceneDescription}\n`);
  } else {
    console.error('❌ 错误：无效的选择，请输入 1 或 2');
    rl.close();
    process.exit(1);
  }
  
  // 确认开始
  console.log('='.repeat(80));
  console.log('🚀 准备开始生成...');
  console.log(`   类型: ${imageType === 'closeup' ? '产品特写图' : '场景图'}`);
  if (imageType === 'scene') {
    console.log(`   场景: ${sceneDescription}`);
  }
  console.log(`   数量: 5张`);
  console.log('='.repeat(80));
  
  const confirm = await question('\n按 Enter 键开始，或输入 n 取消: ');
  
  if (confirm.toLowerCase() === 'n') {
    console.log('\n❌ 已取消生成');
    rl.close();
    process.exit(0);
  }
  
  return {
    inputImagePath,
    imageType,
    sceneDescription
  };
}

/**
 * 主函数 - 执行完整pipeline
 */
async function runPipeline() {
  try {
    // 显示欢迎界面并获取用户输入
    const { inputImagePath, imageType, sceneDescription } = await showWelcomeAndGetOptions();
    
    // 关闭readline接口
    rl.close();
    
    console.log('\n🔄 Pipeline流程:');
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
    
    // 创建输出目录
    createOutputDirs();
    
    // 准备图片的data URI
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
    rl.close();
    process.exit(1);
  }
}

// 运行pipeline
runPipeline();
