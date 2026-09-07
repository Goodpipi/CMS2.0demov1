import { useRef, useState } from 'react';
import { ChevronDown, Eraser, Paintbrush } from 'lucide-react';
import type { PptSlide } from '@/types/content';
import {
  SelectableSvgPreview,
  type SelectableSvgPreviewHandle,
  type SelectableSvgSelection,
  type SelectableSvgToolState,
} from '@/app/components/SelectableSvgPreview';
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
  onToast,
  workspaceElementId,
  onWorkspaceElementSelect,
}: {
  title: string;
  subtitle?: string;
  imageUrl: string;
  onEdit: () => void;
  onImport?: () => void;
  onToast?: (text: string) => void;
  workspaceElementId?: string | null;
  onWorkspaceElementSelect?: (selection: SelectableSvgSelection | null, slideIndex: number) => void;
}) {
  const [exportOpen, setExportOpen] = useState(false);

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
            <button type="button" className="creator-ppt-tool primary" onClick={onEdit}>
              手动编辑
            </button>
          </div>
        </div>
        <div className="long-image-canvas">
          <SelectableSvgPreview
            key={imageUrl.length}
            svgMarkup={parseSvgFromDataUrl(imageUrl)}
            imageSrc={imageUrl}
            selectedId={workspaceElementId ?? null}
            hideToolbar
            onSelect={(selection) => onWorkspaceElementSelect?.(selection, 0)}
          />
        </div>
      </div>
      <div className="image-preview-submit-actions">
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
  onToast,
  workspaceElementId,
  onWorkspaceElementSelect,
}: {
  title: string;
  slides: PptSlide[];
  onEditSlide: (index: number) => void;
  onImport?: () => void;
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
          <div className="creator-ppt-stage">
            <div className="creator-ppt-slide-canvas">
              <SelectableSvgPreview
                key={`${slide.page}-${pptIndex}-${(slide.svg || slide.imageUrl || '').length}`}
                svgMarkup={slide.svg}
                imageSrc={slideToPreviewUrl(slide)}
                selectedId={workspaceElementId ?? null}
                hideToolbar
                onSelect={(selection) => onWorkspaceElementSelect?.(selection, pptIndex)}
              />
            </div>
            <div className="creator-ppt-speaker-notes">
              <div className="creator-ppt-speaker-notes-head">
                <strong>Speaker Notes</strong>
              </div>
              <textarea
                value={slide.speakerNotes || slide.bullets.join('\n')}
                placeholder="在此查看本页演讲备注…"
                readOnly
                rows={4}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="content-submit-actions">
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

export function MeetingWelcomePanel({ onGenerateKv }: { onGenerateKv: () => void }) {
  return (
    <div className="detail-card content-flow-task-card meeting-welcome-card">
      <h4>会议物料任务已创建</h4>
      <p className="small content-flow-task-hint">
        从主KV开始，再生成海报模板和串场PPT模板。模板准备完成后，即可新增会议场次，并为各场次分别生成海报与串场PPT。
      </p>
      <div className="content-flow-start-actions" style={{ marginTop: 12 }}>
        <button type="button" className="btn primary" onClick={onGenerateKv}>
          生成主KV
        </button>
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
          新增场次
        </button>
      </div>
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
  tab: MeetingSessionTab;
  infoFormOpen: boolean;
  infoDraft: MeetingSessionInfo | null;
  onSelectSession: (id: string) => void;
  onAddSession: () => void;
  onTabChange: (tab: MeetingSessionTab) => void;
  onUploadInfo: () => void;
  onEditInfo: () => void;
  onInfoDraftChange: (next: MeetingSessionInfo) => void;
  onSaveInfo: () => void;
  onCancelInfo: () => void;
  onGeneratePoster: () => void;
  onGeneratePpt: () => void;
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
  tab,
  infoFormOpen,
  infoDraft,
  onSelectSession,
  onAddSession,
  onTabChange,
  onUploadInfo,
  onEditInfo,
  onInfoDraftChange,
  onSaveInfo,
  onCancelInfo,
  onGeneratePoster,
  onGeneratePpt,
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

  if (!current) {
    return (
      <div className="detail-card">
        <h4>尚未创建场次</h4>
        <p className="small">请先新增一场会议场次。</p>
        <button type="button" className="btn primary" onClick={onAddSession}>
          新增场次
        </button>
      </div>
    );
  }

  const folderItems: { id: MeetingSessionTab; label: string }[] = [
    { id: 'info', label: '会议信息' },
    ...(current.posterReady ? [{ id: 'poster' as const, label: '会议海报' }] : []),
    ...(current.pptReady ? [{ id: 'ppt' as const, label: '串场PPT' }] : []),
  ];
  const activeTab = folderItems.some((item) => item.id === tab) ? tab : 'info';

  return (
    <div className="workspace-surface-panel meeting-surface-panel">
      <div className="meeting-session-toolbar">
        <label className="meeting-session-select">
          <span>当前场次</span>
          <select
            className="input"
            value={current.id}
            onChange={(event) => onSelectSession(event.target.value)}
          >
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name}
              </option>
            ))}
          </select>
        </label>
        <div className="meeting-session-toolbar-actions">
          <button type="button" className="btn primary" onClick={onAddSession}>
            新增场次
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
                    请先下载会议信息模板，填写后上传。上传完成后将在此展示本场会议信息，并可继续生成海报与串场PPT。
                  </p>
                  <div className="meeting-action-row">
                    <button type="button" className="btn soft" onClick={downloadConferenceInfoTemplate}>
                      下载模板
                    </button>
                    <button type="button" className="btn primary" onClick={() => uploadRef.current?.click()}>
                      上传
                    </button>
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
              onToast={onToast}
              workspaceElementId={workspaceElementId}
              onWorkspaceElementSelect={onWorkspaceElementSelect}
            />
          ) : null}

          {activeTab === 'ppt' && current.pptReady && current.pptSlides?.length ? (
            <MeetingPptCanvas
              title={`${current.name}串场PPT`}
              slides={current.pptSlides}
              onEditSlide={onEditPpt}
              onImport={onImportPpt}
              onToast={onToast}
              workspaceElementId={workspaceElementId}
              onWorkspaceElementSelect={onWorkspaceElementSelect}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
