import { useMemo, useRef, useState } from 'react';
import { Eraser, Image as ImageIcon, Paintbrush, Pencil, X } from 'lucide-react';
import {
  SelectableSvgPreview,
  type SelectableSvgPreviewHandle,
  type SelectableSvgToolState,
} from '@/app/components/SelectableSvgPreview';
import {
  ImagePreviewZoomControls,
  ImagePreviewZoomViewport,
  useImagePreviewZoom,
} from '@/app/components/ImagePreviewZoom';
import {
  exportImageAsJpg,
  exportImageAsPsd,
  exportLongImageAsPptx,
} from '@/app/components/longImageUtils';
import type { ImageStudioProduct, ImageStudioState } from '@/lib/imageStudioMocks';

export function ImageStudioTabs({
  state,
  onSelect,
  onClose,
}: {
  state: ImageStudioState;
  onSelect: (productId: string) => void;
  onClose: (productId: string) => void;
}) {
  if (!state.products.length) {
    return <span className="image-studio-tabs-placeholder">生成后的产物将显示在这里</span>;
  }
  return (
    <div className="image-studio-tabs" role="tablist" aria-label="海报与图片产物">
      {state.products.map((product) => (
        <div
          key={product.id}
          className={`image-studio-tab ${
            product.id === state.currentProductId ? 'active' : ''
          }`}
        >
          <button
            type="button"
            role="tab"
            aria-selected={product.id === state.currentProductId}
            onClick={() => onSelect(product.id)}
          >
            <ImageIcon className="image-studio-tab-icon" aria-hidden />
            <span>{product.title}</span>
          </button>
          <button
            type="button"
            className="image-studio-tab-close"
            aria-label={`关闭 ${product.title}`}
            onClick={() => onClose(product.id)}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function imageProductSvg(product: ImageStudioProduct): string {
  const landscape = product.kind === 'kv';
  const width = landscape ? 1024 : 576;
  const height = landscape ? 576 : 1024;
  const href = escapeXml(product.imageUrl);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><image data-edit-id="el-product-image" data-edit-label="海报画面" href="${href}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/></svg>`;
}

export function ImageStudioWorkspace({
  product,
  teamReviewInProgress,
  onEdit,
  onTeamReview,
  onSubmitVeeva,
  onToast,
}: {
  product: ImageStudioProduct;
  teamReviewInProgress: boolean;
  onEdit: () => void;
  onTeamReview: () => void;
  onSubmitVeeva: () => void;
  onToast: (message: string) => void;
}) {
  const previewRef = useRef<SelectableSvgPreviewHandle>(null);
  const [toolState, setToolState] = useState<SelectableSvgToolState>({
    brushActive: false,
    eraserActive: false,
    canClear: false,
  });
  const zoom = useImagePreviewZoom(product.id);
  const svgMarkup = useMemo(() => imageProductSvg(product), [product]);
  const landscape = product.kind === 'kv';

  return (
    <div className="workspace-surface-panel image-studio-workspace-panel">
      <div className="creator-ppt-toolbar image-studio-toolbar">
        <div className="creator-ppt-toolbar-page">
          <strong>{product.title}</strong>
          <span>{landscape ? '主视觉 KV' : '竖版海报'}</span>
        </div>
        <div className="creator-ppt-toolbar-tools" role="toolbar" aria-label="图片画布操作">
          <ImagePreviewZoomControls
            scale={zoom.scale}
            onZoomIn={zoom.zoomIn}
            onZoomOut={zoom.zoomOut}
            onReset={zoom.reset}
            canZoomIn={zoom.canZoomIn}
            canZoomOut={zoom.canZoomOut}
          />
          <button
            type="button"
            className={`creator-ppt-tool ${toolState.brushActive ? 'primary active' : ''}`}
            onClick={() => previewRef.current?.setBrushActive(!toolState.brushActive)}
          >
            <Paintbrush className="h-3.5 w-3.5" />
            画圈修改
          </button>
          <button
            type="button"
            className={`creator-ppt-tool ${toolState.eraserActive ? 'primary active' : ''}`}
            onClick={() => previewRef.current?.setEraserActive(!toolState.eraserActive)}
          >
            <Eraser className="h-3.5 w-3.5" />
            橡皮擦
          </button>
          <button type="button" className="creator-ppt-tool primary" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
            手动编辑
          </button>
        </div>
      </div>

      <div className={`image-studio-stage ${landscape ? 'is-landscape' : 'is-portrait'}`}>
        <ImagePreviewZoomViewport
          scale={zoom.scale}
          offset={zoom.offset}
          onOffsetChange={zoom.setOffset}
        >
          <SelectableSvgPreview
            ref={previewRef}
            key={product.id}
            svgMarkup={svgMarkup}
            imageSrc={product.imageUrl}
            selectedId={null}
            disableSelect
            hideToolbar
            onSelect={() => undefined}
            onToolStateChange={setToolState}
          />
        </ImagePreviewZoomViewport>
      </div>

      <div className="content-submit-actions image-studio-submit-actions">
        <div className="image-studio-export-actions">
          <button
            type="button"
            className="btn soft"
            onClick={() =>
              void exportImageAsJpg(product.imageUrl, product.title)
                .then(() => onToast('已导出 JPG'))
                .catch(() => onToast('导出 JPG 失败'))
            }
          >
            导出 JPG
          </button>
          <button
            type="button"
            className="btn soft"
            onClick={() =>
              void exportLongImageAsPptx(product.imageUrl, product.title)
                .then(() => onToast('已导出 PPTX'))
                .catch(() => onToast('导出 PPTX 失败'))
            }
          >
            导出 PPTX
          </button>
          <button
            type="button"
            className="btn soft"
            onClick={() =>
              void exportImageAsPsd(product.imageUrl, product.title)
                .then(() => onToast('已导出 PSD'))
                .catch(() => onToast('导出 PSD 失败'))
            }
          >
            导出 PSD
          </button>
        </div>
        <div className="image-studio-review-actions">
          <button
            type="button"
            className="btn warn"
            disabled={teamReviewInProgress}
            onClick={onTeamReview}
          >
            {teamReviewInProgress ? '意见收集中...' : '提交团队意见收集'}
          </button>
          <button type="button" className="btn green" onClick={onSubmitVeeva}>
            提交 Veeva 审批
          </button>
        </div>
      </div>
    </div>
  );
}
