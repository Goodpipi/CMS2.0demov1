import { parseAudience, parseScenario } from './pptUtils';
import type { HomeEntryIntent } from './homeGuide';

export interface BriefAnalysis {
  audience: string;
  scenario: string;
  channel: string;
  isSubstantial: boolean;
  wantsTemplate: boolean;
  skipsTemplate: boolean;
}

const SCENARIO_PATTERNS = [
  '作用机制',
  '产品培训',
  '疾病教育',
  '学术会',
  '科室会',
  '患教',
  '拜访',
  '内部培训',
];

export function parseScenarioExplicit(text: string): string {
  for (const p of SCENARIO_PATTERNS) {
    if (text.includes(p)) return p;
  }
  return '';
}

export function parseChannel(text: string): string {
  if (/小红书/.test(text)) return '小红书';
  if (/微信|公众号/.test(text)) return '微信';
  if (/抖音|短视频/.test(text)) return '短视频';
  return '';
}

export function analyzeBrief(text: string): BriefAnalysis {
  const trimmed = text.trim();
  return {
    audience: parseAudience(trimmed),
    scenario: parseScenarioExplicit(trimmed) || parseScenario(trimmed),
    channel: parseChannel(trimmed),
    isSubstantial: trimmed.length >= 18 || /[，,。；;]/.test(trimmed),
    wantsTemplate: /选用模板|选择模板|用模板|内置模板/.test(trimmed),
    skipsTemplate: /不用模板|不要模板|直接生成|否[，,]/.test(trimmed),
  };
}

export function getMissingForPpt(text: string): Array<'audience' | 'scenario'> {
  const audience = parseAudience(text);
  const scenario = parseScenarioExplicit(text);
  const missing: Array<'audience' | 'scenario'> = [];
  if (!audience) missing.push('audience');
  if (!scenario) missing.push('scenario');
  return missing;
}

export function buildUnderstoodSummary(analysis: BriefAnalysis): string {
  const parts: string[] = [];
  if (analysis.audience) parts.push(`受众 ${analysis.audience}`);
  if (analysis.scenario) parts.push(`场景 ${analysis.scenario}`);
  if (analysis.channel) parts.push(`渠道 ${analysis.channel}`);
  return parts.join(' · ');
}

const ACTION_CHIPS: Record<HomeEntryIntent, string[]> = {
  general: ['生成话题洞察', '直接生成文案', '直接生成图片', '直接生成PPT', '直接生成视频'],
  insight: ['开始生成话题洞察', '直接生成文案', '直接生成图片', '生成PPT大纲'],
  copy: ['开始生成文案', '生成话题洞察', '直接生成图片', '直接生成视频'],
  visual: ['开始生成配图', '选用内置模板', '直接生成文案', '生成话题洞察'],
  video: ['直接生成视频', '直接生成文案', '生成话题洞察', '直接生成PPT'],
  ppt: ['生成PPT大纲', '直接生成PPT', '直接生成文案', '直接生成视频'],
  'visual-template': ['开始生成配图', '选用内置模板', '直接生成文案', '生成话题洞察'],
  'ppt-template': ['生成PPT大纲', '直接生成PPT', '直接生成文案', '生成话题洞察'],
};

export const FLEXIBLE_WORKFLOW_CHIPS = ACTION_CHIPS.general;

export function guideFlexibleWorkflow(): { html: string; chips: string[] } {
  return {
    html:
      '可按推荐顺序推进：<strong>洞察 → 文案 → 图片 / PPT 大纲 → PPT / 视频</strong>；也可以直接描述要生成的内容，我会从对应步骤开始。',
    chips: FLEXIBLE_WORKFLOW_CHIPS,
  };
}

export function isPptOutlinePath(text: string): boolean {
  const t = text.trim();
  return (
    t === '先大纲后设计' ||
    t === '生成PPT大纲' ||
    /先.*大纲|大纲.*(后|再)|编辑大纲|生成大纲|分步/.test(t) ||
    t === '开始生成PPT大纲' ||
    (t.includes('开始生成') && t.includes('大纲'))
  );
}

export function isPptDirectPath(text: string): boolean {
  const t = text.trim();
  return (
    t === '跳过大纲直接生成' ||
    /跳过.*大纲|直接.*(生成|做).*ppt|不要大纲|跳过大纲/i.test(t) ||
    (t.includes('直接') && t.includes('PPT'))
  );
}

export function guidePptPath(): { html: string; chips: string[] } {
  return {
    html: '可以先生成并编辑<strong>PPT 大纲</strong>，也可以直接生成 PPT 方案。',
    chips: ['生成PPT大纲', '直接生成PPT', '直接生成文案', '生成话题洞察'],
  };
}

/** 跳过大纲直接生成 PPT 完成后的引导 */
export function guidePptDirectDone(versionCount: number, slideCount: number): { html: string; chips: string[] } {
  return {
    html: `已跳过大纲编辑，直接生成 ${versionCount} 套 PPT 设计方案，每套 ${slideCount} 页。请在右侧「PPT生成」中预览与选用。如需查看或编辑后台自动生成的大纲，可点击「查看大纲」。`,
    chips: ['查看大纲', '提交当前版本到Veeva Vault'],
  };
}

export function isVideoScriptPath(_text: string): boolean {
  return false;
}

export function isVideoDirectPath(text: string): boolean {
  const t = text.trim();
  return (
    t === '跳过脚本直接生成' ||
    t === '直接生成视频' ||
    t === '生成视频' ||
    /跳过.*脚本|直接.*(生成|做).*视频|不要脚本|跳过脚本/i.test(t) ||
    (t.includes('直接') && t.includes('视频')) ||
    (t.includes('视频') && !t.includes('脚本'))
  );
}

export function guideVideoPath(): { html: string; chips: string[] } {
  return {
    html: '请补充视频主题、受众与风格，我将直接生成视频方案。',
    chips: ['直接生成视频', '直接生成文案', '生成话题洞察', '直接生成PPT'],
  };
}

export function getActionChips(intent: HomeEntryIntent): string[] {
  return ACTION_CHIPS[intent] || ACTION_CHIPS.general;
}

export function isStartAction(text: string): boolean {
  return /^(开始|直接开始|马上|立即)/.test(text.trim()) || /开始生成/.test(text);
}

const CN_NUM: Record<string, number> = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5 };

/** 从用户输入解析「每个文案 N 张」配图数量 */
export function parseImagesPerCopy(text: string): number | null {
  const t = text.trim();
  if (!t) return null;

  const digitMatch = t.match(/(?:每个|每篇|每版|每条|每则)?(?:文案|稿子)?\s*(\d+)\s*张/);
  if (digitMatch) return Math.min(Math.max(Number(digitMatch[1]), 1), 5);

  const cnMatch = t.match(/(?:每个|每篇|每版|每条|每则)?(?:文案|稿子)?\s*([一二两三四五])\s*张/);
  if (cnMatch) return Math.min(Math.max(CN_NUM[cnMatch[1]] ?? 1, 1), 5);

  if (/^([1-5])$/.test(t)) return Number(t);

  return null;
}

export function guideImagesPerCopy(selectedCount: number): { html: string; chips: string[] } {
  return {
    html:
      selectedCount > 0
        ? `你已勾选 <strong>${selectedCount}</strong> 篇文案。请告诉我<strong>每个文案想生成几张配图</strong>（例如：「每个文案 2 张」）。`
        : '请先在右侧「文案」中勾选需要配图的文案，并告诉我每个文案想生成几张配图。',
    chips: ['每个文案 1 张', '每个文案 2 张', '每个文案 3 张'],
  };
}

/** 对话内洞察类快捷引导：点击后应直接生成话题洞察 */
export function isInsightQuickAction(text: string): boolean {
  const t = text.trim().replace(/[：:]\s*$/, '');
  if (!t) return false;
  if (/^(开始)?生成话题洞察/.test(t)) return true;
  if (t.includes('话题') && t.includes('洞察')) return true;
  if (/热点洞察|话题洞察|洞察报告|补充.*洞察/.test(t)) return true;
  if (t.includes('洞察') && !/文案|PPT|ppt|视频|配图|图片/.test(t)) return true;
  if (t.includes('基于素材') && /洞察|话题|热点/.test(t)) return true;
  if (t.includes('基于默认素材') && /洞察|话题|热点/.test(t)) return true;
  if (t === '补充热点关键词' || t === '扩展话题') return true;
  if (/热点|话题分析|趋势观察|高互动标题/.test(t) && !/文案|配图|图片|PPT|ppt|视频/.test(t)) {
    return true;
  }
  return false;
}

export function guideMissingFields(
  taskLabel: string,
  missing: string[]
): { html: string; chips: string[] } {
  if (missing.length === 0) {
    return {
      html: `信息已齐，可以开始${taskLabel}。`,
      chips: ['直接开始'],
    };
  }
  if (missing.length === 1 && missing[0] === 'audience') {
    return {
      html: `可以${taskLabel}。还差一步：这份内容的<strong>目标受众</strong>是谁？`,
      chips: ['医生/HCP', '公众', '患者'],
    };
  }
  if (missing.length === 1 && missing[0] === 'scenario') {
    return {
      html: `可以${taskLabel}。还差一步：这份内容的<strong>使用场景</strong>是什么？`,
      chips: ['疾病教育', '作用机制', '产品培训', '科室会'],
    };
  }
  return {
    html: `可以${taskLabel}。请补充：<strong>${missing.join('、')}</strong>。`,
    chips: missing[0] === 'audience'
      ? ['医生/HCP', '公众', '患者']
      : ['疾病教育', '作用机制', '产品培训'],
  };
}
