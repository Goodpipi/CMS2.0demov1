import type { PptSlide } from '@/types/content';
import { xareltoAfSlideUrl } from '@/lib/xareltoPptMock';

export type BrandKbCategory = 'strategy' | 'literature' | 'knowledge';

export interface BrandKbBrand {
  id: string;
  name: string;
  generic: string;
  area: string;
  accent: string;
  accentSoft: string;
  owner: string;
  updatedAt: string;
}

export interface BrandKbItem {
  id: string;
  brandId: string;
  category: BrandKbCategory;
  title: string;
  summary: string;
  meta: string;
  format: string;
  tags: string[];
  updatedAt: string;
  previewUrl?: string;
}

export const BRAND_KB_BRANDS: BrandKbBrand[] = [
  { id: 'xarelto', name: '拜瑞妥', generic: '利伐沙班片', area: '心血管 · 抗凝', accent: '#4f2e7d', accentSoft: '#f1ebf9', owner: '心血管品牌组 · 王敏', updatedAt: '2026-10-20' },
  { id: 'kerendia', name: '可申达', generic: '非奈利酮片', area: '心肾代谢 · CKD 合并 T2D', accent: '#0f7a6c', accentSoft: '#e6f5f2', owner: '心肾代谢品牌组 · 李晨', updatedAt: '2026-10-18' },
  { id: 'eylea', name: '艾力雅', generic: '阿柏西普眼内注射溶液', area: '眼科 · nAMD / DME', accent: '#1b7a3c', accentSoft: '#e8f6ec', owner: '眼科品牌组 · 周宁', updatedAt: '2026-10-12' },
  { id: 'sevabertinib', name: '塞伐艾替尼', generic: 'HER2 酪氨酸激酶抑制剂', area: '肿瘤 · HER2 突变 NSCLC', accent: '#1a4b8c', accentSoft: '#e4eefc', owner: '肿瘤医学事务 · 陈薇', updatedAt: '2026-09-28' },
];

export const BRAND_KB_ITEMS: BrandKbItem[] = [
  // 拜瑞妥
  { id: 'xa-s1', brandId: 'xarelto', category: 'strategy', title: '2026 拜瑞妥品牌策略：房颤卒中预防全程管理', summary: '围绕“早识别、规范抗凝、剂量精准、长期坚持”四个环节，明确年度沟通重点与核心科室覆盖策略。', meta: '品牌组 · 年度策略 V2.1', format: 'PPT · 28 页', tags: ['年度策略', '核心信息'], updatedAt: '2026-10-20' },
  { id: 'xa-s2', brandId: 'xarelto', category: 'strategy', title: '核心信息屋（Message House）', summary: '一句话定位 + 三大支柱信息：循证充分、剂量简便、适用人群广，并附各信息对应的可引用证据。', meta: '品牌组 · 已审批', format: 'PDF · 6 页', tags: ['Message House', '合规已审'], updatedAt: '2026-09-30' },
  { id: 'xa-s3', brandId: 'xarelto', category: 'strategy', title: '目标客户画像与渠道策略', summary: '心内、神内、老年科医生画像与内容偏好；学术会议、线上直播、院内科室会的内容配比建议。', meta: '品牌组 · 内部参考', format: 'PPT · 15 页', tags: ['客户画像', '渠道'], updatedAt: '2026-08-16' },
  { id: 'xa-l1', brandId: 'xarelto', category: 'literature', title: 'Rivaroxaban versus Warfarin in Nonvalvular Atrial Fibrillation (ROCKET AF)', summary: '高卒中风险 NVAF 患者中，利伐沙班预防卒中和体循环栓塞非劣效于华法林，颅内出血和致死性出血更少。', meta: 'Patel MR, et al. N Engl J Med. 2011;365:883-891', format: 'RCT · PDF', tags: ['关键Ⅲ期研究', '高频引用'], updatedAt: '2026-10-08' },
  { id: 'xa-l2', brandId: 'xarelto', category: 'literature', title: '心房颤动诊断和治疗中国指南（2023）', summary: 'CHA₂DS₂-VASc 评分达到阈值的非瓣膜性房颤患者推荐口服抗凝，优先考虑 NOAC。', meta: '中华医学会心血管病学分会 · 中华心血管病杂志. 2023', format: '指南 · PDF', tags: ['中国指南'], updatedAt: '2026-09-21' },
  { id: 'xa-l3', brandId: 'xarelto', category: 'literature', title: 'Epidemiology, management, and outcomes of atrial fibrillation among 30 million citizens in Shanghai', summary: '上海市医保数据库覆盖 3000 万居民，成人房颤患病率 0.88%，并随年龄显著上升。', meta: 'Chen M, et al. Lancet Reg Health West Pac. 2022;23:100470', format: '真实世界研究 · PDF', tags: ['中国数据', 'RWS'], updatedAt: '2026-09-02' },
  { id: 'xa-l4', brandId: 'xarelto', category: 'literature', title: 'Prevention of Bleeding in Patients with Atrial Fibrillation Undergoing PCI (PIONEER AF-PCI)', summary: '房颤合并 PCI 患者中，以利伐沙班为基础的方案临床显著出血低于华法林三联治疗。', meta: 'Gibson CM, et al. N Engl J Med. 2016;375:2423-2434', format: 'RCT · PDF', tags: ['房颤合并PCI'], updatedAt: '2026-08-11' },
  { id: 'xa-l5', brandId: 'xarelto', category: 'literature', title: 'Rivaroxaban in NVAF patients with moderate renal impairment (ROCKET AF subanalysis)', summary: 'CrCl 30–49 mL/min 患者使用 15 mg 每日一次，疗效与安全性与总体人群一致。', meta: 'Fox KAA, et al. Eur Heart J. 2011;32:2387-2394', format: '亚组分析 · PDF', tags: ['肾功能', '剂量'], updatedAt: '2026-07-19' },
  { id: 'xa-k1', brandId: 'xarelto', category: 'knowledge', title: '房颤剂量速查卡', summary: 'CrCl ≥50 mL/min：20 mg qd；CrCl 15–49 mL/min：15 mg qd；需随餐服用。附肾功能复核时点建议。', meta: '医学部 · 已审批', format: '知识卡片', tags: ['剂量', '高频使用'], updatedAt: '2026-10-15' },
  { id: 'xa-k2', brandId: 'xarelto', category: 'knowledge', title: '常见临床问题 FAQ（20 问）', summary: '漏服处理、围手术期停药、与抗血小板联用、高龄低体重患者等问题的标准回答口径。', meta: '医学部 · 已审批', format: 'Word · 12 页', tags: ['FAQ', '标准口径'], updatedAt: '2026-09-26' },
  { id: 'xa-k3', brandId: 'xarelto', category: 'knowledge', title: '合规表述清单', summary: '可用与禁用表述对照：避免“最安全”“首选”等绝对化用语，同类比较须基于同一研究。', meta: '合规部 · 2026 版', format: '清单', tags: ['合规', '必读'], updatedAt: '2026-09-12' },
  { id: 'xa-k4', brandId: 'xarelto', category: 'knowledge', title: '说明书要点摘录', summary: '适应证、用法用量、禁忌、特殊人群用药与药物相互作用的关键段落摘录。', meta: '注册部 · 最新说明书', format: 'PDF', tags: ['说明书'], updatedAt: '2026-06-30' },

  // 可申达
  { id: 'ke-s1', brandId: 'kerendia', category: 'strategy', title: '2026 可申达品牌策略：CKD 合并 T2D 心肾双重保护', summary: '在 RASi、SGLT-2i 基础上，确立非奈利酮作为“第三支柱”的沟通主线。', meta: '品牌组 · 年度策略 V1.4', format: 'PPT · 24 页', tags: ['年度策略'], updatedAt: '2026-10-18' },
  { id: 'ke-s2', brandId: 'kerendia', category: 'strategy', title: '核心信息屋：心肾获益 · 抗炎抗纤维化 · 血钾可管理', summary: '三大支柱信息及其对应证据、可用表述。', meta: '品牌组 · 已审批', format: 'PDF · 5 页', tags: ['Message House'], updatedAt: '2026-09-15' },
  { id: 'ke-l1', brandId: 'kerendia', category: 'literature', title: 'Effect of Finerenone on Chronic Kidney Disease Outcomes in Type 2 Diabetes (FIDELIO-DKD)', summary: '非奈利酮显著降低 CKD 合并 T2D 患者肾脏复合终点及心血管复合终点风险。', meta: 'Bakris GL, et al. N Engl J Med. 2020;383:2219-2229', format: 'RCT · PDF', tags: ['关键Ⅲ期研究', '高频引用'], updatedAt: '2026-10-02' },
  { id: 'ke-l2', brandId: 'kerendia', category: 'literature', title: 'Cardiovascular Events with Finerenone in Kidney Disease and Type 2 Diabetes (FIGARO-DKD)', summary: '心血管复合终点风险降低，主要由心衰住院减少驱动。', meta: 'Pitt B, et al. N Engl J Med. 2021;385:2252-2263', format: 'RCT · PDF', tags: ['心血管结局'], updatedAt: '2026-09-18' },
  { id: 'ke-l3', brandId: 'kerendia', category: 'literature', title: 'FIDELITY pooled analysis', summary: '汇总 FIDELIO-DKD 与 FIGARO-DKD 共 13,026 例患者的心肾结局。', meta: 'Agarwal R, et al. Eur Heart J. 2022;43:474-484', format: '汇总分析 · PDF', tags: ['汇总分析'], updatedAt: '2026-08-30' },
  { id: 'ke-l4', brandId: 'kerendia', category: 'literature', title: 'KDIGO 2022 Clinical Practice Guideline for Diabetes Management in CKD', summary: '推荐 eGFR ≥25、血钾正常且尿白蛋白升高的 T2D 合并 CKD 患者使用非甾体类 MRA。', meta: 'KDIGO. Kidney Int. 2022;102(5S):S1-S127', format: '指南 · PDF', tags: ['国际指南'], updatedAt: '2026-07-12' },
  { id: 'ke-k1', brandId: 'kerendia', category: 'knowledge', title: '血钾监测与剂量调整流程', summary: '起始剂量按 eGFR 选择 10 mg 或 20 mg，第 4 周复查血钾后按流程上调或暂停。', meta: '医学部 · 已审批', format: '知识卡片', tags: ['剂量', '安全性'], updatedAt: '2026-10-10' },
  { id: 'ke-k2', brandId: 'kerendia', category: 'knowledge', title: '甾体与非甾体 MRA 差异要点', summary: '结构、组织分布、受体结合方式与高钾风险差异的标准讲解口径。', meta: '医学部 · 已审批', format: 'Word · 4 页', tags: ['机制', '标准口径'], updatedAt: '2026-09-01' },
  { id: 'ke-k3', brandId: 'kerendia', category: 'knowledge', title: '合规表述清单', summary: '心肾获益表述需注明研究人群与终点，不得外推至非糖尿病 CKD。', meta: '合规部 · 2026 版', format: '清单', tags: ['合规', '必读'], updatedAt: '2026-08-20' },

  // 艾力雅
  { id: 'ey-s1', brandId: 'eylea', category: 'strategy', title: '2026 艾力雅品牌策略：更长给药间隔', summary: '以“更少注射、视力持久”为主线，覆盖 nAMD 与 DME 两大适应证。', meta: '品牌组 · 年度策略 V1.2', format: 'PPT · 20 页', tags: ['年度策略'], updatedAt: '2026-10-12' },
  { id: 'ey-l1', brandId: 'eylea', category: 'literature', title: 'Intravitreal Aflibercept (VEGF Trap-Eye) in Wet Age-related Macular Degeneration (VIEW 1 & 2)', summary: '每 8 周给药方案视力获益非劣效于雷珠单抗每月给药。', meta: 'Heier JS, et al. Ophthalmology. 2012;119:2537-2548', format: 'RCT · PDF', tags: ['关键Ⅲ期研究'], updatedAt: '2026-09-10' },
  { id: 'ey-l2', brandId: 'eylea', category: 'literature', title: 'Intravitreal Aflibercept for Diabetic Macular Edema: 100-Week Results From VISTA and VIVID', summary: 'DME 患者 100 周视力改善持续优于激光治疗。', meta: 'Brown DM, et al. Ophthalmology. 2015;122:2044-2052', format: 'RCT · PDF', tags: ['DME'], updatedAt: '2026-08-14' },
  { id: 'ey-l3', brandId: 'eylea', category: 'literature', title: 'Intravitreal aflibercept 8 mg in neovascular AMD (PULSAR)', summary: '8 mg 方案最长可延长至每 16 周给药，视力获益非劣效。', meta: 'Lanzetta P, et al. Lancet. 2024;403:1141-1152', format: 'RCT · PDF', tags: ['高剂量', '高频引用'], updatedAt: '2026-10-05' },
  { id: 'ey-k1', brandId: 'eylea', category: 'knowledge', title: 'T&E 给药方案讲解口径', summary: '治疗-延长（Treat & Extend）方案的随访节点与延长判断标准。', meta: '医学部 · 已审批', format: '知识卡片', tags: ['给药方案'], updatedAt: '2026-09-20' },
  { id: 'ey-k2', brandId: 'eylea', category: 'knowledge', title: '眼内注射安全性 FAQ', summary: '眼内炎、眼压升高等常见问题的标准回答。', meta: '医学部 · 已审批', format: 'Word · 6 页', tags: ['FAQ', '安全性'], updatedAt: '2026-08-02' },

  // 塞伐艾替尼
  { id: 'se-s1', brandId: 'sevabertinib', category: 'strategy', title: '上市前医学沟通策略：HER2 突变 NSCLC', summary: '聚焦 HER2 突变检测率提升与口服靶向治疗的未满足需求。', meta: '医学事务 · 草案 V0.9', format: 'PPT · 18 页', tags: ['上市前', '医学沟通'], updatedAt: '2026-09-28' },
  { id: 'se-l1', brandId: 'sevabertinib', category: 'literature', title: 'SOHO-01：HER2 突变晚期 NSCLC 的Ⅰ/Ⅱ期研究', summary: '经治及初治 HER2 突变患者中观察到较高客观缓解率，安全性可管理。', meta: '会议摘要 · 医学部整理', format: '研究摘要 · PDF', tags: ['关键研究'], updatedAt: '2026-09-15' },
  { id: 'se-l2', brandId: 'sevabertinib', category: 'literature', title: 'NCCN 非小细胞肺癌临床实践指南（2025）HER2 相关章节', summary: '推荐对晚期 NSCLC 开展包括 HER2 在内的广泛分子检测。', meta: 'NCCN Guidelines. NSCLC. 2025', format: '指南 · PDF', tags: ['国际指南'], updatedAt: '2026-08-08' },
  { id: 'se-k1', brandId: 'sevabertinib', category: 'knowledge', title: 'HER2 突变检测路径', summary: 'NGS 检测时机、样本类型与报告解读要点。', meta: '医学部 · 已审批', format: '知识卡片', tags: ['分子检测'], updatedAt: '2026-09-02' },
  { id: 'se-k2', brandId: 'sevabertinib', category: 'knowledge', title: '上市前沟通合规边界', summary: '上市前仅限医学交流，禁止任何推广性表述。', meta: '合规部 · 2026 版', format: '清单', tags: ['合规', '必读'], updatedAt: '2026-08-15' },
];

export const BRAND_KB_SLIDES: BrandKbItem[] = [
  { id: 'xa-p1', brandId: 'xarelto', category: 'strategy', title: '上海真实世界数据：房颤负担随年龄显著上升', summary: '按年龄分层的房颤患病率柱状图，适合作为疾病负担开场页。', meta: '来自《房颤卒中预防：从风险识别到剂量管理》第 3 页', format: '16:9 单页', tags: ['疾病负担'], updatedAt: '2026-10-20', previewUrl: xareltoAfSlideUrl(3) },
  { id: 'xa-p2', brandId: 'xarelto', category: 'strategy', title: '卒中风险分层：从房颤诊断走向危险因素组合', summary: 'CHA₂DS₂-VASc 风险因素拆解，引导进入抗凝决策。', meta: '来自《房颤卒中预防：从风险识别到剂量管理》第 5 页', format: '16:9 单页', tags: ['风险评估'], updatedAt: '2026-10-20', previewUrl: xareltoAfSlideUrl(5) },
  { id: 'xa-p3', brandId: 'xarelto', category: 'strategy', title: '指南定位：多数非瓣膜性房颤优先考虑NOAC', summary: '中外指南推荐对照，强调 NOAC 优先地位。', meta: '来自《房颤卒中预防：从风险识别到剂量管理》第 9 页', format: '16:9 单页', tags: ['指南'], updatedAt: '2026-10-20', previewUrl: xareltoAfSlideUrl(9) },
  { id: 'xa-p4', brandId: 'xarelto', category: 'strategy', title: 'ROCKET AF：卒中和体循环栓塞预防达到非劣效', summary: '主要疗效终点结果页，含 HR 与 95% CI。', meta: '来自《房颤卒中预防：从风险识别到剂量管理》第 12 页', format: '16:9 单页', tags: ['ROCKET AF'], updatedAt: '2026-10-20', previewUrl: xareltoAfSlideUrl(12) },
  { id: 'xa-p5', brandId: 'xarelto', category: 'strategy', title: '剂量判断以CrCl为核心', summary: '以 CrCl 为核心的剂量判断流程，避免按年龄或单项化验直接减量。', meta: '来自《房颤卒中预防：从风险识别到剂量管理》第 26 页', format: '16:9 单页', tags: ['剂量'], updatedAt: '2026-10-20', previewUrl: xareltoAfSlideUrl(26) },
  { id: 'xa-p6', brandId: 'xarelto', category: 'strategy', title: '产品简处页：拜瑞妥®（利伐沙班）房颤剂量与关键信息汇总', summary: '所有对外 PPT 必须附带的产品简处页。', meta: '来自《房颤卒中预防：从风险识别到剂量管理》第 31 页', format: '16:9 单页', tags: ['必备页', '合规'], updatedAt: '2026-10-20', previewUrl: xareltoAfSlideUrl(31) },
  { id: 'ke-p1', brandId: 'kerendia', category: 'strategy', title: 'FIDELIO-DKD 主要终点结果页', summary: '肾脏复合终点 Kaplan-Meier 曲线与 HR。', meta: '来自《可申达 G1-2 期临床数据汇总》第 6 页', format: '16:9 单页', tags: ['FIDELIO-DKD'], updatedAt: '2026-10-02' },
  { id: 'ke-p2', brandId: 'kerendia', category: 'strategy', title: 'CKD 合并 T2D 治疗三支柱', summary: 'RASi + SGLT-2i + 非奈利酮联合方案示意页。', meta: '来自《可申达 G1-2 期临床数据汇总》第 11 页', format: '16:9 单页', tags: ['治疗路径'], updatedAt: '2026-10-02' },
  { id: 'ey-p1', brandId: 'eylea', category: 'strategy', title: 'nAMD Meta 分析：抗 VEGF 治疗初治患者', summary: '系统评价封面页，适合学术会议开场。', meta: '来自《EYLEA nAMD Meta 分析》第 1 页', format: '16:9 单页', tags: ['Meta 分析'], updatedAt: '2026-09-10', previewUrl: '/ppt-templates/eylea-namd-01.png' },
  { id: 'ey-p2', brandId: 'eylea', category: 'strategy', title: '视力获益对比页', summary: '各抗 VEGF 方案 BCVA 变化森林图。', meta: '来自《EYLEA nAMD Meta 分析》第 2 页', format: '16:9 单页', tags: ['疗效'], updatedAt: '2026-09-10', previewUrl: '/ppt-templates/eylea-namd-02.png' },
  { id: 'ey-p3', brandId: 'eylea', category: 'strategy', title: '注射次数与给药间隔对比页', summary: '展示更长给药间隔带来的治疗负担下降。', meta: '来自《EYLEA nAMD Meta 分析》第 3 页', format: '16:9 单页', tags: ['治疗负担'], updatedAt: '2026-09-10', previewUrl: '/ppt-templates/eylea-namd-03.png' },
  { id: 'se-p1', brandId: 'sevabertinib', category: 'strategy', title: 'HER2 突变 NSCLC 医学汇报封面', summary: '医学事务汇报标准封面版式。', meta: '来自《HER2 突变 NSCLC 医学汇报》第 1 页', format: '16:9 单页', tags: ['封面'], updatedAt: '2026-09-15', previewUrl: '/ppt-templates/her2-nsclc-01.png' },
  { id: 'se-p2', brandId: 'sevabertinib', category: 'strategy', title: '疾病背景与未满足需求', summary: 'HER2 突变发生率与现有治疗局限。', meta: '来自《HER2 突变 NSCLC 医学汇报》第 2 页', format: '16:9 单页', tags: ['疾病背景'], updatedAt: '2026-09-15', previewUrl: '/ppt-templates/her2-nsclc-02.png' },
  { id: 'se-p3', brandId: 'sevabertinib', category: 'strategy', title: 'SOHO-01 疗效数据页', summary: 'ORR、DoR 与 PFS 汇总。', meta: '来自《HER2 突变 NSCLC 医学汇报》第 3 页', format: '16:9 单页', tags: ['疗效'], updatedAt: '2026-09-15', previewUrl: '/ppt-templates/her2-nsclc-03.png' },
];

function escSvg(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function brandKbItemToPptSlide(item: BrandKbItem, page: number): PptSlide {
  const brand = BRAND_KB_BRANDS.find((entry) => entry.id === item.brandId);
  const url = item.previewUrl?.trim();
  if (url) {
    const href = escSvg(url);
    return {
      page,
      title: item.title,
      bullets: [item.summary],
      speakerNotes: item.summary,
      imageUrl: url,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1600 900"><image data-edit-id="el-bg" href="${href}" xlink:href="${href}" x="0" y="0" width="1600" height="900" preserveAspectRatio="xMidYMid meet"/></svg>`,
    };
  }
  const accent = brand?.accent || '#54B9F9';
  const title = escSvg(item.title);
  const summary = escSvg(item.summary);
  const brandName = escSvg(brand?.name || '品牌知识库');
  return {
    page,
    title: item.title,
    bullets: [item.summary],
    speakerNotes: item.summary,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
      <rect width="1600" height="900" fill="#f7fbff"/>
      <rect x="0" y="0" width="28" height="900" fill="${accent}"/>
      <text x="72" y="92" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="22" font-weight="700" fill="${accent}">${brandName} · 常用单页幻灯</text>
      <text x="72" y="210" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="42" font-weight="800" fill="#18334d">${title}</text>
      <text x="72" y="280" font-family="Microsoft YaHei, PingFang SC, sans-serif" font-size="24" fill="#536a80">${summary}</text>
    </svg>`,
  };
}
