import type { PptDesignVersion } from '@/types/content';

/** 大纲页可选的内置 PPT 模板（与首页 PPT 模板名称对应） */
export interface PptBuiltinTemplate {
  id: string;
  /** 引用素材映射到服务端内置模板时使用的实际模板 ID */
  generationTemplateId?: string;
  name: string;
  description: string;
  styleTag: string;
  /** 服务端 SVG 配色变体索引 */
  variantIndex: number;
  /** 卡片预览渐变 */
  gradient: string;
  accent: string;
  /** 封面预览图 */
  previewUrl?: string;
  /** 生成时按页循环套用的版式图 */
  slideUrls?: string[];
  /** 空白模板：按大纲直接生成，不套用预设版式 */
  isBlank?: boolean;
}

export const BLANK_PPT_TEMPLATE: PptBuiltinTemplate = {
  id: 'blank',
  name: '空白模板',
  description: '无预设版式与装饰，按大纲结构直接生成',
  styleTag: '留白 · 通用',
  variantIndex: 0,
  gradient: 'linear-gradient(135deg, #f4f7fb 0%, #eef2f6 100%)',
  accent: '#94a3b8',
  isBlank: true,
};

export function isBlankPptTemplate(template: PptBuiltinTemplate | undefined | null): boolean {
  return Boolean(template?.isBlank || template?.id === 'blank');
}

const EYLEA_SLIDES = [
  '/ppt-templates/eylea-namd-01.png',
  '/ppt-templates/eylea-namd-02.png',
  '/ppt-templates/eylea-namd-03.png',
];

const HER2_SLIDES = [
  '/ppt-templates/her2-nsclc-01.png',
  '/ppt-templates/her2-nsclc-02.png',
  '/ppt-templates/her2-nsclc-03.png',
];

const PAD_SLIDES = [
  '/ppt-templates/pad-xarelto-01.png',
  '/ppt-templates/pad-xarelto-02.png',
  '/ppt-templates/pad-xarelto-03.png',
];

export const PPT_BUILTIN_TEMPLATES: PptBuiltinTemplate[] = [
  {
    id: 'eylea-namd',
    name: 'EYLEA nAMD Meta分析',
    description: '抗 VEGF 治疗初治 nAMD 的系统评价与 meta 分析学术版式',
    styleTag: 'EYLEA · 16:9 · 3 页',
    variantIndex: 1,
    gradient: 'linear-gradient(135deg, #e8f6ec 0%, #f7fbf8 100%)',
    accent: '#1b7a3c',
    previewUrl: EYLEA_SLIDES[0],
    slideUrls: EYLEA_SLIDES,
  },
  {
    id: 'her2-nsclc',
    name: 'HER2突变NSCLC医学汇报',
    description: '塞伐艾替尼治疗 HER2 突变非小细胞肺癌的医学事务汇报版式',
    styleTag: '肿瘤 · 16:9 · 3 页',
    variantIndex: 0,
    gradient: 'linear-gradient(135deg, #e4eefc 0%, #f6f8ff 100%)',
    accent: '#1a4b8c',
    previewUrl: HER2_SLIDES[0],
    slideUrls: HER2_SLIDES,
  },
  {
    id: 'pad-xarelto',
    name: 'PAD抗栓指南进展',
    description: '从指南变迁看 PAD 抗栓治疗进展的学术沟通版式',
    styleTag: '拜瑞妥 · 16:9 · 3 页',
    variantIndex: 3,
    gradient: 'linear-gradient(135deg, #efe8f8 0%, #faf7fd 100%)',
    accent: '#4b2c7f',
    previewUrl: PAD_SLIDES[0],
    slideUrls: PAD_SLIDES,
  },
];

/** 模板库中的更多 PPT 模板（选择更多模板弹窗） */
export const EXTRA_PPT_TEMPLATES: PptBuiltinTemplate[] = [];

const TITLE_TO_ID: Record<string, string> = {
  空白模板: 'blank',
  'EYLEA nAMD Meta分析': 'eylea-namd',
  HER2突变NSCLC医学汇报: 'her2-nsclc',
  PAD抗栓指南进展: 'pad-xarelto',
};

export function getPptTemplate(id: string | null | undefined): PptBuiltinTemplate | undefined {
  if (!id) return undefined;
  if (id === BLANK_PPT_TEMPLATE.id) return BLANK_PPT_TEMPLATE;
  return (
    PPT_BUILTIN_TEMPLATES.find((t) => t.id === id) ??
    EXTRA_PPT_TEMPLATES.find((t) => t.id === id)
  );
}

export function recommendPptTemplates(context = ''): PptBuiltinTemplate[] {
  const text = context.toLowerCase();
  const priorityId = /her2|nsclc|肺癌|肿瘤/.test(text)
    ? 'her2-nsclc'
    : /pad|抗栓|外周动脉|拜瑞妥/.test(text)
      ? 'pad-xarelto'
      : /namd|vegf|眼科|视网膜|黄斑|eylea|艾力雅/.test(text)
        ? 'eylea-namd'
        : 'eylea-namd';
  const ranked = [...PPT_BUILTIN_TEMPLATES].sort((a, b) =>
    a.id === priorityId ? -1 : b.id === priorityId ? 1 : 0
  );
  return [BLANK_PPT_TEMPLATE, ...ranked];
}

export function catalogPptTemplates(): PptBuiltinTemplate[] {
  return [...PPT_BUILTIN_TEMPLATES, ...EXTRA_PPT_TEMPLATES];
}

export function pptTemplateIdFromTitle(title: string): string | null {
  return TITLE_TO_ID[title] ?? null;
}

export function applyPptTemplateImages(
  versions: PptDesignVersion[],
  template: PptBuiltinTemplate | undefined | null
): PptDesignVersion[] {
  if (!template || isBlankPptTemplate(template) || !template.slideUrls?.length) {
    return versions;
  }
  const urls = template.slideUrls;
  return versions.map((version) => {
    const slides = (version.slides || []).map((slide, index) => ({
      ...slide,
      imageUrl: urls[index % urls.length],
    }));
    return {
      ...version,
      slides,
      coverDataUrl: urls[0],
    };
  });
}
