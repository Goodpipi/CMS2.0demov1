import type {
  CopyRevision,
  PptCommentReply,
  PptReviewComment,
  ReviewTask,
  ReviewTaskStatus,
  UserRole,
} from '@/types/review';
import type { TeamContentType } from '@/types/content';
import type { TabKey } from '@/types/session';
import type { SessionWorkspace } from '@/types/session';
import { DEMO_SESSION_ID } from '@/lib/chatSessions';
import { normalizeCopyRevisions } from '@/lib/copyRevisionUtils';

/** 审阅任务默认聚焦的标签（单标签类型） */
export function reviewerTabForContentType(contentType: TeamContentType): TabKey {
  const tabs = reviewerTabsForContentType(contentType, null);
  return tabs[0] || 'copy';
}

export type ReviewerWorkspaceSnapshot = Pick<
  SessionWorkspace,
  'pptOutline' | 'pptVersions' | 'pptResult' | 'videoVersions'
>;

/** 审阅任务可访问的标签 */
export function reviewerTabsForContentType(
  contentType: TeamContentType,
  workspace?: ReviewerWorkspaceSnapshot | SessionWorkspace | null | undefined
): TabKey[] {
  switch (contentType) {
    case 'copy':
      return ['copy'];
    case 'rich-text':
      return ['rich-text'];
    case 'visual':
      return ['visual'];
    case 'ppt':
      return workspace?.pptResult?.slides?.length || workspace?.pptVersions?.some((version) => version.slides?.length)
        ? ['ppt-design']
        : ['ppt-outline'];
    case 'video':
      return ['video-render'];
    default:
      return ['copy'];
  }
}

export function isCommentableContentType(
  type: TeamContentType | undefined | null
): type is 'ppt' | 'visual' | 'rich-text' {
  return type === 'ppt' || type === 'visual' || type === 'rich-text';
}

export function reviewCommentScopeLabel(type: TeamContentType, pageNumber = 1): string {
  if (type === 'visual') return '图片';
  if (type === 'rich-text') return '图文';
  return `第 ${pageNumber} 页`;
}

const STORAGE_KEY = 'acp_review_tasks_v1';

export function loadReviewTasks(): ReviewTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReviewTask[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.updatedAt - a.updatedAt) : [];
  } catch {
    return [];
  }
}

export function saveReviewTasks(tasks: ReviewTask[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function upsertReviewTask(task: ReviewTask): void {
  const all = loadReviewTasks().filter((t) => t.id !== task.id);
  all.push({ ...task, updatedAt: Date.now() });
  saveReviewTasks(all.sort((a, b) => b.updatedAt - a.updatedAt));
}

export function getReviewTask(id: string): ReviewTask | undefined {
  return loadReviewTasks().find((t) => t.id === id);
}

export function tasksForRole(role: UserRole): ReviewTask[] {
  if (role !== 'medical' && role !== 'marketing') return [];
  return loadReviewTasks().filter((t) => t.assigneeRole === role);
}

/** 同一会话下所有文案审阅任务（医学部 + 市场部） */
export function copyReviewTasksForSession(sessionId: string): ReviewTask[] {
  return loadReviewTasks().filter(
    (t) => t.sessionId === sessionId && t.contentType === 'copy'
  );
}

/** 合并会话内各审阅任务的文案修改记录为单一展示版本 */
export function mergeSessionCopyRevisions(sessionId: string): CopyRevision[] {
  const byId = new Map<string, CopyRevision>();
  for (const task of copyReviewTasksForSession(sessionId)) {
    for (const rev of task.copyRevisions ?? []) {
      byId.set(rev.id, rev);
    }
  }
  const all = [...byId.values()].sort((a, b) => a.createdAt - b.createdAt);
  if (!all.length) return [];
  const base = sessionCopyRevisionBase(sessionId);
  return normalizeCopyRevisions(base, all);
}

/** 会话文案审阅的共用基准正文 */
export function sessionCopyRevisionBase(sessionId: string): string {
  const tasks = copyReviewTasksForSession(sessionId);
  for (const t of tasks) {
    const base = t.copyRevisionBase || t.baseCopyText;
    if (base?.trim()) return base;
  }
  return '';
}

/** 将文案修订同步到同会话所有文案审阅任务，便于医学部/市场部互相可见 */
export function propagateCopyRevisionsToSession(
  sessionId: string,
  revisions: CopyRevision[],
  revisionBase: string,
  options?: { activeTaskId?: string; statusForActive?: ReviewTaskStatus }
): void {
  const tasks = copyReviewTasksForSession(sessionId);
  if (!tasks.length) return;
  const now = Date.now();
  const all = loadReviewTasks().filter((t) => !tasks.some((ct) => ct.id === t.id));
  const updated = tasks.map((t) => ({
    ...t,
    copyRevisions: revisions,
    copyRevisionBase: revisionBase || t.copyRevisionBase,
    baseCopyText: t.baseCopyText || revisionBase || undefined,
    status:
      options?.activeTaskId === t.id && options.statusForActive
        ? options.statusForActive
        : t.status,
    updatedAt: options?.activeTaskId === t.id ? now : t.updatedAt,
  }));
  saveReviewTasks([...all, ...updated].sort((a, b) => b.updatedAt - a.updatedAt));
}

export function updateTaskStatus(id: string, status: ReviewTaskStatus): void {
  const task = getReviewTask(id);
  if (!task) return;
  upsertReviewTask({ ...task, status });
}

/** 同一会话下的审阅任务 */
export function tasksForSession(sessionId: string): ReviewTask[] {
  return loadReviewTasks().filter((t) => t.sessionId === sessionId);
}

/** 按会话 + 内容类型 + 审阅人查找原任务（用于二次发起） */
export function findReviewTask(
  sessionId: string,
  contentType: TeamContentType,
  assigneeRole: 'medical' | 'marketing'
): ReviewTask | undefined {
  return loadReviewTasks().find(
    (t) =>
      t.sessionId === sessionId &&
      t.contentType === contentType &&
      t.assigneeRole === assigneeRole
  );
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 向审阅任务添加 PPT 页级批注 */
export function addPptComment(
  taskId: string,
  input: {
    pageIndex: number;
    pageNumber: number;
    authorRole: UserRole;
    authorName: string;
    content: string;
    imageUrl?: string;
  }
): PptReviewComment | undefined {
  const task = getReviewTask(taskId);
  if (!task) return undefined;
  const now = Date.now();
  const content = input.content.trim();
  const imageUrl = input.imageUrl?.trim() || undefined;
  if (!content && !imageUrl) return undefined;
  const comment: PptReviewComment = {
    id: makeId('ppt_comment'),
    pageIndex: input.pageIndex,
    pageNumber: input.pageNumber,
    authorRole: input.authorRole,
    authorName: input.authorName,
    content,
    imageUrl,
    createdAt: now,
    replies: [],
  };
  upsertReviewTask({
    ...task,
    status: task.status === 'pending' ? 'in_progress' : task.status,
    pptComments: [...(task.pptComments || []), comment],
  });
  return comment;
}

/** 为批注添加回复（创作者或审阅者） */
export function addPptCommentReply(
  taskId: string,
  commentId: string,
  input: {
    authorRole: UserRole;
    authorName: string;
    content: string;
    imageUrl?: string;
  }
): PptCommentReply | undefined {
  const task = getReviewTask(taskId);
  if (!task) return undefined;
  const content = input.content.trim();
  const imageUrl = input.imageUrl?.trim() || undefined;
  if (!content && !imageUrl) return undefined;
  const now = Date.now();
  const reply: PptCommentReply = {
    id: makeId('reply'),
    authorRole: input.authorRole,
    authorName: input.authorName,
    content,
    imageUrl,
    createdAt: now,
  };
  const comments = task.pptComments || [];
  if (!comments.some((c) => c.id === commentId)) return undefined;
  upsertReviewTask({
    ...task,
    status:
      input.authorRole !== 'ops' && task.status !== 'completed'
        ? 'in_progress'
        : task.status,
    pptComments: comments.map((comment) =>
      comment.id === commentId
        ? { ...comment, replies: [...(comment.replies || []), reply] }
        : comment
    ),
  });
  return reply;
}

export type ReopenReviewTaskInput = {
  title: string;
  deadline: string;
  assignerName: string;
  baseCopyText?: string;
  copyRevisionBase?: string;
};

/**
 * 重新打开原审阅任务：状态重置为 pending，更新截止时间与轮次，
 * 保留全部历史批注、回复与文案修订。
 */
export function reopenReviewTask(
  existing: ReviewTask,
  input: ReopenReviewTaskInput
): ReviewTask {
  const now = Date.now();
  const completedReviewCount = Math.max(
    existing.completedReviewCount || 0,
    existing.status === 'completed' ? 1 : 0
  );
  const task: ReviewTask = {
    ...existing,
    title: input.title,
    deadline: input.deadline,
    assignerName: input.assignerName,
    status: 'pending',
    updatedAt: now,
    baseCopyText: input.baseCopyText ?? existing.baseCopyText,
    copyRevisionBase: input.copyRevisionBase ?? existing.copyRevisionBase,
    reviewRound: (existing.reviewRound || 0) + 1,
    completedReviewCount,
    // 显式保留历史线程
    pptComments: existing.pptComments || [],
    copyRevisions: existing.copyRevisions,
  };
  upsertReviewTask(task);
  return task;
}

/** 创建新的审阅任务（首次发起） */
export function createReviewTask(input: {
  sessionId: string;
  title: string;
  contentType: TeamContentType;
  assigneeRole: 'medical' | 'marketing';
  assigneeName: string;
  assignerName: string;
  deadline: string;
  baseCopyText?: string;
  copyRevisionBase?: string;
}): ReviewTask {
  const now = Date.now();
  const task: ReviewTask = {
    id: makeId('rt'),
    sessionId: input.sessionId,
    title: input.title,
    contentType: input.contentType,
    assigneeRole: input.assigneeRole,
    assigneeName: input.assigneeName,
    assignerName: input.assignerName,
    deadline: input.deadline,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    baseCopyText: input.baseCopyText,
    copyRevisionBase: input.copyRevisionBase,
    reviewRound: 1,
    pptComments: [],
  };
  upsertReviewTask(task);
  return task;
}

export function seedReviewTasksIfEmpty(): void {
  if (loadReviewTasks().length > 0) return;
  const now = Date.now();
  saveReviewTasks([
    {
      id: 'rt_demo_medical',
      sessionId: DEMO_SESSION_ID,
      title: '小红书疾病教育图文',
      contentType: 'copy',
      assigneeRole: 'medical',
      assigneeName: '小王',
      assignerName: '小张',
      deadline: new Date(now + 86400000 * 2).toISOString().slice(0, 16),
      status: 'pending',
      createdAt: now - 3600000,
      updatedAt: now - 3600000,
      baseCopyText:
        '肾脏健康常常被忽略。了解相关风险因素，出现疑问时请咨询专业医生。',
    },
    {
      id: 'rt_demo_visual',
      sessionId: DEMO_SESSION_ID,
      title: '配图团队审阅',
      contentType: 'visual',
      assigneeRole: 'medical',
      assigneeName: '小王',
      assignerName: '小张',
      deadline: new Date(now + 86400000 * 2).toISOString().slice(0, 16),
      status: 'pending',
      createdAt: now - 1800000,
      updatedAt: now - 1800000,
    },
  ]);
}
