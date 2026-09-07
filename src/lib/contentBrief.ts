import type { ContentBrief } from '@/types/content';
import type { BriefAnalysis } from '@/app/components/conversationGuide';

export const CONTENT_BRIEF_FORMATS = ['PPT', '推文', '长图'] as const;

export const CONTENT_BRIEF_FIELDS: {
  key: keyof ContentBrief;
  label: string;
  required: boolean;
  multiline?: boolean;
  rows?: number;
  options?: readonly string[];
}[] = [
  { key: 'audience', label: '受众', required: true },
  { key: 'scenario', label: '场景', required: true },
  { key: 'format', label: '产物形式', required: true, options: CONTENT_BRIEF_FORMATS },
  { key: 'goal', label: '内容目标', required: true, multiline: true, rows: 2 },
  { key: 'keyMessage', label: '核心信息', required: true, multiline: true, rows: 2 },
  { key: 'length', label: '篇幅', required: true },
  { key: 'notes', label: '其他', required: false, multiline: true, rows: 3 },
  { key: 'narrative', label: '叙事逻辑梗概', required: false, multiline: true, rows: 3 },
];

export function emptyContentBrief(): ContentBrief {
  return {
    audience: '',
    scenario: '',
    format: '',
    goal: '',
    keyMessage: '',
    length: '',
    notes: '',
    narrative: '',
  };
}

export function normalizeContentBrief(brief: ContentBrief | null | undefined): ContentBrief | null {
  if (!brief) return null;
  return { ...emptyContentBrief(), ...brief };
}

export function missingRequiredBriefLabels(brief: ContentBrief): string[] {
  return CONTENT_BRIEF_FIELDS.filter((field) => field.required && !String(brief[field.key] || '').trim()).map(
    (field) => field.label
  );
}

export function formatContentBriefText(brief: ContentBrief): string {
  return CONTENT_BRIEF_FIELDS.map(({ key, label }) => `${label}：${brief[key] || '—'}`).join('\n');
}

export function literatureQueryFromBrief(brief: ContentBrief): string {
  return [brief.audience, brief.scenario, brief.keyMessage, brief.goal, brief.format]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ');
}

export function isGenerateBriefIntent(text: string): boolean {
  return /生成\s*brief|生成Brief|生成内容brief|输出brief|写一份brief|生成任务提案/i.test(text.trim());
}

export function generateContentBrief(input: {
  userPrompt?: string;
  insightText?: string;
  analysis?: BriefAnalysis | null;
}): ContentBrief {
  const prompt = (input.userPrompt || '').replace(/<[^>]+>/g, '').trim();
  const insight = (input.insightText || '').replace(/<[^>]+>/g, '').trim();
  const analysis = input.analysis;
  const hasInsight = insight.length > 40;
  const audience =
    analysis?.audience ||
    (hasInsight ? '心内科医师、医学事务与内容运营' : /患者|公众/.test(prompt) ? '公众 / 患者' : 'HCP');
  const scenario =
    analysis?.scenario ||
    (hasInsight ? '医学沟通与话题延展' : /学术|会议/.test(prompt) ? '学术会议' : '疾病教育');
  const format = /长图|一图读懂/.test(prompt)
    ? '长图'
    : /推文|图文/.test(prompt)
      ? '推文'
      : 'PPT';
  const topicHint = hasInsight
    ? '围绕房颤卒中预防、长期抗凝管理与泛血管风险沟通'
    : prompt.slice(0, 42) || '慢性肾脏病早期识别与规范管理';

  return {
    audience,
    scenario,
    format,
    goal: hasInsight
      ? '把洞察报告中的高优先话题转化为可执行任务提案，指导后续文案、配图与 PPT 生产。'
      : `根据用户提示「${topicHint}」明确内容方向、边界与交付形态。`,
    keyMessage: hasInsight
      ? '早期识别风险、长期规范管理、沟通须可追溯且不超出获批信息。'
      : '以循证信息为基础，表达专业、清晰、可追溯；内容仅用于疾病教育。',
    length: /短|卡片|图卡/.test(prompt) ? '单屏图卡 / 300 字内' : /长图文|长文/.test(prompt) ? '长图文 800–1200 字' : 'PPT 8–12 页或对等篇幅',
    notes: [analysis?.channel ? `渠道倾向：${analysis.channel}` : '', prompt && !hasInsight ? `用户补充：${prompt.slice(0, 80)}` : '', hasInsight ? '已结合当前话题洞察报告生成，可按任务继续改写。' : '']
      .filter(Boolean)
      .join('；'),
    narrative: '',
  };
}
