/** Cursor 风格 Task Queue — 演示用 */

export type QueueItemStatus = 'running' | 'queued' | 'done';

export interface TaskQueueItem {
  id: string;
  /** 用户排队的 prompt / 指令 */
  prompt: string;
  status: QueueItemStatus;
  /** 简短上下文，如当前页、选中元素 */
  context?: string;
  createdAt: number;
}

export const QUEUE_STATUS_LABEL: Record<QueueItemStatus, string> = {
  running: 'Running',
  queued: 'Queued',
  done: 'Done',
};

/** Mock：当前有一条执行中 + 若干排队中 */
export function createMockTaskQueue(now = Date.now()): TaskQueueItem[] {
  return [
    {
      id: 'queue-running-1',
      prompt: '把第 2 页标题改得更专业，减少营销感',
      status: 'running',
      context: 'PPT · 第 2 页',
      createdAt: now - 95 * 1000,
    },
    {
      id: 'queue-item-2',
      prompt: '补充安全性提示，语气保持专业克制',
      status: 'queued',
      context: '图文正文',
      createdAt: now - 40 * 1000,
    },
    {
      id: 'queue-item-3',
      prompt: '封面副标题改为「循证视角下的全程管理」',
      status: 'queued',
      context: 'PPT · 第 1 页',
      createdAt: now - 25 * 1000,
    },
    {
      id: 'queue-item-4',
      prompt: '主视觉背景调得更清爽，保留品牌色块',
      status: 'queued',
      context: '图片 / 主视觉',
      createdAt: now - 12 * 1000,
    },
  ];
}
