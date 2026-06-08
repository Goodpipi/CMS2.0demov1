export type DemoScenario = 'patient-education' | 'academic' | 'hcp';
export type AppMode = 'real' | 'demo';

const MODE_KEY = 'acp_app_mode';
const SCENARIO_KEY = 'acp_demo_scenario';

const listeners = new Set<() => void>();

export const DEMO_SCENARIO_LABELS: Record<DemoScenario, string> = {
  'patient-education': '患者教育',
  academic: '学术会议',
  hcp: 'HCP临床沟通PPT',
};

export const DEMO_SCENARIOS: DemoScenario[] = ['patient-education', 'academic', 'hcp'];

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeDemoMode(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function loadAppMode(): AppMode {
  try {
    return localStorage.getItem(MODE_KEY) === 'demo' ? 'demo' : 'real';
  } catch {
    return 'real';
  }
}

export function saveAppMode(mode: AppMode): void {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    /* ignore */
  }
  notify();
}

export function loadDemoScenario(): DemoScenario {
  try {
    const v = localStorage.getItem(SCENARIO_KEY);
    if (v === 'academic' || v === 'hcp' || v === 'patient-education') return v;
  } catch {
    /* ignore */
  }
  return 'patient-education';
}

export function saveDemoScenario(scenario: DemoScenario): void {
  try {
    localStorage.setItem(SCENARIO_KEY, scenario);
  } catch {
    /* ignore */
  }
  notify();
}

export function isDemoMode(): boolean {
  return loadAppMode() === 'demo';
}

export function getDemoModeLabel(): string {
  return `演示模式 · ${DEMO_SCENARIO_LABELS[loadDemoScenario()]}`;
}
