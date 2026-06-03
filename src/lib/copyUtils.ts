import type { CopyItem, TopicItem } from '@/types/content';

export interface CopyTopicGroup {
  topicTitle: string;
  items: { copy: CopyItem; index: number }[];
}

/** 将文案按选中话题顺序分配，保证 N 个话题 → N 个分类 */
export function assignCopyTopicTitles(
  copies: CopyItem[],
  topics: Pick<TopicItem, 'title'>[],
  copiesPerTopic: number
): CopyItem[] {
  const perTopic = Math.min(Math.max(copiesPerTopic, 1), 5);
  const titles = topics.map((t) => t.title.trim()).filter(Boolean);
  if (!copies.length || titles.length === 0) return copies;
  if (titles.length === 1) {
    return copies.map((c) => ({ ...c, topicTitle: titles[0] }));
  }

  const expectedTotal = titles.length * perTopic;

  if (copies.length >= expectedTotal) {
    return copies.slice(0, expectedTotal).map((copy, idx) => ({
      ...copy,
      topicTitle: titles[Math.floor(idx / perTopic)],
    }));
  }

  return copies.map((copy, idx) => ({
    ...copy,
    topicTitle: titles[idx % titles.length],
  }));
}

/** 客户端兜底：API 篇数不足时按话题补齐占位（服务端应已补齐） */
export function ensureCopyCount(
  copies: CopyItem[],
  topics: Pick<TopicItem, 'title'>[],
  copiesPerTopic: number
): CopyItem[] {
  const perTopic = Math.min(Math.max(copiesPerTopic, 1), 5);
  const titles = topics.map((t) => t.title.trim()).filter(Boolean);
  if (!titles.length) return copies;

  const expectedTotal = titles.length * perTopic;
  const assigned = assignCopyTopicTitles(copies, topics, perTopic);
  if (assigned.length >= expectedTotal) {
    return assigned.slice(0, expectedTotal);
  }

  const byTitle = new Map<string, CopyItem[]>();
  for (const copy of assigned) {
    const key = copy.topicTitle?.trim() || titles[0];
    if (!byTitle.has(key)) byTitle.set(key, []);
    byTitle.get(key)!.push(copy);
  }

  const angles = ['小红书科普版', '患者教育长图版', 'HCP沟通简版', '渠道短文案版', '问答互动版'];
  const result: CopyItem[] = [];
  for (const title of titles) {
    const existing = byTitle.get(title) || [];
    for (let i = 0; i < perTopic; i++) {
      if (existing[i]) {
        result.push(existing[i]);
      } else {
        const angle = angles[i % angles.length];
        result.push({
          topicTitle: title,
          title: angle,
          body: `【话题】${title}\n\n【标题】${title} — ${angle.replace(/版$/, '')}\n\n【正文】围绕「${title}」展开疾病教育内容，强调风险认知与就医建议，避免疗效承诺。\n\n【免责声明】本文为疾病教育内容，不构成诊疗建议。`,
          compliance: '已弱化营销表述，补充免责声明占位。',
        });
      }
    }
  }
  return result;
}

/** 按 topicTitle 分组；无 topicTitle 的归入「其他」 */
export function groupCopiesByTopic(copies: CopyItem[]): CopyTopicGroup[] {
  const order: string[] = [];
  const map = new Map<string, CopyTopicGroup>();

  copies.forEach((copy, index) => {
    const topicTitle = copy.topicTitle?.trim() || '其他';
    if (!map.has(topicTitle)) {
      map.set(topicTitle, { topicTitle, items: [] });
      order.push(topicTitle);
    }
    map.get(topicTitle)!.items.push({ copy, index });
  });

  return order.map((key) => map.get(key)!);
}
