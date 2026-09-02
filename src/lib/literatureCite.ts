import type { LibraryItem } from '@/types/library';
import type { PptOutline } from '@/types/content';
import { isMaterialUsable } from '@/lib/libraryUtils';
import {
  literaturePageLocator,
  MOCK_LITERATURE_ARTICLES,
  type LiteratureArticle,
} from '@/lib/literatureMocks';

const MAX_CITED_WHEN_MANY = 6;
const LITERATURE_CAP_WHEN_FEW = 8;
const RELEVANCE_RE =
  /肾|ckd|egfr|uacr|sglt|透析|随访|筛查|kidney|nephrol|cardiorenal|literacy|证据|指南|kdigo|糖尿病|心衰|高血压/i;

export function isTaskLiteratureItem(item: LibraryItem): boolean {
  return Boolean((item.cat === '参考文献' || item.literatureId) && isMaterialUsable(item));
}

export function taskLiteratureItems(library: LibraryItem[]): LibraryItem[] {
  return library.filter((item) => (item.referenced ?? item.def) && isTaskLiteratureItem(item));
}

function norm(value: string): string {
  return value.toLowerCase().replace(/[.,;:()（）·]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function resolveLiteratureArticle(item: LibraryItem): LiteratureArticle | undefined {
  if (item.literatureId) {
    return MOCK_LITERATURE_ARTICLES.find((article) => article.id === item.literatureId);
  }
  return MOCK_LITERATURE_ARTICLES.find((article) => article.title === item.title);
}

export function formatOutlineCitation(item: LibraryItem): string {
  const article = resolveLiteratureArticle(item);
  if (article) {
    const locator = literaturePageLocator(article);
    const journal = article.journalAbbr || article.publisher;
    const locPart = locator ? `, ${locator}` : '';
    const title = article.title.length > 72 ? `${article.title.slice(0, 70)}…` : article.title;
    return `${journal}, ${article.year}${locPart}. ${title}`;
  }
  return [item.meta, item.title].filter(Boolean).join('. ');
}

export function collectOutlineCitationTexts(outline: PptOutline | null | undefined): string[] {
  if (!outline) return [];
  return outline.chapters.flatMap((chapter) =>
    chapter.pages.flatMap((page) => (page.references || []).filter(Boolean))
  );
}

function citationMatchesItem(citation: string, item: LibraryItem): boolean {
  const cited = norm(citation);
  if (!cited) return false;
  const article = resolveLiteratureArticle(item);
  if (article) {
    const journal = norm(article.journalAbbr || article.publisher);
    if (journal.length >= 4 && cited.includes(journal) && cited.includes(String(article.year))) return true;
    const title = norm(article.title);
    if (title.length >= 12 && cited.includes(title.slice(0, 18))) return true;
  }
  const title = norm(item.title);
  if (title.length >= 12 && cited.includes(title.slice(0, 18))) return true;
  const journal = norm((item.meta || '').split('·')[0] || '');
  if (journal.length >= 8 && cited.includes(journal)) return true;
  return false;
}

function relevanceScore(item: LibraryItem, outline: PptOutline): number {
  const blob = `${item.title} ${item.meta} ${item.contentText || ''} ${outline.title} ${outline.scenario || ''}`;
  return RELEVANCE_RE.test(blob) ? 8 : 0;
}

export function citedLibraryItemIds(
  library: LibraryItem[],
  outline: PptOutline | null | undefined
): Set<number> {
  const citations = collectOutlineCitationTexts(outline);
  const cited = new Set<number>();
  if (!citations.length) return cited;
  for (const item of taskLiteratureItems(library)) {
    if (citations.some((citation) => citationMatchesItem(citation, item))) {
      cited.add(item.id);
    }
  }
  return cited;
}

function pickCitedLiterature(library: LibraryItem[], outline: PptOutline): LibraryItem[] {
  const items = taskLiteratureItems(library);
  if (!items.length) return [];
  const citations = collectOutlineCitationTexts(outline);
  const scored = items.map((item) => ({
    item,
    score:
      (citations.some((citation) => citationMatchesItem(citation, item)) ? 50 : 0) +
      relevanceScore(item, outline),
  }));
  scored.sort((a, b) => b.score - a.score || a.item.id - b.item.id);
  const cap =
    items.length > 10 ? MAX_CITED_WHEN_MANY : Math.min(items.length, LITERATURE_CAP_WHEN_FEW);
  return scored.slice(0, Math.max(1, cap)).map((entry) => entry.item);
}

export function bindOutlineCitationsToLibrary(
  outline: PptOutline,
  library: LibraryItem[]
): PptOutline {
  const selected = pickCitedLiterature(library, outline);
  if (!selected.length) return outline;
  const citations = selected.map(formatOutlineCitation);
  let cursor = 0;
  const take = (count: number) => {
    const next: string[] = [];
    for (let i = 0; i < count; i += 1) {
      next.push(citations[cursor % citations.length]);
      cursor += 1;
    }
    return next;
  };

  return {
    ...outline,
    chapters: outline.chapters.map((chapter) => ({
      ...chapter,
      pages: chapter.pages.map((page) => {
        const count = page.references?.length || 0;
        if (
          !count ||
          page.kind === 'cover' ||
          page.kind === 'toc' ||
          page.kind === 'section-title' ||
          page.kind === 'back'
        ) {
          return page;
        }
        const references = take(count);
        return {
          ...page,
          references,
          bulletCites: page.bulletCites?.map((cites) =>
            cites.map((num) => Math.min(Math.max(num, 1), references.length))
          ),
        };
      }),
    })),
  };
}

export function resolveOutlineCitations(
  outline: PptOutline,
  library: LibraryItem[]
): PptOutline {
  if (!taskLiteratureItems(library).length) return outline;
  return bindOutlineCitationsToLibrary(outline, library);
}
