import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/storage';

// 支持的文件类型
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
];

// 最大文件大小 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // 解析表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';
    const preserveOriginalName = formData.get('preserveOriginalName') === 'true';

    // 验证文件
    if (!file) {
      return NextResponse.json(
        { error: '没有找到文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { 
          error: '不支持的文件类型',
          allowedTypes: ALLOWED_TYPES 
        },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: '文件太大',
          maxSize: MAX_FILE_SIZE,
          actualSize: file.size
        },
        { status: 400 }
      );
    }

    // 转换为Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传文件
    const fileInfo = await storageService.upload(buffer, {
      folder,
      filename: file.name,
      preserveOriginalName
    });

    return NextResponse.json({
      success: true,
      data: {
        ...fileInfo,
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('文件上传失败:', error);
    
    return NextResponse.json(
      { 
        error: '文件上传失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 支持OPTIONS请求（CORS预检）
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