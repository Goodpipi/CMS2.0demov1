import type { PptOutline, PptOutlineChapter, PptOutlinePage } from '@/types/content';

function clipPoint(text: string, max = 92): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).replace(/[，。；;、\s]+$/u, '')}…`;
}

export function parseStorylineViewpoints(storyline: string): {
  anchor: string;
  chapters: { heading: string; core: string }[];
  pagePoints: string[];
} {
  const text = storyline.replace(/\r\n/g, '\n').trim();
  if (!text) return { anchor: '', chapters: [], pagePoints: [] };

  const quoted = text.match(/[“"]([^”"]{12,})[”"]/);
  const anchor = quoted?.[1]?.trim() || '';

  const chapters: { heading: string; core: string }[] = [];
  const chapterBlocks = text.split(/(?=^第.+章｜)/m).filter((block) => /^第.+章｜/m.test(block));
  for (const block of chapterBlocks) {
    const heading = block.match(/^第.+章｜([^\n（(]+)/m)?.[1]?.trim() || '';
    const core = block.match(/核心问题[：:]\s*([^\n]+)/)?.[1]?.trim() || '';
    if (heading || core) chapters.push({ heading, core });
  }

  const pagePoints: string[] = [];
  const pageLine =
    /^P\d+(?:[–\-−~至到]P?\d+)?(?:（[^）]+）)?[：:]\s*(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = pageLine.exec(text)) !== null) {
    const point = match[1]?.trim();
    if (point) pagePoints.push(point);
  }

  return { anchor, chapters, pagePoints };
}

export function storylinePointForPage(
  page: PptOutlinePage,
  _chapter: PptOutlineChapter,
  viewpoints: ReturnType<typeof parseStorylineViewpoints>,
  counters: { pagePoint: number; section: number }
): string {
  if (page.kind === 'cover') {
    return viewpoints.anchor || viewpoints.pagePoints[0] || '';
  }
  if (page.kind === 'toc') {
    const headings = viewpoints.chapters.map((item) => item.heading).filter(Boolean);
    return headings.length ? headings.join(' → ') : '';
  }
  if (page.kind === 'section-title') {
    const chapterMeta = viewpoints.chapters[counters.section] || viewpoints.chapters[0];
    counters.section += 1;
    return chapterMeta?.core || chapterMeta?.heading || '';
  }
  if (page.kind === 'back') {
    return viewpoints.anchor || viewpoints.pagePoints.at(-1) || '';
  }
  const point = viewpoints.pagePoints[counters.pagePoint] || '';
  if (point) counters.pagePoint += 1;
  return point;
}

function bigrams(text: string): Set<string> {
  const clean = text.replace(/[\s，。；;、：:“”"'（）()【】\-—·…!！?？,.]/g, '').toLowerCase();
  const grams = new Set<string>();
  for (let i = 0; i < clean.length - 1; i += 1) grams.add(clean.slice(i, i + 2));
  return grams;
}

function overlapRatio(a: string, b: string): number {
  const left = bigrams(a);
  const right = bigrams(b);
  if (!left.size || !right.size) return 0;
  let hit = 0;
  left.forEach((gram) => {
    if (right.has(gram)) hit += 1;
  });
  return hit / Math.min(left.size, right.size);
}

function pageText(page: Pick<PptOutlinePage, 'title' | 'bullets'>): string {
  return [page.title, ...(page.bullets || [])].join(' ');
}

/**
 * 判断人工修改后的页面是否仍与原故事线观点对应：
 * 修改后内容与原内容差异较大，且与观点的贴合度明显下降时视为不一致。
 */
export function isPageDetachedFromStoryline(
  before: Pick<PptOutlinePage, 'title' | 'bullets'>,
  after: Pick<PptOutlinePage, 'title' | 'bullets'>,
  storylinePoint?: string
): boolean {
  const point = (storylinePoint || '').trim();
  if (!point) return false;
  const beforeText = pageText(before);
  const afterText = pageText(after);
  if (beforeText === afterText) return false;
  const drift = 1 - overlapRatio(beforeText, afterText);
  const beforeFit = overlapRatio(beforeText, point);
  const afterFit = overlapRatio(afterText, point);
  return drift > 0.5 && afterFit < Math.max(0.12, beforeFit * 0.6);
}

export function attachStorylinePointsToOutline(outline: PptOutline, storyline: string): PptOutline {
  const viewpoints = parseStorylineViewpoints(storyline);
  const hasPoints = Boolean(viewpoints.anchor || viewpoints.chapters.length || viewpoints.pagePoints.length);
  if (!hasPoints) return outline;

  const counters = { pagePoint: 0, section: 0 };
  return {
    ...outline,
    chapters: outline.chapters.map((chapter) => ({
      ...chapter,
      pages: chapter.pages.map((page) => {
        const storylinePoint = clipPoint(
          storylinePointForPage(page, chapter, viewpoints, counters) || page.storylinePoint || ''
        );
        if (page.storylineDetached) return { ...page, storylinePoint: undefined };
        return storylinePoint ? { ...page, storylinePoint } : page;
      }),
    })),
  };
}
