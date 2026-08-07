import type { TerminologyDraft, TerminologyEntry } from '@/types/terminology';

const STORAGE_KEY = 'acp_terminology_glossary_v1';

const SEED_TERMS: TerminologyDraft[] = [
  {
    source: '慢性肾脏病',
    target: 'Chronic Kidney Disease (CKD)',
    sourceLang: 'zh',
    targetLang: 'en',
    domain: '肾病',
    note: '正式医学名称，勿译为 kidney illness',
  },
  {
    source: '估算肾小球滤过率',
    target: 'estimated Glomerular Filtration Rate (eGFR)',
    sourceLang: 'zh',
    targetLang: 'en',
    domain: '肾病',
    note: '保留 eGFR 缩写',
  },
  {
    source: '蛋白尿',
    target: 'proteinuria',
    sourceLang: 'zh',
    targetLang: 'en',
    domain: '肾病',
    note: '',
  },
  {
    source: '疾病教育',
    target: 'disease awareness / patient education',
    sourceLang: 'zh',
    targetLang: 'en',
    domain: '传播',
    note: '公众渠道优先用 patient education',
  },
  {
    source: '仅供科普参考，不构成诊疗建议',
    target: 'For educational purposes only. Not medical advice.',
    sourceLang: 'zh',
    targetLang: 'en',
    domain: '合规',
    note: '免责声明固定译法',
  },
  {
    source: 'Healthcare Professional',
    target: '医疗卫生专业人士（HCP）',
    sourceLang: 'en',
    targetLang: 'zh',
    domain: '传播',
    note: '对内材料可保留 HCP',
  },
];

function makeId(): string {
  return `term_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeDraft(draft: TerminologyDraft, now = Date.now()): TerminologyEntry {
  return {
    id: draft.id || makeId(),
    source: draft.source.trim(),
    target: draft.target.trim(),
    sourceLang: (draft.sourceLang || 'zh').trim() || 'zh',
    targetLang: (draft.targetLang || 'en').trim() || 'en',
    domain: (draft.domain || '').trim(),
    note: (draft.note || '').trim(),
    createdAt: now,
    updatedAt: now,
  };
}

export function loadTerminologyEntries(): TerminologyEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = SEED_TERMS.map((item, index) =>
        normalizeDraft(item, Date.now() - (SEED_TERMS.length - index) * 1000)
      );
      saveTerminologyEntries(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as TerminologyEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.source === 'string' && typeof item.target === 'string')
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveTerminologyEntries(entries: TerminologyEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function upsertTerminologyEntry(
  draft: TerminologyDraft,
  existing: TerminologyEntry[] = loadTerminologyEntries()
): TerminologyEntry[] {
  const now = Date.now();
  const source = draft.source.trim();
  const target = draft.target.trim();
  if (!source || !target) return existing;

  if (draft.id) {
    const next = existing.map((item) =>
      item.id === draft.id
        ? {
            ...item,
            source,
            target,
            sourceLang: (draft.sourceLang || item.sourceLang).trim() || 'zh',
            targetLang: (draft.targetLang || item.targetLang).trim() || 'en',
            domain: (draft.domain ?? item.domain).trim(),
            note: (draft.note ?? item.note).trim(),
            updatedAt: now,
          }
        : item
    );
    saveTerminologyEntries(next);
    return next.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  const created = normalizeDraft(draft, now);
  const next = [created, ...existing];
  saveTerminologyEntries(next);
  return next;
}

export function deleteTerminologyEntry(
  id: string,
  existing: TerminologyEntry[] = loadTerminologyEntries()
): TerminologyEntry[] {
  const next = existing.filter((item) => item.id !== id);
  saveTerminologyEntries(next);
  return next;
}

/** 合并导入：相同源术语 + 语言对则更新译文，否则新增 */
export function mergeTerminologyEntries(
  incoming: TerminologyDraft[],
  existing: TerminologyEntry[] = loadTerminologyEntries()
): { entries: TerminologyEntry[]; added: number; updated: number } {
  let added = 0;
  let updated = 0;
  const map = new Map(
    existing.map((item) => [`${item.sourceLang}::${item.targetLang}::${item.source}`, item] as const)
  );
  const now = Date.now();

  for (const draft of incoming) {
    const source = draft.source.trim();
    const target = draft.target.trim();
    if (!source || !target) continue;
    const sourceLang = (draft.sourceLang || 'zh').trim() || 'zh';
    const targetLang = (draft.targetLang || 'en').trim() || 'en';
    const key = `${sourceLang}::${targetLang}::${source}`;
    const prev = map.get(key);
    if (prev) {
      map.set(key, {
        ...prev,
        target,
        domain: (draft.domain ?? prev.domain).trim(),
        note: (draft.note ?? prev.note).trim(),
        updatedAt: now,
      });
      updated += 1;
    } else {
      const created = normalizeDraft(
        { ...draft, source, target, sourceLang, targetLang },
        now
      );
      map.set(key, created);
      added += 1;
    }
  }

  const entries = [...map.values()].sort((a, b) => b.updatedAt - a.updatedAt);
  saveTerminologyEntries(entries);
  return { entries, added, updated };
}

/** 拼成可注入 AI 提示词的术语表文本 */
export function formatTerminologyForPrompt(entries: TerminologyEntry[]): string {
  if (!entries.length) return '';
  const lines = entries.map(
    (item) =>
      `- [${item.sourceLang}→${item.targetLang}] ${item.source} = ${item.target}${
        item.note ? `（${item.note}）` : ''
      }`
  );
  return ['【专业术语库｜翻译时请严格遵循以下译法】', ...lines].join('\n');
}
