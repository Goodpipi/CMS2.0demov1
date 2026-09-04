interface StorylinePanelProps {
  value: string;
  onChange: (text: string) => void;
  onNext: () => void;
}

export function StorylinePanel({ value, onChange, onNext }: StorylinePanelProps) {
  return (
    <div className="workspace-surface-panel storyline-panel">
      <div className="topic-insight-title-row">
        <h1>故事线</h1>
        <button type="button" className="btn primary topic-insight-copy-btn" onClick={onNext}>
          下一步：生成页面级大纲
        </button>
      </div>
      <textarea
        className="storyline-editor"
        value={value}
        rows={22}
        spellCheck={false}
        placeholder="请编辑故事线"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
