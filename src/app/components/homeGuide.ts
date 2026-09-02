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

export type HomeEntrySource =
  | 'case'
  | 'promo'
  | 'evidence'
  | 'poster'
  | 'insight'
  | 'more';

export interface HomeEntryContext {
  intent: HomeEntryIntent;
  templateTitle?: string;
  /** 首页入口来源，用于按业务场景定制工作台结构，不会自动发送为用户消息。 */
  source?: HomeEntrySource;
}

export const HOME_ENTRY_SOURCE_LABELS: Record<HomeEntrySource, string> = {
  case: '病例内容',
  promo: '医学与推广内容',
  evidence: '学术证据解读',
  poster: '会议海报',
  insight: '话题洞察',
  more: '更多内容',
};

export function inferHomeEntrySource(ctx?: HomeEntryContext | null): HomeEntrySource {
  if (ctx?.source) return ctx.source;
  switch (ctx?.intent) {
    case 'insight':
      return 'insight';
    case 'visual':
    case 'visual-template':
      return 'poster';
    case 'ppt':
    case 'ppt-template':
      return 'case';
    case 'copy':
      return 'promo';
    default:
      return 'more';
  }
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
  if ((text.includes('话题') && text.includes('洞察')) || /生成文案|生成视频/.test(text)) {
    return false;
  }
  return true;
}

const INTENT_LABELS: Record<Exclude<HomeEntryIntent, 'visual-template' | 'ppt-template'>, string> = {
  general: '内容创作',
  insight: '话题洞察',
  copy: '文案',
  visual: '图片',
  video: '视频',
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
  if (/病例/.test(t)) return 'ppt';
  if (/海报|会议视觉/i.test(t)) return 'visual';
  if (/学术|证据|文献解读/.test(t)) return 'ppt';
  if (/推广|医学传播/.test(t)) return 'copy';
  if (/ppt|幻灯片|演示文稿|课件/i.test(t)) return 'ppt';
  if (/视频|分镜|口播|短视频/i.test(t)) return 'video';
  if (/洞察|热点|话题分析|趋势/i.test(t)) return 'insight';
  if (/文案|撰写|稿子|科普文/i.test(t)) return 'copy';
  if (/图片|配图|封面|视觉|插画/i.test(text)) return 'visual';
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
  const { intent, templateTitle, source } = ctx;

  if (source === 'case') {
    return {
      html: '您好！请您上传脱敏后的病例原始素材，如需生成专家点评，请上传过往专家点评示例',
      chips: ['生成图文大纲', '生成长图大纲', '生成PPT大纲', '直接生成PPT'],
    };
  }

  if (source === 'poster') {
    return {
      html: '您好！请先输入「生成主KV」，确认主视觉后再输入「生成海报」。海报支持手动编辑与导出，也可一键适配手机版后提交 Veeva 审批。',
      chips: ['生成主KV', '生成海报'],
    };
  }

  if (source === 'promo') {
    return {
      html: '您好！请先添加参考知识或品牌策略。中间流程会按你的第一步展开：话题洞察、Brief、PPT、推文、长图或话术。',
      chips: ['基于素材生成话题洞察', '生成 Brief', '生成PPT大纲', '生成图文大纲', '生成长图大纲', '生成话术'],
    };
  }

  if (source === 'evidence') {
    return {
      html: '您好！请添加待解读的目标材料，如指南、文献或研究原文；也可补充其他参考知识。',
      chips: ['生成PPT大纲', '直接生成PPT', '生成图文大纲'],
    };
  }

  if (source === 'insight') {
    return {
      html: '您好！请添加参考知识或品牌策略，描述想洞察的主题与受众后即可生成话题洞察。',
      chips: ['基于素材生成话题洞察'],
    };
  }

  if (source === 'more') {
    return {
      html: '您好！可先添加参考知识、品牌策略或 Brief，再描述你想生成的内容。',
      chips: FLEXIBLE_WORKFLOW_CHIPS,
    };
  }

  switch (intent) {
    case 'insight':
      return {
        html: '默认素材已就绪。请描述想洞察的主题与受众，发送后将自动检查「热点洞察」素材并生成报告或话题推荐。',
        chips: ['基于素材生成话题洞察'],
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
        html: '可直接描述视频主题与受众，一键生成视频方案。',
        chips: ['直接生成视频', '直接生成文案', '生成话题洞察', '直接生成PPT'],
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
  { title: 'Radimetrics™ 智能化剂量管理平台', img: '/image-templates/radimetrics.png' },
  { title: 'CONFIDENCE周周谈', img: '/image-templates/confidence-talk.png' },
  { title: '房颤卒中预防科普', img: '/image-templates/afib-stroke.png' },
] as const;

export const HOME_PPT_TEMPLATES = [
  { title: 'EYLEA nAMD Meta分析', img: '/ppt-templates/eylea-namd-01.png' },
  { title: 'HER2突变NSCLC医学汇报', img: '/ppt-templates/her2-nsclc-01.png' },
  { title: 'PAD抗栓指南进展', img: '/ppt-templates/pad-xarelto-01.png' },
] as const;
