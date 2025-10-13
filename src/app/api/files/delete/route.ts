import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/storage';

export async function DELETE(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { path: filePath, paths: filePaths } = body;

    // 验证输入
    if (!filePath && !filePaths) {
      return NextResponse.json(
        { error: '必须提供文件路径 (path) 或文件路径数组 (paths)' },
        { status: 400 }
      );
    }

    // 处理单个文件删除
    if (filePath) {
      if (typeof filePath !== 'string') {
        return NextResponse.json(
          { error: '文件路径必须是字符串' },
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

      // 删除文件
      await storageService.delete(filePath);

      return NextResponse.json({
        success: true,
        message: '文件删除成功',
        deletedPath: filePath
      });
    }

    // 处理批量文件删除
    if (filePaths) {
      if (!Array.isArray(filePaths)) {
        return NextResponse.json(
          { error: '文件路径数组必须是数组类型' },
          { status: 400 }
        );
      }

      if (filePaths.length === 0) {
        return NextResponse.json(
          { error: '文件路径数组不能为空' },
          { status: 400 }
        );
      }

      // 限制批量删除数量
      if (filePaths.length > 100) {
        return NextResponse.json(
          { error: '一次最多只能删除100个文件' },
          { status: 400 }
        );
      }

      const results = [];
      const errors = [];

      // 逐个删除文件
      for (const path of filePaths) {
        if (typeof path !== 'string') {
          errors.push({
            path,
            error: '路径必须是字符串'
          });
          continue;
        }

        try {
          const exists = await storageService.exists(path);
          if (!exists) {
            errors.push({
              path,
              error: '文件不存在'
            });
            continue;
          }

          await storageService.delete(path);
          results.push({
            path,
            success: true
          });
        } catch (error) {
          errors.push({
            path,
            error: error instanceof Error ? error.message : '删除失败'
          });
        }
      }

      return NextResponse.json({
        success: errors.length === 0,
        message: `成功删除 ${results.length} 个文件${errors.length > 0 ? `，${errors.length} 个文件删除失败` : ''}`,
        results,
        errors: errors.length > 0 ? errors : undefined
      });
    }

  } catch (error) {
    console.error('文件删除失败:', error);
    
    return NextResponse.json(
      { 
        error: '文件删除失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 支持POST请求（兼容性）
export async function POST(request: NextRequest) {
  return DELETE(request);
}

// 支持OPTIONS请求（CORS预检）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}