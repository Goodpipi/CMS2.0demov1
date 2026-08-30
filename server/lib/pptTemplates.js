/** 与前端 pptTemplates.ts 保持 id / variantIndex 一致 */
export const PPT_BUILTIN_TEMPLATES = [
  {
    id: 'eylea-namd',
    name: 'EYLEA nAMD Meta分析',
    styleTag: 'EYLEA · 16:9 · 3 页',
    variantIndex: 1,
    slideUrls: [
      '/ppt-templates/eylea-namd-01.png',
      '/ppt-templates/eylea-namd-02.png',
      '/ppt-templates/eylea-namd-03.png',
    ],
  },
  {
    id: 'her2-nsclc',
    name: 'HER2突变NSCLC医学汇报',
    styleTag: '肿瘤 · 16:9 · 3 页',
    variantIndex: 0,
    slideUrls: [
      '/ppt-templates/her2-nsclc-01.png',
      '/ppt-templates/her2-nsclc-02.png',
      '/ppt-templates/her2-nsclc-03.png',
    ],
  },
  {
    id: 'pad-xarelto',
    name: 'PAD抗栓指南进展',
    styleTag: '拜瑞妥 · 16:9 · 3 页',
    variantIndex: 3,
    slideUrls: [
      '/ppt-templates/pad-xarelto-01.png',
      '/ppt-templates/pad-xarelto-02.png',
      '/ppt-templates/pad-xarelto-03.png',
    ],
  },
];

export function getPptTemplate(id) {
  if (!id) return PPT_BUILTIN_TEMPLATES[0];
  return PPT_BUILTIN_TEMPLATES.find((t) => t.id === id) || PPT_BUILTIN_TEMPLATES[0];
}
