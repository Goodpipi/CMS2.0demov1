import type { TeamContentType } from '@/types/content';

/** 工作台角色：内容运营 / 医学部 / 市场部 */
export type UserRole = 'ops' | 'medical' | 'marketing';

export interface RoleProfile {
  id: UserRole;
  name: string;
  dept: string;
}

export const ROLE_PROFILES: Record<UserRole, RoleProfile> = {
  ops: { id: 'ops', name: '小张', dept: '内容运营' },
  medical: { id: 'medical', name: '小王', dept: '医学部' },
  marketing: { id: 'marketing', name: '小李', dept: '市场部' },
};

export type ReviewTaskStatus = 'pending' | 'in_progress' | 'completed';

export interface PptCommentReply {
  id: string;
  authorRole: UserRole;
  authorName: string;
  content: string;
  createdAt: number;
}

export interface PptReviewComment {
  id: string;
  pageIndex: number;
  pageNumber: number;
  authorRole: UserRole;
  authorName: string;
  content: string;
  createdAt: number;
  replies: PptCommentReply[];
}

/** 运营分配给医学部 / 市场部的团队修改任务 */
export interface ReviewTask {
  id: string;
  sessionId: string;
  title: string;
  contentType: TeamContentType;
  assigneeRole: 'medical' | 'marketing';
  assigneeName: string;
  assignerName: string;
  deadline: string;
  status: ReviewTaskStatus;
  createdAt: number;
  updatedAt: number;
  /** 文案审阅时的基准正文 */
  baseCopyText?: string;
  /** 审阅者保存的文案修改记录（运营端可查看） */
  copyRevisions?: CopyRevision[];
  copyRevisionBase?: string;
  /** PPT 按页批注及内容创作者回复 */
  pptComments?: PptReviewComment[];
  /** 同一任务被再次发起审阅的轮次 */
  reviewRound?: number;
  /** 已完成的审阅轮次数，用于二次审阅时保留历史状态 */
  completedReviewCount?: number;
}

export type CopyDiffKind = 'equal' | 'add' | 'delete';

export interface CopyDiffSegment {
  kind: CopyDiffKind;
  text: string;
}

/** 单次审阅者的修改记录（相对上一版） */
export interface CopyRevision {
  id: string;
  authorRole: UserRole;
  authorName: string;
  authorDept: string;
  createdAt: number;
  segments: CopyDiffSegment[];
  resultText: string;
  /** 参与修改的角色（合并展示用，同一角色只出现一次） */
  contributorRoles?: UserRole[];
}

/** 配图团队审阅：待运营采纳 / 已采纳 / 已拒绝恢复原图 */
export type ImageReviewStatus = 'pending' | 'accepted' | 'rejected' | null;

export const AUTHOR_COLORS: Record<UserRole, { add: string; del: string; label: string }> = {
  ops: { add: '#2e7d32', del: '#c62828', label: '内容运营' },
  medical: { add: '#1565c0', del: '#b71c1c', label: '医学部' },
  marketing: { add: '#6a1b9a', del: '#e65100', label: '市场部' },
};
