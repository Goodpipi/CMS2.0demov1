import type { LibraryItem } from '@/types/library';
import { formatMaterialAddedTime } from '@/lib/libraryUtils';
import { BookMarked, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

interface ContextMaterialsPanelProps {
  library: LibraryItem[];
  onOpenPicker: (cat: string) => void;
  onPreview: (item: LibraryItem) => void;
  onRemove: (item: LibraryItem) => void;
}

function toneClasses(item: LibraryItem) {
  if (item.cms) return 'from-[#8AD329] to-[#6FBD1F]';
  return 'from-[#54B9F9] to-[#3BA6E8]';
}

function MaterialSourceRow({
  item,
  onPreview,
  onRemove,
  showAddedTime = false,
}: {
  item: LibraryItem;
  onPreview: (item: LibraryItem) => void;
  onRemove: (item: LibraryItem) => void;
  showAddedTime?: boolean;
}) {
  return (
    <div className="group flex w-full items-start gap-1 rounded-xl border border-transparent p-1.5 transition hover:border-border/60 hover:bg-background/80 hover:shadow-soft">
      <button
        type="button"
        className="flex min-w-0 flex-1 items-start gap-2 text-left"
        onClick={() => onPreview(item)}
        title="点击查看详情"
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
        <div className="mt-0.5 truncate text-[10px] text-muted-foreground">{item.meta}</div>
        {showAddedTime && (
          <div className="mt-0.5 text-[10px] text-muted-foreground/70">
            {formatMaterialAddedTime(item.addedAt)}
          </div>
        )}
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
      <div className="mb-1.5 flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
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
            className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium text-primary transition hover:bg-primary/10"
            onClick={() => onOpenPicker(category)}
          >
            <Plus className="h-3 w-3" />
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
          <div className="px-2 py-3 text-center text-[11px] text-muted-foreground">暂无引用素材</div>
        )}
      </div>
    </div>
  );
}

export function ContextMaterialsPanel({
  library,
  onOpenPicker,
  onPreview,
  onRemove,
}: ContextMaterialsPanelProps) {
  const referencedMaterials = library.filter((item) => item.referenced ?? item.def);
  const knowledgeItems = referencedMaterials.filter(
    (item) => !['参考模板', '模板', '品牌元素'].includes(item.cat)
  );
  const templateItems = referencedMaterials.filter((item) => ['参考模板', '模板'].includes(item.cat));
  const brandItems = referencedMaterials.filter((item) => item.cat === '品牌元素');

  return (
    <div className="space-y-2">
      <AssetSection
        title="参考知识"
        badge={knowledgeItems.length}
        items={knowledgeItems}
        addable
        category="参考知识"
        onOpenPicker={onOpenPicker}
        onPreview={onPreview}
        onRemove={onRemove}
      />
      <AssetSection
        title="模板"
        badge={templateItems.length}
        items={templateItems}
        addable
        category="模板"
        onOpenPicker={onOpenPicker}
        onPreview={onPreview}
        onRemove={onRemove}
      />
      <AssetSection
        title="品牌元素"
        badge={brandItems.length}
        items={brandItems}
        addable
        category="品牌元素"
        onOpenPicker={onOpenPicker}
        onPreview={onPreview}
        onRemove={onRemove}
      />
    </div>
  );
}
