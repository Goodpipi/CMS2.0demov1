import {
  analyzeBrief,
  buildUnderstoodSummary,
  FLEXIBLE_WORKFLOW_CHIPS,
  getActionChips,
  getMissingForPpt,
  guideFlexibleWorkflow,
} from './conversationGuide';

export type HomeEntryIntent =
  | 'general'
  | 'insight'
  | 'copy'
  | 'visual'
  | 'video'
  | 'ppt'
  | 'visual-template'
  | 'ppt-template';

export interface HomeEntryContext {
  intent: HomeEntryIntent;
  templateTitle?: string;
}

export function isPptEntryIntent(ctx?: HomeEntryContext | null): boolean {
  return ctx?.intent === 'ppt' || ctx?.intent === 'ppt-template';
}

export function isVisualEntryIntent(ctx?: HomeEntryContext | null): boolean {
  return ctx?.intent === 'visual' || ctx?.intent === 'visual-template';
}

/** 从首页图片入口进入时，短句应走配图流程而非 PPT 大纲 */
export function shouldPreferVisualFlow(
  ctx: HomeEntryContext | null | undefined,
  text: string
): boolean {
  if (!isVisualEntryIntent(ctx)) return false;
  if (/ppt|幻灯片|演示文稿|课件/i.test(text)) return false;
  if ((text.includes('话题') && text.includes('洞察')) || /生成文案|视频脚本|生成视频/.test(text)) {
    return false;
  }
  return true;
}

const INTENT_LABELS: Record<Exclude<HomeEntryIntent, 'visual-template' | 'ppt-template'>, string> = {
  general: '内容创作',
  insight: '话题洞察',
  copy: '文案',
  visual: '图片',
  video: '视频脚本',
  ppt: 'PPT',
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 根据首页自由输入粗略识别用户意图 */
export function detectHomeIntent(text: string): HomeEntryIntent | 'unknown' {
  const t = text.trim();
  if (!t) return 'general';
  if (/veeva|审批|提交包/i.test(t)) return 'general';
  if (/ppt|幻灯片|演示文稿|课件/i.test(t)) return 'ppt';
  if (/视频|分镜|口播|短视频/i.test(t)) return 'video';
  if (/洞察|热点|话题分析|趋势/i.test(t)) return 'insight';
  if (/文案|撰写|稿子|科普文/i.test(t)) return 'copy';
  if (/图片|配图|海报|封面|视觉|插画/i.test(text)) return 'visual';
  return 'unknown';
}

/** 首页输入进入任务后的引导话术（不直接触发生成） */
export function getHomeInputGuidance(
  userText: string,
  detected: HomeEntryIntent | 'unknown'
): { html: string; chips: string[]; suggestedIntent: HomeEntryIntent } {
  const quoted = escapeHtml(userText.length > 100 ? `${userText.slice(0, 100)}…` : userText);
  const analysis = analyzeBrief(userText);
  const understood = buildUnderstoodSummary(analysis);

  if (detected === 'unknown') {
    const flexible = guideFlexibleWorkflow();
    if (analysis.isSubstantial) {
      return {
        suggestedIntent: 'general',
        html: `收到：「${quoted}」。${understood ? `已识别 ${understood}。` : ''}${flexible.html}`,
        chips: flexible.chips,
      };
    }
    return {
      suggestedIntent: 'general',
      html: `收到：「${quoted}」。${flexible.html}`,
      chips: flexible.chips,
    };
  }

  const label = INTENT_LABELS[detected as keyof typeof INTENT_LABELS] || '内容创作';

  if (detected === 'ppt' || detected === 'ppt-template') {
    const missing = getMissingForPpt(userText);
    if (missing.length === 0) {
      return {
        suggestedIntent: detected === 'ppt-template' ? 'ppt-template' : 'ppt',
        html: `明白，你要做<strong>${label}</strong>。${understood ? `已识别 ${understood}。` : ''}可以先生成大纲，也可以直接生成 PPT。`,
        chips: ['生成PPT大纲', '直接生成PPT', '补充内容要求'],
      };
    }
    if (missing.length === 1 && missing[0] === 'audience') {
      return {
        suggestedIntent: 'ppt',
        html: `明白，你要做<strong>${label}</strong>。${understood ? `已识别 ${understood}。` : ''}只差一步：目标受众是？`,
        chips: ['医生/HCP', '公众', '患者'],
      };
    }
    if (missing.length === 1 && missing[0] === 'scenario') {
      return {
        suggestedIntent: 'ppt',
        html: `明白，你要做<strong>${label}</strong>。${understood ? `已识别 ${understood}。` : ''}只差一步：使用场景是？`,
        chips: ['疾病教育', '作用机制', '产品培训', '科室会'],
      };
    }
  }

  if (analysis.isSubstantial) {
    return {
      suggestedIntent: detected,
      html: `明白，你要做<strong>${label}</strong>。${understood ? `已识别 ${understood}。` : ''}信息已足够，可直接开始。`,
      chips: getActionChips(detected),
    };
  }

  const welcome = getEntryWelcome({ intent: detected });
  return {
    suggestedIntent: detected,
    html: `你想做<strong>${label}</strong>。${welcome.html}`,
    chips: welcome.chips,
  };
}

export function getEntryWelcome(ctx: HomeEntryContext): { html: string; chips: string[] } {
  const { intent, templateTitle } = ctx;

  switch (intent) {
    case 'insight':
      return {
        html: '默认素材已就绪。可按标准流程先生成洞察，也可以跳过洞察直接生成文案、图片、PPT 或视频。',
        chips: ['开始生成话题洞察', '直接生成文案', '直接生成图片', '直接生成PPT'],
      };
    case 'copy':
      return {
        html: '你可以先生成洞察再写文案，也可以直接基于默认素材和你的 brief 生成文案。',
        chips: ['开始生成文案', '生成话题洞察', '直接生成图片', '直接生成PPT'],
      };
    case 'visual':
      return {
        html: '可以从文案生成配图，也可以跳过前置步骤，直接描述画面主题、受众与风格生成图片。',
        chips: ['开始生成配图', '直接生成文案', '选用内置模板', '生成话题洞察'],
      };
    case 'visual-template':
      return {
        html: `已选模板「${templateTitle || '图片'}」。可直接补充主题生成，也可以先生成文案再配图。`,
        chips: ['开始生成配图', '直接生成文案', '选用内置模板', '生成话题洞察'],
      };
    case 'video':
      return {
        html: '可按标准流程先有文案再做脚本，也可直接从视频开始。',
        chips: ['生成视频脚本', '直接生成视频', '直接生成文案', '生成话题洞察'],
      };
    case 'ppt':
      return {
        html: '可按标准流程先有文案再出大纲，也可直接从 PPT 开始。',
        chips: ['生成PPT大纲', '直接生成PPT', '直接生成文案', '生成话题洞察'],
      };
    case 'ppt-template':
      return {
        html: `已选模板「${templateTitle || 'PPT'}」。可直接补充受众与场景生成，也可以先生成文案再进入 PPT。`,
        chips: ['生成PPT大纲', '直接生成PPT', '直接生成文案', '生成话题洞察'],
      };
    default:
      const flexible = guideFlexibleWorkflow();
      return {
        html: `默认素材已就绪。${flexible.html}`,
        chips: FLEXIBLE_WORKFLOW_CHIPS,
      };
  }
}

export const HOME_IMAGE_TEMPLATES = [
  { title: '小红书配图', img: 'https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?w=400' },
  { title: '疾病教育海报', img: 'https://images.unsplash.com/photo-1559757175-053139280de2?w=400' },
  { title: '健康科普图文', img: 'https://images.unsplash.com/photo-1559757175-9e351c9a1301?w=400' },
  { title: '医疗场景图', img: '' },
  { title: '药品说明', img: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400' },
  { title: '患者关怀', img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400' },
] as const;

export const HOME_PPT_TEMPLATES = [
  { title: 'HCP沟通方案', img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400' },
  { title: '患者教育PPT', img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400' },
  { title: '疾病科普模板', img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400' },
  { title: '内部培训PPT', img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400' },
] as const;
