import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Brush,
  Circle,
  Copy,
  Eraser,
  Layers,
  Minus,
  Plus,
  Redo2,
  Square,
  Trash2,
  Type,
  Undo2,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { EDITOR_PAGE_ASSET_GROUPS, type EditorPageAsset } from '@/lib/editorPageAssets';
import {
  applyElementProps,
  EDITOR_FONT_FAMILIES,
  clientToSvgPoint,
  collectElementList,
  createInsertImage,
  createInsertShape,
  deleteElementById,
  duplicateElementById,
  nextEditId,
  prepareEditableSvg,
  readElementProps,
  reorderElementById,
  resolveEditableSvgSource,
  serializeSvgFromContainer,
  svgToDataUrl,
  getTranslate,
  setTranslate,
  type InsertShapeType,
  type SvgElementInfo,
} from './svgEditorUtils';
import { ConfirmModal } from '@/app/components/ConfirmModal';

export type EditMode = 'brush' | 'drag';
export type BrushTool = 'brush' | 'eraser';

/** @deprecated 保留 API 兼容 */
export interface DragLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight?: string;
  color?: string;
  width?: number;
}

interface ElementProps {
  text: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  fontSize: number;
  fontWeight: string;
  fontFamily: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  size?: number;
  rx: number;
  rotation: number;
  opacity: number;
}

const SHAPE_TOOLS: { type: InsertShapeType; label: string; Icon: typeof Square }[] = [
  { type: 'text', label: '文字', Icon: Type },
  { type: 'rect', label: '矩形', Icon: Square },
  { type: 'roundedRect', label: '圆角', Icon: Square },
  { type: 'circle', label: '圆形', Icon: Circle },
  { type: 'ellipse', label: '椭圆', Icon: Circle },
  { type: 'line', label: '线条', Icon: Minus },
  { type: 'arrow', label: '箭头', Icon: ArrowRight },
];

const ELEMENT_SHAPE_TOOLS = SHAPE_TOOLS.filter((tool) => tool.type !== 'text');
const TEXT_ONLY_TOOLS = SHAPE_TOOLS.filter((tool) => tool.type === 'text');

function isLockedBackgroundElement(el: Element | null): boolean {
  if (!el) return false;
  return el.getAttribute('data-edit-id') === 'el-bg';
}

interface VisualEditorProps {
  imageSrc: string;
  initialSvg?: string;
  onClose: () => void;
  onUpdate: (dataUrl: string, svg?: string) => void;
  onGenerate: (params: {
    editPrompt: string;
    maskBounds: { x: number; y: number; w: number; h: number } | null;
    svg?: string;
    layers: DragLayer[];
  }) => Promise<{ dataUrl: string; svg?: string; title?: string }>;
  isGenerating?: boolean;
  allowBrush?: boolean;
  /** false 时仅保留插入文字 */
  allowShapes?: boolean;
}

function getMaskBounds(canvas: HTMLCanvasElement): { x: number; y: number; w: number; h: number } | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let found = false;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] > 20) {
        found = true;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (!found) return null;
  const pad = 8;
  return {
    x: (Math.max(0, minX - pad) / width) * 100,
    y: (Math.max(0, minY - pad) / height) * 100,
    w: (Math.min(width, maxX + pad) - Math.max(0, minX - pad)) / width * 100,
    h: (Math.min(height, maxY + pad) - Math.max(0, minY - pad)) / height * 100,
  };
}

export function VisualEditor({
  imageSrc,
  initialSvg,
  onClose,
  onUpdate,
  onGenerate,
  isGenerating = false,
  allowBrush = true,
  allowShapes = true,
}: VisualEditorProps) {
  const [mode, setMode] = useState<EditMode>(allowBrush ? 'brush' : 'drag');
  const insertTools = allowShapes ? SHAPE_TOOLS : TEXT_ONLY_TOOLS;
  const [brushTool, setBrushTool] = useState<BrushTool>('brush');
  const [editPrompt, setEditPrompt] = useState(
    '把圈选区域调整得更清爽，减少营销感，保持拜耳蓝绿风格。'
  );
  const [svgHtml, setSvgHtml] = useState('');
  const [showRasterBack, setShowRasterBack] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [elementList, setElementList] = useState<SvgElementInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [props, setProps] = useState<ElementProps | null>(null);
  const [insertTool, setInsertTool] = useState<InsertShapeType | null>(null);
  const [addElementOpen, setAddElementOpen] = useState(false);
  const isPptEditor = !allowBrush;
  const elementShapeTools = allowShapes ? ELEMENT_SHAPE_TOOLS : [];
  const showAddElement = elementShapeTools.length > 0 || isPptEditor;

  useEffect(() => {
    if (!allowBrush && mode !== 'drag') setMode('drag');
  }, [allowBrush, mode]);

  useEffect(() => {
    if (!addElementOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAddElementOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addElementOpen]);
  const [historyTick, setHistoryTick] = useState(0);

  const svgHostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const drawing = useRef(false);
  const strokeHistory = useRef<ImageData[]>([]);
  const editHistory = useRef<string[]>([]);
  const editHistoryIndex = useRef(-1);
  const dragRef = useRef<{
    ids: string[];
    startX: number;
    startY: number;
    orig: Record<string, { x: number; y: number }>;
    scale: number;
  } | null>(null);
  const savedSvgRef = useRef('');

  const loadSvg = useCallback((raw: string, resetHistory = true) => {
    const { svg, elements } = prepareEditableSvg(raw);
    setSvgHtml(svg);
    setElementList(elements);
    setSelectedId(null);
    setSelectedIds([]);
    setProps(null);
    if (resetHistory) {
      editHistory.current = [svg];
      editHistoryIndex.current = 0;
      savedSvgRef.current = svg;
      setHistoryTick((t) => t + 1);
    }
  }, []);

  const refreshElements = useCallback(() => {
    if (!svgHostRef.current) return;
    setElementList(collectElementList(svgHostRef.current));
  }, []);

  const pushEditHistory = useCallback(() => {
    const svg = svgHostRef.current
      ? serializeSvgFromContainer(svgHostRef.current)
      : svgHtml;
    if (!svg) return;
    const idx = editHistoryIndex.current;
    editHistory.current = editHistory.current.slice(0, idx + 1).concat(svg);
    if (editHistory.current.length > 40) {
      editHistory.current.shift();
    } else {
      editHistoryIndex.current += 1;
    }
    setHistoryTick((t) => t + 1);
  }, [svgHtml]);

  const canUndoEdit = historyTick >= 0 && editHistoryIndex.current > 0;
  const canRedoEdit =
    historyTick >= 0 && editHistoryIndex.current < editHistory.current.length - 1;

  const undoEdit = useCallback(() => {
    if (editHistoryIndex.current <= 0) return;
    editHistoryIndex.current -= 1;
    const svg = editHistory.current[editHistoryIndex.current];
    if (!svg) return;
    const { svg: next, elements } = prepareEditableSvg(svg);
    setSvgHtml(next);
    setElementList(elements);
    setSelectedId(null);
    setSelectedIds([]);
    setProps(null);
    setHistoryTick((t) => t + 1);
  }, []);

  const redoEdit = useCallback(() => {
    if (editHistoryIndex.current >= editHistory.current.length - 1) return;
    editHistoryIndex.current += 1;
    const svg = editHistory.current[editHistoryIndex.current];
    if (!svg) return;
    const { svg: next, elements } = prepareEditableSvg(svg);
    setSvgHtml(next);
    setElementList(elements);
    setSelectedId(null);
    setSelectedIds([]);
    setProps(null);
    setHistoryTick((t) => t + 1);
  }, []);

  const propsFromElement = (p: ReturnType<typeof readElementProps>): ElementProps => ({
    text: p.text,
    fill: p.fill,
    stroke: p.stroke,
    strokeWidth: p.strokeWidth,
    fontSize: p.fontSize,
    fontWeight: p.fontWeight,
    fontFamily: p.fontFamily,
    x: Math.round(p.x),
    y: Math.round(p.y),
    width: p.width,
    height: p.height,
    size: p.size ?? p.fontSize,
    rx: p.rx,
    rotation: p.rotation,
    opacity: p.opacity,
  });

  useEffect(() => {
    setLoadFailed(false);
    setShowRasterBack(false);
    const raw = resolveEditableSvgSource(imageSrc, initialSvg);
    if (raw) {
      loadSvg(raw);
      return;
    }
    if (imageSrc) {
      setShowRasterBack(true);
      setLoadFailed(true);
    }
  }, [imageSrc, initialSvg, loadSvg]);

  useLayoutEffect(() => {
    if (!svgHtml || !imageSrc) return;
    const host = svgHostRef.current;
    const svg = host?.querySelector('svg');
    if (!svg) {
      setShowRasterBack(true);
      return;
    }
    const rect = svg.getBoundingClientRect();
    setShowRasterBack(rect.width < 4 || rect.height < 4);
  }, [svgHtml, imageSrc]);

  const getCurrentSvg = useCallback(() => {
    if (!svgHostRef.current) return svgHtml;
    return serializeSvgFromContainer(svgHostRef.current);
  }, [svgHtml]);

  const applySelectionClasses = useCallback((ids: string[]) => {
    const host = svgHostRef.current;
    if (!host) return;
    host.querySelectorAll('.svg-edit-selected').forEach((n) => n.classList.remove('svg-edit-selected'));
    ids.forEach((id) => {
      host.querySelector(`[data-edit-id="${id}"]`)?.classList.add('svg-edit-selected');
    });
  }, []);

  const selectElements = useCallback(
    (ids: string[], primary?: string) => {
      const next = ids.filter(Boolean);
      setSelectedIds(next);
      const focus = primary && next.includes(primary) ? primary : next[next.length - 1] || null;
      setSelectedId(focus);
      applySelectionClasses(next);
      setInsertTool(null);
      if (!focus || !svgHostRef.current) {
        setProps(null);
        return;
      }
      const el = svgHostRef.current.querySelector(`[data-edit-id="${focus}"]`);
      if (el) setProps(propsFromElement(readElementProps(el)));
    },
    [applySelectionClasses]
  );

  const selectElement = useCallback(
    (id: string, additive = false) => {
      if (additive) {
        const exists = selectedIds.includes(id);
        const next = exists ? selectedIds.filter((item) => item !== id) : [...selectedIds, id];
        selectElements(next, exists ? next[next.length - 1] : id);
        return;
      }
      selectElements([id], id);
    },
    [selectedIds, selectElements]
  );

  useLayoutEffect(() => {
    applySelectionClasses(selectedIds);
  }, [svgHtml, selectedIds, applySelectionClasses]);

  const updateSelectedDom = useCallback(
    (patch: Partial<ElementProps>, recordHistory = false) => {
      if (!selectedId || !svgHostRef.current) return;
      const el = svgHostRef.current.querySelector(`[data-edit-id="${selectedId}"]`);
      if (!el) return;
      applyElementProps(el, patch);
      setProps(propsFromElement(readElementProps(el)));
      refreshElements();
      if (recordHistory) pushEditHistory();
    },
    [selectedId, refreshElements, pushEditHistory]
  );

  const handleDeleteSelected = useCallback(() => {
    if (!svgHostRef.current) return;
    const ids = (selectedIds.length ? selectedIds : selectedId ? [selectedId] : []).filter(
      (id) => id !== 'el-bg'
    );
    if (!ids.length) return;
    ids.forEach((id) => deleteElementById(svgHostRef.current!, id));
    setSelectedId(null);
    setSelectedIds([]);
    setProps(null);
    applySelectionClasses([]);
    refreshElements();
    pushEditHistory();
  }, [selectedId, selectedIds, applySelectionClasses, refreshElements, pushEditHistory]);

  const handleDuplicateSelected = useCallback(() => {
    if (!selectedId || !svgHostRef.current) return;
    const newId = duplicateElementById(svgHostRef.current, selectedId);
    if (!newId) return;
    refreshElements();
    pushEditHistory();
    selectElement(newId);
  }, [selectedId, refreshElements, pushEditHistory, selectElement]);

  const handleReorder = useCallback(
    (direction: 'front' | 'back' | 'forward' | 'backward') => {
      if (!selectedId || !svgHostRef.current) return;
      reorderElementById(svgHostRef.current, selectedId, direction);
      pushEditHistory();
    },
    [selectedId, pushEditHistory]
  );

  const handleInsertAtPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!insertTool || !svgHostRef.current) return;
      const svg = svgHostRef.current.querySelector('svg');
      if (!svg) return;
      const point = clientToSvgPoint(svg, clientX, clientY);
      const id = nextEditId(svgHostRef.current);
      createInsertShape(svg, insertTool, point, id);
      refreshElements();
      pushEditHistory();
      selectElement(id);
      setInsertTool(null);
    },
    [insertTool, refreshElements, pushEditHistory, selectElement]
  );

  const handleInsertLocalImage = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/') || !svgHostRef.current) return;
      const svg = svgHostRef.current.querySelector('svg');
      if (!svg) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        if (!dataUrl) return;
        const probe = new window.Image();
        probe.onload = () => {
          const host = svgHostRef.current;
          const liveSvg = host?.querySelector('svg');
          if (!host || !liveSvg) return;
          const id = nextEditId(host);
          createInsertImage(liveSvg, dataUrl, id, {
            width: probe.naturalWidth || 800,
            height: probe.naturalHeight || 600,
          });
          refreshElements();
          pushEditHistory();
          selectElement(id);
        };
        probe.src = dataUrl;
      };
      reader.readAsDataURL(file);
    },
    [refreshElements, pushEditHistory, selectElement]
  );

  const handleInsertAsset = useCallback(
    (asset: EditorPageAsset) => {
      const host = svgHostRef.current;
      const liveSvg = host?.querySelector('svg');
      if (!host || !liveSvg) return;
      setMode('drag');
      setInsertTool(null);
      setAddElementOpen(false);
      const id = nextEditId(host);
      createInsertImage(liveSvg, asset.href, id, {
        width: asset.width,
        height: asset.height,
      });
      refreshElements();
      pushEditHistory();
      selectElement(id);
    },
    [refreshElements, pushEditHistory, selectElement]
  );

  useEffect(() => {
    const host = svgHostRef.current;
    const stage = stageRef.current;
    if (!host || !stage || mode !== 'drag' || !svgHtml) return;

    host.querySelectorAll('[data-edit-id]').forEach((node) => {
      const svgNode = node as SVGElement;
      const locked = isLockedBackgroundElement(svgNode);
      svgNode.style.pointerEvents = insertTool || locked ? 'none' : 'all';
      svgNode.style.cursor = insertTool ? 'crosshair' : locked ? 'default' : 'move';
    });

    const onStageDown = (e: PointerEvent) => {
      if (insertTool) {
        if ((e.target as Element).closest('[data-edit-id]')) return;
        e.preventDefault();
        handleInsertAtPoint(e.clientX, e.clientY);
        return;
      }
      const hit = (e.target as Element).closest('[data-edit-id]') as SVGElement | null;
      if (hit && host.contains(hit) && !isLockedBackgroundElement(hit)) return;
      e.preventDefault();
      const stageRect = stage.getBoundingClientRect();
      const startX = e.clientX - stageRect.left;
      const startY = e.clientY - stageRect.top;
      setMarquee({ x: startX, y: startY, w: 0, h: 0 });
      const onMove = (ev: PointerEvent) => {
        const x = ev.clientX - stageRect.left;
        const y = ev.clientY - stageRect.top;
        setMarquee({
          x: Math.min(startX, x),
          y: Math.min(startY, y),
          w: Math.abs(x - startX),
          h: Math.abs(y - startY),
        });
      };
      const onUp = (ev: PointerEvent) => {
        stage.removeEventListener('pointermove', onMove);
        stage.removeEventListener('pointerup', onUp);
        const endX = ev.clientX - stageRect.left;
        const endY = ev.clientY - stageRect.top;
        const box = {
          left: stageRect.left + Math.min(startX, endX),
          top: stageRect.top + Math.min(startY, endY),
          right: stageRect.left + Math.max(startX, endX),
          bottom: stageRect.top + Math.max(startY, endY),
        };
        setMarquee(null);
        if (Math.abs(endX - startX) < 4 && Math.abs(endY - startY) < 4) {
          if (!(ev.shiftKey || ev.ctrlKey || ev.metaKey)) selectElements([]);
          return;
        }
        const picked: string[] = [];
        host.querySelectorAll('[data-edit-id]').forEach((node) => {
          if (isLockedBackgroundElement(node)) return;
          const r = node.getBoundingClientRect();
          if (r.left < box.right && r.right > box.left && r.top < box.bottom && r.bottom > box.top) {
            const id = node.getAttribute('data-edit-id');
            if (id) picked.push(id);
          }
        });
        selectElements(picked);
      };
      stage.addEventListener('pointermove', onMove);
      stage.addEventListener('pointerup', onUp);
    };

    const onDown = (e: PointerEvent) => {
      if (insertTool) return;
      const el = (e.target as Element).closest('[data-edit-id]') as SVGElement | null;
      if (!el || !host.contains(el)) return;
      if (isLockedBackgroundElement(el)) return;
      e.preventDefault();
      e.stopPropagation();
      const id = el.getAttribute('data-edit-id')!;
      const additive = e.shiftKey || e.ctrlKey || e.metaKey;
      let movingIds = selectedIds.includes(id) ? selectedIds : [id];
      if (additive) {
        const exists = selectedIds.includes(id);
        movingIds = exists ? selectedIds.filter((item) => item !== id) : [...selectedIds, id];
        selectElement(id, true);
      } else if (!selectedIds.includes(id)) {
        selectElement(id);
        movingIds = [id];
      }
      movingIds = movingIds.filter((item) => item !== 'el-bg');
      const svg = host.querySelector('svg');
      if (!svg || !stage) return;
      const vb = svg.getAttribute('viewBox')?.split(/\s+/).map(Number) || [0, 0, 900, 560];
      const scale = stage.getBoundingClientRect().width / (vb[2] || 900);
      const orig: Record<string, { x: number; y: number }> = {};
      movingIds.forEach((itemId) => {
        const node = host.querySelector(`[data-edit-id="${itemId}"]`);
        if (node) orig[itemId] = getTranslate(node);
      });
      let moved = false;
      dragRef.current = { ids: movingIds, startX: e.clientX, startY: e.clientY, orig, scale };
      el.setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        const d = dragRef.current;
        if (!d) return;
        moved = true;
        const dx = (ev.clientX - d.startX) / d.scale;
        const dy = (ev.clientY - d.startY) / d.scale;
        d.ids.forEach((itemId) => {
          const node = host.querySelector(`[data-edit-id="${itemId}"]`);
          const start = d.orig[itemId];
          if (!node || !start) return;
          setTranslate(node, start.x + dx, start.y + dy);
        });
        if (selectedId) {
          const focus = host.querySelector(`[data-edit-id="${selectedId}"]`);
          if (focus) {
            const p = readElementProps(focus);
            setProps((prev) => (prev ? propsFromElement({ ...p, x: p.x, y: p.y }) : null));
          }
        }
      };
      const onUp = () => {
        dragRef.current = null;
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerup', onUp);
        el.removeEventListener('pointercancel', onUp);
        if (moved) pushEditHistory();
      };
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', onUp);
      el.addEventListener('pointercancel', onUp);
    };

    stage.addEventListener('pointerdown', onStageDown);
    host.addEventListener('pointerdown', onDown);
    return () => {
      stage.removeEventListener('pointerdown', onStageDown);
      host.removeEventListener('pointerdown', onDown);
    };
  }, [mode, svgHtml, selectElement, selectElements, selectedIds, selectedId, insertTool, handleInsertAtPoint, pushEditHistory]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (mode !== 'drag') return;
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedId || selectedIds.length)) {
        e.preventDefault();
        handleDeleteSelected();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoEdit();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        redoEdit();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedId) {
        e.preventDefault();
        handleDuplicateSelected();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, selectedId, selectedIds, handleDeleteSelected, handleDuplicateSelected, undoEdit, redoEdit]);

  useEffect(() => {
    if (mode === 'drag' && elementList[0] && !insertTool) selectElement(elementList[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅切换模式时选中首个
  }, [mode]);

  const applyCanvasToolStyle = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (brushTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
      ctx.lineWidth = 18;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255, 51, 79, 0.85)';
      ctx.lineWidth = 14;
    }
  }, [brushTool]);

  const syncCanvasSize = useCallback(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const rect = stage.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      applyCanvasToolStyle(ctx);
    }
  }, [applyCanvasToolStyle]);

  useLayoutEffect(() => {
    syncCanvasSize();
    const raf = requestAnimationFrame(() => syncCanvasSize());
    window.addEventListener('resize', syncCanvasSize);
    const stage = stageRef.current;
    const ro =
      stage && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => syncCanvasSize())
        : null;
    if (stage && ro) ro.observe(stage);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', syncCanvasSize);
      ro?.disconnect();
    };
  }, [syncCanvasSize, svgHtml, showRasterBack, loadFailed]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) applyCanvasToolStyle(ctx);
  }, [applyCanvasToolStyle]);

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'brush') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    applyCanvasToolStyle(ctx);
    drawing.current = true;
    canvas.setPointerCapture(e.pointerId);
    strokeHistory.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    const { x, y } = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || mode !== 'brush') return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    canvasRef.current?.releasePointerCapture(e.pointerId);
  };

  const clearMask = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokeHistory.current = [];
  };

  const undoStroke = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const prev = strokeHistory.current.pop();
    if (!canvas || !ctx) return;
    if (prev) ctx.putImageData(prev, 0, 0);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleAiGenerate = async () => {
    const canvas = canvasRef.current;
    const maskBounds = canvas ? getMaskBounds(canvas) : null;
    const svg = getCurrentSvg();
    const result = await onGenerate({ editPrompt, maskBounds, svg, layers: [] });
    if (result.svg) loadSvg(result.svg);
    onUpdate(result.dataUrl, result.svg);
    clearMask();
  };

  const selectedMeta = elementList.find((e) => e.id === selectedId);
  const showBrushAiPanel = allowBrush && mode === 'brush';

  const handleSaveDrag = () => {
    const svg = getCurrentSvg();
    savedSvgRef.current = svg;
    onUpdate(svgToDataUrl(svg), svg);
    onClose();
  };

  const requestClose = () => {
    const dirty = editHistoryIndex.current > 0;
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    onClose();
  };

  return (
    <div className="visual-editor-layout">
      <aside className="wpanel visual-editor-side visual-editor-props">
        <h3 className="section-title">{isPptEditor ? '页面编辑' : '视觉编辑'}</h3>

        {allowBrush && (
        <div className="visual-editor-mode-tabs" role="tablist" aria-label="编辑方式">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'brush'}
            className={`visual-editor-mode-tab ${mode === 'brush' ? 'active' : ''}`}
            onClick={() => setMode('brush')}
          >
            画笔圈选
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'drag'}
            className={`visual-editor-mode-tab ${mode === 'drag' ? 'active' : ''}`}
            onClick={() => setMode('drag')}
          >
            设计编辑
          </button>
        </div>
        )}

        {allowBrush && mode === 'brush' && (
          <div className="visual-editor-tool-row" role="group" aria-label="圈选工具">
            <button
              type="button"
              className={`visual-editor-tool-btn ${brushTool === 'brush' ? 'active' : ''}`}
              onClick={() => setBrushTool('brush')}
            >
              <Brush className="h-3.5 w-3.5" strokeWidth={2.2} />
              画笔
            </button>
            <button
              type="button"
              className={`visual-editor-tool-btn ${brushTool === 'eraser' ? 'active' : ''}`}
              onClick={() => setBrushTool('eraser')}
            >
              <Eraser className="h-3.5 w-3.5" strokeWidth={2.2} />
              橡皮擦
            </button>
            <button type="button" className="visual-editor-tool-btn" onClick={undoStroke}>
              <Undo2 className="h-3.5 w-3.5" strokeWidth={2.2} />
              撤销
            </button>
            <button type="button" className="visual-editor-tool-btn" onClick={clearMask}>
              清除
            </button>
          </div>
        )}

        {mode === 'drag' && (
          <>
            {insertTool ? (
              <div className="small" style={{ marginTop: 10 }}>
                {`插入模式：在画布空白处点击添加「${insertTools.find((s) => s.type === insertTool)?.label}」`}
              </div>
            ) : null}

            <h4 className="props-subtitle">插入</h4>
            <div className="visual-editor-shape-grid">
              <button
                type="button"
                className={`visual-editor-shape-btn ${insertTool === 'text' ? 'active' : ''}`}
                onClick={() => setInsertTool((prev) => (prev === 'text' ? null : 'text'))}
                title="文字"
              >
                <Type className="h-3.5 w-3.5" strokeWidth={2.2} />
                文字
              </button>
              <button
                type="button"
                className="visual-editor-shape-btn"
                title="插入本地图片"
                onClick={() => {
                  setInsertTool(null);
                  imageInputRef.current?.click();
                }}
              >
                <ImageIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                图片
              </button>
              {showAddElement ? (
                <button
                  type="button"
                  className={`visual-editor-shape-btn ${addElementOpen ? 'active' : ''}`}
                  title="添加元素"
                  onClick={() => {
                    setInsertTool(null);
                    setAddElementOpen(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
                  添加元素
                </button>
              ) : null}
              <input
                ref={imageInputRef}
                type="file"
                hidden
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (file) handleInsertLocalImage(file);
                  event.currentTarget.value = '';
                }}
              />
            </div>

            <h4 className="props-subtitle">元素操作</h4>
            <div className="visual-editor-action-grid">
              <button
                type="button"
                className="visual-editor-action-btn"
                disabled={!canUndoEdit}
                onClick={undoEdit}
                title="Ctrl+Z"
              >
                <Undo2 className="h-3.5 w-3.5" />
                撤销
              </button>
              <button
                type="button"
                className="visual-editor-action-btn"
                disabled={!canRedoEdit}
                onClick={redoEdit}
                title="Ctrl+Y"
              >
                <Redo2 className="h-3.5 w-3.5" />
                重做
              </button>
              <button
                type="button"
                className="visual-editor-action-btn"
                disabled={!selectedId || selectedMeta?.isBackground}
                onClick={handleDuplicateSelected}
                title="Ctrl+D"
              >
                <Copy className="h-3.5 w-3.5" />
                复制
              </button>
              <button
                type="button"
                className="visual-editor-action-btn danger"
                disabled={!selectedId || selectedMeta?.isBackground}
                onClick={handleDeleteSelected}
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
                删除
              </button>
            </div>

            <h4 className="props-subtitle">
              <Layers className="h-3.5 w-3.5" style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
              图层顺序
            </h4>
            <div className="visual-editor-action-grid layer-grid">
              <button type="button" className="visual-editor-action-btn" disabled={!selectedId || selectedMeta?.isBackground} onClick={() => handleReorder('forward')}>
                上移
              </button>
              <button type="button" className="visual-editor-action-btn" disabled={!selectedId || selectedMeta?.isBackground} onClick={() => handleReorder('backward')}>
                下移
              </button>
              <button type="button" className="visual-editor-action-btn" disabled={!selectedId || selectedMeta?.isBackground} onClick={() => handleReorder('front')}>
                置顶
              </button>
              <button type="button" className="visual-editor-action-btn" disabled={!selectedId || selectedMeta?.isBackground} onClick={() => handleReorder('back')}>
                置底
              </button>
            </div>

            <h4 className="props-subtitle">全部元素 ({elementList.length})</h4>
            <div className="element-list">
              {elementList.map((el) => (
                <button
                  key={el.id}
                  type="button"
                  className={`element-list-item ${selectedIds.includes(el.id) ? 'active' : ''}`}
                  onClick={() => selectElement(el.id)}
                >
                  {el.label}
                </button>
              ))}
            </div>

            {props && selectedMeta && (
              <div className="props-form">
                <h4 className="props-subtitle">属性 · {selectedMeta.tag}</h4>
                {selectedMeta.isText && (
                  <label className="props-field">
                    <span>文字内容</span>
                    <textarea
                      className="input"
                      rows={3}
                      value={props.text}
                      onChange={(e) => {
                        const v = e.target.value;
                        setProps((p) => (p ? { ...p, text: v } : p));
                        updateSelectedDom({ text: v });
                      }}
                    />
                  </label>
                )}
                <label className="props-field">
                  <span>颜色</span>
                  <div className="color-row">
                    <input
                      type="color"
                      value={props.fill.startsWith('#') ? props.fill.slice(0, 7) : '#103C8F'}
                      onChange={(e) => {
                        const v = e.target.value;
                        setProps((p) => (p ? { ...p, fill: v } : p));
                        updateSelectedDom({ fill: v });
                      }}
                    />
                    <input
                      className="input"
                      value={props.fill}
                      onChange={(e) => {
                        const v = e.target.value;
                        setProps((p) => (p ? { ...p, fill: v } : p));
                        updateSelectedDom({ fill: v });
                      }}
                    />
                  </div>
                </label>
                {(selectedMeta.isText || selectedMeta.tag === 'text' || selectedMeta.tag === 'tspan') && (
                  <>
                    <label className="props-field">
                      <span>字体</span>
                      <select
                        className="input"
                        value={props.fontFamily}
                        style={{ fontFamily: props.fontFamily }}
                        onChange={(e) => {
                          const v = e.target.value;
                          setProps((p) => (p ? { ...p, fontFamily: v } : p));
                          updateSelectedDom({ fontFamily: v }, true);
                        }}
                      >
                        {!EDITOR_FONT_FAMILIES.some((item) => item.value === props.fontFamily) && (
                          <option value={props.fontFamily}>当前字体</option>
                        )}
                        {EDITOR_FONT_FAMILIES.map((item) => (
                          <option key={item.value} value={item.value} style={{ fontFamily: item.value }}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="props-field">
                      <span>字号 {Math.round(props.fontSize)}</span>
                      <input
                        type="range"
                        min={10}
                        max={96}
                        value={props.fontSize}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setProps((p) => (p ? { ...p, fontSize: v, size: v } : p));
                          updateSelectedDom({ fontSize: v });
                        }}
                      />
                    </label>
                    <label className="props-field">
                      <span>字重</span>
                      <select
                        className="input"
                        value={props.fontWeight}
                        onChange={(e) => {
                          const v = e.target.value;
                          setProps((p) => (p ? { ...p, fontWeight: v } : p));
                          updateSelectedDom({ fontWeight: v });
                        }}
                      >
                        <option value="400">常规</option>
                        <option value="600">半粗</option>
                        <option value="700">粗体</option>
                        <option value="900">特粗</option>
                      </select>
                    </label>
                  </>
                )}
                {(selectedMeta.tag === 'line' ||
                  selectedMeta.tag === 'path' ||
                  selectedMeta.tag === 'rect') && (
                  <>
                    <label className="props-field">
                      <span>描边颜色</span>
                      <div className="color-row">
                        <input
                          type="color"
                          value={props.stroke.startsWith('#') ? props.stroke.slice(0, 7) : '#103C8F'}
                          onChange={(e) => {
                            const v = e.target.value;
                            setProps((p) => (p ? { ...p, stroke: v } : p));
                            updateSelectedDom({ stroke: v });
                          }}
                        />
                        <input
                          className="input"
                          value={props.stroke}
                          onChange={(e) => {
                            const v = e.target.value;
                            setProps((p) => (p ? { ...p, stroke: v } : p));
                            updateSelectedDom({ stroke: v });
                          }}
                        />
                      </div>
                    </label>
                    {(selectedMeta.tag === 'line' || selectedMeta.tag === 'rect') && (
                      <label className="props-field">
                        <span>描边粗细 {props.strokeWidth}px</span>
                        <input
                          type="range"
                          min={1}
                          max={24}
                          value={props.strokeWidth || 2}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setProps((p) => (p ? { ...p, strokeWidth: v } : p));
                            updateSelectedDom({ strokeWidth: v });
                          }}
                        />
                      </label>
                    )}
                  </>
                )}
                {(selectedMeta.tag === 'rect') && (
                  <label className="props-field">
                    <span>圆角 {Math.round(props.rx)}px</span>
                    <input
                      type="range"
                      min={0}
                      max={48}
                      value={props.rx}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setProps((p) => (p ? { ...p, rx: v } : p));
                        updateSelectedDom({ rx: v });
                      }}
                    />
                  </label>
                )}
                {(props.width != null || selectedMeta.tag === 'rect' || selectedMeta.tag === 'image') && (
                  <label className="props-field">
                    <span>宽度</span>
                    <input
                      type="number"
                      className="input"
                      min={1}
                      value={Math.round(props.width ?? 100)}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setProps((p) => (p ? { ...p, width: v } : p));
                        updateSelectedDom({ width: v });
                      }}
                    />
                  </label>
                )}
                {(props.height != null || selectedMeta.tag === 'rect' || selectedMeta.tag === 'image') && (
                  <label className="props-field">
                    <span>高度</span>
                    <input
                      type="number"
                      className="input"
                      min={1}
                      value={Math.round(props.height ?? 100)}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setProps((p) => (p ? { ...p, height: v } : p));
                        updateSelectedDom({ height: v });
                      }}
                    />
                  </label>
                )}
                {selectedMeta.tag === 'circle' && (
                  <label className="props-field">
                    <span>半径</span>
                    <input
                      type="range"
                      min={4}
                      max={200}
                      value={props.size ?? 40}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setProps((p) => (p ? { ...p, size: v } : p));
                        updateSelectedDom({ size: v });
                      }}
                    />
                  </label>
                )}
                <label className="props-field">
                  <span>位置 X / Y</span>
                  <div className="xy-row">
                    <input
                      type="number"
                      className="input"
                      value={props.x}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setProps((p) => (p ? { ...p, x: v } : p));
                        updateSelectedDom({ x: v });
                      }}
                    />
                    <input
                      type="number"
                      className="input"
                      value={props.y}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setProps((p) => (p ? { ...p, y: v } : p));
                        updateSelectedDom({ y: v });
                      }}
                    />
                  </div>
                </label>
                <label className="props-field">
                  <span>旋转 {Math.round(props.rotation)}°</span>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    value={props.rotation}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setProps((p) => (p ? { ...p, rotation: v } : p));
                      updateSelectedDom({ rotation: v });
                    }}
                  />
                </label>
                <label className="props-field">
                  <span>透明度 {Math.round(props.opacity * 100)}%</span>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={props.opacity}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setProps((p) => (p ? { ...p, opacity: v } : p));
                      updateSelectedDom({ opacity: v });
                    }}
                  />
                </label>
              </div>
            )}
          </>
        )}

        {allowBrush && mode === 'brush' && (
          <div className="small" style={{ marginTop: 10 }}>
            {brushTool === 'brush'
              ? '用画笔圈出需 AI 重绘的区域（红色笔迹）。'
              : '用橡皮擦擦除已圈选区域。'}
          </div>
        )}
      </aside>

      <main className="canvas-large visual-editor-main">
        <div ref={stageRef} className="visual-editor-stage">
          <div className={`visual-editor-artboard ${mode === 'drag' ? 'drag-mode' : ''} ${insertTool ? 'insert-mode' : ''}`}>
            {(showRasterBack || loadFailed) && imageSrc ? (
              <img src={imageSrc} alt="" className="visual-editor-raster-back" draggable={false} />
            ) : null}
            {svgHtml ? (
              <div
                ref={svgHostRef}
                className="visual-editor-svg-host"
                dangerouslySetInnerHTML={{ __html: svgHtml }}
              />
            ) : loadFailed ? (
              <div className="visual-editor-load-hint">配图加载失败，请关闭后重试或联系运营。</div>
            ) : (
              <div className="visual-editor-load-hint">正在加载配图…</div>
            )}
            {marquee && marquee.w + marquee.h > 2 && (
              <div
                className="visual-editor-marquee"
                style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }}
              />
            )}
          </div>
          {allowBrush && <canvas
            ref={canvasRef}
            className={`visual-editor-mask-canvas ${mode === 'brush' ? 'active' : ''}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          />}
        </div>
      </main>

      <aside className="wpanel visual-editor-side">
        <h3 className="section-title">{showBrushAiPanel ? 'AI 局部修改' : '手动编辑'}</h3>

        {showBrushAiPanel && (
          <>
            <textarea
              className="select"
              style={{ height: 110, width: '100%', resize: 'none' }}
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
            />
            <button
              className="btn primary"
              style={{ width: '100%', marginTop: 12 }}
              disabled={isGenerating}
              onClick={() => void handleAiGenerate()}
            >
              {isGenerating ? '生成中…' : '生成新版本'}
            </button>
          </>
        )}

        {mode === 'drag' && (
          <button className="btn soft" style={{ width: '100%', marginTop: 8 }} onClick={handleSaveDrag}>
            保存精调并返回
          </button>
        )}
        <button className="btn" style={{ width: '100%', marginTop: 8 }} onClick={requestClose}>
          返回
        </button>
      </aside>
      {addElementOpen ? (
        <div
          className="modal-bg show visual-editor-add-bg"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setAddElementOpen(false);
          }}
        >
          <div
            className="modal visual-editor-add-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="visual-editor-add-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="visual-editor-add-head">
              <h3 id="visual-editor-add-title">添加元素</h3>
              <button
                type="button"
                className="visual-editor-add-close"
                onClick={() => setAddElementOpen(false)}
                aria-label="关闭"
              >
                <X className="h-4 w-4" strokeWidth={2.2} />
              </button>
            </header>
            {elementShapeTools.length ? (
              <section className="visual-editor-add-section">
                <h4>形状</h4>
                <div className="visual-editor-shape-grid">
                  {elementShapeTools.map(({ type, label, Icon }) => (
                    <button
                      key={type}
                      type="button"
                      className={`visual-editor-shape-btn ${insertTool === type ? 'active' : ''}`}
                      onClick={() => {
                        setInsertTool(type);
                        setAddElementOpen(false);
                      }}
                      title={label}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                      {label}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
            {isPptEditor ? (
              <section className="visual-editor-add-section">
                <h4>素材</h4>
                <div className="visual-editor-asset-picker">
                  {EDITOR_PAGE_ASSET_GROUPS.map((group) => (
                    <div key={group.id} className="glass-card-subtle rounded-2xl p-2.5">
                      <div className="mb-1.5 flex items-center justify-between px-1 text-[12px] leading-[1.25]">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          {group.title}
                          <span className="grid h-4 min-w-[16px] place-items-center rounded-full bg-gradient-to-br from-[#54B9F9] to-[#8AD329] px-1 text-[10px] font-bold text-white shadow-[0_2px_6px_-1px_rgba(59,150,210,0.5)]">
                            {group.items.length}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {group.items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="visual-editor-asset-row group flex w-full items-start gap-2 rounded-xl border border-transparent p-1.5 text-left transition hover:border-border/60 hover:bg-background/80 hover:shadow-soft"
                            onClick={() => handleInsertAsset(item)}
                            title={`插入「${item.title}」`}
                          >
                            <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-lg bg-white ring-1 ring-black/5">
                              <img src={item.href} alt="" className="h-full w-full object-contain" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="min-w-0 truncate text-[12px] font-medium text-foreground">{item.title}</div>
                              <div className="mt-0.5 text-[10px] leading-[1.45] text-muted-foreground">{item.meta}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      ) : null}
      <ConfirmModal
        open={discardOpen}
        title="修改尚未保存"
        message="当前修改并未保存。确认后将返回工作台，本次修改不生效。"
        confirmLabel="确认返回"
        cancelLabel="继续编辑"
        danger
        onConfirm={() => {
          setDiscardOpen(false);
          onClose();
        }}
        onCancel={() => setDiscardOpen(false)}
      />
    </div>
  );
}
