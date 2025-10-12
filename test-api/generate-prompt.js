/**
 * 电商Prompt生成模块
 * 
 * 功能：基于产品描述生成专业的电商图片生成prompt
 * 模型：doubao-seed-1-6-250615 (文本生成)
 * 
 * 输入：产品主体描述
 * 输出：优化的图片生成prompt
 */

import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.env.local') });

const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY;
const DOUBAO_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';

/**
 * 基于产品描述生成电商图片prompt
 * 
 * @param {string} productDescription - 产品主体描述
 * @param {string} imageType - 图片类型：'closeup'(产品特写图) 或 'scene'(场景图)
 * @param {string} sceneDescription - 场景描述（当imageType为'scene'时必填）
 * @returns {Promise<string>} 生成的prompt
 */
export async function generatePrompt(productDescription, imageType = 'closeup', sceneDescription = '') {
  console.log('\n✍️  步骤2: 生成电商图片Prompt');
  console.log('='.repeat(80));
  console.log(`📝 图片类型: ${imageType === 'closeup' ? '产品特写图' : '场景图'}`);
  if (imageType === 'scene' && sceneDescription) {
    console.log(`🎬 场景描述: ${sceneDescription}`);
  }
  console.log('');
  console.log('📝 输入的产品描述:');
  console.log('-'.repeat(80));
  console.log(productDescription);
  console.log('-'.repeat(80));
  console.log('');
  
  // 构建请求体
  const requestBody = {
    model: 'doubao-seed-1-6-250615', // 豆包文本生成模型
    messages: [
      {
        role: 'system',
        content: `你是一位专业的电商产品摄影指导专家和AI图片生成提示词专家。你的任务是基于产品描述，生成专业的电商产品图片生成prompt。

要求：
1. Prompt必须用中文书写，清晰、专业
2. 严格强调产品主体一致性（颜色、材质、尺寸、设计细节100%相同）
3. 符合电商摄影标准（${imageType === 'closeup' ? '纯净背景、专业打光' : '真实场景、自然光线'}、高分辨率）
4. 包含5个不同拍摄视角的具体要求
5. 明确禁止事项（不允许改变产品特征）`
      },
      {
        role: 'user',
        content: imageType === 'closeup' 
          ? `请基于以下产品描述，生成一个专业的【产品特写图】生成prompt：

${productDescription}

生成的prompt应该包含以下结构：

【严格要求：主体一致性】
（强调产品特征100%保持一致）

【产品信息】
（基于上述描述提取的关键信息）

【电商摄影标准 - 产品特写】
- 背景要求：纯白色或浅灰色背景，无任何杂物
- 光线要求：柔和均匀打光，突出产品质感
- 构图要求：产品居中，留白适当
- 分辨率：4K高清

【5个拍摄视角】
1. 正面特写
2. 45度俯视
3. 侧面轮廓
4. 微距细节
5. 整体展示

【禁止事项】
- 禁止添加任何场景元素
- 禁止改变产品特征
- 禁止复杂背景

【风格参考】
天猫、京东等电商平台专业产品特写图风格

请直接输出完整的prompt，不要有其他解释。`
          : `请基于以下产品描述，生成一个专业的【场景图】生成prompt：

${productDescription}

【场景要求】：
产品需要放置在以下场景中：${sceneDescription}

生成的prompt应该包含以下结构：

【严格要求：主体一致性】
（强调产品特征100%保持一致，即使在场景中）

【产品信息】
（基于上述描述提取的关键信息）

【场景摄影标准】
- 场景要求：${sceneDescription}，场景真实自然，不喧宾夺主
- 光线要求：自然光线或模拟自然光，符合场景氛围
- 构图要求：产品为主体，场景为辅助，突出产品
- 分辨率：4K高清
- 场景元素：简洁干净，不遮挡产品主体

【5个拍摄视角】
1. 正面场景视角（产品在场景中正面展示）
2. 45度俯视场景（俯视角度展示产品与场景关系）
3. 侧面场景视角（侧面展示产品在场景中）
4. 微距细节（聚焦产品细节，场景虚化）
5. 整体场景展示（展示完整场景氛围）

【禁止事项】
- 禁止改变产品任何特征
- 禁止场景过于复杂遮挡产品
- 禁止场景元素喧宾夺主

【风格参考】
电商平台生活方式场景图，产品为主，场景衬托

请直接输出完整的prompt，不要有其他解释。`
      }
    ],
    max_tokens: 800 // 足够生成完整prompt
  };
  
  console.log('📤 调用豆包文本生成API...');
  console.log(`🤖 模型: ${requestBody.model}`);
  console.log('');
  
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
    
    // 提取生成的prompt
    const generatedPrompt = response.data.choices[0].message.content.trim();
    
    console.log('✅ Prompt生成完成');
    console.log('');
    console.log('📋 生成的Prompt:');
    console.log('='.repeat(80));
    console.log(generatedPrompt);
    console.log('='.repeat(80));
    console.log('');
    
    // 显示token使用情况
    if (response.data.usage) {
      console.log('💰 Token使用:');
      console.log(`   输入: ${response.data.usage.prompt_tokens}`);
      console.log(`   输出: ${response.data.usage.completion_tokens}`);
      console.log(`   总计: ${response.data.usage.total_tokens}`);
    }
    
    console.log('='.repeat(80));
    
    return generatedPrompt;
    
  } catch (error) {
    console.error('\n❌ Prompt生成失败');
    
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
  const description = process.argv[2] || '虎眼石手串，10颗圆珠，金棕色条纹';
  
  generatePrompt(description)
    .then(result => {
      console.log('\n✅ Prompt生成完成');
    })
    .catch(error => {
      console.error('\n❌ 生成失败:', error.message);
      process.exit(1);
    });
}
