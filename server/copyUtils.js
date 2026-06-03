import { getMockCopy } from './mockData.js';

/** @param {Array<{ title?: string, topicTitle?: string }>} copies */
/** @param {Array<{ title?: string } | string>} topics */
export function assignCopyTopicTitles(copies, topics, copiesPerTopic) {
  const perTopic = Math.min(Math.max(Number(copiesPerTopic) || 3, 1), 5);
  const titles = topics
    .map((t) => (typeof t === 'string' ? t : t.title)?.trim())
    .filter(Boolean);
  if (!copies?.length || titles.length === 0) return copies || [];
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

/**
 * 保证每个话题恰好 perTopic 篇，共 topics.length * perTopic 篇。
 * AI 少返回时用演示模板补齐缺失篇数（非模型能力问题）。
 */
export function ensureCopyCount(copies, topics, copiesPerTopic) {
  const perTopic = Math.min(Math.max(Number(copiesPerTopic) || 3, 1), 5);
  const topicList = (topics || [])
    .map((t) => (typeof t === 'string' ? { title: t } : t))
    .filter((t) => t?.title?.trim());
  if (!topicList.length) return copies || [];

  const titles = topicList.map((t) => t.title.trim());
  const expectedTotal = titles.length * perTopic;
  const assigned = assignCopyTopicTitles(copies || [], topicList, perTopic);

  if (assigned.length >= expectedTotal) {
    return assigned.slice(0, expectedTotal);
  }

  const mockFull = getMockCopy(topicList, perTopic, '').copies;
  const byTitle = new Map();
  for (const copy of assigned) {
    const key = copy.topicTitle?.trim() || titles[0];
    if (!byTitle.has(key)) byTitle.set(key, []);
    byTitle.get(key).push(copy);
  }

  const result = [];
  for (const title of titles) {
    const existing = byTitle.get(title) || [];
    const mockForTopic = mockFull.filter((c) => c.topicTitle === title);
    for (let i = 0; i < perTopic; i++) {
      result.push(existing[i] || mockForTopic[i] || { ...mockForTopic[0], topicTitle: title });
    }
  }
  return result;
}
