import type {
  PptOutline,
  PptOutlineChapter,
  PptOutlinePage,
  PptOutlinePageKind,
  PptOutlineSectionKind,
  PptSlide,
} from '@/types/content';

export function genId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isStructuralSection(chapter?: PptOutlineChapter | null): boolean {
  return chapter?.kind === 'cover' || chapter?.kind === 'toc' || chapter?.kind === 'back';
}

export function isContentSection(chapter?: PptOutlineChapter | null): boolean {
  return Boolean(chapter) && !isStructuralSection(chapter);
}

export function isTitleOnlyPage(page?: PptOutlinePage | null): boolean {
  return page?.kind === 'cover' || page?.kind === 'section-title' || page?.kind === 'back';
}

function titlePageVisual(kind: PptOutlinePageKind): string {
  if (kind === 'cover') return '封面大标题居中，副标题与品牌色条，右下角合规提示。';
  if (kind === 'toc') return '目录列表，按节列出后续章节标题。';
  if (kind === 'section-title') return '全幅章节标题页：大标题居中，可配一句导语与品牌色条，不要堆叠正文要点。';
  if (kind === 'back') return '封底致谢页，画面中央仅展示标题，底部品牌色条。';
  return '';
}

export function sectionTitlePageFields(title: string): Pick<PptOutlinePage, 'bullets' | 'visualSuggestion'> {
  const topic = title.trim() || '本节主题';
  return {
    bullets: [
      '本章为章节标题页',
      `本节主题：${topic}`,
      '用于开启新一节，后续页面展开具体要点',
    ],
    visualSuggestion: titlePageVisual('section-title'),
  };
}

export function makeOutlinePage(
  title: string,
  kind: PptOutlinePageKind,
  bullets: string[] = [],
  extra: Partial<PptOutlinePage> = {}
): PptOutlinePage {
  const titleFields = kind === 'section-title' ? sectionTitlePageFields(title) : null;
  return {
    id: extra.id || genId('pg'),
    title,
    bullets: bullets.length ? bullets : titleFields?.bullets ?? bullets,
    kind,
    speakerNotes: extra.speakerNotes,
    visualSuggestion: extra.visualSuggestion ?? titleFields?.visualSuggestion ?? titlePageVisual(kind),
    references: extra.references || [],
    referencedImages: extra.referencedImages || [],
    bulletCites: extra.bulletCites,
  };
}

function makeSection(
  title: string,
  kind: PptOutlineSectionKind,
  pages: PptOutlinePage[],
  id?: string
): PptOutlineChapter {
  return { id: id || genId('ch'), title, kind, pages };
}

function textLooksLike(source: string, pattern: RegExp): boolean {
  return pattern.test(source);
}

function chapterLooksLike(chapter: PptOutlineChapter, pattern: RegExp): boolean {
  return textLooksLike(`${chapter.title} ${chapter.pages[0]?.title || ''}`, pattern);
}

function looksLikeSectionTitlePage(page: PptOutlinePage, chapterTitle: string): boolean {
  if (page.kind === 'section-title') return true;
  if (page.kind && page.kind !== 'content') return false;
  if (!page.bullets?.length) return true;
  if (page.title.trim() === chapterTitle.trim()) return true;
  return /^(章节标题|本节标题|第.+章)/.test(page.title);
}

export function contentSectionTitles(outline: PptOutline): string[] {
  return outline.chapters.filter(isContentSection).map((chapter) => chapter.title).filter(Boolean);
}

export function outlineHasDeckStructure(outline: PptOutline): boolean {
  const kinds = outline.chapters.map((chapter) => chapter.kind);
  if (!kinds.includes('cover') || !kinds.includes('toc') || !kinds.includes('back')) return false;
  return outline.chapters.every((chapter) => {
    if (!chapter.kind || !chapter.pages.length) return false;
    if (chapter.kind === 'cover') return chapter.pages.length === 1 && chapter.pages[0].kind === 'cover';
    if (chapter.kind === 'toc') return chapter.pages.length === 1 && chapter.pages[0].kind === 'toc';
    if (chapter.kind === 'back') return chapter.pages.length === 1 && chapter.pages[0].kind === 'back';
    return chapter.kind === 'section';
  });
}

function takeMatchingChapter(
  chapters: PptOutlineChapter[],
  match: (chapter: PptOutlineChapter) => boolean
): { chapter: PptOutlineChapter | null; rest: PptOutlineChapter[] } {
  const index = chapters.findIndex(match);
  if (index < 0) return { chapter: null, rest: chapters };
  return {
    chapter: chapters[index],
    rest: chapters.filter((_, i) => i !== index),
  };
}

function asSinglePageSection(
  chapter: PptOutlineChapter,
  kind: Exclude<PptOutlineSectionKind, 'section'>,
  fallbackTitle: string,
  pageTitle: string,
  bullets: string[] = []
): PptOutlineChapter {
  const first = chapter.pages[0];
  return makeSection(
    chapter.title || fallbackTitle,
    kind,
    [
      makeOutlinePage(first?.title || pageTitle, kind, kind === 'toc' ? first?.bullets?.length ? first.bullets : bullets : [], {
        id: first?.id,
        speakerNotes: first?.speakerNotes,
        visualSuggestion: first?.visualSuggestion,
        references: first?.references,
      }),
    ],
    chapter.id
  );
}

function ensureSectionTitlePage(chapter: PptOutlineChapter): PptOutlineChapter {
  const title = chapter.title || '未命名章节';
  const pages = chapter.pages.map((page, index) => ({
    ...page,
    kind:
      page.kind && page.kind !== 'content'
        ? page.kind
        : index === 0 && looksLikeSectionTitlePage(page, title)
          ? 'section-title'
          : 'content',
  }));
  if (pages[0]?.kind !== 'section-title') {
    pages.unshift(
      makeOutlinePage(title, 'section-title', [], {
        speakerNotes: `本节开场，先点明「${title}」。`,
      })
    );
  } else if (!pages[0].title.trim()) {
    pages[0] = { ...pages[0], title };
  }
  return { ...chapter, kind: 'section', title, pages };
}

export function ensureOutlineDeckStructure(
  outline: PptOutline,
  options: { ensureContentTitlePages?: boolean } = {}
): PptOutline {
  if (outlineHasDeckStructure(outline)) {
    if (!options.ensureContentTitlePages) return outline;
    return syncOutlineSectionMeta({
      ...outline,
      chapters: outline.chapters.map((chapter) =>
        isContentSection(chapter) ? ensureSectionTitlePage(chapter) : chapter
      ),
    });
  }

  let working = outline.chapters.map((chapter) => ({
    ...chapter,
    pages: chapter.pages.map((page) => ({ ...page })),
  }));

  let coverSource: PptOutlineChapter | null = null;
  const coverSplit = working.map((chapter) => {
    if (chapter.kind === 'cover' || (chapterLooksLike(chapter, /封面|cover/i) && chapter.pages.length <= 1)) {
      return chapter;
    }
    const first = chapter.pages[0];
    if (!coverSource && first && /封面|cover/i.test(first.title) && chapter.pages.length > 1) {
      coverSource = makeSection(
        '封面',
        'cover',
        [makeOutlinePage(first.title.replace(/^封面[:：]\s*/, '') || outline.title, 'cover', [], first)]
      );
      return { ...chapter, pages: chapter.pages.slice(1) };
    }
    return chapter;
  });
  working = coverSplit.filter((chapter) => chapter.pages.length > 0);

  const coverPick = takeMatchingChapter(
    working,
    (chapter) => chapter.kind === 'cover' || chapterLooksLike(chapter, /封面|cover/i)
  );
  working = coverPick.rest;
  const tocPick = takeMatchingChapter(
    working,
    (chapter) => chapter.kind === 'toc' || chapterLooksLike(chapter, /目录|contents|agenda/i)
  );
  working = tocPick.rest;
  const backPick = takeMatchingChapter(
    working,
    (chapter) => chapter.kind === 'back' || chapterLooksLike(chapter, /封底|致谢|谢谢观看|thank\s*you/i)
  );
  working = backPick.rest;

  const content = working.map(ensureSectionTitlePage);
  const tocItems = content.map((chapter) => chapter.title);

  const cover =
    coverSource ||
    (coverPick.chapter
      ? asSinglePageSection(coverPick.chapter, 'cover', '封面', outline.title)
      : makeSection('封面', 'cover', [makeOutlinePage(outline.title || '封面', 'cover')]));

  const toc = tocPick.chapter
    ? asSinglePageSection(tocPick.chapter, 'toc', '目录', '目录', tocItems)
    : makeSection('目录', 'toc', [makeOutlinePage('目录', 'toc', tocItems)]);

  const back = backPick.chapter
    ? asSinglePageSection(backPick.chapter, 'back', '封底', '谢谢')
    : makeSection('封底', 'back', [makeOutlinePage('谢谢', 'back')]);

  return {
    ...outline,
    chapters: [cover, toc, ...content, back],
  };
}

export function syncOutlineSectionMeta(outline: PptOutline): PptOutline {
  const titles = contentSectionTitles(outline);
  return {
    ...outline,
    chapters: outline.chapters.map((chapter) => {
      if (chapter.kind === 'toc' && chapter.pages[0]) {
        return {
          ...chapter,
          pages: [{ ...chapter.pages[0], kind: 'toc', bullets: titles }],
        };
      }
      if (chapter.kind === 'section' && chapter.pages[0]?.kind === 'section-title') {
        return {
          ...chapter,
          pages: [{ ...chapter.pages[0], title: chapter.title || chapter.pages[0].title }, ...chapter.pages.slice(1)],
        };
      }
      return chapter;
    }),
  };
}

export function parseAudience(text: string): string {
  const t = text.toLowerCase();
  if (/医生|hcp|医师|专家|科室/.test(text) || t.includes('hcp')) return 'HCP';
  if (/患者|病人/.test(text)) return '患者';
  if (/公众|大众|小红书/.test(text)) return '公众';
  return '';
}

export function parseScenario(text: string): string {
  const patterns = [
    '医学内容一图读懂-HCP',
    '医学内容一图读懂-患者',
    '内部培训一图读懂',
    '医学PPT-HCP',
    '医学推文-HCP',
    '医学PPT-患者',
    '医学推文-患者',
    '市场推广PPT',
    '内部培训PPT',
    '话术总结',
    '病例PPT',
    '病例推文',
    '病例卡',
    '指南解读',
    '文献解读',
    '研究解读',
    '共识解读',
    '作用机制',
    '产品培训',
    '疾病教育',
    '学术会',
    '科室会',
    '患教',
    '拜访',
    '内部培训',
    '机制',
    '疗效',
    '安全',
  ];
  for (const p of patterns) {
    if (text.includes(p)) return p;
  }
  if (text.length >= 8 && !/生成|ppt/i.test(text)) return text.slice(0, 40);
  return '';
}

export function normalizeOutline(
  raw: {
    title?: string;
    audience?: string;
    scenario?: string;
    chapters?: {
      title: string;
      kind?: PptOutlineSectionKind;
      pages?: {
        title: string;
        bullets?: string[];
        speakerNotes?: string;
        visualSuggestion?: string;
        references?: string[];
        referencedImages?: PptOutlinePage['referencedImages'];
        bulletCites?: number[][];
        kind?: PptOutlinePageKind;
      }[];
    }[];
  },
  audience: string,
  scenario: string
): PptOutline {
  const chapters: PptOutlineChapter[] = (raw.chapters || []).map((ch) => ({
    id: genId('ch'),
    title: ch.title || '未命名章节',
    kind: ch.kind,
    pages: (ch.pages || []).map((p) => ({
      id: genId('pg'),
      title: p.title || '未命名页面',
      bullets: p.bullets?.length
        ? p.bullets
        : p.kind === 'section-title'
          ? sectionTitlePageFields(p.title || ch.title).bullets
          : isTitleOnlyPage({ ...p, id: '', title: p.title || '', bullets: [] })
            ? []
            : ['待补充要点'],
      speakerNotes: p.speakerNotes,
      visualSuggestion:
        p.visualSuggestion ??
        (p.kind === 'section-title'
          ? sectionTitlePageFields(p.title || ch.title).visualSuggestion
          : `围绕「${p.title || '本页主题'}」做要点列表 + 示意图，保持品牌蓝绿配色与充足留白。`),
      references: p.references?.length ? p.references : [],
      referencedImages: p.referencedImages?.length ? p.referencedImages : [],
      bulletCites: p.bulletCites,
      kind: p.kind,
    })),
  }));

  if (!chapters.length) {
    chapters.push({
      id: genId('ch'),
      title: '主要内容',
      kind: 'section',
      pages: [makeOutlinePage('主要内容', 'section-title')],
    });
  }

  chapters.forEach((ch) => {
    if (!ch.pages.length) {
      ch.pages.push(makeOutlinePage(ch.title || '新页面', ch.kind === 'section' || !ch.kind ? 'section-title' : ch.kind === 'cover' || ch.kind === 'toc' || ch.kind === 'back' ? ch.kind : 'content'));
    }
  });

  return ensureOutlineDeckStructure(
    {
      title: raw.title || '医学演示文稿',
      audience: raw.audience || audience,
      scenario: raw.scenario || scenario,
      chapters,
    },
    { ensureContentTitlePages: true }
  );
}

export function flattenOutline(outline: PptOutline): PptSlide[] {
  let page = 0;
  const slides: PptSlide[] = [];
  for (const ch of outline.chapters) {
    for (const p of ch.pages) {
      page += 1;
      slides.push({
        page,
        title: p.title,
        bullets: p.bullets,
        speakerNotes: p.speakerNotes || (isTitleOnlyPage(p) ? `章节标题页：${ch.title}` : `章节：${ch.title}`),
      });
    }
  }
  return slides;
}

/** 确保每页都有可编辑的 Speaker Notes */
export function ensureSlideSpeakerNotes(slides: PptSlide[]): PptSlide[] {
  return slides.map((slide, index) => {
    if (slide.speakerNotes?.trim()) return slide;
    const bulletHint = slide.bullets?.slice(0, 2).join('；');
    return {
      ...slide,
      speakerNotes:
        bulletHint ||
        `讲解第 ${slide.page || index + 1} 页「${slide.title}」时，先点题再展开要点，并补充合规边界。`,
    };
  });
}

export function outlinePageCount(outline: PptOutline) {
  return outline.chapters.reduce((n, ch) => n + ch.pages.length, 0);
}

export function reorderList<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return list;
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function moveChapterInOutline(
  outline: PptOutline,
  dragChapterId: string,
  targetChapterId: string
): PptOutline {
  const from = outline.chapters.find((ch) => ch.id === dragChapterId);
  const to = outline.chapters.find((ch) => ch.id === targetChapterId);
  if (!from || !to || from.id === to.id) return outline;
  if (isStructuralSection(from) || isStructuralSection(to)) return outline;
  const fromIdx = outline.chapters.findIndex((ch) => ch.id === dragChapterId);
  const toIdx = outline.chapters.findIndex((ch) => ch.id === targetChapterId);
  return syncOutlineSectionMeta({
    ...outline,
    chapters: reorderList(outline.chapters, fromIdx, toIdx),
  });
}

export function movePageInOutline(
  outline: PptOutline,
  fromChapterId: string,
  pageId: string,
  toChapterId: string,
  targetPageId: string | null
): PptOutline {
  const chapters = outline.chapters.map((ch) => ({ ...ch, pages: [...ch.pages] }));

  let fromChIdx = -1;
  let fromPgIdx = -1;
  let toChIdx = -1;
  let toPgIdx = -1;

  chapters.forEach((ch, ci) => {
    if (ch.id === fromChapterId) {
      fromChIdx = ci;
      fromPgIdx = ch.pages.findIndex((p) => p.id === pageId);
    }
    if (ch.id === toChapterId) {
      toChIdx = ci;
      if (targetPageId) toPgIdx = ch.pages.findIndex((p) => p.id === targetPageId);
    }
  });

  if (fromChIdx < 0 || fromPgIdx < 0 || toChIdx < 0) return outline;
  if (isStructuralSection(chapters[toChIdx]) && fromChIdx !== toChIdx) return outline;
  const [page] = chapters[fromChIdx].pages.splice(fromPgIdx, 1);
  if (!page) return outline;

  if (chapters[fromChIdx].pages.length === 0) {
    const fromKind = chapters[fromChIdx].kind;
    chapters[fromChIdx].pages.push(
      makeOutlinePage(
        chapters[fromChIdx].title || '新页面',
        fromKind === 'cover' || fromKind === 'toc' || fromKind === 'back' ? fromKind : 'content',
        fromKind === 'toc' ? [] : ['要点 1']
      )
    );
  }

  let insertAt = targetPageId ? toPgIdx : chapters[toChIdx].pages.length;
  if (insertAt < 0) insertAt = chapters[toChIdx].pages.length;
  if (fromChIdx === toChIdx && fromPgIdx < insertAt) insertAt -= 1;
  if (insertAt < 0) insertAt = 0;

  chapters[toChIdx].pages.splice(insertAt, 0, page);

  return syncOutlineSectionMeta({ ...outline, chapters });
}

export function removeChapterFromOutline(outline: PptOutline, chapterId: string): PptOutline {
  const target = outline.chapters.find((ch) => ch.id === chapterId);
  if (!target || isStructuralSection(target)) return outline;
  if (outline.chapters.filter(isContentSection).length <= 1) return outline;
  return syncOutlineSectionMeta({
    ...outline,
    chapters: outline.chapters.filter((ch) => ch.id !== chapterId),
  });
}

export function removePageFromOutline(
  outline: PptOutline,
  chapterId: string,
  pageId: string
): PptOutline {
  return {
    ...outline,
    chapters: outline.chapters.map((ch) => {
      if (ch.id !== chapterId) return ch;
      const target = ch.pages.find((p) => p.id === pageId);
      if (isStructuralSection(ch)) return ch;
      const pages = ch.pages.filter((p) => p.id !== pageId);
      return {
        ...ch,
        pages: pages.length
          ? pages
          : [makeOutlinePage(ch.title || '新页面', 'content', ['要点 1'])],
      };
    }),
  };
}

function escSvgText(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escSvgAttr(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function slideBaseSvg(slide: PptSlide): string {
  if (slide.svg?.trim()) return slide.svg.trim();
  const bg = slide.imageUrl?.trim();
  if (bg) {
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1600 900">
      <image href="${escSvgAttr(bg)}" xlink:href="${escSvgAttr(bg)}" x="0" y="0" width="1600" height="900" preserveAspectRatio="xMidYMid slice"/>
    </svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
    <rect width="1600" height="900" fill="#f4f8fc"/>
  </svg>`;
}

/** 将对话生成的图片插入到幻灯片中心 */
export function insertCenteredImageIntoSlide(slide: PptSlide, imageUrl: string): PptSlide {
  const src = escSvgAttr(imageUrl);
  const overlay = `<image id="chat-insert-${Date.now()}" href="${src}" xlink:href="${src}" x="512" y="243" width="576" height="414" preserveAspectRatio="xMidYMid meet"/>`;
  let base = slideBaseSvg(slide);
  if (!/xmlns:xlink=/.test(base)) {
    base = base.replace(/<svg\b/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }
  const svg = /<\/svg>\s*$/i.test(base)
    ? base.replace(/<\/svg>\s*$/i, `${overlay}</svg>`)
    : `${base}${overlay}`;
  return { ...slide, svg, imageUrl: undefined };
}

/** 将幻灯片转为可预览/编辑的 data URL */
export function slideToPreviewUrl(slide: PptSlide): string {
  if (slide.imageUrl?.trim()) {
    return slide.imageUrl;
  }
  if (slide.svg?.trim()) {
    const encoded = encodeURIComponent(slide.svg);
    return `data:image/svg+xml;charset=utf-8,${encoded}`;
  }
  const title = escSvgText((slide.title || '未命名').slice(0, 20));
  const bullets = escSvgText((slide.bullets || []).slice(0, 4).join(' · '));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#eaf7ff"/><stop offset="1" stop-color="#f4fff0"/>
    </linearGradient></defs>
    <rect width="960" height="540" fill="url(#g)"/>
    <rect x="48" y="40" width="100" height="36" rx="18" fill="#103C8F"/>
    <text x="72" y="64" font-size="18" font-weight="700" fill="white">Bayer</text>
    <text x="48" y="140" font-size="32" font-weight="800" fill="#103C8F">${title}</text>
    <text x="48" y="200" font-size="20" fill="#40536a">${bullets}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
