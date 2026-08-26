import type { LibraryItem } from '@/types/library';
import {
  filterMaterialsByGroup,
  isMaterialExpired,
  isMaterialExpiringSoon,
  materialFormatLabel,
  materialSourceLabel,
} from '@/lib/libraryUtils';
import { BookMarked, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

interface ContextMaterialsPanelProps {
  library: LibraryItem[];
  onOpenPicker: (cat: string) => void;
  onPreview: (item: LibraryItem) => void;
  onRemove: (item: LibraryItem) => void;
}

function toneClasses(item: LibraryItem) {
  if (isMaterialExpired(item)) return 'from-[#9aa7b5] to-[#7d8a97]';
  if (item.cms) return 'from-[#8AD329] to-[#6FBD1F]';
  return 'from-[#54B9F9] to-[#3BA6E8]';
}

function MaterialSourceRow({
  item,
  onPreview,
  onRemove,
}: {
  item: LibraryItem;
  onPreview: (item: LibraryItem) => void;
  onRemove: (item: LibraryItem) => void;
}) {
  const expired = isMaterialExpired(item);
  const expiring = isMaterialExpiringSoon(item);

  return (
    <div
      className={cn(
        'group flex w-full items-start gap-1 rounded-xl border border-transparent p-1.5 transition',
        expired
          ? 'opacity-55 grayscale-[.35]'
          : 'hover:border-border/60 hover:bg-background/80 hover:shadow-soft'
      )}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-start gap-2 text-left"
        onClick={() => onPreview(item)}
        title={expired ? '该文件已过期，生成内容时将不会参考' : '点击查看详情'}
      >
      <span
        className={cn(
          'grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br shadow-[0_3px_8px_-2px_rgba(59, 150, 210,0.4)] ring-1 ring-white/40',
          toneClasses(item)
        )}
      >
        <BookMarked className="h-3.5 w-3.5 text-white" strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="min-w-0 flex-1 truncate text-[12px] font-medium text-foreground">{item.title}</div>
          {item.def && (
            <span className="shrink-0 rounded-full border border-[#FFB547]/35 bg-[#FFB547]/12 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-[#9a6207]">
              默认
            </span>
          )}
        </div>
        <div className="mt-0.5 text-[10px] leading-[1.45] text-muted-foreground">
          {[
            materialFormatLabel(item),
            materialSourceLabel(item),
            item.cms && item.validUntil && !expired ? `有效期至 ${item.validUntil}` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
          {expiring && <span className="text-destructive"> · 即将过期</span>}
          {expired && <span className="text-destructive"> · 已过期</span>}
        </div>
      </div>
      <ChevronRight className="mt-1 h-3 w-3 text-muted-foreground opacity-0 transition group-hover:opacity-60" />
      </button>
      <button
        type="button"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
        onClick={() => onRemove(item)}
        title={`移除引用：${item.title}`}
        aria-label={`移除引用：${item.title}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function AssetSection({
  title,
  badge,
  items,
  addable,
  onOpenPicker,
  onPreview,
  onRemove,
  category,
}: {
  title: string;
  badge?: number;
  items: LibraryItem[];
  addable?: boolean;
  onOpenPicker?: (cat: string) => void;
  onPreview: (item: LibraryItem) => void;
  onRemove: (item: LibraryItem) => void;
  category?: string;
}) {
  return (
    <div className="glass-card-subtle rounded-2xl p-2.5">
      <div className="mb-1.5 flex items-center justify-between px-1 text-[12px] leading-[1.25]">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          {title}
          {badge !== undefined && badge > 0 && (
            <span className="grid h-4 min-w-[16px] place-items-center rounded-full bg-gradient-to-br from-[#54B9F9] to-[#8AD329] px-1 text-[10px] font-bold text-white shadow-[0_2px_6px_-1px_rgba(59, 150, 210,0.5)]">
              {badge}
            </span>
          )}
        </div>
        {addable && category && onOpenPicker && (
          <button
            type="button"
            className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium text-primary transition hover:bg-primary/10"
            style={{ fontSize: 'inherit', lineHeight: 'inherit' }}
            onClick={() => onOpenPicker(category)}
          >
            <Plus className="h-3 w-3" strokeWidth={2.4} />
            添加
          </button>
        )}
      </div>
      <div className="space-y-1">
        {items.length > 0 ? (
          items.map((item) => (
            <MaterialSourceRow key={item.id} item={item} onPreview={onPreview} onRemove={onRemove} />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-border/80 bg-white/70 px-2 py-3 text-center text-[11px] text-muted-foreground">
            暂无引用素材
          </div>
        )}
      </div>
    </div>
  );
}

const SECTIONS: { title: string; groupId: 'knowledge' | 'strategy' | 'brief' | 'template' | 'brand'; category: string }[] = [
  { title: '参考知识', groupId: 'knowledge', category: '参考知识' },
  { title: '品牌策略', groupId: 'strategy', category: '品牌策略' },
  { title: 'Brief', groupId: 'brief', category: 'Brief' },
  { title: '模板', groupId: 'template', category: '模板' },
  { title: '品牌元素', groupId: 'brand', category: '品牌元素' },
];

export function ContextMaterialsPanel({
  library,
  onOpenPicker,
  onPreview,
  onRemove,
}: ContextMaterialsPanelProps) {
  const referencedMaterials = library.filter((item) => item.referenced ?? item.def);
  const defaultItems = library.filter((item) => item.def && item.referenced !== false);

  return (
    <div className="space-y-2">
      <AssetSection
        title="默认素材"
        badge={defaultItems.length}
        items={defaultItems}
        onPreview={onPreview}
        onRemove={onRemove}
      />
      {SECTIONS.map((section) => {
        const items = filterMaterialsByGroup(referencedMaterials, section.groupId);
        return (
          <AssetSection
            key={section.groupId}
            title={section.title}
            badge={items.length}
            items={items}
            addable
            category={section.category}
            onOpenPicker={onOpenPicker}
            onPreview={onPreview}
            onRemove={onRemove}
          />
        );
      })}
    </div>
  );
}
