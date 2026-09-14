import { useMemo, useState } from 'react';
import type { PptOutline, PptOutlinePage, PptOutlinePageKind } from '@/types/content';
import { genId, makeOutlinePage, movePageInOutline, outlinePageCount } from './pptUtils';
import { PPT_BUILTIN_TEMPLATES, type PptBuiltinTemplate } from './pptTemplates';
import { PptTemplatePickerModal, PptTemplateThumb } from './PptTemplatePickerModal';
import { OutlineAiPrompt, OutlineManualCiteImageForm, OutlineReferencedImages, OutlineStaticField, OutlineStaticList } from './OutlinePageEditModal';
import {
  appendManualCiteImage,
  mockRevisePptPageRegion,
  rematchPageCitations,
  type PptPageAiRegion,
} from '@/lib/outlineEditMock';

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
  reviewerMode?: boolean;
  onSaveOutlineReview?: () => void;
  variant?: 'inline' | 'overlay';
  onClose?: () => void;
  showGenerateFooter?: boolean;
}

export function PptOutlineGenerateFooter({
  isGenerating = false,
  onGenerateDesigns,
}: {
  isGenerating?: boolean;
  selectedTemplateId?: string | null;
  templates?: PptBuiltinTemplate[];
  onGenerateDesigns: (mode: 'template' | 'no-template') => void;
}) {
  return (
    <footer className="ppt-outline-foot ppt-outline-generate-foot">
      <div className="ppt-generate-actions">
        <button
          type="button"
          className="btn ppt-generate-btn primary"
          disabled={isGenerating}
          onClick={() => onGenerateDesigns('no-template')}
        >
          {isGenerating ? '生成中…' : '生成PPT'}
        </button>
      </div>
    </footer>
  );
}

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

function pageKindLabel(kind?: PptOutlinePageKind): string | null {
  if (kind === 'cover') return '封面';
  if (kind === 'toc') return '目录';
  if (kind === 'section-title') return '章节标题页';
  if (kind === 'back') return '封底';
  return null;
}

function blankOutlinePage(): PptOutlinePage {
  return makeOutlinePage('', 'content', [], {
    visualSuggestion: '',
    references: [],
    referencedImages: [],
    bulletCites: [],
  });
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
  const [draggingPageKey, setDraggingPageKey] = useState<string | null>(null);
  const [dropPageKey, setDropPageKey] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [pageEdit, setPageEdit] = useState<{
    chId: string;
    pgId: string;
    snapshot: PptOutlinePage;
  } | null>(null);
  const [aiRegion, setAiRegion] = useState<PptPageAiRegion | null>(null);
  const [aiInstruction, setAiInstruction] = useState('');
  const [manualImageOpen, setManualImageOpen] = useState(false);

  const flatPages = useMemo(
    () =>
      outline.chapters.flatMap((chapter) =>
        chapter.pages.map((page) => ({ chId: chapter.id, page }))
      ),
    [outline.chapters]
  );

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

  const beginPageEdit = (chId: string, page: PptOutlinePage) => {
    setPageEdit({ chId, pgId: page.id, snapshot: page });
    setAiRegion(null);
    setAiInstruction('');
    setManualImageOpen(false);
  };

  const stopPageEdit = (restore = false) => {
    if (restore && pageEdit) updatePage(pageEdit.chId, pageEdit.pgId, pageEdit.snapshot);
    setPageEdit(null);
    setAiRegion(null);
    setAiInstruction('');
    setManualImageOpen(false);
  };

  const applyPageAi = (page: PptOutlinePage) => {
    if (!pageEdit || !aiRegion || !aiInstruction.trim()) return;
    updatePage(pageEdit.chId, pageEdit.pgId, mockRevisePptPageRegion(page, aiRegion, aiInstruction.trim()));
    setAiRegion(null);
    setAiInstruction('');
  };

  const addManualImage = (page: PptOutlinePage, input: { url: string; caption: string; source: string }) => {
    if (!pageEdit) return;
    const next = appendManualCiteImage(page.referencedImages, page.references, input);
    updatePage(pageEdit.chId, pageEdit.pgId, rematchPageCitations({
      ...page,
      referencedImages: next.images,
      references: next.references,
    }));
    setManualImageOpen(false);
  };

  const removeImage = (page: PptOutlinePage, index: number) => {
    if (!pageEdit) return;
    updatePage(
      pageEdit.chId,
      pageEdit.pgId,
      rematchPageCitations({
        ...page,
        referencedImages: (page.referencedImages || []).filter((_, itemIndex) => itemIndex !== index),
      })
    );
  };

  const addPage = () => {
    const page = blankOutlinePage();
    const chId = genId('ch');
    const created = { id: chId, title: '', kind: 'section' as const, pages: [page] };
    const chapters = [...outline.chapters];
    const backIdx = chapters.findIndex((ch) => ch.kind === 'back');
    chapters.splice(backIdx >= 0 ? backIdx : chapters.length, 0, created);
    onChange({ ...outline, chapters });
    setPageEdit({ chId, pgId: page.id, snapshot: page });
    setAiRegion(null);
    setAiInstruction('');
    setManualImageOpen(false);
  };

  const removePage = (chId: string, pgId: string) => {
    if (flatPages.length <= 1) return;
    onChange({
      ...outline,
      chapters: outline.chapters
        .map((ch) =>
          ch.id === chId ? { ...ch, pages: ch.pages.filter((pg) => pg.id !== pgId) } : ch
        )
        .filter((ch) => ch.pages.length > 0),
    });
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
          <div className="ppt-pages ppt-pages-flat">
            {flatPages.map(({ chId, page: pg }, index) => {
              const pageKey = `${chId}:${pg.id}`;
              const isEditing = pageEdit?.chId === chId && pageEdit.pgId === pg.id;
              const titleAi = isEditing && aiRegion === 'title';
              const coreAi = isEditing && aiRegion === 'core';
              const visualAi = isEditing && aiRegion === 'visual';
              const toggleAi = (region: PptPageAiRegion) => {
                setManualImageOpen(false);
                setAiRegion((prev) => (prev === region ? null : region));
                setAiInstruction('');
              };
              return (
                <div
                  key={pg.id}
                  className={`ppt-page-card ${draggingPageKey === pageKey ? 'is-dragging' : ''} ${dropPageKey === pageKey ? 'is-drop-target' : ''} ${isEditing ? 'is-editing' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDropPageKey(pageKey);
                  }}
                  onDragLeave={() => setDropPageKey((key) => (key === pageKey ? null : key))}
                  onDrop={(e) => handlePageDrop(chId, pg.id, e)}
                >
                  <div className="ppt-page-num">{index + 1}</div>
                  <div className="ppt-page-body">
                    <div className="ppt-page-title-row">
                      <span
                        className="ppt-drag-handle-wrap ppt-drag-handle-wrap--page"
                        title="拖拽排序页面"
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          e.dataTransfer.setData(PAGE_DRAG_TYPE, JSON.stringify({ chId, pgId: pg.id }));
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
                      {isEditing ? (
                        <button
                          type="button"
                          className={`ppt-page-ai-btn ${titleAi ? 'is-active' : ''}`}
                          onClick={() => toggleAi('title')}
                        >
                          AI修改
                        </button>
                      ) : null}
                      <div className={`ppt-page-title-text ${titleAi ? 'is-ai-active' : ''}`}>{pg.title || '未命名页面'}</div>
                      {pageKindLabel(pg.kind) && (
                        <span className={`ppt-page-kind-badge is-${pg.kind}`}>{pageKindLabel(pg.kind)}</span>
                      )}
                      {isEditing ? null : (
                        <button
                          type="button"
                          className="ppt-page-edit-btn"
                          onClick={() => beginPageEdit(chId, pg)}
                        >
                          修改本页
                        </button>
                      )}
                      {flatPages.length > 1 && (
                        <DeleteButton title="删除页面" onClick={() => removePage(chId, pg.id)} />
                      )}
                    </div>
                    {titleAi ? (
                      <OutlineAiPrompt
                        value={aiInstruction}
                        placeholder="例如：标题更短，突出早期干预"
                        onChange={setAiInstruction}
                        onSubmit={() => applyPageAi(pg)}
                        onCancel={() => {
                          setAiRegion(null);
                          setAiInstruction('');
                        }}
                      />
                    ) : null}
                    <OutlineStaticList
                      label="页面核心内容"
                      items={pg.bullets}
                      empty="暂无核心内容"
                      itemCites={pg.bulletCites}
                      numbered={false}
                      showAi={isEditing}
                      aiActive={coreAi}
                      onAi={() => toggleAi('core')}
                      aiPrompt={
                        coreAi ? (
                          <OutlineAiPrompt
                            value={aiInstruction}
                            placeholder="例如：把第三条改成强调随访依从性"
                            onChange={setAiInstruction}
                            onSubmit={() => applyPageAi(pg)}
                            onCancel={() => {
                              setAiRegion(null);
                              setAiInstruction('');
                            }}
                          />
                        ) : null
                      }
                    />
                    <OutlineReferencedImages
                      images={pg.referencedImages}
                      onRemove={isEditing ? (index) => removeImage(pg, index) : undefined}
                      action={
                        isEditing ? (
                          manualImageOpen ? (
                            <OutlineManualCiteImageForm
                              onCancel={() => setManualImageOpen(false)}
                              onAdd={(input) => addManualImage(pg, input)}
                            />
                          ) : (
                            <button
                              type="button"
                              className="btn soft outline-manual-image-btn"
                              onClick={() => {
                                setAiRegion(null);
                                setAiInstruction('');
                                setManualImageOpen(true);
                              }}
                            >
                              手动添加引用图片／截图
                            </button>
                          )
                        ) : null
                      }
                    />
                    <OutlineStaticField
                      label="可视化建议"
                      value={pg.visualSuggestion}
                      empty="暂无可视化建议"
                      showAi={isEditing}
                      aiActive={visualAi}
                      onAi={() => toggleAi('visual')}
                      aiPrompt={
                        visualAi ? (
                          <OutlineAiPrompt
                            value={aiInstruction}
                            placeholder="例如：改成左右分栏，右侧放趋势图"
                            onChange={setAiInstruction}
                            onSubmit={() => applyPageAi(pg)}
                            onCancel={() => {
                              setAiRegion(null);
                              setAiInstruction('');
                            }}
                          />
                        ) : null
                      }
                    />
                    <OutlineStaticList
                      label="参考文献"
                      items={pg.references}
                      empty="暂无参考文献"
                    />
                    {isEditing ? (
                      <div className="ppt-page-edit-actions">
                        <div className="ppt-page-edit-actions-end">
                          <button
                            type="button"
                            className="btn primary ppt-page-confirm-btn"
                            onClick={() => stopPageEdit(false)}
                          >
                            完成
                          </button>
                          <button
                            type="button"
                            className="btn soft ppt-page-confirm-btn"
                            onClick={() => stopPageEdit(true)}
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <button type="button" className="ppt-add-page" onClick={addPage}>
            + 添加页面
          </button>
        </div>

        {!reviewerMode && (
          <section className="ppt-template-section">
            <div className="ppt-template-section-head">
              <div>
                <h4 className="ppt-template-heading">选择 PPT 模板</h4>
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
    </div>
  );
}
