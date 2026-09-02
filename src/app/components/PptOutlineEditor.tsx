import { useEffect, useMemo, useState } from 'react';
import type { PptOutline, PptOutlineChapter, PptOutlinePage } from '@/types/content';
import {
  ensureOutlineDeckStructure,
  genId,
  isContentSection,
  isStructuralSection,
  isTitleOnlyPage,
  makeOutlinePage,
  moveChapterInOutline,
  movePageInOutline,
  outlinePageCount,
  removeChapterFromOutline,
  removePageFromOutline,
  syncOutlineSectionMeta,
} from './pptUtils';
import { PPT_BUILTIN_TEMPLATES, isBlankPptTemplate, type PptBuiltinTemplate } from './pptTemplates';
import { PptTemplatePickerModal, PptTemplateThumb } from './PptTemplatePickerModal';
import { OutlinePageEditModal, OutlineStaticField, OutlineStaticList } from './OutlinePageEditModal';
import { mockRevisePptPage } from '@/lib/outlineEditMock';

interface PptOutlineEditorProps {
  outline: PptOutline;
  onChange: (outline: PptOutline) => void;
  onGenerateDesigns: (mode: 'template' | 'no-template') => void;
  onRegenerateOutline: () => void;
  selectedTemplateId: string | null;
  templates?: PptBuiltinTemplate[];
  moreTemplates?: PptBuiltinTemplate[];
  onSelectTemplate: (templateId: string | null) => void;
  isGenerating?: boolean;
  /** 医学部 / 市场部审阅：仅编辑大纲，不触发生成 */
  reviewerMode?: boolean;
  onSaveOutlineReview?: () => void;
  /** inline：右侧 PPT大纲 标签内编辑；overlay：全屏侧栏（已弃用） */
  variant?: 'inline' | 'overlay';
  onClose?: () => void;
  /** false：生成按钮由外层 tab 底部区域渲染（inline 模式） */
  showGenerateFooter?: boolean;
}

export function PptOutlineGenerateFooter({
  isGenerating = false,
  selectedTemplateId,
  templates = PPT_BUILTIN_TEMPLATES,
  onGenerateDesigns,
}: {
  isGenerating?: boolean;
  selectedTemplateId: string | null;
  templates?: PptBuiltinTemplate[];
  onGenerateDesigns: (mode: 'template' | 'no-template') => void;
}) {
  const selected = templates.find((item) => item.id === selectedTemplateId);
  return (
    <footer className="ppt-outline-foot ppt-outline-generate-foot">
      <div className="ppt-generate-actions">
        <button
          type="button"
          className="btn ppt-generate-btn primary"
          disabled={isGenerating || !selectedTemplateId}
          onClick={() => onGenerateDesigns(isBlankPptTemplate(selected) ? 'no-template' : 'template')}
        >
          {isGenerating ? '生成中…' : '按模板生成 PPT'}
        </button>
      </div>
      <div className="small ppt-generate-hint">
        {selected
          ? isBlankPptTemplate(selected)
            ? '已选「空白模板」· 将按大纲结构直接生成'
            : `已选「${selected.name}」· 将按该模板生成`
          : '请先在上方选择一套模板，或点击「选择更多模板」'}
      </div>
    </footer>
  );
}

const CHAPTER_DRAG_TYPE = 'application/x-ppt-chapter';
const PAGE_DRAG_TYPE = 'application/x-ppt-page';

function DragHandle({ label }: { label: string }) {
  return (
    <span className="ppt-drag-handle" title={label} aria-hidden>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="9" cy="6" r="1.5" />
        <circle cx="15" cy="6" r="1.5" />
        <circle cx="9" cy="12" r="1.5" />
        <circle cx="15" cy="12" r="1.5" />
        <circle cx="9" cy="18" r="1.5" />
        <circle cx="15" cy="18" r="1.5" />
      </svg>
    </span>
  );
}

function DeleteButton({ title, onClick }: { title: string; onClick: () => void }) {
  return (
    <button type="button" className="ppt-outline-delete-btn" title={title} aria-label={title} onClick={onClick}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    </button>
  );
}

export function PptOutlineEditor({
  outline,
  onChange,
  onGenerateDesigns,
  onRegenerateOutline,
  selectedTemplateId,
  templates = PPT_BUILTIN_TEMPLATES,
  moreTemplates = PPT_BUILTIN_TEMPLATES,
  onSelectTemplate,
  isGenerating = false,
  reviewerMode = false,
  onSaveOutlineReview,
  variant = 'inline',
  onClose,
  showGenerateFooter = true,
}: PptOutlineEditorProps) {
  const isInline = variant === 'inline';
  const [draggingChapterId, setDraggingChapterId] = useState<string | null>(null);
  const [draggingPageKey, setDraggingPageKey] = useState<string | null>(null);
  const [dropChapterId, setDropChapterId] = useState<string | null>(null);
  const [dropPageKey, setDropPageKey] = useState<string | null>(null);
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});
  const [moreOpen, setMoreOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ chId: string; pgId: string } | null>(null);

  useEffect(() => {
    const next = ensureOutlineDeckStructure(outline);
    if (next !== outline) onChange(next);
  }, [outline, onChange]);

  const isChapterExpanded = (chapterId: string) => collapsedChapters[chapterId] !== true;

  const sectionBadge = (chapter: PptOutlineChapter, contentIndex: number) => {
    if (chapter.kind === 'cover') return '封面';
    if (chapter.kind === 'toc') return '目录';
    if (chapter.kind === 'back') return '封底';
    return `节 ${contentIndex + 1}`;
  };

  const toggleChapter = (chapterId: string) => {
    setCollapsedChapters((prev) => ({
      ...prev,
      [chapterId]: isChapterExpanded(chapterId),
    }));
  };

  const pageNumberById = useMemo(() => {
    const map = new Map<string, number>();
    let n = 0;
    for (const ch of outline.chapters) {
      for (const pg of ch.pages) {
        n += 1;
        map.set(pg.id, n);
      }
    }
    return map;
  }, [outline.chapters]);

  const updateChapter = (chId: string, patch: Partial<PptOutlineChapter>) => {
    onChange(
      syncOutlineSectionMeta({
        ...outline,
        chapters: outline.chapters.map((ch) => (ch.id === chId ? { ...ch, ...patch } : ch)),
      })
    );
  };

  const updatePage = (chId: string, pgId: string, patch: Partial<PptOutlinePage>) => {
    onChange({
      ...outline,
      chapters: outline.chapters.map((ch) =>
        ch.id === chId
          ? {
              ...ch,
              pages: ch.pages.map((pg) => (pg.id === pgId ? { ...pg, ...patch } : pg)),
            }
          : ch
      ),
    });
  };

  const addChapter = () => {
    const id = genId('ch');
    const created: PptOutlineChapter = {
      id,
      title: '新章节',
      kind: 'section',
      pages: [
        makeOutlinePage('新章节', 'section-title'),
        makeOutlinePage('新页面', 'content', ['要点 1'], {
          visualSuggestion: '要点列表配合示意图，避免信息过载。',
        }),
      ],
    };
    const backIdx = outline.chapters.findIndex((ch) => ch.kind === 'back');
    const chapters = [...outline.chapters];
    chapters.splice(backIdx >= 0 ? backIdx : chapters.length, 0, created);
    onChange(syncOutlineSectionMeta({ ...outline, chapters }));
    setCollapsedChapters((prev) => ({ ...prev, [id]: false }));
  };

  const addPage = (chId: string) => {
    const target = outline.chapters.find((ch) => ch.id === chId);
    if (!target || isStructuralSection(target)) return;
    onChange({
      ...outline,
      chapters: outline.chapters.map((ch) =>
        ch.id === chId
          ? {
              ...ch,
              pages: [
                ...ch.pages,
                makeOutlinePage('新页面', 'content', ['要点 1'], {
                  visualSuggestion: '要点列表配合示意图，避免信息过载。',
                }),
              ],
            }
          : ch
      ),
    });
  };

  const removePage = (chId: string, pgId: string) => {
    onChange(removePageFromOutline(outline, chId, pgId));
  };

  const removeChapter = (chId: string) => {
    onChange(removeChapterFromOutline(outline, chId));
  };

  const handleChapterDrop = (targetChapterId: string, e: React.DragEvent) => {
    e.preventDefault();
    setDropChapterId(null);
    const dragChapterId = e.dataTransfer.getData(CHAPTER_DRAG_TYPE);
    if (dragChapterId) {
      onChange(moveChapterInOutline(outline, dragChapterId, targetChapterId));
      return;
    }
    const pagePayload = e.dataTransfer.getData(PAGE_DRAG_TYPE);
    if (pagePayload) {
      try {
        const { chId, pgId } = JSON.parse(pagePayload) as { chId: string; pgId: string };
        onChange(movePageInOutline(outline, chId, pgId, targetChapterId, null));
      } catch {
        /* ignore invalid payload */
      }
    }
  };

  const handlePageDrop = (toChapterId: string, targetPageId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropPageKey(null);
    const pagePayload = e.dataTransfer.getData(PAGE_DRAG_TYPE);
    if (!pagePayload) return;
    try {
      const { chId, pgId } = JSON.parse(pagePayload) as { chId: string; pgId: string };
      onChange(movePageInOutline(outline, chId, pgId, toChapterId, targetPageId));
    } catch {
      /* ignore invalid payload */
    }
  };

  const shellClass = isInline ? 'ppt-outline-inline' : 'ppt-outline-overlay';
  const panelClass = isInline ? 'ppt-outline-inline-panel' : 'ppt-outline-panel';

  return (
    <div className={shellClass}>
      <div className={panelClass}>
        <header className="ppt-outline-head">
          <div>
            {isInline ? (
              <h3 className="ppt-outline-inline-title">{outline.title}</h3>
            ) : (
              <h2>{outline.title}</h2>
            )}
            <div className="small">
              受众：{outline.audience} · 场景：{outline.scenario} · 共 {outlinePageCount(outline)} 页
            </div>
          </div>
          {!isInline && onClose && (
            <button type="button" className="ppt-close-btn" onClick={onClose} aria-label="关闭">
              ×
            </button>
          )}
        </header>

        {!reviewerMode && (
          <div className="ppt-outline-toolbar">
            <button type="button" className="btn soft" onClick={onRegenerateOutline} disabled={isGenerating}>
              重新生成大纲
            </button>
          </div>
        )}

        <div className="ppt-outline-body">
          {outline.chapters.map((ch) => {
            const expanded = isChapterExpanded(ch.id);
            const structural = isStructuralSection(ch);
            const contentIndex = outline.chapters.filter(isContentSection).findIndex((item) => item.id === ch.id);
            return (
            <section
              key={ch.id}
              className={`ppt-chapter ${expanded ? 'is-expanded' : 'is-collapsed'} ${structural ? 'is-deck-section' : ''} ${draggingChapterId === ch.id ? 'is-dragging' : ''} ${dropChapterId === ch.id ? 'is-drop-target' : ''}`}
              onDragOver={(e) => {
                if (structural) return;
                e.preventDefault();
                setDropChapterId(ch.id);
              }}
              onDragLeave={() => setDropChapterId((id) => (id === ch.id ? null : id))}
              onDrop={(e) => handleChapterDrop(ch.id, e)}
            >
              <div className="ppt-chapter-head">
                <button
                  type="button"
                  className="ppt-chapter-toggle"
                  onClick={() => toggleChapter(ch.id)}
                  aria-expanded={expanded}
                  aria-label={expanded ? '收起节' : '展开节'}
                  title={expanded ? '收起节' : '展开节'}
                >
                  <svg
                    className={`ppt-chapter-chevron ${expanded ? 'is-open' : ''}`}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
                {!structural && (
                <span
                  className="ppt-drag-handle-wrap"
                  title="拖拽排序节"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(CHAPTER_DRAG_TYPE, ch.id);
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggingChapterId(ch.id);
                  }}
                  onDragEnd={() => {
                    setDraggingChapterId(null);
                    setDropChapterId(null);
                  }}
                >
                  <DragHandle label="拖拽排序节" />
                </span>
                )}
                <span className={`ppt-chapter-num ${ch.kind ? `is-${ch.kind}` : ''}`}>{sectionBadge(ch, contentIndex)}</span>
                <input
                  className="ppt-chapter-title input"
                  value={ch.title}
                  onChange={(e) => updateChapter(ch.id, { title: e.target.value })}
                />
                <span className="ppt-chapter-page-count">{ch.pages.length} 页</span>
                {isContentSection(ch) && outline.chapters.filter(isContentSection).length > 1 && (
                  <DeleteButton title="删除节" onClick={() => removeChapter(ch.id)} />
                )}
              </div>

              {expanded && (
              <div className="ppt-pages">
                {ch.pages.map((pg) => {
                  const n = pageNumberById.get(pg.id) ?? 0;
                  const pageKey = `${ch.id}:${pg.id}`;
                  return (
                    <div
                      key={pg.id}
                      className={`ppt-page-card ${isTitleOnlyPage(pg) || pg.kind === 'toc' ? 'is-title-slide' : ''} ${draggingPageKey === pageKey ? 'is-dragging' : ''} ${dropPageKey === pageKey ? 'is-drop-target' : ''}`}
                      onDragOver={(e) => {
                        if (structural) return;
                        e.preventDefault();
                        e.stopPropagation();
                        setDropPageKey(pageKey);
                      }}
                      onDragLeave={() => setDropPageKey((key) => (key === pageKey ? null : key))}
                      onDrop={(e) => handlePageDrop(ch.id, pg.id, e)}
                    >
                      <div className="ppt-page-num">{n}</div>
                      <div className="ppt-page-body">
                        <div className="ppt-page-title-row">
                          {!structural && (
                          <span
                            className="ppt-drag-handle-wrap ppt-drag-handle-wrap--page"
                            title="拖拽排序页面"
                            draggable
                            onDragStart={(e) => {
                              e.stopPropagation();
                              e.dataTransfer.setData(PAGE_DRAG_TYPE, JSON.stringify({ chId: ch.id, pgId: pg.id }));
                              e.dataTransfer.effectAllowed = 'move';
                              setDraggingPageKey(pageKey);
                            }}
                            onDragEnd={() => {
                              setDraggingPageKey(null);
                              setDropPageKey(null);
                            }}
                          >
                            <DragHandle label="拖拽排序页面" />
                          </span>
                          )}
                          <div className="ppt-page-title-text">{pg.title || '未命名页面'}</div>
                          <button
                            type="button"
                            className="ppt-page-edit-btn"
                            onClick={() => setEditTarget({ chId: ch.id, pgId: pg.id })}
                          >
                            修改本页
                          </button>
                          {ch.pages.length > 1 && (
                            <DeleteButton title="删除页面" onClick={() => removePage(ch.id, pg.id)} />
                          )}
                        </div>
                        {pg.kind === 'toc' && (
                          <OutlineStaticList label="目录条目" items={pg.bullets} empty="暂无目录条目" />
                        )}
                        {!structural && pg.kind !== 'toc' && (
                        <>
                          <OutlineStaticList label="页面核心内容" items={pg.bullets} empty="暂无核心内容" />
                          <OutlineStaticField
                            label="页面可视化建议"
                            value={pg.visualSuggestion}
                            empty="暂无可视化建议"
                          />
                          <OutlineStaticList
                            label="当前页面参考文献"
                            items={pg.references}
                            empty="暂无参考文献"
                          />
                        </>
                        )}
                      </div>
                    </div>
                  );
                })}
                {!structural && (
                <button type="button" className="ppt-add-page" onClick={() => addPage(ch.id)}>
                  + 添加页面
                </button>
                )}
              </div>
              )}
            </section>
            );
          })}

          <button type="button" className="ppt-add-chapter" onClick={addChapter}>
            + 添加节
          </button>
        </div>

        {!reviewerMode && (
          <section className="ppt-template-section">
            <div className="ppt-template-section-head">
              <div>
                <h4 className="ppt-template-heading">选择 PPT 模板</h4>
                <div className="small">根据受众与场景推荐 4 个模板，第一个为空白模板。</div>
              </div>
              <button type="button" className="btn soft ppt-more-template-btn" onClick={() => setMoreOpen(true)}>
                选择更多模板
              </button>
            </div>
            <div className="ppt-template-grid">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  className={`ppt-template-card ${selectedTemplateId === tpl.id ? 'selected' : ''}`}
                  onClick={() => onSelectTemplate(tpl.id)}
                >
                  <PptTemplateThumb template={tpl} />
                  <strong>{tpl.name}</strong>
                  <div className="small">{tpl.styleTag}</div>
                  <div className="small ppt-template-desc">{tpl.description}</div>
                </button>
              ))}
            </div>
            <PptTemplatePickerModal
              open={moreOpen}
              templates={moreTemplates}
              selectedId={selectedTemplateId}
              onClose={() => setMoreOpen(false)}
              onConfirm={(id) => {
                onSelectTemplate(id);
                setMoreOpen(false);
              }}
            />
          </section>
        )}

        {reviewerMode ? (
          <footer className="ppt-outline-foot">
            <button
              type="button"
              className="btn ppt-generate-btn primary"
              onClick={() => onSaveOutlineReview?.()}
            >
              保存大纲修改
            </button>
            <div className="small">
              可拖拽调整各页顺序，或点击「修改本页」告知 AI 如何调整该页。保存后内容运营可在同一会话「PPT大纲」中查看。
            </div>
          </footer>
        ) : showGenerateFooter ? (
          <PptOutlineGenerateFooter
            isGenerating={isGenerating}
            selectedTemplateId={selectedTemplateId}
            templates={templates}
            onGenerateDesigns={onGenerateDesigns}
          />
        ) : null}
      </div>
      <OutlinePageEditModal
        open={Boolean(editTarget)}
        onCancel={() => setEditTarget(null)}
        onConfirm={(instruction) => {
          if (!editTarget) return;
          const chapter = outline.chapters.find((item) => item.id === editTarget.chId);
          const page = chapter?.pages.find((item) => item.id === editTarget.pgId);
          if (page) updatePage(editTarget.chId, editTarget.pgId, mockRevisePptPage(page, instruction));
          setEditTarget(null);
        }}
      />
    </div>
  );
}
