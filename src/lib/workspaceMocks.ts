import type { PptDesignVersion, PptOutline, PptSlide } from '@/types/content';

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
      id: 'mock-outline-1',
      title: '疾病负担与未满足需求',
      pages: [
        {
          id: 'mock-page-1',
          title: '慢性肾脏病的疾病负担',
          bullets: ['患者数量持续增长', '早期症状不明显', '公众认知与筛查率仍需提升'],
          speakerNotes: '开场建立疾病教育背景，不使用绝对化或疗效承诺表述。',
        },
        {
          id: 'mock-page-2',
          title: '当前管理中的关键挑战',
          bullets: ['高风险人群识别不足', '长期随访依从性有限', '多学科协作仍有提升空间'],
        },
      ],
    },
    {
      id: 'mock-outline-2',
      title: '早期识别与规范管理',
      pages: [
        {
          id: 'mock-page-3',
          title: '识别高风险人群',
          bullets: ['关注糖尿病和高血压人群', '定期评估肾功能相关指标', '结合个体情况制定随访计划'],
        },
        {
          id: 'mock-page-4',
          title: '患者全程管理路径',
          bullets: ['风险评估', '生活方式教育', '规范诊疗与持续随访'],
        },
      ],
    },
    {
      id: 'mock-outline-3',
      title: '沟通建议与行动计划',
      pages: [
        {
          id: 'mock-page-5',
          title: '面向患者的沟通要点',
          bullets: ['使用易理解的表达', '强调定期检查的重要性', '有疑问时咨询专业医生'],
        },
        {
          id: 'mock-page-6',
          title: '总结与下一步行动',
          bullets: ['提升风险认知', '推动早筛早诊', '建立持续管理意识'],
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
        },
        {
          id: 'mock-page-en-2',
          title: 'Key Challenges in Current Management',
          bullets: ['Insufficient identification of high-risk groups', 'Limited long-term adherence', 'Opportunities for multidisciplinary collaboration'],
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
        },
        {
          id: 'mock-page-en-4',
          title: 'The Integrated Patient Management Pathway',
          bullets: ['Risk assessment', 'Disease education', 'Standardized care', 'Continuous follow-up'],
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

export const WORKSPACE_MOCK_RICH_TEXT = `
  <h1>守护肾脏健康，从了解风险开始</h1>
  <p class="rich-text-lead">肾脏承担着过滤代谢废物、维持体液平衡等重要功能。很多早期变化并不明显，主动了解风险因素和定期检查尤为重要。</p>
  <h2>哪些人更需要关注肾脏健康？</h2>
  <ul>
    <li><strong>糖尿病或高血压人群：</strong>建议根据医生意见定期评估相关指标。</li>
    <li><strong>有肾脏疾病家族史的人群：</strong>可主动向专业医生咨询个体风险。</li>
    <li><strong>长期服用特定药物的人群：</strong>用药期间应遵循医嘱并关注肾功能。</li>
  </ul>
  <blockquote>没有明显不适，并不代表完全没有风险。早了解、早筛查，有助于做好长期健康管理。</blockquote>
  <h2>日常可以做些什么？</h2>
  <p>保持均衡饮食、合理控盐、适量运动，并按照专业建议管理血糖和血压。如出现水肿、尿液异常或持续乏力等情况，应及时咨询医生。</p>
  <div class="rich-text-callout"><strong>行动建议</strong><br/>记录近期检查结果与用药情况，在复诊时与医生充分沟通。</div>
  <p class="rich-text-disclaimer">本内容仅用于疾病教育，不构成诊疗建议。具体情况请咨询专业医疗人员。</p>
`;

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
