/** 与前端 imageTemplates.ts 保持 id 一致 */
export const IMAGE_BUILTIN_TEMPLATES = [
  {
    id: 'radimetrics',
    name: 'Radimetrics™ 智能化剂量管理平台',
    styleHint: '科技蓝紫，信息分层清晰，强调智能化剂量管理与质控',
    layoutHint: '上标题+三点能力说明+底部产品界面与品牌标语',
    previewImg: '/image-templates/radimetrics.png',
  },
  {
    id: 'confidence-talk',
    name: 'CONFIDENCE周周谈',
    styleHint: '红色学术科普风，机制图示突出，适合会议与周更解读',
    layoutHint: '刊会标识+主标题+机制流程图+指南结论条',
    previewImg: '/image-templates/confidence-talk.png',
  },
  {
    id: 'afib-stroke',
    name: '房颤卒中预防科普',
    styleHint: '紫红科普风，故事+数据结合，适合公众渠道疾病教育',
    layoutHint: '大标题+情景插画+危害数据区',
    previewImg: '/image-templates/afib-stroke.png',
  },
];

export function getImageTemplate(id) {
  if (!id) return null;
  return IMAGE_BUILTIN_TEMPLATES.find((t) => t.id === id) || null;
}
