import { briefFieldsFor, type ContentBriefVariant } from '@/lib/contentBrief';
import type { ContentBrief } from '@/types/content';

interface ContentBriefPanelProps {
  brief: ContentBrief;
  onChange: (brief: ContentBrief) => void;
  onUpload: () => void;
  onRecommendLiterature: () => void;
  onNext: () => void;
  variant?: ContentBriefVariant;
}

export function ContentBriefPanel({
  brief,
  onChange,
  onUpload,
  onRecommendLiterature,
  onNext,
  variant = 'default',
}: ContentBriefPanelProps) {
  const evidence = variant === 'evidence';
  const fields = briefFieldsFor(variant);

  return (
    <div className="workspace-surface-panel content-brief-panel">
      <div className="topic-insight-title-row">
        <div className="content-brief-title-heading">
          <h1>任务提案</h1>
          {evidence ? null : (
            <div className="content-brief-title-tools">
              <button type="button" className="btn green" onClick={onRecommendLiterature}>
                相关文献推荐
              </button>
              <button type="button" className="btn blue" onClick={onUpload}>
                上传任务提案
              </button>
            </div>
          )}
        </div>
        <button type="button" className="btn primary topic-insight-copy-btn" onClick={onNext}>
          {evidence ? '生成详细大纲' : '下一步：生成故事线'}
        </button>
      </div>
      <div className="content-brief-fields">
        {fields.map(({ key, label, required, multiline, rows, options, wide }) => (
          <label
            key={key}
            className={multiline || wide ? 'content-brief-field is-wide' : 'content-brief-field'}
          >
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
