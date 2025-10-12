import { NextRequest, NextResponse } from 'next/server';
import { analyzeProduct, generatePrompt, generateImages } from '@/lib/doubaoAI';
import { STYLE_OPTIONS, GENERATION_CONFIG, FILE_CONFIG } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    console.log('=== API /api/generate 接收到请求 ===');
    
    // 解析表单数据
    const formData = await request.formData();
    const productImage = formData.get('productImage') as File;
    const style = formData.get('style') as string;
    const quantity = parseInt(formData.get('quantity') as string);
    const sceneDescription = formData.get('sceneDescription') as string;
    
    console.log('📦 接收到的数据:');
    console.log('  - productImage:', productImage?.name, productImage?.type, productImage?.size);
    console.log('  - style:', style);
    console.log('  - quantity:', quantity);
    console.log('  - sceneDescription:', sceneDescription || '(无)');

    // 验证输入
    if (!productImage) {
      return NextResponse.json(
        { success: false, error: '请上传产品图片' },
        { status: 400 }
      );
    }

    if (!style) {
      return NextResponse.json(
        { success: false, error: '请选择生成风格' },
        { status: 400 }
      );
    }

    // 验证文件类型和大小
    if (!FILE_CONFIG.ALLOWED_TYPES.includes(productImage.type as "image/jpeg" | "image/png" | "image/webp")) {
      return NextResponse.json(
        { success: false, error: '不支持的文件类型' },
        { status: 400 }
      );
    }

    if (productImage.size > FILE_CONFIG.MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: '文件大小超过限制' },
        { status: 400 }
      );
    }

    // 验证数量
    if (!quantity || quantity < GENERATION_CONFIG.MIN_IMAGES || quantity > GENERATION_CONFIG.MAX_IMAGES) {
      return NextResponse.json(
        { success: false, error: '生成数量无效' },
        { status: 400 }
      );
    }

    // 查找风格配置
    const selectedStyle = STYLE_OPTIONS.find(s => s.id === style);
    console.log('🎨 选择的风格:', selectedStyle);
    
    if (!selectedStyle) {
      console.log('❌ 无效的风格选择');
      return NextResponse.json(
        { success: false, error: '无效的风格选择' },
        { status: 400 }
      );
    }

    // 如果选择了场景图风格，验证场景描述是否存在
    console.log('🔍 检查场景描述要求:');
    console.log('  - requiresScene:', selectedStyle.requiresScene);
    console.log('  - sceneDescription:', sceneDescription);
    
    if (selectedStyle.requiresScene && !sceneDescription) {
      console.log('❌ 需要场景描述但未提供');
      return NextResponse.json(
        { success: false, error: '请填写场景描述' },
        { status: 400 }
      );
    }
    
    console.log('✅ 场景描述验证通过');

    // 将图片转换为buffer
    const arrayBuffer = await productImage.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 步骤1：分析产品
    console.log('开始分析产品...');
    const analysis = await analyzeProduct(buffer, productImage.type as "image/jpeg" | "image/png" | "image/webp");
    console.log('产品分析完成:', analysis);

    // 步骤2：生成提示词
    console.log('开始生成提示词...');
    const prompt = await generatePrompt(analysis, selectedStyle.prompt, sceneDescription);
    console.log('提示词生成完成:', prompt);

    // 步骤3：生成图片（使用原图作为参考）
    console.log('开始生成图片...');
    // 判断图片类型
    const imageType = selectedStyle.requiresScene ? 'scene' : 'closeup';
    const images = await generateImages(
      prompt, 
      quantity, 
      analysis, 
      buffer, 
      productImage.type,
      imageType
    );
    console.log(`图片生成完成，共生成 ${images.length} 张`);

    // 返回成功响应
    return NextResponse.json({
      success: true,
      images,
      analysis,
      prompt,
      requestId: `req_${Date.now()}`
    });

  } catch (error) {
    console.error('API Error:', error);
    
    // 返回错误响应
    const errorMessage = error instanceof Error ? error.message : '生成失败，请稍后重试';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// 处理OPTIONS请求（CORS预检）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}