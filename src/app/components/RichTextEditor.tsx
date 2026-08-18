import { useEffect, useRef, type ReactNode } from 'react';
import { Bold, ImagePlus, Italic, List, ListOrdered, Redo2, Underline, Undo2 } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  /** 底部操作区：下载 / 团队审阅 / Veeva（由工作台注入） */
  footerActions?: ReactNode;
}

const MOCK_INSERT_IMAGE = '/demo-assets/CaseCard_Result_01.PNG';

/** 导出保留排版的独立 HTML 文件正文样式 */
export const RICH_TEXT_EXPORT_STYLES = `
  body { margin: 0; padding: 40px 48px; font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; color: #24364a; line-height: 1.85; background: #f5f8fb; }
  .rich-text-export { max-width: 760px; margin: 0 auto; padding: 36px 40px; background: #fff; box-shadow: 0 8px 28px rgba(23, 51, 79, .14); }
  h1 { margin: 0 0 20px; color: #103c8f; font-size: 29px; line-height: 1.3; }
  h2 { margin: 28px 0 12px; color: #204b72; font-size: 19px; }
  h3 { margin: 22px 0 10px; color: #2a5678; font-size: 16px; }
  p { margin: 0 0 14px; }
  ul, ol { margin: 10px 0 18px; padding-left: 24px; }
  .rich-text-lead { color: #546d83; font-size: 15.5px; }
  .rich-text-disclaimer { margin-top: 28px; color: #7a8fa3; font-size: 12px; }
  .rich-text-figure { margin: 18px 0; }
  .rich-text-figure img { display: block; width: 100%; border-radius: 12px; }
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

function wrapBareImages(root: HTMLElement) {
  root.querySelectorAll('img').forEach((img) => {
    if (img.closest('.rich-text-figure')) return;
    const figure = document.createElement('figure');
    figure.className = 'rich-text-figure';
    img.parentNode?.insertBefore(figure, img);
    figure.appendChild(img);
  });
}

function enhanceFigures(root: HTMLElement) {
  wrapBareImages(root);
  root.querySelectorAll<HTMLElement>('.rich-text-figure').forEach((figure) => {
    figure.setAttribute('contenteditable', 'false');
    figure.setAttribute('draggable', 'true');
    const img = figure.querySelector('img');
    if (img) img.draggable = false;
  });
}

function createFigure(src: string, alt = '图文配图') {
  const figure = document.createElement('figure');
  figure.className = 'rich-text-figure';
  figure.setAttribute('contenteditable', 'false');
  figure.setAttribute('draggable', 'true');
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.draggable = false;
  figure.appendChild(img);
  return figure;
}

export function RichTextEditor({ value, onChange, footerActions }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmittedRef = useRef('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<HTMLImageElement | null>(null);
  const dragFigureRef = useRef<HTMLElement | null>(null);
  const dragMovedRef = useRef(false);

  const emitChange = () => {
    const html = editorRef.current?.innerHTML || '';
    lastEmittedRef.current = html;
    onChange(html);
  };

  useEffect(() => {
    if (!editorRef.current || value === lastEmittedRef.current) return;
    editorRef.current.innerHTML = value;
    enhanceFigures(editorRef.current);
  }, [value]);

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  };

  const openReplacePicker = (img: HTMLImageElement) => {
    replaceTargetRef.current = img;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const applyImageFile = (file: File, img: HTMLImageElement | null) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || '');
      if (!src) return;
      if (img) {
        img.src = src;
      } else if (editorRef.current) {
        editorRef.current.appendChild(createFigure(src, file.name));
      }
      enhanceFigures(editorRef.current!);
      emitChange();
    };
    reader.readAsDataURL(file);
  };

  const insertMockImage = () => {
    editorRef.current?.appendChild(createFigure(MOCK_INSERT_IMAGE));
    enhanceFigures(editorRef.current!);
    emitChange();
  };

  const tools = [
    { label: '撤销', icon: Undo2, command: 'undo' },
    { label: '重做', icon: Redo2, command: 'redo' },
    { label: '加粗', icon: Bold, command: 'bold' },
    { label: '斜体', icon: Italic, command: 'italic' },
    { label: '下划线', icon: Underline, command: 'underline' },
    { label: '无序列表', icon: List, command: 'insertUnorderedList' },
    { label: '有序列表', icon: ListOrdered, command: 'insertOrderedList' },
  ] as const;

  return (
    <div className="workspace-surface-panel rich-text-editor">
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
        {tools.map(({ label, icon: Icon, command }) => (
          <button
            key={label}
            type="button"
            className="rich-text-tool"
            title={label}
            aria-label={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand(command)}
          >
            <Icon size={15} />
          </button>
        ))}
        <button
          type="button"
          className="rich-text-tool"
          title="插入图片"
          aria-label="插入图片"
          onMouseDown={(event) => event.preventDefault()}
          onClick={insertMockImage}
        >
          <ImagePlus size={15} />
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) applyImageFile(file, replaceTargetRef.current);
          replaceTargetRef.current = null;
        }}
      />
      <div className="rich-text-paper-wrap">
        <div
          ref={editorRef}
          className="rich-text-paper"
          contentEditable
          suppressContentEditableWarning
          onInput={() => emitChange()}
          onClick={(event) => {
            if (dragMovedRef.current) {
              dragMovedRef.current = false;
              return;
            }
            const figure = (event.target as HTMLElement).closest('.rich-text-figure');
            const img = figure?.querySelector('img');
            if (img) {
              event.preventDefault();
              openReplacePicker(img);
            }
          }}
          onDragStart={(event) => {
            const figure = (event.target as HTMLElement).closest('.rich-text-figure');
            if (!figure) return;
            dragFigureRef.current = figure;
            dragMovedRef.current = false;
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', 'rich-text-figure');
          }}
          onDrag={(event) => {
            if (Math.abs(event.movementX) + Math.abs(event.movementY) > 2) {
              dragMovedRef.current = true;
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            const figure = (event.target as HTMLElement).closest('.rich-text-figure');
            editorRef.current?.querySelectorAll('.rich-text-figure.is-drop-target').forEach((node) => {
              node.classList.remove('is-drop-target');
            });
            if (figure && figure !== dragFigureRef.current) {
              figure.classList.add('is-drop-target');
            }
            event.dataTransfer.dropEffect = Array.from(event.dataTransfer.types).includes('Files')
              ? 'copy'
              : 'move';
          }}
          onDrop={(event) => {
            event.preventDefault();
            editorRef.current?.querySelectorAll('.rich-text-figure.is-drop-target').forEach((node) => {
              node.classList.remove('is-drop-target');
            });
            const targetFigure = (event.target as HTMLElement).closest('.rich-text-figure');
            const file = event.dataTransfer.files?.[0];
            if (file?.type.startsWith('image/')) {
              applyImageFile(file, targetFigure?.querySelector('img') || null);
              dragFigureRef.current = null;
              return;
            }
            const source = dragFigureRef.current;
            if (source && targetFigure && source !== targetFigure && editorRef.current?.contains(targetFigure)) {
              const rect = targetFigure.getBoundingClientRect();
              const placeAfter = event.clientY > rect.top + rect.height / 2;
              if (placeAfter) {
                targetFigure.after(source);
              } else {
                targetFigure.before(source);
              }
              emitChange();
            }
            dragFigureRef.current = null;
          }}
          onDragEnd={() => {
            editorRef.current?.querySelectorAll('.rich-text-figure.is-drop-target').forEach((node) => {
              node.classList.remove('is-drop-target');
            });
            dragFigureRef.current = null;
          }}
        />
      </div>
      {footerActions ? <div className="content-submit-actions rich-text-footer-actions">{footerActions}</div> : null}
    </div>
  );
}
