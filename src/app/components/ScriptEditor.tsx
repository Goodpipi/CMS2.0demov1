import type { ReactNode } from 'react';

interface ScriptEditorProps {
  title?: string;
  value: string;
  onChange: (text: string) => void;
  readOnly?: boolean;
  footerActions?: ReactNode;
}

export function ScriptEditor({
  title = '话术总结',
  value,
  onChange,
  readOnly = false,
  footerActions,
}: ScriptEditorProps) {
  return (
    <div className="workspace-surface-panel script-editor">
      <div className="script-editor-toolbar">
        <strong>{title}</strong>
        <span>纯文字 · {readOnly ? '审阅预览' : '可直接在中间修改'}</span>
      </div>
      <div className="script-editor-paper-wrap">
        <textarea
          className="script-editor-paper"
          value={value}
          readOnly={readOnly}
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      {footerActions ? <div className="content-submit-actions script-editor-actions">{footerActions}</div> : null}
    </div>
  );
}
