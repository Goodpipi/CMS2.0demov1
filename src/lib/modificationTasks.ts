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

/** 演示用 Mock：各类产出物修改 prompt 任务 */
export function createMockModificationTasks(now = Date.now()): ModificationTask[] {
  return [
    {
      id: 'mod-task-1',
      prompt: '把第 2 页标题改得更专业，减少营销感，突出早期筛查价值',
      status: 'completed',
      targetTab: 'ppt-design',
      pageIndex: 1,
      targetLabel: 'PPT 设计 · 第 2 页',
      resultSummary: '已更新标题与要点层级，并保持拜耳蓝绿视觉规范。',
      createdAt: now - 2 * DAY - 3 * 60 * 60 * 1000,
      updatedAt: now - 2 * DAY - 2.5 * 60 * 60 * 1000,
    },
    {
      id: 'mod-task-2',
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
      id: 'mod-task-3',
      prompt: '把主视觉背景调得更清爽，减少装饰元素，保留品牌色块',
      status: 'completed',
      targetTab: 'visual',
      pageIndex: null,
      targetLabel: '图片 / 主视觉',
      resultSummary: '已生成更简洁的主视觉版本，可在预览中对比。',
      createdAt: now - DAY - 5 * 60 * 60 * 1000,
      updatedAt: now - DAY - 4 * 60 * 60 * 1000,
    },
    {
      id: 'mod-task-4',
      prompt: '图文正文第二段补充安全性提示，语气保持专业克制',
      status: 'cancelled',
      targetTab: 'rich-text',
      pageIndex: null,
      targetLabel: '图文内容',
      resultSummary: '任务已取消，未写入正文。',
      createdAt: now - 6 * 60 * 60 * 1000,
      updatedAt: now - 5.5 * 60 * 60 * 1000,
    },
    {
      id: 'mod-task-5',
      prompt: '大纲第三章增加「随访与患者教育」页面要点，控制在 3 条以内',
      status: 'completed',
      targetTab: 'ppt-outline',
      pageIndex: null,
      targetLabel: 'PPT 大纲 · 第三章',
      resultSummary: '已在大纲中追加随访教育页，并同步 speaker notes。',
      createdAt: now - 3 * DAY,
      updatedAt: now - 3 * DAY + 40 * 60 * 1000,
    },
    {
      id: 'mod-task-6',
      prompt: '把文案方案 B 的开头改成问题引入，避免疗效承诺表述',
      status: 'running',
      targetTab: 'copy',
      pageIndex: null,
      targetLabel: '文案方案',
      resultSummary: '正在按合规口径重写文案开头…',
      createdAt: now - 40 * 60 * 1000,
      updatedAt: now - 35 * 60 * 1000,
    },
    {
      id: 'mod-task-7',
      prompt: '视频成片片头降低节奏，字幕改为浅色描边以提高可读性',
      status: 'cancelled',
      targetTab: 'video-render',
      pageIndex: null,
      targetLabel: '视频成片',
      resultSummary: '任务已取消。',
      createdAt: now - 4 * DAY,
      updatedAt: now - 4 * DAY + 20 * 60 * 1000,
    },
    {
      id: 'mod-task-8',
      prompt: '第 4 页数据图表改成更清晰的对比条形，并标注数据来源',
      status: 'completed',
      targetTab: 'ppt-design',
      pageIndex: 3,
      targetLabel: 'PPT 设计 · 第 4 页',
      resultSummary: '已替换为对比条形图，页脚补充数据来源说明。',
      createdAt: now - DAY - 2 * 60 * 60 * 1000,
      updatedAt: now - DAY - 90 * 60 * 1000,
    },
  ];
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
