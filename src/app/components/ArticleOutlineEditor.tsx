import { useState } from 'react';
import type { ArticleOutline, ArticleOutlineChapter } from '@/types/content';
import { genId } from './pptUtils';
import { PptTemplatePickerModal, PptTemplateThumb } from './PptTemplatePickerModal';
import type { PptBuiltinTemplate } from './pptTemplates';
import type { ImageBuiltinTemplate } from './imageTemplates';
import { OutlinePageEditModal, OutlineReferencedImages, OutlineStaticField, OutlineStaticList } from './OutlinePageEditModal';
import { mockReviseArticleChapter } from '@/lib/outlineEditMock';

const CHAPTER_DRAG_TYPE = 'application/x-article-chapter';

function toPickerTemplate(template: ImageBuiltinTemplate): PptBuiltinTemplate {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    styleTag: template.styleHint,
    variantIndex: 0,
    gradient: template.gradient,
    accent: template.accent,
    previewUrl: template.previewImg,
    isBlank: template.isBlank,
  };
}

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

function emptyChapter(): ArticleOutlineChapter {
  return {
    id: genId('article-ch'),
    title: '',
    core: '',
    coreCites: [],
    imageUrl: '',
    imageAlt: '',
    tmsh: '',
    references: [],
    referencedImages: [],
  };
}

function moveChapter(outline: ArticleOutline, fromId: string, toId: string): ArticleOutline {
  if (fromId === toId) return outline;
  const fromIndex = outline.chapters.findIndex((item) => item.id === fromId);
  const toIndex = outline.chapters.findIndex((item) => item.id === toId);
  if (fromIndex < 0 || toIndex < 0) return outline;
  const next = [...outline.chapters];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return { ...outline, chapters: next };
}

interface ArticleOutlineEditorProps {
  outline: ArticleOutline;
  onChange: (outline: ArticleOutline) => void;
  onRegenerateOutline: () => void;
  onGenerateArticle?: () => void;
  isGenerating?: boolean;
  titleLabel?: string;
  refsLabel?: string;
  generateLabel?: string;
  imageTemplates?: ImageBuiltinTemplate[];
  moreImageTemplates?: ImageBuiltinTemplate[];
  selectedImageTemplateId?: string | null;
  onSelectImageTemplate?: (id: string | null) => void;
}

export function ArticleOutlineEditor({
  outline,
  onChange,
  onRegenerateOutline,
  onGenerateArticle,
  isGenerating = false,
  titleLabel = '推文标题',
  refsLabel = '参考文献',
  generateLabel = '生成图文',
  imageTemplates,
  moreImageTemplates,
  selectedImageTemplateId,
  onSelectImageTemplate,
}: ArticleOutlineEditorProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [editChapterId, setEditChapterId] = useState<string | null>(null);
  const pickerTemplates = (imageTemplates || []).map(toPickerTemplate);
  const morePickerTemplates = (moreImageTemplates || imageTemplates || []).map(toPickerTemplate);

  const updateChapter = (id: string, patch: Partial<ArticleOutlineChapter>) => {
    onChange({
      ...outline,
      chapters: outline.chapters.map((chapter) => (chapter.id === id ? { ...chapter, ...patch } : chapter)),
    });
  };

  return (
    <div className="ppt-outline-inline article-outline-inline">
      <div className="ppt-outline-inline-panel">
        <header className="ppt-outline-head article-outline-head">
          <div className="article-outline-head-main">
            <label className="ppt-page-field article-outline-title-field">
              <span>{titleLabel}</span>
              <input
                className="ppt-page-title input"
                value={outline.title}
                onChange={(event) => onChange({ ...outline, title: event.target.value })}
              />
            </label>
            <div className="small">共 {outline.chapters.length} 个章节</div>
          </div>
        </header>

        <div className="ppt-outline-toolbar">
          <button type="button" className="btn soft" onClick={onRegenerateOutline} disabled={isGenerating}>
            重新生成大纲
          </button>
        </div>

        <div className="ppt-outline-body">
          {outline.chapters.map((chapter, index) => (
            <section
              key={chapter.id}
              className={`ppt-chapter article-outline-chapter ${draggingId === chapter.id ? 'is-dragging' : ''} ${dropId === chapter.id ? 'is-drop-target' : ''}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDropId(chapter.id);
              }}
              onDragLeave={() => setDropId((id) => (id === chapter.id ? null : id))}
              onDrop={(event) => {
                event.preventDefault();
                const fromId = event.dataTransfer.getData(CHAPTER_DRAG_TYPE);
                if (fromId) onChange(moveChapter(outline, fromId, chapter.id));
                setDraggingId(null);
                setDropId(null);
              }}
            >
              <div className="ppt-page-card article-outline-card">
                <div className="ppt-page-num">{index + 1}</div>
                <div className="ppt-page-body">
                  <div className="ppt-page-title-row">
                    <span
                      className="ppt-drag-handle-wrap ppt-drag-handle-wrap--page"
                      title="拖拽排序章节"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData(CHAPTER_DRAG_TYPE, chapter.id);
                        event.dataTransfer.effectAllowed = 'move';
                        setDraggingId(chapter.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDropId(null);
                      }}
                    >
                      <DragHandle label="拖拽排序章节" />
                    </span>
                    <div className="ppt-page-title-text">{chapter.title || '未命名章节'}</div>
                    <button
                      type="button"
                      className="ppt-page-edit-btn"
                      onClick={() => setEditChapterId(chapter.id)}
                    >
                      修改本章
                    </button>
                    {outline.chapters.length > 1 && (
                      <DeleteButton
                        title="删除章节"
                        onClick={() =>
                          onChange({
                            ...outline,
                            chapters: outline.chapters.filter((item) => item.id !== chapter.id),
                          })
                        }
                      />
                    )}
                  </div>

                  <OutlineStaticField
                    label="本章核心内容"
                    value={chapter.core}
                    empty="暂无核心内容"
                    cites={chapter.coreCites}
                  />

                  <OutlineStaticField label="章节TMSH" value={chapter.tmsh} empty="暂无 TMSH" />
                  <OutlineReferencedImages images={chapter.referencedImages} />
                  <OutlineStaticList
                    label={refsLabel}
                    items={chapter.references}
                    empty="暂无参考文献"
                  />
                </div>
              </div>
            </section>
          ))}

          <button
            type="button"
            className="ppt-add-chapter"
            onClick={() => {
              const chapter = emptyChapter();
              onChange({
                ...outline,
                chapters: [...outline.chapters, chapter],
              });
              setEditChapterId(chapter.id);
            }}
          >
            + 添加章节
          </button>
        </div>

        {imageTemplates && onSelectImageTemplate && (
          <section className="ppt-template-section">
            <div className="ppt-template-section-head">
              <div>
                <h4 className="ppt-template-heading">选择图片模板</h4>
              </div>
              <button type="button" className="btn soft ppt-more-template-btn" onClick={() => setMoreOpen(true)}>
                选择更多模板
              </button>
            </div>
            <div className="ppt-template-grid">
              {pickerTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  className={`ppt-template-card ${selectedImageTemplateId === tpl.id ? 'selected' : ''}`}
                  onClick={() => onSelectImageTemplate(tpl.id)}
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
              templates={morePickerTemplates}
              selectedId={selectedImageTemplateId ?? null}
              title="选择更多模板"
              onClose={() => setMoreOpen(false)}
              onConfirm={(id) => {
                onSelectImageTemplate(id);
                setMoreOpen(false);
              }}
            />
          </section>
        )}

        {onGenerateArticle && (
          <footer className="ppt-outline-foot ppt-outline-generate-foot">
            <button
              type="button"
              className="btn ppt-generate-btn primary"
              onClick={onGenerateArticle}
              disabled={isGenerating || Boolean(imageTemplates && !selectedImageTemplateId)}
            >
              {isGenerating ? '生成中…' : generateLabel}
            </button>
            {imageTemplates && !selectedImageTemplateId ? (
              <div className="small ppt-generate-hint">请先选择一套模板</div>
            ) : null}
          </footer>
        )}
      </div>

      <OutlinePageEditModal
        open={Boolean(editChapterId)}
        title="请告知AI您想如何修改本章大纲"
        placeholder="例如：把核心结论提前，并补充一条随访建议"
        onCancel={() => setEditChapterId(null)}
        onConfirm={(instruction) => {
          const chapter = outline.chapters.find((item) => item.id === editChapterId);
          if (chapter) updateChapter(chapter.id, mockReviseArticleChapter(chapter, instruction));
          setEditChapterId(null);
        }}
      />
    </div>
  );
}
