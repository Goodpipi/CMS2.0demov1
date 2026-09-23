import { MOCK_POSTER_VERSIONS } from '@/lib/imageMocks';
import type { PptSlide } from '@/types/content';
import type {
  PosterPlanBKvBrief,
  PosterPlanBKvCandidate,
  PosterPlanBReference,
} from '@/lib/posterPlanBMocks';

export type MeetingTemplateTab = 'poster' | 'ppt';
export type MeetingSessionTab = 'info' | 'poster' | 'ppt';

export function sessionMaterialsTab(
  session: Pick<MeetingSession, 'info'> | null | undefined,
  requested?: MeetingSessionTab | null
): MeetingSessionTab {
  if (!session?.info) return 'info';
  if (requested === 'ppt' || requested === 'poster') return requested;
  return 'poster';
}
export type MeetingUpdateReason = 'template' | 'info';

export interface MeetingSpeaker {
  name: string;
  org: string;
}

export interface MeetingSessionInfo {
  title: string;
  date: string;
  venue: string;
  speakers: MeetingSpeaker[];
  agenda: string[];
}

export interface MeetingSession {
  id: string;
  name: string;
  info?: MeetingSessionInfo;
  posterReady: boolean;
  pptReady: boolean;
  posterUrl?: string;
  pptSlides?: PptSlide[];
  posterUpdateReasons?: MeetingUpdateReason[];
  pptUpdateReasons?: MeetingUpdateReason[];
}

export interface MeetingTaskProposal {
  theme: string;
  colorPalette: string;
  style: string;
  mainVisualElements: string;
  other: string;
}

export interface MeetingTemplateBrief {
  visualReferences: PosterPlanBReference[];
  requirement: string;
  posterRatio: string;
  posterTemplateFileName?: string;
  pptTemplateFileName?: string;
}

export interface MeetingMaterialsState {
  taskProposal?: MeetingTaskProposal;
  kvBrief: PosterPlanBKvBrief;
  kvCandidates: PosterPlanBKvCandidate[];
  activeKvCandidateId: string | null;
  selectedKvId: string | null;
  mainKvUrl?: string;
  uploadedKvFileName?: string;
  templateBrief: MeetingTemplateBrief;
  templatesReady: boolean;
  sessions: MeetingSession[];
  currentSessionId: string | null;
  templateTab: MeetingTemplateTab;
  sessionTab: MeetingSessionTab;
  showAllSessions: boolean;
  infoFormOpen: boolean;
  templatePosterUrl?: string;
  templatePptSlides?: PptSlide[];
}

export function emptyMeetingTaskProposal(): MeetingTaskProposal {
  return {
    theme: '',
    colorPalette: '',
    style: '',
    mainVisualElements: '',
    other: '',
  };
}

export function emptyMeetingMaterials(): MeetingMaterialsState {
  return {
    kvBrief: {
      visualReferences: [],
      requirement: '',
      colorPalette: '',
      count: 2,
      ratio: '16:9',
      styleId: 'tech',
    },
    kvCandidates: [],
    activeKvCandidateId: null,
    selectedKvId: null,
    templateBrief: {
      visualReferences: [],
      requirement: '',
      posterRatio: '3:4',
    },
    templatesReady: false,
    sessions: [],
    currentSessionId: null,
    templateTab: 'poster',
    sessionTab: 'info',
    showAllSessions: false,
    infoFormOpen: false,
  };
}

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const MEETING_SERIES_TITLE = 'CKD 患者肾脏保护新进展研讨会';

const SESSION_INFO_PRESETS: Record<string, MeetingSessionInfo> = {
  上海场: {
    title: MEETING_SERIES_TITLE,
    date: '2026年8月12日',
    venue: '上海国际会议中心',
    speakers: [
      { name: '王敏 教授', org: '上海**医院肾内科' },
      { name: '陈浩 主任医师', org: '复旦大学附属**医院' },
    ],
    agenda: ['开场致辞', '主题报告', '病例讨论', '圆桌问答', '总结闭幕'],
  },
  北京场: {
    title: MEETING_SERIES_TITLE,
    date: '2026年7月26日',
    venue: '北京国家会议中心',
    speakers: [
      { name: '张三 教授', org: '北京**医科大学' },
      { name: '李四 副主任医师', org: '北京**医院糖尿病专病门诊' },
    ],
    agenda: ['主题报告', '专家讲座', '病例分享', '专题讨论', '互动交流'],
  },
  广州场: {
    title: MEETING_SERIES_TITLE,
    date: '2026年9月18日',
    venue: '广州白云国际会议中心',
    speakers: [
      { name: '刘洋 教授', org: '中山大学附属**医院' },
      { name: '赵倩 副主任医师', org: '南方医科大学**医院' },
    ],
    agenda: ['区域开场', '指南解读', '实践分享', '分组讨论', '闭幕致辞'],
  },
};

SESSION_INFO_PRESETS['广州区域会'] = SESSION_INFO_PRESETS['广州场'];

export function meetingInfoForSession(name: string): MeetingSessionInfo {
  const preset = SESSION_INFO_PRESETS[name.trim()];
  if (preset) return { ...preset, speakers: [...preset.speakers], agenda: [...preset.agenda] };
  return {
    title: MEETING_SERIES_TITLE,
    date: '2026年10月16日',
    venue: `${name}会议中心`,
    speakers: [
      { name: '特邀专家 A', org: `${name}区域医学中心` },
      { name: '特邀专家 B', org: `${name}临床基地` },
    ],
    agenda: ['会议开场', '主题报告', '讨论交流', '茶歇', '会议结束'],
  };
}

export function buildSessionPosterDataUrl(sessionName: string, info: MeetingSessionInfo): string {
  const blueBlackPosters = [
    '/demo-assets/poster-studio/countdown-3.png',
    '/demo-assets/poster-studio/countdown-2.png',
    '/demo-assets/poster-studio/countdown-1.png',
  ];
  const posterIndex =
    [...sessionName].reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    blueBlackPosters.length;
  if (info) return blueBlackPosters[posterIndex];
  const speakers = info.speakers
    .slice(0, 2)
    .map(
      (speaker, index) => `
  <rect x="72" y="${786 + index * 106}" width="430" height="92" rx="16" fill="rgba(255,255,255,.08)" stroke="rgba(255,196,196,.28)"/>
  <circle cx="118" cy="${832 + index * 106}" r="26" fill="#f3c4c4"/>
  <text x="158" y="${826 + index * 106}" font-family="Microsoft YaHei,Arial,sans-serif" font-size="22" font-weight="800" fill="#fff">${escapeXml(speaker.name)}</text>
  <text x="158" y="${854 + index * 106}" font-family="Microsoft YaHei,Arial,sans-serif" font-size="16" fill="#f3c8c8">${escapeXml(speaker.org)}</text>`
    )
    .join('');
  const agenda = info.agenda
    .slice(0, 5)
    .map(
      (item, index) =>
        `<circle cx="576" cy="${806 + index * 46}" r="5" fill="#ffb4b4"/><text x="596" y="${814 + index * 46}">${escapeXml(item)}</text>`
    )
    .join('');
  const id = sessionName.replace(/\s+/g, '');
  return svgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1520">
  <defs>
    <linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#24030c"/>
      <stop offset=".48" stop-color="#7b0b19"/>
      <stop offset="1" stop-color="#130209"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1520" fill="url(#${id}bg)"/>
  <rect x="72" y="72" width="132" height="44" rx="22" fill="#fff"/>
  <text x="96" y="102" font-family="Arial,sans-serif" font-size="22" font-weight="800" fill="#103C8F">Bayer</text>
  <text x="72" y="168" font-family="Arial,sans-serif" font-size="20" font-weight="700" letter-spacing="3" fill="#ffd8d8">${escapeXml(sessionName)}</text>
  <text x="72" y="238" font-family="Microsoft YaHei,Arial,sans-serif" font-size="48" font-weight="900" fill="#fff">CKD 患者肾脏保护</text>
  <text x="72" y="304" font-family="Microsoft YaHei,Arial,sans-serif" font-size="48" font-weight="900" fill="#fff">新进展研讨会</text>
  <rect x="72" y="450" width="936" height="250" rx="28" fill="rgba(255,255,255,.08)" stroke="rgba(255,196,196,.25)"/>
  <text x="104" y="518" font-family="Microsoft YaHei,Arial,sans-serif" font-size="20" font-weight="800" fill="#ffd4d4">会议时间</text>
  <text x="104" y="566" font-family="Microsoft YaHei,Arial,sans-serif" font-size="32" font-weight="800" fill="#fff">${escapeXml(info.date)}</text>
  <text x="104" y="624" font-family="Microsoft YaHei,Arial,sans-serif" font-size="20" font-weight="800" fill="#ffd4d4">会议地点</text>
  <text x="104" y="672" font-family="Microsoft YaHei,Arial,sans-serif" font-size="32" font-weight="800" fill="#fff">${escapeXml(info.venue)}</text>
  <text x="72" y="760" font-family="Microsoft YaHei,Arial,sans-serif" font-size="22" font-weight="800" fill="#ffd4d4">会议嘉宾</text>
  ${speakers}
  <text x="560" y="760" font-family="Microsoft YaHei,Arial,sans-serif" font-size="22" font-weight="800" fill="#ffd4d4">会议议程</text>
  <g font-family="Microsoft YaHei,Arial,sans-serif" font-size="20" fill="#fff">${agenda}</g>
  <text x="72" y="1438" font-family="Microsoft YaHei,Arial,sans-serif" font-size="18" fill="#ffc9c9">仅供医学专业人士学术交流  ·  不用于对公众宣传</text>
</svg>`);
}

function meetingSlideSvg(
  kicker: string,
  title: string,
  lines: string[],
  index: number
): string {
  const body = lines
    .map(
      (line, lineIndex) =>
        `<text x="72" y="${320 + lineIndex * 44}" font-family="Microsoft YaHei,Arial,sans-serif" font-size="22" fill="#ffe1e1">${escapeXml(line)}</text>`
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540">
  <rect width="960" height="540" fill="#24030c"/>
  <rect x="0" y="0" width="18" height="540" fill="#a81126"/>
  <circle cx="860" cy="80" r="110" fill="#7b0b19" opacity=".55"/>
  <text x="72" y="72" font-family="Arial,sans-serif" font-size="16" font-weight="700" letter-spacing="2" fill="#ffd8d8">${escapeXml(kicker)}</text>
  <text x="72" y="168" font-family="Microsoft YaHei,Arial,sans-serif" font-size="36" font-weight="800" fill="#fff">${escapeXml(title)}</text>
  ${body}
  <text x="888" y="508" text-anchor="end" font-family="Arial,sans-serif" font-size="16" fill="#f3c8c8">0${index}</text>
</svg>`;
}

export const MEETING_PPT_TEMPLATE_SLIDES: PptSlide[] = [
  {
    page: 1,
    title: '会议开场页',
    bullets: ['系列会议主视觉', '会议主题与主KV'],
    svg: meetingSlideSvg('BAYER · 会议模板', '会议开场', ['沿用系列主KV', '确认会议主题与合规声明'], 1),
  },
  {
    page: 2,
    title: '主席与主持人介绍页',
    bullets: ['主席介绍', '主持人介绍'],
    svg: meetingSlideSvg('BAYER · 会议模板', '主席与主持人介绍', ['主席席位与单位', '主持人串场职责'], 2),
  },
  {
    page: 3,
    title: '会议议程页',
    bullets: ['时间', '议题', '讲者'],
    svg: meetingSlideSvg('BAYER · 会议模板', '会议议程', ['时间 / 议题 / 讲者', '可按场次替换具体信息'], 3),
  },
  {
    page: 4,
    title: '讨论或茶歇页',
    bullets: ['互动讨论', '茶歇安排'],
    svg: meetingSlideSvg('BAYER · 会议模板', '讨论或茶歇', ['互动问答', '茶歇与合影安排'], 4),
  },
  {
    page: 5,
    title: '会议结束页',
    bullets: ['致谢', '合规声明'],
    svg: meetingSlideSvg('BAYER · 会议模板', '会议结束', ['感谢参会', '仅供医学专业人士学术交流'], 5),
  },
];

export function buildSessionPptSlides(sessionName: string, info: MeetingSessionInfo): PptSlide[] {
  const speakerLine = info.speakers.map((item) => item.name).join('  ·  ');
  return [
    {
      page: 1,
      title: `${sessionName} · 会议开场`,
      bullets: [info.title, info.date, info.venue],
      svg: meetingSlideSvg(`${sessionName} · 开场`, info.title, [info.date, info.venue], 1),
    },
    {
      page: 2,
      title: `${sessionName} · 主席与主持人`,
      bullets: info.speakers.map((item) => `${item.name}  ${item.org}`),
      svg: meetingSlideSvg(`${sessionName} · 嘉宾`, '主席与主持人介绍', [speakerLine, info.speakers[0]?.org || ''], 2),
    },
    {
      page: 3,
      title: `${sessionName} · 会议议程`,
      bullets: info.agenda,
      svg: meetingSlideSvg(`${sessionName} · 议程`, '会议议程', info.agenda.slice(0, 4), 3),
    },
    {
      page: 4,
      title: `${sessionName} · 讨论或茶歇`,
      bullets: ['互动讨论', '茶歇交流'],
      svg: meetingSlideSvg(`${sessionName} · 讨论`, '讨论或茶歇', ['互动问答', '茶歇与会间交流'], 4),
    },
    {
      page: 5,
      title: `${sessionName} · 会议结束`,
      bullets: ['感谢参会', '合规声明'],
      svg: meetingSlideSvg(`${sessionName} · 结束`, '会议结束', ['感谢莅临', '仅供医学专业人士学术交流'], 5),
    },
  ];
}

export const MEETING_POSTER_TEMPLATE_URL = MOCK_POSTER_VERSIONS.current.dataUrl;
export const MEETING_POSTER_TEMPLATE_REGIONS = ['会议名称', '时间', '地点', '专家信息'];

export const MEETING_KV_CAPTION =
  '主KV确定本次系列会议的蓝黑竞速视觉。后续海报模板、串场PPT模板和各场次物料将沿用同一套风格。';

function compact(text: string): string {
  return text.replace(/\s+/g, '');
}

export function isGenerateMeetingTemplatesIntent(text: string): boolean {
  const t = compact(text);
  return /生成会议模板|生成海报模板|生成串场PPT模板/.test(t);
}

export function isAddMeetingSessionIntent(text: string): boolean {
  const t = compact(text);
  return /新增场次|创建场次|添加场次/.test(t);
}

export function downloadConferenceInfoTemplate() {
  const csv = [
    '会议名称,会议时间,会议地点,主办方,会议主题,嘉宾,议程要点,备注',
    'CKD患者肾脏保护新进展研讨会,2026-10-18 09:00,上海国际会议中心,拜耳医药保健,肾脏保护新进展,张三教授；李四主任,开场致辞 | 主题报告 | 圆桌讨论,请按实际会议信息替换本行后上传',
  ].join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '会议信息模板.csv';
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function isUploadMeetingInfoIntent(text: string): boolean {
  return /上传会议信息/.test(compact(text));
}

export function isFillMeetingInfoIntent(text: string): boolean {
  return /填写会议信息/.test(compact(text));
}

export function isGenerateSessionPosterIntent(text: string): boolean {
  const t = compact(text);
  return /生成会议海报|帮我生成会议海报|做一张会议海报/.test(t) || t === '生成海报' || t === '做一张海报';
}

export function isGenerateSessionPptIntent(text: string): boolean {
  const t = compact(text);
  return /生成串场PPT|生成串场ppt|做串场PPT/.test(t);
}

export function isViewAllSessionsIntent(text: string): boolean {
  return /查看全部场次/.test(compact(text));
}

export function isViewMeetingTemplatesIntent(text: string): boolean {
  return /查看会议模板/.test(compact(text));
}

export function parseViewSessionIntent(text: string): string | null {
  const t = compact(text);
  const matched = t.match(/^查看(.+场)$/) || t.match(/^查看(广州区域会)$/);
  return matched?.[1] || null;
}

export function currentMeetingSession(
  materials: MeetingMaterialsState | null | undefined
): MeetingSession | null {
  if (!materials?.currentSessionId) return materials?.sessions[0] || null;
  return materials.sessions.find((item) => item.id === materials.currentSessionId) || null;
}

export function meetingSessionChips(materials: MeetingMaterialsState): string[] {
  if (!materials.templatesReady) return ['生成主KV', '添加会议参考资料'];
  if (!materials.sessions.length) return ['新增场次', '查看会议模板'];
  const session = currentMeetingSession(materials);
  if (!session?.info) return ['上传会议信息', '查看会议模板'];
  const chips: string[] = [];
  if (!session.posterReady) chips.push('生成会议海报');
  if (!session.pptReady) chips.push('生成串场PPT');
  chips.push('新增场次');
  if (chips.length < 3) chips.push('查看会议模板');
  return chips;
}
