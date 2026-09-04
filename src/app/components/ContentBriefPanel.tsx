import { CONTENT_BRIEF_FIELDS } from '@/lib/contentBrief';
import type { ContentBrief } from '@/types/content';

interface ContentBriefPanelProps {
  brief: ContentBrief;
  onChange: (brief: ContentBrief) => void;
  onUpload: () => void;
  onNext: () => void;
}

export function ContentBriefPanel({ brief, onChange, onUpload, onNext }: ContentBriefPanelProps) {
  return (
    <div className="workspace-surface-panel content-brief-panel">
      <div className="topic-insight-title-row">
        <div className="content-brief-title-block">
          <h1>任务提案</h1>
          <button type="button" className="btn primary" onClick={onUpload}>
            上传任务提案
          </button>
        </div>
        <button type="button" className="btn primary topic-insight-copy-btn" onClick={onNext}>
          下一步：相关文献推荐
        </button>
      </div>
      <div className="content-brief-fields">
        {CONTENT_BRIEF_FIELDS.map(({ key, label, required, multiline, rows, options }) => (
          <label key={key} className={multiline ? 'content-brief-field is-wide' : 'content-brief-field'}>
            <span>
              {label}
              {required ? <em className="content-brief-required">*</em> : null}
            </span>
            {options ? (
              <select
                className="input content-brief-select"
                value={brief[key]}
                onChange={(event) => onChange({ ...brief, [key]: event.target.value })}
              >
                <option value="">请选择{label}</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : multiline ? (
              <textarea
                className="input content-brief-textarea"
                value={brief[key]}
                rows={rows ?? 3}
                placeholder={`请输入${label}`}
                onChange={(event) => onChange({ ...brief, [key]: event.target.value })}
              />
            ) : (
              <input
                className="input"
                value={brief[key]}
                placeholder={`请输入${label}`}
                onChange={(event) => onChange({ ...brief, [key]: event.target.value })}
              />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
