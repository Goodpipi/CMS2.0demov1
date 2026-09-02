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
  const titleBase = page.title.replace(/（已修订）$/, '').trim();
  const bullets = page.bullets.filter((item) => !item.startsWith('【AI 修订】'));
  const visual = stripRevision(page.visualSuggestion || '');
  const isBlank = !titleBase && !bullets.length && !visual && !(page.references || []).length;
  if (isBlank) {
    return {
      ...page,
      title: '新页面（已修订）',
      bullets: [`已按「${note}」生成本页核心要点。`],
      bulletCites: [[1]],
      visualSuggestion: `已按「${note}」补充可视化建议。`,
      references: ['演示文献, 2026, p. 3. 本页引用示例.'],
      referencedImages: page.referencedImages?.length ? page.referencedImages : [],
    };
  }
  return {
    ...page,
    title: `${titleBase || '未命名页面'}（已修订）`,
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
  const titleBase = chapter.title.replace(/（已修订）$/, '').trim();
  const isBlank = !titleBase && !chapter.core.trim() && !chapter.tmsh.trim();
  if (isBlank) {
    return {
      ...chapter,
      title: '新章节（已修订）',
      core: `已按「${note}」生成本章核心信息。`,
      coreCites: [1],
      tmsh: `T：已按指令明确本章主题\nM：突出可执行的沟通重点\nS：补充需要持续关注的指标\nH：给出下一步行动`,
      references: ['演示文献, 2026, p. 12. 本章引用示例.'],
    };
  }
  return {
    ...chapter,
    title: `${titleBase || '未命名章节'}（已修订）`,
    core: `${stripRevision(chapter.core)}\n\n【AI 修订】已按「${note}」重写本章核心信息，突出指令中的修改方向。`,
    tmsh: `${stripRevision(chapter.tmsh)}\n【AI 修订】已按指令同步调整本章 TMSH。`,
  };
}
