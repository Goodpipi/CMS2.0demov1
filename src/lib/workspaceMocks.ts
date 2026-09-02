import type { ArticleOutline, OutlineRefImage, PptDesignVersion, PptOutline, PptSlide } from '@/types/content';

function refImg(url: string, caption: string, cites?: number[]): OutlineRefImage {
  return { url, caption, alt: caption, cites };
}

function slideSvg(title: string, subtitle: string, index: number, accent: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540">
    <defs>
      <linearGradient id="bg${index}" x1="0" x2="1" y1="0" y2="1">
        <stop stop-color="#f7fbff"/>
        <stop offset="1" stop-color="#f5f0fa"/>
      </linearGradient>
    </defs>
    <rect width="960" height="540" fill="url(#bg${index})"/>
    <rect x="0" y="0" width="26" height="540" fill="${accent}"/>
    <circle cx="846" cy="86" r="92" fill="${accent}" opacity=".12"/>
    <circle cx="870" cy="470" r="150" fill="#8AD329" opacity=".08"/>
    <text x="72" y="82" font-family="Arial,Microsoft YaHei,sans-serif" font-size="18" font-weight="700" fill="${accent}">BAYER · 医学内容</text>
    <text x="72" y="188" font-family="Arial,Microsoft YaHei,sans-serif" font-size="42" font-weight="800" fill="#18334d">${title}</text>
    <text x="72" y="244" font-family="Arial,Microsoft YaHei,sans-serif" font-size="22" fill="#536a80">${subtitle}</text>
    <rect x="72" y="314" width="610" height="2" fill="${accent}" opacity=".35"/>
    <text x="72" y="372" font-family="Arial,Microsoft YaHei,sans-serif" font-size="18" fill="#60758a">• 以循证信息为基础，保持专业、清晰、可追溯</text>
    <text x="72" y="414" font-family="Arial,Microsoft YaHei,sans-serif" font-size="18" fill="#60758a">• 内容仅用于疾病教育，需经内部合规审核</text>
    <text x="892" y="504" text-anchor="end" font-family="Arial,sans-serif" font-size="16" fill="#8aa0b3">0${index}</text>
  </svg>`;
}

function slideSvgEnglish(title: string, subtitle: string, index: number, accent: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540">
    <defs>
      <linearGradient id="enBg${index}" x1="0" x2="1" y1="0" y2="1">
        <stop stop-color="#f7fbff"/>
        <stop offset="1" stop-color="#f5f0fa"/>
      </linearGradient>
    </defs>
    <rect width="960" height="540" fill="url(#enBg${index})"/>
    <rect x="0" y="0" width="26" height="540" fill="${accent}"/>
    <circle cx="846" cy="86" r="92" fill="${accent}" opacity=".12"/>
    <circle cx="870" cy="470" r="150" fill="#8AD329" opacity=".08"/>
    <text x="72" y="82" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="${accent}">BAYER · MEDICAL CONTENT</text>
    <text x="72" y="188" font-family="Arial,sans-serif" font-size="36" font-weight="800" fill="#18334d">${title}</text>
    <text x="72" y="244" font-family="Arial,sans-serif" font-size="21" fill="#536a80">${subtitle}</text>
    <rect x="72" y="314" width="610" height="2" fill="${accent}" opacity=".35"/>
    <text x="72" y="372" font-family="Arial,sans-serif" font-size="17" fill="#60758a">• Evidence-based, professional, clear and traceable communication</text>
    <text x="72" y="414" font-family="Arial,sans-serif" font-size="17" fill="#60758a">• For disease education only; subject to internal compliance review</text>
    <text x="892" y="504" text-anchor="end" font-family="Arial,sans-serif" font-size="16" fill="#8aa0b3">0${index}</text>
  </svg>`;
}

function slideSvgTemplateStyle(
  title: string,
  subtitle: string,
  index: number,
  accent: string,
  english = false
): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540">
    <defs>
      <linearGradient id="templateBg${index}" x1="0" x2="1" y1="0" y2="1">
        <stop stop-color="#0d4050"/>
        <stop offset=".58" stop-color="#126277"/>
        <stop offset="1" stop-color="#19849a"/>
      </linearGradient>
      <linearGradient id="templateAccent${index}" x1="0" x2="1">
        <stop stop-color="${accent}"/>
        <stop offset="1" stop-color="#f2c14e"/>
      </linearGradient>
    </defs>
    <rect width="960" height="540" fill="url(#templateBg${index})"/>
    <circle cx="86" cy="80" r="150" fill="#fff" opacity=".05"/>
    <circle cx="180" cy="520" r="230" fill="${accent}" opacity=".13"/>
    <text x="64" y="78" font-family="Arial,Microsoft YaHei,sans-serif" font-size="17" font-weight="700" fill="#bce9ef">MEDICAL COMMUNICATION</text>
    <text x="64" y="230" font-family="Arial,sans-serif" font-size="112" font-weight="900" fill="#fff" opacity=".18">0${index}</text>
    <text x="64" y="278" font-family="Arial,Microsoft YaHei,sans-serif" font-size="18" font-weight="700" fill="#fff">${english ? 'BRAND MEDICAL CONTENT' : '品牌医学内容'}</text>
    <rect x="304" y="52" width="600" height="436" rx="28" fill="#fff"/>
    <rect x="338" y="86" width="118" height="7" rx="3.5" fill="url(#templateAccent${index})"/>
    <text x="338" y="172" font-family="Arial,Microsoft YaHei,sans-serif" font-size="${english ? 25 : 34}" font-weight="900" fill="#12384a">${title}</text>
    <text x="338" y="218" font-family="Arial,Microsoft YaHei,sans-serif" font-size="20" fill="#617785">${subtitle}</text>
    <rect x="338" y="270" width="524" height="58" rx="16" fill="#eaf7f8"/>
    <circle cx="368" cy="299" r="12" fill="${accent}"/>
    <text x="394" y="306" font-family="Arial,Microsoft YaHei,sans-serif" font-size="${english ? 14 : 16}" fill="#244c5b">${english ? 'Evidence-based, professional, clear and traceable' : '循证信息为基础，表达专业、清晰、可追溯'}</text>
    <rect x="338" y="344" width="524" height="58" rx="16" fill="#fff7e5"/>
    <circle cx="368" cy="373" r="12" fill="#f2b84b"/>
    <text x="394" y="380" font-family="Arial,Microsoft YaHei,sans-serif" font-size="${english ? 14 : 16}" fill="#5c4b28">${english ? 'For disease education; subject to compliance review' : '疾病教育用途，内容需经内部合规审核'}</text>
    <text x="862" y="456" text-anchor="end" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#8ba0aa">PAGE 0${index}</text>
  </svg>`;
}

export const WORKSPACE_MOCK_PPT_OUTLINE: PptOutline = {
  title: '慢性肾脏病患者全程管理与早期干预',
  audience: 'HCP 与医学内容团队',
  scenario: '医学沟通与内部培训',
  chapters: [
    {
      id: 'mock-outline-cover',
      title: '封面',
      kind: 'cover',
      pages: [
        {
          id: 'mock-page-cover',
          title: '慢性肾脏病患者全程管理与早期干预',
          bullets: [],
          kind: 'cover',
          speakerNotes: '开场出示封面标题，明确本次沟通主题。',
          visualSuggestion: '封面大标题居中，副标题与品牌色条，右下角合规提示。',
          references: [],
          referencedImages: [refImg('/demo-assets/Poster_Result_01.PNG', 'CKD 学术会议主视觉参考')],
        },
      ],
    },
    {
      id: 'mock-outline-toc',
      title: '目录',
      kind: 'toc',
      pages: [
        {
          id: 'mock-page-toc',
          title: '目录',
          bullets: ['疾病负担与未满足需求', '早期识别与规范管理', '沟通建议与行动计划'],
          kind: 'toc',
          visualSuggestion: '目录列表，按节列出后续章节标题。',
          references: [],
        },
      ],
    },
    {
      id: 'mock-outline-1',
      title: '疾病负担与未满足需求',
      kind: 'section',
      pages: [
        {
          id: 'mock-page-1-title',
          title: '疾病负担与未满足需求',
          bullets: [
            '本章为章节标题页',
            '本节主题：疾病负担与未满足需求',
            '用于开启新一节，后续页面展开具体要点',
          ],
          kind: 'section-title',
          speakerNotes: '本节开场，先点明疾病负担与未满足需求。',
          visualSuggestion: '全幅章节标题页：大标题居中，可配一句导语与品牌色条，不要堆叠正文要点。',
          references: [],
        },
        {
          id: 'mock-page-1',
          title: '慢性肾脏病的疾病负担',
          bullets: ['患者数量持续增长', '早期症状不明显', '公众认知与筛查率仍需提升'],
          bulletCites: [[1], [1, 2], [2]],
          kind: 'content',
          speakerNotes: '开场建立疾病教育背景，不使用绝对化或疗效承诺表述。',
          visualSuggestion: '左侧三项疾病负担要点，右侧用简易趋势图示意患者规模上升，底部保留合规脚注。',
          references: [
            'Lancet Diabetes Endocrinol, 2024, 12(6): 412-414. SGLT2 inhibitors and kidney outcomes.',
            '中华肾脏病杂志, 2024, 40(3): 18-19. 早期筛查路径真实世界研究.',
          ],
          referencedImages: [
            refImg('/other/vegf-pathway.svg', '肾脏相关通路示意', [1]),
            refImg('/demo-assets/CaseCard_Result_01.PNG', 'CKD 合并代谢风险病例卡', [2]),
          ],
        },
        {
          id: 'mock-page-2',
          title: '当前管理中的关键挑战',
          bullets: ['高风险人群识别不足', '长期随访依从性有限', '多学科协作仍有提升空间'],
          bulletCites: [[1], [1], []],
          kind: 'content',
          visualSuggestion: '三栏挑战卡片，每栏配小图标，避免使用绝对化疗效表述。',
          references: ['Nephrol Dial Transplant, 2023, 38(6): 1104-1112. eGFR trajectories and HCP communication.'],
          referencedImages: [refImg('/image-templates/radimetrics.png', '剂量与指标管理视觉参考', [1])],
        },
      ],
    },
    {
      id: 'mock-outline-2',
      title: '早期识别与规范管理',
      kind: 'section',
      pages: [
        {
          id: 'mock-page-2-title',
          title: '早期识别与规范管理',
          bullets: [
            '本章为章节标题页',
            '本节主题：早期识别与规范管理',
            '用于开启新一节，后续页面展开具体要点',
          ],
          kind: 'section-title',
          speakerNotes: '本节开场，先点明早期识别与规范管理。',
          visualSuggestion: '全幅章节标题页：大标题居中，可配一句导语与品牌色条，不要堆叠正文要点。',
          references: [],
        },
        {
          id: 'mock-page-3',
          title: '识别高风险人群',
          bullets: ['关注糖尿病和高血压人群', '定期评估肾功能相关指标', '结合个体情况制定随访计划'],
          bulletCites: [[1], [1], []],
          kind: 'content',
          visualSuggestion: '漏斗图：高风险人群 → 指标评估 → 个体化随访。',
          references: ['JAMA Netw Open, 2025, 8(2): 3-7. UACR screening uptake in primary care.'],
          referencedImages: [
            refImg('/image-templates/confidence-talk.png', '随访沟通视觉参考', [1]),
            refImg('/other/her2-signaling.svg', '风险识别机制示意'),
          ],
        },
        {
          id: 'mock-page-4',
          title: '患者全程管理路径',
          bullets: ['风险评估', '生活方式教育', '规范诊疗与持续随访'],
          bulletCites: [[1], [1], [1]],
          kind: 'content',
          visualSuggestion: '横向四步路径图，步骤用品牌绿色节点串联。',
          references: ['Circulation, 2024, 149(4): 221-229. Integrated cardiorenal care pathways.'],
          referencedImages: [refImg('/other/platelet-antithrombotic.svg', '全程管理路径示意图', [1])],
        },
      ],
    },
    {
      id: 'mock-outline-3',
      title: '沟通建议与行动计划',
      kind: 'section',
      pages: [
        {
          id: 'mock-page-3-title',
          title: '沟通建议与行动计划',
          bullets: [
            '本章为章节标题页',
            '本节主题：沟通建议与行动计划',
            '用于开启新一节，后续页面展开具体要点',
          ],
          kind: 'section-title',
          speakerNotes: '本节开场，先点明沟通建议与行动计划。',
          visualSuggestion: '全幅章节标题页：大标题居中，可配一句导语与品牌色条，不要堆叠正文要点。',
          references: [],
        },
        {
          id: 'mock-page-5',
          title: '面向患者的沟通要点',
          bullets: ['使用易理解的表达', '强调定期检查的重要性', '有疑问时咨询专业医生'],
          bulletCites: [[1], [1], []],
          kind: 'content',
          visualSuggestion: '对话气泡式沟通要点，配患者教育插画，底部咨询医生提示。',
          references: ['Am J Kidney Dis, 2022, 79(3): 355-364. Health literacy–adapted patient education RCT.'],
          referencedImages: [refImg('/image-templates/afib-stroke.png', '患者教育海报参考', [1])],
        },
        {
          id: 'mock-page-6',
          title: '总结与下一步行动',
          bullets: ['提升风险认知', '推动早筛早诊', '建立持续管理意识'],
          bulletCites: [[1], [1], [1]],
          kind: 'content',
          visualSuggestion: '三步行动清单 + 结束页品牌色条，避免疗效承诺。',
          references: ['Ther Innov Regul Sci, 2024, 58(1): 88-94. Evidence traceability in medical communications.'],
          referencedImages: [refImg('/ppt-templates/eylea-namd-01.png', '总结页版式参考', [1])],
        },
      ],
    },
    {
      id: 'mock-outline-back',
      title: '封底',
      kind: 'back',
      pages: [
        {
          id: 'mock-page-back',
          title: '谢谢',
          bullets: [],
          kind: 'back',
          visualSuggestion: '封底致谢页，画面中央仅展示标题，底部品牌色条。',
          references: [],
        },
      ],
    },
  ],
};

const MOCK_SLIDES: PptSlide[] = [
  {
    page: 1,
    title: '慢性肾脏病患者全程管理',
    bullets: ['早期识别 · 规范管理 · 持续随访'],
    speakerNotes:
      '开场先明确沟通目标：帮助听众理解全程管理框架。可结合一句患者旅程引入，再过渡到本页主标题。',
    svg: slideSvg('慢性肾脏病患者全程管理', '早期识别 · 规范管理 · 持续随访', 1, '#54B9F9'),
  },
  {
    page: 2,
    title: '疾病负担与管理挑战',
    bullets: ['患者数量持续增长', '早期认知不足', '长期管理仍有提升空间'],
    speakerNotes:
      '用 1–2 个关键数据说明负担，随后落到“早期认知不足”这一可行动洞察，避免堆砌数字。',
    svg: slideSvg('疾病负担与管理挑战', '从风险认知到长期管理', 2, '#6FBD1F'),
  },
  {
    page: 3,
    title: '高风险人群识别',
    bullets: ['关注糖尿病和高血压人群', '定期评估相关指标', '制定随访计划'],
    speakerNotes:
      '强调识别标准与随访节奏，可举例说明何时转介或加强监测，提醒以获批资料为准。',
    svg: slideSvg('高风险人群识别', '把风险识别前移', 3, '#3B7FBF'),
  },
  {
    page: 4,
    title: '患者全程管理路径',
    bullets: ['风险评估', '疾病教育', '规范诊疗', '持续随访'],
    speakerNotes:
      '按路径四步口头串讲，每步给出一句可落地动作，结尾预告下一页行动建议。',
    svg: slideSvg('患者全程管理路径', '连接评估、教育、诊疗与随访', 4, '#8AD329'),
  },
];

export const WORKSPACE_MOCK_PPT: PptDesignVersion = {
  id: 'workspace-mock-ppt',
  name: '医学沟通方案',
  styleTag: '品牌蓝紫 · 专业',
  description: '内置 Mock PPT，可在部署后离线展示',
  slides: MOCK_SLIDES,
  coverDataUrl: `data:image/svg+xml,${encodeURIComponent(MOCK_SLIDES[0].svg || '')}`,
  fileName: '慢性肾脏病患者全程管理-Mock.pptx',
};

export const WORKSPACE_MOCK_PPT_OUTLINE_EN: PptOutline = {
  title: 'Integrated Management and Early Intervention for Chronic Kidney Disease',
  audience: 'Healthcare professionals and medical content teams',
  scenario: 'Medical communication and internal training',
  chapters: [
    {
      id: 'mock-outline-en-1',
      title: 'Disease Burden and Unmet Needs',
      pages: [
        {
          id: 'mock-page-en-1',
          title: 'The Burden of Chronic Kidney Disease',
          bullets: ['A growing patient population', 'Early symptoms may be subtle', 'Awareness and screening remain limited'],
          bulletCites: [[1], [1], [1]],
          visualSuggestion: 'Left: three burden points. Right: simple trend chart of patient scale.',
          references: ['Lancet Diabetes Endocrinol, 2024, 12(6): 412-418. SGLT2 inhibitors and kidney outcomes.'],
          referencedImages: [
            { url: '/other/vegf-pathway.svg', caption: 'Kidney pathway schematic', alt: 'Kidney pathway schematic', cites: [1] },
            { url: '/demo-assets/CaseCard_Result_01.PNG', caption: 'CKD case card reference', alt: 'CKD case card reference', cites: [1] },
          ],
        },
        {
          id: 'mock-page-en-2',
          title: 'Key Challenges in Current Management',
          bullets: ['Insufficient identification of high-risk groups', 'Limited long-term adherence', 'Opportunities for multidisciplinary collaboration'],
          bulletCites: [[1], [1], []],
          visualSuggestion: 'Three challenge cards with small icons, avoid absolute efficacy claims.',
          references: ['Nephrol Dial Transplant, 2023, 38(6): 1104-1112. eGFR trajectories and HCP communication.'],
          referencedImages: [{ url: '/image-templates/radimetrics.png', caption: 'Metrics management visual', alt: 'Metrics management visual', cites: [1] }],
        },
      ],
    },
    {
      id: 'mock-outline-en-2',
      title: 'Early Identification and Standardized Management',
      pages: [
        {
          id: 'mock-page-en-3',
          title: 'Identifying High-Risk Populations',
          bullets: ['Focus on people with diabetes or hypertension', 'Assess kidney-related indicators regularly', 'Develop individualized follow-up plans'],
          bulletCites: [[1], [1], []],
          visualSuggestion: 'Funnel: high-risk groups → indicator assessment → individualized follow-up.',
          references: ['JAMA Netw Open, 2025, 8(2): 3-7. UACR screening uptake in primary care.'],
          referencedImages: [
            { url: '/image-templates/confidence-talk.png', caption: 'Follow-up communication visual', alt: 'Follow-up communication visual', cites: [1] },
          ],
        },
        {
          id: 'mock-page-en-4',
          title: 'The Integrated Patient Management Pathway',
          bullets: ['Risk assessment', 'Disease education', 'Standardized care', 'Continuous follow-up'],
          bulletCites: [[1], [1], [1], [1]],
          visualSuggestion: 'Four-step horizontal pathway with branded green nodes.',
          references: ['Circulation, 2024, 149(4): 221-229. Integrated cardiorenal care pathways.'],
          referencedImages: [{ url: '/other/platelet-antithrombotic.svg', caption: 'Care pathway schematic', alt: 'Care pathway schematic', cites: [1] }],
        },
      ],
    },
  ],
};

const MOCK_SLIDES_EN: PptSlide[] = [
  {
    page: 1,
    title: 'Integrated Management of Chronic Kidney Disease',
    bullets: ['Early identification · Standardized management · Continuous follow-up'],
    svg: slideSvgEnglish(
      'Integrated Management of Chronic Kidney Disease',
      'Early identification · Standardized management · Continuous follow-up',
      1,
      '#54B9F9'
    ),
  },
  {
    page: 2,
    title: 'Disease Burden and Management Challenges',
    bullets: ['A growing patient population', 'Limited early awareness', 'Opportunities to improve long-term management'],
    svg: slideSvgEnglish(
      'Disease Burden and Management Challenges',
      'From risk awareness to long-term management',
      2,
      '#6FBD1F'
    ),
  },
  {
    page: 3,
    title: 'Identifying High-Risk Populations',
    bullets: ['Focus on diabetes and hypertension', 'Assess relevant indicators regularly', 'Develop follow-up plans'],
    svg: slideSvgEnglish(
      'Identifying High-Risk Populations',
      'Moving risk identification earlier',
      3,
      '#3B7FBF'
    ),
  },
  {
    page: 4,
    title: 'Integrated Patient Management Pathway',
    bullets: ['Risk assessment', 'Disease education', 'Standardized care', 'Continuous follow-up'],
    svg: slideSvgEnglish(
      'Integrated Patient Management Pathway',
      'Connecting assessment, education, care and follow-up',
      4,
      '#8AD329'
    ),
  },
];

export const WORKSPACE_MOCK_PPT_EN: PptDesignVersion = {
  id: 'workspace-mock-ppt-en',
  name: 'Medical Communication Plan · English',
  styleTag: 'Brand blue and purple · Professional',
  description: 'Hardcoded English Mock PPT available in deployed environments',
  slides: MOCK_SLIDES_EN,
  coverDataUrl: `data:image/svg+xml,${encodeURIComponent(MOCK_SLIDES_EN[0].svg || '')}`,
  fileName: 'Integrated-CKD-Management-Mock-EN.pptx',
};

const MOCK_SLIDES_TEMPLATE_STYLE: PptSlide[] = [
  {
    page: 1,
    title: '慢性肾脏病患者全程管理',
    bullets: ['早期识别 · 规范管理 · 持续随访'],
    svg: slideSvgTemplateStyle(
      '慢性肾脏病患者全程管理',
      '早期识别 · 规范管理 · 持续随访',
      1,
      '#27b3a2'
    ),
  },
  {
    page: 2,
    title: '疾病负担与管理挑战',
    bullets: ['患者数量持续增长', '早期认知不足', '长期管理仍有提升空间'],
    svg: slideSvgTemplateStyle(
      '疾病负担与管理挑战',
      '从风险认知到长期管理',
      2,
      '#4c9fe0'
    ),
  },
  {
    page: 3,
    title: '高风险人群识别',
    bullets: ['关注糖尿病和高血压人群', '定期评估相关指标', '制定随访计划'],
    svg: slideSvgTemplateStyle(
      '高风险人群识别',
      '把风险识别前移',
      3,
      '#8b6ed1'
    ),
  },
  {
    page: 4,
    title: '患者全程管理路径',
    bullets: ['风险评估', '疾病教育', '规范诊疗', '持续随访'],
    svg: slideSvgTemplateStyle(
      '患者全程管理路径',
      '连接评估、教育、诊疗与随访',
      4,
      '#e36b83'
    ),
  },
];

export const WORKSPACE_MOCK_PPT_RESTYLED: PptDesignVersion = {
  id: 'workspace-mock-ppt-template-style',
  name: '现代医学信息卡模板',
  styleTag: '深青渐变 · 信息卡布局',
  description: '参考模板生成的硬编码换肤版 PPT',
  slides: MOCK_SLIDES_TEMPLATE_STYLE,
  coverDataUrl: `data:image/svg+xml,${encodeURIComponent(
    MOCK_SLIDES_TEMPLATE_STYLE[0].svg || ''
  )}`,
  fileName: '慢性肾脏病患者全程管理-模板换肤版.pptx',
};

const MOCK_SLIDES_TEMPLATE_STYLE_EN: PptSlide[] = [
  {
    page: 1,
    title: 'Integrated Management of Chronic Kidney Disease',
    bullets: ['Early identification · Standardized management · Continuous follow-up'],
    svg: slideSvgTemplateStyle(
      'Integrated Management of Chronic Kidney Disease',
      'Early identification · Standardized management · Continuous follow-up',
      1,
      '#27b3a2',
      true
    ),
  },
  {
    page: 2,
    title: 'Disease Burden and Management Challenges',
    bullets: ['A growing patient population', 'Limited early awareness', 'Long-term management opportunities'],
    svg: slideSvgTemplateStyle(
      'Disease Burden and Management Challenges',
      'From risk awareness to long-term management',
      2,
      '#4c9fe0',
      true
    ),
  },
  {
    page: 3,
    title: 'Identifying High-Risk Populations',
    bullets: ['Focus on diabetes and hypertension', 'Assess relevant indicators regularly', 'Develop follow-up plans'],
    svg: slideSvgTemplateStyle(
      'Identifying High-Risk Populations',
      'Moving risk identification earlier',
      3,
      '#8b6ed1',
      true
    ),
  },
  {
    page: 4,
    title: 'Integrated Patient Management Pathway',
    bullets: ['Risk assessment', 'Disease education', 'Standardized care', 'Continuous follow-up'],
    svg: slideSvgTemplateStyle(
      'Integrated Patient Management Pathway',
      'Connecting assessment, education, care and follow-up',
      4,
      '#e36b83',
      true
    ),
  },
];

export const WORKSPACE_MOCK_PPT_RESTYLED_EN: PptDesignVersion = {
  id: 'workspace-mock-ppt-template-style-en',
  name: 'Modern Medical Information Card · English',
  styleTag: 'Deep teal gradient · Information card layout',
  description: 'Hardcoded English restyled PPT based on the reference template',
  slides: MOCK_SLIDES_TEMPLATE_STYLE_EN,
  coverDataUrl: `data:image/svg+xml,${encodeURIComponent(
    MOCK_SLIDES_TEMPLATE_STYLE_EN[0].svg || ''
  )}`,
  fileName: 'Integrated-CKD-Management-Template-Style-EN.pptx',
};

export const WORKSPACE_MOCK_ARTICLE_OUTLINE: ArticleOutline = {
  title: '病例解读：CKD 合并代谢风险患者管理',
  chapters: [
    {
      id: 'article-ch-1',
      title: '患者概况',
      core:
        '女性，58 岁。2 型糖尿病病史 9 年，近期体检提示 eGFR 下降。主诉乏力、夜尿增多，对肾脏健康风险认知不足，既往未建立规律的肾功能随访。',
      coreCites: [1],
      imageUrl: '/demo-assets/CaseCard_Result_01.PNG',
      imageAlt: 'CKD 合并代谢风险病例配图',
      tmsh:
        'T：糖尿病病程较长时，肾功能指标变化不能只当一次体检结果\nM：症状不突出不等于肾脏风险消失\nS：eGFR 下降提示需把肾脏随访纳入既有慢病管理\nH：先讲清当前指标意义，再给出下次复查动作',
      references: ['中华肾脏病杂志, 2024, 40(3): 18. 早期筛查路径真实世界研究.'],
      referencedImages: [
        { url: '/other/vegf-pathway.svg', caption: '肾功能指标解读示意', alt: '肾功能指标解读示意', cites: [1] },
        { url: '/image-templates/radimetrics.png', caption: '指标随访视觉参考', alt: '指标随访视觉参考', cites: [1] },
      ],
    },
    {
      id: 'article-ch-2',
      title: '关键指标',
      core:
        '年龄 / 性别：58 岁，女性。糖尿病病程 9 年。eGFR 较前下降，提示需关注慢性肾脏病进展风险。代谢风险因素并存，需结合血糖、血压与体重综合评估。',
      coreCites: [1],
      imageUrl: '/other/vegf-pathway.svg',
      imageAlt: '关键指标示意',
      tmsh:
        'T：把 eGFR、UACR 与代谢指标放在同一张随访清单里\nM：肾脏保护不能只盯单一数值\nS：血糖、血压、体重都会影响肾脏预后\nH：列出需要持续记录的检查结果',
      references: ['Nephrol Dial Transplant, 2023, 38(6): 1106. eGFR trajectories and HCP communication.'],
      referencedImages: [
        { url: '/other/her2-signaling.svg', caption: '多指标综合评估示意', alt: '多指标综合评估示意', cites: [1] },
      ],
    },
    {
      id: 'article-ch-3',
      title: '临床解读',
      core:
        '该患者处于糖尿病长期管理阶段，近期出现肾功能指标变化，提示不能仅以“症状不明显”判断风险高低。乏力与夜尿增多可能与血糖控制、肾功能变化或生活方式有关，需要把肾脏指标纳入既有慢病随访。',
      coreCites: [1],
      imageUrl: '/other/her2-signaling.svg',
      imageAlt: '临床解读机制示意',
      tmsh:
        'T：早期肾脏损伤信号应被识别，而不是等症状明显再处理\nM：孤立体检结果要转成可追踪的临床信号\nS：关注 eGFR 与 UACR 的变化趋势\nH：说明为何需要把肾脏指标纳入常规随访',
      references: ['Lancet Diabetes Endocrinol, 2024, 12(6): 415. SGLT2 inhibitors and kidney outcomes.'],
      referencedImages: [
        { url: '/other/retina-cnv.svg', caption: '早期损伤信号示意', alt: '早期损伤信号示意', cites: [1] },
        { url: '/image-templates/confidence-talk.png', caption: '临床沟通视觉参考', alt: '临床沟通视觉参考', cites: [1] },
      ],
    },
    {
      id: 'article-ch-4',
      title: '管理思路',
      core:
        '建立肾功能指标的长期监测计划；围绕血糖、血压、体重与生活方式综合管理；向患者说明“症状稳定不等于风险消失”；指标继续异常或出现水肿、尿液明显改变时及时复诊。',
      coreCites: [1],
      imageUrl: '/image-templates/confidence-talk.png',
      imageAlt: '随访管理沟通示意',
      tmsh:
        'T：管理目标是可执行的随访，而不是一次性宣教\nM：综合管理优于单指标干预\nS：复查节奏、生活方式与复诊指征要一起讲清\nH：给出下次复查时间和预警信号',
      references: ['KDIGO 2024 CKD Guideline, pp. 45-47. Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease.'],
      referencedImages: [
        { url: '/other/platelet-antithrombotic.svg', caption: '综合管理路径示意', alt: '综合管理路径示意', cites: [1] },
      ],
    },
    {
      id: 'article-ch-5',
      title: '专家点评',
      core:
        '张三教授：把“体检发现 eGFR 下降”转成需要持续追踪的临床信号。李四副主任医师：血糖管理与肾脏保护不能分开讨论，门诊沟通应把复查节奏和复诊指征讲清楚。',
      coreCites: [1, 2],
      imageUrl: '/demo-assets/Poster_Result_01.PNG',
      imageAlt: '专家点评配图',
      tmsh:
        'T：专家视角强调早期随访窗口\nM：代谢管理与肾脏保护必须同屏出现\nS：即使症状不突出，也应尽早纳入 eGFR、UACR 随访\nH：帮助患者理解长期随访的意义',
      references: [
        '中华肾脏病杂志, 2024, 40(3): 21. 早期筛查路径真实世界研究.',
        'KDIGO 2024 CKD Guideline, pp. 52-53. Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease.',
      ],
      referencedImages: [
        { url: '/image-templates/afib-stroke.png', caption: '专家点评配图参考', alt: '专家点评配图参考', cites: [1] },
        { url: '/official/bayer-beijing-campus.png', caption: '学术交流场景参考', alt: '学术交流场景参考', cites: [2] },
      ],
    },
  ],
  references: [
    'Lancet Diabetes Endocrinol, 2024, 12(6): 412-418. SGLT2 inhibitors and kidney outcomes.',
    '中华肾脏病杂志, 2024, 40(3): 18-24. 早期筛查路径真实世界研究.',
    'Nephrol Dial Transplant, 2023, 38(6): 1104-1112. eGFR trajectories and HCP communication.',
    'KDIGO 2024 CKD Guideline, pp. 45-52. Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease.',
  ],
};

export const WORKSPACE_MOCK_LONG_IMAGE_OUTLINE: ArticleOutline = {
  title: 'CKD 合并代谢风险患者管理要点长图',
  chapters: WORKSPACE_MOCK_ARTICLE_OUTLINE.chapters.map((chapter) => ({
    ...chapter,
    id: chapter.id.replace('article-ch', 'longimg-ch'),
  })),
  references: [...WORKSPACE_MOCK_ARTICLE_OUTLINE.references],
};

export const WORKSPACE_MOCK_RICH_TEXT = `
  <h1>病例解读：CKD 合并代谢风险患者管理</h1>
  <p class="rich-text-lead">本解读用于学术沟通演示，围绕一例 2 型糖尿病合并肾功能下降的门诊患者，梳理关键指标、风险识别与随访管理思路。</p>
  <figure class="rich-text-figure" contenteditable="false">
    <img src="/demo-assets/CaseCard_Result_01.PNG" alt="CKD 合并代谢风险病例配图" />
  </figure>
  <h2>一、患者概况</h2>
  <p>女性，58 岁。2 型糖尿病病史 9 年，近期体检提示 eGFR 下降。主诉乏力、夜尿增多，对肾脏健康风险认知不足，既往未建立规律的肾功能随访。</p>
  <h2>二、关键指标</h2>
  <ul>
    <li><strong>年龄 / 性别：</strong>58 岁，女性。</li>
    <li><strong>糖尿病病程：</strong>9 年。</li>
    <li><strong>肾功能趋势：</strong>eGFR 较前下降，提示需关注慢性肾脏病进展风险。</li>
    <li><strong>伴随情况：</strong>代谢风险因素并存，需结合血糖、血压与体重综合评估。</li>
  </ul>
  <h2>三、临床解读</h2>
  <p>该患者处于糖尿病长期管理阶段，近期出现肾功能指标变化，提示不能仅以“症状不明显”判断风险高低。乏力与夜尿增多可能与血糖控制、肾功能变化或生活方式有关，需要把肾脏指标纳入既有慢病随访，而不是作为单次体检的孤立结果。</p>
  <p>解读重点在于：识别早期肾脏损伤信号、明确需要持续监测的指标（如 eGFR、UACR），并评估代谢因素是否同时影响肾脏预后。</p>
  <h2>四、管理思路</h2>
  <ul>
    <li>建立肾功能指标的长期监测计划，关注 eGFR 与 UACR 变化趋势。</li>
    <li>围绕血糖、血压、体重与生活方式进行综合管理，避免只盯单一指标。</li>
    <li>向患者说明“症状稳定不等于风险消失”，提高随访依从性。</li>
    <li>如指标继续异常或出现水肿、尿液明显改变等情况，应及时复诊并请专科评估。</li>
  </ul>
  <h2>五、沟通要点</h2>
  <p>与患者沟通时，建议先讲清当前指标变化的意义，再给出可执行的随访动作：下次复查时间、需要记录的检查结果，以及出现哪些情况需要提前就诊。本解读用于医学教育交流，不替代临床诊疗判断。</p>
  <h2>六、专家点评</h2>
  <p><strong>张三 教授｜北京**医科大学 肾脏内科</strong><br/>该病例的核心价值，在于把“体检发现 eGFR 下降”从一次性结果，转成需要持续追踪的临床信号。对糖尿病病程较长的患者，即使症状不突出，也应尽早把 eGFR、UACR 纳入常规随访，避免错过早期干预窗口。</p>
  <p><strong>李四 副主任医师｜北京**医院 糖尿病专病门诊</strong><br/>从代谢管理角度看，本例提醒我们：血糖管理与肾脏保护不能分开讨论。门诊沟通中，建议把复查节奏、生活方式调整和复诊指征讲清楚，帮助患者理解长期随访的意义，而不是只关注单次化验数值。</p>
  <p class="rich-text-disclaimer">仅供医学专业人士学术交流  ·  不构成诊疗建议  ·  不用于对公众宣传</p>
`;

export function isGenerateScriptIntent(text: string): boolean {
  const t = text.replace(/\s+/g, '');
  return /生成话术|帮我生成话术|话术总结|做一份话术|写一份话术/i.test(t);
}

export function buildMockScriptSummary(productName = '优思明'): string {
  return `${productName} 科室拜访话术总结

一、开场（30 秒）
老师您好，感谢抽出时间。今天想用 3 分钟对齐 ${productName} 在门诊沟通中的核心口径，方便后续随访时表述一致。

二、核心信息
1. 先确认患者需求与当前治疗路径，再引入 ${productName} 的获批适应症与使用场景，避免一上来讲产品。
2. 强调个体化评估：适应症、禁忌、合并用药与随访节奏需要一并说清。
3. 把“为什么选、怎么用、何时复查”讲成一条线，便于医生转述给患者或下级医生。

三、推荐沟通结构
• 患者是谁：年龄、生育计划、周期相关主诉、合并疾病。
• 当前方案：正在使用的方法、依从性、不满意点。
• 方案选择：${productName} 适合放在哪一类患者路径中讨论。
• 随访安排：下次复诊时间、需要观察的不适与复查项目。

四、常见问题回应
Q：和现有方案比，沟通重点是什么？
A：重点不是比较疗效口号，而是把获批信息、适用人群和随访要求讲清楚，让科室口径可追溯。

Q：患者最常问什么？
A：怎么吃、漏服怎么办、哪些情况需要提前复诊。建议用说明书与科室常规随访话术回答，不自行承诺效果。

Q：如何避免过度宣传？
A：只用获批适应症和说明书信息，不延伸未批准用途，不对公众渠道做疗效承诺。

五、收尾
今天对齐的是沟通结构，不是处方建议。如需，我可以把这份话术导出为 Word，方便科室内部培训使用。

合规提醒
仅供医学专业人士学术交流，不构成诊疗建议，不用于对公众宣传。使用前请与获批说明书及内部合规口径核对。`;
}

const MOCK_IMAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1125">
  <defs>
    <linearGradient id="mockImageBg" x1="0" x2="1" y1="0" y2="1">
      <stop stop-color="#edf8ff"/>
      <stop offset=".55" stop-color="#f8f4ff"/>
      <stop offset="1" stop-color="#fff2f6"/>
    </linearGradient>
    <linearGradient id="mockImageAccent" x1="0" x2="1">
      <stop stop-color="#54B9F9"/>
      <stop offset=".52" stop-color="#6FBD1F"/>
      <stop offset="1" stop-color="#8AD329"/>
    </linearGradient>
  </defs>
  <rect width="900" height="1125" fill="url(#mockImageBg)"/>
  <circle cx="760" cy="130" r="180" fill="#54B9F9" opacity=".12"/>
  <circle cx="110" cy="990" r="220" fill="#8AD329" opacity=".1"/>
  <rect x="58" y="54" width="784" height="1017" rx="54" fill="#fff" stroke="#dbe8f3" stroke-width="2"/>
  <rect x="94" y="92" width="712" height="18" rx="9" fill="url(#mockImageAccent)"/>
  <text x="112" y="188" font-family="Arial,Microsoft YaHei,sans-serif" font-size="28" font-weight="700" fill="#3B7FBF">BAYER · 患者教育</text>
  <text x="112" y="296" font-family="Arial,Microsoft YaHei,sans-serif" font-size="60" font-weight="900" fill="#18334d">守护肾脏健康</text>
  <text x="112" y="366" font-family="Arial,Microsoft YaHei,sans-serif" font-size="31" fill="#536a80">从了解风险开始</text>
  <g transform="translate(130 445)">
    <rect width="640" height="128" rx="32" fill="#edf7ff"/>
    <circle cx="72" cy="64" r="34" fill="#54B9F9"/>
    <text x="58" y="76" font-family="Arial,sans-serif" font-size="34" font-weight="800" fill="#fff">1</text>
    <text x="132" y="58" font-family="Arial,Microsoft YaHei,sans-serif" font-size="28" font-weight="800" fill="#20445f">关注高风险因素</text>
    <text x="132" y="92" font-family="Arial,Microsoft YaHei,sans-serif" font-size="19" fill="#60758a">定期了解血糖、血压与肾功能状况</text>
  </g>
  <g transform="translate(130 600)">
    <rect width="640" height="128" rx="32" fill="#f4effa"/>
    <circle cx="72" cy="64" r="34" fill="#6FBD1F"/>
    <text x="58" y="76" font-family="Arial,sans-serif" font-size="34" font-weight="800" fill="#fff">2</text>
    <text x="132" y="58" font-family="Arial,Microsoft YaHei,sans-serif" font-size="28" font-weight="800" fill="#3f3560">保持健康生活方式</text>
    <text x="132" y="92" font-family="Arial,Microsoft YaHei,sans-serif" font-size="19" fill="#60758a">均衡饮食、适量运动并遵循专业建议</text>
  </g>
  <g transform="translate(130 755)">
    <rect width="640" height="128" rx="32" fill="#fff1f4"/>
    <circle cx="72" cy="64" r="34" fill="#8AD329"/>
    <text x="58" y="76" font-family="Arial,sans-serif" font-size="34" font-weight="800" fill="#fff">3</text>
    <text x="132" y="58" font-family="Arial,Microsoft YaHei,sans-serif" font-size="28" font-weight="800" fill="#693044">主动咨询专业医生</text>
    <text x="132" y="92" font-family="Arial,Microsoft YaHei,sans-serif" font-size="19" fill="#60758a">如有疑问或不适，及时寻求专业帮助</text>
  </g>
  <rect x="130" y="948" width="640" height="62" rx="31" fill="url(#mockImageAccent)"/>
  <text x="450" y="988" text-anchor="middle" font-family="Arial,Microsoft YaHei,sans-serif" font-size="19" font-weight="700" fill="#fff">疾病教育内容 · 不构成诊疗建议</text>
</svg>`;

export const WORKSPACE_MOCK_IMAGE = {
  title: '守护肾脏健康 · 患者教育图',
  dataUrl: `data:image/svg+xml,${encodeURIComponent(MOCK_IMAGE_SVG)}`,
};
