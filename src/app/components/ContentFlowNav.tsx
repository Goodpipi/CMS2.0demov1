import { Check } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';
import {
  activeFlowStepId,
  buildContentFlowSteps,
  flowStepStatus,
  type ContentFlowEntry,
  type ContentFlowProgress,
  type ContentFlowStep,
} from '@/lib/contentFlow';
import type { TabKey } from '@/types/session';

interface ContentFlowNavProps {
  entry: ContentFlowEntry | null;
  progress: ContentFlowProgress;
  activeTab: TabKey | null;
  onSelect: (step: ContentFlowStep) => void;
}

export function ContentFlowNav({ entry, progress, activeTab, onSelect }: ContentFlowNavProps) {
  const steps = buildContentFlowSteps(entry, {
    insight: progress.insight,
    brief: progress.brief,
    literature: progress.literature,
    outline: progress.outline,
    ppt: progress.ppt,
    copy: progress.copy,
    visual: progress.visual,
    video: progress.video,
    team: progress.team,
  });
  const currentId = activeFlowStepId(activeTab);

  return (
    <nav className="content-flow-nav" aria-label="内容生产流程">
      {steps.map((step, index) => {
        const status = flowStepStatus(step, index, currentId, progress, steps);
        const complete = step.placeholder ? false : progress[step.id];
        return (
          <div key={`${step.id}-${index}`} className="content-flow-item">
            {index > 0 && (
              <span
                className={cn(
                  'content-flow-line',
                  (status === 'done' || status === 'current' || complete) && 'is-done'
                )}
                aria-hidden
              />
            )}
            <button
              type="button"
              className={cn(
                'content-flow-node',
                `is-${status}`,
                complete && 'is-complete',
                step.required && 'is-required',
                step.placeholder && 'is-placeholder'
              )}
              onClick={() => {
                if (!step.placeholder) onSelect(step);
              }}
              disabled={step.placeholder}
              title={step.placeholder ? '待第一步操作后展开' : step.label}
            >
              <span className="content-flow-dot">
                {complete ? <Check className="h-3 w-3" strokeWidth={2.6} /> : step.placeholder ? '' : index + 1}
              </span>
              <span className="content-flow-label">{step.label}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
