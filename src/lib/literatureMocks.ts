/** 医药行业文献 Mock（检索文献演示） */

export type LiteratureAccess = 'free' | 'paid';
export type LiteratureSource = 'PubMed' | 'CMS' | '万方医学' | 'CNKI';

export interface LiteratureArticle {
  id: string;
  title: string;
  publisher: string;
  year: number;
  abstract: string;
  access: LiteratureAccess;
  source: LiteratureSource;
  sourceUrl: string;
  journalAbbr?: string;
}

export const MOCK_LITERATURE_ARTICLES: LiteratureArticle[] = [
  {
    id: 'lit-sglt2-ckd-2024',
    title:
      'SGLT2 Inhibitors and Kidney Outcomes in Type 2 Diabetes with Chronic Kidney Disease: A Systematic Review',
    publisher: 'The Lancet Diabetes & Endocrinology',
    year: 2024,
    abstract:
      'This systematic review synthesizes randomized evidence on SGLT2 inhibitors for renal and cardiovascular outcomes in adults with type 2 diabetes and CKD. Across included trials, SGLT2 inhibition reduced the risk of kidney disease progression and heart failure hospitalization, with a consistent safety profile regarding genital infections and volume-related adverse events. Findings support earlier consideration of SGLT2 inhibitors in multidisciplinary CKD care pathways.',
    access: 'free',
    source: 'PubMed',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    journalAbbr: 'Lancet Diabetes Endocrinol',
  },
  {
    id: 'lit-egfr-trajectory-2023',
    title: 'eGFR Trajectories and Clinical Decision-Making in Early-Stage CKD: Implications for HCP Communication',
    publisher: 'Nephrology Dialysis Transplantation',
    year: 2023,
    abstract:
      'Using longitudinal cohort data, the authors characterize eGFR decline patterns in G1–G2 CKD and evaluate how trajectory-based framing improves clinician–patient discussions. The study proposes practical talking points for specialty and primary care visits, emphasizing early risk recognition without overstating treatment effects beyond labeled indications.',
    access: 'free',
    source: 'PubMed',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    journalAbbr: 'Nephrol Dial Transplant',
  },
  {
    id: 'lit-cms-claims-2026',
    title: 'Approved Claims Library: Cardiorenal Education Modules for China Marketing (2026 Q2)',
    publisher: 'CMS Medical Content Vault',
    year: 2026,
    abstract:
      '内部已审批的心肾疾病教育模块，覆盖早期识别、指标解读与随访沟通口径。可用于公众与 HCP 渠道内容生产，所有声明均可追溯至获批资料，避免超出适应症或疗效承诺。',
    access: 'free',
    source: 'CMS',
    sourceUrl: '#cms-vault',
    journalAbbr: 'CMS Vault',
  },
  {
    id: 'lit-cms-hcp-card-2025',
    title: 'HCP 拜访核心信息卡：慢性肾脏病早期管理要点',
    publisher: 'CMS Approved Assets',
    year: 2025,
    abstract:
      '面向医学联络与内容运营的结构化信息卡，包含患者识别、关键指标与合规提示。适用于科室会与一对一拜访材料延展，需保持与当前获批版本一致。',
    access: 'free',
    source: 'CMS',
    sourceUrl: '#cms-vault',
    journalAbbr: 'CMS',
  },
  {
    id: 'lit-wanfang-ckd-2024',
    title: '2型糖尿病合并慢性肾脏病患者早期筛查路径的真实世界研究',
    publisher: '中华肾脏病杂志',
    year: 2024,
    abstract:
      '基于多中心门诊随访数据，分析 G1–G2 期患者 UACR 与 eGFR 联合筛查的落地情况。结果显示基层转诊路径不完善是主要缺口，建议在科普与医生教育材料中强调定期监测与多学科协作，而非疗效承诺。',
    access: 'paid',
    source: '万方医学',
    sourceUrl: 'https://med.wanfangdata.com.cn/',
    journalAbbr: '中华肾脏病杂志',
  },
  {
    id: 'lit-wanfang-af-2023',
    title: '房颤患者卒中预防的抗凝治疗依从性及其沟通策略',
    publisher: '中国循环杂志',
    year: 2023,
    abstract:
      '回顾性队列研究评估长期抗凝依从性与随访频次的关系，并提出面向心内科医师的沟通框架：风险识别、监测计划与不良反应咨询应同时出现在教育材料中。',
    access: 'free',
    source: '万方医学',
    sourceUrl: 'https://med.wanfangdata.com.cn/',
    journalAbbr: '中国循环杂志',
  },
  {
    id: 'lit-cnki-health-literacy-2022',
    title: '慢性肾脏病健康素养导向的患者教育材料效果评价',
    publisher: '中国全科医学',
    year: 2022,
    abstract:
      '随机对照试验比较标准宣教与健康素养适配材料，12 周知识得分与监测意愿均有提升，焦虑评分无显著增加。提示公众渠道内容宜降低术语密度并给出明确就医建议。',
    access: 'free',
    source: 'CNKI',
    sourceUrl: 'https://www.cnki.net/',
    journalAbbr: '中国全科医学',
  },
  {
    id: 'lit-cnki-omnichannel-2024',
    title: '医药数字内容中的证据追溯与医学审查实践',
    publisher: '中国新药杂志',
    year: 2024,
    abstract:
      '总结全渠道内容生产中将声明映射到原始文献与说明书的方法，并以代谢和肾脏产品组合为例，说明模块化口径库如何降低医学审查返工。',
    access: 'paid',
    source: 'CNKI',
    sourceUrl: 'https://www.cnki.net/',
    journalAbbr: '中国新药杂志',
  },
];

let searchRound = 0;

export function searchLiteratureMock(query?: string, options?: { reshuffle?: boolean }): LiteratureArticle[] {
  if (options?.reshuffle) searchRound += 1;
  const q = (query || '').trim().toLowerCase();
  const filtered = q
    ? MOCK_LITERATURE_ARTICLES.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.publisher.toLowerCase().includes(q) ||
          item.source.toLowerCase().includes(q) ||
          item.abstract.toLowerCase().includes(q)
      )
    : [...MOCK_LITERATURE_ARTICLES];
  const pool = filtered.length ? filtered : [...MOCK_LITERATURE_ARTICLES];
  const offset = searchRound % pool.length;
  return [...pool.slice(offset), ...pool.slice(0, offset)];
}
