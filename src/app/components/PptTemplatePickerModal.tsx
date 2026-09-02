import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';
import { isBlankPptTemplate, type PptBuiltinTemplate } from '@/app/components/pptTemplates';

export function PptTemplateThumb({ template }: { template: PptBuiltinTemplate }) {
  if (isBlankPptTemplate(template)) {
    return (
      <div className="ppt-template-preview ppt-template-preview-none">
        <span className="ppt-template-none-label">BLANK</span>
      </div>
    );
  }
  if (template.previewUrl) {
    return (
      <div className="ppt-template-preview">
        <img src={template.previewUrl} alt="" className="ppt-template-preview-img" />
      </div>
    );
  }
  return (
    <div className="ppt-template-preview" style={{ background: template.gradient }}>
      <span className="ppt-template-accent" style={{ background: template.accent }} />
    </div>
  );
}

interface PptTemplatePickerModalProps {
  open: boolean;
  templates: PptBuiltinTemplate[];
  selectedId: string | null;
  onClose: () => void;
  onConfirm: (templateId: string) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  className?: string;
}

export function PptTemplatePickerModal({
  open,
  templates,
  selectedId,
  onClose,
  onConfirm,
  title = '选择更多模板',
  description = '',
  confirmLabel = '使用此模板',
  className,
}: PptTemplatePickerModalProps) {
  const [pickedId, setPickedId] = useState<string | null>(selectedId);

  useEffect(() => {
    if (open) setPickedId(selectedId);
  }, [open, selectedId]);

  if (!open) return null;

  const picked = templates.find((item) => item.id === pickedId) ?? null;

  return (
    <div
      className="modal-bg show material-picker-bg"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={cn('modal ppt-more-template-modal', className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ppt-more-template-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ppt-more-template-head">
          <div>
            <h3 id="ppt-more-template-title">{title}</h3>
            {description ? <p>{description}</p> : null}
          </div>
          <button type="button" className="literature-picker-close" onClick={onClose} aria-label="关闭">
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>

        <div className="ppt-more-template-grid">
          {templates.map((tpl) => {
            const active = pickedId === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                className={cn('ppt-template-card', active && 'selected')}
                onClick={() => setPickedId(tpl.id)}
              >
                <PptTemplateThumb template={tpl} />
                <strong>{tpl.name}</strong>
                <div className="small">{tpl.styleTag}</div>
                <div className="small ppt-template-desc">{tpl.description}</div>
              </button>
            );
          })}
        </div>

        <div className="ppt-more-template-foot">
          <button type="button" className="btn" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={!picked}
            onClick={() => picked && onConfirm(picked.id)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
