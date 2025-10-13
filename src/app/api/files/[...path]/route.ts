import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/storage';

interface RouteContext {
  params: Promise<{
    path: string[];
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Next.js 15: params is now a Promise
    const { path: pathArray } = await context.params;
    
    // 构建文件路径
    const filePath = pathArray.join('/');
    
    if (!filePath) {
      return NextResponse.json(
        { error: '文件路径不能为空' },
        { status: 400 }
      );
    }

    // 检查文件是否存在
    const exists = await storageService.exists(filePath);
    if (!exists) {
      return NextResponse.json(
        { error: '文件不存在' },
        { status: 404 }
      );
    }

    // 下载文件
    const buffer = await storageService.download(filePath);
    
    // 获取文件扩展名来确定MIME类型
    const extension = filePath.split('.').pop()?.toLowerCase();
    const mimeType = getMimeType(extension);
    
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const download = searchParams.get('download') === 'true';
    const filename = searchParams.get('filename') || filePath.split('/').pop() || 'download';

    // 设置响应头
    const headers = new Headers({
      'Content-Type': mimeType,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=31536000, immutable', // 缓存1年
    });

    // 如果是下载模式，设置下载头
    // 对中文文件名进行URL编码，遵循RFC 5987标准
    const encodedFilename = encodeURIComponent(filename);
    if (download) {
      headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    } else {
      headers.set('Content-Disposition', `inline; filename*=UTF-8''${encodedFilename}`);
    }

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('文件下载失败:', error);
    
    return NextResponse.json(
      { 
        error: '文件下载失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 获取MIME类型
function getMimeType(extension?: string): string {
  const mimeTypes: Record<string, string> = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'json': 'application/json',
    'xml': 'application/xml',
    'zip': 'application/zip',
  };
  
  return mimeTypes[extension || ''] || 'application/octet-stream';
}

// 支持HEAD请求（用于检查文件是否存在）
export async function HEAD(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Next.js 15: params is now a Promise
    const { path: pathArray } = await context.params;
    const filePath = pathArray.join('/');
    
    if (!filePath) {
      return new NextResponse(null, { status: 400 });
    }

    const exists = await storageService.exists(filePath);
    if (!exists) {
      return new NextResponse(null, { status: 404 });
    }

    // 获取文件信息（如果存储服务支持）
    try {
      const buffer = await storageService.download(filePath);
      const extension = filePath.split('.').pop()?.toLowerCase();
      const mimeType = getMimeType(extension);
      
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch {
      return new NextResponse(null, { status: 200 });
    }

  } catch (error) {
    console.error('HEAD请求失败:', error);
    return new NextResponse(null, { status: 500 });
  }
}

// 支持OPTIONS请求（CORS预检）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}