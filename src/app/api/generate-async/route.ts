import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { analyzeProduct } from '@/lib/doubaoAI';
import { generatePrompt } from '@/lib/doubaoAI';
import { generateImages } from '@/lib/doubaoAI';
import { GenerationTask } from '@/hooks/useImageGenerationPolling';
import { setTask, updateTask } from '@/lib/taskStorage';

export async function POST(request: NextRequest) {
  try {
    console.log('=== API /api/generate-async 接收到请求 ===');
    
    const formData = await request.formData();
    const productImage = formData.get('productImage') as File;
    const style = formData.get('style') as string;
    const quantity = parseInt(formData.get('quantity') as string);
    const sceneDescription = formData.get('sceneDescription') as string;

    // 验证输入
    if (!productImage || !style || !quantity) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 创建任务ID
    const taskId = uuidv4();
    console.log('📝 创建新任务，ID:', taskId);

    // 创建初始任务
    const task: GenerationTask = {
      id: taskId,
      status: 'pending',
      progress: 0,
      message: '任务已创建，准备开始处理...',
      images: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // 存储任务
    setTask(taskId, task);

    // 立即返回任务ID
    const response = NextResponse.json({
      success: true,
      taskId: taskId,
      message: '任务已创建，正在后台处理'
    });

    // 异步处理生成任务
    processGenerationTask(taskId, productImage, style, quantity, sceneDescription)
      .catch(error => {
        console.error('❌ 后台任务处理失败:', error);
        // 更新任务状态为失败
        updateTask(taskId, {
          status: 'failed',
          error: error.message || '生成失败'
        });
      });

    return response;

  } catch (error) {
    console.error('❌ API错误:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '服务器内部错误' 
      },
      { status: 500 }
    );
  }
}

// 后台处理生成任务
async function processGenerationTask(
  taskId: string,
  productImage: File,
  style: string,
  quantity: number,
  sceneDescription?: string
) {
  console.log('🔄 开始后台处理任务:', taskId);
  
  try {
    // 更新任务状态：开始处理
    updateTask(taskId, {
      status: 'processing',
      progress: 10,
      message: '正在分析产品图片...'
    });

    // 转换图片为Buffer
    const imageBuffer = Buffer.from(await productImage.arrayBuffer());
    const mimeType = productImage.type;

    console.log('📊 开始分析产品...');
    
    // 步骤1: 分析产品
    updateTask(taskId, {
      progress: 20,
      message: '正在深度分析产品特征...'
    });
    
    const productAnalysis = await analyzeProduct(imageBuffer, mimeType);
    console.log('✅ 产品分析完成');

    // 步骤2: 生成提示词
    updateTask(taskId, {
      progress: 40,
      message: '正在生成专业摄影方案...'
    });
    
    const imageType = style === 'product-scene' ? 'scene' : 'closeup';
    const prompt = await generatePrompt(
      productAnalysis,
      imageType,
      sceneDescription
    );
    console.log('✅ 提示词生成完成');

    // 步骤3: 生成图片
    updateTask(taskId, {
      progress: 60,
      message: `正在生成 ${quantity} 张专业产品图...`
    });
    
    const generatedImages = await generateImages(
      prompt,
      quantity,
      productAnalysis,
      imageBuffer,
      mimeType,
      imageType,
      sceneDescription
    );

    console.log('✅ 图片生成完成，数量:', generatedImages.length);

    // 任务完成
    updateTask(taskId, {
      status: 'completed',
      progress: 100,
      message: `生成完成！共生成 ${generatedImages.length} 张图片`,
      images: generatedImages
    });

    console.log('🎉 任务完成:', taskId);

  } catch (error) {
    console.error('❌ 任务处理失败:', taskId, error);
    
    updateTask(taskId, {
      status: 'failed',
      error: error instanceof Error ? error.message : '生成失败'
    });
  }
}