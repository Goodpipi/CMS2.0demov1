import type { ArticleOutlineChapter, PptOutlinePage } from '@/types/content';

function clipInstruction(instruction: string, max = 48): string {
  const text = instruction.replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function stripRevision(text: string): string {
  return text.replace(/\n*【AI 修订】[\s\S]*$/, '').trimEnd();
}

export function mockRevisePptPage(page: PptOutlinePage, instruction: string): PptOutlinePage {
  const note = clipInstruction(instruction);
  const titleBase = page.title.replace(/（已修订）$/, '');
  const bullets = page.bullets.filter((item) => !item.startsWith('【AI 修订】'));
  const visual = stripRevision(page.visualSuggestion || '');
  return {
    ...page,
    title: `${titleBase}（已修订）`,
    bullets: [...bullets, `【AI 修订】已按「${note}」调整本页要点与表述。`],
    visualSuggestion: visual
      ? `${visual}\n【AI 修订】已按指令优化可视化建议。`
      : `【AI 修订】已按「${note}」补充可视化建议。`,
  };
}

export function mockReviseArticleChapter(
  chapter: ArticleOutlineChapter,
  instruction: string
): ArticleOutlineChapter {
  const note = clipInstruction(instruction);
  const titleBase = chapter.title.replace(/（已修订）$/, '');
  return {
    ...chapter,
    title: `${titleBase}（已修订）`,
    core: `${stripRevision(chapter.core)}\n\n【AI 修订】已按「${note}」重写本章核心信息，突出指令中的修改方向。`,
    tmsh: `${stripRevision(chapter.tmsh)}\n【AI 修订】已按指令同步调整本章 TMSH。`,
  };
}
