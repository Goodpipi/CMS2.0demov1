import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/app/components/ui/utils';

export type VersionTimelineKind = 'major' | 'minor';

export interface VersionTimelineItem {
  id: string;
  label: string;
  title?: string;
  kind: VersionTimelineKind;
}

interface VersionFisheyeTimelineProps {
  items: VersionTimelineItem[];
  activeId: string;
  onSelect: (id: string) => void;
  ariaLabel: string;
}

const INFLUENCE = 100;
const MAX_MINOR_SCALE = 3.05;

function fisheyeScale(distance: number, focus: number | null): number {
  if (focus == null) return 1;
  const t = Math.max(0, 1 - Math.abs(distance) / INFLUENCE);
  return 1 + (MAX_MINOR_SCALE - 1) * (0.5 - 0.5 * Math.cos(Math.PI * t));
}

export function VersionFisheyeTimeline({
  items,
  activeId,
  onSelect,
  ariaLabel,
}: VersionFisheyeTimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [focusX, setFocusX] = useState<number | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const updateFocus = useCallback((clientX: number | null) => {
    const track = trackRef.current;
    if (clientX == null || !track) {
      setFocusX(null);
      return;
    }
    setFocusX(clientX - track.getBoundingClientRect().left);
  }, []);

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeId)
  );
  const progress =
    items.length <= 1 ? 0 : (activeIndex / (items.length - 1)) * 100;

  return (
    <div
      className="version-fisheye"
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={Math.max(items.length - 1, 0)}
      aria-valuenow={activeIndex}
      aria-valuetext={items[activeIndex]?.label}
      onMouseLeave={() => updateFocus(null)}
      onMouseMove={(event) => updateFocus(event.clientX)}
    >
      <div className="version-fisheye-rail" aria-hidden>
        <i style={{ width: `${progress}%` }} />
      </div>
      <div ref={trackRef} className="version-fisheye-nodes">
        {items.map((item, index) => {
          const node = nodeRefs.current[index];
          const center = node ? node.offsetLeft + node.offsetWidth / 2 : 0;
          const scale =
            reduceMotion || item.kind !== 'minor'
              ? 1
              : fisheyeScale(center - (focusX ?? 0), focusX);
          const spread = !reduceMotion && item.kind === 'minor' ? (scale - 1) * 11 : 0;
          const next = items[index + 1];
          const showSplit = item.kind === 'major' && next?.kind === 'minor';

          return (
            <div key={item.id} className="version-fisheye-slot">
              <button
                ref={(el) => {
                  nodeRefs.current[index] = el;
                }}
                type="button"
                className={cn(
                  'version-fisheye-node',
                  `is-${item.kind}`,
                  item.id === activeId && 'is-active'
                )}
                title={item.title || item.label}
                aria-label={item.kind === 'major' ? `大版本 ${item.label}` : `小版本 ${item.label}`}
                aria-current={item.id === activeId ? 'step' : undefined}
                style={{
                  marginLeft: spread,
                  marginRight: spread,
                  ['--fisheye-scale' as string]: String(scale),
                }}
                onClick={() => onSelect(item.id)}
                onFocus={() => {
                  const el = nodeRefs.current[index];
                  if (el) updateFocus(el.offsetLeft + el.offsetWidth / 2);
                }}
              >
                <span className="version-fisheye-dot" />
                <span className="version-fisheye-label">{item.label}</span>
              </button>
              {showSplit ? <span className="version-fisheye-split" aria-hidden /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
