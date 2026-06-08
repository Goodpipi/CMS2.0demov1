import type { LibraryItem, TopicItem } from '@/types/content';
import { isInsightQuickAction } from '@/app/components/conversationGuide';

export const HOT_INSIGHT_CATEGORY = '热点洞察';
export const BRAND_NAME = '可申达';

export const WORKSPACE_QUICK_PROMPTS = [
  { label: '基于素材生成话题洞察', prefix: '基于素材生成话题洞察：' },
  { label: '生成文案', prefix: '生成文案：' },
  { label: '生成图片', prefix: '生成图片：' },
  { label: '生成PPT大纲', prefix: '生成PPT大纲：' },
  { label: '直接生成视频', prefix: '直接生成视频：' },
] as const;

export const TOPIC_INSIGHT_BRANCH_CHIPS = ['上传热点洞察素材', '使用已有素材继续'] as const;

export interface InsightReportTopic {
  title: string;
  reason: string;
  source: string;
  audience: string;
  channel: string;
  nextActions: string[];
}

export interface HotInsightReport {
  brand: string;
  generatedAt: string;
  usedHotMaterials: string[];
  usedDefaultMaterials: string[];
  summary: string;
  hotTrends: string[];
  audienceFocus: string[];
  topics: InsightReportTopic[];
}

export interface TopicRecommendationItem {
  title: string;
  reason: string;
  source: string;
  audience: string;
  channel: string;
  contentTypes: string[];
}

export function getTaskHotInsightMaterials(materials: LibraryItem[]): LibraryItem[] {
  return materials.filter((m) => m.cat === HOT_INSIGHT_CATEGORY && m.def);
}

export function getTaskMaterials(materials: LibraryItem[]): LibraryItem[] {
  return materials.filter((m) => m.def);
}

export function isTopicInsightAgentIntent(text: string): boolean {
  const t = text.trim().replace(/[：:]\s*$/, '');
  if (!t) return false;
  if (isInsightQuickAction(t)) return true;
  if (/基于素材生成话题洞察|帮我找选题|找选题|素材.*洞察/.test(t)) return true;
  return false;
}

function inferAudience(note: string): string {
  if (/医生|HCP|医师/.test(note)) return '医生/HCP';
  if (/患者/.test(note)) return '患者';
  if (/公众|大众/.test(note)) return '公众';
  return '慢性肾病关注人群';
}

function inferChannel(note: string, fallback = '小红书'): string {
  if (/微信|公众号/.test(note)) return '微信公众号';
  if (/抖音|短视频/.test(note)) return '短视频平台';
  if (/小红书/.test(note)) return '小红书';
  return fallback;
}

function enrichTopic(topic: TopicItem, index: number, userNote: string): InsightReportTopic {
  const channels = ['小红书', '微信公众号', '患者社群'];
  const audiences = ['公众', '患者', '医生/HCP'];
  return {
    ...topic,
    audience: audiences[index % audiences.length] || inferAudience(userNote),
    channel: inferChannel(userNote, channels[index % channels.length]),
    nextActions: ['生成文案', '生成图片', '生成PPT大纲', '直接生成视频'],
  };
}

export function buildHotInsightReport(params: {
  hotMaterials: LibraryItem[];
  allMaterials: LibraryItem[];
  userNote: string;
  apiTopics: TopicItem[];
  apiSummary: string;
}): HotInsightReport {
  const { hotMaterials, allMaterials, userNote, apiTopics, apiSummary } = params;
  const defaultMaterials = allMaterials
    .filter((m) => m.def && !hotMaterials.some((h) => h.id === m.id))
    .map((m) => m.title);

  return {
    brand: BRAND_NAME,
    generatedAt: new Date().toISOString(),
    usedHotMaterials: hotMaterials.map((m) => m.title),
    usedDefaultMaterials: defaultMaterials,
    summary:
      apiSummary ||
      `基于 ${hotMaterials.length} 份热点洞察素材与任务默认素材，提炼 ${BRAND_NAME} 在公众渠道的内容机会。`,
    hotTrends: [
      '「隐形杀手」「早期信号」类标题在小红书互动率高于均值 32%',
      '肾脏健康科普中，生活方式干预与风险自测话题收藏率持续上升',
      '公众对「无症状≠无风险」类表达接受度高，适合短图文与口播视频',
    ],
    audienceFocus: [
      '35–55 岁都市人群对「体检指标异常但未确诊」话题关注度高',
      '患者家属更倾向搜索「如何提醒家人就医」类内容',
      '医生/HCP 侧更关注循证表达与合规边界清晰的科普话术',
    ],
    topics: apiTopics.map((t, i) => enrichTopic(t, i, userNote)),
  };
}

export function buildTopicRecommendations(params: {
  materials: LibraryItem[];
  userNote: string;
  apiTopics: TopicItem[];
}): TopicRecommendationItem[] {
  const { materials, userNote, apiTopics } = params;
  const briefing = materials.find((m) => m.cat === '品牌briefing' && m.def);
  const channelMat = materials.find((m) => m.cat === '渠道特色' && m.def);

  return apiTopics.map((topic, index) => ({
    title: topic.title,
    reason:
      topic.reason ||
      `结合${briefing?.title || '品牌 briefing'}与${channelMat?.title || '渠道偏好'}，该方向具备可传播性与合规表达空间。`,
    source: topic.source || briefing?.title || '任务素材',
    audience: inferAudience(userNote),
    channel: inferChannel(userNote, index % 2 === 0 ? '小红书' : '微信公众号'),
    contentTypes: ['文案', '配图', 'PPT大纲', '视频'],
  }));
}

export function reportTopicsToTopicItems(report: HotInsightReport): TopicItem[] {
  return report.topics.map(({ title, reason, source }) => ({ title, reason, source }));
}

export function recommendationsToTopicItems(items: TopicRecommendationItem[]): TopicItem[] {
  return items.map(({ title, reason, source }) => ({ title, reason, source }));
}

function formatReportDocument(report: HotInsightReport, taskTitle: string): string {
  const lines: string[] = [
    `${taskTitle}`,
    `${report.brand} · 话题洞察报告`,
    `生成时间：${new Date(report.generatedAt).toLocaleString('zh-CN')}`,
    '',
    '一、洞察摘要',
    report.summary,
    '',
    '二、使用素材',
    `热点洞察素材：${report.usedHotMaterials.join('、') || '无'}`,
    `其他任务素材：${report.usedDefaultMaterials.join('、') || '无'}`,
    '',
    '三、热点趋势',
    ...report.hotTrends.map((t, i) => `${i + 1}. ${t}`),
    '',
    '四、关键受众关注点',
    ...report.audienceFocus.map((t, i) => `${i + 1}. ${t}`),
    '',
    '五、推荐话题方向',
  ];

  report.topics.forEach((topic, i) => {
    lines.push(
      `${i + 1}. ${topic.title}`,
      `   推荐理由：${topic.reason}`,
      `   推荐受众：${topic.audience}`,
      `   推荐渠道：${topic.channel}`,
      `   建议下一步：${topic.nextActions.join('、')}`,
      ''
    );
  });

  lines.push('—— 本报告由 AI 内容生成工作台自动生成（演示） ——');
  return lines.join('\r\n');
}

export function downloadInsightReport(report: HotInsightReport, taskTitle: string) {
  const safeTitle = taskTitle.replace(/[\\/:*?"<>|]/g, '-').trim() || '话题洞察';
  const content = formatReportDocument(report, safeTitle);
  const blob = new Blob(['\ufeff', content], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeTitle}-话题洞察报告.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
