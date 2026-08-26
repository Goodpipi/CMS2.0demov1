import type { ContentBrief } from '@/types/content';
import type { BriefAnalysis } from '@/app/components/conversationGuide';

export const CONTENT_BRIEF_FIELDS: { key: keyof ContentBrief; label: string }[] = [
  { key: 'audience', label: '受众' },
  { key: 'scenario', label: '场景' },
  { key: 'format', label: '产物形式' },
  { key: 'goal', label: '内容目标' },
  { key: 'keyMessage', label: '核心信息' },
  { key: 'length', label: '篇幅' },
  { key: 'notes', label: '其他补充' },
];

export function formatContentBriefText(brief: ContentBrief): string {
  return CONTENT_BRIEF_FIELDS.map(({ key, label }) => `${label}：${brief[key] || '—'}`).join('\n');
}

export function isGenerateBriefIntent(text: string): boolean {
  return /生成\s*brief|生成Brief|生成内容brief|输出brief|写一份brief/i.test(text.trim());
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
  const format = /ppt|演示/.test(prompt)
    ? 'PPT 演示文稿'
    : /海报|配图|图片/.test(prompt)
      ? '主视觉 / 海报'
      : /视频/.test(prompt)
        ? '短视频脚本'
        : hasInsight
          ? '系列医学内容（文案 + PPT）'
          : '医学沟通材料';
  const topicHint = hasInsight
    ? '围绕房颤卒中预防、长期抗凝管理与泛血管风险沟通'
    : prompt.slice(0, 42) || '慢性肾脏病早期识别与规范管理';

  return {
    audience,
    scenario,
    format,
    goal: hasInsight
      ? '把洞察报告中的高优先话题转化为可执行内容 Brief，指导后续文案、配图与 PPT 生产。'
      : `根据用户提示「${topicHint}」明确内容方向、边界与交付形态。`,
    keyMessage: hasInsight
      ? '早期识别风险、长期规范管理、沟通须可追溯且不超出获批信息。'
      : '以循证信息为基础，表达专业、清晰、可追溯；内容仅用于疾病教育。',
    length: /短|卡片|图卡/.test(prompt) ? '单屏图卡 / 300 字内' : /长图文|长文/.test(prompt) ? '长图文 800–1200 字' : 'PPT 8–12 页或对等篇幅',
    notes: [analysis?.channel ? `渠道倾向：${analysis.channel}` : '', prompt && !hasInsight ? `用户补充：${prompt.slice(0, 80)}` : '', hasInsight ? '已结合当前话题洞察报告生成，可按任务继续改写。' : '']
      .filter(Boolean)
      .join('；') || '无额外限制，生成后请人工确认合规口径。',
  };
}
