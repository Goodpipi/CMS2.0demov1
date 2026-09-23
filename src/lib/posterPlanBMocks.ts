export interface PosterPlanBRequest {
  id: string;
  title: string;
  information: string;
  uploadFileName?: string;
  posterUrl: string;
  sourceKvUrl?: string;
  teamReviewStatus?: 'idle' | 'pending' | 'completed';
  veevaStatus?: 'idle' | 'prepared' | 'submitted';
  createdAt: number;
}

export interface PosterPlanBReference {
  id: string;
  name: string;
  url: string;
}

export interface PosterPlanBKvCandidate {
  id: string;
  title: string;
  url: string;
}

export interface PosterPlanBKvBrief {
  visualReferences: PosterPlanBReference[];
  requirement: string;
  colorPalette: string;
  count: number;
  ratio: string;
  styleId: string;
}

export const POSTER_PLAN_B_RATIOS = ['智能', '9:16', '2:3', '3:4', '1:1', '4:3', '3:2', '16:9'];

export const POSTER_PLAN_B_STYLES = [
  { id: 'tech', name: '蓝黑科技', imageUrl: '/demo-assets/poster-studio/kv.png' },
  { id: 'academic', name: '医学学术', imageUrl: '/demo-assets/poster-studio/countdown-3.png' },
  { id: 'minimal', name: '清晰极简', imageUrl: '/image-templates/radimetrics.png' },
  { id: 'editorial', name: '数据编辑', imageUrl: '/image-templates/confidence-talk.png' },
  { id: 'energetic', name: '动感视觉', imageUrl: '/demo-assets/poster-studio/countdown-2.png' },
  { id: 'premium', name: '深色质感', imageUrl: '/demo-assets/poster-studio/countdown-1.png' },
];

export interface PosterPlanBState {
  draftText: string;
  uploadFileName?: string;
  kvBrief: PosterPlanBKvBrief;
  kvCandidates: PosterPlanBKvCandidate[];
  activeKvCandidateId: string | null;
  selectedKvId: string | null;
  uploadedKvFileName?: string;
  posterTitle: string;
  posterCoreContent: string;
  posterAudience: string;
  posterRatio: string;
  requests: PosterPlanBRequest[];
  currentRequestId: string | null;
  mainKvUrl?: string;
  view?: 'list' | 'new';
}

export function emptyPosterPlanB(): PosterPlanBState {
  return {
    draftText: '',
    kvBrief: {
      visualReferences: [],
      requirement: '',
      colorPalette: '',
      count: 2,
      ratio: '4:3',
      styleId: 'tech',
    },
    kvCandidates: [],
    activeKvCandidateId: null,
    selectedKvId: null,
    posterTitle: '',
    posterCoreContent: '',
    posterAudience: '',
    posterRatio: '3:4',
    requests: [],
    currentRequestId: null,
    view: 'new',
  };
}

function compactLine(text: string, fallback: string, max = 22): string {
  const line = text
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find(Boolean);
  if (!line) return fallback;
  return line.length > max ? `${line.slice(0, max)}…` : line;
}

export function posterPlanBTitle(text: string, fileName?: string): string {
  const fromText = compactLine(text, '', 18);
  if (fromText) return fromText;
  return fileName?.replace(/\.[^.]+$/, '') || '主KV延展海报';
}

export function buildPosterPlanBDataUrl(
  _productName: string,
  _information: string,
  _fileName?: string,
  sequence = 1,
  _sourceMode: 'kv' | 'direct' = 'kv'
): string {
  const posters = [
    '/demo-assets/poster-studio/countdown-3.png',
    '/demo-assets/poster-studio/countdown-2.png',
    '/demo-assets/poster-studio/countdown-1.png',
  ];
  return posters[(Math.max(1, sequence) - 1) % posters.length];
}
