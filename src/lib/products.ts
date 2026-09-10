export interface TaskProduct {
  id: string;
  name: string;
  en: string;
  category: string;
  hint: string;
}

/** 拜耳女性健康在华商品名示例（处方药进博组合 + 孕哺营养） */
export const BAYER_WH_PRODUCTS: TaskProduct[] = [
  { id: 'glucobay', name: '可申达', en: 'Glucobay', category: '糖尿病', hint: '阿卡波糖片 · 餐后血糖管理' },
  { id: 'yasmin', name: '优思明', en: 'Yasmin', category: '口服避孕', hint: '屈螺酮炔雌醇片' },
  { id: 'yaz', name: '优思悦', en: 'Yaz', category: '口服避孕', hint: '屈螺酮炔雌醇片（Ⅱ）' },
  { id: 'visanne', name: '唯散宁', en: 'Visanne', category: '内膜疾病', hint: '地诺孕素片 · 子宫内膜异位症' },
  { id: 'mirena', name: '曼月乐', en: 'Mirena', category: '宫内释放系统', hint: '左炔诺孕酮宫内缓释系统' },
  { id: 'climen', name: '克龄蒙', en: 'Climen', category: '更年期管理', hint: '戊酸雌二醇环丙孕酮片' },
  { id: 'progynova', name: '补佳乐', en: 'Progynova', category: '更年期管理', hint: '戊酸雌二醇片' },
  { id: 'angeliq', name: '安今益', en: 'Angeliq', category: '更年期管理', hint: '雌二醇屈螺酮片' },
  { id: 'elevit', name: '爱乐维', en: 'Elevit', category: '孕哺营养', hint: '孕哺复合维生素' },
];
