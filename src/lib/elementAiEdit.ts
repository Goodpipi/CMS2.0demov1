import {
  applyElementProps,
  prepareEditableSvg,
  readElementProps,
  type SvgElementInfo,
} from '@/app/components/svgEditorUtils';

export interface ElementAiProps {
  text: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  fontSize: number;
  fontWeight: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  size?: number;
  rx: number;
  rotation: number;
  opacity: number;
}

const ELEMENT_AI_COLORS: { keys: string[]; value: string; label: string }[] = [
  { keys: ['拜耳蓝', '深蓝', '蓝色', '蓝'], value: '#103C8F', label: '拜耳蓝' },
  { keys: ['青绿', '绿色', '绿'], value: '#00A86B', label: '绿色' },
  { keys: ['红色', '红'], value: '#E53935', label: '红色' },
  { keys: ['橙色', '橙'], value: '#F57C00', label: '橙色' },
  { keys: ['黄色', '黄'], value: '#F9A825', label: '黄色' },
  { keys: ['紫色', '紫'], value: '#7B1FA2', label: '紫色' },
  { keys: ['白色', '白'], value: '#FFFFFF', label: '白色' },
  { keys: ['黑色', '黑'], value: '#111111', label: '黑色' },
  { keys: ['灰色', '灰'], value: '#757575', label: '灰色' },
];

export function toElementAiProps(p: ReturnType<typeof readElementProps>): ElementAiProps {
  return {
    text: p.text,
    fill: p.fill,
    stroke: p.stroke,
    strokeWidth: p.strokeWidth,
    fontSize: p.fontSize,
    fontWeight: p.fontWeight,
    x: p.x,
    y: p.y,
    width: p.width,
    height: p.height,
    size: p.size,
    rx: p.rx,
    rotation: p.rotation,
    opacity: p.opacity,
  };
}

/** 根据自然语言 prompt 推断对选中 SVG 元素的属性修改（演示用本地 AI） */
export function interpretElementAiPrompt(
  prompt: string,
  current: ElementAiProps,
  meta?: SvgElementInfo
): { patch: Partial<ElementAiProps>; summary: string } {
  const p = prompt.trim();
  const patch: Partial<ElementAiProps> = {};
  const notes: string[] = [];

  const hex = p.match(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/);
  if (hex) {
    patch.fill = hex[0];
    notes.push(`颜色 → ${hex[0]}`);
  } else {
    for (const entry of ELEMENT_AI_COLORS) {
      if (entry.keys.some((k) => p.includes(k))) {
        patch.fill = entry.value;
        notes.push(`颜色 → ${entry.label}`);
        break;
      }
    }
  }

  if (/加大|放大|更大|增大|字号大|变大/.test(p)) {
    if (meta?.isText || current.text) {
      patch.fontSize = Math.round(Math.min(96, current.fontSize * 1.28));
      notes.push('放大字号');
    }
    if (current.size != null) {
      patch.size = Math.round(current.size * 1.2);
      notes.push('放大尺寸');
    }
    if (current.width != null) patch.width = Math.round(current.width * 1.15);
    if (current.height != null) patch.height = Math.round(current.height * 1.15);
  } else if (/缩小|减小|更小|字号小|变小/.test(p)) {
    if (meta?.isText || current.text) {
      patch.fontSize = Math.round(Math.max(8, current.fontSize * 0.78));
      notes.push('缩小字号');
    }
    if (current.size != null) {
      patch.size = Math.round(Math.max(4, current.size * 0.82));
      notes.push('缩小尺寸');
    }
    if (current.width != null) patch.width = Math.round(Math.max(8, current.width * 0.85));
    if (current.height != null) patch.height = Math.round(Math.max(8, current.height * 0.85));
  }

  if (/加粗|粗体|加厚/.test(p)) {
    patch.fontWeight = '700';
    notes.push('加粗');
  } else if (/细体|变细|正常字重|取消加粗/.test(p)) {
    patch.fontWeight = '400';
    notes.push('字重正常');
  }

  if (/半透明|更透明|透明度/.test(p) && !/不透明/.test(p)) {
    patch.opacity = 0.55;
    notes.push('半透明');
  } else if (/不透明|实心|取消透明/.test(p)) {
    patch.opacity = 1;
    notes.push('不透明');
  }

  const quoted =
    p.match(/[「『“"']([^」』”"']+)[」』”"']/) ||
    p.match(/(?:改成|改为|换成|文案为|文字为|内容为)\s*(.+)$/);
  if ((meta?.isText || current.text) && quoted?.[1]) {
    const nextText = quoted[1].trim().replace(/[。.!！]$/, '');
    if (nextText) {
      patch.text = nextText;
      notes.push(`文案 → ${nextText}`);
    }
  }

  if (Object.keys(patch).length === 0) {
    if (meta?.isText || current.text) {
      patch.fontWeight = current.fontWeight === '700' ? '700' : '600';
      patch.fontSize = Math.round(current.fontSize * 1.04);
      notes.push('已按提示微调字重与字号');
    } else {
      patch.opacity = Math.min(1, Math.max(0.7, Number((current.opacity * 0.92).toFixed(2))));
      if (!patch.fill) patch.fill = current.fill;
      notes.push('已按提示微调视觉样式');
    }
  }

  return { patch, summary: notes.join('；') || '已应用 AI 修改' };
}

/** 对整段 SVG 中指定元素执行本地 AI 修改，返回更新后的 SVG */
export function applyElementAiToSvg(
  svgMarkup: string,
  elementId: string,
  prompt: string
): { svg: string; summary: string; elementLabel: string } | null {
  const prepared = prepareEditableSvg(svgMarkup);
  const doc = new DOMParser().parseFromString(prepared.svg, 'image/svg+xml');
  if (doc.querySelector('parsererror')) return null;
  const el = doc.querySelector(`[data-edit-id="${CSS.escape(elementId)}"]`);
  if (!el) return null;
  const meta = prepared.elements.find((item) => item.id === elementId);
  if (meta?.isBackground) return null;
  const current = toElementAiProps(readElementProps(el));
  const { patch, summary } = interpretElementAiPrompt(prompt, current, meta);
  applyElementProps(el, patch);
  const root = doc.documentElement;
  root.querySelectorAll('.svg-edit-selected').forEach((node) => {
    node.classList.remove('svg-edit-selected');
  });
  return {
    svg: new XMLSerializer().serializeToString(root),
    summary,
    elementLabel: meta?.label || elementId,
  };
}
