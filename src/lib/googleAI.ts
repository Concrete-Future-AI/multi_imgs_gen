import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import { PHOTOGRAPHY_ANGLES, PHOTOGRAPHY_DISTANCES } from "./constants";
import { generateAIImageFileName } from './fileNaming';

// 初始化Google Generative AI客户端
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

/**
 * 保存图片数据到本地文件
 */
async function saveImageToLocal(base64Data: string, fileName: string): Promise<string> {
  try {
    // 确保public/generated目录存在
    const generatedDir = path.join(process.cwd(), 'public', 'generated');
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
    }
    
    // 将base64数据转换为buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // 保存文件
    const filePath = path.join(generatedDir, fileName);
    fs.writeFileSync(filePath, imageBuffer);
    
    // 返回相对于public目录的URL路径
    return `/generated/${fileName}`;
  } catch (error) {
    console.error('保存图片失败:', error);
    throw new Error('保存图片失败');
  }
}

/**
 * 分析产品图片并生成描述
 */
export async function analyzeProduct(imageBuffer: Buffer, mimeType: string): Promise<string> {
  try {
    const base64Image = imageBuffer.toString('base64');
    
    const contents = [
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image,
        },
      },
      { text: `作为专业的产品摄影师和电商视觉专家，请对这个产品图片进行全面深入的分析。请按照以下结构提供详细信息：

                ## 产品基本信息
                - 产品类别：明确产品所属的具体分类
                - 产品名称：推测或描述产品的名称/类型
                - 主要功能：产品的核心用途和功能特点

                ## 视觉特征分析
                ### 形状与尺寸
                - 整体形状：几何形状、轮廓特征
                - 比例关系：长宽高的大致比例
                - 尺寸感知：相对大小判断

                ### 材质与质感
                - 主要材质：金属、塑料、布料、玻璃、木材等
                - 表面处理：光滑、粗糙、磨砂、抛光等
                - 质感特征：反光度、透明度、纹理等

                ### 色彩分析
                - 主色调：主要颜色及其色调
                - 辅助色彩：次要颜色和点缀色
                - 色彩饱和度：鲜艳程度和色彩深浅
                - 色彩搭配：颜色组合的和谐性

                ## 设计风格特征
                - 设计风格：现代、经典、简约、复古等
                - 美学特点：优雅、运动、科技感、自然等
                - 目标用户：推测的用户群体特征

                ## 摄影建议
                ### 最佳拍摄角度
                - 推荐的主要拍摄角度
                - 能突出产品特色的视角

                ### 适合的背景类型
                - 建议的背景颜色或材质
                - 与产品搭配的环境类型

                ### 光照要求
                - 适合的光照类型和强度
                - 能突出产品质感的光线方向

                请用专业但易懂的语言描述，为后续的AI图片生成提供精确的参考信息。` },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: contents,
    });

    return response.text || "无法分析产品图片";
  } catch (error) {
    console.error('Product analysis error:', error);
    throw new Error('产品分析失败');
  }
}

/**
 * 根据产品分析和风格生成提示词
 */
export async function generatePrompt(
  productAnalysis: string,
  style: string,
  sceneDescription?: string
): Promise<string> {
  try {
    const promptText = `
        你是一位专业的电商摄影指导师和AI图片生成专家。基于以下产品分析信息，生成一个高质量的英文提示词用于AI图片生成。

        ## 产品分析信息：
        ${productAnalysis}

        ## 风格要求：
        ${style}

        ${sceneDescription ? `## 场景要求：
        产品需要放置在以下场景中：${sceneDescription}
        请确保场景描述自然融入提示词，创造真实、自然的环境氛围，让产品与场景完美融合。` : ''}

        ## 生成要求：
        请创建一个详细、专业的英文提示词，必须包含以下元素：

        ### 1. 产品核心特征 (Product Features)
        - 准确描述产品的材质、颜色、形状、尺寸等关键特征
        - 突出产品的独特卖点和功能特性

        ### 2. 摄影技术规格 (Photography Specifications)
        - 相机角度：front view, 3/4 angle, top-down, close-up等
        - 光照设置：studio lighting, soft box lighting, natural light, rim lighting等
        - 景深控制：shallow depth of field, sharp focus, bokeh background等

        ### 3. 构图和布局 (Composition)
        - 产品在画面中的位置和比例
        - 背景选择和处理方式
        - 视觉平衡和美学原则

        ### 4. 风格化处理 (Style Enhancement)
        - 根据指定风格调整色调、质感、氛围
        - 添加适当的装饰元素或环境道具
        - 确保风格与产品定位一致

        ### 5. 电商标准 (E-commerce Standards)
        - 高分辨率：4K, ultra-detailed, sharp focus
        - 专业品质：commercial photography, product photography
        - 适合展示：clean composition, marketing ready

        ## 输出格式：
        只返回最终的英文提示词，不要包含任何解释、标题或其他文字。提示词应该是一个连贯的句子，用逗号分隔各个描述元素。
        ## 顶层要求:
        务必保证主体一致性，这是最重要的，如果产品是手链，则10个珠子的手链生成的图片也要是10个珠子，这是最关键的！！！！！！！！！
        示例格式：[product description], [photography technique], [lighting setup], [composition], [style elements], [quality specifications]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: promptText,
    });

    return response.text || "无法生成提示词";
  } catch (error) {
    console.error('Prompt generation error:', error);
    throw new Error('提示词生成失败');
  }
}

/**
 * 智能选择拍摄角度组合
 * 根据图片数量和产品类型选择最佳的拍摄角度组合
 */
function selectPhotographyAngles(quantity: number): Array<{angle: typeof PHOTOGRAPHY_ANGLES[number], distance: typeof PHOTOGRAPHY_DISTANCES[number]}> {
  // 根据优先级排序的角度
  const sortedAngles = [...PHOTOGRAPHY_ANGLES].sort((a, b) => a.priority - b.priority);
  
  // 根据产品分析智能调整角度选择
  const selectedAngles = sortedAngles.slice(0, Math.min(quantity, sortedAngles.length));
  
  // 如果数量超过可用角度，重复使用高优先级角度但搭配不同距离
  if (quantity > sortedAngles.length) {
    const additionalCount = quantity - sortedAngles.length;
    for (let i = 0; i < additionalCount; i++) {
      selectedAngles.push(sortedAngles[i % sortedAngles.length]);
    }
  }
  
  // 为每个角度分配合适的拍摄距离
  const result = selectedAngles.map((angle, index) => {
    let distance;
    
    // 根据角度类型智能选择距离
    switch (angle.id) {
      case 'close-up-detail':
        distance = PHOTOGRAPHY_DISTANCES.find(d => d.id === 'extreme-close-up') || PHOTOGRAPHY_DISTANCES[0];
        break;
      case 'front-view':
      case 'three-quarter':
        distance = PHOTOGRAPHY_DISTANCES.find(d => d.id === 'close-up') || PHOTOGRAPHY_DISTANCES[1];
        break;
      case 'top-down':
      case 'side-profile':
        distance = PHOTOGRAPHY_DISTANCES.find(d => d.id === 'medium-shot') || PHOTOGRAPHY_DISTANCES[2];
        break;
      default:
        // 为其他角度循环分配距离
        distance = PHOTOGRAPHY_DISTANCES[index % PHOTOGRAPHY_DISTANCES.length];
    }
    
    return { angle, distance };
  });
  
  return result;
}

/**
 * 生成产品图片
 * 使用 Gemini 2.5 Flash Image 模型进行图片生成
 */
export async function generateImages(
  prompt: string,
  quantity: number,
  productAnalysis?: string,
  imageBuffer?: Buffer,
  mimeType?: string
): Promise<string[]> {
  try {
    console.log('生成图片提示词:', prompt);
    console.log('生成数量:', quantity);
    
    const images: string[] = [];
    
    // 智能选择拍摄角度组合
    const angleDistanceCombinations = selectPhotographyAngles(quantity);
    
    // 为每张图片生成不同角度的提示词
    for (let i = 0; i < quantity; i++) {
      const combination = angleDistanceCombinations[i];
      const anglePrompt = combination.angle.prompt;
      const distancePrompt = combination.distance.prompt;
      
      // 构建包含角度和距离信息的完整提示词
      // 根据基础prompt和角度/距离组合，创建变化丰富的图片
      let variantPrompt;
      if (imageBuffer && mimeType) {
        // 图像引导生成：基于原图进行多角度变换
        // 确保产品主体一致性，同时应用不同的拍摄角度和距离
        variantPrompt = `Using the provided product image as the exact reference, replicate the SAME product maintaining ALL its specific features (exact colors, materials, design details, dimensions, patterns). Create a professional e-commerce photograph with these specifications: ${anglePrompt}, ${distancePrompt}. ${prompt}. CRITICAL: The product must remain identical - same number of components, same design, same characteristics. Only the camera angle, distance, and scene should vary. Ensure product consistency, high quality, detailed, and professional commercial photography.`;
      } else {
        // 纯文本生成：原有逻辑
        variantPrompt = `${prompt}, ${anglePrompt}, ${distancePrompt}, professional e-commerce photography, maintaining product consistency, high quality, detailed`;
      }
      
      console.log(`图片 ${i + 1}/${quantity} - 角度: ${combination.angle.name}, 距离: ${combination.distance.name}`);
      console.log(`提示词前缀: ${variantPrompt.substring(0, 150)}...`);
      
      try {
        // 构建contents数组，支持图像+文本输入
        const contents = [];
        
        // 如果提供了原图，添加到contents中
        if (imageBuffer && mimeType) {
          const base64Image = imageBuffer.toString('base64');
          contents.push({
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          });
        }
        
        // 添加文本提示词
        contents.push({ text: variantPrompt });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: contents,
          config: {
            responseModalities: ['IMAGE'],
            imageConfig: {
              aspectRatio: '1:1', // 正方形适合电商展示
            }
          }
        });

        // 处理响应中的图片数据
        if (response.candidates && response.candidates[0] && response.candidates[0].content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.mimeType?.startsWith('image/') && part.inlineData.data) {
              // 保存图片到本地
              const imageData = part.inlineData.data;
              const styleInfo = `${combination.angle.name}_${combination.distance.name}`;
              const fileName = generateAIImageFileName('google', undefined, i, styleInfo);
              const filePath = await saveImageToLocal(imageData, fileName);
              images.push(filePath);
              break; // 只取第一张图片
            }
          }
        }
        
        // 添加延迟避免API限流
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`图片生成失败 (prompt: ${variantPrompt.substring(0, 50)}...):`, error);
        // 如果单张图片生成失败，继续生成其他图片
        continue;
      }
    }
    
    if (images.length === 0) {
      throw new Error('所有图片生成都失败了');
    }
    
    console.log(`成功生成 ${images.length} 张图片`);
    return images;
  } catch (error) {
    console.error('Image generation error:', error);
    throw new Error('图片生成失败');
  }
}

/**
 * 生成文本内容
 */
export async function generateText(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt,
    });
    
    return response.text || "无法生成文本";
  } catch (error) {
    console.error('Text generation error:', error);
    throw new Error('文本生成失败');
  }
}