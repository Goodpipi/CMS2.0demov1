import type { HomeEntryIntent } from '@/app/components/homeGuide';
import type { TabKey } from '@/types/session';

export type ContentFlowEntry =
  | 'insight'
  | 'brief'
  | 'literature'
  | 'storyline'
  | 'outline'
  | 'articleOutline'
  | 'longImageOutline'
  | 'ppt'
  | 'copy'
  | 'visual'
  | 'conferencePoster'
  | 'script'
  | 'video'
  | 'team'
  | 'case'
  | 'evidence'
  | 'promo'
  | 'general';

export type ContentFlowStepId =
  | 'create'
  | 'insight'
  | 'brief'
  | 'literature'
  | 'storyline'
  | 'outline'
  | 'articleOutline'
  | 'longImageOutline'
  | 'ppt'
  | 'copy'
  | 'visual'
  | 'kv'
  | 'poster'
  | 'mobile'
  | 'meetingTemplates'
  | 'sessionMaterials'
  | 'video'
  | 'team'
  | 'submit'
  | 'pending';

export type ContentFlowStatus = 'done' | 'current' | 'todo' | 'skipped';

export interface ContentFlowStep {
  id: ContentFlowStepId;
  label: string;
  tab: TabKey | null;
  required: boolean;
  placeholder?: boolean;
}

export interface ContentFlowProgress {
  create: boolean;
  insight: boolean;
  brief: boolean;
  literature: boolean;
  storyline: boolean;
  outline: boolean;
  articleOutline: boolean;
  longImageOutline: boolean;
  ppt: boolean;
  copy: boolean;
  visual: boolean;
  kv: boolean;
  poster: boolean;
  mobile: boolean;
  meetingTemplates: boolean;
  sessionMaterials: boolean;
  video: boolean;
  team: boolean;
  submit: boolean;
}

const CORE: Record<Exclude<ContentFlowStepId, 'pending'>, Omit<ContentFlowStep, 'required'>> = {
  create: { id: 'create', label: '创建任务', tab: null },
  insight: { id: 'insight', label: '话题洞察', tab: 'insight' },
  brief: { id: 'brief', label: '任务提案', tab: 'brief' },
  literature: { id: 'literature', label: '相关文献推荐', tab: 'literature' },
  storyline: { id: 'storyline', label: '故事线', tab: 'storyline' },
  outline: { id: 'outline', label: '页面级大纲', tab: 'ppt-outline' },
  articleOutline: { id: 'articleOutline', label: '推文大纲', tab: 'article-outline' },
  longImageOutline: { id: 'longImageOutline', label: '长图大纲', tab: 'long-image-outline' },
  ppt: { id: 'ppt', label: '生成PPT', tab: 'ppt-design' },
  copy: { id: 'copy', label: '文案', tab: 'copy' },
  visual: { id: 'visual', label: '图片', tab: 'visual' },
  kv: { id: 'kv', label: '生成主KV', tab: 'visual' },
  poster: { id: 'poster', label: '生成会议海报', tab: 'visual' },
  mobile: { id: 'mobile', label: '一键手机', tab: 'visual' },
  meetingTemplates: { id: 'meetingTemplates', label: '生成会议模板', tab: 'meeting-templates' },
  sessionMaterials: { id: 'sessionMaterials', label: '生成场次物料', tab: 'meeting-sessions' },
  video: { id: 'video', label: '视频', tab: 'video-render' },
  team: { id: 'team', label: '意见收集', tab: 'team' },
  submit: { id: 'submit', label: '提交Veeva审批', tab: 'submit' },
};

function articleCopyStep(required: boolean): ContentFlowStep {
  return { id: 'copy', label: '生成推文', tab: 'rich-text', required };
}

function longImageVisualStep(required: boolean): ContentFlowStep {
  return { id: 'visual', label: '长图', tab: 'visual', required };
}

function scriptCopyStep(required: boolean): ContentFlowStep {
  return { id: 'copy', label: '生成话术', tab: 'copy', required };
}

export function flowEntryFromTab(tab: TabKey | null | undefined): ContentFlowEntry | null {
  if (tab === 'insight' || tab === 'topic-recommendation') return 'insight';
  if (tab === 'brief') return 'brief';
  if (tab === 'literature') return 'literature';
  if (tab === 'storyline') return 'storyline';
  if (tab === 'article-outline') return 'articleOutline';
  if (tab === 'long-image-outline') return 'longImageOutline';
  if (tab === 'ppt-outline') return 'outline';
  if (tab === 'ppt-design') return 'ppt';
  if (tab === 'copy') return 'copy';
  if (tab === 'rich-text') return 'articleOutline';
  if (tab === 'visual') return 'visual';
  if (tab === 'meeting-templates' || tab === 'meeting-sessions') return 'conferencePoster';
  if (tab === 'video-render' || tab === 'video-script') return 'video';
  if (tab === 'team') return 'team';
  return null;
}

export function flowEntryFromSource(source?: string | null): ContentFlowEntry | null {
  if (source === 'poster') return 'conferencePoster';
  if (source === 'promo') return 'promo';
  if (source === 'case') return 'case';
  if (source === 'evidence') return 'evidence';
  if (source === 'insight') return 'insight';
  return null;
}

export function omitsBriefLiterature(
  entry?: ContentFlowEntry | null,
  source?: string | null
): boolean {
  return entry === 'case' || entry === 'evidence' || source === 'case' || source === 'evidence';
}

export function omitsTopicInsight(
  entry?: ContentFlowEntry | null,
  source?: string | null
): boolean {
  return entry === 'case' || entry === 'evidence' || source === 'case' || source === 'evidence';
}

const PENDING_FLOW_ENTRIES = new Set<ContentFlowEntry>(['case', 'evidence', 'promo', 'general']);

export function isPendingFlowEntry(entry?: ContentFlowEntry | null): boolean {
  return !entry || PENDING_FLOW_ENTRIES.has(entry);
}

const FLOW_FAMILIES: Record<ContentFlowEntry, ContentFlowEntry[]> = {
  insight: ['insight', 'brief', 'storyline', 'outline', 'ppt', 'team'],
  brief: ['brief', 'storyline', 'outline', 'ppt', 'team'],
  literature: ['brief', 'storyline', 'outline', 'ppt', 'team'],
  storyline: ['storyline', 'outline', 'ppt', 'team'],
  outline: ['outline', 'ppt', 'team'],
  ppt: ['outline', 'ppt', 'team'],
  articleOutline: ['articleOutline', 'copy', 'team'],
  longImageOutline: ['longImageOutline', 'visual', 'team'],
  visual: ['longImageOutline', 'visual', 'team'],
  script: ['script', 'copy', 'team'],
  copy: ['copy', 'team'],
  conferencePoster: ['conferencePoster', 'visual', 'team'],
  video: ['video', 'team'],
  team: ['team'],
  case: [],
  evidence: [],
  promo: [],
  general: [],
};

function normalizeFirstAction(next: ContentFlowEntry): ContentFlowEntry {
  if (next === 'ppt') return 'outline';
  if (next === 'visual') return 'longImageOutline';
  return next;
}

export function nextLockedFlowEntry(
  prev: ContentFlowEntry | null,
  next: ContentFlowEntry | null
): ContentFlowEntry | null {
  if (!next) return prev;
  if (next === 'team' || next === 'submit') return prev ?? next;
  if (omitsTopicInsight(prev) && next === 'insight') return prev;
  if (omitsBriefLiterature(prev) && (next === 'brief' || next === 'literature')) return prev;
  if (isPendingFlowEntry(prev)) return normalizeFirstAction(next);
  const family = FLOW_FAMILIES[prev] ?? [prev];
  if (family.includes(next) || next === prev) return prev;
  return prev;
}

function inferLockedPath(
  extras: Partial<ContentFlowProgress>,
  source?: string | null
): ContentFlowEntry | null {
  if (extras.insight && !omitsTopicInsight(null, source)) return 'insight';
  if (extras.brief && !omitsBriefLiterature(null, source)) return 'brief';
  if (extras.storyline) return 'storyline';
  if (extras.articleOutline) return 'articleOutline';
  if (extras.longImageOutline) return 'longImageOutline';
  if (extras.outline || extras.ppt) return 'outline';
  if (extras.copy && source === 'promo') return 'script';
  if (extras.copy) return 'copy';
  if (extras.visual) return 'longImageOutline';
  if (extras.video) return 'video';
  return null;
}

export function inferFlowEntryFromTabs(tabs: TabKey[]): ContentFlowEntry | null {
  for (const tab of tabs) {
    const entry = flowEntryFromTab(tab);
    if (entry) return entry;
  }
  return null;
}

function step(id: Exclude<ContentFlowStepId, 'pending'>, required: boolean): ContentFlowStep {
  return { ...CORE[id], required };
}

function emptySlot(): ContentFlowStep {
  return { id: 'pending', label: '', tab: null, required: false, placeholder: true };
}

function appendMissing(
  steps: ContentFlowStep[],
  id: Exclude<ContentFlowStepId, 'pending'>,
  required = false
) {
  if (!steps.some((item) => item.id === id)) {
    const submitAt = steps.findIndex((item) => item.id === 'submit');
    const next = step(id, required);
    if (submitAt >= 0) steps.splice(submitAt, 0, next);
    else steps.push(next);
  }
}

function finishFlow(steps: ContentFlowStep[]): ContentFlowStep[] {
  appendMissing(steps, 'team', true);
  if (!steps.some((item) => item.id === 'submit')) {
    steps.push(step('submit', true));
  }
  return steps;
}

function pendingStart(): ContentFlowStep[] {
  return [step('create', true), emptySlot(), emptySlot(), step('team', true), step('submit', true)];
}

export function buildContentFlowSteps(
  entry: ContentFlowEntry | null,
  extras: Partial<
    Pick<
      ContentFlowProgress,
      | 'copy'
      | 'visual'
      | 'video'
      | 'team'
      | 'insight'
      | 'brief'
      | 'literature'
      | 'storyline'
      | 'outline'
      | 'articleOutline'
      | 'longImageOutline'
      | 'ppt'
    >
  > = {},
  source?: string | null
): ContentFlowStep[] {
  const skipBriefLiterature = omitsBriefLiterature(entry, source);
  const skipInsight = omitsTopicInsight(entry, source);
  const locked = isPendingFlowEntry(entry) ? inferLockedPath(extras, source) : entry;

  if (!locked || isPendingFlowEntry(locked)) {
    return pendingStart();
  }

  const steps: ContentFlowStep[] = [step('create', true)];

  if (locked === 'insight' && !skipInsight) {
    steps.push(step('insight', true));
    if (!skipBriefLiterature) steps.push(step('brief', true));
    steps.push(step('storyline', true), step('outline', true), step('ppt', true));
  } else if ((locked === 'brief' || locked === 'literature') && !skipBriefLiterature) {
    steps.push(step('brief', true), step('storyline', true), step('outline', true), step('ppt', true));
  } else if (locked === 'storyline') {
    steps.push(step('storyline', true), step('outline', true), step('ppt', true));
  } else if (locked === 'outline' || locked === 'ppt') {
    steps.push(step('outline', true), step('ppt', true));
  } else if (locked === 'articleOutline') {
    steps.push(step('articleOutline', true), articleCopyStep(true));
  } else if (locked === 'longImageOutline' || locked === 'visual') {
    steps.push(step('longImageOutline', true), longImageVisualStep(true));
  } else if (locked === 'script') {
    steps.push(scriptCopyStep(true));
  } else if (locked === 'copy') {
    steps.push(step('copy', true));
  } else if (locked === 'conferencePoster') {
    steps.push(step('kv', true), step('meetingTemplates', true), step('sessionMaterials', true));
  } else if (locked === 'video') {
    steps.push(step('video', true));
  } else if (locked === 'team') {
    steps.push(step('team', true));
  } else {
    return pendingStart();
  }

  return finishFlow(steps);
}

export function activeFlowStepId(active: TabKey | null): ContentFlowStepId {
  if (!active) return 'create';
  if (active === 'insight' || active === 'topic-recommendation') return 'insight';
  if (active === 'brief' || active === 'literature') return 'brief';
  if (active === 'storyline') return 'storyline';
  if (active === 'article-outline') return 'articleOutline';
  if (active === 'long-image-outline') return 'longImageOutline';
  if (active === 'ppt-outline') return 'outline';
  if (active === 'ppt-design') return 'ppt';
  if (active === 'copy' || active === 'rich-text') return 'copy';
  if (active === 'visual') return 'visual';
  if (active === 'meeting-templates') return 'meetingTemplates';
  if (active === 'meeting-sessions') return 'sessionMaterials';
  if (active === 'video-render' || active === 'video-script') return 'video';
  if (active === 'team') return 'team';
  if (active === 'submit') return 'submit';
  return 'create';
}

export function flowStepStatus(
  step: ContentFlowStep,
  index: number,
  currentId: ContentFlowStepId,
  progress: ContentFlowProgress,
  steps: ContentFlowStep[]
): ContentFlowStatus {
  if (step.placeholder) return 'todo';
  const currentIndex = Math.max(0, steps.findIndex((item) => item.id === currentId));
  const done = step.id === 'pending' ? false : progress[step.id];
  if (step.id === currentId) return 'current';
  if (done) return 'done';
  if (!step.required && index < currentIndex) return 'skipped';
  return 'todo';
}
