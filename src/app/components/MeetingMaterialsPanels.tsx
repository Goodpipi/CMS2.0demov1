import { useRef, useState } from 'react';
import { ChevronDown, Eraser, Paintbrush, Plus } from 'lucide-react';
import type { PptSlide } from '@/types/content';
import {
  SelectableSvgPreview,
  type SelectableSvgPreviewHandle,
  type SelectableSvgSelection,
  type SelectableSvgToolState,
} from '@/app/components/SelectableSvgPreview';
import {
  ImagePreviewZoomControls,
  ImagePreviewZoomViewport,
  useImagePreviewZoom,
} from '@/app/components/ImagePreviewZoom';
import { parseSvgFromDataUrl } from '@/app/components/svgEditorUtils';
import { slideToPreviewUrl } from '@/app/components/pptUtils';
import { downloadDataUrl } from '@/lib/copyRevisionUtils';
import {
  exportImageAsPsd,
  exportLongImageAsPng,
  exportLongImageAsPptx,
} from '@/app/components/longImageUtils';
import {
  MEETING_KV_CAPTION,
  MEETING_PPT_TEMPLATE_SLIDES,
  downloadConferenceInfoTemplate,
  type MeetingSession,
  type MeetingSessionInfo,
  type MeetingSessionTab,
  type MeetingTaskProposal,
  type MeetingTemplateTab,
} from '@/lib/meetingMaterialsMocks';

function MeetingFolderTabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="meeting-folder-tabs" role="tablist">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          className={`meeting-folder-tab ${value === item.id ? 'active' : ''}`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function MeetingPosterCanvas({
  title,
  subtitle,
  imageUrl,
  onEdit,
  onImport,
  onReuploadInfo,
  onRegenerateLatest,
  onToast,
  workspaceElementId,
  onWorkspaceElementSelect,
}: {
  title: string;
  subtitle?: string;
  imageUrl: string;
  onEdit: () => void;
  onImport?: () => void;
  onReuploadInfo?: () => void;
  onRegenerateLatest?: () => void;
  onToast?: (text: string) => void;
  workspaceElementId?: string | null;
  onWorkspaceElementSelect?: (selection: SelectableSvgSelection | null, slideIndex: number) => void;
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const zoom = useImagePreviewZoom(imageUrl.length);

  const exportPng = () => {
    setExportOpen(false);
    void exportLongImageAsPng(imageUrl, title)
      .then(() => onToast?.('已导出图片'))
      .catch(() => onToast?.('导出图片失败'));
  };

  return (
    <div className="meeting-poster-workspace">
      <div className="image-preview-stage is-long-image meeting-poster-stage">
        <div className="creator-ppt-toolbar long-image-toolbar">
          <div className="creator-ppt-toolbar-page">
            <strong>{title}</strong>
            {subtitle ? <span>{subtitle}</span> : null}
          </div>
          <div className="creator-ppt-toolbar-tools" role="toolbar" aria-label="画布操作">
            <ImagePreviewZoomControls
              scale={zoom.scale}
              onZoomIn={zoom.zoomIn}
              onZoomOut={zoom.zoomOut}
              onReset={zoom.reset}
              canZoomIn={zoom.canZoomIn}
              canZoomOut={zoom.canZoomOut}
            />
            <button type="button" className="creator-ppt-tool primary" onClick={onEdit}>
              手动编辑
            </button>
            {onRegenerateLatest ? (
              <button type="button" className="creator-ppt-tool" onClick={onRegenerateLatest}>
                根据最新模板重新生成
              </button>
            ) : null}
          </div>
        </div>
        <div className="long-image-canvas">
          <ImagePreviewZoomViewport
            scale={zoom.scale}
            offset={zoom.offset}
            onOffsetChange={zoom.setOffset}
          >
            <SelectableSvgPreview
              key={imageUrl.length}
              svgMarkup={parseSvgFromDataUrl(imageUrl)}
              imageSrc={imageUrl}
              selectedId={workspaceElementId ?? null}
              hideToolbar
              onSelect={(selection) => onWorkspaceElementSelect?.(selection, 0)}
            />
          </ImagePreviewZoomViewport>
        </div>
      </div>
      <div className="image-preview-submit-actions">
        {onReuploadInfo ? (
          <button type="button" className="btn soft" onClick={onReuploadInfo}>
            重新上传会议信息
          </button>
        ) : null}
        {onImport ? (
          <button type="button" className="btn soft" onClick={onImport}>
            导入本地版本
          </button>
        ) : null}
        <div className="image-download-control">
          <button
            type="button"
            className="btn soft"
            aria-expanded={exportOpen}
            aria-haspopup="menu"
            onClick={() => setExportOpen((open) => !open)}
          >
            导出
            <ChevronDown className={`h-3.5 w-3.5 transition ${exportOpen ? 'rotate-180' : ''}`} />
          </button>
          {exportOpen ? (
            <div className="image-download-menu" role="menu" aria-label="选择导出格式">
              <button type="button" role="menuitem" className="image-download-option" onClick={exportPng}>
                <span>导出为图片</span>
                <small>PNG，适合预览与分享</small>
              </button>
              <button
                type="button"
                role="menuitem"
                className="image-download-option"
                onClick={() => {
                  setExportOpen(false);
                  void exportLongImageAsPptx(imageUrl, title)
                    .then(() => onToast?.('已导出 PPTX'))
                    .catch(() => onToast?.('导出 PPTX 失败'));
                }}
              >
                <span>导出为 PPTX</span>
                <small>可在 PowerPoint 中继续编辑</small>
              </button>
              <button
                type="button"
                role="menuitem"
                className="image-download-option"
                onClick={() => {
                  setExportOpen(false);
                  void exportImageAsPsd(imageUrl, title)
                    .then(() => onToast?.('已导出 PSD'))
                    .catch(() => onToast?.('导出 PSD 失败'));
                }}
              >
                <span>导出为 PSD</span>
                <small>可在 Photoshop 中打开</small>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MeetingPptCanvas({
  title,
  slides,
  onEditSlide,
  onImport,
  onReuploadInfo,
  onRegenerateLatest,
  onToast,
  workspaceElementId,
  onWorkspaceElementSelect,
}: {
  title: string;
  slides: PptSlide[];
  onEditSlide: (index: number) => void;
  onImport?: () => void;
  onReuploadInfo?: () => void;
  onRegenerateLatest?: () => void;
  onToast?: (text: string) => void;
  workspaceElementId?: string | null;
  onWorkspaceElementSelect?: (selection: SelectableSvgSelection | null, slideIndex: number) => void;
}) {
  const [pptIndex, setPptIndex] = useState(0);
  const slide = slides[pptIndex] || slides[0];
  if (!slide) return null;

  const exportAll = () => {
    slides.forEach((item, index) => {
      const pageNo = item.page || index + 1;
      const slideTitle = (item.title || '').replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
      window.setTimeout(() => {
        downloadDataUrl(
          slideToPreviewUrl(item),
          `${title}-第${pageNo}页${slideTitle ? `-${slideTitle}` : ''}.png`
        );
      }, index * 200);
    });
    onToast?.(`正在导出 ${slides.length} 页 PPT`);
  };

  return (
    <div className="ppt-design-fit-panel meeting-ppt-fit">
      <div className="creator-ppt-preview-card">
        <div className="creator-ppt-toolbar">
          <div className="creator-ppt-toolbar-page">
            <strong>第 {slide.page ?? pptIndex + 1} 页</strong>
            <span>{slide.title}</span>
          </div>
          <div className="creator-ppt-toolbar-tools" role="toolbar" aria-label="页面操作">
            <button type="button" className="creator-ppt-tool primary" onClick={() => onEditSlide(pptIndex)}>
              手动编辑
            </button>
            {onRegenerateLatest ? (
              <button type="button" className="creator-ppt-tool" onClick={onRegenerateLatest}>
                根据最新模板重新生成
              </button>
            ) : null}
          </div>
        </div>
        <div className="creator-ppt-workspace">
          <div className="creator-ppt-thumbnails" aria-label="页面缩略图">
            {slides.map((item, index) => (
              <button
                key={`meeting-ppt-thumb-${index}`}
                type="button"
                className={pptIndex === index ? 'active' : ''}
                onClick={() => setPptIndex(index)}
              >
                <span className="creator-ppt-thumbnail-page">{item.page ?? index + 1}</span>
                <img src={slideToPreviewUrl(item)} alt={`第 ${item.page ?? index + 1} 页`} draggable={false} />
              </button>
            ))}
          </div>
          <div className="creator-ppt-stage meeting-ppt-stage">
            <div className="creator-ppt-slide-canvas">
              <SelectableSvgPreview
                key={`${slide.page}-${pptIndex}-${(slide.svg || slide.imageUrl || '').length}`}
                svgMarkup={slide.svg}
                imageSrc={slideToPreviewUrl(slide)}
                selectedId={workspaceElementId ?? null}
                hideToolbar
                showImageMagicWand
                onSelect={(selection) => onWorkspaceElementSelect?.(selection, pptIndex)}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="content-submit-actions">
        {onReuploadInfo ? (
          <button type="button" className="btn soft" onClick={onReuploadInfo}>
            重新上传会议信息
          </button>
        ) : null}
        {onImport ? (
          <button type="button" className="btn soft" onClick={onImport}>
            导入本地版本
          </button>
        ) : null}
        <button type="button" className="btn soft" onClick={exportAll}>
          一键导出全部页面
        </button>
      </div>
    </div>
  );
}

export function MeetingWelcomePanel({
  onOpenVisualReference,
  onOpenTaskProposal,
}: {
  onOpenVisualReference: () => void;
  onOpenTaskProposal: () => void;
}) {
  return (
    <div className="detail-card content-flow-task-card meeting-welcome-card">
      <h4>会议物料任务已创建</h4>
      <ol className="content-flow-start-steps">
        <li className="content-flow-start-step">
          <span className="content-flow-start-index" aria-hidden>
            1
          </span>
          <div className="content-flow-start-body">
            <p>您可以上传视觉参考素材，用于后续生成物料风格、配色和视觉元素的参考。</p>
            <div className="content-flow-start-actions">
              <button type="button" className="btn primary" onClick={onOpenVisualReference}>
                上传视觉参考
              </button>
            </div>
          </div>
        </li>
        <li className="content-flow-start-step">
          <span className="content-flow-start-index" aria-hidden>
            2
          </span>
          <div className="content-flow-start-body">
            <p>您可以填写任务提案，开始会议物料的制作。</p>
            <div className="content-flow-start-actions">
              <button type="button" className="btn primary" onClick={onOpenTaskProposal}>
                填写任务提案
              </button>
            </div>
          </div>
        </li>
      </ol>
    </div>
  );
}

export function MeetingTaskProposalPanel({
  proposal,
  onChange,
  onGenerateKv,
}: {
  proposal: MeetingTaskProposal;
  onChange: (proposal: MeetingTaskProposal) => void;
  onGenerateKv: () => void;
}) {
  const update = (field: keyof MeetingTaskProposal, value: string) => {
    onChange({ ...proposal, [field]: value });
  };

  return (
    <div className="workspace-surface-panel content-brief-panel meeting-task-proposal-panel">
      <div className="topic-insight-title-row">
        <h1>任务提案</h1>
        <button type="button" className="btn primary topic-insight-copy-btn" onClick={onGenerateKv}>
          生成主KV
        </button>
      </div>
      <div className="content-brief-fields">
        <label className="content-brief-field is-wide">
          <span>主题</span>
          <input
            className="input"
            value={proposal.theme}
            placeholder="请输入主题"
            onChange={(event) => update('theme', event.target.value)}
          />
        </label>
        <label className="content-brief-field">
          <span>配色</span>
          <input
            className="input"
            value={proposal.colorPalette}
            placeholder="请输入配色"
            onChange={(event) => update('colorPalette', event.target.value)}
          />
        </label>
        <label className="content-brief-field">
          <span>风格</span>
          <input
            className="input"
            value={proposal.style}
            placeholder="请输入风格"
            onChange={(event) => update('style', event.target.value)}
          />
        </label>
        <label className="content-brief-field is-wide">
          <span>主视觉元素</span>
          <textarea
            className="input content-brief-textarea"
            value={proposal.mainVisualElements}
            rows={2}
            placeholder="请输入主视觉元素"
            onChange={(event) => update('mainVisualElements', event.target.value)}
          />
        </label>
        <label className="content-brief-field is-wide">
          <span>其他</span>
          <textarea
            className="input content-brief-textarea"
            value={proposal.other}
            rows={2}
            placeholder="请输入其他要求"
            onChange={(event) => update('other', event.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

interface MeetingKvPanelProps {
  imageUrl: string;
  onDownload: () => void;
  onGenerateTemplates: () => void;
}

export function MeetingKvPanel({ imageUrl, onDownload, onGenerateTemplates }: MeetingKvPanelProps) {
  const previewRef = useRef<SelectableSvgPreviewHandle>(null);
  const [toolState, setToolState] = useState<SelectableSvgToolState>({
    brushActive: false,
    eraserActive: false,
    canClear: false,
  });

  return (
    <div className="workspace-surface-panel meeting-surface-panel">
      <div className="topic-insight-title-row">
        <h1>主KV</h1>
        <button type="button" className="btn primary" onClick={onGenerateTemplates}>
          生成会议模板
        </button>
      </div>
      <p className="small meeting-surface-hint">{MEETING_KV_CAPTION}</p>
      <div className="meeting-kv-stage">
        <div className="meeting-preview-frame">
          <div className="meeting-kv-tools" role="toolbar" aria-label="主KV圈选工具">
            <button
              type="button"
              className={`btn image-draw-tool ${toolState.brushActive ? 'primary active' : 'soft'}`}
              onClick={() => previewRef.current?.setBrushActive(!toolState.brushActive)}
            >
              <Paintbrush className="h-3.5 w-3.5" />
              画笔圈选
            </button>
            <button
              type="button"
              className={`btn image-draw-tool ${toolState.eraserActive ? 'primary active' : 'soft'}`}
              onClick={() => previewRef.current?.setEraserActive(!toolState.eraserActive)}
            >
              <Eraser className="h-3.5 w-3.5" />
              橡皮擦
            </button>
            <button
              type="button"
              className="btn soft image-draw-tool"
              onClick={() => previewRef.current?.cancelTools()}
            >
              取消
            </button>
          </div>
          <SelectableSvgPreview
            ref={previewRef}
            svgMarkup={parseSvgFromDataUrl(imageUrl)}
            imageSrc={imageUrl}
            selectedId={null}
            disableSelect
            hideToolbar
            onSelect={() => undefined}
            onToolStateChange={setToolState}
          />
        </div>
      </div>
      <div className="meeting-action-row">
        <button type="button" className="btn soft" onClick={onDownload}>
          下载主KV
        </button>
      </div>
    </div>
  );
}

interface MeetingTemplatesPanelProps {
  posterUrl: string;
  pptSlides?: PptSlide[];
  tab: MeetingTemplateTab;
  onTabChange: (tab: MeetingTemplateTab) => void;
  onAddSession: () => void;
  outdatedPosterCount?: number;
  outdatedPptCount?: number;
  onRefreshSessionMaterials?: () => void;
  onEditPoster: () => void;
  onImportPoster?: () => void;
  onEditPpt: (index: number) => void;
  onImportPpt?: () => void;
  onToast?: (text: string) => void;
  workspaceElementId?: string | null;
  onWorkspaceElementSelect?: (selection: SelectableSvgSelection | null, slideIndex: number) => void;
}

export function MeetingTemplatesPanel({
  posterUrl,
  pptSlides = MEETING_PPT_TEMPLATE_SLIDES,
  tab,
  onTabChange,
  onAddSession,
  outdatedPosterCount = 0,
  outdatedPptCount = 0,
  onRefreshSessionMaterials,
  onEditPoster,
  onImportPoster,
  onEditPpt,
  onImportPpt,
  onToast,
  workspaceElementId,
  onWorkspaceElementSelect,
}: MeetingTemplatesPanelProps) {
  return (
    <div className="workspace-surface-panel meeting-surface-panel">
      <div className="topic-insight-title-row">
        <h1>会议模板</h1>
        <button type="button" className="btn primary" onClick={onAddSession}>
          上传会议信息
        </button>
      </div>
      {outdatedPosterCount > 0 || outdatedPptCount > 0 ? (
        <div className="meeting-update-notice">
          <strong>会议模板已更新</strong>
          <button type="button" className="btn primary" onClick={onRefreshSessionMaterials}>
            去更新
          </button>
        </div>
      ) : null}
      <div className="meeting-folder-chrome">
        <MeetingFolderTabs
          items={[
            { id: 'poster', label: '海报模板' },
            { id: 'ppt', label: '串场PPT模板' },
          ]}
          value={tab}
          onChange={onTabChange}
        />
        <div className="meeting-folder-body">
          {tab === 'poster' ? (
            <MeetingPosterCanvas
              title="海报模板"
              subtitle="系列会议主视觉"
              imageUrl={posterUrl}
              onEdit={onEditPoster}
              onImport={onImportPoster}
              onToast={onToast}
              workspaceElementId={workspaceElementId}
              onWorkspaceElementSelect={onWorkspaceElementSelect}
            />
          ) : (
            <MeetingPptCanvas
              title="串场PPT模板"
              slides={pptSlides}
              onEditSlide={onEditPpt}
              onImport={onImportPpt}
              onToast={onToast}
              workspaceElementId={workspaceElementId}
              onWorkspaceElementSelect={onWorkspaceElementSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface MeetingInfoFormProps {
  value: MeetingSessionInfo;
  onChange: (next: MeetingSessionInfo) => void;
  onSave: () => void;
  onCancel: () => void;
}

function MeetingInfoForm({ value, onChange, onSave, onCancel }: MeetingInfoFormProps) {
  return (
    <div className="meeting-info-form">
      <label className="meeting-session-field">
        <span>会议名称</span>
        <input className="input" value={value.title} onChange={(event) => onChange({ ...value, title: event.target.value })} />
      </label>
      <label className="meeting-session-field">
        <span>时间</span>
        <input className="input" value={value.date} onChange={(event) => onChange({ ...value, date: event.target.value })} />
      </label>
      <label className="meeting-session-field">
        <span>地点</span>
        <input className="input" value={value.venue} onChange={(event) => onChange({ ...value, venue: event.target.value })} />
      </label>
      <label className="meeting-session-field">
        <span>专家</span>
        <textarea
          className="input"
          rows={3}
          value={value.speakers.map((item) => `${item.name}｜${item.org}`).join('\n')}
          onChange={(event) =>
            onChange({
              ...value,
              speakers: event.target.value
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => {
                  const [name, org] = line.split('｜');
                  return { name: (name || '').trim(), org: (org || '').trim() };
                }),
            })
          }
        />
      </label>
      <label className="meeting-session-field">
        <span>议程</span>
        <textarea
          className="input"
          rows={4}
          value={value.agenda.join('\n')}
          onChange={(event) =>
            onChange({
              ...value,
              agenda: event.target.value
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean),
            })
          }
        />
      </label>
      <div className="meeting-action-row">
        <button type="button" className="btn primary" onClick={onSave}>
          保存
        </button>
        <button type="button" className="btn soft" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  );
}

function MeetingInfoPreview({ info }: { info: MeetingSessionInfo }) {
  return (
    <div className="meeting-info-preview">
      <p>
        <strong>会议名称</strong>
        {info.title}
      </p>
      <p>
        <strong>时间</strong>
        {info.date}
      </p>
      <p>
        <strong>地点</strong>
        {info.venue}
      </p>
      <p>
        <strong>专家</strong>
        {info.speakers.map((item) => `${item.name}（${item.org}）`).join('、')}
      </p>
      <p>
        <strong>议程</strong>
        {info.agenda.join('、')}
      </p>
    </div>
  );
}

interface MeetingSessionsPanelProps {
  sessions: MeetingSession[];
  currentSessionId: string | null;
  showAllSessions: boolean;
  tab: MeetingSessionTab;
  infoFormOpen: boolean;
  infoDraft: MeetingSessionInfo | null;
  onSelectSession: (id: string) => void;
  onAddSession: () => void;
  onShowAllSessions: () => void;
  onTabChange: (tab: MeetingSessionTab) => void;
  onUploadInfo: () => void;
  onEditInfo: () => void;
  onInfoDraftChange: (next: MeetingSessionInfo) => void;
  onSaveInfo: () => void;
  onCancelInfo: () => void;
  onGeneratePoster: () => void;
  onGeneratePpt: () => void;
  onRegeneratePoster: () => void;
  onRegeneratePpt: () => void;
  onEditPoster: () => void;
  onImportPoster?: () => void;
  onEditPpt: (index: number) => void;
  onImportPpt?: () => void;
  onToast?: (text: string) => void;
  workspaceElementId?: string | null;
  onWorkspaceElementSelect?: (selection: SelectableSvgSelection | null, slideIndex: number) => void;
}

export function MeetingSessionsPanel({
  sessions,
  currentSessionId,
  showAllSessions,
  tab,
  infoFormOpen,
  infoDraft,
  onSelectSession,
  onAddSession,
  onShowAllSessions,
  onTabChange,
  onUploadInfo,
  onEditInfo,
  onInfoDraftChange,
  onSaveInfo,
  onCancelInfo,
  onGeneratePoster,
  onGeneratePpt,
  onRegeneratePoster,
  onRegeneratePpt,
  onEditPoster,
  onImportPoster,
  onEditPpt,
  onImportPpt,
  onToast,
  workspaceElementId,
  onWorkspaceElementSelect,
}: MeetingSessionsPanelProps) {
  const current = sessions.find((item) => item.id === currentSessionId) || sessions[0];
  const uploadRef = useRef<HTMLInputElement>(null);

  if (showAllSessions || !current) {
    return (
      <div className="workspace-surface-panel meeting-surface-panel meeting-session-list-panel">
        <div className="meeting-session-list-head">
          <h2 className="meeting-section-title">会议场次</h2>
        </div>
        <div className="meeting-session-grid">
          {sessions.map((session) => {
            const pendingUpdate = Boolean(
              session.posterUpdateReasons?.length || session.pptUpdateReasons?.length
            );
            return (
              <button
                type="button"
                className="meeting-session-tile"
                key={session.id}
                onClick={() => onSelectSession(session.id)}
              >
                <strong>{session.name}</strong>
                {pendingUpdate ? <em className="meeting-session-pending">待更新</em> : null}
              </button>
            );
          })}
          <button type="button" className="meeting-session-tile is-add" onClick={onAddSession}>
            <span className="meeting-session-add-icon" aria-hidden>
              <Plus className="h-4 w-4" strokeWidth={2.4} />
            </span>
            <strong>新增场次</strong>
          </button>
        </div>
      </div>
    );
  }

  const hasInfo = Boolean(current.info);
  const folderItems: { id: MeetingSessionTab; label: string }[] = hasInfo
    ? [
        {
          id: 'poster',
          label: current.posterUpdateReasons?.length ? '会议海报（待更新）' : '会议海报',
        },
        {
          id: 'ppt',
          label: current.pptUpdateReasons?.length ? '串场PPT（待更新）' : '串场PPT',
        },
      ]
    : [{ id: 'info', label: '会议信息' }];
  const activeTab = folderItems.some((item) => item.id === tab) ? tab : folderItems[0].id;

  return (
    <div className="workspace-surface-panel meeting-surface-panel">
      <div className="meeting-session-toolbar">
        <div className="meeting-session-current">
          <span>当前场次</span>
          <strong>{current.name}</strong>
        </div>
        <div className="meeting-session-toolbar-actions">
          <button type="button" className="btn primary" onClick={onShowAllSessions}>
            返回全部场次列表
          </button>
        </div>
      </div>
      <div className="meeting-folder-chrome">
        <MeetingFolderTabs items={folderItems} value={activeTab} onChange={onTabChange} />
        <div className="meeting-folder-body">
          {activeTab === 'info' && (
            <>
              <div className="topic-insight-title-row">
                <h2 className="meeting-section-title">{current.name}会议信息</h2>
                {current.info && !infoFormOpen ? (
                  <button type="button" className="btn soft" onClick={onEditInfo}>
                    手动编辑
                  </button>
                ) : null}
              </div>
              {infoFormOpen && infoDraft ? (
                <MeetingInfoForm
                  value={infoDraft}
                  onChange={onInfoDraftChange}
                  onSave={onSaveInfo}
                  onCancel={onCancelInfo}
                />
              ) : current.info ? (
                <>
                  <MeetingInfoPreview info={current.info} />
                  <div className="meeting-action-row">
                    <button type="button" className="btn primary" onClick={onGeneratePoster}>
                      生成会议海报
                    </button>
                    <button type="button" className="btn primary" onClick={onGeneratePpt}>
                      生成串场PPT
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="small meeting-surface-hint">
                    请先下载会议信息模板，填写后上传。上传完成后将自动生成会议海报与串场PPT。
                  </p>
                  <div className="meeting-action-row">
                    <button type="button" className="btn soft" onClick={downloadConferenceInfoTemplate}>
                      下载模板
                    </button>
                    <button type="button" className="btn primary" onClick={() => uploadRef.current?.click()}>
                      上传
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'poster' && current.posterReady && current.posterUrl ? (
            <MeetingPosterCanvas
              title="会议海报"
              subtitle={current.name}
              imageUrl={current.posterUrl}
              onEdit={onEditPoster}
              onImport={onImportPoster}
              onReuploadInfo={() => uploadRef.current?.click()}
              onRegenerateLatest={current.posterUpdateReasons?.length ? onRegeneratePoster : undefined}
              onToast={onToast}
              workspaceElementId={workspaceElementId}
              onWorkspaceElementSelect={onWorkspaceElementSelect}
            />
          ) : null}

          {activeTab === 'poster' && !(current.posterReady && current.posterUrl) ? (
            <div className="meeting-action-row">
              <p className="small meeting-surface-hint">本场会议海报尚未生成。</p>
              <button type="button" className="btn primary" onClick={onGeneratePoster}>
                生成会议海报
              </button>
            </div>
          ) : null}

          {activeTab === 'ppt' && current.pptReady && current.pptSlides?.length ? (
            <MeetingPptCanvas
              title={`${current.name}串场PPT`}
              slides={current.pptSlides}
              onEditSlide={onEditPpt}
              onImport={onImportPpt}
              onReuploadInfo={() => uploadRef.current?.click()}
              onRegenerateLatest={current.pptUpdateReasons?.length ? onRegeneratePpt : undefined}
              onToast={onToast}
              workspaceElementId={workspaceElementId}
              onWorkspaceElementSelect={onWorkspaceElementSelect}
            />
          ) : null}

          {activeTab === 'ppt' && !(current.pptReady && current.pptSlides?.length) ? (
            <div className="meeting-action-row">
              <p className="small meeting-surface-hint">本场串场PPT尚未生成。</p>
              <button type="button" className="btn primary" onClick={onGeneratePpt}>
                生成串场PPT
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <input
        ref={uploadRef}
        type="file"
        hidden
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md"
        onChange={(event) => {
          if (event.currentTarget.files?.[0]) onUploadInfo();
          event.currentTarget.value = '';
        }}
      />
    </div>
  );
}
