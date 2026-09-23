import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUpRight,
  Check,
  Eraser,
  FileImage,
  FileText,
  Image,
  Images,
  Paintbrush,
  Palette,
  Plus,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import {
  SelectableSvgPreview,
  type SelectableSvgPreviewHandle,
  type SelectableSvgToolState,
} from '@/app/components/SelectableSvgPreview';
import { parseSvgFromDataUrl } from '@/app/components/svgEditorUtils';
import {
  POSTER_PLAN_B_RATIOS,
  POSTER_PLAN_B_STYLES,
  type PosterPlanBState,
} from '@/lib/posterPlanBMocks';

interface PosterPlanBPanelProps<T extends PosterPlanBState> {
  state: T;
  productName: string;
  onChange: (next: T) => void;
  onGenerate: () => void;
  onOpenKv?: () => void;
  onOpenNew: () => void;
  onOpenPoster: (requestId: string) => void;
  workspaceLabel?: string;
  sourceMode?: 'kv' | 'direct';
  structuredBrief?: boolean;
}

type KvBriefWorkflowState = Pick<PosterPlanBState, 'kvBrief'>;
type KvGalleryWorkflowState = Pick<
  PosterPlanBState,
  'kvCandidates' | 'activeKvCandidateId' | 'selectedKvId'
>;

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PosterPlanBKvBriefPanel<T extends KvBriefWorkflowState>({
  state,
  productName,
  onChange,
  onGenerate,
  onUseUploadedKv,
  posterRatio,
  onPosterRatioChange,
  title = '填写任务提案',
  hint = '请输入主KV的需求',
}: {
  state: T;
  productName: string;
  onChange: (next: T) => void;
  onGenerate: () => void;
  onUseUploadedKv: (fileName: string, dataUrl: string) => void;
  posterRatio?: string;
  onPosterRatioChange?: (ratio: string) => void;
  title?: string;
  hint?: string;
}) {
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const kvInputRef = useRef<HTMLInputElement>(null);
  const [styleOpen, setStyleOpen] = useState(false);
  const selectedStyle =
    POSTER_PLAN_B_STYLES.find((item) => item.id === state.kvBrief.styleId) ||
    POSTER_PLAN_B_STYLES[0];
  const canGenerate = Boolean(
    state.kvBrief.requirement.trim() &&
      state.kvBrief.colorPalette &&
      state.kvBrief.count &&
      state.kvBrief.ratio &&
      state.kvBrief.styleId &&
      (!onPosterRatioChange || posterRatio)
  );

  return (
    <div className="workspace-surface-panel poster-kv-brief-panel">
      <header className="poster-kv-brief-head">
        <div>
          <h1>{title}</h1>
          <p>{hint}</p>
          <span>当前产品：{productName}</span>
        </div>
        <button type="button" className="btn primary" disabled={!canGenerate} onClick={onGenerate}>
          <Sparkles className="h-3.5 w-3.5" />
          生成主KV
        </button>
      </header>

      <div className="poster-kv-brief-form">
        <section className="poster-kv-reference-section">
          <div className="poster-kv-field-head">
            <div>
              <strong>视觉参考</strong>
              <span>可选，帮助AI理解构图、质感和视觉语言</span>
            </div>
            <em>{state.kvBrief.visualReferences.length}/10</em>
          </div>
          <div className="poster-kv-reference-list">
            {state.kvBrief.visualReferences.map((reference) => (
              <figure key={reference.id} className="poster-kv-reference-thumb">
                <img src={reference.url} alt={reference.name} />
                <button
                  type="button"
                  aria-label={`移除参考图：${reference.name}`}
                  onClick={() =>
                    onChange({
                      ...state,
                      kvBrief: {
                        ...state.kvBrief,
                        visualReferences: state.kvBrief.visualReferences.filter(
                          (item) => item.id !== reference.id
                        ),
                      },
                    })
                  }
                >
                  <X className="h-3 w-3" />
                </button>
              </figure>
            ))}
            {state.kvBrief.visualReferences.length < 10 ? (
              <button
                type="button"
                className="poster-kv-reference-add"
                onClick={() => referenceInputRef.current?.click()}
              >
                <Images className="h-5 w-5" />
                <span>添加参考图</span>
              </button>
            ) : null}
          </div>
          <input
            ref={referenceInputRef}
            type="file"
            hidden
            multiple
            accept="image/*"
            onChange={(event) => {
              const files = Array.from(event.currentTarget.files || []).slice(
                0,
                10 - state.kvBrief.visualReferences.length
              );
              void Promise.all(
                files.map(async (file, index) => ({
                  id: `kv_ref_${Date.now()}_${index}`,
                  name: file.name,
                  url: await readImage(file),
                }))
              ).then((references) =>
                onChange({
                  ...state,
                  kvBrief: {
                    ...state.kvBrief,
                    visualReferences: [...state.kvBrief.visualReferences, ...references],
                  },
                })
              );
              event.currentTarget.value = '';
            }}
          />
        </section>

        <label className="poster-kv-requirement">
          <span>主KV需求</span>
          <textarea
            className="input"
            rows={5}
            value={state.kvBrief.requirement}
            placeholder="描述主视觉主题、核心画面和希望传达的感受，例如：蓝黑科技感，城市光轨与赛车作为核心元素，画面强调速度与突破。"
            onChange={(event) =>
              onChange({
                ...state,
                kvBrief: { ...state.kvBrief, requirement: event.target.value },
              })
            }
          />
        </label>

        <div className="poster-kv-options">
          <section className="poster-kv-option-block">
            <div className="poster-kv-option-title">
              <Palette className="h-4 w-4" />
              <span>配色</span>
            </div>
            <label className="poster-kv-color-input">
              <input
                className="input"
                value={state.kvBrief.colorPalette}
                placeholder="请输入配色要求，例如：蓝黑为主，搭配高亮电光蓝"
                onChange={(event) =>
                  onChange({
                    ...state,
                    kvBrief: { ...state.kvBrief, colorPalette: event.target.value },
                  })
                }
              />
              <small>请描述主色、辅助色或希望避免使用的颜色。</small>
            </label>
          </section>

          <section className="poster-kv-option-block is-compact">
            <div className="poster-kv-option-title">
              <Image className="h-4 w-4" />
              <span>数量</span>
            </div>
            <div className="poster-kv-count-options">
              {[1, 2, 3, 4].map((count) => (
                <button
                  key={count}
                  type="button"
                  className={state.kvBrief.count === count ? 'active' : ''}
                  aria-pressed={state.kvBrief.count === count}
                  onClick={() =>
                    onChange({ ...state, kvBrief: { ...state.kvBrief, count } })
                  }
                >
                  {count}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className={onPosterRatioChange ? 'poster-kv-ratio-pair' : undefined}>
          <section className="poster-kv-option-block">
            <div className="poster-kv-option-title">
              <span>{onPosterRatioChange ? '主KV比例' : '比例'}</span>
            </div>
            <div className="poster-kv-ratio-options">
              {POSTER_PLAN_B_RATIOS.map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  className={state.kvBrief.ratio === ratio ? 'active' : ''}
                  aria-pressed={state.kvBrief.ratio === ratio}
                  onClick={() =>
                    onChange({ ...state, kvBrief: { ...state.kvBrief, ratio } })
                  }
                >
                  <i className={`ratio-shape ratio-${ratio.replace(':', '-')}`} />
                  {ratio}
                </button>
              ))}
            </div>
          </section>
          {onPosterRatioChange ? (
            <section className="poster-kv-option-block">
              <div className="poster-kv-option-title">
                <span>海报比例</span>
              </div>
              <div className="poster-kv-ratio-options">
                {POSTER_PLAN_B_RATIOS.filter((ratio) => ratio !== '智能').map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    className={posterRatio === ratio ? 'active' : ''}
                    aria-pressed={posterRatio === ratio}
                    onClick={() => onPosterRatioChange(ratio)}
                  >
                    <i className={`ratio-shape ratio-${ratio.replace(':', '-')}`} />
                    {ratio}
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <section className="poster-kv-style-row">
          <div>
            <strong>风格参考</strong>
            <span>从预设风格中选择一套作为视觉起点</span>
          </div>
          <button type="button" className="poster-kv-style-trigger" onClick={() => setStyleOpen(true)}>
            <img src={selectedStyle.imageUrl} alt="" />
            <span>
              <strong>{selectedStyle.name}</strong>
              <small>查看全部预设风格</small>
            </span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </section>

        <section className="poster-kv-upload-own">
          <span className="poster-plan-b-section-icon">
            <FileImage className="h-4 w-4" />
          </span>
          <div>
            <strong>已有主KV？</strong>
            <p>直接上传一张图片作为主KV，可跳过AI方案生成。</p>
          </div>
          <button type="button" className="btn soft" onClick={() => kvInputRef.current?.click()}>
            上传主KV
          </button>
          <input
            ref={kvInputRef}
            type="file"
            hidden
            accept="image/*"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) {
                void readImage(file).then((url) => onUseUploadedKv(file.name, url));
              }
              event.currentTarget.value = '';
            }}
          />
        </section>
      </div>

      {styleOpen
        ? createPortal(
            <div className="modal-bg show" onClick={() => setStyleOpen(false)}>
              <div className="modal poster-kv-style-modal" onClick={(event) => event.stopPropagation()}>
                <header>
                  <div>
                    <h3>选择风格参考</h3>
                    <p>所选风格会影响构图、光影和信息层级。</p>
                  </div>
                  <button type="button" aria-label="关闭风格选择" onClick={() => setStyleOpen(false)}>
                    <X className="h-4 w-4" />
                  </button>
                </header>
                <div className="poster-kv-style-grid">
                  {POSTER_PLAN_B_STYLES.map((style) => {
                    const selected = style.id === state.kvBrief.styleId;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        className={selected ? 'active' : ''}
                        onClick={() => {
                          onChange({
                            ...state,
                            kvBrief: { ...state.kvBrief, styleId: style.id },
                          });
                          setStyleOpen(false);
                        }}
                      >
                        <img src={style.imageUrl} alt="" />
                        <span>{style.name}</span>
                        {selected ? <Check className="h-4 w-4" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

export function PosterPlanBKvGallery({
  state,
  onActivate,
  onConfirm,
  onContinue,
  onEdit,
  continueLabel = '进入海报/图片列表',
  combinedActionLabel,
  onConfirmAndContinue,
}: {
  state: KvGalleryWorkflowState;
  onActivate: (candidateId: string) => void;
  onConfirm: (candidateId: string) => void;
  onContinue: () => void;
  onEdit?: (imageUrl: string) => void;
  continueLabel?: string;
  combinedActionLabel?: string;
  onConfirmAndContinue?: (candidateId: string) => void;
}) {
  const previewRef = useRef<SelectableSvgPreviewHandle>(null);
  const [toolState, setToolState] = useState<SelectableSvgToolState>({
    brushActive: false,
    eraserActive: false,
    canClear: false,
  });
  const active =
    state.kvCandidates.find((candidate) => candidate.id === state.activeKvCandidateId) ||
    state.kvCandidates[0];
  if (!active) return null;
  const confirmed = state.selectedKvId === active.id;

  return (
    <div className="workspace-surface-panel poster-kv-gallery">
      <header>
        <div>
          <h2>选择主KV</h2>
          <p>共生成 {state.kvCandidates.length} 个方案。切换预览后，将满意的方案设置为主KV。</p>
        </div>
        <div className="poster-kv-gallery-actions">
          {combinedActionLabel && onConfirmAndContinue ? (
            <button
              type="button"
              className="btn primary"
              onClick={() => onConfirmAndContinue(active.id)}
            >
              {combinedActionLabel}
            </button>
          ) : (
            <>
              <button
                type="button"
                className={confirmed ? 'btn soft is-confirmed' : 'btn primary'}
                onClick={() => onConfirm(active.id)}
              >
                {confirmed ? <Check className="h-3.5 w-3.5" /> : null}
                {confirmed ? '已设为主KV' : '设为主KV'}
              </button>
              {state.selectedKvId ? (
                <button type="button" className="btn primary" onClick={onContinue}>
                  {continueLabel}
                </button>
              ) : null}
            </>
          )}
        </div>
      </header>

      <div className="poster-kv-gallery-tools" role="toolbar" aria-label="主KV编辑工具">
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
        {onEdit ? (
          <button type="button" className="btn primary" onClick={() => onEdit(active.url)}>
            手动编辑
          </button>
        ) : null}
      </div>

      <div className="poster-kv-gallery-stage">
        <SelectableSvgPreview
          key={active.id}
          ref={previewRef}
          svgMarkup={parseSvgFromDataUrl(active.url)}
          imageSrc={active.url}
          selectedId={null}
          disableSelect
          hideToolbar
          onSelect={() => undefined}
          onToolStateChange={setToolState}
        />
        {state.selectedKvId === active.id ? <span>当前主KV</span> : null}
      </div>

      <div className="poster-kv-rail" role="tablist" aria-label="主KV方案切换">
        {state.kvCandidates.map((candidate, index) => (
          <button
            key={candidate.id}
            type="button"
            role="tab"
            aria-selected={candidate.id === active.id}
            className={`${candidate.id === active.id ? 'active' : ''} ${
              candidate.id === state.selectedKvId ? 'selected' : ''
            }`}
            onClick={() => onActivate(candidate.id)}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <img src={candidate.url} alt="" />
            <strong>{candidate.title}</strong>
            {candidate.id === state.selectedKvId ? <Check className="h-3.5 w-3.5" /> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PosterPlanBPanel<T extends PosterPlanBState>({
  state,
  productName,
  onChange,
  onGenerate,
  onOpenKv,
  onOpenNew,
  onOpenPoster,
  workspaceLabel = 'Plan B',
  sourceMode = 'kv',
  structuredBrief = false,
}: PosterPlanBPanelProps<T>) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const canGenerate = structuredBrief
    ? Boolean(
        state.posterTitle.trim() &&
          state.posterCoreContent.trim() &&
          state.posterAudience.trim() &&
          state.posterRatio
      )
    : Boolean(state.draftText.trim() || state.uploadFileName);

  if (state.view === 'list') {
    return (
      <div className="workspace-surface-panel meeting-surface-panel meeting-session-list-panel poster-plan-b-list-panel">
        <div className="meeting-session-list-head poster-plan-b-list-head">
          <div>
            <h2 className="meeting-section-title">海报/图片列表</h2>
            <p>
              {state.requests.length
                ? `共 ${state.requests.length} 个产物，${sourceMode === 'kv' ? '全部沿用当前产品的同一主KV。' : '均由当前任务提案直接生成。'}`
                : `列表为空，点击“新增海报/图片”开始 ${workspaceLabel} 的第一个产物。`}
            </p>
          </div>
          {sourceMode === 'kv' && onOpenKv ? (
            <button type="button" className="btn soft" onClick={onOpenKv}>
              <Image className="h-3.5 w-3.5" />
              查看主KV
            </button>
          ) : null}
        </div>
        <div className="meeting-session-grid poster-plan-b-list-grid">
          {state.requests.map((request, index) => (
            <button
              key={request.id}
              type="button"
              className="meeting-session-tile poster-plan-b-list-tile"
              onClick={() => onOpenPoster(request.id)}
            >
              <span className="poster-plan-b-list-thumb">
                <img src={request.posterUrl} alt="" />
                <em>{String(index + 1).padStart(2, '0')}</em>
              </span>
              <strong>{request.title}</strong>
              <small>{request.uploadFileName || '在线填写'}</small>
              {request.veevaStatus === 'submitted' ? (
                <span className="poster-plan-b-list-status is-done">已提交 Veeva</span>
              ) : request.veevaStatus === 'prepared' ? (
                <span className="poster-plan-b-list-status">Veeva 审批中</span>
              ) : request.teamReviewStatus === 'pending' ? (
                <span className="poster-plan-b-list-status">意见收集中</span>
              ) : (
                <span className="poster-plan-b-list-status is-draft">待提交</span>
              )}
            </button>
          ))}
          <button
            type="button"
            className="meeting-session-tile is-add poster-plan-b-list-tile is-add"
            onClick={onOpenNew}
          >
            <span className="meeting-session-add-icon" aria-hidden>
              <Plus className="h-4 w-4" strokeWidth={2.4} />
            </span>
            <strong>新增海报/图片</strong>
            <small>{sourceMode === 'kv' ? '继续沿用同一主KV' : '直接根据新信息生成'}</small>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-surface-panel poster-plan-b-panel">
      <div className="poster-plan-b-head">
        <div>
          <h1>{state.requests.length ? '新增海报/图片' : '填写第一张海报/图片信息'}</h1>
          <p>
            当前产品：<strong>{productName}</strong>。每个新产物都会沿用已确认主KV的视觉风格。
          </p>
        </div>
        <span className="poster-plan-b-source-badge">
          <Image className="h-3.5 w-3.5" />
          来源：同一主KV
        </span>
      </div>

      <div className="poster-plan-b-inputs">
        {structuredBrief ? (
          <div className="poster-output-fields">
            <label>
              <span>标题</span>
              <input
                className="input"
                value={state.posterTitle}
                placeholder="例如：三天倒计时，循证前行"
                onChange={(event) => onChange({ ...state, posterTitle: event.target.value })}
              />
            </label>
            <label className="is-wide">
              <span>核心内容</span>
              <textarea
                className="input"
                rows={5}
                value={state.posterCoreContent}
                placeholder="填写必须呈现的核心信息、数据或行动提示。"
                onChange={(event) =>
                  onChange({ ...state, posterCoreContent: event.target.value })
                }
              />
            </label>
            <label>
              <span>受众</span>
              <input
                className="input"
                value={state.posterAudience}
                placeholder="例如：泌尿外科医生"
                onChange={(event) => onChange({ ...state, posterAudience: event.target.value })}
              />
            </label>
            <fieldset className="poster-output-ratio">
              <legend>比例</legend>
              <div>
                {['3:4', '1:1', '4:3', '16:9'].map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    className={state.posterRatio === ratio ? 'active' : ''}
                    aria-pressed={state.posterRatio === ratio}
                    onClick={() => onChange({ ...state, posterRatio: ratio })}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        ) : (
          <label className="poster-plan-b-text">
            <span>直接填写新海报/图片信息</span>
            <textarea
              className="input"
              rows={8}
              value={state.draftText}
              placeholder="描述海报主题、核心信息、目标受众和补充要求。"
              onChange={(event) => onChange({ ...state, draftText: event.target.value })}
            />
          </label>
        )}

        <section className="poster-plan-b-upload">
          <span className="poster-plan-b-section-icon" aria-hidden>
            <Upload className="h-4 w-4" />
          </span>
          <div>
            <strong>上传补充附件</strong>
            <p>支持 PDF、Word、PPT、Excel、CSV 或文本文件。</p>
          </div>
          <button type="button" className="btn soft" onClick={() => uploadRef.current?.click()}>
            选择附件
          </button>
          <input
            ref={uploadRef}
            type="file"
            hidden
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) onChange({ ...state, uploadFileName: file.name });
              event.currentTarget.value = '';
            }}
          />
        </section>

        {state.uploadFileName ? (
          <div className="poster-plan-b-file">
            <FileText className="h-4 w-4" />
            <span>
              <strong>{state.uploadFileName}</strong>
              <small>附件将作为本次海报生成的补充信息</small>
            </span>
            <button
              type="button"
              aria-label="移除上传文件"
              title="移除上传文件"
              onClick={() => onChange({ ...state, uploadFileName: undefined })}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="poster-plan-b-actions">
        <span>{canGenerate ? '信息已就绪，可生成产物' : '请完成标题、核心内容、受众和比例'}</span>
        <button type="button" className="btn primary" disabled={!canGenerate} onClick={onGenerate}>
          {state.requests.length ? '生成另一个产物' : '生成海报/图片'}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
