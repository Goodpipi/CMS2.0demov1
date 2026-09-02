import { CONTENT_BRIEF_FIELDS } from '@/lib/contentBrief';
import type { ContentBrief } from '@/types/content';

interface ContentBriefPanelProps {
  brief: ContentBrief;
  onChange: (brief: ContentBrief) => void;
  onCopy: () => void;
}

export function ContentBriefPanel({ brief, onChange, onCopy }: ContentBriefPanelProps) {
  return (
    <div className="workspace-surface-panel content-brief-panel">
      <div className="topic-insight-title-row">
        <h1>内容 Brief</h1>
        <button type="button" className="btn primary topic-insight-copy-btn" onClick={onCopy}>
          一键复制
        </button>
      </div>
      <div className="content-brief-fields">
        {CONTENT_BRIEF_FIELDS.map(({ key, label }) => (
          <label key={key} className="content-brief-field">
            <span>{label}</span>
            {key === 'notes' || key === 'goal' || key === 'keyMessage' ? (
              <textarea
                className="input content-brief-textarea"
                value={brief[key]}
                rows={key === 'notes' ? 3 : 2}
                onChange={(event) => onChange({ ...brief, [key]: event.target.value })}
              />
            ) : (
              <input
                className="input"
                value={brief[key]}
                onChange={(event) => onChange({ ...brief, [key]: event.target.value })}
              />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
