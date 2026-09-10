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
  | 'videoBrief'
  | 'videoHero'
  | 'videoStoryboard'
  | 'videoFrames'
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
  videoBrief: boolean;
  videoHero: boolean;
  videoStoryboard: boolean;
  videoFrames: boolean;
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
  videoBrief: { id: 'videoBrief', label: '视频需求', tab: 'video-brief' },
  videoHero: { id: 'videoHero', label: '主角形象', tab: 'video-hero' },
  videoStoryboard: { id: 'videoStoryboard', label: '分镜脚本', tab: 'video-storyboard' },
  videoFrames: { id: 'videoFrames', label: '片段首帧', tab: 'video-frames' },
  video: { id: 'video', label: '视频生成', tab: 'video-render' },
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
  if (
    tab === 'video-render' ||
    tab === 'video-script' ||
    tab === 'video-brief' ||
    tab === 'video-hero' ||
    tab === 'video-storyboard' ||
    tab === 'video-frames'
  ) {
    return 'video';
  }
  if (tab === 'team') return 'team';
  return null;
}

export function flowEntryFromSource(source?: string | null): ContentFlowEntry | null {
  if (source === 'poster') return 'conferencePoster';
  if (source === 'promo') return 'promo';
  if (source === 'case') return 'case';
  if (source === 'evidence') return 'evidence';
  if (source === 'insight') return 'insight';
  if (source === 'more') return 'video';
  return null;
}

export function isEvidenceFlow(entry?: ContentFlowEntry | null, source?: string | null): boolean {
  return entry === 'evidence' || source === 'evidence';
}

export function omitsBriefLiterature(
  entry?: ContentFlowEntry | null,
  source?: string | null
): boolean {
  return entry === 'case' || source === 'case';
}

export function omitsTopicInsight(
  entry?: ContentFlowEntry | null,
  source?: string | null
): boolean {
  return entry === 'case' || entry === 'evidence' || source === 'case' || source === 'evidence';
}

export function omitsStoryline(entry?: ContentFlowEntry | null, source?: string | null): boolean {
  return isEvidenceFlow(entry, source);
}

export function omitsLiteratureRecommend(
  entry?: ContentFlowEntry | null,
  source?: string | null
): boolean {
  return omitsBriefLiterature(entry, source) || isEvidenceFlow(entry, source);
}

const PENDING_FLOW_ENTRIES = new Set<ContentFlowEntry>(['case', 'evidence', 'promo', 'general']);

export function isPendingFlowEntry(entry?: ContentFlowEntry | null): boolean {
  return !entry || PENDING_FLOW_ENTRIES.has(entry);
}

const FLOW_FAMILIES: Record<ContentFlowEntry, ContentFlowEntry[]> = {
  insight: ['insight', 'brief', 'storyline', 'outline', 'ppt', 'team'],
  brief: ['brief', 'storyline', 'outline', 'ppt', 'articleOutline', 'longImageOutline', 'copy', 'visual', 'team'],
  literature: ['brief', 'storyline', 'outline', 'ppt', 'articleOutline', 'longImageOutline', 'copy', 'visual', 'team'],
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
  if (omitsLiteratureRecommend(prev) && next === 'literature') return prev;
  if (omitsStoryline(prev) && next === 'storyline') return prev;
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
      | 'videoBrief'
      | 'videoHero'
      | 'videoStoryboard'
      | 'videoFrames'
    >
  > = {},
  source?: string | null
): ContentFlowStep[] {
  const skipBriefLiterature = omitsBriefLiterature(entry, source);
  const skipInsight = omitsTopicInsight(entry, source);
  const skipStoryline = omitsStoryline(entry, source);
  const locked = isPendingFlowEntry(entry) ? inferLockedPath(extras, source) : entry;

  if (!locked || isPendingFlowEntry(locked)) {
    return pendingStart();
  }

  const steps: ContentFlowStep[] = [step('create', true)];

  const evidenceProductSteps = (): ContentFlowStep[] => {
    if (extras.articleOutline) return [step('articleOutline', true), articleCopyStep(true)];
    if (extras.longImageOutline || extras.visual) {
      return [step('longImageOutline', true), longImageVisualStep(true)];
    }
    return [step('outline', true), step('ppt', true)];
  };

  if (locked === 'insight' && !skipInsight) {
    steps.push(step('insight', true));
    if (!skipBriefLiterature) steps.push(step('brief', true));
    if (!skipStoryline) steps.push(step('storyline', true));
    steps.push(step('outline', true), step('ppt', true));
  } else if ((locked === 'brief' || locked === 'literature') && !skipBriefLiterature) {
    steps.push(step('brief', true));
    if (skipStoryline) {
      steps.push(...evidenceProductSteps());
    } else {
      steps.push(step('storyline', true), step('outline', true), step('ppt', true));
    }
  } else if (locked === 'storyline') {
    steps.push(step('storyline', true), step('outline', true), step('ppt', true));
  } else if (locked === 'outline' || locked === 'ppt') {
    if (skipStoryline && extras.brief && !skipBriefLiterature) steps.push(step('brief', true));
    steps.push(step('outline', true), step('ppt', true));
  } else if (locked === 'articleOutline') {
    if (skipStoryline && extras.brief && !skipBriefLiterature) steps.push(step('brief', true));
    steps.push(step('articleOutline', true), articleCopyStep(true));
  } else if (locked === 'longImageOutline' || locked === 'visual') {
    if (skipStoryline && extras.brief && !skipBriefLiterature) steps.push(step('brief', true));
    steps.push(step('longImageOutline', true), longImageVisualStep(true));
  } else if (locked === 'script') {
    steps.push(scriptCopyStep(true));
  } else if (locked === 'copy') {
    steps.push(step('copy', true));
  } else if (locked === 'conferencePoster') {
    steps.push(
      step('brief', true),
      step('kv', true),
      step('meetingTemplates', true),
      step('sessionMaterials', true)
    );
  } else if (locked === 'video') {
    if (source === 'more') {
      steps.push(
        step('videoBrief', true),
        step('videoHero', true),
        step('videoStoryboard', true),
        step('videoFrames', true),
        step('video', true)
      );
    } else {
      steps.push(step('video', true));
    }
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
  if (active === 'video-brief') return 'videoBrief';
  if (active === 'video-hero') return 'videoHero';
  if (active === 'video-storyboard') return 'videoStoryboard';
  if (active === 'video-frames') return 'videoFrames';
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
