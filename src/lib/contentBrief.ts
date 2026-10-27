import type { ContentBrief } from '@/types/content';
import type { BriefAnalysis } from '@/app/components/conversationGuide';

export const EVIDENCE_BRIEF_FORMATS = ['PPT', '推文', '长图'] as const;
export const EVIDENCE_INTERPRETATION_TYPES = ['指南解读', '文献解读', '研究解读', '共识解读'] as const;

export type ContentBriefVariant = 'default' | 'evidence';

export type ContentBriefFieldDef = {
  key: keyof ContentBrief;
  label: string;
  required: boolean;
  multiline?: boolean;
  rows?: number;
  options?: readonly string[];
  wide?: boolean;
};

export const CONTENT_BRIEF_FIELDS: ContentBriefFieldDef[] = [
  { key: 'audience', label: '受众', required: true },
  { key: 'scenario', label: '场景', required: true },
  { key: 'goal', label: '内容目标', required: true, multiline: true, rows: 2 },
  { key: 'keyMessage', label: '核心信息', required: true, multiline: true, rows: 2 },
  { key: 'length', label: '篇幅', required: true },
  { key: 'notes', label: '其他', required: false, multiline: true, rows: 3 },
  { key: 'narrative', label: '叙事逻辑梗概', required: false, multiline: true, rows: 3 },
];

export const EVIDENCE_BRIEF_FIELDS: ContentBriefFieldDef[] = [
  { key: 'scenario', label: '主题', required: true },
  { key: 'audience', label: '受众', required: true },
  { key: 'format', label: '形式', required: true, options: EVIDENCE_BRIEF_FORMATS, wide: true },
  { key: 'interpretation', label: '解读类型', required: true, options: EVIDENCE_INTERPRETATION_TYPES, wide: true },
  { key: 'notes', label: '其他补充', required: false, multiline: true, rows: 2 },
];

export function briefFieldsFor(
  variant: ContentBriefVariant = 'default',
  hidden: readonly (keyof ContentBrief)[] = []
): ContentBriefFieldDef[] {
  const fields = variant === 'evidence' ? EVIDENCE_BRIEF_FIELDS : CONTENT_BRIEF_FIELDS;
  return hidden.length ? fields.filter((field) => !hidden.includes(field.key)) : fields;
}

/** 病例与学术证据解读的形式由首页小入口决定；解读类型仅学术证据解读需要 */
export function hiddenEvidenceBriefFields(source?: string | null): (keyof ContentBrief)[] {
  if (source === 'case') return ['format', 'interpretation'];
  if (source === 'evidence') return ['format'];
  return [];
}

export function emptyContentBrief(): ContentBrief {
  return {
    audience: '',
    scenario: '',
    format: '',
    interpretation: '',
    goal: '',
    keyMessage: '',
    length: '',
    notes: '',
    narrative: '',
  };
}

/** 英文界面演示用的任务提案预填内容 */
export function englishMockContentBrief(source?: string | null): ContentBrief {
  if (source === 'case') {
    return {
      ...emptyContentBrief(),
      scenario: 'Case review: elderly NVAF patient with reduced renal function on anticoagulation',
      audience: 'Cardiologists and internal medicine physicians',
      notes: 'Highlight CHA₂DS₂-VASc assessment, CrCl-based dose checks and follow-up planning; keep the case de-identified.',
    };
  }
  if (source === 'evidence') {
    return {
      ...emptyContentBrief(),
      scenario: 'Stroke prevention in non-valvular atrial fibrillation: 2024 China AF guideline update',
      audience: 'Cardiologists and neurologists',
      interpretation: '指南解读',
      notes: 'Focus on risk stratification thresholds and NOAC dosing by CrCl; cite only approved sources.',
    };
  }
  return {
    ...emptyContentBrief(),
    audience: 'Cardiologists and HCPs managing atrial fibrillation',
    scenario: 'Regional academic meeting and department education',
    goal: 'Help HCPs move from risk identification to consistent, guideline-based stroke prevention in NVAF patients.',
    keyMessage: 'Assess stroke risk early, match the evidence to the clinical scenario, and confirm the dose by renal function.',
    length: 'PPT, 10–12 pages',
    notes: 'Follow the brand template style; every data point must be traceable to approved references.',
    narrative: 'Disease burden → guideline position → key evidence → complex scenarios → dosing in practice.',
  };
}

export function normalizeContentBrief(brief: ContentBrief | null | undefined): ContentBrief | null {
  if (!brief) return null;
  return { ...emptyContentBrief(), ...brief };
}

export function missingRequiredBriefLabels(
  brief: ContentBrief,
  variant: ContentBriefVariant = 'default',
  hidden: readonly (keyof ContentBrief)[] = []
): string[] {
  return briefFieldsFor(variant, hidden)
    .filter((field) => field.required && !String(brief[field.key] || '').trim())
    .map((field) => field.label);
}

export function formatContentBriefText(
  brief: ContentBrief,
  variant: ContentBriefVariant = 'default',
  hidden: readonly (keyof ContentBrief)[] = []
): string {
  return briefFieldsFor(variant, hidden)
    .map(({ key, label }) => `${label}：${brief[key] || '—'}`)
    .join('\n');
}

export function outlineCommandFromEvidenceFormat(format: string): string {
  const value = format.trim();
  if (value === '推文') return '生成图文大纲';
  if (value === '图' || value === '长图') return '生成长图大纲';
  return '生成PPT大纲';
}

export function literatureQueryFromBrief(brief: ContentBrief): string {
  return [brief.audience, brief.scenario, brief.interpretation, brief.keyMessage, brief.goal, brief.format]
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
  variant?: ContentBriefVariant;
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
  const format = /长图|一图读懂|^图$/.test(prompt)
    ? '长图'
    : /推文|图文/.test(prompt)
      ? '推文'
      : 'PPT';
  const interpretation =
    EVIDENCE_INTERPRETATION_TYPES.find((type) => prompt.includes(type.slice(0, 2))) ?? '文献解读';
  const topicHint = hasInsight
    ? '围绕房颤卒中预防、长期抗凝管理与泛血管风险沟通'
    : prompt.slice(0, 42) || '慢性肾脏病早期识别与规范管理';

  return {
    audience,
    scenario,
    format,
    interpretation,
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
