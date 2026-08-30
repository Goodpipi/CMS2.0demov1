import type { LibraryItem } from '@/types/library';

export const MATERIAL_GROUP_DEFS = [
  {
    id: 'knowledge',
    title: '参考知识',
    cats: ['参考知识', '热点洞察', '合规手册'],
  },
  {
    id: 'strategy',
    title: '品牌策略',
    cats: ['品牌策略'],
  },
  {
    id: 'brief',
    title: 'Brief',
    cats: ['Brief', '品牌briefing'],
  },
  {
    id: 'template',
    title: '模板',
    cats: ['模板', '参考模板'],
  },
  {
    id: 'brand',
    title: '品牌元素',
    cats: ['品牌元素'],
  },
] as const;

export type MaterialGroupId = (typeof MATERIAL_GROUP_DEFS)[number]['id'];

export function materialGroupIdForCat(cat: string): MaterialGroupId {
  const match = MATERIAL_GROUP_DEFS.find((group) => (group.cats as readonly string[]).includes(cat));
  return match?.id ?? 'knowledge';
}

export function filterMaterialsByGroup(items: LibraryItem[], groupId: MaterialGroupId): LibraryItem[] {
  const group = MATERIAL_GROUP_DEFS.find((item) => item.id === groupId);
  if (!group) return [];
  return items.filter((item) => (group.cats as readonly string[]).includes(item.cat));
}

const EXPIRING_SOON_DAYS = 30;

type MaterialExpiryFields = {
  cms?: boolean;
  validUntil?: string | null;
  referenced?: boolean;
  def?: boolean;
};

function validUntilTime(item: MaterialExpiryFields): number | null {
  if (!item.validUntil) return null;
  const ts = new Date(`${item.validUntil}T23:59:59`).getTime();
  return Number.isNaN(ts) ? null : ts;
}

export function isMaterialExpired(item: MaterialExpiryFields): boolean {
  if (!item.cms) return false;
  const ts = validUntilTime(item);
  return ts != null && ts < Date.now();
}

export function isMaterialExpiringSoon(item: MaterialExpiryFields): boolean {
  if (!item.cms || isMaterialExpired(item)) return false;
  const ts = validUntilTime(item);
  if (ts == null) return false;
  return ts - Date.now() <= EXPIRING_SOON_DAYS * 86400000;
}

export function isMaterialUsable(item: MaterialExpiryFields): boolean {
  return (item.referenced ?? item.def) === true && !isMaterialExpired(item);
}

export function materialFormatLabel(item: LibraryItem): string {
  const name = `${item.fileName || ''} ${item.title} ${item.meta}`.toLowerCase();
  if (item.contentType === 'image' || /\.(png|jpe?g|gif|webp|svg)\b/.test(name) || /\bimg\b|\bpng\b|\bjpg\b/.test(name)) {
    return '图片';
  }
  if (item.contentType === 'pdf' || name.includes('.pdf') || /\bpdf\b/.test(name)) return 'PDF';
  if (/\.(pptx?)\b/.test(name) || /\bppt\b/.test(name)) return 'PPT';
  if (/\.(xlsx?)\b/.test(name) || /\bexcel\b/.test(name)) return 'Excel';
  if (/\.(docx?)\b/.test(name) || /\bword\b/.test(name)) return 'Word';
  return '文件';
}

export function materialSourceLabel(item: LibraryItem): string {
  return item.cms ? 'CMS' : '本地';
}

const RECENT_LIMIT = 3;

export function materialAttachmentPill(item: {
  cms: boolean;
  fileName?: string;
  title: string;
}): string {
  return `${item.cms ? 'CMS' : '附件'}:${item.fileName || item.title} ×`;
}

export function getRecentMaterials(library: LibraryItem[], limit = RECENT_LIMIT): LibraryItem[] {
  return [...library].sort((a, b) => b.addedAt - a.addedAt).slice(0, limit);
}

export function formatMaterialAddedTime(ts: number): string {
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  const sameDay =
    d.getFullYear() === new Date().getFullYear() &&
    d.getMonth() === new Date().getMonth() &&
    d.getDate() === new Date().getDate();
  if (sameDay) {
    return `今天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function materialPreviewSummary(item: LibraryItem): string {
  if (item.cms) {
    return '该素材来自 CMS，已通过合规审批流程，可在内容生成时作为可追溯引用。';
  }
  return '该素材为本地上传文件，系统已解析文本与结构，可在话题洞察、文案与配图生成中引用。';
}

export function materialPreviewBody(item: LibraryItem): string {
  const lines = [
    `分类：${item.cat}`,
    `来源：${item.cms ? 'CMS 已连接个人知识收藏' : '本地上传'}`,
    `元信息：${item.meta}`,
    item.def ? '状态：默认素材，新建任务会自动带出' : '状态：候选素材',
    `添加时间：${formatMaterialAddedTime(item.addedAt)}`,
  ];
  if (item.fileName) lines.splice(2, 0, `文件名：${item.fileName}`);
  return lines.join('\n');
}
