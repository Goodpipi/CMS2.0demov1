import type { TabKey } from '@/types/session';
import type { VideoResult } from '@/types/content';
import { getPatientEducationVideoVersion } from '@/lib/demoScenarioFlow';

export const VIDEO_STUDIO_FULL_URL = '/demo-assets/1488265506.mp4';
export const VIDEO_HERO_IMAGE_URL = '/demo-assets/video-studio/hero.jpg';

const PRODUCTION_STILLS: Record<string, string> = {
  'clip-1': '/demo-assets/video-studio/clip-1.jpg',
  'clip-2': '/demo-assets/video-studio/clip-2.jpg',
  'clip-3': '/demo-assets/video-studio/clip-3.jpg',
  'clip-4': '/demo-assets/video-studio/clip-4.jpg',
  'clip-5': '/demo-assets/video-studio/clip-5.jpg',
};

export type VideoStudioView =
  | 'brief'
  | 'hero'
  | 'storyboard'
  | 'frames'
  | 'clips'
  | 'final'
  | 'team'
  | 'submit';

export type VideoHeroPose = 'front' | 'side' | 'back' | 'fly' | 'point' | 'like' | 'smile';
export type VideoCapeVersion = 'base' | 'deep';
export type VideoFrameVersion = 'base' | 'rice';
export type VideoTransition = 'cut' | 'fade';
export type VideoClipVersionId = 'A' | 'B' | 'C';

export interface VideoBrief {
  theme: string;
  audience: string;
  keyMessages: string;
  scene: string;
  channel: string;
  duration: string;
  style: string;
  ratio: string;
  language: string;
  narrationType: string;
  brand: string;
  heroRequirement: string;
  tone: string;
  refVideo: string;
  personRef: string;
  sceneRef: string;
  brandBrief: string;
}

export interface VideoStoryboardRow {
  id: string;
  time: string;
  start: number;
  end: number;
  clipId: string;
  shot: string;
  heroPos: string;
  action: string;
  scene: string;
  elements: string;
  change: string;
  line: string;
  narration: string;
  subtitle: string;
  bridge: string;
}

export interface VideoClipDef {
  id: string;
  name: string;
  range: string;
  duration: string;
  start: number;
  summary: string;
  narration: string;
  bridge: string;
}

export interface VideoClipVersion {
  id: VideoClipVersionId;
  label: string;
  posterUrl: string;
  videoUrl: string;
  note: string;
}

export interface VideoStudioClipState {
  id: string;
  selectedVersionId: VideoClipVersionId;
  versions: VideoClipVersion[];
}

export interface VideoStudioState {
  brief: VideoBrief;
  briefConfirmed: boolean;
  view: VideoStudioView;
  heroReady: boolean;
  heroConfirmed: boolean;
  heroCape: VideoCapeVersion;
  heroBrush: boolean;
  heroCompared: boolean;
  visualRefUrl: string | null;
  storyboardReady: boolean;
  storyboard: VideoStoryboardRow[];
  storyboardText: string;
  selectedRowId: string | null;
  selectedClipId: string;
  complianceChecked: boolean;
  framesReady: boolean;
  framesConfirmed: boolean;
  frameVersions: Record<string, VideoFrameVersion>;
  frameBrushClipId: string | null;
  frameCompared: boolean;
  selectedFrameIds: string[];
  clipsReady: boolean;
  clips: VideoStudioClipState[];
  clipOrder: string[];
  removedClipIds: string[];
  selectedClipIds: string[];
  transitions: Record<string, VideoTransition>;
  timelinePreviewing: boolean;
  finalReady: boolean;
  teamReady: boolean;
  submitReady: boolean;
  submitted: boolean;
}

export type VideoStudioAction =
  | { type: 'setBrief'; brief: VideoBrief }
  | { type: 'confirmBrief' }
  | { type: 'editBrief' }
  | { type: 'generateHero' }
  | { type: 'openHeroBrush' }
  | { type: 'continueHeroBrush' }
  | { type: 'compareHero' }
  | { type: 'applyCapeEdit' }
  | { type: 'regenerateHero' }
  | { type: 'confirmHero' }
  | { type: 'setVisualRefUrl'; url: string | null }
  | { type: 'generateStoryboard' }
  | { type: 'setStoryboardText'; text: string }
  | { type: 'selectRow'; rowId: string }
  | { type: 'selectClip'; clipId: string }
  | { type: 'editStoryboardRow'; rowId: string; patch: Partial<VideoStoryboardRow> }
  | { type: 'editNarration'; rowId: string; narration: string }
  | { type: 'simplifyFifthSecond' }
  | { type: 'checkCompliance' }
  | { type: 'generateFrames' }
  | { type: 'openFrameBrush'; clipId: string }
  | { type: 'continueFrameBrush' }
  | { type: 'compareFrame' }
  | { type: 'applyRiceEdit' }
  | { type: 'regenerateFrame'; clipId: string }
  | { type: 'confirmFrame'; clipId: string }
  | { type: 'confirmAllFrames' }
  | { type: 'toggleFrameSelect'; id: string }
  | { type: 'selectAllFrames'; selected: boolean }
  | { type: 'removeFrameSelect'; id: string }
  | { type: 'regenerateSelectedFrames' }
  | { type: 'generateClips' }
  | { type: 'addClipVersion'; clipId?: string }
  | { type: 'selectClipVersion'; clipId: string; versionId: VideoClipVersionId }
  | { type: 'toggleClipSelect'; id: string }
  | { type: 'selectAllClips'; selected: boolean }
  | { type: 'removeClipSelect'; id: string }
  | { type: 'regenerateSelectedClips' }
  | { type: 'regenerateSelected' }
  | { type: 'reorderClips'; order: string[] }
  | { type: 'removeClip'; clipId: string }
  | { type: 'restoreClip'; clipId: string }
  | { type: 'setTransition'; afterClipId: string; transition: VideoTransition }
  | { type: 'previewTimeline' }
  | { type: 'composeFinal' }
  | { type: 'goto'; view: VideoStudioView }
  | { type: 'startTeamReview' }
  | { type: 'confirmSubmit' };

export interface VideoStudioReduceResult {
  state: VideoStudioState;
  tab?: TabKey;
  aiHtml?: string;
  toast?: string;
  openTeam?: boolean;
  syncVideo?: boolean;
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

export function ratioFromChannel(channel: string): string {
  if (/会议|投屏|横版|16\s*[:：]\s*9/.test(channel)) return '16:9';
  return '9:16';
}

export function defaultVideoBrief(brand = '可申达'): VideoBrief {
  return {
    theme: '糖尿病患者如何健康饮食',
    audience: '糖尿病患者及其家属',
    keyMessages: '1. 均衡搭配不同类别的食物；\n2. 合理控制食物总量和主食份量；\n3. 减少含糖饮料，优先选择白水。',
    scene: '患者教育短视频',
    channel: '短视频平台',
    duration: '10秒',
    style: '3D卡通医学科普',
    ratio: '9:16',
    language: '中文',
    narrationType: 'AI旁白',
    brand,
    heroRequirement: '使用亲切、有活力的健康助手形象',
    tone: '简单、轻松、容易理解',
    refVideo: '',
    personRef: '',
    sceneRef: '',
    brandBrief: '',
  };
}

export function isVideoBriefComplete(brief: VideoBrief): boolean {
  return Boolean(
    brief.theme.trim() &&
      brief.audience.trim() &&
      brief.keyMessages.trim() &&
      brief.duration.trim() &&
      brief.style.trim()
  );
}

function capeFill(version: VideoCapeVersion) {
  return version === 'deep' ? '#7a0d18' : '#e31b23';
}

function capeStroke(version: VideoCapeVersion) {
  return version === 'deep' ? '#4c0810' : '#b01018';
}

function xiaoKMarkup(pose: VideoHeroPose, cape: VideoCapeVersion): string {
  const capeC = capeFill(cape);
  const capeS = capeStroke(cape);
  const poseTransform =
    pose === 'fly'
      ? 'translate(200 40) rotate(-18) translate(-200 0)'
      : pose === 'side'
        ? 'translate(28 0)'
        : pose === 'point'
          ? 'translate(8 6)'
          : pose === 'like'
            ? 'translate(-6 8)'
            : 'translate(0 0)';
  const capePath =
    pose === 'fly'
      ? 'M168 236 C 86 250 48 330 72 456 C 118 400 168 372 214 348 C 188 300 176 268 168 236 Z'
      : 'M170 232 C 108 250 86 332 96 452 C 148 404 186 368 228 346 C 204 300 186 262 170 232 Z';
  const arm =
    pose === 'point'
      ? `<g fill="#e31b23">
          <rect x="248" y="262" width="92" height="28" rx="14" transform="rotate(-18 248 276)"/>
          <circle cx="338" cy="248" r="16"/>
          <rect x="332" y="214" width="14" height="42" rx="7"/>
        </g>`
      : pose === 'like'
        ? `<g fill="#e31b23">
          <rect x="236" y="250" width="36" height="78" rx="18"/>
          <rect x="248" y="214" width="18" height="52" rx="8"/>
          <circle cx="257" cy="208" r="12"/>
        </g>`
        : `<g fill="#e31b23">
          <rect x="132" y="262" width="28" height="78" rx="14"/>
          <rect x="240" y="262" width="28" height="78" rx="14"/>
        </g>`;
  const face =
    pose === 'back'
      ? ''
      : pose === 'side'
      ? `<ellipse cx="214" cy="156" rx="46" ry="52" fill="#ffe1c4"/>
         <circle cx="230" cy="150" r="7" fill="#1d2433"/>
         <path d="M222 172 q 16 12 28 2" fill="none" stroke="#c45d4a" stroke-width="4" stroke-linecap="round"/>`
      : `<circle cx="200" cy="158" r="54" fill="#ffe1c4"/>
         <circle cx="180" cy="152" r="7" fill="#1d2433"/>
         <circle cx="220" cy="152" r="7" fill="#1d2433"/>
         <circle cx="177" cy="149" r="2.4" fill="#fff"/>
         <circle cx="217" cy="149" r="2.4" fill="#fff"/>
         <path d="M178 176 q 22 16 44 0" fill="none" stroke="#c45d4a" stroke-width="5" stroke-linecap="round"/>`;
  const head =
    pose === 'bust'
      ? ''
      : `<ellipse cx="200" cy="118" rx="78" ry="92" fill="#e31b23"/>
         <ellipse cx="200" cy="78" rx="28" ry="16" fill="#ff5b63" opacity=".35"/>`;
  const body = `<rect x="148" y="228" width="104" height="156" rx="36" fill="#f7fbff" stroke="#d7e4f0" stroke-width="4"/>
    ${pose === 'back' ? '' : `<circle cx="200" cy="286" r="22" fill="#e31b23"/>
    <text x="200" y="294" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="900" fill="#fff">K</text>`}
    <rect x="156" y="372" width="32" height="54" rx="14" fill="#e31b23"/>
    <rect x="212" y="372" width="32" height="54" rx="14" fill="#e31b23"/>`;
  const crop = poseTransform;
  return `<g transform="${crop}">
    <path d="${capePath}" fill="${capeC}" stroke="${capeS}" stroke-width="4"/>
    ${head || `<ellipse cx="200" cy="118" rx="78" ry="92" fill="#e31b23"/><ellipse cx="200" cy="78" rx="28" ry="16" fill="#ff5b63" opacity=".35"/>`}
    ${body}
    ${arm}
    ${face}
  </g>`;
}

function portraitSvg(pose: VideoHeroPose, cape: VideoCapeVersion, label: string): string {
  return svgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520">
  <defs>
    <linearGradient id="bg${pose}${cape}" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#e8f6ff"/><stop offset="1" stop-color="#f7fff4"/>
    </linearGradient>
  </defs>
  <rect width="400" height="520" rx="36" fill="url(#bg${pose}${cape})"/>
  <circle cx="320" cy="72" r="58" fill="#69BE28" opacity=".16"/>
  <circle cx="64" cy="430" r="70" fill="#1d6bff" opacity=".12"/>
  ${xiaoKMarkup(pose, cape)}
  <text x="200" y="492" text-anchor="middle" font-family="Microsoft YaHei,Arial,sans-serif" font-size="20" font-weight="800" fill="#103C8F">${escapeXml(label)}</text>
</svg>`);
}

export const VIDEO_HERO_POSES: { id: VideoHeroPose; label: string }[] = [
  { id: 'front', label: '正视图' },
  { id: 'side', label: '侧视图' },
  { id: 'back', label: '背视图' },
  { id: 'fly', label: '动作参考' },
];

export function heroPoseUrl(pose: VideoHeroPose, cape: VideoCapeVersion): string {
  return portraitSvg(pose, cape, VIDEO_HERO_POSES.find((item) => item.id === pose)?.label || '小K');
}

function riceBowl(x: number, y: number, scale: number): string {
  const s = scale;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="18" rx="54" ry="16" fill="#d9c7a2"/>
    <path d="M-48 8 Q0 48 48 8 L40 -6 Q0 18 -40 -6 Z" fill="#f4eee0" stroke="#c9b48a" stroke-width="4"/>
    <ellipse cx="0" cy="-2" rx="34" ry="14" fill="#fff7e8"/>
  </g>`;
}

function plateFoods(riceSmall: boolean): string {
  return `<g>
    <ellipse cx="360" cy="760" rx="210" ry="90" fill="#f3f0ea" stroke="#d7c9b2" stroke-width="8"/>
    <ellipse cx="300" cy="742" rx="52" ry="34" fill="#7bc47b"/>
    <ellipse cx="372" cy="728" rx="40" ry="28" fill="#f2c14e"/>
    <ellipse cx="430" cy="748" rx="46" ry="30" fill="#ef7a6a"/>
    <ellipse cx="250" cy="768" rx="36" ry="24" fill="#f6d36b"/>
    ${riceBowl(riceSmall ? 318 : 348, riceSmall ? 790 : 784, riceSmall ? 0.62 : 1)}
  </g>`;
}

function frameSvg(kind: 'fly' | 'plate' | 'drink' | 'end', riceSmall = false): string {
  const title =
    kind === 'fly' ? '开场飞入' : kind === 'plate' ? '均衡搭配' : kind === 'drink' ? '少糖少饮料' : '结尾总结';
  const sky = `<defs>
    <linearGradient id="fbg${kind}${riceSmall ? 'r' : ''}" x1="0" y1="0" x2="0" y2="1">
      <stop stop-color="#d9f1ff"/><stop offset="1" stop-color="#f7fbff"/>
    </linearGradient>
  </defs>
  <rect width="720" height="1280" fill="url(#fbg${kind}${riceSmall ? 'r' : ''})"/>`;
  const hero =
    kind === 'fly'
      ? `<g transform="translate(40 80) scale(1.15)">${xiaoKMarkup('fly', 'base')}</g>`
      : kind === 'plate'
        ? `<g transform="translate(220 760) scale(.72)">${xiaoKMarkup('point', 'base')}</g>`
        : kind === 'drink'
          ? `<g transform="translate(40 520) scale(.9)">${xiaoKMarkup('front', 'base')}</g>
             <g transform="translate(430 560)">
               <rect x="0" y="0" width="86" height="86" rx="18" fill="#e31b23"/>
               <path d="M22 22 L64 64 M64 22 L22 64" stroke="#fff" stroke-width="12" stroke-linecap="round"/>
             </g>
             <g transform="translate(470 720)">
               <rect x="0" y="0" width="70" height="120" rx="16" fill="#ff8a3d"/>
               <rect x="10" y="14" width="50" height="70" rx="8" fill="#ffd2a8"/>
             </g>`
          : `<g transform="translate(160 620) scale(.95)">${xiaoKMarkup('like', 'base')}</g>`;
  const extra =
    kind === 'plate' || kind === 'end'
      ? plateFoods(riceSmall)
      : kind === 'drink'
        ? ''
        : `<circle cx="360" cy="980" r="86" fill="#e31b23" opacity=".18"/>`;
  return svgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 1280">
  ${sky}
  <text x="48" y="92" font-family="Microsoft YaHei,Arial,sans-serif" font-size="28" font-weight="800" fill="#103C8F">小K小课堂</text>
  <text x="48" y="136" font-family="Microsoft YaHei,Arial,sans-serif" font-size="36" font-weight="900" fill="#103C8F">${title}</text>
  ${extra}
  ${hero}
</svg>`);
}

export const VIDEO_CLIPS: VideoClipDef[] = [
  {
    id: 'clip-1',
    name: '开场与主题',
    range: '0–2秒',
    duration: '2秒',
    start: 0,
    summary: '小K正面出场，点出糖尿病患者如何健康饮食。',
    narration: '糖尿病患者，应该如何健康饮食？记住下面三个简单原则。',
    bridge: '镜头推向均衡餐盘。',
  },
  {
    id: 'clip-2',
    name: '均衡搭配',
    range: '2–4秒',
    duration: '2秒',
    start: 2,
    summary: '餐盘食物环绕进入，小K指出均衡搭配。',
    narration: '第一点，均衡搭配。',
    bridge: '镜头切到主食份量。',
  },
  {
    id: 'clip-3',
    name: '控制总量',
    range: '4–6秒',
    duration: '2秒',
    start: 4,
    summary: '小K提示米饭和主食要注意份量。',
    narration: '第二点，控制总量。主食也要注意份量，别吃太多。',
    bridge: '切换到饮料选择。',
  },
  {
    id: 'clip-4',
    name: '少糖少饮料',
    range: '6–8秒',
    duration: '2秒',
    start: 6,
    summary: '小K出示叉号，提示少喝含糖饮料。',
    narration: '第三点，少糖、少饮料。日常饮品优先选择白水。',
    bridge: '接到结尾餐盘总结。',
  },
  {
    id: 'clip-5',
    name: '结尾总结',
    range: '8–10秒',
    duration: '2秒',
    start: 8,
    summary: '小K站在完整餐盘上点赞并定格。',
    narration: '均衡搭配，控制总量，减少含糖饮料。科学管理饮食，让健康更轻松。',
    bridge: '定格结束，适合接片尾字幕。',
  },
];

export const DEFAULT_STORYBOARD: VideoStoryboardRow[] = [
  {
    id: 's0',
    time: '0–1秒',
    start: 0,
    end: 1,
    clipId: 'clip-1',
    shot: '全景',
    heroPos: '画面左上方',
    action: '从左上方飞入，披风向后飘动',
    scene: '蓝白渐变天空',
    elements: '小K、飘动披风、天空',
    change: '角色由画面外进入',
    line: '',
    narration: '糖尿病患者，应该如何健康饮食？',
    subtitle: '无',
    bridge: '继续飞向画面中央光圈',
  },
  {
    id: 's1',
    time: '1–2秒',
    start: 1,
    end: 2,
    clipId: 'clip-1',
    shot: '全景推至中景',
    heroPos: '画面中央红色光圈',
    action: '落在红色光圈上',
    scene: '蓝白天空 + 红色光圈',
    elements: '小K、红色光圈、标题位',
    change: '镜头推进，角色落地',
    line: '',
    narration: '糖尿病患者，应该如何健康饮食？',
    subtitle: '糖尿病患者如何健康饮食？',
    bridge: '标题停留，准备正面微笑',
  },
  {
    id: 's2',
    time: '2–3秒',
    start: 2,
    end: 3,
    clipId: 'clip-1',
    shot: '中景',
    heroPos: '画面中央',
    action: '正面微笑',
    scene: '标题继续停留',
    elements: '小K、主题字幕',
    change: '为饮食画面作过渡',
    line: '',
    narration: '记住下面三个简单原则。',
    subtitle: '糖尿病患者如何健康饮食？',
    bridge: '切到均衡餐盘',
  },
  {
    id: 's3',
    time: '3–4秒',
    start: 3,
    end: 4,
    clipId: 'clip-2',
    shot: '中景',
    heroPos: '均衡餐盘右下方',
    action: '站在餐盘旁迎接食物入画',
    scene: '均衡餐盘',
    elements: '蔬菜、鱼、肉、玉米、鸡蛋',
    change: '食物环绕进入画面',
    line: '',
    narration: '第一点，均衡搭配。',
    subtitle: '第一点：均衡搭配',
    bridge: '镜头轻微横移到主食',
  },
  {
    id: 's4',
    time: '4–5秒',
    start: 4,
    end: 5,
    clipId: 'clip-3',
    shot: '中景横移',
    heroPos: '餐盘前方',
    action: '指向不同食物',
    scene: '面包、米饭和甜点依次出现',
    elements: '面包、米饭、甜点、小K',
    change: '主食份量被强调',
    line: '',
    narration: '第二点，控制总量。',
    subtitle: '第二点：控制总量',
    bridge: '米饭碗移到左侧',
  },
  {
    id: 's5',
    time: '5–6秒',
    start: 5,
    end: 6,
    clipId: 'clip-3',
    shot: '近景',
    heroPos: '米饭碗右侧',
    action: '伸手提示适量并点赞',
    scene: '米饭碗移到画面左侧',
    elements: '米饭碗、小K点赞',
    change: '份量提示出现',
    line: '',
    narration: '主食也要注意份量，别吃太多。',
    subtitle: '别吃太多哦',
    bridge: '切到含糖饮料',
  },
  {
    id: 's6',
    time: '6–7秒',
    start: 6,
    end: 7,
    clipId: 'clip-4',
    shot: '中景',
    heroPos: '含糖饮料左侧',
    action: '举起带叉号的提示牌',
    scene: '含糖饮料出现在画面右侧',
    elements: '含糖饮料、红色叉号牌',
    change: '风险提示入画',
    line: '',
    narration: '第三点，少糖、少饮料。',
    subtitle: '第三点：少糖少饮料',
    bridge: '饮料切换成白水',
  },
  {
    id: 's7',
    time: '7–8秒',
    start: 7,
    end: 8,
    clipId: 'clip-4',
    shot: '中景',
    heroPos: '水杯旁',
    action: '转身指向水杯并点赞',
    scene: '含糖饮料切换成白水',
    elements: '白水杯、小K',
    change: '风险画面转为推荐画面',
    line: '',
    narration: '日常饮品优先选择白水。',
    subtitle: '优先选择白水',
    bridge: '拉到完整餐盘',
  },
  {
    id: 's8',
    time: '8–9秒',
    start: 8,
    end: 9,
    clipId: 'clip-5',
    shot: '全景缓慢拉近',
    heroPos: '餐盘中央',
    action: '站在餐盘中央面向观众',
    scene: '包含蔬菜、肉类、玉米和鸡蛋的餐盘',
    elements: '完整餐盘、小K',
    change: '镜头缓慢拉近',
    line: '',
    narration: '均衡搭配，控制总量，减少含糖饮料。',
    subtitle: '小K小课堂',
    bridge: '准备定格点赞',
  },
  {
    id: 's9',
    time: '9–10秒',
    start: 9,
    end: 10,
    clipId: 'clip-5',
    shot: '近景定格',
    heroPos: '前景餐盘后方',
    action: '面向观众点赞',
    scene: '餐盘停留在前景',
    elements: '餐盘、小K点赞、片尾字',
    change: '画面逐渐定格',
    line: '',
    narration: '科学管理饮食，让健康更轻松。',
    subtitle: '血糖管理，健康轻松',
    bridge: '结束',
  },
];

export function storyboardToPlainText(rows: VideoStoryboardRow[]): string {
  return VIDEO_CLIPS
    .map((clip, index) => {
      const clipRows = rows.filter((row) => row.clipId === clip.id);
      const shots = Array.from(new Set(clipRows.map((row) => row.shot).filter(Boolean)));
      const actions = clipRows.map((row) => `${row.heroPos}，${row.action}`).filter(Boolean);
      const subtitles = Array.from(
        new Set(clipRows.map((row) => row.subtitle).filter((text) => text && text !== '无'))
      );

      return [
        `【分镜${index + 1}｜${clip.range}｜${clip.name}】`,
        `画面内容：${clip.summary}`,
        `镜头与动作：${shots.join('转')}；小K位于${actions.join('；随后位于')}。`,
        `解说词：${clip.narration}`,
        `屏幕字幕：${subtitles.join(' / ') || '无'}`,
        `衔接方式：${clip.bridge}`,
      ].join('\n');
    })
    .join('\n\n');
}

export function shotsFromStoryboard(_rows: VideoStoryboardRow[] = DEFAULT_STORYBOARD): VideoClipDef[] {
  return VIDEO_CLIPS;
}

export function findShotDef(id: string, rows: VideoStoryboardRow[] = DEFAULT_STORYBOARD): VideoClipDef | undefined {
  return shotsFromStoryboard(rows).find((item) => item.id === id) || VIDEO_CLIPS.find((item) => item.id === id);
}

export function productionClipId(id: string, rows: VideoStoryboardRow[] = DEFAULT_STORYBOARD): string {
  if (PRODUCTION_STILLS[id]) return id;
  return rows.find((row) => row.id === id)?.clipId || id;
}

export function firstFrameUrl(clipId: string, version: VideoFrameVersion = 'base'): string {
  const prodId = productionClipId(clipId);
  if (prodId === 'clip-2' && version === 'rice') return PRODUCTION_STILLS['clip-3'];
  return PRODUCTION_STILLS[prodId] || VIDEO_HERO_IMAGE_URL;
}

function shotIds(rows: VideoStoryboardRow[]): string[] {
  return shotsFromStoryboard(rows).map((item) => item.id);
}

function resolveStudioClipId(studio: VideoStudioState, clipId: string): string {
  if (studio.clips.some((clip) => clip.id === clipId) || studio.clipOrder.includes(clipId)) return clipId;
  const fromStory = studio.storyboard.find((row) => row.clipId === clipId);
  return fromStory?.id || clipId;
}

function clipVersions(clipId: string): VideoClipVersion[] {
  const poster = firstFrameUrl(clipId);
  return [
    {
      id: 'A',
      label: '版本A',
      posterUrl: poster,
      videoUrl: VIDEO_STUDIO_FULL_URL,
      note: '当前确认版本，按已确认首帧生成。',
    },
  ];
}

export function emptyVideoStudio(brand = '可申达'): VideoStudioState {
  const shots = shotsFromStoryboard();
  return {
    brief: defaultVideoBrief(brand),
    briefConfirmed: false,
    view: 'brief',
    heroReady: false,
    heroConfirmed: false,
    heroCape: 'base',
    heroBrush: false,
    heroCompared: false,
    visualRefUrl: null,
    storyboardReady: false,
    storyboard: DEFAULT_STORYBOARD.map((row) => ({ ...row })),
    storyboardText: storyboardToPlainText(DEFAULT_STORYBOARD),
    selectedRowId: 's0',
    selectedClipId: shots[0]?.id || 'clip-1',
    complianceChecked: false,
    framesReady: false,
    framesConfirmed: false,
    frameVersions: Object.fromEntries(shots.map((shot) => [shot.id, 'base' as VideoFrameVersion])),
    frameBrushClipId: null,
    frameCompared: false,
    selectedFrameIds: [],
    clipsReady: false,
    clips: shots.map((shot) => ({
      id: shot.id,
      selectedVersionId: 'A',
      versions: clipVersions(shot.id),
    })),
    clipOrder: shots.map((shot) => shot.id),
    removedClipIds: [],
    selectedClipIds: [],
    transitions: Object.fromEntries(shots.slice(0, -1).map((shot) => [shot.id, 'cut' as VideoTransition])),
    timelinePreviewing: false,
    finalReady: false,
    teamReady: false,
    submitReady: false,
    submitted: false,
  };
}

export function videoStudioTabForView(view: VideoStudioView): TabKey {
  if (view === 'brief') return 'video-brief';
  if (view === 'hero') return 'video-hero';
  if (view === 'storyboard') return 'video-storyboard';
  if (view === 'frames') return 'video-frames';
  if (view === 'team') return 'team';
  if (view === 'submit') return 'submit';
  return 'video-render';
}

export function videoStudioViewForTab(tab: TabKey | null, studio: VideoStudioState): VideoStudioView {
  if (tab === 'video-brief') return 'brief';
  if (tab === 'video-hero') return 'hero';
  if (tab === 'video-storyboard') return 'storyboard';
  if (tab === 'video-frames') return 'frames';
  if (tab === 'team') return 'team';
  if (tab === 'submit') return 'submit';
  if (tab === 'video-render') return studio.finalReady ? 'final' : 'clips';
  return studio.view;
}

export const VIDEO_STUDIO_TABS: TabKey[] = [
  'video-brief',
  'video-hero',
  'video-storyboard',
  'video-frames',
  'video-render',
];

export function isVideoStudioTab(tab: TabKey | null | undefined): boolean {
  return Boolean(tab && (VIDEO_STUDIO_TABS.includes(tab) || tab === 'team' || tab === 'submit'));
}

export function toVideoResult(studio: VideoStudioState): VideoResult {
  return {
    title: `${studio.brief.brand}·${studio.brief.theme}`,
    coverSuggestion: '小K红白卡通形象，9:16 患者教育短视频。',
    segments: VIDEO_CLIPS.map((clip) => ({
      time: clip.range,
      scene: clip.summary,
      narration: clip.narration,
      compliance: studio.complianceChecked ? '已完成脚本合规检查' : '患者教育，不涉及治疗承诺',
    })),
  };
}

function extraClipVersion(clipId: string, nextId: VideoClipVersionId): VideoClipVersion {
  const rice = productionClipId(clipId) === 'clip-2' && nextId !== 'A';
  return {
    id: nextId,
    label: `版本${nextId}`,
    posterUrl: firstFrameUrl(clipId, rice ? 'rice' : 'base'),
    videoUrl: VIDEO_STUDIO_FULL_URL,
    note:
      nextId === 'B'
        ? '保持当前主角和首帧设定，并调整了食物进入画面的节奏。'
        : '第三候选，动作幅度略大，字幕出现更早。',
  };
}

export const VIDEO_STUDIO_REPLIES = {
  confirmBrief:
    '视频需求已经确认。本次将制作一条面向糖尿病患者及家属的10秒竖版科普视频，通过卡通健康助手讲解均衡搭配、控制总量和减少含糖饮料三个核心信息。接下来可以生成主视觉参考。',
  generateHero:
    '已根据视频需求和现有患者教育资料，生成主视觉参考。当前为小K红白配色的3D卡通主视觉，可在中间区域画圈修改，或上传替换后继续生成分镜脚本。',
  capeEdit: '已根据您的描述调整主视觉参考，小K的披风已经改为更深的红色，其他人物特征保持当前设定。',
  generateStoryboard:
    '已生成五段完整分镜脚本，与五张分镜参考图一一对应。可直接在中间区域编辑每段的画面、镜头动作、解说词、字幕和衔接方式，确认后即可生成分镜参考图。',
  simplifyFifth: '已将第五秒的解说词改得更简洁，完整脚本已同步更新。',
  compliance: '已完成脚本合规检查。当前逐秒脚本均为患者教育表述，未出现疗效承诺或超出适应症的内容。',
  generateFrames:
    '已按完整分镜脚本生成分镜参考图。可在中间大图预览中用画笔圈选修改，或点下方缩略图切换分镜。',
  riceEdit: '已根据您的修改意见缩小餐盘中的米饭份量。人物、餐盘和其他食物保持当前构图。',
  generateClips: '已按当前分镜参考图生成对应视频片段。可在中间横向缩略图中勾选后重新生成或修改。',
  regenerateFrames: '已重新生成当前分镜参考图，可继续用画笔圈选修改或切换其他分镜。',
  regenerateClips: '已重新生成所选视频片段。可继续播放预览、勾选修改，或合并完整视频。',
  newVersion: '已为片段2生成一个新版本。新版本保持当前主角和首帧设定，并调整了食物进入画面的节奏。您可以在中间区域对比两个版本。',
  selectB: '已将片段2的当前版本切换为版本B，后续合并将使用该版本。',
  preview: '正在按当前时间线顺序预览拼接效果。片段之间使用已选择的转场方式。',
  compose: '完整视频已合并。当前版本为可申达·糖尿病患者如何健康饮食，时长10秒，比例9:16。',
  team: '已进入意见收集。意见可以关联到完整视频、具体片段、时间点、分镜脚本或分镜参考图。',
  submit: '已提交 Veeva 审批。提交包包含完整视频 V1、分镜脚本、合规检查记录和意见收集结果。',
};

export function matchVideoStudioCommand(text: string): VideoStudioAction | null {
  const t = text.replace(/\s+/g, '');
  if (/确认视频需求|完成视频需求/.test(t)) return { type: 'confirmBrief' };
  if (/编辑视频需求/.test(t)) return { type: 'editBrief' };
  if (/生成主视觉参考|生成主角形象/.test(t)) return { type: 'generateHero' };
  if (/确认主角形象|确认主视觉/.test(t)) return { type: 'confirmHero' };
  if (/披风/.test(t) && /深红|更深/.test(t)) return { type: 'applyCapeEdit' };
  if (/生成分镜脚本/.test(t)) return { type: 'generateStoryboard' };
  if (/第五秒/.test(t) && /解说/.test(t)) return { type: 'simplifyFifthSecond' };
  if (/检查脚本合规|脚本合规/.test(t)) return { type: 'checkCompliance' };
  if (/生成分镜参考图|生成片段首帧|确认并生成分镜参考图/.test(t)) return { type: 'generateFrames' };
  if (/米饭/.test(t) && /缩小/.test(t)) return { type: 'applyRiceEdit' };
  if (/确认全部首帧|确认全部分镜参考图/.test(t)) return { type: 'confirmAllFrames' };
  if (/重新生成/.test(t)) return { type: 'regenerateSelected' };
  if (/视频生成|生成分段视频/.test(t)) return { type: 'generateClips' };
  if ((/为第二/.test(t) || /第二个片段/.test(t)) && /新版本/.test(t)) {
    return { type: 'addClipVersion', clipId: 'clip-2' };
  }
  if (/生成新版本/.test(t)) return { type: 'addClipVersion' };
  if (/查看第二/.test(t) && /片段/.test(t)) return { type: 'selectClip', clipId: 'clip-2' };
  if (/选择片段2/.test(t) && /版本B/.test(t)) return { type: 'selectClipVersion', clipId: 'clip-2', versionId: 'B' };
  if (/片段2/.test(t) && /版本B/.test(t)) return { type: 'selectClipVersion', clipId: 'clip-2', versionId: 'B' };
  if (/预览拼接/.test(t)) return { type: 'previewTimeline' };
  if (/合成完整视频|合并完整视频/.test(t)) return { type: 'composeFinal' };
  if (/查看完整视频/.test(t)) return { type: 'goto', view: 'final' };
  if (/查看完整脚本/.test(t)) return { type: 'goto', view: 'storyboard' };
  if (/查看分镜参考图|查看片段首帧/.test(t)) return { type: 'goto', view: 'frames' };
  if (/查看分段视频|调整拼接/.test(t)) return { type: 'goto', view: 'clips' };
  if (/意见收集/.test(t)) return { type: 'startTeamReview' };
  if (/提交Veeva|提交veeva|Veeva审批/.test(t)) return { type: 'confirmSubmit' };
  return null;
}

export function reduceVideoStudio(
  prev: VideoStudioState,
  action: VideoStudioAction
): VideoStudioReduceResult {
  const reply = (state: VideoStudioState, aiHtml?: string, tab?: TabKey, extra?: Partial<VideoStudioReduceResult>) => ({
    state,
    aiHtml,
    tab,
    ...extra,
  });

  switch (action.type) {
    case 'setBrief':
      return reply({ ...prev, brief: action.brief, view: 'brief' });
    case 'confirmBrief': {
      if (!isVideoBriefComplete(prev.brief)) {
        return { state: prev, toast: '请先完成全部必填视频需求' };
      }
      return reply(
        { ...prev, briefConfirmed: true, view: 'brief' },
        VIDEO_STUDIO_REPLIES.confirmBrief,
        'video-brief'
      );
    }
    case 'editBrief':
      return reply({ ...prev, view: 'brief', briefConfirmed: prev.briefConfirmed }, undefined, 'video-brief');
    case 'generateHero': {
      if (!isVideoBriefComplete(prev.brief)) {
        return { state: prev, toast: '请先完成全部必填视频需求' };
      }
      return reply(
        {
          ...prev,
          briefConfirmed: true,
          heroReady: true,
          heroConfirmed: false,
          view: 'hero',
          heroBrush: false,
          visualRefUrl: prev.visualRefUrl || VIDEO_HERO_IMAGE_URL,
        },
        VIDEO_STUDIO_REPLIES.generateHero,
        'video-hero'
      );
    }
    case 'openHeroBrush':
    case 'continueHeroBrush':
      return reply({ ...prev, view: 'hero', heroBrush: true, heroCompared: false }, undefined, 'video-hero');
    case 'compareHero':
      return reply({ ...prev, view: 'hero', heroCompared: !prev.heroCompared }, undefined, 'video-hero');
    case 'applyCapeEdit':
      return reply(
        {
          ...prev,
          heroReady: true,
          heroCape: 'deep',
          heroBrush: false,
          heroCompared: true,
          visualRefUrl: prev.visualRefUrl || VIDEO_HERO_IMAGE_URL,
          view: 'hero',
        },
        VIDEO_STUDIO_REPLIES.capeEdit,
        'video-hero'
      );
    case 'regenerateHero':
      return reply(
        {
          ...prev,
          heroReady: true,
          heroConfirmed: false,
          heroCape: 'base',
          heroBrush: false,
          heroCompared: false,
          visualRefUrl: VIDEO_HERO_IMAGE_URL,
          view: 'hero',
        },
        '已重新生成主视觉参考，当前恢复为红白配色的基础版本。',
        'video-hero'
      );
    case 'confirmHero':
      return reply(
        { ...prev, heroReady: true, heroConfirmed: true, heroBrush: false, view: 'hero' },
        '主视觉参考已确认。接下来可以生成分镜脚本。',
        'video-hero'
      );
    case 'setVisualRefUrl':
      return reply({ ...prev, visualRefUrl: action.url, heroReady: true, view: 'hero' }, undefined, 'video-hero');
    case 'generateStoryboard':
      return reply(
        {
          ...prev,
          briefConfirmed: prev.briefConfirmed || isVideoBriefComplete(prev.brief),
          heroReady: true,
          heroConfirmed: true,
          storyboardReady: true,
          storyboardText: prev.storyboardText || storyboardToPlainText(prev.storyboard),
          view: 'storyboard',
        },
        VIDEO_STUDIO_REPLIES.generateStoryboard,
        'video-storyboard'
      );
    case 'setStoryboardText':
      return reply({ ...prev, storyboardText: action.text, view: 'storyboard' });
    case 'selectRow':
      return reply({
        ...prev,
        selectedRowId: action.rowId,
        selectedClipId: prev.storyboard.find((row) => row.id === action.rowId)?.clipId || prev.selectedClipId,
      });
    case 'selectClip': {
      const clipId = resolveStudioClipId(prev, action.clipId);
      return reply(
        {
          ...prev,
          selectedClipId: clipId,
          view: prev.clipsReady ? 'clips' : prev.framesReady ? 'frames' : prev.view,
        },
        undefined,
        prev.clipsReady
          ? 'video-render'
          : prev.framesReady
            ? 'video-frames'
            : prev.storyboardReady
              ? 'video-storyboard'
              : undefined
      );
    }
    case 'editStoryboardRow':
      return reply({
        ...prev,
        storyboard: prev.storyboard.map((row) =>
          row.id === action.rowId ? { ...row, ...action.patch } : row
        ),
      });
    case 'editNarration':
      return reply({
        ...prev,
        storyboard: prev.storyboard.map((row) =>
          row.id === action.rowId ? { ...row, narration: action.narration } : row
        ),
      });
    case 'simplifyFifthSecond':
      return reply(
        {
          ...prev,
          storyboardReady: true,
          view: 'storyboard',
          selectedRowId: 's4',
          storyboard: prev.storyboard.map((row) =>
            row.id === 's4' ? { ...row, narration: '第二点：少吃一点。' } : row
          ),
          storyboardText: prev.storyboardText.replace(
            '解说词：第二点，控制总量。',
            '解说词：第二点：少吃一点。'
          ),
        },
        VIDEO_STUDIO_REPLIES.simplifyFifth,
        'video-storyboard'
      );
    case 'checkCompliance':
      return reply(
        { ...prev, complianceChecked: true, view: 'storyboard' },
        VIDEO_STUDIO_REPLIES.compliance,
        'video-storyboard'
      );
    case 'generateFrames': {
      const ids = shotIds(prev.storyboard);
      const focusId = ids[0] || 'clip-1';
      return reply(
        {
          ...prev,
          heroReady: true,
          heroConfirmed: true,
          storyboardReady: true,
          framesReady: true,
          selectedFrameIds: ids,
          selectedClipId: focusId,
          frameBrushClipId: focusId,
          frameVersions: {
            ...Object.fromEntries(ids.map((id) => [id, 'base' as VideoFrameVersion])),
            ...prev.frameVersions,
          },
          view: 'frames',
        },
        VIDEO_STUDIO_REPLIES.generateFrames,
        'video-frames'
      );
    }
    case 'openFrameBrush':
    case 'continueFrameBrush':
      return reply(
        {
          ...prev,
          view: 'frames',
          frameBrushClipId: action.type === 'openFrameBrush' ? action.clipId : prev.frameBrushClipId || 'clip-3',
          frameCompared: false,
        },
        undefined,
        'video-frames'
      );
    case 'compareFrame':
      return reply({ ...prev, view: 'frames', frameCompared: !prev.frameCompared }, undefined, 'video-frames');
    case 'applyRiceEdit': {
      return reply(
        {
          ...prev,
          framesReady: true,
          frameVersions: { ...prev.frameVersions, 'clip-3': 'rice', 'clip-2': 'rice' },
          frameBrushClipId: null,
          frameCompared: true,
          view: 'frames',
          selectedClipId: 'clip-3',
        },
        VIDEO_STUDIO_REPLIES.riceEdit,
        'video-frames'
      );
    }
    case 'regenerateFrame':
      return reply(
        {
          ...prev,
          frameVersions: { ...prev.frameVersions, [action.clipId]: 'base' },
          selectedClipId: action.clipId,
          frameBrushClipId: action.clipId,
          view: 'frames',
        },
        `已重新生成${findShotDef(action.clipId, prev.storyboard)?.name || '该片段'}首帧。`,
        'video-frames'
      );
    case 'confirmFrame':
      return reply({ ...prev, view: 'frames' }, undefined, 'video-frames');
    case 'confirmAllFrames':
      return reply(
        {
          ...prev,
          framesConfirmed: true,
          selectedFrameIds: shotIds(prev.storyboard),
          view: 'frames',
        },
        '全部分镜参考图已确认，可以开始视频生成。',
        'video-frames'
      );
    case 'toggleFrameSelect': {
      const selected = prev.selectedFrameIds.includes(action.id)
        ? prev.selectedFrameIds.filter((id) => id !== action.id)
        : [...prev.selectedFrameIds, action.id];
      return reply({ ...prev, selectedFrameIds: selected, view: 'frames' }, undefined, 'video-frames');
    }
    case 'selectAllFrames':
      return reply(
        {
          ...prev,
          selectedFrameIds: action.selected ? shotIds(prev.storyboard) : [],
          view: 'frames',
        },
        undefined,
        'video-frames'
      );
    case 'removeFrameSelect':
      return reply(
        {
          ...prev,
          selectedFrameIds: prev.selectedFrameIds.filter((id) => id !== action.id),
          view: 'frames',
        },
        undefined,
        'video-frames'
      );
    case 'regenerateSelectedFrames': {
      const ids = prev.selectedFrameIds;
      if (!ids.length) return { state: prev, toast: '请先勾选分镜参考图' };
      const frameVersions = { ...prev.frameVersions };
      ids.forEach((id) => {
        frameVersions[id] = 'base';
      });
      return reply(
        {
          ...prev,
          framesReady: true,
          frameVersions,
          frameCompared: false,
          frameBrushClipId: null,
          view: 'frames',
        },
        VIDEO_STUDIO_REPLIES.regenerateFrames,
        'video-frames'
      );
    }
    case 'generateClips': {
      const allIds = shotIds(prev.storyboard);
      const useIds = allIds;
      const shots = shotsFromStoryboard(prev.storyboard);
      return reply(
        {
          ...prev,
          storyboardReady: true,
          framesReady: true,
          framesConfirmed: true,
          clipsReady: true,
          clips: shots.map((shot) => {
            const existing = prev.clips.find((clip) => clip.id === shot.id);
            return (
              existing || {
                id: shot.id,
                selectedVersionId: 'A' as const,
                versions: clipVersions(shot.id),
              }
            );
          }),
          clipOrder: useIds,
          selectedClipIds: useIds,
          removedClipIds: allIds.filter((id) => !useIds.includes(id)),
          transitions: {
            ...Object.fromEntries(useIds.slice(0, -1).map((id) => [id, prev.transitions[id] || ('cut' as VideoTransition)])),
          },
          view: 'clips',
        },
        VIDEO_STUDIO_REPLIES.generateClips,
        'video-render',
        { syncVideo: true }
      );
    }
    case 'addClipVersion': {
      const clipId = resolveStudioClipId(
        prev,
        action.clipId || prev.selectedClipIds[0] || prev.selectedClipId || 'clip-2'
      );
      const clips = prev.clips.map((clip) => {
        if (clip.id !== clipId) return clip;
        if (clip.versions.length >= 3) return clip;
        const nextId = (['A', 'B', 'C'] as VideoClipVersionId[])[clip.versions.length];
        return {
          ...clip,
          versions: [...clip.versions, extraClipVersion(clip.id, nextId)],
          selectedVersionId: nextId,
        };
      });
      return reply(
        { ...prev, clipsReady: true, clips, selectedClipId: clipId, view: 'clips' },
        productionClipId(clipId, prev.storyboard) === 'clip-2' ? VIDEO_STUDIO_REPLIES.newVersion : '已为当前片段生成一个新版本。',
        'video-render'
      );
    }
    case 'selectClipVersion': {
      const clipId = resolveStudioClipId(prev, action.clipId);
      return reply(
        {
          ...prev,
          clips: prev.clips.map((clip) =>
            clip.id === clipId ? { ...clip, selectedVersionId: action.versionId } : clip
          ),
          selectedClipId: clipId,
          view: 'clips',
        },
        productionClipId(clipId, prev.storyboard) === 'clip-2' && action.versionId === 'B'
          ? VIDEO_STUDIO_REPLIES.selectB
          : undefined,
        'video-render'
      );
    }
    case 'toggleClipSelect': {
      const selected = prev.selectedClipIds.includes(action.id)
        ? prev.selectedClipIds.filter((id) => id !== action.id)
        : [...prev.selectedClipIds, action.id];
      return reply({ ...prev, selectedClipIds: selected, view: 'clips' }, undefined, 'video-render');
    }
    case 'selectAllClips':
      return reply(
        {
          ...prev,
          selectedClipIds: action.selected
            ? prev.clipOrder.filter((id) => !prev.removedClipIds.includes(id))
            : [],
          view: 'clips',
        },
        undefined,
        'video-render'
      );
    case 'removeClipSelect':
      return reply(
        {
          ...prev,
          selectedClipIds: prev.selectedClipIds.filter((id) => id !== action.id),
          view: 'clips',
        },
        undefined,
        'video-render'
      );
    case 'regenerateSelectedClips': {
      const ids = prev.selectedClipIds;
      if (!ids.length) return { state: prev, toast: '请先勾选视频片段' };
      const clips = prev.clips.map((clip) => {
        if (!ids.includes(clip.id)) return clip;
        if (clip.versions.length >= 3) {
          const refreshed = extraClipVersion(clip.id, 'C');
          return {
            ...clip,
            versions: [...clip.versions.slice(0, 2), { ...refreshed, note: '已按当前设定重新生成。' }],
            selectedVersionId: 'C' as VideoClipVersionId,
          };
        }
        const nextId = (['A', 'B', 'C'] as VideoClipVersionId[])[clip.versions.length] || 'C';
        const next = extraClipVersion(clip.id, nextId);
        return {
          ...clip,
          versions: [...clip.versions, { ...next, note: '已按当前设定重新生成。' }],
          selectedVersionId: nextId,
        };
      });
      return reply(
        {
          ...prev,
          clipsReady: true,
          clips,
          selectedClipId: ids[0],
          view: 'clips',
        },
        VIDEO_STUDIO_REPLIES.regenerateClips,
        'video-render'
      );
    }
    case 'regenerateSelected':
      if (prev.view === 'clips') {
        return reduceVideoStudio(prev, { type: 'regenerateSelectedClips' });
      }
      if (prev.view === 'frames') {
        return reduceVideoStudio(prev, { type: 'regenerateSelectedFrames' });
      }
      return { state: prev, toast: '请在分镜参考图或视频生成页勾选后重新生成' };
    case 'reorderClips':
      return reply({ ...prev, clipOrder: action.order, view: 'clips' });
    case 'removeClip':
      return reply({
        ...prev,
        clipOrder: prev.clipOrder.filter((id) => id !== action.clipId),
        removedClipIds: prev.removedClipIds.includes(action.clipId)
          ? prev.removedClipIds
          : [...prev.removedClipIds, action.clipId],
        view: 'clips',
      });
    case 'restoreClip':
      return reply({
        ...prev,
        clipOrder: prev.clipOrder.includes(action.clipId) ? prev.clipOrder : [...prev.clipOrder, action.clipId],
        removedClipIds: prev.removedClipIds.filter((id) => id !== action.clipId),
        view: 'clips',
      });
    case 'setTransition':
      return reply({
        ...prev,
        transitions: { ...prev.transitions, [action.afterClipId]: action.transition },
        view: 'clips',
      });
    case 'previewTimeline':
      return reply(
        { ...prev, clipsReady: true, timelinePreviewing: true, view: 'clips' },
        VIDEO_STUDIO_REPLIES.preview,
        'video-render'
      );
    case 'composeFinal':
      return reply(
        {
          ...prev,
          clipsReady: true,
          finalReady: true,
          timelinePreviewing: false,
          view: 'final',
        },
        VIDEO_STUDIO_REPLIES.compose,
        'video-render',
        { syncVideo: true }
      );
    case 'goto':
      return reply({ ...prev, view: action.view }, undefined, videoStudioTabForView(action.view));
    case 'startTeamReview':
      return reply(
        { ...prev, teamReady: true, view: 'team' },
        VIDEO_STUDIO_REPLIES.team,
        'team',
        { syncVideo: true }
      );
    case 'confirmSubmit':
      return reply(
        { ...prev, submitReady: true, submitted: true, view: 'submit' },
        VIDEO_STUDIO_REPLIES.submit,
        'submit'
      );
    default:
      return { state: prev };
  }
}

export function videoStudioProgress(studio: VideoStudioState) {
  return {
    videoBrief: studio.briefConfirmed,
    videoHero: studio.heroReady,
    videoStoryboard: studio.storyboardReady,
    videoFrames: studio.framesReady,
    video: studio.clipsReady || studio.finalReady,
  };
}

export const VIDEO_STUDIO_OPINIONS = [
  { id: 'op1', target: '完整视频', time: '全片', text: '整体节奏清楚，结尾点赞可以再停留半秒。' },
  { id: 'op2', target: '片段2', time: '4–5秒', text: '主食份量提示很好，字幕可以再大一点。' },
  { id: 'op3', target: '分镜参考图', time: '3秒', text: '餐盘构图清晰，米饭修改后更符合控制总量。' },
  { id: 'op4', target: '分镜脚本', time: '第五秒', text: '解说词简化后更适合口播。' },
];

export function finalVideoMeta(studio: VideoStudioState) {
  const full = getPatientEducationVideoVersion();
  const clipCount = studio.clipOrder.filter((id) => !studio.removedClipIds.includes(id)).length;
  return {
    name: `${studio.brief.brand}·${studio.brief.theme}`,
    duration: studio.brief.duration || '10秒',
    ratio: studio.brief.ratio || '9:16',
    hero: '小K',
    clipCount: clipCount || shotsFromStoryboard(studio.storyboard).length,
    version: 'V1',
    compliance: studio.complianceChecked ? '已完成' : '待检查',
    videoUrl: full.videoUrl,
    posterUrl: firstFrameUrl(studio.clipOrder[0] || 'clip-1'),
  };
}
