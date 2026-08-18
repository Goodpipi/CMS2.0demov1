import type { ModificationTask } from '@/lib/modificationTasks';

export type VisualAssetKey = 'kv' | 'poster';

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function kvSvg(opts: {
  kicker: string;
  title: string;
  subtitle: string;
  accent: string;
  badge: string;
}): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="kvbg" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#071828"/>
      <stop offset=".55" stop-color="#0f3c63"/>
      <stop offset="1" stop-color="#1a6b4a"/>
    </linearGradient>
    <linearGradient id="kvaccent" x1="0" y1="0" x2="1" y2="0">
      <stop stop-color="#54B9F9"/>
      <stop offset="1" stop-color="${opts.accent}"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#kvbg)"/>
  <circle cx="1280" cy="160" r="260" fill="${opts.accent}" opacity=".18"/>
  <circle cx="1420" cy="720" r="220" fill="#54B9F9" opacity=".14"/>
  <rect x="72" y="72" width="186" height="8" rx="4" fill="url(#kvaccent)"/>
  <text x="72" y="128" font-family="Arial,Microsoft YaHei,sans-serif" font-size="22" font-weight="700" fill="#8AD329">${opts.kicker}</text>
  <text x="72" y="248" font-family="Arial,Microsoft YaHei,sans-serif" font-size="72" font-weight="800" fill="#fff">${opts.title}</text>
  <text x="72" y="328" font-family="Arial,Microsoft YaHei,sans-serif" font-size="28" fill="#d7ecff">${opts.subtitle}</text>
  <rect x="72" y="392" width="420" height="54" rx="27" fill="url(#kvaccent)"/>
  <text x="282" y="427" text-anchor="middle" font-family="Arial,Microsoft YaHei,sans-serif" font-size="20" font-weight="700" fill="#062033">${opts.badge}</text>
  <text x="72" y="820" font-family="Arial,Microsoft YaHei,sans-serif" font-size="18" fill="#9ec4e6">BAIDEA · Key Visual</text>
</svg>`;
}

/** 学术会议海报应包含的信息模块（演示用） */
export const CONFERENCE_POSTER_CONTENT = {
  brand: 'Bayer',
  kind: 'ACADEMIC SYMPOSIUM',
  title: 'CKD 患者肾脏保护新进展研讨会',
  titleEn: 'ADVANCES IN KIDNEY PROTECTION FOR CKD PATIENTS',
  tagline: '探索前沿科技  守护肾脏健康',
  date: '2026年7月26日',
  venue: '北京国家会议中心',
  speakers: [
    { name: '张三 教授', org: '北京**医科大学' },
    { name: '李四 副主任医师', org: '北京**医院糖尿病专病门诊' },
  ],
  highlights: [
    { title: '前沿研究', desc: '聚焦 CKD 研究最新进展' },
    { title: '临床实践', desc: '分享肾脏保护临床经验' },
    { title: '精准治疗', desc: '探讨个体化治疗策略' },
    { title: '多学科协作', desc: '促进学科融合协同发展' },
    { title: '创新未来', desc: '展望肾脏保护新方向' },
  ],
  agenda: ['主题报告', '专家讲座', '病例分享', '专题讨论', '互动交流'],
  slogan: '携手共进  |  探索创新  |  守护肾脏  |  造福患者',
  compliance: '仅供医学专业人士学术交流  ·  不用于对公众宣传',
} as const;

function conferencePosterSvg(stage: 'outline' | 'speakers'): string {
  const id = stage === 'outline' ? 'p1' : 'p2';
  const speakers =
    stage === 'speakers'
      ? `
  <text x="72" y="760" font-family="Microsoft YaHei,Arial,sans-serif" font-size="22" font-weight="800" fill="#ffd4d4">会议嘉宾</text>
  <rect x="72" y="786" width="430" height="92" rx="16" fill="rgba(255,255,255,.08)" stroke="rgba(255,196,196,.28)"/>
  <circle cx="118" cy="832" r="26" fill="#f3c4c4"/>
  <text x="158" y="826" font-family="Microsoft YaHei,Arial,sans-serif" font-size="22" font-weight="800" fill="#fff">${CONFERENCE_POSTER_CONTENT.speakers[0].name}</text>
  <text x="158" y="854" font-family="Microsoft YaHei,Arial,sans-serif" font-size="16" fill="#f3c8c8">${CONFERENCE_POSTER_CONTENT.speakers[0].org}</text>
  <rect x="72" y="892" width="430" height="92" rx="16" fill="rgba(255,255,255,.08)" stroke="rgba(255,196,196,.28)"/>
  <circle cx="118" cy="938" r="26" fill="#f3c4c4"/>
  <text x="158" y="932" font-family="Microsoft YaHei,Arial,sans-serif" font-size="22" font-weight="800" fill="#fff">${CONFERENCE_POSTER_CONTENT.speakers[1].name}</text>
  <text x="158" y="960" font-family="Microsoft YaHei,Arial,sans-serif" font-size="16" fill="#f3c8c8">${CONFERENCE_POSTER_CONTENT.speakers[1].org}</text>
  <text x="560" y="760" font-family="Microsoft YaHei,Arial,sans-serif" font-size="22" font-weight="800" fill="#ffd4d4">会议议程</text>
  <g font-family="Microsoft YaHei,Arial,sans-serif" font-size="20" fill="#fff">
    <circle cx="576" cy="806" r="5" fill="#ffb4b4"/><text x="596" y="814">${CONFERENCE_POSTER_CONTENT.agenda[0]}</text>
    <circle cx="576" cy="852" r="5" fill="#ffb4b4"/><text x="596" y="860">${CONFERENCE_POSTER_CONTENT.agenda[1]}</text>
    <circle cx="576" cy="898" r="5" fill="#ffb4b4"/><text x="596" y="906">${CONFERENCE_POSTER_CONTENT.agenda[2]}</text>
    <circle cx="576" cy="944" r="5" fill="#ffb4b4"/><text x="596" y="952">${CONFERENCE_POSTER_CONTENT.agenda[3]}</text>
    <circle cx="576" cy="990" r="5" fill="#ffb4b4"/><text x="596" y="998">${CONFERENCE_POSTER_CONTENT.agenda[4]}</text>
  </g>`
      : `
  <rect x="72" y="780" width="936" height="240" rx="22" fill="rgba(255,255,255,.05)" stroke="rgba(255,196,196,.18)" stroke-dasharray="8 8"/>
  <text x="540" y="890" text-anchor="middle" font-family="Microsoft YaHei,Arial,sans-serif" font-size="22" fill="#f0c4c4">嘉宾 / 亮点 / 议程 待补全</text>
  <text x="540" y="928" text-anchor="middle" font-family="Microsoft YaHei,Arial,sans-serif" font-size="16" fill="#d9a3a3">初稿仅确认会议名、时间与地点</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1520">
  <defs>
    <linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#24030c"/>
      <stop offset=".48" stop-color="#7b0b19"/>
      <stop offset="1" stop-color="#130209"/>
    </linearGradient>
    <radialGradient id="${id}core" cx="68%" cy="42%" r="42%">
      <stop offset="0" stop-color="#ff8a8a" stop-opacity=".9"/>
      <stop offset=".5" stop-color="#a81126" stop-opacity=".55"/>
      <stop offset="1" stop-color="#21030a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1080" height="1520" fill="url(#${id}bg)"/>
  <rect width="1080" height="1520" fill="url(#${id}core)"/>
  <g opacity=".2" fill="none" stroke="#ffd1d1" stroke-width="2">
    <path d="M88 255c150 70 240-70 390 0s240 70 390 0"/>
    <path d="M736 430l84-54 70 68-68 88z"/>
    <circle cx="880" cy="430" r="74"/>
  </g>
  <ellipse cx="760" cy="640" rx="168" ry="248" fill="#ffb2aa" opacity=".22"/>
  <ellipse cx="900" cy="640" rx="150" ry="230" fill="#ffb2aa" opacity=".18"/>
  <rect x="72" y="72" width="132" height="44" rx="22" fill="#fff"/>
  <text x="96" y="102" font-family="Arial,sans-serif" font-size="22" font-weight="800" fill="#103C8F">${CONFERENCE_POSTER_CONTENT.brand}</text>
  <text x="72" y="168" font-family="Arial,sans-serif" font-size="20" font-weight="700" letter-spacing="3" fill="#ffd8d8">${CONFERENCE_POSTER_CONTENT.kind}</text>
  <text x="72" y="238" font-family="Microsoft YaHei,Arial,sans-serif" font-size="52" font-weight="900" fill="#fff">CKD 患者肾脏保护</text>
  <text x="72" y="304" font-family="Microsoft YaHei,Arial,sans-serif" font-size="52" font-weight="900" fill="#fff">新进展研讨会</text>
  <text x="72" y="354" font-family="Arial,sans-serif" font-size="18" letter-spacing="1.4" fill="#ffd5d5">${CONFERENCE_POSTER_CONTENT.titleEn}</text>
  <text x="72" y="404" font-family="Microsoft YaHei,Arial,sans-serif" font-size="22" fill="#ffe1e1">—— ${CONFERENCE_POSTER_CONTENT.tagline} ——</text>
  <rect x="72" y="450" width="936" height="250" rx="28" fill="rgba(255,255,255,.08)" stroke="rgba(255,196,196,.25)"/>
  <text x="104" y="518" font-family="Microsoft YaHei,Arial,sans-serif" font-size="20" font-weight="800" fill="#ffd4d4">会议时间</text>
  <text x="104" y="566" font-family="Microsoft YaHei,Arial,sans-serif" font-size="32" font-weight="800" fill="#fff">${CONFERENCE_POSTER_CONTENT.date}</text>
  <text x="104" y="624" font-family="Microsoft YaHei,Arial,sans-serif" font-size="20" font-weight="800" fill="#ffd4d4">会议地点</text>
  <text x="104" y="672" font-family="Microsoft YaHei,Arial,sans-serif" font-size="32" font-weight="800" fill="#fff">${CONFERENCE_POSTER_CONTENT.venue}</text>
  ${speakers}
  <text x="72" y="1438" font-family="Microsoft YaHei,Arial,sans-serif" font-size="18" fill="#ffc9c9">${CONFERENCE_POSTER_CONTENT.compliance}</text>
</svg>`;
}

export const MOCK_KV_VERSIONS = {
  v1: {
    title: '主KV · 初稿',
    dataUrl: svgDataUrl(
      kvSvg({
        kicker: '拜瑞妥® · 心内科',
        title: '血栓管理主视觉',
        subtitle: '初稿：建立品牌蓝绿主色与标题层级',
        accent: '#94a3b8',
        badge: 'KV Draft 01',
      })
    ),
  },
  v2: {
    title: '主KV · 强化标题',
    dataUrl: svgDataUrl(
      kvSvg({
        kicker: '拜瑞妥® · 心内科',
        title: '看见长期保护',
        subtitle: '加大主标题字号，强化主KV记忆点',
        accent: '#3BA6E8',
        badge: 'Key Visual 02',
      })
    ),
  },
  current: {
    title: '主KV · 拜瑞妥心内科',
    dataUrl: svgDataUrl(
      kvSvg({
        kicker: '拜瑞妥® · 心内科主KV',
        title: '守住卒中防线',
        subtitle: '从风险识别到长期抗凝管理的视觉主线',
        accent: '#8AD329',
        badge: 'Master KV',
      })
    ),
  },
};

export const MOCK_POSTER_VERSIONS = {
  v1: {
    title: '会议海报 · 信息初稿',
    dataUrl: svgDataUrl(conferencePosterSvg('outline')),
  },
  v2: {
    title: '会议海报 · 嘉宾与议程',
    dataUrl: svgDataUrl(conferencePosterSvg('speakers')),
  },
  current: {
    title: '会议海报 · CKD患者肾脏保护新进展研讨会',
    dataUrl: '/demo-assets/Poster_Result_01.PNG',
  },
};

export function isGenerateKeyVisualIntent(text: string): boolean {
  const t = text.replace(/\s+/g, '');
  return /生成主KV|帮我生成主KV|做一张主KV|主视觉KV/i.test(t);
}

export function isGenerateConferencePosterIntent(text: string): boolean {
  const t = text.replace(/\s+/g, '');
  return /生成会议海报|帮我生成会议海报|做一张会议海报/i.test(t);
}

export function createMockVisualTasks(
  assetKey: VisualAssetKey,
  now = Date.now()
): ModificationTask[] {
  if (assetKey === 'kv') {
    return [
      {
        id: 'img-task-kv-v1',
        prompt: '生成主KV初稿，建立拜耳蓝绿主视觉',
        status: 'completed',
        targetTab: 'visual',
        pageIndex: null,
        assetKey: 'kv',
        targetLabel: '主KV',
        resultSummary: '已生成主KV初稿，确定蓝绿主色与标题层级。',
        imageSnapshot: MOCK_KV_VERSIONS.v1.dataUrl,
        createdAt: now - 3 * 60 * 60 * 1000,
        updatedAt: now - 2.5 * 60 * 60 * 1000,
      },
      {
        id: 'img-task-kv-v2',
        prompt: '主标题改为更有冲击力，并加大字号',
        status: 'completed',
        targetTab: 'visual',
        pageIndex: null,
        assetKey: 'kv',
        targetLabel: '主KV',
        resultSummary: '已强化主KV标题记忆点。',
        imageSnapshot: MOCK_KV_VERSIONS.v2.dataUrl,
        createdAt: now - 80 * 60 * 1000,
        updatedAt: now - 70 * 60 * 1000,
      },
      {
        id: 'img-task-kv-v3',
        prompt: '微调光影层次，并加入品牌绿强调',
        status: 'running',
        targetTab: 'visual',
        pageIndex: null,
        assetKey: 'kv',
        targetLabel: '主KV',
        resultSummary: 'AI 正在微调主KV光影与品牌色…',
        imageSnapshot: MOCK_KV_VERSIONS.current.dataUrl,
        createdAt: now - 8 * 60 * 1000,
        updatedAt: now - 4 * 60 * 1000,
      },
    ];
  }
  return [
    {
      id: 'img-task-poster-v1',
      prompt: '按学术会议海报结构生成初稿：会议名称、时间、地点',
      status: 'completed',
      targetTab: 'visual',
      pageIndex: null,
      assetKey: 'poster',
      targetLabel: '会议海报',
      resultSummary: '已落下会议名称、英文副标、时间与地点。',
      imageSnapshot: MOCK_POSTER_VERSIONS.v1.dataUrl,
      createdAt: now - 50 * 60 * 1000,
      updatedAt: now - 40 * 60 * 1000,
    },
    {
      id: 'img-task-poster-v2',
      prompt: '补充会议嘉宾与议程模块',
      status: 'completed',
      targetTab: 'visual',
      pageIndex: null,
      assetKey: 'poster',
      targetLabel: '会议海报',
      resultSummary: '已加入两位讲者信息，并列出主题报告到互动交流议程。',
      imageSnapshot: MOCK_POSTER_VERSIONS.v2.dataUrl,
      createdAt: now - 28 * 60 * 1000,
      updatedAt: now - 22 * 60 * 1000,
    },
    {
      id: 'img-task-poster-v3',
      prompt: '精修主视觉，补齐会议亮点、城市剪影与底部口号',
      status: 'running',
      targetTab: 'visual',
      pageIndex: null,
      assetKey: 'poster',
      targetLabel: '会议海报',
      resultSummary: 'AI 正在补齐亮点模块并精修肾脏主视觉…',
      imageSnapshot: MOCK_POSTER_VERSIONS.current.dataUrl,
      createdAt: now - 6 * 60 * 1000,
      updatedAt: now - 3 * 60 * 1000,
    },
  ];
}
