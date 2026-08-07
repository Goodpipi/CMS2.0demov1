import type { TabKey } from '@/types/session';

export type ModificationTaskStatus = 'running' | 'completed' | 'cancelled';

export type ModificationTaskFilter = 'all' | ModificationTaskStatus;

/** 用户针对产出物发起的修改任务（演示用） */
export interface ModificationTask {
  id: string;
  /** 用户输入的修改 prompt */
  prompt: string;
  status: ModificationTaskStatus;
  /** 预览区应切换到的产出物 Tab */
  targetTab: TabKey;
  /** PPT 页码（0-based），非 PPT 时为 null */
  pageIndex: number | null;
  /** 列表展示用目标说明 */
  targetLabel: string;
  /** 任务结果摘要 */
  resultSummary?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ModificationTaskPageGroup {
  pageIndex: number;
  pageLabel: string;
  tasks: ModificationTask[];
}

export const MODIFICATION_TASK_STATUS_LABEL: Record<ModificationTaskStatus, string> = {
  running: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

export const MODIFICATION_TASK_FILTERS: { key: ModificationTaskFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'running', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
];

const DAY = 24 * 60 * 60 * 1000;

/** 演示用 Mock：仅当前 PPT 设计版本相关修改任务 */
export function createMockModificationTasks(now = Date.now()): ModificationTask[] {
  return [
    {
      id: 'mod-task-1',
      prompt: '将封面页副标题改为「循证视角下的全程管理」，并加大字号',
      status: 'running',
      targetTab: 'ppt-design',
      pageIndex: 0,
      targetLabel: 'PPT 设计 · 第 1 页',
      resultSummary: 'AI 正在重排封面文案与字号…',
      createdAt: now - 18 * 60 * 1000,
      updatedAt: now - 12 * 60 * 1000,
    },
    {
      id: 'mod-task-2',
      prompt: '封面主标题改为更克制的学术表达，去掉口号感',
      status: 'completed',
      targetTab: 'ppt-design',
      pageIndex: 0,
      targetLabel: 'PPT 设计 · 第 1 页',
      resultSummary: '已更新封面主标题，并保持拜耳蓝绿视觉规范。',
      createdAt: now - 2 * DAY - 4 * 60 * 60 * 1000,
      updatedAt: now - 2 * DAY - 3.5 * 60 * 60 * 1000,
    },
    {
      id: 'mod-task-3',
      prompt: '把第 2 页标题改得更专业，减少营销感，突出早期筛查价值',
      status: 'completed',
      targetTab: 'ppt-design',
      pageIndex: 1,
      targetLabel: 'PPT 设计 · 第 2 页',
      resultSummary: '已更新标题与要点层级。',
      createdAt: now - 2 * DAY - 3 * 60 * 60 * 1000,
      updatedAt: now - 2 * DAY - 2.5 * 60 * 60 * 1000,
    },
    {
      id: 'mod-task-4',
      prompt: '第 2 页补充一条安全性提示脚注，字号略小于正文',
      status: 'cancelled',
      targetTab: 'ppt-design',
      pageIndex: 1,
      targetLabel: 'PPT 设计 · 第 2 页',
      resultSummary: '任务已取消，未写入页脚。',
      createdAt: now - 6 * 60 * 60 * 1000,
      updatedAt: now - 5.5 * 60 * 60 * 1000,
    },
    {
      id: 'mod-task-5',
      prompt: '第 3 页要点控制在 3 条以内，并统一行距',
      status: 'completed',
      targetTab: 'ppt-design',
      pageIndex: 2,
      targetLabel: 'PPT 设计 · 第 3 页',
      resultSummary: '已精简要点并统一行距。',
      createdAt: now - DAY - 5 * 60 * 60 * 1000,
      updatedAt: now - DAY - 4 * 60 * 60 * 1000,
    },
    {
      id: 'mod-task-6',
      prompt: '第 4 页数据图表改成更清晰的对比条形，并标注数据来源',
      status: 'completed',
      targetTab: 'ppt-design',
      pageIndex: 3,
      targetLabel: 'PPT 设计 · 第 4 页',
      resultSummary: '已替换为对比条形图，页脚补充数据来源说明。',
      createdAt: now - DAY - 2 * 60 * 60 * 1000,
      updatedAt: now - DAY - 90 * 60 * 1000,
    },
    {
      id: 'mod-task-7',
      prompt: '第 4 页图注改为「数据来源：内部真实世界研究，仅供讨论」',
      status: 'running',
      targetTab: 'ppt-design',
      pageIndex: 3,
      targetLabel: 'PPT 设计 · 第 4 页',
      resultSummary: 'AI 正在更新图注文案…',
      createdAt: now - 40 * 60 * 1000,
      updatedAt: now - 35 * 60 * 1000,
    },
    {
      id: 'mod-task-8',
      prompt: '第 4 页右侧说明文字缩短为两行，避免与图表重叠',
      status: 'cancelled',
      targetTab: 'ppt-design',
      pageIndex: 3,
      targetLabel: 'PPT 设计 · 第 4 页',
      resultSummary: '任务已取消。',
      createdAt: now - 4 * DAY,
      updatedAt: now - 4 * DAY + 20 * 60 * 1000,
    },
  ];
}

/** 仅保留当前 PPT 设计版本相关任务 */
export function isPptDesignModificationTask(task: ModificationTask): boolean {
  return task.targetTab === 'ppt-design' && task.pageIndex != null;
}

/** 按页码分组（页码升序；组内按更新时间倒序） */
export function groupModificationTasksByPage(
  tasks: ModificationTask[]
): ModificationTaskPageGroup[] {
  const map = new Map<number, ModificationTask[]>();
  for (const task of tasks) {
    if (task.pageIndex == null) continue;
    const list = map.get(task.pageIndex) || [];
    list.push(task);
    map.set(task.pageIndex, list);
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([pageIndex, pageTasks]) => ({
      pageIndex,
      pageLabel: `第 ${pageIndex + 1} 页`,
      tasks: [...pageTasks].sort((a, b) => b.updatedAt - a.updatedAt),
    }));
}

export function formatModificationTaskTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 打开任务详情时，确保中间预览区具备对应 Tab */
export function applyTabForModificationTarget(
  prev: {
    tabs: TabKey[];
    active: TabKey | null;
    insight: boolean;
    topicRecommendation: boolean;
    copy: boolean;
    richText: boolean;
    team: boolean;
    visual: boolean;
    videoScript: boolean;
    videoRender: boolean;
    pptOutline: boolean;
    pptDesign: boolean;
    submit: boolean;
  },
  targetTab: TabKey
) {
  const flagMap: Partial<Record<TabKey, keyof typeof prev>> = {
    insight: 'insight',
    'topic-recommendation': 'topicRecommendation',
    copy: 'copy',
    'rich-text': 'richText',
    team: 'team',
    visual: 'visual',
    'video-script': 'videoScript',
    'video-render': 'videoRender',
    'ppt-outline': 'pptOutline',
    'ppt-design': 'pptDesign',
    submit: 'submit',
  };
  const flag = flagMap[targetTab];
  return {
    ...prev,
    tabs: prev.tabs.includes(targetTab) ? prev.tabs : [...prev.tabs, targetTab],
    active: targetTab,
    ...(flag ? { [flag]: true } : {}),
  };
}
