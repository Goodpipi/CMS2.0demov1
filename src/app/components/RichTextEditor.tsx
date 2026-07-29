import { useEffect, useRef } from 'react';
import { Bold, Italic, List, ListOrdered, Quote, Redo2, Underline, Undo2 } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmittedRef = useRef('');

  useEffect(() => {
    if (!editorRef.current || value === lastEmittedRef.current) return;
    editorRef.current.innerHTML = value;
  }, [value]);

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    const html = editorRef.current?.innerHTML || '';
    lastEmittedRef.current = html;
    onChange(html);
  };

  const tools = [
    { label: '撤销', icon: Undo2, command: 'undo' },
    { label: '重做', icon: Redo2, command: 'redo' },
    { label: '加粗', icon: Bold, command: 'bold' },
    { label: '斜体', icon: Italic, command: 'italic' },
    { label: '下划线', icon: Underline, command: 'underline' },
    { label: '无序列表', icon: List, command: 'insertUnorderedList' },
    { label: '有序列表', icon: ListOrdered, command: 'insertOrderedList' },
    { label: '引用', icon: Quote, command: 'formatBlock', value: 'blockquote' },
  ] as const;

  return (
    <div className="rich-text-editor">
      <div className="rich-text-toolbar" aria-label="富文本工具栏">
        <select
          className="rich-text-format-select"
          defaultValue="p"
          onChange={(event) => runCommand('formatBlock', event.target.value)}
          aria-label="段落格式"
        >
          <option value="p">正文</option>
          <option value="h1">标题 1</option>
          <option value="h2">标题 2</option>
          <option value="h3">标题 3</option>
        </select>
        {tools.map(({ label, icon: Icon, command, value: commandValue }) => (
          <button
            key={label}
            type="button"
            className="rich-text-tool"
            title={label}
            aria-label={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand(command, commandValue)}
          >
            <Icon size={15} />
          </button>
        ))}
      </div>
      <div className="rich-text-paper-wrap">
        <div
          ref={editorRef}
          className="rich-text-paper"
          contentEditable
          suppressContentEditableWarning
          onInput={(event) => {
            const html = event.currentTarget.innerHTML;
            lastEmittedRef.current = html;
            onChange(html);
          }}
        />
      </div>
    </div>
  );
}
