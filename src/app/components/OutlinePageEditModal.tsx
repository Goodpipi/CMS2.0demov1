import { useEffect, useState } from 'react';
import type { OutlineRefImage } from '@/types/content';

interface OutlinePageEditModalProps {
  open: boolean;
  title?: string;
  placeholder?: string;
  onCancel: () => void;
  onConfirm: (instruction: string) => void;
}

export function OutlineCiteMarks({ cites }: { cites?: number[] }) {
  const nums = [...new Set((cites || []).filter((n) => Number.isFinite(n) && n > 0))];
  if (!nums.length) return null;
  return (
    <sup className="outline-cite" aria-label={`参考文献 ${nums.join('、')}`}>
      {nums.join(',')}
    </sup>
  );
}

export function OutlineStaticField({
  label,
  value,
  empty = '暂无',
  cites,
}: {
  label: string;
  value?: string;
  empty?: string;
  cites?: number[];
}) {
  const text = (value || '').trim();
  return (
    <div className="ppt-page-field">
      <span>{label}</span>
      <div className={`ppt-page-static ${text ? '' : 'is-empty'}`}>
        {text ? (
          <>
            {text}
            <OutlineCiteMarks cites={cites} />
          </>
        ) : (
          empty
        )}
      </div>
    </div>
  );
}

export function OutlineStaticList({
  label,
  items,
  empty = '暂无',
  itemCites,
  numbered = true,
}: {
  label: string;
  items?: string[];
  empty?: string;
  itemCites?: number[][];
  numbered?: boolean;
}) {
  const list = (items || []).map((item) => item.trim()).filter(Boolean);
  const ListTag = numbered ? 'ol' : 'ul';
  return (
    <div className="ppt-page-field">
      <span>{label}</span>
      {list.length ? (
        <ListTag className={`ppt-page-static-list ${numbered ? 'is-numbered' : 'is-plain'}`}>
          {list.map((item, index) => (
            <li key={`${index}-${item}`}>
              {numbered ? <span className="outline-ref-num">{index + 1}</span> : null}
              <span className="outline-ref-text">
                {item}
                <OutlineCiteMarks cites={itemCites?.[index]} />
              </span>
            </li>
          ))}
        </ListTag>
      ) : (
        <div className="ppt-page-static is-empty">{empty}</div>
      )}
    </div>
  );
}

export function OutlineReferencedImages({
  label = '引用图片',
  images,
  empty = '暂无引用图片',
}: {
  label?: string;
  images?: OutlineRefImage[];
  empty?: string;
}) {
  const list = (images || []).filter((item) => item.url);
  return (
    <div className="ppt-page-field">
      <span>{label}</span>
      {list.length ? (
        <div className="outline-ref-images">
          {list.map((item, index) => (
            <figure key={`${item.url}-${index}`} className="outline-ref-image">
              <img src={item.url} alt={item.alt || item.caption || '引用图片'} />
              {item.cites?.length ? (
                <span className="outline-ref-image-badge" aria-label={`参考文献 ${item.cites.join('、')}`}>
                  {item.cites.join(',')}
                </span>
              ) : null}
              {item.caption ? (
                <figcaption>
                  {item.caption}
                  <OutlineCiteMarks cites={item.cites} />
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      ) : (
        <div className="ppt-page-static is-empty">{empty}</div>
      )}
    </div>
  );
}

export function OutlinePageEditModal({
  open,
  title = '请告知AI您想如何修改本页大纲',
  placeholder = '例如：把核心结论提前，并补充一条随访建议',
  onCancel,
  onConfirm,
}: OutlinePageEditModalProps) {
  const [instruction, setInstruction] = useState('');

  useEffect(() => {
    if (open) setInstruction('');
  }, [open]);

  if (!open) return null;

  const trimmed = instruction.trim();

  return (
    <div
      className="modal-bg show"
      role="presentation"
      onClick={(event) => {
        if ((event.target as HTMLElement).classList.contains('modal-bg')) onCancel();
      }}
    >
      <div
        className="modal confirm-modal outline-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="outline-edit-title"
      >
        <h3 id="outline-edit-title">{title}</h3>
        <textarea
          className="outline-edit-input"
          value={instruction}
          placeholder={placeholder}
          autoFocus
          onChange={(event) => setInstruction(event.target.value)}
        />
        <div className="quick-row confirm-modal-actions">
          <button type="button" className="btn" onClick={onCancel}>
            取消
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={!trimmed}
            onClick={() => onConfirm(trimmed)}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
