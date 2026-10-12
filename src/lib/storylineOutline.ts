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
        return storylinePoint ? { ...page, storylinePoint } : page;
      }),
    })),
  };
}
