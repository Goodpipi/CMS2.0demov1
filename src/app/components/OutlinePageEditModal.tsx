import { useEffect, useState } from 'react';

interface OutlinePageEditModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (instruction: string) => void;
}

export function OutlineStaticField({
  label,
  value,
  empty = '暂无',
}: {
  label: string;
  value?: string;
  empty?: string;
}) {
  const text = (value || '').trim();
  return (
    <div className="ppt-page-field">
      <span>{label}</span>
      <div className={`ppt-page-static ${text ? '' : 'is-empty'}`}>{text || empty}</div>
    </div>
  );
}

export function OutlineStaticList({
  label,
  items,
  empty = '暂无',
}: {
  label: string;
  items?: string[];
  empty?: string;
}) {
  const list = (items || []).map((item) => item.trim()).filter(Boolean);
  return (
    <div className="ppt-page-field">
      <span>{label}</span>
      {list.length ? (
        <ol className="ppt-page-static-list">
          {list.map((item, index) => (
            <li key={`${index}-${item}`}>{item}</li>
          ))}
        </ol>
      ) : (
        <div className="ppt-page-static is-empty">{empty}</div>
      )}
    </div>
  );
}

export function OutlinePageEditModal({ open, onCancel, onConfirm }: OutlinePageEditModalProps) {
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
        <h3 id="outline-edit-title">请告知AI您想如何修改本页大纲</h3>
        <textarea
          className="outline-edit-input"
          value={instruction}
          placeholder="例如：把核心结论提前，并补充一条随访建议"
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
