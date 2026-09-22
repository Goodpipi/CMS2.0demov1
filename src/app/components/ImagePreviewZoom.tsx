import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

export const IMAGE_PREVIEW_ZOOM_MIN = 0.5;
export const IMAGE_PREVIEW_ZOOM_MAX = 3;
export const IMAGE_PREVIEW_ZOOM_STEP = 0.25;

export type ImagePreviewOffset = { x: number; y: number };

export function useImagePreviewZoom(resetKey?: string | number) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<ImagePreviewOffset>({ x: 0, y: 0 });

  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [resetKey]);

  useEffect(() => {
    if (scale <= 1) setOffset({ x: 0, y: 0 });
  }, [scale]);

  const zoomIn = () =>
    setScale((prev) => Math.min(IMAGE_PREVIEW_ZOOM_MAX, Number((prev + IMAGE_PREVIEW_ZOOM_STEP).toFixed(2))));
  const zoomOut = () =>
    setScale((prev) => Math.max(IMAGE_PREVIEW_ZOOM_MIN, Number((prev - IMAGE_PREVIEW_ZOOM_STEP).toFixed(2))));
  const reset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  return {
    scale,
    offset,
    setOffset,
    zoomIn,
    zoomOut,
    reset,
    canZoomIn: scale < IMAGE_PREVIEW_ZOOM_MAX - 0.001,
    canZoomOut: scale > IMAGE_PREVIEW_ZOOM_MIN + 0.001,
  };
}

export function ImagePreviewZoomControls({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
  canZoomIn,
  canZoomOut,
  className = '',
}: {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  className?: string;
}) {
  return (
    <div className={`image-preview-zoom-controls ${className}`.trim()} role="group" aria-label="预览缩放">
      <button type="button" className="btn soft image-preview-zoom-btn" aria-label="缩小" disabled={!canZoomOut} onClick={onZoomOut}>
        <ZoomOut className="h-3.5 w-3.5" aria-hidden />
      </button>
      <button
        type="button"
        className="btn soft image-preview-zoom-label"
        aria-label="重置缩放"
        title="重置为 100%"
        onClick={onReset}
      >
        {Math.round(scale * 100)}%
      </button>
      <button type="button" className="btn soft image-preview-zoom-btn" aria-label="放大" disabled={!canZoomIn} onClick={onZoomIn}>
        <ZoomIn className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}

const PAN_THRESHOLD_PX = 4;

export function ImagePreviewZoomViewport({
  scale,
  offset = { x: 0, y: 0 },
  onOffsetChange,
  allowPan = true,
  children,
  className = '',
}: {
  scale: number;
  offset?: ImagePreviewOffset;
  onOffsetChange?: (offset: ImagePreviewOffset) => void;
  allowPan?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const canPan = allowPan && scale > 1 && Boolean(onOffsetChange);
  const [isPanning, setIsPanning] = useState(false);
  const suppressClickRef = useRef(false);
  const panSession = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    if (!canPan) {
      panSession.current = null;
      setIsPanning(false);
    }
  }, [canPan]);

  useEffect(() => {
    if (!canPan) return;

    const onMove = (event: PointerEvent) => {
      const session = panSession.current;
      if (!session || event.pointerId !== session.pointerId) return;
      const dx = event.clientX - session.startX;
      const dy = event.clientY - session.startY;
      if (!session.moved && Math.hypot(dx, dy) < PAN_THRESHOLD_PX) return;
      if (!session.moved) {
        session.moved = true;
        setIsPanning(true);
      }
      event.preventDefault();
      onOffsetChange?.({
        x: session.originX + dx,
        y: session.originY + dy,
      });
    };

    const onUp = (event: PointerEvent) => {
      const session = panSession.current;
      if (!session || event.pointerId !== session.pointerId) return;
      if (session.moved) suppressClickRef.current = true;
      panSession.current = null;
      setIsPanning(false);
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [canPan, onOffsetChange]);

  return (
    <div
      className={[
        'image-preview-zoom-viewport',
        canPan ? 'is-pannable' : '',
        isPanning ? 'is-panning' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onPointerDown={(event) => {
        if (!canPan || event.button !== 0) return;
        panSession.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          originX: offset.x,
          originY: offset.y,
          moved: false,
        };
      }}
      onClickCapture={(event) => {
        if (!suppressClickRef.current) return;
        suppressClickRef.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div
        className="image-preview-zoom-scaler"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
