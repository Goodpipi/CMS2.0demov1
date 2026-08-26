import type { PptSlide } from '@/types/content';
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
  /** 该任务对应的页面版本快照（小版本） */
  slideSnapshot?: PptSlide;
  /** 图片产出物版本快照 */
  imageSnapshot?: string;
  /** 图片资产标识，如 kv / poster */
  assetKey?: string;
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

function versionSlide(
  page: number,
  title: string,
  subtitle: string,
  notes: string,
  accent: string
): PptSlide {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540">
    <defs>
      <linearGradient id="vbg${page}${accent.replace('#', '')}" x1="0" x2="1" y1="0" y2="1">
        <stop stop-color="#f7fbff"/>
        <stop offset="1" stop-color="#f3faf5"/>
      </linearGradient>
    </defs>
    <rect width="960" height="540" fill="url(#vbg${page}${accent.replace('#', '')})"/>
    <rect x="0" y="0" width="26" height="540" fill="${accent}"/>
    <circle cx="846" cy="86" r="92" fill="${accent}" opacity=".12"/>
    <text x="72" y="82" font-family="Arial,Microsoft YaHei,sans-serif" font-size="18" font-weight="700" fill="${accent}">BAIDEA · 版本预览</text>
    <text x="72" y="188" font-family="Arial,Microsoft YaHei,sans-serif" font-size="36" font-weight="800" fill="#18334d">${title}</text>
    <text x="72" y="244" font-family="Arial,Microsoft YaHei,sans-serif" font-size="20" fill="#536a80">${subtitle}</text>
    <rect x="72" y="314" width="610" height="2" fill="${accent}" opacity=".35"/>
    <text x="72" y="372" font-family="Arial,Microsoft YaHei,sans-serif" font-size="17" fill="#60758a">• ${notes}</text>
    <text x="892" y="504" text-anchor="end" font-family="Arial,sans-serif" font-size="16" fill="#8aa0b3">0${page}</text>
  </svg>`;
  return {
    page,
    title,
    bullets: [subtitle],
    speakerNotes: notes,
    svg,
  };
}

/** 演示用 Mock：仅当前 PPT 设计版本相关修改任务 */
export function createMockModificationTasks(now = Date.now()): ModificationTask[] {
  return [
    {
      id: 'mod-task-p1-v1',
      prompt: '生成封面初稿：主标题「慢性肾脏病患者全程管理」',
      status: 'completed',
      targetTab: 'ppt-design',
      pageIndex: 0,
      targetLabel: 'PPT 设计 · 第 1 页',
      resultSummary: '已生成封面初稿，建立蓝绿主视觉。',
      slideSnapshot: versionSlide(
        1,
        '慢性肾脏病患者全程管理',
        '医学教育演示文稿',
        '开场介绍主题与议程，先建立全程管理概念。',
        '#94a3b8'
      ),
      createdAt: now - 5 * DAY - 2 * 60 * 60 * 1000,
      updatedAt: now - 5 * DAY - 90 * 60 * 1000,
    },
    {
      id: 'mod-task-p1-v2',
      prompt: '封面主标题改为更克制的学术表达，去掉口号感',
      status: 'completed',
      targetTab: 'ppt-design',
      pageIndex: 0,
      targetLabel: 'PPT 设计 · 第 1 页',
      resultSummary: '已更新封面主标题，并保持拜耳蓝绿视觉规范。',
      slideSnapshot: versionSlide(
        1,
        '慢性肾脏病的全程管理策略',
        '早期识别 · 规范管理 · 持续随访',
        '用更克制的学术标题开场，避免口号化表达。',
        '#3BA6E8'
      ),
      createdAt: now - 4 * DAY - 3 * 60 * 60 * 1000,
      updatedAt: now - 4 * DAY - 2.5 * 60 * 60 * 1000,
    },
    {
      id: 'mod-task-p1-v3',
      prompt: '副标题改为「循证视角下的全程管理」，并略微加大字号',
      status: 'completed',
      targetTab: 'ppt-design',
      pageIndex: 0,
      targetLabel: 'PPT 设计 · 第 1 页',
      resultSummary: '已调整副标题文案与字号层级。',
      slideSnapshot: versionSlide(
        1,
        '慢性肾脏病的全程管理策略',
        '循证视角下的全程管理',
        '强调副标题字号与学术表达，开场先抛出全程管理框架。',
        '#54B9F9'
      ),
      createdAt: now - 3 * DAY - 5 * 60 * 60 * 1000,
      updatedAt: now - 3 * DAY - 4 * 60 * 60 * 1000,
    },
    {
      id: 'mod-task-p1-v4',
      prompt: '封面补充「内科 · 医学教育」场景标签，弱化装饰色块',
      status: 'completed',
      targetTab: 'ppt-design',
      pageIndex: 0,
      targetLabel: 'PPT 设计 · 第 1 页',
      resultSummary: '已加入场景标签，并收敛装饰色块对比度。',
      slideSnapshot: versionSlide(
        1,
        '慢性肾脏病的全程管理策略',
        '内科 · 医学教育 · 循证视角',
        '点明受众与场景，再进入疾病管理主线。',
        '#6FBD1F'
      ),
      createdAt: now - 2 * DAY - 4 * 60 * 60 * 1000,
      updatedAt: now - 2 * DAY - 3 * 60 * 60 * 1000,
    },
    {
      id: 'mod-task-p1-v5',
      prompt: '主标题换行更均衡，页脚补充「仅供医学教育交流」',
      status: 'completed',
      targetTab: 'ppt-design',
      pageIndex: 0,
      targetLabel: 'PPT 设计 · 第 1 页',
      resultSummary: '已优化标题换行，并补充教育用途页脚说明。',
      slideSnapshot: versionSlide(
        1,
        '慢性肾脏病全程管理',
        '循证视角 · 规范路径 · 持续随访',
        '讲解封面时说明资料仅供医学教育交流使用。',
        '#3B7FBF'
      ),
      createdAt: now - DAY - 6 * 60 * 60 * 1000,
      updatedAt: now - DAY - 5 * 60 * 60 * 1000,
    },
    {
      id: 'mod-task-p1-v6',
      prompt: '将封面页副标题改为「循证视角下的全程管理」，并加大字号',
      status: 'running',
      targetTab: 'ppt-design',
      pageIndex: 0,
      targetLabel: 'PPT 设计 · 第 1 页',
      resultSummary: 'AI 正在重排封面文案与字号…',
      slideSnapshot: versionSlide(
        1,
        '慢性肾脏病患者全程管理',
        '循证视角下的全程管理',
        '强调副标题字号与学术表达，开场先抛出全程管理框架。',
        '#54B9F9'
      ),
      createdAt: now - 18 * 60 * 1000,
      updatedAt: now - 12 * 60 * 1000,
    },
    {
      id: 'mod-task-3',
      prompt: '把第 2 页标题改得更专业，减少营销感，突出早期筛查价值',
      status: 'completed',
      targetTab: 'ppt-design',
      pageIndex: 1,
      targetLabel: 'PPT 设计 · 第 2 页',
      resultSummary: '已更新标题与要点层级。',
      slideSnapshot: versionSlide(
        2,
        '早期筛查的临床价值',
        '从风险认知到长期管理',
        '讲解早期筛查如何改变管理路径，避免营销化措辞。',
        '#6FBD1F'
      ),
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
      slideSnapshot: versionSlide(
        2,
        '疾病负担与管理挑战',
        '补充安全性提示脚注（未应用）',
        '本版本已取消，仅作历史对照。',
        '#94a3b8'
      ),
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
      slideSnapshot: versionSlide(
        3,
        '高风险人群识别',
        '三点式结构 · 统一行距',
        '控制在三条要点内，便于口头展开。',
        '#3B7FBF'
      ),
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
      slideSnapshot: versionSlide(
        4,
        '患者全程管理路径',
        '对比条形图 · 标注数据来源',
        '讲解图表时指出数据来源与适用范围。',
        '#8AD329'
      ),
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
      slideSnapshot: versionSlide(
        4,
        '患者全程管理路径',
        '图注修订进行中',
        '图注将改为内部真实世界研究说明，仅供讨论。',
        '#54B9F9'
      ),
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

export function isVisualModificationTask(task: ModificationTask): boolean {
  return task.targetTab === 'visual';
}

/**
 * 回溯到某页的指定任务版本：该快照成为「当前」，
 * 仅保留时间线上更早的任务作为历史小版本，删除目标任务及其后的全部任务。
 * 其他页的任务不受影响。
 */
export function prunePageTasksThrough(
  tasks: ModificationTask[],
  pageIndex: number,
  keepThroughTaskId: string
): { next: ModificationTask[]; removedCount: number } {
  const pageTimeline = [...tasks]
    .filter((item) => item.pageIndex === pageIndex)
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  const targetIndex = pageTimeline.findIndex((item) => item.id === keepThroughTaskId);
  if (targetIndex < 0) {
    return { next: tasks, removedCount: 0 };
  }
  // 目标版本会变成「当前」，因此历史轨道只保留它之前的节点
  const keepIds = new Set(pageTimeline.slice(0, targetIndex).map((item) => item.id));
  const next = tasks.filter((item) => item.pageIndex !== pageIndex || keepIds.has(item.id));
  return { next, removedCount: tasks.length - next.length };
}

/**
 * 回溯到某张图片的指定任务版本：该快照成为「当前」，
 * 仅保留时间线上更早的任务作为历史小版本。
 */
export function pruneAssetTasksThrough(
  tasks: ModificationTask[],
  assetKey: string,
  keepThroughTaskId: string
): { next: ModificationTask[]; removedCount: number } {
  const timeline = [...tasks]
    .filter((item) => item.assetKey === assetKey)
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  const targetIndex = timeline.findIndex((item) => item.id === keepThroughTaskId);
  if (targetIndex < 0) {
    return { next: tasks, removedCount: 0 };
  }
  const keepIds = new Set(timeline.slice(0, targetIndex).map((item) => item.id));
  const next = tasks.filter((item) => item.assetKey !== assetKey || keepIds.has(item.id));
  return { next, removedCount: tasks.length - next.length };
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
    literature: boolean;
    copy: boolean;
    richText: boolean;
    team: boolean;
    visual: boolean;
    videoScript: boolean;
    videoRender: boolean;
    pptOutline: boolean;
    pptDesign: boolean;
    brief: boolean;
    submit: boolean;
  },
  targetTab: TabKey
) {
  const flagMap: Partial<Record<TabKey, keyof typeof prev>> = {
    insight: 'insight',
    'topic-recommendation': 'topicRecommendation',
    literature: 'literature',
    copy: 'copy',
    'rich-text': 'richText',
    team: 'team',
    visual: 'visual',
    'video-script': 'videoScript',
    'video-render': 'videoRender',
    'ppt-outline': 'pptOutline',
    'ppt-design': 'pptDesign',
    brief: 'brief',
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
