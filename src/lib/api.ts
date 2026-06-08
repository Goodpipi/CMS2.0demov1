import type {
  LibraryItem,
  TopicItem,
  CopyItem,
  TeamContentType,
  TeamResult,
  VideoResult,
  VideoRenderVersion,
  PptResult,
  PptOutline,
  PptDesignVersion,
  PosterResult,
} from '@/types/content';
import { isDemoMode } from '@/lib/demoMode';
import { getDemoResponse, simulateDemoDelay } from '@/lib/demoScripts';

const API_BASE = '/api';
const CLIENT_TIMEOUT_MS = 120_000;
const API_CONNECT_RETRIES = 4;
const API_CONNECT_RETRY_MS = 450;

export type ApiMeta = { mockUsed?: boolean; mockReason?: string };

const DEMO_META: ApiMeta = {
  mockUsed: true,
  mockReason: 'Demo Mode（演示模式）',
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isConnectionError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  const msg = e.message.toLowerCase();
  return (
    e.name === 'TypeError' ||
    msg.includes('fetch failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('econnrefused') ||
    msg.includes('connection')
  );
}

/** 首次请求常遇 API 进程/代理未就绪，自动短暂重试避免误报 fetch failed */
async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= API_CONNECT_RETRIES; attempt++) {
    try {
      return await fetch(url, init);
    } catch (e) {
      lastError = e;
      if (!isConnectionError(e) || attempt === API_CONNECT_RETRIES) break;
      await sleep(API_CONNECT_RETRY_MS * attempt);
    }
  }
  throw lastError;
}

async function post<T>(path: string, body: unknown): Promise<T & ApiMeta> {
  if (isDemoMode()) {
    await simulateDemoDelay(path);
    const data = getDemoResponse(path, body as Record<string, unknown>) as T;
    return { ...data, ...DEMO_META };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetchWithRetry(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试或检查演示站服务是否可用');
    }
    if (isConnectionError(e)) {
      throw new Error(
        '无法连接本地 AI 服务（API 可能仍在启动）。请确认已运行 npm start，或稍等几秒后重试。'
      );
    }
    throw new Error('无法连接 AI 服务，请检查网络或联系管理员确认演示站 API 是否正常');
  } finally {
    clearTimeout(timer);
  }

  let json: { ok?: boolean; error?: string; data?: T; mockUsed?: boolean; mockReason?: string };
  try {
    json = await res.json();
  } catch {
    throw new Error(`服务返回异常 (${res.status})，请检查 API 是否正常运行`);
  }
  if (!res.ok || !json.ok) {
    throw new Error(json.error || `请求失败 (${res.status})`);
  }
  return {
    ...(json.data as T),
    mockUsed: json.mockUsed,
    mockReason: json.mockReason,
  };
}

export type HealthStatus = {
  ok?: boolean;
  deepseekConfigured?: boolean;
  model?: string;
  mockOnly?: boolean;
  fallbackMock?: boolean;
  demoMode?: boolean;
};

export async function checkHealth(): Promise<HealthStatus> {
  if (isDemoMode()) {
    return {
      ok: true,
      deepseekConfigured: false,
      mockOnly: true,
      fallbackMock: true,
      demoMode: true,
    };
  }
  const res = await fetchWithRetry(`${API_BASE}/health`, { method: 'GET' });
  return res.json();
}

/** 启动阶段轮询，直到 API 可访问（开发时 Vite 常早于 Express 就绪） */
export async function waitForApiHealth(maxAttempts = 12, intervalMs = 400): Promise<HealthStatus> {
  if (isDemoMode()) {
    return checkHealth();
  }
  let lastError: unknown;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await checkHealth();
    } catch (e) {
      lastError = e;
      if (i < maxAttempts - 1) await sleep(intervalMs);
    }
  }
  throw lastError;
}

export function generateInsight(materials: LibraryItem[], userNote?: string, seedTopics?: TopicItem[]) {
  return post<{ topics: TopicItem[]; summary: string }>('/generate/insight', {
    materials: materials.filter((m) => m.def),
    userNote,
    seedTopics: seedTopics?.length ? seedTopics : undefined,
  });
}

export function generateCopy(
  materials: LibraryItem[],
  topics: TopicItem[],
  userNote?: string,
  copiesPerTopic?: number
) {
  return post<{ copies: CopyItem[] }>('/generate/copy', {
    materials: materials.filter((m) => m.def),
    topics,
    userNote,
    copiesPerTopic: copiesPerTopic ?? 3,
  });
}

export function generateTeam(
  contentBody: string,
  options?: { feedback?: string; contentType?: TeamContentType; contentTitle?: string }
) {
  return post<TeamResult>('/generate/team', {
    copyBody: contentBody,
    feedback: options?.feedback,
    contentType: options?.contentType || 'copy',
    contentTitle: options?.contentTitle,
  });
}

export function generateVideo(copyBody: string, userNote?: string) {
  return post<VideoResult>('/generate/video', { copyBody, userNote });
}

export function generateVideoRender(script: VideoResult) {
  return post<{ versions: VideoRenderVersion[] }>('/generate/video-render', { script });
}

export function generatePpt(copyBody: string, audience?: string, userNote?: string) {
  return post<PptResult>('/generate/ppt', { copyBody, audience, userNote });
}

export function generatePptOutline(params: {
  materials: LibraryItem[];
  brief: string;
  audience: string;
  scenario: string;
  userNote?: string;
}) {
  return post<PptOutline>('/generate/ppt-outline', {
    materials: params.materials.filter((m) => m.def),
    brief: params.brief,
    audience: params.audience,
    scenario: params.scenario,
    userNote: params.userNote,
  });
}

export function generatePptDesigns(
  outline: PptOutline,
  audience: string,
  scenario: string,
  templateId?: string | null
) {
  return post<{ versions: PptDesignVersion[] }>('/generate/ppt-designs', {
    outline,
    audience,
    scenario,
    templateId: templateId || undefined,
  });
}

export function generatePoster(
  copyBody: string,
  userNote?: string,
  templateId?: string | null
) {
  return post<PosterResult>('/generate/poster', {
    copyBody,
    userNote,
    templateId: templateId || undefined,
  });
}

export function generatePosterEdit(params: {
  svg?: string;
  editPrompt: string;
  maskBounds?: { x: number; y: number; w: number; h: number } | null;
  layers?: { id: string; text: string; x: number; y: number; fontSize: number }[];
  copyBody?: string;
}) {
  return post<PosterResult>('/generate/poster-edit', params);
}

export function chat(
  materials: LibraryItem[],
  history: { role: string; content: string }[],
  message: string
) {
  return post<{ reply: string }>('/chat', { materials: materials.filter((m) => m.def), history, message });
}

export function generateSessionTitle(messages: { role: string; content: string }[]) {
  return post<{ title: string }>('/generate/session-title', { messages });
}
