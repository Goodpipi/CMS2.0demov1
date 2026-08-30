import { useState } from 'react';
import { BAYER_WH_PRODUCTS, type TaskProduct } from '@/lib/products';
import { cn } from '@/app/components/ui/utils';

interface ProductPickerModalProps {
  open: boolean;
  onConfirm: (product: TaskProduct) => void;
  onCancel: () => void;
}

export function ProductPickerModal({ open, onConfirm, onCancel }: ProductPickerModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (!open) return null;

  const selected = BAYER_WH_PRODUCTS.find((item) => item.id === selectedId) ?? null;

  return (
    <div
      className="modal-bg show product-picker-bg"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        className="modal product-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-picker-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4">
          <h3 id="product-picker-title" className="text-[18px] font-semibold tracking-tight text-foreground">
            选择任务产品
          </h3>
          <p className="mt-1.5 text-[12.5px] text-muted-foreground">
            先指定本任务对应的拜耳女性健康产品，后续生成将围绕该产品展开。
          </p>
        </div>

        <div className="product-picker-grid">
          {BAYER_WH_PRODUCTS.map((product) => {
            const active = product.id === selectedId;
            return (
              <button
                key={product.id}
                type="button"
                className={cn('product-picker-card', active && 'is-active')}
                onClick={() => setSelectedId(product.id)}
              >
                <span className="product-picker-cat">{product.category}</span>
                <strong>{product.name}</strong>
                <span className="product-picker-en">{product.en}</span>
                <span className="product-picker-hint">{product.hint}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn" onClick={onCancel}>
            返回首页
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={!selected}
            onClick={() => selected && onConfirm(selected)}
          >
            确认产品
          </button>
        </div>
      </div>
    </div>
  );
}
