import { NextRequest, NextResponse } from 'next/server';
import { FILE_CONFIG } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    // 解析表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File;

    // 验证文件是否存在
    if (!file) {
      return NextResponse.json(
        { success: false, error: '请选择要上传的文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!FILE_CONFIG.ALLOWED_TYPES.includes(file.type as "image/jpeg" | "image/png" | "image/webp")) {
      return NextResponse.json(
        { 
          success: false, 
          error: '不支持的文件类型，请上传JPG、PNG或WebP格式的图片' 
        },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > FILE_CONFIG.MAX_SIZE) {
      return NextResponse.json(
        { 
          success: false, 
          error: `文件大小超过限制，最大支持${Math.round(FILE_CONFIG.MAX_SIZE / 1024 / 1024)}MB` 
        },
        { status: 400 }
      );
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 生成文件信息
    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    };

    // 将文件转换为base64（用于预览）
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // 在实际应用中，这里可能需要：
    // 1. 将文件保存到云存储（如AWS S3、阿里云OSS等）
    // 2. 进行图片压缩和优化
    // 3. 生成缩略图
    // 4. 病毒扫描
    // 5. 保存文件记录到数据库

    // 返回成功响应
    return NextResponse.json({
      success: true,
      file: fileInfo,
      preview: dataUrl,
      uploadId: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: '文件上传成功'
    });

  } catch (error) {
    console.error('Upload API Error:', error);
    
    // 返回错误响应
    const errorMessage = error instanceof Error ? error.message : '文件上传失败，请稍后重试';
    
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

// 获取上传配置信息
export async function GET() {
  return NextResponse.json({
    success: true,
    config: {
      maxSize: FILE_CONFIG.MAX_SIZE,
      allowedTypes: FILE_CONFIG.ALLOWED_TYPES,
      allowedExtensions: FILE_CONFIG.ALLOWED_EXTENSIONS,
    }
  });
}