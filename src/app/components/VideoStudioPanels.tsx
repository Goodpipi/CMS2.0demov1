import { useRef, useState } from 'react';
import { Eraser, Paintbrush, Play, Settings2, Trash2 } from 'lucide-react';
import {
  SelectableSvgPreview,
  type SelectableSvgPreviewHandle,
  type SelectableSvgToolState,
} from '@/app/components/SelectableSvgPreview';
import { parseSvgFromDataUrl } from '@/app/components/svgEditorUtils';
import {
  VIDEO_HERO_IMAGE_URL,
  VIDEO_STUDIO_FULL_URL,
  VIDEO_STUDIO_OPINIONS,
  findShotDef,
  firstFrameUrl,
  finalVideoMeta,
  isVideoBriefComplete,
  shotsFromStoryboard,
  type VideoBrief,
  type VideoStudioAction,
  type VideoStudioState,
  type VideoTransition,
} from '@/lib/videoStudioMocks';

function ActionRow({ children }: { children: React.ReactNode }) {
  return <div className="video-studio-actions">{children}</div>;
}

function StageHeader({
  title,
  children,
  centerActions = false,
}: {
  title: string;
  children?: React.ReactNode;
  centerActions?: boolean;
}) {
  return (
    <div className={`video-studio-stage-header ${centerActions ? 'is-actions-centered' : ''}`}>
      <h1>{title}</h1>
      {children ? <div className="video-studio-stage-actions">{children}</div> : null}
    </div>
  );
}

function StudioPlayer({
  src,
  poster,
  title,
  compact,
}: {
  src: string;
  poster?: string;
  title?: string;
  compact?: boolean;
}) {
  return (
    <div className={`video-studio-player ${compact ? 'is-compact' : ''}`}>
      <video src={src} poster={poster} controls preload="metadata" title={title} />
    </div>
  );
}

function BrushCanvas({
  imageUrl,
  active,
}: {
  imageUrl: string;
  active: boolean;
}) {
  const previewRef = useRef<SelectableSvgPreviewHandle>(null);
  const [toolState, setToolState] = useState<SelectableSvgToolState>({
    brushActive: false,
    eraserActive: false,
    canClear: false,
  });
  const isSvg = imageUrl.startsWith('data:image/svg') || imageUrl.includes('image/svg');

  return (
    <div className={`video-studio-brush ${active ? 'is-active' : ''}`}>
      {active ? (
        <div className="video-studio-brush-tools" role="toolbar" aria-label="圈选工具">
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
          <button type="button" className="btn soft image-draw-tool" onClick={() => previewRef.current?.cancelTools()}>
            取消
          </button>
        </div>
      ) : null}
      {isSvg ? (
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
      ) : (
        <img src={imageUrl} alt="主视觉参考" />
      )}
    </div>
  );
}

function BriefPanel({
  studio,
  dispatch,
}: {
  studio: VideoStudioState;
  dispatch: (action: VideoStudioAction) => void;
}) {
  const brief = studio.brief;
  const complete = isVideoBriefComplete(brief);
  const set = (patch: Partial<VideoBrief>) => dispatch({ type: 'setBrief', brief: { ...brief, ...patch } });

  return (
    <div className="workspace-surface-panel video-studio-panel">
      <StageHeader title="填写视频需求">
        <button
          type="button"
          className="btn primary"
          disabled={!complete}
          onClick={() => dispatch({ type: 'generateHero' })}
        >
          生成主视觉参考
        </button>
      </StageHeader>
      <div className="video-studio-form">
        <label>
          视频主题<span>*</span>
          <input className="input" value={brief.theme} onChange={(e) => set({ theme: e.target.value })} />
        </label>
        <label>
          目标受众<span>*</span>
          <input className="input" value={brief.audience} onChange={(e) => set({ audience: e.target.value })} />
        </label>
        <label className="is-wide">
          核心信息<span>*</span>
          <textarea className="input" rows={4} value={brief.keyMessages} onChange={(e) => set({ keyMessages: e.target.value })} />
        </label>
        <label>
          视频总时长<span>*</span>
          <input className="input" value={brief.duration} onChange={(e) => set({ duration: e.target.value })} />
        </label>
        <label>
          画面风格<span>*</span>
          <input className="input" value={brief.style} onChange={(e) => set({ style: e.target.value })} />
        </label>
        <label>
          视频比例
          <input className="input" value={brief.ratio} onChange={(e) => set({ ratio: e.target.value })} />
        </label>
        <label>
          内容语言
          <input className="input" value={brief.language} onChange={(e) => set({ language: e.target.value })} />
        </label>
      </div>
    </div>
  );
}

function VisualRefPanel({
  studio,
  dispatch,
  onOpenMaterialsPicker,
}: {
  studio: VideoStudioState;
  dispatch: (action: VideoStudioAction) => void;
  onOpenMaterialsPicker?: () => void;
}) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const imageUrl = studio.visualRefUrl || VIDEO_HERO_IMAGE_URL;

  return (
    <div className="workspace-surface-panel video-studio-panel">
      <StageHeader title="主视觉参考">
        <button type="button" className="btn soft" onClick={() => onOpenMaterialsPicker?.()}>
          上传参考资料
        </button>
        <button type="button" className="btn primary" onClick={() => dispatch({ type: 'generateStoryboard' })}>
          生成分镜脚本
        </button>
      </StageHeader>
      <div className="video-studio-visual-ref">
        <BrushCanvas imageUrl={imageUrl} active />
      </div>
      {studio.heroCompared ? (
        <div className="video-studio-compare">
          <figure>
            <img src={VIDEO_HERO_IMAGE_URL} alt="修改前" />
            <figcaption>修改前</figcaption>
          </figure>
          <figure>
            <img src={VIDEO_HERO_IMAGE_URL} alt="修改后" />
            <figcaption>披风加深红</figcaption>
          </figure>
        </div>
      ) : null}
      <ActionRow>
        <button type="button" className="btn soft" onClick={() => uploadRef.current?.click()}>
          上传图片
        </button>
        <button type="button" className="btn soft" onClick={() => dispatch({ type: 'regenerateHero' })}>
          重新生成
        </button>
        <a className="btn soft" href={imageUrl} download="主视觉参考.jpg">
          下载当前主视觉
        </a>
      </ActionRow>
      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              dispatch({ type: 'setVisualRefUrl', url: reader.result });
            }
          };
          reader.readAsDataURL(file);
          event.target.value = '';
        }}
      />
    </div>
  );
}

function StoryboardPanel({
  studio,
  dispatch,
}: {
  studio: VideoStudioState;
  dispatch: (action: VideoStudioAction) => void;
}) {
  return (
    <div className="workspace-surface-panel video-studio-panel">
      <StageHeader title="完整分镜脚本">
        <button type="button" className="btn primary" onClick={() => dispatch({ type: 'generateFrames' })}>
          确认并生成分镜参考图
        </button>
      </StageHeader>
      <textarea
        className="input video-studio-storyboard-text"
        aria-label="完整分镜脚本"
        value={studio.storyboardText}
        onChange={(event) => dispatch({ type: 'setStoryboardText', text: event.target.value })}
      />
      <ActionRow>
        <button type="button" className="btn soft" onClick={() => dispatch({ type: 'startTeamReview' })}>
          收集团队意见
        </button>
        <button type="button" className="btn primary" onClick={() => dispatch({ type: 'confirmSubmit' })}>
          提交Veeva
        </button>
      </ActionRow>
    </div>
  );
}

function FramesPanel({
  studio,
  dispatch,
}: {
  studio: VideoStudioState;
  dispatch: (action: VideoStudioAction) => void;
}) {
  const shots = shotsFromStoryboard(studio.storyboard);
  const allSelected = shots.length > 0 && shots.every((shot) => studio.selectedFrameIds.includes(shot.id));
  const hasSelection = studio.selectedFrameIds.length > 0;

  return (
    <div className="workspace-surface-panel video-studio-panel">
      <StageHeader title="分镜参考图">
        <button type="button" className="btn primary" onClick={() => dispatch({ type: 'generateClips' })}>
          视频生成
        </button>
      </StageHeader>
      <div className="video-studio-frame-toolbar">
        <div className="video-studio-toolbar-actions">
          <label className="video-studio-select-all">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(event) => dispatch({ type: 'selectAllFrames', selected: event.target.checked })}
            />
            全选
          </label>
          <button
            type="button"
            className="btn primary"
            disabled={!hasSelection}
            onClick={() => dispatch({ type: 'regenerateSelectedFrames' })}
          >
            重新生成
          </button>
        </div>
      </div>
      <div className="video-studio-frame-strip" role="list">
        {shots.map((clip) => {
          const version = studio.frameVersions[clip.id] || 'base';
          const checked = studio.selectedFrameIds.includes(clip.id);
          return (
            <article
              key={clip.id}
              className={`video-studio-frame-strip-card ${checked ? 'is-selected' : ''}`}
              role="listitem"
            >
              <label className="video-studio-frame-check">
                <input
                  type="checkbox"
                  checked={checked}
                  aria-label={`选择${clip.name}`}
                  onChange={() => dispatch({ type: 'toggleFrameSelect', id: clip.id })}
                />
              </label>
              <img src={firstFrameUrl(clip.id, version)} alt={`${clip.name}参考图`} />
              <div className="video-studio-frame-strip-meta">
                <strong>
                  {clip.range} · {clip.name}
                </strong>
                <p>{clip.summary}</p>
              </div>
            </article>
          );
        })}
      </div>
      {studio.frameCompared ? (
        <div className="video-studio-compare">
          <figure>
            <img src={firstFrameUrl('clip-2')} alt="修改前" />
            <figcaption>片段2 修改前</figcaption>
          </figure>
          <figure>
            <img src={firstFrameUrl('clip-3')} alt="修改后" />
            <figcaption>米饭份量缩小</figcaption>
          </figure>
        </div>
      ) : null}
    </div>
  );
}

function ClipsPanel({
  studio,
  dispatch,
}: {
  studio: VideoStudioState;
  dispatch: (action: VideoStudioAction) => void;
}) {
  const compositeVideoRef = useRef<HTMLVideoElement>(null);
  const [compositePlaying, setCompositePlaying] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [transitionEditorId, setTransitionEditorId] = useState<string | null>(null);
  const visibleIds = studio.clipOrder.filter((id) => !studio.removedClipIds.includes(id));
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => studio.selectedClipIds.includes(id));
  const hasSelection = studio.selectedClipIds.length > 0;
  const meta = finalVideoMeta(studio);
  const firstVisibleClip = studio.clips.find((item) => item.id === visibleIds[0]);
  const firstVisibleVersion =
    firstVisibleClip?.versions.find((item) => item.id === firstVisibleClip.selectedVersionId) ||
    firstVisibleClip?.versions[0];
  const compositePoster = firstVisibleVersion?.posterUrl || firstFrameUrl(visibleIds[0] || 'clip-1');

  const moveClip = (from: number, to: number) => {
    if (to < 0 || to >= visibleIds.length || from === to) return;
    const next = [...visibleIds];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    dispatch({ type: 'reorderClips', order: next });
  };

  return (
    <div className="workspace-surface-panel video-studio-panel">
      <StageHeader title="视频生成与拼接" />
      <section className="video-studio-composite" aria-label="完整视频预览">
        <div className="video-studio-composite-head">
          <strong>完整视频预览</strong>
          <span>{meta.duration} · {meta.ratio} · {visibleIds.length} 个片段</span>
        </div>
        <div className="video-studio-composite-player">
          <div className="video-studio-composite-media">
            <video
              ref={compositeVideoRef}
              src={VIDEO_STUDIO_FULL_URL}
              poster={compositePoster}
              controls
              preload="metadata"
              title="当前配置的完整视频"
              onPlay={() => setCompositePlaying(true)}
              onPause={() => setCompositePlaying(false)}
              onEnded={() => setCompositePlaying(false)}
            />
          </div>
          {!compositePlaying ? (
            <button
              type="button"
              className="video-studio-composite-play"
              aria-label="播放完整视频"
              onClick={() => void compositeVideoRef.current?.play()}
            >
              <Play className="h-6 w-6" fill="currentColor" aria-hidden />
            </button>
          ) : null}
        </div>
      </section>
      <div className="video-studio-frame-toolbar">
        <div className="video-studio-toolbar-actions">
          <label className="video-studio-select-all">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(event) => dispatch({ type: 'selectAllClips', selected: event.target.checked })}
            />
            全选
          </label>
          <button
            type="button"
            className="btn primary"
            disabled={!hasSelection}
            onClick={() => dispatch({ type: 'regenerateSelectedClips' })}
          >
            重新生成
          </button>
        </div>
      </div>
      <div className="video-studio-frame-strip video-studio-clip-strip" role="list">
        {visibleIds.map((clipId, index) => {
          const clip = findShotDef(clipId, studio.storyboard);
          if (!clip) return null;
          const state = studio.clips.find((item) => item.id === clipId);
          const selected = state?.versions.find((item) => item.id === state.selectedVersionId) || state?.versions[0];
          const checked = studio.selectedClipIds.includes(clipId);
          const nextId = visibleIds[index + 1];
          const transition = studio.transitions[clipId] || 'cut';
          return (
            <div key={clipId} className="video-studio-clip-unit">
              <article
                className={`video-studio-frame-strip-card video-studio-clip-strip-card ${checked ? 'is-selected' : ''} ${dragId === clipId ? 'is-dragging' : ''}`}
                role="listitem"
                draggable
                onDragStart={(event) => {
                  if ((event.target as HTMLElement).closest('button, label, input, select, a, video')) {
                    event.preventDefault();
                    return;
                  }
                  setDragId(clipId);
                }}
                onDragEnd={() => setDragId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (!dragId || dragId === clipId) return;
                  moveClip(visibleIds.indexOf(dragId), index);
                  setDragId(null);
                }}
              >
                <div className="video-studio-clip-media">
                  <label className="video-studio-frame-check">
                    <input
                      type="checkbox"
                      checked={checked}
                      aria-label={`选择${clip.name}`}
                      onChange={() => dispatch({ type: 'toggleClipSelect', id: clipId })}
                    />
                  </label>
                  <img src={selected?.posterUrl || firstFrameUrl(clipId)} alt={clip.name} />
                  <div className="video-studio-clip-float">
                    <button
                      type="button"
                      className="video-studio-clip-icon-btn is-danger"
                      title="删除"
                      aria-label={`删除${clip.name}`}
                      onClick={() => dispatch({ type: 'removeClip', clipId })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="video-studio-frame-strip-meta">
                  <strong>{clip.name}</strong>
                  <span className="video-studio-clip-version">
                    {clip.range}{state && state.versions.length > 1 ? ` · ${selected?.label || '版本A'}` : ''}
                  </span>
                </div>
              </article>
              {nextId ? (
                <div className="video-studio-transition-gap">
                  <button
                    type="button"
                    className={`video-studio-transition-seam ${transitionEditorId === clipId ? 'is-open' : ''}`}
                    title="配置转场"
                    aria-label={`配置 ${clip.name} 到下一片段的转场，当前为${transition === 'fade' ? '淡入淡出' : '直接切换'}`}
                    onClick={() => setTransitionEditorId((prev) => (prev === clipId ? null : clipId))}
                  >
                    <Settings2 className="h-3.5 w-3.5" aria-hidden />
                    <span>{transition === 'fade' ? '淡入淡出' : '转场'}</span>
                  </button>
                  {transitionEditorId === clipId ? (
                    <div className="video-studio-transition-menu" role="menu">
                      <button
                        type="button"
                        role="menuitem"
                        className={transition === 'cut' ? 'is-active' : ''}
                        onClick={() => {
                          dispatch({ type: 'setTransition', afterClipId: clipId, transition: 'cut' });
                          setTransitionEditorId(null);
                        }}
                      >
                        直接切换
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className={transition === 'fade' ? 'is-active' : ''}
                        onClick={() => {
                          dispatch({ type: 'setTransition', afterClipId: clipId, transition: 'fade' as VideoTransition });
                          setTransitionEditorId(null);
                        }}
                      >
                        淡入淡出
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {studio.removedClipIds.length ? (
        <div className="video-studio-removed-row">
          {studio.removedClipIds.map((clipId) => {
            const clip = findShotDef(clipId, studio.storyboard);
            return (
              <button key={clipId} type="button" className="btn soft" onClick={() => dispatch({ type: 'restoreClip', clipId })}>
                恢复 {clip?.name}
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="video-studio-actions video-studio-bottom-actions">
        <a
          className="btn primary"
          href={VIDEO_STUDIO_FULL_URL}
          download
          onClick={() => dispatch({ type: 'composeFinal' })}
        >
          导出完整视频
        </a>
        <button type="button" className="btn soft" onClick={() => dispatch({ type: 'startTeamReview' })}>
          收集团队意见
        </button>
        <button type="button" className="btn soft" onClick={() => dispatch({ type: 'confirmSubmit' })}>
          提交Veeva
        </button>
      </div>
    </div>
  );
}

function FinalPanel({
  studio,
  dispatch,
}: {
  studio: VideoStudioState;
  dispatch: (action: VideoStudioAction) => void;
}) {
  const meta = finalVideoMeta(studio);
  return (
    <div className="workspace-surface-panel video-studio-panel">
      <StageHeader title={meta.name}>
        <button type="button" className="btn primary" onClick={() => dispatch({ type: 'startTeamReview' })}>
          发起意见收集
        </button>
      </StageHeader>
      <ul className="video-studio-meta">
        <li>视频时长：{meta.duration}</li>
        <li>视频比例：{meta.ratio}</li>
        <li>主视觉参考：{meta.hero}</li>
        <li>制作片段：{meta.clipCount}个</li>
        <li>当前版本：{meta.version}</li>
        <li>脚本合规检查：{meta.compliance}</li>
      </ul>
      <StudioPlayer src={meta.videoUrl} poster={meta.posterUrl} title={meta.name} />
      <ActionRow>
        <button type="button" className="btn primary" onClick={() => dispatch({ type: 'goto', view: 'final' })}>
          播放视频
        </button>
        <button type="button" className="btn soft" onClick={() => dispatch({ type: 'goto', view: 'storyboard' })}>
          查看完整脚本
        </button>
        <button type="button" className="btn soft" onClick={() => dispatch({ type: 'goto', view: 'frames' })}>
          查看分镜参考图
        </button>
        <button type="button" className="btn soft" onClick={() => dispatch({ type: 'goto', view: 'clips' })}>
          查看分段视频
        </button>
        <a className="btn soft" href={meta.videoUrl} download>
          下载视频
        </a>
      </ActionRow>
    </div>
  );
}

function TeamPanel({
  studio,
  dispatch,
}: {
  studio: VideoStudioState;
  dispatch: (action: VideoStudioAction) => void;
}) {
  return (
    <div className="workspace-surface-panel video-studio-panel">
      <StageHeader title="意见收集">
        <button type="button" className="btn primary" onClick={() => dispatch({ type: 'confirmSubmit' })}>
          提交Veeva审批
        </button>
      </StageHeader>
      <div className="video-studio-opinions">
        {VIDEO_STUDIO_OPINIONS.map((item) => (
          <article key={item.id}>
            <strong>{item.target}</strong>
            <span>{item.time}</span>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
      <ActionRow>
        <button type="button" className="btn soft" onClick={() => dispatch({ type: 'goto', view: 'team' })}>
          查看意见
        </button>
      </ActionRow>
    </div>
  );
}

function SubmitPanel({ studio }: { studio: VideoStudioState }) {
  const meta = finalVideoMeta(studio);
  return (
    <div className="workspace-surface-panel video-studio-panel">
      <div className="topic-insight-title-row">
        <h1>提交Veeva审批</h1>
      </div>
      <ul className="video-studio-meta">
        <li>视频名称：{meta.name}</li>
        <li>当前视频版本：{meta.version}</li>
        <li>视频时长：{meta.duration}</li>
        <li>分镜脚本状态：{studio.storyboardReady ? '已确认' : '未完成'}</li>
        <li>合规检查状态：{meta.compliance}</li>
        <li>意见收集状态：{studio.teamReady ? '已完成' : '进行中'}</li>
      </ul>
      {studio.submitted ? (
        <div className="video-studio-success">已提交成功。Veeva 审批包已生成（演示模式）。</div>
      ) : null}
    </div>
  );
}

export function VideoStudioWorkspace({
  studio,
  dispatch,
  onOpenMaterialsPicker,
}: {
  studio: VideoStudioState;
  dispatch: (action: VideoStudioAction) => void;
  onOpenMaterialsPicker?: () => void;
}) {
  if (studio.view === 'hero' && studio.heroReady) {
    return <VisualRefPanel studio={studio} dispatch={dispatch} onOpenMaterialsPicker={onOpenMaterialsPicker} />;
  }
  if (studio.view === 'storyboard' && studio.storyboardReady) return <StoryboardPanel studio={studio} dispatch={dispatch} />;
  if (studio.view === 'frames' && studio.framesReady) return <FramesPanel studio={studio} dispatch={dispatch} />;
  if ((studio.view === 'clips' || studio.timelinePreviewing) && studio.clipsReady) {
    return <ClipsPanel studio={studio} dispatch={dispatch} />;
  }
  if (studio.view === 'final' && studio.finalReady) return <FinalPanel studio={studio} dispatch={dispatch} />;
  if (studio.view === 'team') return <TeamPanel studio={studio} dispatch={dispatch} />;
  if (studio.view === 'submit') return <SubmitPanel studio={studio} />;
  return <BriefPanel studio={studio} dispatch={dispatch} />;
}
