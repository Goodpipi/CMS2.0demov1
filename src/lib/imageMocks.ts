import type { ModificationTask } from '@/lib/modificationTasks';

export type VisualAssetKey = 'kv' | 'poster' | 'mobile';

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function kvSvg(opts: {
  kicker: string;
  title1: string;
  title2: string;
  subtitle: string;
  badge: string;
  glow?: number;
}): string {
  const glow = opts.glow ?? 1;
  const id = opts.badge.replace(/\s+/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#24030c"/>
      <stop offset=".48" stop-color="#7b0b19"/>
      <stop offset="1" stop-color="#130209"/>
    </linearGradient>
    <radialGradient id="${id}core" cx="72%" cy="48%" r="46%">
      <stop offset="0" stop-color="#ff8a8a" stop-opacity="${0.55 * glow}"/>
      <stop offset=".45" stop-color="#a81126" stop-opacity="${0.42 * glow}"/>
      <stop offset="1" stop-color="#21030a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id}vein" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#ffd1d1"/>
      <stop offset="1" stop-color="#ff8a8a"/>
    </linearGradient>
  </defs>
  <rect data-edit-id="el-bg" width="1600" height="900" fill="url(#${id}bg)"/>
  <rect width="1600" height="900" fill="url(#${id}core)"/>
  <g opacity="${0.18 + 0.12 * glow}" fill="none" stroke="#ffd1d1" stroke-width="2">
    <path d="M920 210c80 36 128-28 210 8s140 18 210-10"/>
    <path d="M1088 128c28 46 18 92-8 138"/>
    <path d="M80 470h640"/>
  </g>
  <path d="M80 470c80-28 140 28 210 0s150-36 230 8 160 20 250-12" fill="none" stroke="#ffb4b4" stroke-width="2" opacity=".35"/>
  <g transform="translate(980 168)">
    <ellipse cx="168" cy="268" rx="176" ry="248" fill="#ffb2aa" opacity="${0.2 + 0.12 * glow}"/>
    <ellipse cx="338" cy="278" rx="158" ry="236" fill="#ffb2aa" opacity="${0.16 + 0.1 * glow}"/>
    <ellipse cx="168" cy="268" rx="118" ry="176" fill="#ff6d6d" opacity="${0.22 * glow}"/>
    <ellipse cx="338" cy="278" rx="108" ry="164" fill="#ff6d6d" opacity="${0.18 * glow}"/>
    <path d="M168 92c-70 48-108 128-108 176s42 132 108 176" fill="none" stroke="url(#${id}vein)" stroke-width="3" opacity=".7"/>
    <path d="M168 118c-38 36-62 92-62 150s22 118 62 154" fill="none" stroke="#ffe1e1" stroke-width="1.6" opacity=".55"/>
    <path d="M338 108c66 50 100 126 100 170s-38 128-100 176" fill="none" stroke="url(#${id}vein)" stroke-width="3" opacity=".7"/>
    <path d="M338 132c36 38 58 94 58 146s-20 114-58 150" fill="none" stroke="#ffe1e1" stroke-width="1.6" opacity=".55"/>
    <circle cx="168" cy="268" r="18" fill="#fff" opacity=".35"/>
    <circle cx="338" cy="278" r="16" fill="#fff" opacity=".28"/>
  </g>
  <rect x="72" y="64" width="132" height="44" rx="22" fill="#fff"/>
  <text data-edit-id="el-brand" x="96" y="94" font-family="Arial,sans-serif" font-size="22" font-weight="800" fill="#103C8F">Bayer</text>
  <text data-edit-id="el-kicker" x="72" y="156" font-family="Arial,sans-serif" font-size="20" font-weight="700" letter-spacing="3" fill="#ffd8d8">${opts.kicker}</text>
  <text data-edit-id="el-title-1" x="72" y="268" font-family="Microsoft YaHei,Arial,sans-serif" font-size="64" font-weight="900" fill="#fff">${opts.title1}</text>
  <text data-edit-id="el-title-2" x="72" y="350" font-family="Microsoft YaHei,Arial,sans-serif" font-size="64" font-weight="900" fill="#fff">${opts.title2}</text>
  <text data-edit-id="el-subtitle" x="72" y="422" font-family="Microsoft YaHei,Arial,sans-serif" font-size="24" fill="#ffe1e1">${opts.subtitle}</text>
  <rect x="72" y="468" width="360" height="52" rx="26" fill="#fff"/>
  <text data-edit-id="el-badge" x="252" y="502" text-anchor="middle" font-family="Arial,Microsoft YaHei,sans-serif" font-size="18" font-weight="700" fill="#7b0b19">${opts.badge}</text>
  <text x="72" y="820" font-family="Microsoft YaHei,Arial,sans-serif" font-size="18" fill="#ffc9c9">${CONFERENCE_POSTER_CONTENT.compliance}</text>
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
  <text data-edit-id="el-speakers-title" x="72" y="760" font-family="Microsoft YaHei,Arial,sans-serif" font-size="22" font-weight="800" fill="#ffd4d4">会议嘉宾</text>
  <rect data-edit-id="el-speaker-1" x="72" y="786" width="430" height="92" rx="16" fill="rgba(255,255,255,.08)" stroke="rgba(255,196,196,.28)"/>
  <circle cx="118" cy="832" r="26" fill="#f3c4c4"/>
  <text data-edit-id="el-speaker-1-name" x="158" y="826" font-family="Microsoft YaHei,Arial,sans-serif" font-size="22" font-weight="800" fill="#fff">${CONFERENCE_POSTER_CONTENT.speakers[0].name}</text>
  <text data-edit-id="el-speaker-1-org" x="158" y="854" font-family="Microsoft YaHei,Arial,sans-serif" font-size="16" fill="#f3c8c8">${CONFERENCE_POSTER_CONTENT.speakers[0].org}</text>
  <rect data-edit-id="el-speaker-2" x="72" y="892" width="430" height="92" rx="16" fill="rgba(255,255,255,.08)" stroke="rgba(255,196,196,.28)"/>
  <circle cx="118" cy="938" r="26" fill="#f3c4c4"/>
  <text data-edit-id="el-speaker-2-name" x="158" y="932" font-family="Microsoft YaHei,Arial,sans-serif" font-size="22" font-weight="800" fill="#fff">${CONFERENCE_POSTER_CONTENT.speakers[1].name}</text>
  <text data-edit-id="el-speaker-2-org" x="158" y="960" font-family="Microsoft YaHei,Arial,sans-serif" font-size="16" fill="#f3c8c8">${CONFERENCE_POSTER_CONTENT.speakers[1].org}</text>
  <text data-edit-id="el-agenda-title" x="560" y="760" font-family="Microsoft YaHei,Arial,sans-serif" font-size="22" font-weight="800" fill="#ffd4d4">会议议程</text>
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
  <rect data-edit-id="el-bg" width="1080" height="1520" fill="url(#${id}core)"/>
  <g opacity=".2" fill="none" stroke="#ffd1d1" stroke-width="2">
    <path d="M88 255c150 70 240-70 390 0s240 70 390 0"/>
    <path d="M736 430l84-54 70 68-68 88z"/>
    <circle cx="880" cy="430" r="74"/>
  </g>
  <ellipse cx="760" cy="640" rx="168" ry="248" fill="#ffb2aa" opacity=".22"/>
  <ellipse cx="900" cy="640" rx="150" ry="230" fill="#ffb2aa" opacity=".18"/>
  <rect x="72" y="72" width="132" height="44" rx="22" fill="#fff"/>
  <text data-edit-id="el-brand" x="96" y="102" font-family="Arial,sans-serif" font-size="22" font-weight="800" fill="#103C8F">${CONFERENCE_POSTER_CONTENT.brand}</text>
  <text data-edit-id="el-kind" x="72" y="168" font-family="Arial,sans-serif" font-size="20" font-weight="700" letter-spacing="3" fill="#ffd8d8">${CONFERENCE_POSTER_CONTENT.kind}</text>
  <text data-edit-id="el-title-1" x="72" y="238" font-family="Microsoft YaHei,Arial,sans-serif" font-size="52" font-weight="900" fill="#fff">CKD 患者肾脏保护</text>
  <text data-edit-id="el-title-2" x="72" y="304" font-family="Microsoft YaHei,Arial,sans-serif" font-size="52" font-weight="900" fill="#fff">新进展研讨会</text>
  <text x="72" y="354" font-family="Arial,sans-serif" font-size="18" letter-spacing="1.4" fill="#ffd5d5">${CONFERENCE_POSTER_CONTENT.titleEn}</text>
  <text x="72" y="404" font-family="Microsoft YaHei,Arial,sans-serif" font-size="22" fill="#ffe1e1">—— ${CONFERENCE_POSTER_CONTENT.tagline} ——</text>
  <rect x="72" y="450" width="936" height="250" rx="28" fill="rgba(255,255,255,.08)" stroke="rgba(255,196,196,.25)"/>
  <text x="104" y="518" font-family="Microsoft YaHei,Arial,sans-serif" font-size="20" font-weight="800" fill="#ffd4d4">会议时间</text>
  <text data-edit-id="el-date" x="104" y="566" font-family="Microsoft YaHei,Arial,sans-serif" font-size="32" font-weight="800" fill="#fff">${CONFERENCE_POSTER_CONTENT.date}</text>
  <text x="104" y="624" font-family="Microsoft YaHei,Arial,sans-serif" font-size="20" font-weight="800" fill="#ffd4d4">会议地点</text>
  <text data-edit-id="el-venue" x="104" y="672" font-family="Microsoft YaHei,Arial,sans-serif" font-size="32" font-weight="800" fill="#fff">${CONFERENCE_POSTER_CONTENT.venue}</text>
  ${speakers}
  <text x="72" y="1438" font-family="Microsoft YaHei,Arial,sans-serif" font-size="18" fill="#ffc9c9">${CONFERENCE_POSTER_CONTENT.compliance}</text>
</svg>`;
}

function conferenceMobileSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920">
  <defs>
    <linearGradient id="mbg" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#24030c"/>
      <stop offset=".5" stop-color="#7b0b19"/>
      <stop offset="1" stop-color="#130209"/>
    </linearGradient>
  </defs>
  <rect data-edit-id="el-bg" width="1080" height="1920" fill="url(#mbg)"/>
  <rect x="72" y="80" width="132" height="44" rx="22" fill="#fff"/>
  <text data-edit-id="el-brand" x="96" y="110" font-family="Arial,sans-serif" font-size="22" font-weight="800" fill="#103C8F">${CONFERENCE_POSTER_CONTENT.brand}</text>
  <text data-edit-id="el-kind" x="72" y="186" font-family="Arial,sans-serif" font-size="20" font-weight="700" letter-spacing="3" fill="#ffd8d8">${CONFERENCE_POSTER_CONTENT.kind}</text>
  <text data-edit-id="el-title-1" x="72" y="280" font-family="Microsoft YaHei,Arial,sans-serif" font-size="56" font-weight="900" fill="#fff">CKD 患者肾脏保护</text>
  <text data-edit-id="el-title-2" x="72" y="356" font-family="Microsoft YaHei,Arial,sans-serif" font-size="56" font-weight="900" fill="#fff">新进展研讨会</text>
  <text data-edit-id="el-tagline" x="72" y="430" font-family="Microsoft YaHei,Arial,sans-serif" font-size="24" fill="#ffe1e1">—— ${CONFERENCE_POSTER_CONTENT.tagline} ——</text>
  <rect x="72" y="490" width="936" height="280" rx="28" fill="rgba(255,255,255,.08)" stroke="rgba(255,196,196,.25)"/>
  <text x="104" y="560" font-family="Microsoft YaHei,Arial,sans-serif" font-size="20" font-weight="800" fill="#ffd4d4">会议时间</text>
  <text data-edit-id="el-date" x="104" y="618" font-family="Microsoft YaHei,Arial,sans-serif" font-size="36" font-weight="800" fill="#fff">${CONFERENCE_POSTER_CONTENT.date}</text>
  <text x="104" y="686" font-family="Microsoft YaHei,Arial,sans-serif" font-size="20" font-weight="800" fill="#ffd4d4">会议地点</text>
  <text data-edit-id="el-venue" x="104" y="744" font-family="Microsoft YaHei,Arial,sans-serif" font-size="36" font-weight="800" fill="#fff">${CONFERENCE_POSTER_CONTENT.venue}</text>
  <text data-edit-id="el-speakers-title" x="72" y="860" font-family="Microsoft YaHei,Arial,sans-serif" font-size="26" font-weight="800" fill="#ffd4d4">会议嘉宾</text>
  <rect data-edit-id="el-speaker-1" x="72" y="890" width="936" height="120" rx="20" fill="rgba(255,255,255,.08)"/>
  <text x="104" y="940" font-family="Microsoft YaHei,Arial,sans-serif" font-size="28" font-weight="800" fill="#fff">${CONFERENCE_POSTER_CONTENT.speakers[0].name}</text>
  <text x="104" y="980" font-family="Microsoft YaHei,Arial,sans-serif" font-size="18" fill="#f3c8c8">${CONFERENCE_POSTER_CONTENT.speakers[0].org}</text>
  <rect data-edit-id="el-speaker-2" x="72" y="1030" width="936" height="120" rx="20" fill="rgba(255,255,255,.08)"/>
  <text x="104" y="1080" font-family="Microsoft YaHei,Arial,sans-serif" font-size="28" font-weight="800" fill="#fff">${CONFERENCE_POSTER_CONTENT.speakers[1].name}</text>
  <text x="104" y="1120" font-family="Microsoft YaHei,Arial,sans-serif" font-size="18" fill="#f3c8c8">${CONFERENCE_POSTER_CONTENT.speakers[1].org}</text>
  <text data-edit-id="el-agenda-title" x="72" y="1260" font-family="Microsoft YaHei,Arial,sans-serif" font-size="26" font-weight="800" fill="#ffd4d4">会议议程</text>
  <text data-edit-id="el-agenda" x="72" y="1320" font-family="Microsoft YaHei,Arial,sans-serif" font-size="24" fill="#fff">${CONFERENCE_POSTER_CONTENT.agenda.join('  |  ')}</text>
  <text data-edit-id="el-slogan" x="72" y="1760" font-family="Microsoft YaHei,Arial,sans-serif" font-size="22" fill="#ffd4d4">${CONFERENCE_POSTER_CONTENT.slogan}</text>
  <text data-edit-id="el-compliance" x="72" y="1830" font-family="Microsoft YaHei,Arial,sans-serif" font-size="16" fill="#ffc9c9">${CONFERENCE_POSTER_CONTENT.compliance}</text>
</svg>`;
}

export const MOCK_KV_VERSIONS = {
  v1: {
    title: '主KV · 红色初稿',
    dataUrl: svgDataUrl(
      kvSvg({
        kicker: 'ACADEMIC SYMPOSIUM',
        title1: 'CKD 患者肾脏保护',
        title2: '主视觉初稿',
        subtitle: '—— 建立深红主色与肾脏光影 ——',
        badge: 'KV Draft 01',
        glow: 0.55,
      })
    ),
  },
  v2: {
    title: '主KV · 强化标题',
    dataUrl: svgDataUrl(
      kvSvg({
        kicker: 'ACADEMIC SYMPOSIUM',
        title1: 'CKD 患者肾脏保护',
        title2: '新进展研讨会',
        subtitle: '—— 探索前沿科技  守护肾脏健康 ——',
        badge: 'Key Visual 02',
        glow: 0.8,
      })
    ),
  },
  current: {
    title: '主KV · CKD肾脏保护',
    dataUrl: svgDataUrl(
      kvSvg({
        kicker: 'ACADEMIC SYMPOSIUM',
        title1: 'CKD 患者肾脏保护',
        title2: '新进展研讨会',
        subtitle: '—— 探索前沿科技  守护肾脏健康 ——',
        badge: 'Master KV',
        glow: 1,
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
    dataUrl: svgDataUrl(conferencePosterSvg('speakers')),
  },
};

export const MOCK_MOBILE_VERSIONS = {
  current: {
    title: '会议海报 · 手机版',
    dataUrl: svgDataUrl(conferenceMobileSvg()),
  },
};

export function isGenerateKeyVisualIntent(text: string): boolean {
  const t = text.replace(/\s+/g, '');
  return /生成主KV|帮我生成主KV|做一张主KV|主视觉KV/i.test(t);
}

export function isGenerateConferencePosterIntent(text: string): boolean {
  const t = text.replace(/\s+/g, '');
  return /生成会议海报|帮我生成会议海报|做一张会议海报|生成海报|做一张海报/i.test(t);
}

export function isAdaptPosterMobileIntent(text: string): boolean {
  const t = text.replace(/\s+/g, '');
  return /一键手机|手机适配|生成手机版|适配手机/i.test(t);
}

export function isEditKeyVisualIntent(text: string): boolean {
  const t = text.replace(/\s+/g, '');
  return /修改主KV|预览主KV|打开主KV/i.test(t);
}

export function isEditConferencePosterIntent(text: string): boolean {
  const t = text.replace(/\s+/g, '');
  return /修改海报|修改会议海报|预览海报|打开海报/i.test(t);
}

export function createMockVisualTasks(
  assetKey: VisualAssetKey,
  now = Date.now()
): ModificationTask[] {
  if (assetKey === 'kv') {
    return [
      {
        id: 'img-task-kv-v1',
        prompt: '生成主KV初稿，沿用会议海报的深红肾脏主视觉',
        status: 'completed',
        targetTab: 'visual',
        pageIndex: null,
        assetKey: 'kv',
        targetLabel: '主KV',
        resultSummary: '已生成红色主KV初稿，确定深红底与肾脏光影。',
        imageSnapshot: MOCK_KV_VERSIONS.v1.dataUrl,
        createdAt: now - 3 * 60 * 60 * 1000,
        updatedAt: now - 2.5 * 60 * 60 * 1000,
      },
      {
        id: 'img-task-kv-v2',
        prompt: '会议标题改为 CKD 肾脏保护，并加大字号',
        status: 'completed',
        targetTab: 'visual',
        pageIndex: null,
        assetKey: 'kv',
        targetLabel: '主KV',
        resultSummary: '已强化主KV标题与会议主题记忆点。',
        imageSnapshot: MOCK_KV_VERSIONS.v2.dataUrl,
        createdAt: now - 80 * 60 * 1000,
        updatedAt: now - 70 * 60 * 1000,
      },
      {
        id: 'img-task-kv-v3',
        prompt: '精修肾脏光影层次，与红色会议海报主视觉对齐',
        status: 'running',
        targetTab: 'visual',
        pageIndex: null,
        assetKey: 'kv',
        targetLabel: '主KV',
        resultSummary: 'AI 正在对齐海报的深红肾脏主视觉…',
        imageSnapshot: MOCK_KV_VERSIONS.current.dataUrl,
        createdAt: now - 8 * 60 * 1000,
        updatedAt: now - 4 * 60 * 1000,
      },
    ];
  }
  if (assetKey === 'mobile') {
    return [
      {
        id: 'img-task-mobile-v1',
        prompt: '一键将会议海报适配为手机竖版',
        status: 'completed',
        targetTab: 'visual',
        pageIndex: null,
        assetKey: 'mobile',
        targetLabel: '手机版海报',
        resultSummary: '已按 9:16 重排会议名称、时间地点、嘉宾与议程。',
        imageSnapshot: MOCK_MOBILE_VERSIONS.current.dataUrl,
        createdAt: now - 4 * 60 * 1000,
        updatedAt: now - 2 * 60 * 1000,
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
