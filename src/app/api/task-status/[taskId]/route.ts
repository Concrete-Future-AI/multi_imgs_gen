import { NextRequest, NextResponse } from 'next/server';
import { getTask } from '@/lib/taskStorage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    
    console.log('🔍 查询任务状态，ID:', taskId);
    
    // 从内存中获取任务
    const task = getTask(taskId);
    
    if (!task) {
      console.log('❌ 任务不存在:', taskId);
      return NextResponse.json(
        { error: '任务不存在或已过期' },
        { status: 404 }
      );
    }
    
    console.log('✅ 返回任务状态:', {
      id: task.id,
      status: task.status,
      progress: task.progress,
      imagesCount: task.images.length
    });
    
    return NextResponse.json(task);
    
  } catch (error) {
    console.error('❌ 查询任务状态失败:', error);
    return NextResponse.json(
      { error: '查询失败' },
      { status: 500 }
    );
  }
}