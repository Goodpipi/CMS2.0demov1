const EDITABLE_TAGS = new Set([
  'text',
  'tspan',
  'rect',
  'circle',
  'ellipse',
  'path',
  'line',
  'polyline',
  'polygon',
  'image',
  'g',
]);

export interface SvgElementInfo {
  id: string;
  tag: string;
  label: string;
  isText: boolean;
  isBackground?: boolean;
}

export type InsertShapeType =
  | 'text'
  | 'rect'
  | 'roundedRect'
  | 'circle'
  | 'ellipse'
  | 'line'
  | 'arrow';

export type LayerDirection = 'front' | 'back' | 'forward' | 'backward';

function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

/** 从 data:image/svg+xml URL 解码出 SVG 字符串（支持 url 编码与 base64） */
export function parseSvgFromDataUrl(src: string): string | undefined {
  if (!src.startsWith('data:image/svg+xml')) return undefined;
  const comma = src.indexOf(',');
  if (comma < 0) return undefined;
  const payload = src.slice(comma + 1);
  const isBase64 = /;base64/i.test(src.slice(0, comma));
  if (isBase64) {
    try {
      return atob(payload);
    } catch {
      return undefined;
    }
  }
  try {
    return decodeURIComponent(payload);
  } catch {
    try {
      return decodeURIComponent(payload.replace(/\+/g, ' '));
    } catch {
      return undefined;
    }
  }
}

export function isValidSvgMarkup(svgString: string): boolean {
  const trimmed = svgString.trim();
  if (!trimmed || !trimmed.includes('<svg')) return false;
  const doc = new DOMParser().parseFromString(trimmed, 'image/svg+xml');
  if (doc.querySelector('parsererror')) return false;
  return doc.documentElement?.tagName?.toLowerCase() === 'svg';
}

export function resolveEditableSvgSource(imageSrc: string, initialSvg?: string): string | undefined {
  const fromInitial = initialSvg?.trim();
  if (fromInitial && isValidSvgMarkup(fromInitial)) return fromInitial;
  const fromUrl = parseSvgFromDataUrl(imageSrc);
  if (fromUrl && isValidSvgMarkup(fromUrl)) return fromUrl;
  if (imageSrc && !imageSrc.startsWith('data:image/svg+xml')) {
    return wrapRasterAsSvg(imageSrc);
  }
  return undefined;
}

export function wrapRasterAsSvg(imageSrc: string, w = 900, h = 560): string {
  const href = escapeXmlAttr(imageSrc);
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}"><image data-edit-id="el-bg" xlink:href="${href}" href="${href}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/></svg>`;
}

export function prepareEditableSvg(svgString: string): { svg: string; elements: SvgElementInfo[] } {
  const doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
  const root = doc.documentElement;
  const elements: SvgElementInfo[] = [];
  let counter = 0;

  const walk = (el: Element) => {
    if (el.closest('defs, clipPath, mask, symbol')) return;
    const tag = el.tagName.toLowerCase();
    if (EDITABLE_TAGS.has(tag)) {
      let id = el.getAttribute('data-edit-id');
      if (!id) {
        id = `el-${counter++}`;
        el.setAttribute('data-edit-id', id);
      }
      const isText = tag === 'text' || tag === 'tspan';
      const textPreview = isText ? (el.textContent || '').trim().slice(0, 24) : '';
      const label = isText
        ? `文本: ${textPreview || '(空)'}`
        : `${tag}${el.getAttribute('fill') ? '' : ''} #${id.replace('el-', '')}`;
      elements.push({
        id,
        tag,
        label,
        isText,
        isBackground: id === 'el-bg',
      });
    }
    Array.from(el.children).forEach(walk);
  };

  walk(root);
  if (!root.getAttribute('xmlns')) root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  return {
    svg: new XMLSerializer().serializeToString(root),
    elements,
  };
}

export function serializeSvgFromContainer(container: HTMLElement): string {
  const svg = container.querySelector('svg');
  if (!svg) return '';
  const clone = svg.cloneNode(true) as SVGElement;
  clone.querySelectorAll('.svg-edit-selection-box').forEach((n) => n.remove());
  clone.querySelectorAll('[class]').forEach((n) => {
    n.classList.remove('svg-edit-selected');
  });
  return new XMLSerializer().serializeToString(clone);
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function getTranslate(el: Element): { x: number; y: number } {
  const t = el.getAttribute('transform') || '';
  const m = t.match(/translate\(\s*([-\d.]+)(?:[,\s]+([-\d.]+))?\s*\)/);
  if (m) return { x: parseFloat(m[1]) || 0, y: parseFloat(m[2] ?? m[1]) || 0 };
  return { x: 0, y: 0 };
}

export function setTranslate(el: Element, x: number, y: number) {
  const rest = (el.getAttribute('transform') || '')
    .replace(/translate\([^)]*\)/g, '')
    .trim();
  const translate = `translate(${x}, ${y})`;
  el.setAttribute('transform', rest ? `${translate} ${rest}` : translate);
}

export function getRotation(el: Element): number {
  const t = el.getAttribute('transform') || '';
  const m = t.match(/rotate\(\s*([-\d.]+)/);
  return m ? parseFloat(m[1]) || 0 : 0;
}

export function setRotation(el: Element, deg: number) {
  const t = el.getAttribute('transform') || '';
  const withoutRotate = t.replace(/rotate\([^)]*\)/g, '').trim();
  const rotate = `rotate(${deg})`;
  el.setAttribute('transform', withoutRotate ? `${withoutRotate} ${rotate}` : rotate);
}

export function readElementProps(el: Element) {
  const tag = el.tagName.toLowerCase();
  const isText = tag === 'text' || tag === 'tspan';
  const fill = el.getAttribute('fill') || el.getAttribute('stroke') || '#103C8F';
  const fontSize = parseFloat(el.getAttribute('font-size') || '16') || 16;
  const { x: tx, y: ty } = getTranslate(el);

  let x = parseFloat(el.getAttribute('x') || '0') + tx;
  let y = parseFloat(el.getAttribute('y') || '0') + ty;
  let width: number | undefined;
  let height: number | undefined;
  let size: number | undefined;

  if (tag === 'rect') {
    width = parseFloat(el.getAttribute('width') || '0') || undefined;
    height = parseFloat(el.getAttribute('height') || '0') || undefined;
    x = parseFloat(el.getAttribute('x') || '0') + tx;
    y = parseFloat(el.getAttribute('y') || '0') + ty;
  } else if (tag === 'circle') {
    size = parseFloat(el.getAttribute('r') || '0') || undefined;
    x = parseFloat(el.getAttribute('cx') || '0') + tx;
    y = parseFloat(el.getAttribute('cy') || '0') + ty;
  } else if (tag === 'ellipse') {
    width = (parseFloat(el.getAttribute('rx') || '0') || 0) * 2;
    height = (parseFloat(el.getAttribute('ry') || '0') || 0) * 2;
    size = parseFloat(el.getAttribute('rx') || '0') || undefined;
    x = parseFloat(el.getAttribute('cx') || '0') + tx;
    y = parseFloat(el.getAttribute('cy') || '0') + ty;
  } else if (tag === 'image') {
    width = parseFloat(el.getAttribute('width') || '0') || undefined;
    height = parseFloat(el.getAttribute('height') || '0') || undefined;
    x = parseFloat(el.getAttribute('x') || '0') + tx;
    y = parseFloat(el.getAttribute('y') || '0') + ty;
  } else if (tag === 'line') {
    x = parseFloat(el.getAttribute('x1') || '0') + tx;
    y = parseFloat(el.getAttribute('y1') || '0') + ty;
  }

  const stroke = el.getAttribute('stroke') || '';
  const strokeWidth = parseFloat(el.getAttribute('stroke-width') || '0') || 0;
  const rx = parseFloat(el.getAttribute('rx') || '0') || 0;
  const rotation = getRotation(el);
  const fontWeight = el.getAttribute('font-weight') || '400';

  return {
    tag,
    isText: isText,
    text: isText ? el.textContent || '' : '',
    fill: fill === 'none' ? '#000000' : fill,
    stroke: stroke || '#103C8F',
    strokeWidth,
    fontSize,
    fontWeight,
    x,
    y,
    width,
    height,
    size,
    rx,
    rotation,
    opacity: parseFloat(el.getAttribute('opacity') || '1') || 1,
  };
}

export function applyElementProps(
  el: Element,
  props: Partial<{
    text: string;
    fill: string;
    fontSize: number;
    x: number;
    y: number;
    width: number;
    height: number;
    size: number;
    opacity: number;
    stroke: string;
    strokeWidth: number;
    rx: number;
    rotation: number;
    fontWeight: string;
  }>
) {
  const tag = el.tagName.toLowerCase();

  if (props.fill != null) {
    if (tag === 'line' || tag === 'path') {
      if (el.getAttribute('fill') && el.getAttribute('fill') !== 'none') el.setAttribute('fill', props.fill);
      else el.setAttribute('stroke', props.fill);
    } else {
      el.setAttribute('fill', props.fill);
    }
  }

  if (props.stroke != null && (tag === 'line' || tag === 'path' || tag === 'rect' || tag === 'circle')) {
    el.setAttribute('stroke', props.stroke);
  }

  if (props.strokeWidth != null && (tag === 'line' || tag === 'path' || tag === 'rect')) {
    el.setAttribute('stroke-width', String(props.strokeWidth));
  }

  if (props.rx != null && tag === 'rect') {
    el.setAttribute('rx', String(props.rx));
    el.setAttribute('ry', String(props.rx));
  }

  if (props.rotation != null) {
    setRotation(el, props.rotation);
  }

  if (props.fontWeight != null && (tag === 'text' || tag === 'tspan')) {
    el.setAttribute('font-weight', props.fontWeight);
  }

  if (props.opacity != null) el.setAttribute('opacity', String(props.opacity));

  if (props.fontSize != null && (tag === 'text' || tag === 'tspan')) {
    el.setAttribute('font-size', String(props.fontSize));
  }

  if (props.text != null && (tag === 'text' || tag === 'tspan')) {
    el.textContent = props.text;
  }

  const { x: tx, y: ty } = getTranslate(el);

  if (props.x != null || props.y != null) {
    const cur = readElementProps(el);
    const nx = props.x ?? cur.x;
    const ny = props.y ?? cur.y;

    if (tag === 'text' || tag === 'tspan') {
      el.setAttribute('x', String(nx - tx));
      el.setAttribute('y', String(ny - ty));
    } else if (tag === 'rect' || tag === 'image') {
      el.setAttribute('x', String(nx - tx));
      el.setAttribute('y', String(ny - ty));
    } else if (tag === 'circle') {
      el.setAttribute('cx', String(nx - tx));
      el.setAttribute('cy', String(ny - ty));
    } else if (tag === 'ellipse') {
      el.setAttribute('cx', String(nx - tx));
      el.setAttribute('cy', String(ny - ty));
    } else {
      setTranslate(el, (props.x ?? cur.x) - (parseFloat(el.getAttribute('x') || '0') || 0), (props.y ?? cur.y) - (parseFloat(el.getAttribute('y') || '0') || 0));
    }
  }

  if (props.width != null) {
    if (tag === 'rect' || tag === 'image') el.setAttribute('width', String(props.width));
    if (tag === 'ellipse') el.setAttribute('rx', String(props.width / 2));
  }
  if (props.height != null) {
    if (tag === 'rect' || tag === 'image') el.setAttribute('height', String(props.height));
    if (tag === 'ellipse') el.setAttribute('ry', String(props.height / 2));
  }
  if (props.size != null && tag === 'circle') el.setAttribute('r', String(props.size));
  if (props.size != null && tag === 'text') el.setAttribute('font-size', String(props.size));
}

export function collectElementList(container: HTMLElement): SvgElementInfo[] {
  const svg = container.querySelector('svg');
  if (!svg) return [];
  const elements: SvgElementInfo[] = [];
  svg.querySelectorAll('[data-edit-id]').forEach((el) => {
    const id = el.getAttribute('data-edit-id');
    if (!id) return;
    const tag = el.tagName.toLowerCase();
    const isText = tag === 'text' || tag === 'tspan';
    const textPreview = isText ? (el.textContent || '').trim().slice(0, 24) : '';
    const label = isText
      ? `文本: ${textPreview || '(空)'}`
      : tag === 'image'
        ? `图片 #${id.replace('el-', '')}`
        : `${tag} #${id.replace('el-', '')}`;
    elements.push({
      id,
      tag,
      label,
      isText,
      isBackground: id === 'el-bg',
    });
  });
  return elements;
}

export function nextEditId(container: HTMLElement): string {
  let max = 0;
  container.querySelectorAll('[data-edit-id]').forEach((el) => {
    const id = el.getAttribute('data-edit-id') || '';
    const m = id.match(/^el-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return `el-${max + 1}`;
}

export function clientToSvgPoint(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const svgPt = pt.matrixTransform(ctm.inverse());
  return { x: Math.round(svgPt.x), y: Math.round(svgPt.y) };
}

export function createInsertShape(
  svg: SVGSVGElement,
  type: InsertShapeType,
  point: { x: number; y: number },
  id: string
): SvgElementInfo {
  const ns = 'http://www.w3.org/2000/svg';
  const doc = svg.ownerDocument;
  let el: SVGElement;

  switch (type) {
    case 'text':
      el = doc.createElementNS(ns, 'text');
      el.setAttribute('x', String(point.x));
      el.setAttribute('y', String(point.y));
      el.setAttribute('fill', '#103C8F');
      el.setAttribute('font-size', '28');
      el.setAttribute('font-weight', '700');
      el.textContent = '新文字';
      break;
    case 'rect':
      el = doc.createElementNS(ns, 'rect');
      el.setAttribute('x', String(point.x - 80));
      el.setAttribute('y', String(point.y - 40));
      el.setAttribute('width', '160');
      el.setAttribute('height', '80');
      el.setAttribute('fill', '#69BE28');
      el.setAttribute('opacity', '0.88');
      break;
    case 'roundedRect':
      el = doc.createElementNS(ns, 'rect');
      el.setAttribute('x', String(point.x - 90));
      el.setAttribute('y', String(point.y - 36));
      el.setAttribute('width', '180');
      el.setAttribute('height', '72');
      el.setAttribute('rx', '16');
      el.setAttribute('ry', '16');
      el.setAttribute('fill', '#103C8F');
      el.setAttribute('opacity', '0.92');
      break;
    case 'circle':
      el = doc.createElementNS(ns, 'circle');
      el.setAttribute('cx', String(point.x));
      el.setAttribute('cy', String(point.y));
      el.setAttribute('r', '48');
      el.setAttribute('fill', '#1d6bff');
      el.setAttribute('opacity', '0.35');
      break;
    case 'ellipse':
      el = doc.createElementNS(ns, 'ellipse');
      el.setAttribute('cx', String(point.x));
      el.setAttribute('cy', String(point.y));
      el.setAttribute('rx', '70');
      el.setAttribute('ry', '40');
      el.setAttribute('fill', '#69BE28');
      el.setAttribute('opacity', '0.3');
      break;
    case 'line':
      el = doc.createElementNS(ns, 'line');
      el.setAttribute('x1', String(point.x - 80));
      el.setAttribute('y1', String(point.y));
      el.setAttribute('x2', String(point.x + 80));
      el.setAttribute('y2', String(point.y));
      el.setAttribute('stroke', '#103C8F');
      el.setAttribute('stroke-width', '4');
      el.setAttribute('stroke-linecap', 'round');
      el.setAttribute('fill', 'none');
      break;
    case 'arrow':
      el = doc.createElementNS(ns, 'path');
      el.setAttribute(
        'd',
        `M ${point.x - 90} ${point.y} L ${point.x + 60} ${point.y} L ${point.x + 42} ${point.y - 14} M ${point.x + 60} ${point.y} L ${point.x + 42} ${point.y + 14}`
      );
      el.setAttribute('stroke', '#103C8F');
      el.setAttribute('stroke-width', '4');
      el.setAttribute('stroke-linecap', 'round');
      el.setAttribute('stroke-linejoin', 'round');
      el.setAttribute('fill', 'none');
      break;
    default:
      el = doc.createElementNS(ns, 'rect');
  }

  el.setAttribute('data-edit-id', id);
  svg.appendChild(el);
  const tag = el.tagName.toLowerCase();
  return {
    id,
    tag,
    label: tag === 'text' ? '文本: 新文字' : `${tag} #${id.replace('el-', '')}`,
    isText: tag === 'text',
    isBackground: false,
  };
}

export function createInsertImage(
  svg: SVGSVGElement,
  href: string,
  id: string,
  naturalSize: { width: number; height: number }
): SvgElementInfo {
  const ns = 'http://www.w3.org/2000/svg';
  const xlink = 'http://www.w3.org/1999/xlink';
  if (!svg.getAttribute('xmlns:xlink')) {
    svg.setAttribute('xmlns:xlink', xlink);
  }
  const vb = svg.viewBox?.baseVal;
  const canvasW = vb && vb.width > 0 ? vb.width : svg.clientWidth || 900;
  const canvasH = vb && vb.height > 0 ? vb.height : svg.clientHeight || 560;
  const ratio = naturalSize.width > 0 && naturalSize.height > 0
    ? naturalSize.width / naturalSize.height
    : 4 / 3;
  const maxW = canvasW * 0.4;
  const maxH = canvasH * 0.4;
  let w = maxW;
  let h = w / ratio;
  if (h > maxH) {
    h = maxH;
    w = h * ratio;
  }
  const x = (canvasW - w) / 2;
  const y = (canvasH - h) / 2;
  const el = svg.ownerDocument.createElementNS(ns, 'image');
  el.setAttribute('x', String(Math.round(x)));
  el.setAttribute('y', String(Math.round(y)));
  el.setAttribute('width', String(Math.round(w)));
  el.setAttribute('height', String(Math.round(h)));
  el.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  el.setAttribute('href', href);
  el.setAttributeNS(xlink, 'href', href);
  el.setAttribute('data-edit-id', id);
  svg.appendChild(el);
  return {
    id,
    tag: 'image',
    label: `图片 #${id.replace('el-', '')}`,
    isText: false,
    isBackground: false,
  };
}

export function deleteElementById(container: HTMLElement, id: string): boolean {
  if (id === 'el-bg') return false;
  const el = container.querySelector(`[data-edit-id="${id}"]`);
  if (!el) return false;
  el.remove();
  return true;
}

export function duplicateElementById(container: HTMLElement, id: string): string | null {
  const el = container.querySelector(`[data-edit-id="${id}"]`) as SVGElement | null;
  if (!el || id === 'el-bg') return null;
  const clone = el.cloneNode(true) as SVGElement;
  const newId = nextEditId(container);
  clone.setAttribute('data-edit-id', newId);
  clone.classList.remove('svg-edit-selected');
  const { x: tx, y: ty } = getTranslate(clone);
  setTranslate(clone, tx + 24, ty + 24);
  if (clone.hasAttribute('x')) {
    clone.setAttribute('x', String(parseFloat(clone.getAttribute('x') || '0') + 24));
  }
  if (clone.hasAttribute('y')) {
    clone.setAttribute('y', String(parseFloat(clone.getAttribute('y') || '0') + 24));
  }
  if (clone.hasAttribute('cx')) {
    clone.setAttribute('cx', String(parseFloat(clone.getAttribute('cx') || '0') + 24));
  }
  if (clone.hasAttribute('cy')) {
    clone.setAttribute('cy', String(parseFloat(clone.getAttribute('cy') || '0') + 24));
  }
  el.parentNode?.insertBefore(clone, el.nextSibling);
  return newId;
}

export function reorderElementById(
  container: HTMLElement,
  id: string,
  direction: LayerDirection
): void {
  const el = container.querySelector(`[data-edit-id="${id}"]`);
  const svg = container.querySelector('svg');
  if (!el || !svg || id === 'el-bg') return;
  const parent = el.parentNode;
  if (!parent) return;

  if (direction === 'front') {
    parent.appendChild(el);
    return;
  }
  if (direction === 'back') {
    const bg = svg.querySelector('[data-edit-id="el-bg"]');
    if (bg?.nextSibling) parent.insertBefore(el, bg.nextSibling);
    else parent.insertBefore(el, svg.firstChild);
    return;
  }
  if (direction === 'forward' && el.nextSibling) {
    parent.insertBefore(el.nextSibling, el);
  }
  if (direction === 'backward' && el.previousSibling) {
    const prev = el.previousSibling;
    if ((prev as Element).getAttribute?.('data-edit-id') === 'el-bg') return;
    parent.insertBefore(el, prev);
  }
}
