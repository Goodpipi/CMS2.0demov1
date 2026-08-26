import type { PptDesignVersion, PptOutline, PptSlide } from '@/types/content';

export type AcademicDemoStep =
  | 'idle'
  | 'await-scene'
  | 'await-format'
  | 'await-brief'
  | 'after-poster'
  | 'await-case-card'
  | 'complete';

export type PatientEducationVideoDemoStep =
  | 'idle'
  | 'await-video-choice'
  | 'script-ready'
  | 'video-ready';

export type HcpPptDemoStep =
  | 'idle'
  | 'hcp-await-scene'
  | 'hcp-await-requirements'
  | 'hcp-await-path'
  | 'hcp-outline-ready'
  | 'hcp-complete';

export type DemoScriptStep = AcademicDemoStep | PatientEducationVideoDemoStep | HcpPptDemoStep;

export const ACADEMIC_DEMO_BUTTONS = {
  scene: ['患者教育', 'HCP临床沟通', '学术传播会议', '品牌传播', '内部培训'],
  format: ['会议海报', '病例卡'],
  direct: ['直接生成'],
  posterNext: ['生成学术会议PPT', '生成病例卡', '生成新闻通稿'],
  caseNext: ['生成学术传播会议PPT', '生成患者教育视频', 'HCP临床沟通学术图卡'],
} as const;

export const ACADEMIC_DEMO_TEXT = {
  askScene: '当然可以。请问这张图片主要应用于什么场景？',
  askFormat: '好的，已识别应用场景为【学术传播会议】。\n请问您希望生成什么内容形式？',
  askBrief:
    '好的，已识别您的需求：\n应用场景：学术传播会议\n内容形式：会议海报\n\n为了生成更符合业务需求的内容，建议补充以下信息：\n• 视觉风格\n• 会议名称\n• 会议时间\n• 会议地点\n• 会议主题\n\n您可以补充以上信息，也可以直接生成。',
  posterGenerating:
    '已收到。我将结合：\n• 已上传素材\n• 您的要求\n\n为您生成会议海报。正在生成中……',
  posterDone:
    '会议海报已生成。请在右侧查看和编辑。\n\n您还可以继续：',
  caseGenerating:
    '好的，已识别您的需求：\n应用场景：学术传播会议\n内容形式：病例卡\n\n我将结合：\n• 已上传素材\n• 已上传图片的视觉风格\n\n为您生成病例卡。正在生成中……',
  caseDone:
    '病例卡已生成。您还可以继续：\n\n请问您下一步想生成什么内容？',
};

export const PATIENT_VIDEO_DEMO_BUTTONS = {
  firstChoice: ['视频脚本', '生成视频'],
  scriptReady: ['编辑脚本', '生成视频'],
  videoNext: ['什么是糖尿病', '一分钟看懂检查单', 'CKD患者饮食管理', '如何控制血糖'],
} as const;

export const PATIENT_VIDEO_DEMO_TEXT = {
  recognized:
    '好的，已识别您的需求：\n\n应用场景：患者教育\n内容形式：视频\n视频时长：10秒\n核心主题：糖尿病患者健康饮食\n\n请问先为您生成视频脚本还是直接生成视频？',
  scriptGenerating: '收到。\n\n正在为您生成视频脚本……',
  scriptDone: '视频脚本已生成。\n\n请在右侧查看或手动编辑。',
  videoGenerating: '正在为您生成视频，请稍后……',
  videoDone: '视频已生成，请在右侧进行查看。\n\n您还可以继续生成其他患者教育内容。',
};

export const HCP_PPT_DEMO_BUTTONS = {
  scene: ['HCP临床沟通', '学术传播会议', '内部培训'],
  direct: ['直接生成'],
  path: ['生成大纲', '生成PPT'],
  outlineDone: ['生成PPT'],
  done: ['更改配色', '更改PPT页数', '更改使用场景'],
} as const;

export const HCP_PPT_DEMO_TEXT = {
  askScene: '收到，当然可以。\n\n请问这份内容主要应用于什么场景？',
  askRequirements:
    '好的，已识别您的需求：\n\n应用场景：HCP临床沟通\n内容形式：PPT\n\n为了生成更符合业务需求的内容，建议补充以下信息：\n\n• 视觉风格\n• 章节数要求\n• 页数要求\n\n您可以补充以上信息，也可以直接生成。',
  askPath:
    '收到您的要求。\n\n请问是否需要先生成PPT大纲？\n\n您也可以选择直接生成PPT。',
  outlineGenerating: '正在为您生成大纲，请稍后……',
  outlineDone:
    '已为您生成大纲。\n\n请在右侧查看和编辑。\n\n您也可以继续生成PPT。',
  pptGenerating: '收到。\n\n正在根据您的要求为您生成PPT……',
  pptDone:
    'PPT已生成。\n\n请在右侧查看与编辑。\n\n您还可以继续提出修改要求，例如：\n\n• 更改配色\n• 更改PPT页数\n• 更改使用场景\n\n请直接输入您的修改需求。',
} as const;

export const PATIENT_EDUCATION_VIDEO_SCRIPT_01 = {
  title: 'Patient_Education_Video_Script_01',
  coverSuggestion: '小K形象作为CKD健康伙伴，蓝绿清新患者教育风格，适配小红书竖版短视频。',
  segments: [
    {
      time: '0:00-0:02',
      scene: '小K出场，字幕提示“糖尿病患者怎么吃更健康？”',
      narration: '大家好，我是小K，今天用10秒讲清糖尿病患者健康饮食。',
      compliance: '患者教育，不涉及治疗承诺',
    },
    {
      time: '0:02-0:05',
      scene: '餐盘三分区动画：蔬菜、优质蛋白、主食',
      narration: '第一，均衡搭配，多吃蔬菜和优质蛋白。',
      compliance: '生活方式建议',
    },
    {
      time: '0:05-0:07',
      scene: '米饭/面食份量缩小，出现“控制总量”提示',
      narration: '第二，控制主食总量，别让碳水超标。',
      compliance: '泛健康建议',
    },
    {
      time: '0:07-0:10',
      scene: '含糖饮料被替换为白水，结尾出现咨询医生提示',
      narration: '第三，减少或不喝含糖饮料。有疑问，请咨询专业医生。',
      compliance: '补充就医建议',
    },
  ],
};

const PATIENT_VIDEO_POSTER_01 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 1280">
  <defs>
    <linearGradient id="pvBg" x1="0" x2="1" y1="0" y2="1">
      <stop stop-color="#e9f8ff"/>
      <stop offset=".55" stop-color="#f4fff3"/>
      <stop offset="1" stop-color="#dff2ff"/>
    </linearGradient>
    <linearGradient id="pvCard" x1="0" x2="1">
      <stop stop-color="#103C8F"/>
      <stop offset="1" stop-color="#00A88E"/>
    </linearGradient>
  </defs>
  <rect width="720" height="1280" fill="url(#pvBg)"/>
  <circle cx="120" cy="140" r="170" fill="#69BE28" opacity=".13"/>
  <circle cx="640" cy="1040" r="220" fill="#1d6bff" opacity=".12"/>
  <rect x="48" y="52" width="624" height="1176" rx="44" fill="#fff" stroke="#cbe4f0" stroke-width="2"/>
  <rect x="78" y="84" width="564" height="132" rx="32" fill="url(#pvCard)"/>
  <text x="112" y="138" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="#fff">糖尿病患者健康饮食</text>
  <text x="112" y="182" font-family="Arial, sans-serif" font-size="20" fill="#e8fff8">10秒患者教育短视频 · 小红书竖版</text>
  <g transform="translate(225 280)">
    <circle cx="135" cy="135" r="126" fill="#eaf8ff" stroke="#9cd6e8" stroke-width="8"/>
    <circle cx="135" cy="104" r="45" fill="#ffe2bf"/>
    <path d="M58 242c15-68 51-102 77-102s62 34 77 102" fill="#103C8F"/>
    <path d="M92 92c20-40 75-43 96-2-16-10-33-12-51-8-18 4-32 8-45 10z" fill="#27435a"/>
    <text x="104" y="270" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#103C8F">小K</text>
  </g>
  <g font-family="Arial, sans-serif">
    <rect x="86" y="620" width="548" height="112" rx="28" fill="#f2fbff" stroke="#cbe4f0"/>
    <text x="124" y="670" font-size="28" font-weight="900" fill="#103C8F">1. 均衡搭配</text>
    <text x="124" y="708" font-size="21" fill="#536a80">多吃蔬菜和优质蛋白</text>
    <rect x="86" y="760" width="548" height="112" rx="28" fill="#f2fff6" stroke="#caead7"/>
    <text x="124" y="810" font-size="28" font-weight="900" fill="#008A78">2. 控制主食总量</text>
    <text x="124" y="848" font-size="21" fill="#536a80">关注碳水摄入，合理分配</text>
    <rect x="86" y="900" width="548" height="112" rx="28" fill="#fff8f2" stroke="#f1d7bd"/>
    <text x="124" y="950" font-size="28" font-weight="900" fill="#bd6b16">3. 少喝含糖饮料</text>
    <text x="124" y="988" font-size="21" fill="#536a80">优先选择白水或无糖饮品</text>
  </g>
  <rect x="132" y="1090" width="456" height="66" rx="33" fill="#103C8F"/>
  <polygon points="337,1110 337,1136 362,1123" fill="#fff"/>
  <text x="248" y="1200" font-family="Arial, sans-serif" font-size="18" fill="#60758a">请咨询专业医生，本文为疾病教育内容</text>
</svg>`;

export type AcademicDemoImageKind = 'poster' | 'case-card';

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const HCP_PPT_OUTLINE_01: PptOutline = {
  title: 'G1-2期T2D相关患者的肾脏保护价值',
  audience: 'HCP',
  scenario: 'HCP临床沟通',
  chapters: [
    {
      id: 'hcp-ch1',
      title: '临床沟通开场与患者定义',
      pages: [
        {
          id: 'hcp-p1',
          title: '封面：G1-2期T2D相关患者的肾脏保护价值',
          bullets: ['明确沟通对象为G1-2期T2D相关患者', '突出肾脏保护价值主线', '采用红白专业医学会议视觉'],
          speakerNotes: '用于开场建立主题和沟通边界。',
          visualSuggestion: '红白会议封面：主标题居中，副标题点明 G1-2 期沟通对象。',
          references: ['中华肾脏病杂志, 2024. 早期筛查路径真实世界研究.'],
        },
        {
          id: 'hcp-p2',
          title: '为什么G1-2期仍需关注肾脏保护',
          bullets: ['早期阶段仍存在长期肾功能下降风险', '风险识别应前置到指标变化之前', '强调早期管理的临床意义'],
          speakerNotes: '用风险趋势图帮助医生快速理解沟通背景。',
        },
      ],
    },
    {
      id: 'hcp-ch2',
      title: '关键临床数据与价值表达',
      pages: [
        {
          id: 'hcp-p3',
          title: 'G1-2期患者关键肾脏指标变化',
          bullets: ['用图表展示eGFR与UACR相关趋势', '突出相关数据观察点', '避免超出资料范围的疗效承诺'],
          speakerNotes: '以数据图表为主，减少大段文字。',
        },
        {
          id: 'hcp-p4',
          title: '肾脏保护价值的HCP沟通框架',
          bullets: ['患者识别：T2D合并早期肾脏风险', '数据支持：围绕指标趋势和研究观察', '管理建议：强调综合管理与持续随访'],
          speakerNotes: '便于销售或医学同事进行结构化讲解。',
        },
      ],
    },
    {
      id: 'hcp-ch3',
      title: '总结与合规提示',
      pages: [
        {
          id: 'hcp-p5',
          title: '总结：早期识别，持续管理，关注肾脏保护',
          bullets: ['G1-2期患者值得尽早识别和长期随访', '临床沟通应围绕证据、指标与患者管理', '请以获批资料和医生判断为准'],
          speakerNotes: '收束沟通并补充合规提示。',
        },
      ],
    },
  ],
};

function buildHcpPptImageSlides(): PptSlide[] {
  const pages = HCP_PPT_OUTLINE_01.chapters.flatMap((chapter) => chapter.pages);
  return pages.map((page, index) => {
    const pageNo = index + 1;
    return {
      page: pageNo,
      title: page.title.replace(/^封面：/, ''),
      bullets: page.bullets,
      speakerNotes: page.speakerNotes,
      imageUrl: `/demo-assets/hcp-ppt-slides/HCP_PPT_Result_01_${String(pageNo).padStart(2, '0')}.png`,
    };
  });
}

export const HCP_PPT_SLIDES_01 = buildHcpPptImageSlides();

export const HCP_PPT_RESULT_01: PptDesignVersion = {
  id: 'hcp-ppt-result-01',
  name: 'HCP_PPT_Result_01.pptx',
  styleTag: '红白配色 · HCP临床沟通',
  description: '',
  slides: HCP_PPT_SLIDES_01,
  coverDataUrl: '/demo-assets/hcp-ppt-slides/HCP_PPT_Result_01_01.png',
  fileUrl: '/demo-assets/%E5%8F%AF%E7%94%B3%E8%BE%BE_G1-2%E6%9C%9F%E4%B8%B4%E5%BA%8A%E6%95%B0%E6%8D%AE%E6%B1%87%E6%80%BB%20(3).pptx',
  fileName: 'G1-2期临床数据汇总 (3).pptx',
};

const POSTER_RESULT_01 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1520">
  <defs>
    <radialGradient id="core" cx="50%" cy="38%" r="46%">
      <stop offset="0" stop-color="#ff8a8a" stop-opacity=".95"/>
      <stop offset=".45" stop-color="#a81126" stop-opacity=".8"/>
      <stop offset="1" stop-color="#21030a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop stop-color="#24030c"/>
      <stop offset=".48" stop-color="#7b0b19"/>
      <stop offset="1" stop-color="#130209"/>
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="18" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="1080" height="1520" fill="url(#bg)"/>
  <rect width="1080" height="1520" fill="url(#core)" opacity=".9"/>
  <g opacity=".18" fill="none" stroke="#ffd1d1" stroke-width="2">
    <path d="M88 255c150 70 240-70 390 0s240 70 390 0"/>
    <path d="M94 335c150-70 240 70 390 0s240-70 390 0"/>
    <path d="M130 990h90l34-70 72 150 58-118h118l42-76 70 132h254"/>
    <circle cx="170" cy="520" r="54"/><circle cx="220" cy="616" r="24"/><circle cx="880" cy="430" r="74"/>
    <path d="M736 430l84-54 70 68-68 88zM148 742l92-36 52 82-92 44z"/>
  </g>
  <g opacity=".24" stroke="#ffb5b5" stroke-width="1.5">
    <path d="M110 1150C285 1015 437 1255 612 1120s280 86 380-54" fill="none"/>
    <path d="M114 1194C306 1080 400 1314 604 1196s284 64 374-18" fill="none"/>
  </g>
  <g filter="url(#glow)">
    <ellipse cx="450" cy="642" rx="145" ry="245" fill="#ffb2aa" opacity=".28"/>
    <ellipse cx="650" cy="642" rx="145" ry="245" fill="#ffb2aa" opacity=".28"/>
    <path d="M452 434c-148 48-210 216-158 382 38 122 132 194 226 168 78-22 89-132 54-238-25-76-20-160 68-224-48-70-114-112-190-88z" fill="#ffd2cb" opacity=".42"/>
    <path d="M628 434c148 48 210 216 158 382-38 122-132 194-226 168-78-22-89-132-54-238 25-76 20-160-68-224 48-70 114-112 190-88z" fill="#ffd2cb" opacity=".42"/>
    <path d="M540 500v440M420 620c80 18 160 18 240 0M390 760c100 34 200 34 300 0" stroke="#fff3ee" stroke-width="10" stroke-linecap="round" opacity=".65" fill="none"/>
  </g>
  <rect x="74" y="80" width="178" height="54" rx="27" fill="#fff" opacity=".92"/>
  <text x="118" y="116" font-family="Arial, sans-serif" font-size="28" font-weight="800" fill="#103C8F">Bayer</text>
  <text x="74" y="198" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#ffd8d8">ACADEMIC SYMPOSIUM</text>
  <text x="74" y="282" font-family="Arial, sans-serif" font-size="62" font-weight="900" fill="#fff">CKD患者肾脏保护</text>
  <text x="74" y="362" font-family="Arial, sans-serif" font-size="62" font-weight="900" fill="#fff">新进展研讨会</text>
  <text x="78" y="430" font-family="Arial, sans-serif" font-size="24" fill="#ffd5d5">聚焦慢性肾病管理新证据，探索肾脏保护前沿路径</text>
  <g font-family="Arial, sans-serif" fill="#fff">
    <rect x="74" y="1088" width="932" height="270" rx="34" fill="#ffffff" opacity=".1" stroke="#ffcbcb" stroke-opacity=".3"/>
    <text x="114" y="1155" font-size="30" font-weight="800">会议时间</text>
    <text x="286" y="1155" font-size="30">2026年7月26日</text>
    <text x="114" y="1224" font-size="30" font-weight="800">会议地点</text>
    <text x="286" y="1224" font-size="30">北京国家会议中心</text>
    <text x="114" y="1293" font-size="30" font-weight="800">会议嘉宾</text>
    <text x="286" y="1293" font-size="28">张三 教授  北京**医科大学</text>
    <text x="286" y="1338" font-size="28">李四 副主任医师  北京**医院糖尿病专病门诊</text>
  </g>
  <text x="74" y="1440" font-family="Arial, sans-serif" font-size="20" fill="#ffc9c9" opacity=".82">仅供学术传播会议演示使用</text>
</svg>`;

const CASE_CARD_RESULT_01 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1520">
  <defs>
    <linearGradient id="caseBg" x1="0" x2="1" y1="0" y2="1">
      <stop stop-color="#e8f7ff"/>
      <stop offset=".52" stop-color="#f3fff8"/>
      <stop offset="1" stop-color="#dff3ff"/>
    </linearGradient>
    <linearGradient id="cardHead" x1="0" x2="1">
      <stop stop-color="#103C8F"/>
      <stop offset="1" stop-color="#00A88E"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1520" fill="url(#caseBg)"/>
  <circle cx="916" cy="142" r="190" fill="#69BE28" opacity=".14"/>
  <circle cx="170" cy="1320" r="230" fill="#1d6bff" opacity=".12"/>
  <rect x="70" y="64" width="940" height="1390" rx="44" fill="#fff" stroke="#c9dfed" stroke-width="2"/>
  <rect x="70" y="64" width="940" height="220" rx="44" fill="url(#cardHead)"/>
  <rect x="70" y="202" width="940" height="82" fill="url(#cardHead)"/>
  <text x="118" y="144" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="#fff">病例卡</text>
  <text x="118" y="210" font-family="Arial, sans-serif" font-size="56" font-weight="900" fill="#fff">CKD 合并代谢风险患者管理</text>
  <text x="118" y="328" font-family="Arial, sans-serif" font-size="26" font-weight="800" fill="#103C8F">患者概况</text>
  <g font-family="Arial, sans-serif" font-size="24" fill="#36506b">
    <rect x="118" y="360" width="844" height="160" rx="24" fill="#f4fbff" stroke="#d5e8f5"/>
    <text x="152" y="415">女性，58岁，2型糖尿病病史 9 年，近期体检提示 eGFR 下降。</text>
    <text x="152" y="465">主诉：乏力、夜尿增多，对肾脏健康风险认知不足。</text>
  </g>
  <text x="118" y="590" font-family="Arial, sans-serif" font-size="26" font-weight="800" fill="#103C8F">关键指标</text>
  <g font-family="Arial, sans-serif">
    <rect x="118" y="626" width="250" height="150" rx="22" fill="#eef8ff" stroke="#cfe5f5"/>
    <text x="150" y="688" font-size="40" font-weight="900" fill="#103C8F">58</text>
    <text x="150" y="735" font-size="22" fill="#5b7188">年龄 / 女性</text>
    <rect x="414" y="626" width="250" height="150" rx="22" fill="#effbf5" stroke="#ccebdd"/>
    <text x="446" y="688" font-size="40" font-weight="900" fill="#008a78">9年</text>
    <text x="446" y="735" font-size="22" fill="#5b7188">糖尿病病程</text>
    <rect x="710" y="626" width="252" height="150" rx="22" fill="#eef8ff" stroke="#cfe5f5"/>
    <text x="742" y="688" font-size="40" font-weight="900" fill="#103C8F">下降</text>
    <text x="742" y="735" font-size="22" fill="#5b7188">eGFR 趋势</text>
  </g>
  <text x="118" y="858" font-family="Arial, sans-serif" font-size="26" font-weight="800" fill="#103C8F">管理建议</text>
  <g font-family="Arial, sans-serif" font-size="24" fill="#34495f">
    <rect x="118" y="894" width="844" height="360" rx="26" fill="#fbfdff" stroke="#d5e8f5"/>
    <circle cx="158" cy="952" r="10" fill="#00A88E"/><text x="186" y="962">建立肾功能指标长期监测习惯，关注 eGFR 与 UACR 变化。</text>
    <circle cx="158" cy="1040" r="10" fill="#00A88E"/><text x="186" y="1050">围绕血糖、血压、体重与生活方式进行综合管理。</text>
    <circle cx="158" cy="1128" r="10" fill="#00A88E"/><text x="186" y="1138">如出现指标异常或症状变化，请及时咨询专业医生。</text>
    <circle cx="158" cy="1216" r="10" fill="#00A88E"/><text x="186" y="1226">本卡片用于学术沟通演示，不替代临床诊疗判断。</text>
  </g>
  <rect x="118" y="1320" width="844" height="74" rx="37" fill="#103C8F"/>
  <text x="236" y="1367" font-family="Arial, sans-serif" font-size="26" font-weight="800" fill="#fff">蓝绿配色 · 学术病例沟通 · 预置素材</text>
</svg>`;

export function getAcademicDemoImage(kind: AcademicDemoImageKind) {
  if (kind === 'case-card') {
    return {
      title: 'CaseCard_Result_01.png',
      dataUrl: '/demo-assets/CaseCard_Result_01.PNG',
      copyTitle: '病例卡 · 蓝绿配色',
    };
  }
  return {
    title: 'Poster_Result_01.png',
    dataUrl: '/demo-assets/Poster_Result_01.PNG',
    copyTitle: '会议海报 · CKD患者肾脏保护新进展研讨会',
  };
}

export function getPatientEducationVideoVersion() {
  return {
    id: 'patient-education-video-01',
    name: 'Patient_Education_Video_01.mp4',
    styleTag: '小红书竖版 · 患者教育',
    description: '小K讲解糖尿病患者健康饮食的10秒患者教育视频。',
    duration: '0:10',
    posterDataUrl: svgDataUrl(PATIENT_VIDEO_POSTER_01),
    videoUrl: '/demo-assets/1488265506.mp4',
    isDemo: false,
  };
}
