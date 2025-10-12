/**
 * 图片主体识别模块
 * 
 * 功能：使用豆包视觉理解模型分析图片内容
 * 模型：doubao-seed-1-6-250615
 * 
 * 输入：本地图片文件
 * 输出：图片主体描述
 */

import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.env.local') });

const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY;
const DOUBAO_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';

/**
 * 分析图片内容，识别主体
 * 
 * @param {string} imagePath - 本地图片路径
 * @returns {Promise<string>} 图片主体描述
 */
export async function analyzeImage(imagePath) {
  console.log('\n🔍 步骤1: 分析图片主体');
  console.log('='.repeat(80));
  
  // 验证文件存在
  if (!fs.existsSync(imagePath)) {
    throw new Error(`图片文件不存在: ${imagePath}`);
  }
  
  const filename = path.basename(imagePath);
  const stats = fs.statSync(imagePath);
  console.log(`📸 图片文件: ${filename}`);
  console.log(`📏 文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
  
  // 读取图片并转为base64
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = 'image/jpeg'; // 根据实际文件类型调整
  
  console.log(`📦 Base64长度: ${base64Image.length} 字符`);
  console.log('');
  
  // 构建data URI
  const dataUri = `data:${mimeType};base64,${base64Image}`;
  
  // 构建请求体
  const requestBody = {
    model: 'doubao-seed-1-6-250615', // 豆包视觉理解模型
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: dataUri
            }
          },
          {
            type: 'text',
            text: `请详细分析这张图片中的产品主体，包括：
1. 产品类别和名称
2. 产品的主要特征（颜色、材质、形状、尺寸）
3. 产品的设计细节和工艺
4. 产品的数量和组成（如果是多件或组合）
5. 产品的独特卖点

请用专业、准确的语言描述，为后续的电商产品图片生成提供参考。`
          }
        ]
      }
    ],
    max_tokens: 500 // 增加token限制以获取更详细的描述
  };
  
  console.log('📤 调用豆包视觉理解API...');
  console.log(`🤖 模型: ${requestBody.model}`);
  
  try {
    const response = await axios.post(
      `${DOUBAO_BASE_URL}/chat/completions`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DOUBAO_API_KEY}`
        },
        timeout: 60000 // 60秒超时
      }
    );
    
    // 提取分析结果
    const analysis = response.data.choices[0].message.content;
    
    console.log('✅ 图片分析完成');
    console.log('');
    console.log('📋 分析结果:');
    console.log('-'.repeat(80));
    console.log(analysis);
    console.log('-'.repeat(80));
    console.log('');
    
    // 显示token使用情况
    if (response.data.usage) {
      console.log('💰 Token使用:');
      console.log(`   输入: ${response.data.usage.prompt_tokens}`);
      console.log(`   输出: ${response.data.usage.completion_tokens}`);
      console.log(`   总计: ${response.data.usage.total_tokens}`);
    }
    
    console.log('='.repeat(80));
    
    return analysis;
    
  } catch (error) {
    console.error('\n❌ 图片分析失败');
    
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

// 命令行直接调用
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const imagePath = process.argv[2] || path.join(__dirname, 'stone_img.jpg');
  
  analyzeImage(imagePath)
    .then(result => {
      console.log('\n✅ 分析完成');
    })
    .catch(error => {
      console.error('\n❌ 分析失败:', error.message);
      process.exit(1);
    });
}
