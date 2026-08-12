/** 英文医药行业文献 Mock（检索文献演示） */

export type LiteratureAccess = 'free' | 'paid';

export interface LiteratureArticle {
  id: string;
  title: string;
  publisher: string;
  year: number;
  abstract: string;
  access: LiteratureAccess;
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
    sourceUrl: 'https://www.thelancet.com/journals/landia/home',
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
    sourceUrl: 'https://academic.oup.com/ndt',
    journalAbbr: 'Nephrol Dial Transplant',
  },
  {
    id: 'lit-uacr-screening-2025',
    title: 'Urine Albumin-to-Creatinine Ratio Screening Uptake in Primary Care: Barriers and Opportunity Sizing',
    publisher: 'JAMA Network Open',
    year: 2025,
    abstract:
      'A cross-sectional analysis of primary care networks quantifies gaps in UACR screening among adults with diabetes or hypertension. Low screening rates were associated with fragmented lab workflows and limited clinician prompts. The authors outline operational levers—order sets, patient reminders, and panel reviews—that may increase guideline-concordant monitoring.',
    access: 'free',
    sourceUrl: 'https://jamanetwork.com/journals/jamanetworkopen',
    journalAbbr: 'JAMA Netw Open',
  },
  {
    id: 'lit-cardiorenal-pathway-2024',
    title: 'Integrated Cardiorenal Care Pathways: From Risk Stratification to Continuous Follow-up',
    publisher: 'Circulation',
    year: 2024,
    abstract:
      'This state-of-the-art review maps cardiorenal syndrome phenotypes to staged care models spanning endocrinology, nephrology, and cardiology. It highlights shared decision-making tools, adherence supports, and documentation practices that keep educational materials aligned with approved claims and local formulary constraints.',
    access: 'paid',
    sourceUrl: 'https://www.ahajournals.org/journal/circ',
    journalAbbr: 'Circulation',
  },
  {
    id: 'lit-patient-education-ckd-2022',
    title: 'Health Literacy–Adapted Patient Education for Chronic Kidney Disease: A Randomized Controlled Trial',
    publisher: 'American Journal of Kidney Diseases',
    year: 2022,
    abstract:
      'Adults with CKD stages 1–3 were randomized to standard education versus a literacy-adapted package emphasizing risk factors, monitoring cadence, and when to seek care. The adapted materials improved knowledge scores and self-reported monitoring intent at 12 weeks, without increasing anxiety scores, supporting use in disease-education campaigns.',
    access: 'free',
    sourceUrl: 'https://www.ajkd.org/',
    journalAbbr: 'Am J Kidney Dis',
  },
  {
    id: 'lit-rwe-kidney-2023',
    title: 'Real-World Effectiveness of Kidney-Protective Therapies: Insights from Multi-Country Registries',
    publisher: 'Kidney International',
    year: 2023,
    abstract:
      'Registry analyses across Europe and North America assess uptake and outcomes of kidney-protective therapies in routine practice. Heterogeneity in initiation timing and discontinuation rates suggests that educational content for HCPs should stress monitoring plans and adverse-event counseling alongside efficacy narratives.',
    access: 'paid',
    sourceUrl: 'https://www.kidney-international.org/',
    journalAbbr: 'Kidney Int',
  },
  {
    id: 'lit-mlr-claims-2024',
    title: 'Evidence Traceability in Medical Communications: Linking Claims to Primary Sources in Omnichannel Content',
    publisher: 'Therapeutic Innovation & Regulatory Science',
    year: 2024,
    abstract:
      'The paper proposes a practical framework for mapping promotional and educational claims to primary literature, study limitations, and local labeling. Case examples from metabolic and renal portfolios illustrate how modular claim libraries reduce rework during MLR review while preserving scientific accuracy.',
    access: 'free',
    sourceUrl: 'https://link.springer.com/journal/43441',
    journalAbbr: 'Ther Innov Regul Sci',
  },
  {
    id: 'lit-adherence-diabetes-ckd-2021',
    title: 'Medication Adherence Interventions in Diabetic Kidney Disease: A Meta-Analysis of Behavioral Strategies',
    publisher: 'Diabetes Care',
    year: 2021,
    abstract:
      'Pooling trials of reminder systems, pharmacist counseling, and digital coaching, this meta-analysis estimates modest but significant gains in adherence among adults with diabetic kidney disease. Subgroup analyses suggest multimodal interventions outperform single-channel reminders, informing patient-facing education design.',
    access: 'paid',
    sourceUrl: 'https://diabetesjournals.org/care',
    journalAbbr: 'Diabetes Care',
  },
];

export function searchLiteratureMock(_query?: string): LiteratureArticle[] {
  // Demo: return a stable ranked subset; query reserved for future filtering.
  return MOCK_LITERATURE_ARTICLES;
}
