/** 配图/海报内置模板（与首页图片模板名称对应） */
export interface ImageBuiltinTemplate {
  id: string;
  name: string;
  description: string;
  styleHint: string;
  layoutHint: string;
  previewImg?: string;
  gradient: string;
  accent: string;
  isBlank?: boolean;
}

export const BLANK_IMAGE_TEMPLATE: ImageBuiltinTemplate = {
  id: 'blank',
  name: '空白模板',
  description: '无预设版式与装饰，按大纲结构直接生成',
  styleHint: '留白 · 通用',
  layoutHint: '按章节顺序直出长图',
  gradient: 'linear-gradient(135deg, #f4f7fb 0%, #eef2f6 100%)',
  accent: '#94a3b8',
  isBlank: true,
};

export function isBlankImageTemplate(template: ImageBuiltinTemplate | undefined | null): boolean {
  return Boolean(template?.isBlank || template?.id === 'blank');
}

export const IMAGE_BUILTIN_TEMPLATES: ImageBuiltinTemplate[] = [
  {
    id: 'radimetrics',
    name: 'Radimetrics™ 智能化剂量管理平台',
    description: '从 CT 到核药的辐射剂量管理海报，适合产品介绍与学术沟通',
    styleHint: '科技蓝紫，信息分层清晰，强调智能化剂量管理与质控',
    layoutHint: '上标题+三点能力说明+底部产品界面与品牌标语',
    previewImg: '/image-templates/radimetrics.png',
    gradient: 'linear-gradient(145deg, #eef3ff 0%, #f4eefc 100%)',
    accent: '#5b4db8',
  },
  {
    id: 'confidence-talk',
    name: 'CONFIDENCE周周谈',
    description: '非奈利酮与 SGLT-2i 同步起始联合治疗的机制解析长图',
    styleHint: '红色学术科普风，机制图示突出，适合会议与周更解读',
    layoutHint: '刊会标识+主标题+机制流程图+指南结论条',
    previewImg: '/image-templates/confidence-talk.png',
    gradient: 'linear-gradient(145deg, #fff5f5 0%, #fde8e8 100%)',
    accent: '#c62828',
  },
  {
    id: 'afib-stroke',
    name: '房颤卒中预防科普',
    description: '关注心房颤动、预防脑卒中的竖版患者教育长图',
    styleHint: '紫红科普风，故事+数据结合，适合公众渠道疾病教育',
    layoutHint: '大标题+情景插画+危害数据区',
    previewImg: '/image-templates/afib-stroke.png',
    gradient: 'linear-gradient(145deg, #f6eef8 0%, #f3e6f4 100%)',
    accent: '#8e24aa',
  },
];

export function getImageTemplatesByIds(ids: string[]): ImageBuiltinTemplate[] {
  return ids
    .map((id) => getImageTemplate(id))
    .filter((t): t is ImageBuiltinTemplate => Boolean(t));
}

const TITLE_TO_ID: Record<string, string> = Object.fromEntries(
  IMAGE_BUILTIN_TEMPLATES.map((t) => [t.name, t.id])
);

export function getImageTemplate(id: string | null | undefined): ImageBuiltinTemplate | undefined {
  if (!id) return undefined;
  if (id === BLANK_IMAGE_TEMPLATE.id) return BLANK_IMAGE_TEMPLATE;
  return IMAGE_BUILTIN_TEMPLATES.find((t) => t.id === id);
}

export function recommendImageTemplates(context = ''): ImageBuiltinTemplate[] {
  const text = context.toLowerCase();
  const priorityId = /房颤|卒中|心房颤/.test(text)
    ? 'afib-stroke'
    : /confidence|周周谈|非奈利酮|sglt|ckd|肾/.test(text)
      ? 'confidence-talk'
      : /radimetrics|剂量|核药/.test(text)
        ? 'radimetrics'
        : 'confidence-talk';
  const ranked = [...IMAGE_BUILTIN_TEMPLATES].sort((a, b) =>
    a.id === priorityId ? -1 : b.id === priorityId ? 1 : 0
  );
  return [BLANK_IMAGE_TEMPLATE, ...ranked];
}

export function catalogImageTemplates(): ImageBuiltinTemplate[] {
  return [...IMAGE_BUILTIN_TEMPLATES];
}

export function imageTemplateIdFromTitle(title: string): string | null {
  return TITLE_TO_ID[title.trim()] ?? null;
}

export function parseImageTemplateFromText(text: string): string | null {
  const t = text.trim();
  const byTitle = imageTemplateIdFromTitle(t);
  if (byTitle) return byTitle;
  const lower = t.toLowerCase();
  if (lower.includes('radimetrics') || t.includes('剂量管理') || t.includes('核药')) {
    return 'radimetrics';
  }
  if (
    lower.includes('confidence') ||
    t.includes('周周谈') ||
    t.includes('非奈利酮') ||
    /sglt/i.test(t)
  ) {
    return 'confidence-talk';
  }
  if (t.includes('房颤') || t.includes('心房颤') || t.includes('卒中') || t.includes('脑卒中')) {
    return 'afib-stroke';
  }
  return null;
}

export const IMAGE_TEMPLATE_CHIP_NAMES = IMAGE_BUILTIN_TEMPLATES.map((t) => t.name);
