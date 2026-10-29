import { useEffect, useMemo, useRef, useState } from 'react';
import type { OutlineRefImage, PptOutline, PptOutlinePage, PptOutlinePageKind } from '@/types/content';
import { genId, makeOutlinePage, movePageInOutline, outlinePageCount } from './pptUtils';
import { attachStorylinePointsToOutline, isPageDetachedFromStoryline } from '@/lib/storylineOutline';
import { PPT_BUILTIN_TEMPLATES, type PptBuiltinTemplate } from './pptTemplates';
import { PptTemplatePickerModal, PptTemplateThumb } from './PptTemplatePickerModal';
import { OutlineReferencedImages, OutlineStaticList } from './OutlinePageEditModal';
import { mockRevisePptPageRegion } from '@/lib/outlineEditMock';

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
  storylineContent?: string;
  onNotify?: (text: string) => void;
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

interface ManualDraft {
  title: string;
  bullets: { text: string; cites: string }[];
  references: string[];
  referencedImages: OutlineRefImage[];
}

function draftFromPage(page: PptOutlinePage): ManualDraft {
  return {
    title: page.title,
    bullets: (page.bullets || []).map((text, index) => ({
      text,
      cites: String(
        (page.bulletCites?.[index] || []).find((num) => num >= 1 && num <= (page.references || []).length) ?? ''
      ),
    })),
    references: [...(page.references || [])],
    referencedImages: [...(page.referencedImages || [])],
  };
}

function parseCites(raw: string, max: number): number[] {
  return [
    ...new Set(
      raw
        .split(/[,，、\s]+/)
        .map((item) => Number(item))
        .filter((num) => Number.isInteger(num) && num >= 1 && num <= max)
    ),
  ];
}

function shiftCitesAfterRemoval(cites: number[] | undefined, removed: number): number[] {
  return (cites || []).filter((num) => num !== removed).map((num) => (num > removed ? num - 1 : num));
}

function shiftCiteText(raw: string, removed: number): string {
  const nums = raw
    .split(/[,，、\s]+/)
    .map((item) => Number(item))
    .filter((num) => Number.isInteger(num) && num > 0);
  return shiftCitesAfterRemoval(nums, removed).join(',');
}

function readPastedImages(event: React.ClipboardEvent, onImage: (url: string, name: string) => void): boolean {
  const files = Array.from(event.clipboardData?.items || [])
    .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file));
  if (!files.length) return false;
  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => onImage(String(reader.result || ''), file.name);
    reader.readAsDataURL(file);
  });
  return true;
}

function ManualImageGrid({
  images,
  referenceCount,
  onChange,
  onAdd,
}: {
  images: OutlineRefImage[];
  referenceCount: number;
  onChange: (images: OutlineRefImage[]) => void;
  onAdd: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const patchImage = (index: number, patch: Partial<OutlineRefImage>) =>
    onChange(images.map((image, itemIndex) => (itemIndex === index ? { ...image, ...patch } : image)));

  const handleFiles = (files: FileList | null) => {
    Array.from(files || [])
      .filter((file) => file.type.startsWith('image/'))
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => onAdd(String(reader.result || ''));
        reader.readAsDataURL(file);
      });
  };

  return (
    <div className="ppt-page-field">
      <div className="ppt-page-field-head">
        <span>引用图片</span>
        <em className="ppt-manual-hint">添加后请填写图片说明并选择参考文献角标</em>
      </div>
      <div className="outline-ref-images ppt-manual-images">
        {images.map((image, index) => (
          <figure key={`${image.url.slice(-24)}-${index}`} className="outline-ref-image ppt-manual-image">
            <img src={image.url} alt={image.alt || image.caption || '引用图片'} />
            <button
              type="button"
              className="outline-ref-image-remove"
              aria-label={`删除引用图片 ${index + 1}`}
              title="删除引用图片"
              onClick={() => onChange(images.filter((_, itemIndex) => itemIndex !== index))}
            >
              ×
            </button>
            <input
              className="ppt-manual-image-caption"
              value={image.caption}
              placeholder="请填写图片说明"
              aria-label={`图片说明 ${index + 1}`}
              onChange={(e) => patchImage(index, { caption: e.target.value, alt: e.target.value || '引用图片' })}
            />
            <select
              className="ppt-manual-cite-input ppt-manual-image-cite"
              value={String(image.cites?.[0] ?? '')}
              aria-label={`图片 ${index + 1} 角标`}
              onChange={(e) => patchImage(index, { cites: e.target.value ? [Number(e.target.value)] : [] })}
            >
              <option value="">无参考文献</option>
              {Array.from({ length: referenceCount }, (_, refIndex) => (
                <option key={refIndex} value={String(refIndex + 1)}>
                  {refIndex + 1}
                </option>
              ))}
            </select>
          </figure>
        ))}
        <div
          className="ppt-manual-image-slot"
          role="button"
          tabIndex={0}
          aria-label="添加引用图片：点击选择文件，或右键粘贴图片"
          title="点击选择图片，或右键粘贴"
          contentEditable
          suppressContentEditableWarning
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileRef.current?.click();
              return;
            }
            if (!((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') && e.key !== 'Tab') e.preventDefault();
          }}
          onBeforeInput={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleFiles(e.dataTransfer.files);
          }}
          onPaste={(e) => {
            e.preventDefault();
            e.stopPropagation();
            readPastedImages(e, (url) => onAdd(url));
          }}
        >
          <span className="ppt-manual-image-slot-inner" contentEditable={false}>
            <span className="ppt-manual-image-slot-plus">+</span>
            <span>点击上传或右键粘贴</span>
          </span>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
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
  storylineContent = '',
  onNotify,
}: PptOutlineEditorProps) {
  const isInline = variant === 'inline';
  const [draggingPageKey, setDraggingPageKey] = useState<string | null>(null);
  const [dropPageKey, setDropPageKey] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [pageEdit, setPageEdit] = useState<{
    chId: string;
    pgId: string;
    mode: 'manual' | 'ai';
    snapshot: PptOutlinePage;
  } | null>(null);
  const [draft, setDraft] = useState<ManualDraft | null>(null);
  const [titleAiInstruction, setTitleAiInstruction] = useState('');
  const [coreAiInstruction, setCoreAiInstruction] = useState('');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
  const [notice, setNotice] = useState('');
  const noticeTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    },
    []
  );

  const notify = (text: string) => {
    if (onNotify) {
      onNotify(text);
      return;
    }
    setNotice(text);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(''), 2600);
  };

  const displayOutline = useMemo(
    () => attachStorylinePointsToOutline(outline, storylineContent),
    [outline, storylineContent]
  );

  const flatPages = useMemo(
    () =>
      displayOutline.chapters.flatMap((chapter) =>
        chapter.pages.map((page) => ({ chId: chapter.id, page }))
      ),
    [displayOutline.chapters]
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

  const replacePage = (chId: string, pgId: string, page: PptOutlinePage) => {
    onChange({
      ...outline,
      chapters: outline.chapters.map((ch) =>
        ch.id === chId ? { ...ch, pages: ch.pages.map((pg) => (pg.id === pgId ? page : pg)) } : ch
      ),
    });
  };

  const resetEditUi = () => {
    setTitleAiInstruction('');
    setCoreAiInstruction('');
  };

  const beginPageEdit = (chId: string, page: PptOutlinePage, mode: 'manual' | 'ai') => {
    setPageEdit({ chId, pgId: page.id, mode, snapshot: page });
    setDraft(mode === 'manual' ? draftFromPage(page) : null);
    setCollapsedIds((prev) => {
      if (!prev.has(page.id)) return prev;
      const next = new Set(prev);
      next.delete(page.id);
      return next;
    });
    resetEditUi();
  };

  const stopPageEdit = (restore = false) => {
    if (restore && pageEdit) replacePage(pageEdit.chId, pageEdit.pgId, pageEdit.snapshot);
    setPageEdit(null);
    setDraft(null);
    resetEditUi();
  };

  const commitManualEdit = (page: PptOutlinePage) => {
    if (!pageEdit || !draft) return;
    const references = draft.references.map((item) => item.trim()).filter(Boolean);
    const rows = draft.bullets.filter((row) => row.text.trim());
    const next: PptOutlinePage = {
      ...page,
      title: draft.title.trim() || '未命名页面',
      bullets: rows.map((row) => row.text.trim()),
      bulletCites: rows.map((row) => parseCites(row.cites, references.length)),
      references,
      referencedImages: draft.referencedImages.map((image) => ({
        ...image,
        cites: (image.cites || []).filter((num) => num >= 1 && num <= references.length),
      })),
    };
    const detached =
      !page.storylineDetached && isPageDetachedFromStoryline(pageEdit.snapshot, next, page.storylinePoint);
    if (detached) {
      next.storylineDetached = true;
      next.storylinePoint = undefined;
    }
    replacePage(pageEdit.chId, pageEdit.pgId, next);
    setPageEdit(null);
    setDraft(null);
    resetEditUi();
    if (detached) notify('修改后的内容与原故事线观点不一致，已不再展示对应故事线');
  };

  const applyPageAi = (page: PptOutlinePage) => {
    if (!pageEdit) return;
    const titleNote = titleAiInstruction.trim();
    const coreNote = coreAiInstruction.trim();
    if (!titleNote && !coreNote) return;
    let revised = page;
    const aiUndo = { ...page.aiUndo };
    if (titleNote) {
      aiUndo.title = page.title;
      revised = mockRevisePptPageRegion(revised, 'title', titleNote);
    }
    if (coreNote) {
      aiUndo.core = { bullets: [...(page.bullets || [])], bulletCites: page.bulletCites };
      revised = mockRevisePptPageRegion(revised, 'core', coreNote);
    }
    replacePage(pageEdit.chId, pageEdit.pgId, { ...revised, aiUndo });
    setTitleAiInstruction('');
    setCoreAiInstruction('');
  };

  const undoLastAi = (chId: string, page: PptOutlinePage, region: 'title' | 'core') => {
    const saved = page.aiUndo?.[region];
    if (saved === undefined) return;
    const { [region]: _done, ...restUndo } = page.aiUndo || {};
    const restored: PptOutlinePage =
      region === 'title'
        ? { ...page, title: saved as string }
        : { ...page, ...(saved as NonNullable<NonNullable<PptOutlinePage['aiUndo']>['core']>) };
    replacePage(chId, page.id, { ...restored, aiUndo: restUndo });
    notify(region === 'title' ? '已撤销标题的最近一次AI修改' : '已撤销核心内容的最近一次AI修改');
  };

  const aiUndoButton = (chId: string, page: PptOutlinePage, region: 'title' | 'core') => {
    const available = page.aiUndo?.[region] !== undefined;
    return (
      <button
        type="button"
        className="ppt-page-undo-icon-btn"
        title={available ? '撤销最近一次AI修改' : '暂无可撤销的AI修改'}
        aria-label={region === 'title' ? '撤销标题的AI修改' : '撤销核心内容的AI修改'}
        disabled={!available}
        onClick={() => undoLastAi(chId, page, region)}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 14L4 9l5-5" />
          <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
        </svg>
      </button>
    );
  };

  const updateDraft = (patch: Partial<ManualDraft>) => setDraft((prev) => (prev ? { ...prev, ...patch } : prev));

  const appendDraftImage = (url: string) => {
    setDraft((prev) =>
      prev
        ? { ...prev, referencedImages: [...prev.referencedImages, { url, caption: '', alt: '引用图片', cites: [] }] }
        : prev
    );
  };

  const removeDraftReference = (index: number) => {
    if (!draft) return;
    const removed = index + 1;
    updateDraft({
      references: draft.references.filter((_, itemIndex) => itemIndex !== index),
      bullets: draft.bullets.map((row) => ({ ...row, cites: shiftCiteText(row.cites, removed) })),
      referencedImages: draft.referencedImages.map((image) => ({
        ...image,
        cites: shiftCitesAfterRemoval(image.cites, removed),
      })),
    });
  };

  const handleDraftPaste = (event: React.ClipboardEvent) => {
    if (readPastedImages(event, appendDraftImage)) {
      event.preventDefault();
      notify('已粘贴图片，请填写图片说明并选择参考文献角标');
    }
  };

  const insertPageAfter = (chId: string, pgId: string) => {
    const page = blankOutlinePage();
    const chapters = [...outline.chapters];
    const chIdx = chapters.findIndex((ch) => ch.id === chId);
    if (chIdx < 0) return;
    const chapter = chapters[chIdx];
    let targetChId = chapter.id;
    if (chapter.kind === 'cover' || chapter.kind === 'toc' || chapter.kind === 'back') {
      targetChId = genId('ch');
      const insertAt = chapter.kind === 'back' ? chIdx : chIdx + 1;
      chapters.splice(insertAt, 0, { id: targetChId, title: '', kind: 'section', pages: [page] });
    } else {
      const pgIdx = chapter.pages.findIndex((pg) => pg.id === pgId);
      const pages = [...chapter.pages];
      pages.splice(pgIdx + 1, 0, page);
      chapters[chIdx] = { ...chapter, pages };
    }
    onChange({ ...outline, chapters });
    setPageEdit({ chId: targetChId, pgId: page.id, mode: 'manual', snapshot: page });
    setDraft(draftFromPage(page));
    resetEditUi();
  };

  const toggleCollapsed = (pgId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(pgId)) next.delete(pgId);
      else next.add(pgId);
      return next;
    });
  };

  const collapseAll = () => {
    setCollapsedIds(new Set(flatPages.map(({ page }) => page.id).filter((id) => id !== pageEdit?.pgId)));
  };

  const expandAll = () => setCollapsedIds(new Set());

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
            <span className="ppt-outline-toolbar-spacer" />
            <button type="button" className="btn soft ppt-outline-fold-btn" onClick={expandAll}>
              全部展开
            </button>
            <button type="button" className="btn soft ppt-outline-fold-btn" onClick={collapseAll}>
              全部折叠
            </button>
          </div>
        )}
        {notice ? (
          <div className="ppt-outline-notice" role="status">
            {notice}
          </div>
        ) : null}

        <div className="ppt-outline-body">
          <div className="ppt-pages ppt-pages-flat">
            {flatPages.map(({ chId, page: pg }, index) => {
              const pageKey = `${chId}:${pg.id}`;
              const isEditing = pageEdit?.chId === chId && pageEdit.pgId === pg.id;
              const isManual = isEditing && pageEdit?.mode === 'manual' && Boolean(draft);
              const isAi = isEditing && pageEdit?.mode === 'ai';
              const collapsed = !isEditing && collapsedIds.has(pg.id);
              const canInsertAfter = pg.kind !== 'back';
              const canApplyAi = Boolean(titleAiInstruction.trim() || coreAiInstruction.trim());
              return (
                <div key={pg.id} className="ppt-page-slot">
                  <div
                    className={`ppt-page-card ${draggingPageKey === pageKey ? 'is-dragging' : ''} ${dropPageKey === pageKey ? 'is-drop-target' : ''} ${isEditing ? 'is-editing' : ''} ${collapsed ? 'is-collapsed' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDropPageKey(pageKey);
                    }}
                    onDragLeave={() => setDropPageKey((key) => (key === pageKey ? null : key))}
                    onDrop={(e) => handlePageDrop(chId, pg.id, e)}
                    onPaste={isManual ? handleDraftPaste : undefined}
                  >
                    <div className="ppt-page-num">{index + 1}</div>
                    <div className="ppt-page-body">
                      {pg.storylinePoint ? (
                        <div className="ppt-page-storyline-point" title="对应故事线（只读）">
                          对应故事线：{pg.storylinePoint}
                        </div>
                      ) : null}
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
                        <button
                          type="button"
                          className={`ppt-page-collapse-btn ${collapsed ? 'is-collapsed' : ''}`}
                          aria-label={collapsed ? '展开本页' : '折叠本页'}
                          title={collapsed ? '展开本页' : '折叠本页'}
                          aria-expanded={!collapsed}
                          disabled={isEditing}
                          onClick={() => toggleCollapsed(pg.id)}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </button>
                        {isManual && draft ? (
                          <input
                            className="ppt-manual-title-input"
                            value={draft.title}
                            placeholder="请输入页面标题"
                            aria-label="页面标题"
                            onChange={(e) => updateDraft({ title: e.target.value })}
                          />
                        ) : (
                          <div className={`ppt-page-title-text ${isAi ? 'is-ai-active' : ''}`}>{pg.title || '未命名页面'}</div>
                        )}
                        {pageKindLabel(pg.kind) && (
                          <span className={`ppt-page-kind-badge is-${pg.kind}`}>{pageKindLabel(pg.kind)}</span>
                        )}
                        {!isEditing && !collapsed && !reviewerMode ? (
                          <>
                            <button type="button" className="ppt-page-manual-btn" onClick={() => beginPageEdit(chId, pg, 'manual')}>
                              人工编辑
                            </button>
                            <button type="button" className="ppt-page-edit-btn" onClick={() => beginPageEdit(chId, pg, 'ai')}>
                              AI编辑
                            </button>
                          </>
                        ) : null}
                        {flatPages.length > 1 && !isEditing && (
                          <DeleteButton title="删除页面" onClick={() => removePage(chId, pg.id)} />
                        )}
                      </div>
                      {collapsed ? null : (
                        <>
                          {isAi ? (
                            <div className="outline-ai-prompt">
                              <textarea
                                className="outline-ai-prompt-input"
                                value={titleAiInstruction}
                                placeholder="例如：标题更短，突出早期干预"
                                aria-label="标题修改要求"
                                rows={3}
                                onChange={(event) => setTitleAiInstruction(event.target.value)}
                              />
                            </div>
                          ) : null}
                          {isManual && draft ? (
                            <div className="ppt-manual-form">
                              <div className="ppt-page-field">
                                <div className="ppt-page-field-head">
                                  <span>页面核心内容</span>
                                  <em className="ppt-manual-hint">角标选择对应的参考文献序号</em>
                                </div>
                                <div className="ppt-manual-rows">
                                  {draft.bullets.map((row, rowIndex) => (
                                    <div key={rowIndex} className="ppt-manual-row">
                                      <textarea
                                        className="ppt-manual-input"
                                        rows={2}
                                        value={row.text}
                                        placeholder="请输入核心内容"
                                        aria-label={`核心内容 ${rowIndex + 1}`}
                                        onChange={(e) =>
                                          updateDraft({
                                            bullets: draft.bullets.map((item, itemIndex) =>
                                              itemIndex === rowIndex ? { ...item, text: e.target.value } : item
                                            ),
                                          })
                                        }
                                      />
                                      <select
                                        className="ppt-manual-cite-input"
                                        value={row.cites}
                                        aria-label={`核心内容 ${rowIndex + 1} 角标`}
                                        onChange={(e) =>
                                          updateDraft({
                                            bullets: draft.bullets.map((item, itemIndex) =>
                                              itemIndex === rowIndex ? { ...item, cites: e.target.value } : item
                                            ),
                                          })
                                        }
                                      >
                                        <option value="">无参考文献</option>
                                        {draft.references.map((_, refIndex) => (
                                          <option key={refIndex} value={String(refIndex + 1)}>
                                            {refIndex + 1}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        type="button"
                                        className="ppt-manual-remove-btn"
                                        aria-label={`删除核心内容 ${rowIndex + 1}`}
                                        onClick={() =>
                                          updateDraft({ bullets: draft.bullets.filter((_, itemIndex) => itemIndex !== rowIndex) })
                                        }
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    className="ppt-manual-add-btn"
                                    onClick={() => updateDraft({ bullets: [...draft.bullets, { text: '', cites: '' }] })}
                                  >
                                    + 添加核心内容
                                  </button>
                                </div>
                              </div>
                              <ManualImageGrid
                                images={draft.referencedImages}
                                referenceCount={draft.references.length}
                                onChange={(referencedImages) => updateDraft({ referencedImages })}
                                onAdd={appendDraftImage}
                              />
                              <div className="ppt-page-field">
                                <div className="ppt-page-field-head">
                                  <span>参考文献</span>
                                  <em className="ppt-manual-hint">删除文献后角标自动重排，无需重新循证</em>
                                </div>
                                <div className="ppt-manual-rows">
                                  {draft.references.map((ref, refIndex) => (
                                    <div key={refIndex} className="ppt-manual-row">
                                      <span className="ppt-manual-ref-num">[{refIndex + 1}]</span>
                                      <input
                                        className="ppt-manual-input"
                                        value={ref}
                                        placeholder="请输入参考文献"
                                        aria-label={`参考文献 ${refIndex + 1}`}
                                        onChange={(e) =>
                                          updateDraft({
                                            references: draft.references.map((item, itemIndex) =>
                                              itemIndex === refIndex ? e.target.value : item
                                            ),
                                          })
                                        }
                                      />
                                      <button
                                        type="button"
                                        className="ppt-manual-remove-btn"
                                        aria-label={`删除参考文献 ${refIndex + 1}`}
                                        onClick={() => removeDraftReference(refIndex)}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    className="ppt-manual-add-btn"
                                    onClick={() => updateDraft({ references: [...draft.references, ''] })}
                                  >
                                    + 添加参考文献
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <OutlineStaticList
                                label="页面核心内容"
                                items={pg.bullets}
                                empty="暂无核心内容"
                                itemCites={pg.bulletCites}
                                numbered={false}
                                aiActive={isAi}
                              />
                              {isAi ? (
                                <div className="outline-ai-prompt">
                                  <textarea
                                    className="outline-ai-prompt-input"
                                    value={coreAiInstruction}
                                    placeholder="例如：把第三条改成强调随访依从性"
                                    aria-label="页面核心内容修改要求"
                                    rows={3}
                                    onChange={(event) => setCoreAiInstruction(event.target.value)}
                                  />
                                  <div className="outline-ai-shared-actions">
                                    {aiUndoButton(chId, pg, 'title')}
                                    {aiUndoButton(chId, pg, 'core')}
                                    <button
                                      type="button"
                                      className="btn primary"
                                      disabled={!canApplyAi}
                                      onClick={() => applyPageAi(pg)}
                                    >
                                      按此修改
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                              {isAi ? null : (
                                <>
                                  <OutlineReferencedImages images={pg.referencedImages} />
                                  <OutlineStaticList label="参考文献" items={pg.references} empty="暂无参考文献" />
                                </>
                              )}
                            </>
                          )}
                          <div className="ppt-page-field ppt-page-visual-req">
                            <div className="ppt-page-field-head">
                              <span>页面视觉要求</span>
                              <em className="ppt-manual-hint">选填</em>
                            </div>
                            <textarea
                              className="ppt-visual-req-input"
                              rows={2}
                              value={pg.visualRequirement || ''}
                              readOnly={reviewerMode}
                              placeholder="可在此输入针对本页的样式、图表类型等要求，例如：左右分栏，右侧用柱状图对比两组数据"
                              aria-label="页面视觉要求"
                              onChange={(e) => updatePage(chId, pg.id, { visualRequirement: e.target.value })}
                            />
                          </div>
                          {isEditing ? (
                            <div className="ppt-page-edit-actions">
                              <span className="ppt-manual-hint">
                                {isManual ? '人工编辑：可直接修改标题、核心内容、角标与参考文献' : 'AI编辑：在标题和页面核心内容下方填写修改要求，两个输入框共用「按此修改」'}
                              </span>
                              <div className="ppt-page-edit-actions-end">
                                <button
                                  type="button"
                                  className="btn primary ppt-page-confirm-btn"
                                  onClick={() => (isManual ? commitManualEdit(pg) : stopPageEdit(false))}
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
                        </>
                      )}
                    </div>
                  </div>
                  {canInsertAfter && !reviewerMode ? (
                    <div className="ppt-page-insert">
                      <button
                        type="button"
                        className="ppt-page-insert-btn"
                        title="在此处新增页面"
                        aria-label={`在第 ${index + 1} 页后新增页面`}
                        onClick={() => insertPageAfter(chId, pg.id)}
                      >
                        +
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
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
