/**
 * 豆包AI API集成
 * 
 * 完整Pipeline:
 * 1. 图片识别 (analyzeImage)
 * 2. Prompt生成 (generatePrompt)
 * 3. 图片生成 (generateImages)
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { GENERATION_CONFIG } from './constants';

const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY;
const DOUBAO_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';

if (!DOUBAO_API_KEY) {
  console.error('❌ 警告: 未找到DOUBAO_API_KEY环境变量');
}

/**
 * 步骤1: 分析产品图片
 * 使用豆包视觉模型识别产品主体特征
 */
export async function analyzeProduct(imageBuffer: Buffer, mimeType: string): Promise<string> {
  try {
    console.log('🔍 步骤1: 分析产品图片...');
    
    // 转换为base64
    const base64Image = imageBuffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64Image}`;
    
    const requestBody = {
      model: 'doubao-seed-1-6-250615',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: dataUri }
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
      max_tokens: 500
    };
    
    const response = await axios.post(
      `${DOUBAO_BASE_URL}/chat/completions`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DOUBAO_API_KEY}`
        },
        timeout: GENERATION_CONFIG.ANALYZE_TIMEOUT
      }
    );
    
    const analysis = response.data.choices[0].message.content;
    console.log('✅ 产品分析完成');
    
    return analysis;
  } catch (error: unknown) {
    console.error('产品分析失败:', error);
    let errorMsg = '产品分析失败';
    
    if (error && typeof error === 'object') {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
      if (axiosError.response?.data?.error?.message) {
        errorMsg = axiosError.response.data.error.message;
      } else if (axiosError.message) {
        errorMsg = axiosError.message;
      }
    } else if (error instanceof Error) {
      errorMsg = error.message;
    }
    
    throw new Error(`产品分析失败: ${errorMsg}`);
  }
}

/**
 * 步骤2: 生成提示词
 * 基于产品描述和风格生成专业的电商图片prompt
 */
export async function generatePrompt(
  productAnalysis: string,
  style: string,
  sceneDescription?: string
): Promise<string> {
  try {
    console.log('✍️  步骤2: 生成提示词...');
    
    // 判断是产品特写图还是场景图
    const isSceneImage = !!sceneDescription;
    
    const systemPrompt = `你是一位专业的电商产品摄影指导专家和AI图片生成提示词专家。你的任务是基于产品描述，生成专业的电商产品图片生成prompt。

要求：
1. Prompt必须用中文书写，清晰、专业
2. 严格强调产品主体一致性（颜色、材质、尺寸、设计细节100%相同）
3. 符合电商摄影标准（${isSceneImage ? '真实场景、自然光线' : '纯净背景、专业打光'}、高分辨率）
4. 包含5个不同拍摄视角的具体要求
5. 明确禁止事项（不允许改变产品特征）`;

    const userPrompt = isSceneImage
      ? `请基于以下产品描述，生成一个专业的【场景图】生成prompt：

${productAnalysis}

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
      : `请基于以下产品描述，生成一个专业的【产品特写图】生成prompt：

${productAnalysis}

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

请直接输出完整的prompt，不要有其他解释。`;

    const requestBody = {
      model: 'doubao-seed-1-6-250615',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 800
    };
    
    const response = await axios.post(
      `${DOUBAO_BASE_URL}/chat/completions`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DOUBAO_API_KEY}`
        },
        timeout: GENERATION_CONFIG.PROMPT_TIMEOUT
      }
    );
    
    const prompt = response.data.choices[0].message.content.trim();
    console.log('✅ 提示词生成完成');
    
    return prompt;
  } catch (error: unknown) {
    console.error('提示词生成失败:', error);
    let errorMsg = '提示词生成失败';
    
    if (error && typeof error === 'object') {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
      if (axiosError.response?.data?.error?.message) {
        errorMsg = axiosError.response.data.error.message;
      } else if (axiosError.message) {
        errorMsg = axiosError.message;
      }
    } else if (error instanceof Error) {
      errorMsg = error.message;
    }
    
    throw new Error(`提示词生成失败: ${errorMsg}`);
  }
}

/**
 * 步骤3: 生成图片
 * 使用豆包图片生成模型创建多视角电商图片
 */
export async function generateImages(
  prompt: string,
  quantity: number,
  productAnalysis: string,
  imageBuffer: Buffer,
  mimeType: string,
  imageType: 'closeup' | 'scene' = 'closeup'
): Promise<string[]> {
  try {
    console.log('🎨 步骤3: 生成图片...');
    console.log(`   类型: ${imageType === 'closeup' ? '产品特写图' : '场景图'}`);
    console.log(`   数量: ${quantity}张`);
    
    // 转换图片为data URI
    const base64Image = imageBuffer.toString('base64');
    const imageDataUri = `data:${mimeType};base64,${base64Image}`;
    
    // 定义视角（根据类型）
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
    
    const images: string[] = [];
    
    // 从prompt中提取核心产品信息
    const coreInfo = prompt.split('【产品信息】')[1]?.split('【')[0] || productAnalysis.substring(0, 200);
    
    // 循环生成每个视角的图片
    for (let i = 0; i < Math.min(quantity, viewpoints.length); i++) {
      const viewpoint = viewpoints[i];
      console.log(`   生成 ${i + 1}/${quantity}: ${viewpoint.name}`);
      
      try {
        // 构建视角特定的prompt
        const viewPrompt = `${coreInfo}

【当前视角】：${viewpoint.name}
${viewpoint.description}

【要求】：
- 严格保持产品主体100%一致（颜色、材质、尺寸、特征不变）
- ${viewpoint.background}
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
        
        const response = await axios.post(
          `${DOUBAO_BASE_URL}/images/generations`,
          requestBody,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${DOUBAO_API_KEY}`
            },
            timeout: GENERATION_CONFIG.IMAGE_TIMEOUT
          }
        );
        
        // 下载并保存图片
        if (response.data.data && response.data.data.length > 0) {
          const imageUrl = response.data.data[0].url;
          const fileName = `generated_${Date.now()}_${i}.png`;
          const localPath = await saveImageFromUrl(imageUrl, fileName);
          images.push(localPath);
          console.log(`   ✅ ${viewpoint.name} 生成成功`);
        }
        
        // 添加延迟避免API限流
        if (i < quantity - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`   ❌ ${viewpoint.name} 生成失败:`, error);
        // 继续生成其他图片
        continue;
      }
    }
    
    if (images.length === 0) {
      throw new Error('所有图片生成都失败了');
    }
    
    console.log(`✅ 成功生成 ${images.length} 张图片`);
    return images;
  } catch (error: unknown) {
    console.error('图片生成失败:', error);
    let errorMsg = '图片生成失败';
    
    if (error && typeof error === 'object') {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
      if (axiosError.response?.data?.error?.message) {
        errorMsg = axiosError.response.data.error.message;
      } else if (axiosError.message) {
        errorMsg = axiosError.message;
      }
    } else if (error instanceof Error) {
      errorMsg = error.message;
    }
    
    throw new Error(`图片生成失败: ${errorMsg}`);
  }
}

/**
 * 工具函数：从URL下载图片并保存到本地
 */
async function saveImageFromUrl(imageUrl: string, fileName: string): Promise<string> {
  try {
    // 确保public/generated目录存在
    const generatedDir = path.join(process.cwd(), 'public', 'generated');
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
    }
    
    // 下载图片
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    const imageBuffer = Buffer.from(response.data);
    
    // 保存文件
    const filePath = path.join(generatedDir, fileName);
    fs.writeFileSync(filePath, imageBuffer);
    
    // 返回相对于public目录的URL路径
    return `/generated/${fileName}`;
  } catch (error: unknown) {
    console.error('保存图片失败:', error);
    const errorMsg = (error as Error)?.message || '保存图片失败';
    throw new Error(`保存图片失败: ${errorMsg}`);
  }
}
