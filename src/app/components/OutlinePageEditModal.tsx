import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { OutlineRefImage } from '@/types/content';

export function OutlineFieldHeader({
  label,
  showAi,
  aiActive,
  onAi,
}: {
  label: string;
  showAi?: boolean;
  aiActive?: boolean;
  onAi?: () => void;
}) {
  return (
    <div className="ppt-page-field-head">
      <span>{label}</span>
      {showAi && onAi ? (
        <button
          type="button"
          className={`ppt-page-ai-btn ${aiActive ? 'is-active' : ''}`}
          onClick={onAi}
        >
          AI修改
        </button>
      ) : null}
    </div>
  );
}

export function OutlineAiPrompt({
  value,
  placeholder,
  onChange,
  onSubmit,
  onCancel,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="outline-ai-prompt">
      <textarea
        className="outline-ai-prompt-input"
        value={value}
        placeholder={placeholder}
        autoFocus
        rows={3}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="outline-ai-prompt-actions">
        <button type="button" className="btn soft" onClick={onCancel}>
          取消
        </button>
        <button type="button" className="btn primary" disabled={!value.trim()} onClick={onSubmit}>
          按此修改
        </button>
      </div>
    </div>
  );
}

export function OutlineManualCiteImageForm({
  onCancel,
  onAdd,
}: {
  onCancel: () => void;
  onAdd: (input: { url: string; caption: string; source: string }) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [caption, setCaption] = useState('');
  const [source, setSource] = useState('');

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUrl(String(reader.result || ''));
      setFileName(file.name);
      setCaption((prev) => prev.trim() || file.name.replace(/\.[^.]+$/, ''));
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const canSubmit = Boolean(url && caption.trim() && source.trim());

  return (
    <div className="outline-manual-image-form">
      <strong>手动添加引用图片／截图</strong>
      <label className="ppt-page-field">
        <span>引用图片或截图</span>
        <div className="outline-manual-image-upload">
          <button type="button" className="btn soft" onClick={() => fileRef.current?.click()}>
            {url ? '重新选择图片' : '上传图片／截图'}
          </button>
          <em>{fileName || '请上传图片或截图'}</em>
        </div>
        {url ? <img className="outline-manual-image-preview" src={url} alt={caption || '待添加引用图'} /> : null}
        <input ref={fileRef} type="file" hidden accept="image/*" onChange={handleFile} />
      </label>
      <label className="ppt-page-field">
        <span>图片说明</span>
        <input
          className="input"
          value={caption}
          placeholder="请填写图片说明"
          onChange={(event) => setCaption(event.target.value)}
        />
      </label>
      <label className="ppt-page-field">
        <span>参考文献来源</span>
        <input
          className="input"
          value={source}
          placeholder="例如：Lancet Diabetes Endocrinol, 2024, 12(6): 412-418."
          onChange={(event) => setSource(event.target.value)}
        />
      </label>
      <div className="outline-ai-prompt-actions">
        <button type="button" className="btn soft" onClick={onCancel}>
          取消
        </button>
        <button
          type="button"
          className="btn primary"
          disabled={!canSubmit}
          onClick={() => onAdd({ url, caption: caption.trim(), source: source.trim() })}
        >
          添加到本页
        </button>
      </div>
    </div>
  );
}

interface OutlinePageEditModalProps {
  open: boolean;
  title?: string;
  placeholder?: string;
  onCancel: () => void;
  onConfirm: (instruction: string) => void;
}

export function OutlineCiteMarks({ cites }: { cites?: number[] }) {
  const nums = [...new Set((cites || []).filter((n) => Number.isFinite(n) && n > 0))];
  if (!nums.length) return null;
  return (
    <sup className="outline-cite" aria-label={`参考文献 ${nums.join('、')}`}>
      {nums.join(',')}
    </sup>
  );
}

export function OutlineStaticField({
  label,
  value,
  empty = '暂无',
  cites,
  showAi,
  aiActive,
  onAi,
  aiPrompt,
}: {
  label: string;
  value?: string;
  empty?: string;
  cites?: number[];
  showAi?: boolean;
  aiActive?: boolean;
  onAi?: () => void;
  aiPrompt?: ReactNode;
}) {
  const text = (value || '').trim();
  return (
    <div className={`ppt-page-field ${aiActive ? 'is-ai-active' : ''}`}>
      <OutlineFieldHeader label={label} showAi={showAi} aiActive={aiActive} onAi={onAi} />
      <div className={`ppt-page-static ${text ? '' : 'is-empty'}`}>
        {text ? (
          <>
            {text}
            <OutlineCiteMarks cites={cites} />
          </>
        ) : (
          empty
        )}
      </div>
      {aiPrompt}
    </div>
  );
}

export function OutlineStaticList({
  label,
  items,
  empty = '暂无',
  itemCites,
  numbered = true,
  showAi,
  aiActive,
  onAi,
  aiPrompt,
}: {
  label: string;
  items?: string[];
  empty?: string;
  itemCites?: number[][];
  numbered?: boolean;
  showAi?: boolean;
  aiActive?: boolean;
  onAi?: () => void;
  aiPrompt?: ReactNode;
}) {
  const list = (items || []).map((item) => item.trim()).filter(Boolean);
  const ListTag = numbered ? 'ol' : 'ul';
  return (
    <div className={`ppt-page-field ${aiActive ? 'is-ai-active' : ''}`}>
      <OutlineFieldHeader label={label} showAi={showAi} aiActive={aiActive} onAi={onAi} />
      {list.length ? (
        <ListTag className={`ppt-page-static-list ${numbered ? 'is-numbered' : 'is-plain'}`}>
          {list.map((item, index) => (
            <li key={`${index}-${item}`}>
              {numbered ? <span className="outline-ref-num">{index + 1}</span> : null}
              <span className="outline-ref-text">
                {item}
                <OutlineCiteMarks cites={itemCites?.[index]} />
              </span>
            </li>
          ))}
        </ListTag>
      ) : (
        <div className="ppt-page-static is-empty">{empty}</div>
      )}
      {aiPrompt}
    </div>
  );
}

export function OutlineReferencedImages({
  label = '引用图片',
  images,
  empty = '暂无引用图片',
  action,
}: {
  label?: string;
  images?: OutlineRefImage[];
  empty?: string;
  action?: ReactNode;
}) {
  const list = (images || []).filter((item) => item.url);
  return (
    <div className="ppt-page-field">
      <span>{label}</span>
      {list.length ? (
        <div className="outline-ref-images">
          {list.map((item, index) => (
            <figure key={`${item.url}-${index}`} className="outline-ref-image">
              <img src={item.url} alt={item.alt || item.caption || '引用图片'} />
              {item.cites?.length ? (
                <span className="outline-ref-image-badge" aria-label={`参考文献 ${item.cites.join('、')}`}>
                  {item.cites.join(',')}
                </span>
              ) : null}
              {item.caption ? (
                <figcaption>
                  {item.caption}
                  <OutlineCiteMarks cites={item.cites} />
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      ) : (
        <div className="ppt-page-static is-empty">{empty}</div>
      )}
      {action}
    </div>
  );
}

export function OutlinePageEditModal({
  open,
  title = '请告知AI您想如何修改本页大纲',
  placeholder = '例如：把核心结论提前，并补充一条随访建议',
  onCancel,
  onConfirm,
}: OutlinePageEditModalProps) {
  const [instruction, setInstruction] = useState('');

  useEffect(() => {
    if (open) setInstruction('');
  }, [open]);

  if (!open) return null;

  const trimmed = instruction.trim();

  return (
    <div
      className="modal-bg show"
      role="presentation"
      onClick={(event) => {
        if ((event.target as HTMLElement).classList.contains('modal-bg')) onCancel();
      }}
    >
      <div
        className="modal confirm-modal outline-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="outline-edit-title"
      >
        <h3 id="outline-edit-title">{title}</h3>
        <textarea
          className="outline-edit-input"
          value={instruction}
          placeholder={placeholder}
          autoFocus
          onChange={(event) => setInstruction(event.target.value)}
        />
        <div className="quick-row confirm-modal-actions">
          <button type="button" className="btn" onClick={onCancel}>
            取消
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={!trimmed}
            onClick={() => onConfirm(trimmed)}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
