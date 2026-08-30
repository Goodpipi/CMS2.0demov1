import type { HomeEntryIntent } from '@/app/components/homeGuide';
import type { TabKey } from '@/types/session';

export type ContentFlowEntry =
  | 'insight'
  | 'brief'
  | 'literature'
  | 'outline'
  | 'ppt'
  | 'copy'
  | 'visual'
  | 'video'
  | 'team'
  | 'general';

export type ContentFlowStepId =
  | 'create'
  | 'insight'
  | 'brief'
  | 'literature'
  | 'outline'
  | 'ppt'
  | 'copy'
  | 'visual'
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
  ppt: boolean;
  copy: boolean;
  visual: boolean;
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
  ppt: { id: 'ppt', label: 'PPT', tab: 'ppt-design' },
  copy: { id: 'copy', label: '文案', tab: 'copy' },
  visual: { id: 'visual', label: '图片', tab: 'visual' },
  video: { id: 'video', label: '视频', tab: 'video-render' },
  team: { id: 'team', label: '意见收集', tab: 'team' },
  submit: { id: 'submit', label: '提交Veeva审批', tab: 'submit' },
};

export function flowEntryFromTab(tab: TabKey | null | undefined): ContentFlowEntry | null {
  if (tab === 'insight' || tab === 'topic-recommendation') return 'insight';
  if (tab === 'brief') return 'brief';
  if (tab === 'literature') return 'literature';
  if (tab === 'ppt-outline') return 'outline';
  if (tab === 'ppt-design') return 'ppt';
  if (tab === 'copy' || tab === 'rich-text') return 'copy';
  if (tab === 'visual') return 'visual';
  if (tab === 'video-render' || tab === 'video-script') return 'video';
  if (tab === 'team') return 'team';
  return null;
}

export function flowEntryFromIntent(intent?: HomeEntryIntent | null): ContentFlowEntry | null {
  return intent === 'insight' ? 'insight' : null;
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

export function buildContentFlowSteps(
  entry: ContentFlowEntry | null,
  extras: Partial<
    Pick<ContentFlowProgress, 'copy' | 'visual' | 'video' | 'team' | 'insight' | 'brief' | 'literature' | 'outline' | 'ppt'>
  > = {}
): ContentFlowStep[] {
  const hasExtras = Boolean(
    extras.insight ||
      extras.brief ||
      extras.literature ||
      extras.outline ||
      extras.ppt ||
      extras.copy ||
      extras.visual ||
      extras.video ||
      extras.team
  );

  if (!entry && !hasExtras) {
    return [step('create', true), emptySlot(), emptySlot(), emptySlot(), step('submit', true)];
  }

  const steps: ContentFlowStep[] = [step('create', true)];
  const locked = entry || 'general';

  if (locked === 'insight') {
    steps.push(step('insight', true), step('brief', true), step('literature', false));
    steps.push(step('outline', true), step('ppt', true));
  } else if (locked === 'literature') {
    steps.push(step('literature', true), step('brief', true), step('outline', true), step('ppt', true));
  } else if (locked === 'brief') {
    steps.push(step('brief', true), step('literature', false), step('outline', true), step('ppt', true));
  } else if (locked === 'outline') {
    steps.push(step('outline', true), step('ppt', true));
  } else if (locked === 'ppt') {
    steps.push(step('ppt', true));
  } else if (locked === 'copy') {
    steps.push(step('copy', true));
  } else if (locked === 'visual') {
    steps.push(step('visual', true));
  } else if (locked === 'video') {
    steps.push(step('video', true));
  } else if (locked === 'team') {
    steps.push(step('team', true));
  } else {
    steps.push(step('brief', true), step('literature', false), step('outline', true), step('ppt', true));
  }

  if (extras.insight) appendMissing(steps, 'insight');
  if (extras.brief) appendMissing(steps, 'brief');
  if (extras.literature) appendMissing(steps, 'literature');
  if (extras.outline) appendMissing(steps, 'outline');
  if (extras.ppt) appendMissing(steps, 'ppt');
  if (extras.copy) appendMissing(steps, 'copy');
  if (extras.visual) appendMissing(steps, 'visual');
  if (extras.video) appendMissing(steps, 'video');
  if (extras.team) appendMissing(steps, 'team');

  steps.push(step('submit', true));
  return steps;
}

export function activeFlowStepId(active: TabKey | null): ContentFlowStepId {
  if (!active) return 'create';
  if (active === 'insight' || active === 'topic-recommendation') return 'insight';
  if (active === 'brief') return 'brief';
  if (active === 'literature') return 'literature';
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
