import type { ArticleOutlineChapter, OutlineRefImage, PptOutlinePage } from '@/types/content';

export type PptPageAiRegion = 'title' | 'core' | 'visual';
export type ArticleChapterAiRegion = 'title' | 'core' | 'tmsh';

function clipInstruction(instruction: string, max = 48): string {
  const text = instruction.replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function stripRevision(text: string): string {
  return text
    .replace(/（已修订）$/g, '')
    .replace(/（已按「[^」]+」修订）$/g, '')
    .replace(/\n*【AI 修订】[\s\S]*$/g, '')
    .trim();
}

function rewriteAfterIntent(instruction: string): string | null {
  const match = instruction.split(/改成|改为|换成|改写为|调整为/);
  if (match.length < 2) return null;
  const after = match.slice(1).join('').replace(/^[「『“"'\s]+|[」』”"'\s。．！？]+$/g, '').trim();
  return after || null;
}

function parseItemIndex(instruction: string, count: number): number | null {
  const arabic = instruction.match(/第\s*(\d+)\s*条/);
  if (arabic) {
    const index = Number(arabic[1]) - 1;
    return index >= 0 && index < count ? index : null;
  }
  const map: Record<string, number> = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10,
  };
  const chinese = instruction.match(/第\s*([一二三四五六七八九十])\s*条/);
  if (!chinese) return null;
  const index = (map[chinese[1]] || 0) - 1;
  return index >= 0 && index < count ? index : null;
}

function rewriteLine(original: string, instruction: string): string {
  const note = clipInstruction(instruction, 28);
  const direct = rewriteAfterIntent(instruction);
  if (direct) return direct;
  const base = stripRevision(original);
  if (!base) return note || '已按指令生成要点。';
  return `${base}（已按「${note}」修订）`;
}

function reviseBullets(bullets: string[], instruction: string): string[] {
  const note = clipInstruction(instruction);
  const cleaned = bullets.map((item) => stripRevision(item)).filter(Boolean);
  const targetIndex = parseItemIndex(instruction, cleaned.length);
  if (targetIndex != null) {
    const next = [...cleaned];
    next[targetIndex] = rewriteLine(next[targetIndex], instruction);
    return next;
  }
  if (!cleaned.length) return [`已按「${note}」结合本页上下文生成本页核心要点。`];
  if (/补充|增加|加上|新增/.test(instruction)) {
    return [...cleaned, rewriteLine('', instruction)];
  }
  const next = [...cleaned];
  next[0] = rewriteLine(next[0], instruction);
  return next;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,，.。;；:：/()（）·\-]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3);
}

export function matchCitesForText(text: string, references: string[], fallback?: number[]): number[] {
  const refs = references.filter(Boolean);
  if (!refs.length) return [];
  const max = refs.length;
  const clamp = (cites?: number[]) =>
    [...new Set((cites || []).filter((num) => Number.isFinite(num) && num >= 1 && num <= max))];
  const tokens = tokenize(text);
  const hits = refs
    .map((ref, index) => ({ index: index + 1, tokens: tokenize(ref) }))
    .filter((item) => item.tokens.some((token) => text.includes(token) || tokens.includes(token)))
    .map((item) => item.index);
  if (hits.length) return hits.slice(0, 2);
  const prev = clamp(fallback);
  if (prev.length) return prev;
  if (/研究|证据|指南|数据|随访|筛查|结局|Lancet|CKD|eGFR|UACR|SGLT/i.test(text)) return [1];
  return [];
}

export function rematchPageCitations(page: PptOutlinePage): PptOutlinePage {
  const references = (page.references || []).filter(Boolean);
  return {
    ...page,
    references,
    bulletCites: (page.bullets || []).map((bullet, index) =>
      matchCitesForText(bullet, references, page.bulletCites?.[index])
    ),
    referencedImages: (page.referencedImages || []).map((image) => ({
      ...image,
      cites: matchCitesForText(`${image.caption || ''} ${image.alt || ''}`, references, image.cites),
    })),
  };
}

export function rematchArticleCitations(chapter: ArticleOutlineChapter): ArticleOutlineChapter {
  const references = (chapter.references || []).filter(Boolean);
  return {
    ...chapter,
    references,
    coreCites: matchCitesForText(chapter.core, references, chapter.coreCites),
    referencedImages: (chapter.referencedImages || []).map((image) => ({
      ...image,
      cites: matchCitesForText(`${image.caption || ''} ${image.alt || ''}`, references, image.cites),
    })),
  };
}

export function mockRevisePptPageRegion(
  page: PptOutlinePage,
  region: PptPageAiRegion,
  instruction: string
): PptOutlinePage {
  const note = clipInstruction(instruction);
  if (region === 'title') {
    const base = stripRevision(page.title) || '未命名页面';
    return rematchPageCitations({
      ...page,
      title: rewriteAfterIntent(instruction) || `${base}（已按「${note}」修订）`,
    });
  }
  if (region === 'visual') {
    const visual = stripRevision(page.visualSuggestion || '');
    const rewritten = rewriteAfterIntent(instruction);
    return rematchPageCitations({
      ...page,
      visualSuggestion: rewritten
        ? rewritten
        : visual
          ? `${visual}\n【AI 修订】已结合本页标题「${page.title}」与核心内容，按「${note}」调整可视化建议。`
          : `【AI 修订】已按「${note}」结合本页上下文补充可视化建议。`,
    });
  }
  return rematchPageCitations({
    ...page,
    bullets: reviseBullets(page.bullets || [], instruction),
  });
}

export function mockReviseArticleRegion(
  chapter: ArticleOutlineChapter,
  region: ArticleChapterAiRegion,
  instruction: string
): ArticleOutlineChapter {
  const note = clipInstruction(instruction);
  if (region === 'title') {
    const base = stripRevision(chapter.title) || '未命名章节';
    return rematchArticleCitations({
      ...chapter,
      title: rewriteAfterIntent(instruction) || `${base}（已按「${note}」修订）`,
    });
  }
  if (region === 'tmsh') {
    const tmsh = stripRevision(chapter.tmsh);
    const rewritten = rewriteAfterIntent(instruction);
    return rematchArticleCitations({
      ...chapter,
      tmsh: rewritten
        ? rewritten
        : tmsh
          ? `${tmsh}\n【AI 修订】已结合本章核心内容，按「${note}」调整 TMSH。`
          : `T：已按「${note}」明确本章主题\nM：突出可执行沟通重点\nS：补充需持续关注的指标\nH：给出下一步行动`,
    });
  }
  const core = stripRevision(chapter.core);
  const rewritten = rewriteAfterIntent(instruction);
  return rematchArticleCitations({
    ...chapter,
    core: rewritten
      ? rewritten
      : core
        ? `${core}\n\n【AI 修订】已结合本章标题「${chapter.title}」与现有上下文，按「${note}」重写核心信息。`
        : `已按「${note}」结合本章上下文生成核心信息。`,
  });
}

export function appendManualCiteImage(
  images: OutlineRefImage[] | undefined,
  references: string[] | undefined,
  input: { url: string; caption: string; source: string; alt?: string }
): { images: OutlineRefImage[]; references: string[] } {
  const nextRefs = [...(references || [])];
  const source = input.source.trim();
  let cite = 0;
  if (source) {
    const existing = nextRefs.findIndex((item) => item.replace(/\s+/g, '') === source.replace(/\s+/g, ''));
    if (existing >= 0) cite = existing + 1;
    else {
      nextRefs.push(source);
      cite = nextRefs.length;
    }
  }
  return {
    references: nextRefs,
    images: [
      ...(images || []),
      {
        url: input.url,
        caption: input.caption.trim(),
        alt: input.alt?.trim() || input.caption.trim() || '引用图片',
        cites: cite ? [cite] : [],
      },
    ],
  };
}
