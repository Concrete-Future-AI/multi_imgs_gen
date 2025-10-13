import { GenerationTask } from '@/hooks/useImageGenerationPolling';

// 内存中的任务存储 (生产环境应使用Redis或数据库)
// 使用全局变量避免热重载时数据丢失
declare global {
  var __taskStorage: Map<string, GenerationTask> | undefined;
}

// 确保任务存储在热重载时保持持久化
const tasks = globalThis.__taskStorage ?? new Map<string, GenerationTask>();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__taskStorage = tasks;
}

// 清理过期任务 (24小时)
const TASK_EXPIRY = 24 * 60 * 60 * 1000;

// 避免重复设置定时器
if (!globalThis.__taskCleanupInterval) {
  globalThis.__taskCleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [taskId, task] of tasks.entries()) {
      if (now - task.createdAt > TASK_EXPIRY) {
        tasks.delete(taskId);
        console.log('🗑️ 清理过期任务:', taskId);
      }
    }
  }, 60 * 60 * 1000); // 每小时清理一次
}

declare global {
  var __taskCleanupInterval: NodeJS.Timeout | undefined;
}

// 更新任务状态的辅助函数
export function updateTask(taskId: string, updates: Partial<GenerationTask>) {
  const task = tasks.get(taskId);
  if (task) {
    const updatedTask = {
      ...task,
      ...updates,
      updatedAt: Date.now()
    };
    tasks.set(taskId, updatedTask);
    console.log(`📝 任务 ${taskId} 状态更新:`, updates);
  } else {
    console.warn(`⚠️ 尝试更新不存在的任务: ${taskId}`);
  }
}

// 获取任务
export function getTask(taskId: string): GenerationTask | undefined {
  return tasks.get(taskId);
}

// 设置任务
export function setTask(taskId: string, task: GenerationTask): void {
  tasks.set(taskId, task);
}

// 删除任务
export function deleteTask(taskId: string): boolean {
  return tasks.delete(taskId);
}

// 获取所有任务（调试用）
export function getAllTasks(): Map<string, GenerationTask> {
  return tasks;
}

// 获取任务数量
export function getTaskCount(): number {
  return tasks.size;
}

export { tasks };