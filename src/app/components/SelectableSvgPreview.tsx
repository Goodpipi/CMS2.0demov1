import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Eraser, Paintbrush } from 'lucide-react';
import {
  prepareEditableSvg,
  resolveEditableSvgSource,
  serializeSvgFromContainer,
  type SvgElementInfo,
} from '@/app/components/svgEditorUtils';

export interface SelectableSvgSelection {
  id: string;
  label: string;
  isText: boolean;
  tag: string;
  /** 当前画布上带 data-edit-id 的 SVG，供右侧 AI 修改使用 */
  svgMarkup: string;
}

export interface SelectableSvgToolState {
  brushActive: boolean;
  canClear: boolean;
}

export interface SelectableSvgPreviewHandle {
  toggleBrush: () => void;
  setBrushActive: (active: boolean) => void;
  clearStrokes: () => void;
  getToolState: () => SelectableSvgToolState;
}

interface SelectableSvgPreviewProps {
  /** 原始 SVG 字符串（优先） */
  svgMarkup?: string;
  /** data URL / 普通图片地址回退 */
  imageSrc: string;
  selectedId: string | null;
  onSelect: (selection: SelectableSvgSelection | null) => void;
  disabled?: boolean;
  className?: string;
  /** 隐藏内置工具条，改由外部 Toolbar 控制 */
  hideToolbar?: boolean;
  onToolStateChange?: (state: SelectableSvgToolState) => void;
}

function isLockedBackground(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  return el.getAttribute('data-edit-id') === 'el-bg' || tag === 'image';
}

export const SelectableSvgPreview = forwardRef<
  SelectableSvgPreviewHandle,
  SelectableSvgPreviewProps
>(function SelectableSvgPreview(
  {
    svgMarkup,
    imageSrc,
    selectedId,
    onSelect,
    disabled = false,
    className = '',
    hideToolbar = false,
    onToolStateChange,
  },
  ref
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [brushActive, setBrushActive] = useState(false);
  const [strokes, setStrokes] = useState<string[]>([]);
  const [activeStroke, setActiveStroke] = useState('');
  const drawingRef = useRef(false);
  const activeStrokeRef = useRef('');

  const prepared = useMemo(() => {
    const raw = resolveEditableSvgSource(imageSrc, svgMarkup);
    if (!raw) return null;
    return prepareEditableSvg(raw);
  }, [imageSrc, svgMarkup]);

  const canClear = strokes.length > 0 || Boolean(activeStroke);

  const clearStrokes = useCallback(() => {
    setStrokes([]);
    activeStrokeRef.current = '';
    setActiveStroke('');
    drawingRef.current = false;
  }, []);

  const setBrush = useCallback(
    (active: boolean) => {
      setBrushActive(active);
      if (active) onSelect(null);
    },
    [onSelect]
  );

  const toggleBrush = useCallback(() => {
    setBrush(!brushActive);
  }, [brushActive, setBrush]);

  useImperativeHandle(
    ref,
    () => ({
      toggleBrush,
      setBrushActive: setBrush,
      clearStrokes,
      getToolState: () => ({ brushActive, canClear }),
    }),
    [toggleBrush, setBrush, clearStrokes, brushActive, canClear]
  );

  useEffect(() => {
    onToolStateChange?.({ brushActive, canClear });
  }, [brushActive, canClear, onToolStateChange]);

  useEffect(() => {
    setLoadFailed(!prepared);
  }, [prepared]);

  useEffect(() => {
    setBrushActive(false);
    setStrokes([]);
    activeStrokeRef.current = '';
    setActiveStroke('');
    drawingRef.current = false;
  }, [prepared]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !prepared) return;
    host.querySelectorAll('.svg-edit-selected').forEach((node) => {
      node.classList.remove('svg-edit-selected');
    });
    if (!selectedId) return;
    const el = host.querySelector(`[data-edit-id="${CSS.escape(selectedId)}"]`);
    el?.classList.add('svg-edit-selected');
  }, [prepared, selectedId]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !prepared || disabled) return;

    host.querySelectorAll('[data-edit-id]').forEach((node) => {
      const svgNode = node as SVGElement;
      const locked = isLockedBackground(svgNode);
      svgNode.style.pointerEvents = locked || brushActive ? 'none' : 'all';
      svgNode.style.cursor = locked || brushActive ? 'default' : 'pointer';
    });

    if (brushActive) return;

    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest?.('[data-edit-id]');
      if (!target || !host.contains(target)) {
        onSelect(null);
        return;
      }
      if (isLockedBackground(target)) {
        onSelect(null);
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const id = target.getAttribute('data-edit-id');
      if (!id) return;
      if (selectedId === id) {
        onSelect(null);
        return;
      }
      const tag = target.tagName.toLowerCase();
      const isText = tag === 'text' || tag === 'tspan';
      const meta: SvgElementInfo | undefined = prepared.elements.find((item) => item.id === id);
      const liveSvg = serializeSvgFromContainer(host);
      onSelect({
        id,
        label: meta?.label || (isText ? `文本: ${(target.textContent || '').trim().slice(0, 24)}` : tag),
        isText: meta?.isText ?? isText,
        tag,
        svgMarkup: liveSvg || prepared.svg,
      });
    };

    host.addEventListener('click', onClick);
    return () => host.removeEventListener('click', onClick);
  }, [prepared, disabled, onSelect, brushActive, selectedId]);

  const pointFromEvent = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 1000;
    const y = ((event.clientY - rect.top) / rect.height) * 1000;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  const finishStroke = () => {
    const completedStroke = activeStrokeRef.current;
    if (completedStroke) setStrokes((prev) => [...prev, completedStroke]);
    activeStrokeRef.current = '';
    setActiveStroke('');
    drawingRef.current = false;
  };

  const toolbar =
    !disabled && !hideToolbar ? (
      <div className="image-draw-toolbar">
        <button
          type="button"
          className={`btn image-draw-tool ${brushActive ? 'primary active' : 'soft'}`}
          onClick={toggleBrush}
        >
          <Paintbrush className="h-3.5 w-3.5" />
          画笔
        </button>
        <button
          type="button"
          className="btn soft image-draw-tool"
          disabled={!canClear}
          onClick={clearStrokes}
        >
          <Eraser className="h-3.5 w-3.5" />
          清除
        </button>
      </div>
    ) : null;

  if (!prepared || loadFailed) {
    return (
      <div className={`image-draw-editor selectable-svg-preview is-fallback ${className}`.trim()}>
        {toolbar}
        <div className="image-draw-canvas">
          <img src={imageSrc} alt="" draggable={false} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`image-draw-editor selectable-svg-preview ${disabled ? 'is-disabled' : ''} ${className}`.trim()}
    >
      {toolbar}
      <div className="image-draw-canvas">
        <div
          ref={hostRef}
          className="selectable-svg-host"
          dangerouslySetInnerHTML={{ __html: prepared.svg }}
        />
        <svg
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          className={`image-draw-layer ${brushActive ? 'active' : ''}`}
          onPointerDown={(event) => {
            if (!brushActive || disabled) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            drawingRef.current = true;
            const point = pointFromEvent(event);
            activeStrokeRef.current = point;
            setActiveStroke(point);
          }}
          onPointerMove={(event) => {
            if (!brushActive || !drawingRef.current) return;
            activeStrokeRef.current = `${activeStrokeRef.current} ${pointFromEvent(event)}`;
            setActiveStroke(activeStrokeRef.current);
          }}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
        >
          {strokes.map((points, index) => (
            <polyline key={index} points={points} className="image-draw-stroke" />
          ))}
          {activeStroke && <polyline points={activeStroke} className="image-draw-stroke" />}
        </svg>
      </div>
    </div>
  );
});
