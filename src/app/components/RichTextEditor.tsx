import { useEffect, useRef, type ReactNode } from 'react';
import { Bold, Italic, List, ListOrdered, Quote, Redo2, Underline, Undo2 } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  /** 底部操作区：下载 / 团队审阅 / Veeva（由工作台注入） */
  footerActions?: ReactNode;
}

/** 导出保留排版的独立 HTML 文件正文样式 */
export const RICH_TEXT_EXPORT_STYLES = `
  body { margin: 0; padding: 40px 48px; font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; color: #24364a; line-height: 1.85; background: #f5f8fb; }
  .rich-text-export { max-width: 760px; margin: 0 auto; padding: 36px 40px; background: #fff; box-shadow: 0 8px 28px rgba(23, 51, 79, .14); }
  h1 { margin: 0 0 20px; color: #103c8f; font-size: 29px; line-height: 1.3; }
  h2 { margin: 28px 0 12px; color: #204b72; font-size: 19px; }
  h3 { margin: 22px 0 10px; color: #2a5678; font-size: 16px; }
  p { margin: 0 0 14px; }
  ul, ol { margin: 10px 0 18px; padding-left: 24px; }
  blockquote { margin: 22px 0; padding: 14px 18px; border-left: 4px solid #4a9ee0; background: #eef7fe; color: #36556f; }
  .rich-text-lead { color: #546d83; font-size: 15.5px; }
  .rich-text-callout { margin: 22px 0; padding: 15px 18px; border-radius: 10px; background: linear-gradient(135deg, #edf7ff, #f0f8ed); }
  .rich-text-disclaimer { margin-top: 28px; color: #7a8fa3; font-size: 12px; }
`.trim();

export function buildRichTextHtmlDocument(content: string, title = '图文内容'): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title.replace(/</g, '&lt;')}</title>
<style>${RICH_TEXT_EXPORT_STYLES}</style>
</head>
<body>
<article class="rich-text-export">${content}</article>
</body>
</html>`;
}

export function RichTextEditor({ value, onChange, footerActions }: RichTextEditorProps) {
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
      {footerActions ? <div className="content-submit-actions rich-text-footer-actions">{footerActions}</div> : null}
    </div>
  );
}
