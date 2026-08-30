import type { LibraryItem } from '@/types/library';
import {
  formatMaterialAddedTime,
  isMaterialExpired,
  isMaterialExpiringSoon,
  materialFormatLabel,
  materialSourceLabel,
} from '@/lib/libraryUtils';
import { Check, FileText, Trash2 } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

function toneGradient(item: LibraryItem) {
  if (isMaterialExpired(item)) return 'from-[#9aa7b5] to-[#7d8a97]';
  if (item.cms) return 'from-[#8AD329] to-[#6FBD1F]';
  return 'from-[#54B9F9] to-[#3BA6E8]';
}

interface LibraryMaterialCardProps {
  item: LibraryItem;
  selected: boolean;
  onToggleSelect: () => void;
  onPreview: () => void;
  onDelete: () => void;
}

export function LibraryMaterialCard({
  item,
  selected,
  onToggleSelect,
  onPreview,
  onDelete,
}: LibraryMaterialCardProps) {
  const expired = isMaterialExpired(item);
  const expiring = isMaterialExpiringSoon(item);

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-2xl glass-card glass-hover p-3.5 transition',
        expired ? 'opacity-55 grayscale-[.35]' : 'hover:-translate-y-0.5 hover:shadow-glow',
        selected
          ? 'border-[#54B9F9] ring-2 ring-[#54B9F9]/30'
          : 'border-border/60 hover:border-primary/40'
      )}
      onClick={onPreview}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPreview();
        }
      }}
      role="button"
      tabIndex={0}
    >
      {selected && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#54B9F9]/8 to-[#8AD329]/8" />
      )}

      <div className="relative z-10 mb-2.5 flex items-center justify-between">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          className={cn(
            'grid h-5 w-5 place-items-center rounded-md border transition',
            selected
              ? 'border-[#54B9F9] bg-gradient-to-br from-[#54B9F9] to-[#3BA6E8] text-white shadow-[0_3px_8px_-2px_rgba(59, 150, 210,0.5)]'
              : 'border-border bg-background hover:border-primary'
          )}
          aria-label={`选择素材 ${item.title}`}
        >
          {selected && <Check className="h-3 w-3" strokeWidth={3.5} />}
        </button>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground/50 transition hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="删除知识"
            aria-label={`删除 ${item.title}`}
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div className="relative z-10 flex items-start gap-2.5">
        <span
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br shadow-[0_4px_10px_-2px_rgba(59, 150, 210,0.4)] ring-1 ring-white/40',
            toneGradient(item)
          )}
        >
          <FileText className="h-4 w-4 text-white" strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-2 text-[13px] font-semibold leading-tight text-foreground">{item.title}</h4>
          <dl className="mt-1.5 space-y-0.5 text-[11px] leading-[1.45] text-muted-foreground">
            <div>格式：{materialFormatLabel(item)}</div>
            <div>来源：{materialSourceLabel(item)}</div>
            <div>品牌：{item.brand || '全品牌通用'}</div>
            {item.cms && item.validUntil && !expired && <div>有效期至 {item.validUntil}</div>}
            {expired && <div className="text-destructive">已过期</div>}
            <div>添加于 {formatMaterialAddedTime(item.addedAt)}</div>
          </dl>
          {expiring && (
            <span className="mt-1.5 inline-flex rounded-full border border-destructive/40 bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-white">
              即将过期
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
