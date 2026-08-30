/** 医药行业文献 Mock（检索文献演示） */

export type LiteratureAccess = 'free' | 'paid';
export type LiteratureSource = 'PubMed' | 'CMS' | '万方医学' | 'CNKI' | '个人知识收藏';
export type LiteratureScope = 'cms' | 'personal' | 'external';

export const LITERATURE_SCOPE_OPTIONS: { id: LiteratureScope; label: string }[] = [
  { id: 'cms', label: 'CMS' },
  { id: 'personal', label: '个人知识收藏' },
  { id: 'external', label: '外部知识库' },
];

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
  scope?: LiteratureScope;
  /** CMS 优质素材，选中 CMS 范围时优先置顶 */
  premium?: boolean;
}

export function inferLiteratureScope(article: LiteratureArticle): LiteratureScope {
  if (article.scope) return article.scope;
  if (article.source === 'CMS') return 'cms';
  if (article.source === '个人知识收藏') return 'personal';
  return 'external';
}

export function literatureScopeLabel(scopes: LiteratureScope[]): string {
  if (scopes.length === LITERATURE_SCOPE_OPTIONS.length) return '全部范围';
  if (scopes.length === 0) return '未选范围';
  return LITERATURE_SCOPE_OPTIONS.filter((option) => scopes.includes(option.id))
    .map((option) => option.label)
    .join('、');
}

const CURATED_LITERATURE_ARTICLES: LiteratureArticle[] = [
  {
    id: 'lit-cms-hf-playbook-2025',
    title: '心衰规范化管理沟通材料：射血分数分层与随访节奏',
    publisher: 'CMS',
    year: 2025,
    abstract:
      '面向医学联络与内容运营的心衰沟通口径，覆盖 HFrEF / HFmrEF / HFpEF 分层解释、随访节奏与依从性提醒。材料已完成医学与合规复核，可用于科室会与一对一拜访延展，声明均可追溯至获批资料。',
    access: 'free',
    source: 'CMS',
    sourceUrl: '#cms-vault',
    journalAbbr: 'CMS',
    scope: 'cms',
    premium: true,
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
    scope: 'cms',
    premium: true,
  },
  {
    id: 'lit-personal-hf-notes-2025',
    title: '心衰患者随访沟通笔记（个人摘录）',
    publisher: '个人知识收藏',
    year: 2025,
    abstract:
      '整理自近期科室会与拜访纪要：射血分数分层话术、随访间隔建议，以及患者依从性常见疑问。仅供当前任务参考，使用时请与获批口径核对。',
    access: 'free',
    source: '个人知识收藏',
    sourceUrl: '#personal-collection',
    journalAbbr: '个人知识收藏',
    scope: 'personal',
  },
  {
    id: 'lit-sglt2-meta-zh-2025',
    title: 'SGLT2 抑制剂在慢性肾脏病人群中的肾脏结局荟萃分析',
    publisher: 'Nephrology Dialysis Transplantation',
    year: 2025,
    abstract:
      '纳入 12 项随机对照试验，评估 SGLT2 抑制剂对 eGFR 下降斜率、肾脏复合终点与心衰住院的影响。结果显示肾脏结局获益方向一致，安全性信号以生殖道感染与容量相关不良事件为主。',
    access: 'paid',
    source: 'PubMed',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
    journalAbbr: 'Nephrol Dial Transplant',
    scope: 'external',
  },
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
    scope: 'external',
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
    scope: 'external',
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
    scope: 'cms',
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
    scope: 'external',
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
    scope: 'external',
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
    scope: 'external',
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
    scope: 'external',
  },
];

const EXTRA_LITERATURE_TOPICS = [
  '高血压',
  '2型糖尿病',
  '慢性心力衰竭',
  '慢性肾脏病',
  '房颤',
  '血脂异常',
  '支气管哮喘',
  '肿瘤免疫治疗',
  '骨质疏松',
  '偏头痛',
  '痛风',
  '癫痫',
  '帕金森病',
  '阿尔茨海默病',
  '慢性阻塞性肺疾病',
] as const;

const EXTRA_LITERATURE_SOURCES: {
  source: LiteratureSource;
  scope: LiteratureScope;
  publisher: string;
  journalAbbr: string;
  sourceUrl: string;
}[] = [
  { source: 'CMS', scope: 'cms', publisher: 'CMS', journalAbbr: 'CMS', sourceUrl: '#cms-vault' },
  {
    source: '个人知识收藏',
    scope: 'personal',
    publisher: '个人知识收藏',
    journalAbbr: '个人知识收藏',
    sourceUrl: '#personal-collection',
  },
  {
    source: 'PubMed',
    scope: 'external',
    publisher: 'Journal of Medical Communication',
    journalAbbr: 'J Med Commun',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/',
  },
  {
    source: '万方医学',
    scope: 'external',
    publisher: '中华医学杂志',
    journalAbbr: '中华医学杂志',
    sourceUrl: 'https://med.wanfangdata.com.cn/',
  },
  {
    source: 'CNKI',
    scope: 'external',
    publisher: '中国医学科学院学报',
    journalAbbr: '中国医学科学院学报',
    sourceUrl: 'https://www.cnki.net/',
  },
];

export const MOCK_LITERATURE_ARTICLES: LiteratureArticle[] = [
  ...CURATED_LITERATURE_ARTICLES,
  ...buildExtraLiteratureArticles(),
];

function buildExtraLiteratureArticles(): LiteratureArticle[] {
  return EXTRA_LITERATURE_TOPICS.flatMap((topic, topicIndex) =>
    EXTRA_LITERATURE_SOURCES.map((source, sourceIndex) => {
      const index = topicIndex * EXTRA_LITERATURE_SOURCES.length + sourceIndex + 1;
      const year = 2020 + ((topicIndex + sourceIndex) % 7);
      const premium = source.scope === 'cms' && topicIndex % 4 === 0;
      return {
        id: `lit-extra-${index}`,
        title: `${topic}医学沟通与临床证据综述（${year}）`,
        publisher: source.publisher,
        year,
        abstract: `整理${topic}相关医学证据、随访管理与合规口径，覆盖患者识别、关键指标解读及医学专业人士沟通要点，便于内容生产时追溯声明来源。`,
        access: source.scope === 'external' && sourceIndex % 3 === 0 ? 'paid' : 'free',
        source: source.source,
        sourceUrl: source.sourceUrl,
        journalAbbr: source.journalAbbr,
        scope: source.scope,
        premium,
      };
    })
  );
}

let searchRound = 0;

function matchesLiteratureQuery(item: LiteratureArticle, query: string): boolean {
  if (!query) return true;
  return (
    item.title.toLowerCase().includes(query) ||
    item.publisher.toLowerCase().includes(query) ||
    item.source.toLowerCase().includes(query) ||
    item.abstract.toLowerCase().includes(query)
  );
}

export function searchLiteratureByScopes(query: string, scopes: LiteratureScope[]): LiteratureArticle[] {
  const q = query.trim().toLowerCase();
  if (!q || !scopes.length) return [];
  const includeCms = scopes.includes('cms');
  const scoped = MOCK_LITERATURE_ARTICLES.filter((item) => scopes.includes(inferLiteratureScope(item)));
  const list = scoped.filter((item) => matchesLiteratureQuery(item, q));
  if (!includeCms) return list;
  return [...list].sort((a, b) => {
    const aRank = a.premium && inferLiteratureScope(a) === 'cms' ? 0 : 1;
    const bRank = b.premium && inferLiteratureScope(b) === 'cms' ? 0 : 1;
    return aRank - bRank;
  });
}

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
