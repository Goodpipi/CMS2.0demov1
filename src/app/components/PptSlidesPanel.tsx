import type { PptSlide } from '@/types/content';
import { slideToPreviewUrl } from '@/app/components/pptUtils';
import { downloadDataUrl } from '@/lib/copyRevisionUtils';

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

  return (
    <div className="ppt-slides-panel">
      <div className="ppt-slide-grid">
        {slides.map((slide, index) => {
          const preview = slideToPreviewUrl(slide);
          return (
            <div key={slide.page ?? index} className="ppt-slide-card">
              <div className="ppt-slide-preview">
                <img src={preview} alt={slide.title} />
              </div>
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
