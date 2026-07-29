import { useState } from 'react';
import type { PptSlide } from '@/types/content';
import { slideToPreviewUrl } from '@/app/components/pptUtils';
import { downloadDataUrl } from '@/lib/copyRevisionUtils';

function PptSlidePreviewImage({ slide, index }: { slide: PptSlide; index: number }) {
  const [failed, setFailed] = useState(false);
  const preview = slideToPreviewUrl(slide);
  if (failed) {
    return (
      <div className="ppt-slide-preview ppt-slide-preview-fallback">
        <span className="small">第 {slide.page ?? index + 1} 页 · {slide.title || '预览加载失败'}</span>
      </div>
    );
  }
  return (
    <div className="ppt-slide-preview">
      <img src={preview} alt={slide.title} onError={() => setFailed(true)} />
    </div>
  );
}

interface PptSlidesPanelProps {
  slides: PptSlide[];
  title?: string;
  onEditSlide: (index: number, previewUrl: string) => void;
}

function safeFilename(text: string): string {
  return text.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim() || 'PPT';
}

export function PptSlidesPanel({ slides, title, onEditSlide }: PptSlidesPanelProps) {
  const deckTitle = safeFilename(title || 'PPT');

  const exportSlide = (slide: PptSlide, index: number) => {
    const url = slideToPreviewUrl(slide);
    const pageNo = slide.page || index + 1;
    downloadDataUrl(url, `${deckTitle}-第${pageNo}页-${safeFilename(slide.title || '')}.png`);
  };

  if (!slides.length) return null;

  return (
    <div className="ppt-slides-panel">
      <div className="ppt-slide-grid">
        {slides.map((slide, index) => {
          const preview = slideToPreviewUrl(slide);
          return (
            <div
              key={slide.page ?? index}
              className="ppt-slide-card"
            >
              <PptSlidePreviewImage slide={slide} index={index} />
              <div className="ppt-slide-card-meta">
                <strong>
                  第 {slide.page ?? index + 1} 页 · {slide.title}
                </strong>
                <div className="quick-row" style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className="btn soft"
                    style={{ flex: 1 }}
                    onClick={() => onEditSlide(index, preview)}
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{ flex: 1 }}
                    onClick={() => exportSlide(slide, index)}
                  >
                    导出
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
