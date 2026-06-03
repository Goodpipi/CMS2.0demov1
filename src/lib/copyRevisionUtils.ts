import type { CopyDiffSegment, CopyRevision, UserRole } from '@/types/review';
import { ROLE_PROFILES } from '@/types/review';

function tokenize(text: string): string[] {
  const parts = text.split(/(\s+)/);
  return parts.filter((p) => p.length > 0);
}

/** 简易词级 diff，用于演示增删标记 */
export function diffText(oldText: string, newText: string): CopyDiffSegment[] {
  const a = tokenize(oldText);
  const b = tokenize(newText);
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const segs: CopyDiffSegment[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      segs.push({ kind: 'equal', text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      segs.push({ kind: 'delete', text: a[i] });
      i++;
    } else {
      segs.push({ kind: 'add', text: b[j] });
      j++;
    }
  }
  while (i < n) {
    segs.push({ kind: 'delete', text: a[i++] });
  }
  while (j < m) {
    segs.push({ kind: 'add', text: b[j++] });
  }
  return mergeEqualSegments(segs);
}

function mergeEqualSegments(segs: CopyDiffSegment[]): CopyDiffSegment[] {
  const out: CopyDiffSegment[] = [];
  for (const s of segs) {
    const last = out[out.length - 1];
    if (last && last.kind === s.kind) {
      last.text += s.text;
    } else {
      out.push({ ...s });
    }
  }
  return out;
}

export function createCopyRevision(
  previousText: string,
  newText: string,
  authorRole: UserRole
): CopyRevision {
  const profile = ROLE_PROFILES[authorRole];
  return {
    id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    authorRole,
    authorName: profile.name,
    authorDept: profile.dept,
    createdAt: Date.now(),
    segments: diffText(previousText, newText),
    resultText: newText,
  };
}

export function latestCopyText(base: string, revisions: CopyRevision[]): string {
  if (!revisions.length) return base;
  return revisions[revisions.length - 1].resultText;
}

function contributorRolesFromRevisions(revisions: CopyRevision[]): UserRole[] {
  const roles: UserRole[] = [];
  for (const rev of revisions) {
    for (const role of rev.contributorRoles ?? [rev.authorRole]) {
      if (!roles.includes(role)) roles.push(role);
    }
  }
  return roles;
}

/** 合并为单一展示版本：相对原文一次 diff，图例按角色去重 */
export function normalizeCopyRevisions(
  baseText: string,
  revisions: CopyRevision[]
): CopyRevision[] {
  if (!revisions.length) return [];
  const resultText = latestCopyText(baseText, revisions);
  const contributorRoles = contributorRolesFromRevisions(revisions);
  const lastEditor = revisions[revisions.length - 1];
  const merged = createCopyRevision(baseText, resultText, lastEditor.authorRole);
  merged.id = 'copy_revision_merged';
  merged.contributorRoles = contributorRoles.length
    ? contributorRoles
    : [lastEditor.authorRole];
  return [merged];
}

/** 保存时更新为单一合并记录（非版本链） */
export function saveCopyRevisionMerged(
  revisions: CopyRevision[],
  baseText: string,
  newText: string,
  authorRole: UserRole
): CopyRevision[] {
  const contributorRoles = [
    ...new Set([...contributorRolesFromRevisions(revisions), authorRole]),
  ];
  const merged = createCopyRevision(baseText, newText, authorRole);
  merged.id = 'copy_revision_merged';
  merged.contributorRoles = contributorRoles;
  return [merged];
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
