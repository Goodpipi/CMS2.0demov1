import {
  DEMO_SCENARIO_LABELS,
  DEMO_SCENARIOS,
  loadAppMode,
  loadDemoScenario,
  saveAppMode,
  saveDemoScenario,
  type AppMode,
  type DemoScenario,
} from '@/lib/demoMode';
import { cn } from '@/app/components/ui/utils';

interface DemoModeControlProps {
  mode: AppMode;
  scenario: DemoScenario;
  onModeChange: (mode: AppMode) => void;
  onScenarioChange: (scenario: DemoScenario) => void;
}

export function DemoModeControl({
  mode,
  scenario,
  onModeChange,
  onScenarioChange,
}: DemoModeControlProps) {
  const isDemo = mode === 'demo';

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-lg border px-2.5 py-1.5 shadow-soft transition',
        isDemo
          ? 'border-violet-300/70 bg-violet-50/80 dark:border-violet-500/40 dark:bg-violet-950/30'
          : 'border-border/70 bg-glass'
      )}
    >
      <label className="flex cursor-pointer items-center gap-2">
        <span className="text-muted-foreground">演示模式</span>
        <button
          type="button"
          role="switch"
          aria-checked={isDemo}
          aria-label="切换演示模式"
          className={cn(
            'relative h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400/40',
            isDemo ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-600'
          )}
          onClick={() => onModeChange(isDemo ? 'real' : 'demo')}
        >
          <span
            className={cn(
              'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
              isDemo ? 'translate-x-4' : 'translate-x-0.5'
            )}
          />
        </button>
      </label>

      {isDemo && (
        <>
          <span className="hidden h-4 w-px bg-border/80 sm:block" aria-hidden />
          <label className="flex items-center gap-1.5">
            <span className="text-muted-foreground">场景</span>
            <select
              className="max-w-[7.5rem] rounded-md border border-violet-200/80 bg-white/80 px-2 py-1 font-medium text-foreground dark:border-violet-500/30 dark:bg-violet-950/40"
              value={scenario}
              onChange={(e) => onScenarioChange(e.target.value as DemoScenario)}
              aria-label="演示场景"
            >
              {DEMO_SCENARIOS.map((id) => (
                <option key={id} value={id}>
                  {DEMO_SCENARIO_LABELS[id]}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
    </div>
  );
}
