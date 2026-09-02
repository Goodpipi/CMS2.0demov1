import type { HomeEntryIntent } from '@/app/components/homeGuide';
import type { TabKey } from '@/types/session';

export type ContentFlowEntry =
  | 'insight'
  | 'brief'
  | 'literature'
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
  | 'general';

export type ContentFlowStepId =
  | 'create'
  | 'insight'
  | 'brief'
  | 'literature'
  | 'outline'
  | 'articleOutline'
  | 'longImageOutline'
  | 'ppt'
  | 'copy'
  | 'visual'
  | 'kv'
  | 'poster'
  | 'mobile'
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
  outline: boolean;
  articleOutline: boolean;
  longImageOutline: boolean;
  ppt: boolean;
  copy: boolean;
  visual: boolean;
  kv: boolean;
  poster: boolean;
  mobile: boolean;
  video: boolean;
  team: boolean;
  submit: boolean;
}

const CORE: Record<Exclude<ContentFlowStepId, 'pending'>, Omit<ContentFlowStep, 'required'>> = {
  create: { id: 'create', label: '创建任务', tab: null },
  insight: { id: 'insight', label: '话题洞察', tab: 'insight' },
  brief: { id: 'brief', label: 'Brief', tab: 'brief' },
  literature: { id: 'literature', label: '文献', tab: 'literature' },
  outline: { id: 'outline', label: '大纲', tab: 'ppt-outline' },
  articleOutline: { id: 'articleOutline', label: '推文大纲', tab: 'article-outline' },
  longImageOutline: { id: 'longImageOutline', label: '长图大纲', tab: 'long-image-outline' },
  ppt: { id: 'ppt', label: 'PPT', tab: 'ppt-design' },
  copy: { id: 'copy', label: '文案', tab: 'copy' },
  visual: { id: 'visual', label: '图片', tab: 'visual' },
  kv: { id: 'kv', label: '生成主KV', tab: 'visual' },
  poster: { id: 'poster', label: '生成会议海报', tab: 'visual' },
  mobile: { id: 'mobile', label: '一键手机', tab: 'visual' },
  video: { id: 'video', label: '视频', tab: 'video-render' },
  team: { id: 'team', label: '意见收集', tab: 'team' },
  submit: { id: 'submit', label: '提交Veeva审批', tab: 'submit' },
};

function articleCopyStep(required: boolean): ContentFlowStep {
  return { id: 'copy', label: '图文', tab: 'rich-text', required };
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
  if (tab === 'article-outline') return 'articleOutline';
  if (tab === 'long-image-outline') return 'longImageOutline';
  if (tab === 'ppt-outline') return 'outline';
  if (tab === 'ppt-design') return 'ppt';
  if (tab === 'copy' || tab === 'rich-text') return 'copy';
  if (tab === 'visual') return 'visual';
  if (tab === 'video-render' || tab === 'video-script') return 'video';
  if (tab === 'team') return 'team';
  return null;
}

export function flowEntryFromSource(source?: string | null): ContentFlowEntry | null {
  if (source === 'poster') return 'conferencePoster';
  if (source === 'promo') return 'script';
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

export function nextLockedFlowEntry(
  prev: ContentFlowEntry | null,
  next: ContentFlowEntry | null
): ContentFlowEntry | null {
  if (!next) return prev;
  if (!prev) return next;
  if (omitsBriefLiterature(prev)) return prev;
  return prev;
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
    const next =
      id === 'copy' && steps.some((item) => item.id === 'articleOutline')
        ? articleCopyStep(required)
        : id === 'visual' && steps.some((item) => item.id === 'longImageOutline')
          ? longImageVisualStep(required)
          : step(id, required);
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
      | 'outline'
      | 'articleOutline'
      | 'longImageOutline'
      | 'ppt'
    >
  > = {},
  source?: string | null
): ContentFlowStep[] {
  const skipBriefLiterature = omitsBriefLiterature(entry, source);
  const hasExtras = Boolean(
    extras.insight ||
      (!skipBriefLiterature && extras.brief) ||
      (!skipBriefLiterature && extras.literature) ||
      extras.outline ||
      extras.articleOutline ||
      extras.longImageOutline ||
      extras.ppt ||
      extras.copy ||
      extras.visual ||
      extras.video ||
      extras.team
  );

  if (!entry && !hasExtras) {
    return [step('create', true), emptySlot(), emptySlot(), step('team', true), step('submit', true)];
  }

  const steps: ContentFlowStep[] = [step('create', true)];
  const locked = entry || 'general';

  if (locked === 'case' || locked === 'evidence') {
    if (!hasExtras) {
      return [step('create', true), emptySlot(), emptySlot(), step('team', true), step('submit', true)];
    }
  } else if (locked === 'insight') {
    steps.push(step('insight', true));
    if (!skipBriefLiterature) {
      steps.push(step('brief', true), step('literature', false));
    }
    steps.push(step('outline', true), step('ppt', true));
  } else if (locked === 'literature') {
    if (skipBriefLiterature) {
      steps.push(step('outline', true), step('ppt', true));
    } else {
      steps.push(step('literature', true), step('brief', true), step('outline', true), step('ppt', true));
    }
  } else if (locked === 'brief') {
    if (skipBriefLiterature) {
      steps.push(step('outline', true), step('ppt', true));
    } else {
      steps.push(step('brief', true), step('literature', false), step('outline', true), step('ppt', true));
    }
  } else if (locked === 'outline') {
    steps.push(step('outline', true), step('ppt', true));
  } else if (locked === 'articleOutline') {
    steps.push(step('articleOutline', true), articleCopyStep(true));
  } else if (locked === 'longImageOutline') {
    steps.push(step('longImageOutline', true), longImageVisualStep(true));
  } else if (locked === 'ppt') {
    steps.push(step('ppt', true));
  } else if (locked === 'copy') {
    steps.push(step('copy', true));
  } else if (locked === 'visual') {
    steps.push(step('visual', true));
  } else if (locked === 'conferencePoster') {
    steps.push(step('kv', true), step('poster', true));
    return finishFlow(steps);
  } else if (locked === 'script') {
    steps.push(scriptCopyStep(true));
    return finishFlow(steps);
  } else if (locked === 'video') {
    steps.push(step('video', true));
  } else if (locked === 'team') {
    steps.push(step('team', true));
  } else if (locked !== 'case' && locked !== 'evidence') {
    if (!skipBriefLiterature) {
      steps.push(step('brief', true), step('literature', false));
    }
    steps.push(step('outline', true), step('ppt', true));
  }

  if (extras.insight) appendMissing(steps, 'insight');
  if (!skipBriefLiterature && extras.brief) appendMissing(steps, 'brief');
  if (!skipBriefLiterature && extras.literature) appendMissing(steps, 'literature');
  if (extras.outline) appendMissing(steps, 'outline');
  if (extras.articleOutline) appendMissing(steps, 'articleOutline');
  if (extras.longImageOutline) appendMissing(steps, 'longImageOutline');
  if (extras.ppt) appendMissing(steps, 'ppt');
  if (extras.copy) appendMissing(steps, 'copy');
  if (extras.visual) appendMissing(steps, 'visual');
  if (extras.video) appendMissing(steps, 'video');

  return finishFlow(steps);
}

export function activeFlowStepId(active: TabKey | null): ContentFlowStepId {
  if (!active) return 'create';
  if (active === 'insight' || active === 'topic-recommendation') return 'insight';
  if (active === 'brief') return 'brief';
  if (active === 'literature') return 'literature';
  if (active === 'article-outline') return 'articleOutline';
  if (active === 'long-image-outline') return 'longImageOutline';
  if (active === 'ppt-outline') return 'outline';
  if (active === 'ppt-design') return 'ppt';
  if (active === 'copy' || active === 'rich-text') return 'copy';
  if (active === 'visual') return 'visual';
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
