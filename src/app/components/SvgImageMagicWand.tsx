import { useLayoutEffect, useState, type RefObject } from 'react';
import { WandSparkles } from 'lucide-react';
import { isSvgPictureElement } from '@/app/components/svgEditorUtils';

export function SvgImageMagicWand({
  hostRef,
  frameRef,
  selectedId,
  onClick,
}: {
  hostRef: RefObject<HTMLElement | null>;
  frameRef?: RefObject<HTMLElement | null>;
  selectedId: string | null;
  onClick?: () => void;
}) {
  const [box, setBox] = useState<{ top: number; left: number; width: number; height: number } | null>(
    null
  );

  useLayoutEffect(() => {
    const host = hostRef.current;
    const frame = frameRef?.current ?? host;
    if (!host || !frame || !selectedId) {
      setBox(null);
      return;
    }

    const measure = () => {
      const el = host.querySelector(`[data-edit-id="${CSS.escape(selectedId)}"]`);
      if (!el || !isSvgPictureElement(el)) {
        setBox(null);
        return;
      }
      const frameRect = frame.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      if (elRect.width < 2 || elRect.height < 2) {
        setBox(null);
        return;
      }
      setBox({
        top: elRect.top - frameRect.top + frame.scrollTop,
        left: elRect.left - frameRect.left + frame.scrollLeft,
        width: elRect.width,
        height: elRect.height,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(host);
    const selected = host.querySelector(`[data-edit-id="${CSS.escape(selectedId)}"]`);
    if (selected) observer.observe(selected);
    host.addEventListener('pointermove', measure);
    frame.addEventListener('pointermove', measure);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      observer.disconnect();
      host.removeEventListener('pointermove', measure);
      frame.removeEventListener('pointermove', measure);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [frameRef, hostRef, selectedId]);

  if (!box) return null;

  return (
    <div
      className="svg-image-magic-frame"
      style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
    >
      <button
        type="button"
        className="svg-image-magic-wand"
        aria-label="用 AI 修改图片"
        title="用 AI 修改图片"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onClick?.();
        }}
      >
        <WandSparkles className="h-3 w-3" strokeWidth={2.4} />
      </button>
    </div>
  );
}
