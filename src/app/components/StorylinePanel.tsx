interface StorylinePanelProps {
  value: string;
  onChange: (text: string) => void;
  onRecommendLiterature: () => void;
  onNext: () => void;
  nextLabel?: string;
}

export function StorylinePanel({
  value,
  onChange,
  onRecommendLiterature,
  onNext,
  nextLabel = '下一步：生成页面脚本',
}: StorylinePanelProps) {
  return (
    <div className="workspace-surface-panel storyline-panel">
      <div className="topic-insight-title-row">
        <div className="content-brief-title-heading">
          <h1>故事线/大纲</h1>
          <button type="button" className="btn green" onClick={onRecommendLiterature}>
            相关文献推荐
          </button>
        </div>
        <button type="button" className="btn primary topic-insight-copy-btn" onClick={onNext}>
          {nextLabel}
        </button>
      </div>
      <textarea
        className="storyline-editor"
        value={value}
        rows={22}
        spellCheck={false}
        placeholder="请编辑故事线/大纲"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
