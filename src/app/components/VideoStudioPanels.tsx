import { useMemo, useRef, useState } from 'react';
import { Eraser, Paintbrush } from 'lucide-react';
import {
  SelectableSvgPreview,
  type SelectableSvgPreviewHandle,
  type SelectableSvgToolState,
} from '@/app/components/SelectableSvgPreview';
import { parseSvgFromDataUrl } from '@/app/components/svgEditorUtils';
import { downloadDataUrl } from '@/lib/copyRevisionUtils';
import {
  VIDEO_CLIPS,
  VIDEO_HERO_POSES,
  VIDEO_STUDIO_FULL_URL,
  VIDEO_STUDIO_OPINIONS,
  firstFrameUrl,
  finalVideoMeta,
  heroPoseUrl,
  isVideoBriefComplete,
  type VideoBrief,
  type VideoHeroPose,
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
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="video-studio-stage-header">
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
          生成主角形象
        </button>
      </StageHeader>
      <p className="small meeting-surface-hint">
        请先填写视频主题、画面风格等必填项。填写完成后直接点击右上角生成主角形象。
      </p>
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
        <label>
          旁白形式
          <input className="input" value={brief.narrationType} onChange={(e) => set({ narrationType: e.target.value })} />
        </label>
        <label>
          品牌
          <input className="input" value={brief.brand} onChange={(e) => set({ brand: e.target.value })} />
        </label>
        <label>
          主角或人物要求
          <input className="input" value={brief.heroRequirement} onChange={(e) => set({ heroRequirement: e.target.value })} />
        </label>
        <label>
          旁白语气
          <input className="input" value={brief.tone} onChange={(e) => set({ tone: e.target.value })} />
        </label>
        <label>
          参考视频
          <input className="input" value={brief.refVideo} onChange={(e) => set({ refVideo: e.target.value })} />
        </label>
        <label>
          人物参考图
          <input className="input" value={brief.personRef} onChange={(e) => set({ personRef: e.target.value })} />
        </label>
        <label>
          场景或风格参考图
          <input className="input" value={brief.sceneRef} onChange={(e) => set({ sceneRef: e.target.value })} />
        </label>
        <label className="is-wide">
          品牌Brief和参考资料
          <textarea className="input" rows={3} value={brief.brandBrief} onChange={(e) => set({ brandBrief: e.target.value })} />
        </label>
      </div>
    </div>
  );
}

function HeroPanel({
  studio,
  dispatch,
}: {
  studio: VideoStudioState;
  dispatch: (action: VideoStudioAction) => void;
}) {
  const [selectedPose, setSelectedPose] = useState<VideoHeroPose>('front');
  const selectedUrl = heroPoseUrl(selectedPose, studio.heroCape);

  return (
    <div className="workspace-surface-panel video-studio-panel">
      <StageHeader title="主角形象（Hero）">
        <button type="button" className="btn primary" onClick={() => dispatch({ type: 'generateStoryboard' })}>
          生成分镜脚本
        </button>
      </StageHeader>
      <div className="video-studio-hero-tabs" role="tablist" aria-label="主角形象视图">
        {VIDEO_HERO_POSES.map((pose) => (
          <button
            key={pose.id}
            type="button"
            role="tab"
            aria-selected={selectedPose === pose.id}
            className={selectedPose === pose.id ? 'is-active' : ''}
            onClick={() => setSelectedPose(pose.id)}
          >
            {pose.label}
          </button>
        ))}
      </div>
      <div className="video-studio-hero-stage">
        <img
          src={selectedUrl}
          alt={VIDEO_HERO_POSES.find((pose) => pose.id === selectedPose)?.label || '主角形象'}
        />
      </div>
      <p className="small meeting-surface-hint">
        如需调整形象，请直接在右侧对话中描述，例如“把小K的披风改成深红色”。
      </p>
      <ActionRow>
        <button type="button" className="btn soft" onClick={() => dispatch({ type: 'regenerateHero' })}>
          重新生成
        </button>
        <button type="button" className="btn soft" onClick={() => downloadDataUrl(selectedUrl, '小K主角形象.svg')}>
          下载当前视图
        </button>
      </ActionRow>
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
          确认并生成片段首帧
        </button>
      </StageHeader>
      <p className="small meeting-surface-hint">
        脚本按时间从头到尾连续编写，并标明每一秒的镜头、画面、台词、解说词、字幕与衔接。确认后系统再拆成制作片段。
      </p>
      <textarea
        className="input video-studio-storyboard-text"
        aria-label="完整分镜脚本"
        value={studio.storyboardText}
        onChange={(event) => dispatch({ type: 'setStoryboardText', text: event.target.value })}
      />
      <ActionRow>
        <button type="button" className="btn soft" onClick={() => dispatch({ type: 'checkCompliance' })}>
          检查脚本合规
        </button>
      </ActionRow>
      {studio.complianceChecked ? <div className="small video-studio-ok">脚本合规检查：已完成</div> : null}
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
  const [preview, setPreview] = useState<string | null>(null);
  const selectedClip = VIDEO_CLIPS.find((clip) => clip.id === studio.selectedClipId) || VIDEO_CLIPS[0];
  const selectedVersion = studio.frameVersions[selectedClip.id] || 'base';
  const selectedUrl = firstFrameUrl(selectedClip.id, selectedVersion);
  const brushing = studio.frameBrushClipId === selectedClip.id;
  return (
    <div className="workspace-surface-panel video-studio-panel">
      <StageHeader title="片段首帧">
        <button
          type="button"
          className="btn soft"
          onClick={() => dispatch({ type: 'confirmAllFrames' })}
        >
          {studio.framesConfirmed ? '全部首帧已确认' : '确认全部首帧'}
        </button>
        <button
          type="button"
          className="btn primary"
          disabled={!studio.framesConfirmed}
          onClick={() => dispatch({ type: 'generateClips' })}
        >
          生成分段视频
        </button>
      </StageHeader>
      <p className="small meeting-surface-hint">请从右侧对话区选择一张片段首帧，在这里进行圈选修改或重新生成。</p>
      <article className="video-studio-frame-focus">
        <header>
          <div>
            <strong>{selectedClip.name}</strong>
            <span>{selectedClip.range}</span>
          </div>
          <span>当前版本：{selectedVersion === 'rice' ? '米饭缩小版' : 'V1'}</span>
        </header>
        {brushing ? (
          <BrushCanvas imageUrl={selectedUrl} active />
        ) : (
          <img src={selectedUrl} alt={`${selectedClip.name}首帧`} />
        )}
        <p>{selectedClip.summary}</p>
        <ActionRow>
          <button type="button" className="btn soft" onClick={() => setPreview(selectedUrl)}>
            打开预览
          </button>
          <button
            type="button"
            className="btn soft"
            onClick={() => dispatch({ type: 'openFrameBrush', clipId: selectedClip.id })}
          >
            画笔圈选修改
          </button>
          <button
            type="button"
            className="btn soft"
            onClick={() => dispatch({ type: 'regenerateFrame', clipId: selectedClip.id })}
          >
            重新生成
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => dispatch({ type: 'confirmFrame', clipId: selectedClip.id })}
          >
            确认该首帧
          </button>
        </ActionRow>
      </article>
      {studio.frameCompared ? (
        <div className="video-studio-compare">
          <figure>
            <img src={firstFrameUrl('clip-2', 'base')} alt="修改前" />
            <figcaption>片段2 修改前</figcaption>
          </figure>
          <figure>
            <img src={firstFrameUrl('clip-2', 'rice')} alt="修改后" />
            <figcaption>米饭份量缩小</figcaption>
          </figure>
        </div>
      ) : null}
      {selectedClip.id === 'clip-2' && studio.frameVersions['clip-2'] === 'rice' ? (
        <ActionRow>
          <button type="button" className="btn soft" onClick={() => dispatch({ type: 'compareFrame' })}>
            对比修改前后
          </button>
        </ActionRow>
      ) : null}
      {preview ? (
        <div className="video-studio-lightbox" onClick={() => setPreview(null)}>
          <img src={preview} alt="首帧预览" />
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
  const playing = studio.timelinePreviewing ? VIDEO_STUDIO_FULL_URL : null;
  const [playingVersion, setPlayingVersion] = useState<string | null>(null);
  return (
    <div className="workspace-surface-panel video-studio-panel">
      <StageHeader title="视频生成与拼接">
        <button type="button" className="btn soft" onClick={() => dispatch({ type: 'previewTimeline' })}>
          预览拼接效果
        </button>
        <button type="button" className="btn primary" onClick={() => dispatch({ type: 'composeFinal' })}>
          合并完整视频
        </button>
      </StageHeader>
      <p className="small meeting-surface-hint">
        已生成多个制作片段。可拖动或左右移动调整顺序，确认后合并为完整视频。
      </p>
      <div className="video-studio-clip-grid">
        {VIDEO_CLIPS.map((clip) => {
          const state = studio.clips.find((item) => item.id === clip.id);
          const selected = state?.versions.find((item) => item.id === state.selectedVersionId) || state?.versions[0];
          return (
            <article
              key={clip.id}
              className={`video-studio-clip-card ${studio.selectedClipId === clip.id ? 'is-selected' : ''}`}
            >
              <header>
                <strong>
                  {clip.name} · {clip.range}
                </strong>
                <span>{clip.duration}</span>
              </header>
              <img src={selected?.posterUrl || firstFrameUrl(clip.id)} alt={clip.name} />
              <p>{clip.narration}</p>
              <div className="small">衔接到下一片段：{clip.bridge}</div>
              <div className="video-studio-versions">
                {(state?.versions || []).map((version) => (
                  <div
                    key={version.id}
                    className={`video-studio-version ${state?.selectedVersionId === version.id ? 'is-selected' : ''}`}
                  >
                    <strong>{version.label}</strong>
                    <span>{version.note}</span>
                    <div className="video-studio-card-actions">
                      <button
                        type="button"
                        className="btn soft"
                        onClick={() => {
                          dispatch({ type: 'selectClip', clipId: clip.id });
                          setPlayingVersion(`${clip.id}-${version.id}`);
                        }}
                      >
                        播放
                      </button>
                      <button
                        type="button"
                        className="btn primary"
                        onClick={() => dispatch({ type: 'selectClipVersion', clipId: clip.id, versionId: version.id })}
                      >
                        设为当前版本
                      </button>
                    </div>
                    {playingVersion === `${clip.id}-${version.id}` ? (
                      <StudioPlayer src={version.videoUrl} poster={version.posterUrl} title={version.label} compact />
                    ) : null}
                  </div>
                ))}
              </div>
              <ActionRow>
                <button type="button" className="btn soft" onClick={() => dispatch({ type: 'addClipVersion', clipId: clip.id })}>
                  生成新版本
                </button>
              </ActionRow>
            </article>
          );
        })}
      </div>
      <TimelineBlock studio={studio} dispatch={dispatch} playing={Boolean(playing)} />
    </div>
  );
}

function TimelineBlock({
  studio,
  dispatch,
  playing,
}: {
  studio: VideoStudioState;
  dispatch: (action: VideoStudioAction) => void;
  playing: boolean;
}) {
  const visible = studio.clipOrder.filter((id) => !studio.removedClipIds.includes(id));
  const [dragId, setDragId] = useState<string | null>(null);

  const moveClip = (from: number, to: number) => {
    if (to < 0 || to >= visible.length || from === to) return;
    const next = [...visible];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    dispatch({ type: 'reorderClips', order: next });
  };

  return (
    <section className="video-studio-timeline">
      <h2>片段排序与合并</h2>
      <div className="video-studio-track">
        {visible.map((clipId, index) => {
          const clip = VIDEO_CLIPS.find((item) => item.id === clipId);
          if (!clip) return null;
          const nextId = visible[index + 1];
          return (
            <div
              key={clipId}
              className={`video-studio-track-item ${dragId === clipId ? 'is-dragging' : ''}`}
              draggable
              onDragStart={(event) => {
                if ((event.target as HTMLElement).closest('button, select, label, input')) {
                  event.preventDefault();
                  return;
                }
                setDragId(clipId);
              }}
              onDragEnd={() => setDragId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (!dragId || dragId === clipId) return;
                moveClip(visible.indexOf(dragId), index);
                setDragId(null);
              }}
            >
              <div className="video-studio-track-clip">
                <strong>{clip.name}</strong>
                <span>{clip.range}</span>
                <div className="video-studio-card-actions">
                  <button type="button" className="btn soft" onClick={() => dispatch({ type: 'selectClip', clipId })}>
                    播放
                  </button>
                  <button type="button" className="btn soft" disabled={index === 0} onClick={() => moveClip(index, index - 1)}>
                    左移
                  </button>
                  <button
                    type="button"
                    className="btn soft"
                    disabled={index === visible.length - 1}
                    onClick={() => moveClip(index, index + 1)}
                  >
                    右移
                  </button>
                  <button type="button" className="btn soft" onClick={() => dispatch({ type: 'removeClip', clipId })}>
                    删除
                  </button>
                </div>
              </div>
              {nextId ? (
                <label className="video-studio-transition">
                  转场
                  <select
                    value={studio.transitions[clipId] || 'cut'}
                    onChange={(e) =>
                      dispatch({ type: 'setTransition', afterClipId: clipId, transition: e.target.value as VideoTransition })
                    }
                  >
                    <option value="cut">直接切换</option>
                    <option value="fade">淡入淡出</option>
                  </select>
                </label>
              ) : null}
            </div>
          );
        })}
      </div>
      {studio.removedClipIds.length ? (
        <div className="video-studio-removed">
          {studio.removedClipIds.map((clipId) => {
            const clip = VIDEO_CLIPS.find((item) => item.id === clipId);
            return (
              <button key={clipId} type="button" className="btn soft" onClick={() => dispatch({ type: 'restoreClip', clipId })}>
                恢复 {clip?.name}
              </button>
            );
          })}
        </div>
      ) : null}
      {playing ? <StudioPlayer src={VIDEO_STUDIO_FULL_URL} poster={firstFrameUrl(visible[0] || 'clip-1')} title="拼接预览" /> : null}
    </section>
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
        <li>主角形象：{meta.hero}</li>
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
          查看片段首帧
        </button>
        <button type="button" className="btn soft" onClick={() => dispatch({ type: 'goto', view: 'clips' })}>
          查看分段视频
        </button>
        <button type="button" className="btn soft" onClick={() => dispatch({ type: 'goto', view: 'clips' })}>
          调整拼接
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
      <p className="small meeting-surface-hint">意见可关联到完整视频、具体视频片段、具体时间点、分镜脚本或片段首帧。</p>
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
}: {
  studio: VideoStudioState;
  dispatch: (action: VideoStudioAction) => void;
}) {
  if (studio.view === 'hero' && studio.heroReady) return <HeroPanel studio={studio} dispatch={dispatch} />;
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

export function VideoStudioArtifacts({
  studio,
  onSelect,
}: {
  studio: VideoStudioState;
  onSelect: (view: VideoStudioState['view']) => void;
}) {
  const items = useMemo(
    () =>
      [
        studio.briefConfirmed ? { id: 'brief' as const, label: '视频需求' } : null,
        studio.heroReady ? { id: 'hero' as const, label: '主角形象' } : null,
        studio.storyboardReady ? { id: 'storyboard' as const, label: '分镜脚本' } : null,
        studio.framesReady ? { id: 'frames' as const, label: '片段首帧' } : null,
        studio.clipsReady ? { id: 'clips' as const, label: '分段视频' } : null,
        studio.finalReady ? { id: 'final' as const, label: '完整视频' } : null,
      ].filter(Boolean) as { id: VideoStudioState['view']; label: string }[],
    [studio]
  );

  if (!items.length) return null;
  return (
    <section className="video-studio-artifacts">
      <h4>视频产物</h4>
      <div className="video-studio-artifact-list">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`video-studio-artifact ${studio.view === item.id ? 'is-active' : ''}`}
            onClick={() => onSelect(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}
