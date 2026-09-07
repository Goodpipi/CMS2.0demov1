import { useState } from 'react';

interface AddMeetingSessionModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function AddMeetingSessionModal({ open, onClose, onCreate }: AddMeetingSessionModalProps) {
  const [name, setName] = useState('');
  if (!open) return null;

  const submit = () => {
    const next = name.trim();
    if (!next) return;
    onCreate(next);
    setName('');
  };

  return (
    <div
      className="modal-bg show"
      role="presentation"
      onClick={(event) => {
        if ((event.target as HTMLElement).classList.contains('modal-bg')) onClose();
      }}
    >
      <div className="modal confirm-modal meeting-session-modal" role="dialog" aria-modal="true">
        <h3>新增会议场次</h3>
        <label className="meeting-session-field">
          <span>
            场次名称<em className="content-brief-required">*</em>
          </span>
          <input
            className="input"
            value={name}
            placeholder="例如：上海场、北京场、广州区域会"
            autoFocus
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submit();
              }
            }}
          />
        </label>
        <div className="quick-row confirm-modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            取消
          </button>
          <button type="button" className="btn primary" disabled={!name.trim()} onClick={submit}>
            创建场次
          </button>
        </div>
      </div>
    </div>
  );
}
