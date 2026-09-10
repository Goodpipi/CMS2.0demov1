import { useState, type ReactNode } from 'react';
import type { LibraryItem } from '@/types/library';
import {
  filterMaterialsByGroup,
  type MaterialGroupId,
  isMaterialExpired,
  isMaterialExpiringSoon,
  materialFormatLabel,
  materialSourceLabel,
} from '@/lib/libraryUtils';
import { BookMarked, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

interface ContextMaterialsPanelProps {
  library: LibraryItem[];
  variant?: 'default' | 'case' | 'poster' | 'evidence' | 'insight' | 'promo' | 'video';
  citedItemIds?: number[];
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
  cited,
  onPreview,
  onRemove,
}: {
  item: LibraryItem;
  cited?: boolean;
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
          {cited && <span className="context-literature-cited-tag">已引用</span>}
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

const LITERATURE_CONTEXT_HINT_THRESHOLD = 10;
const LITERATURE_CONTEXT_HINT = '由于模型上下文限制，系统会优先筛选关联度最高的文献';

function AssetSection({
  title,
  badge,
  items,
  addable,
  onOpenPicker,
  onPreview,
  onRemove,
  category,
  collapsible = false,
  extraActions,
  emptyText,
  hint,
  citedItemIds,
}: {
  title: string;
  badge?: number;
  items: LibraryItem[];
  addable?: boolean;
  onOpenPicker?: (cat: string) => void;
  onPreview: (item: LibraryItem) => void;
  onRemove: (item: LibraryItem) => void;
  category?: string;
  collapsible?: boolean;
  extraActions?: ReactNode;
  emptyText?: string;
  hint?: ReactNode;
  citedItemIds?: number[];
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="context-material-section glass-card-subtle rounded-2xl p-2.5">
      <div className="mb-1.5 flex items-center justify-between px-1 text-[12px] leading-[1.25]">
        <button
          type="button"
          className={cn(
            'flex min-w-0 flex-1 items-center gap-1.5 rounded-lg py-0.5 text-left font-semibold text-foreground',
            collapsible && 'transition hover:text-primary'
          )}
          aria-expanded={expanded}
          onClick={() => collapsible && setExpanded((value) => !value)}
        >
          {collapsible && (
            <ChevronDown
              className={cn('h-3.5 w-3.5 shrink-0 transition-transform', !expanded && '-rotate-90')}
              strokeWidth={2.4}
            />
          )}
          <span className="truncate">{title}</span>
          {badge !== undefined && badge > 0 && (
            <span className="grid h-4 min-w-[16px] place-items-center rounded-full bg-gradient-to-br from-[#54B9F9] to-[#8AD329] px-1 text-[10px] font-bold text-white shadow-[0_2px_6px_-1px_rgba(59,150,210,0.5)]">
              {badge}
            </span>
          )}
        </button>
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
        {extraActions}
      </div>
      {hint}
      {expanded && <div className="space-y-1">
        {items.length > 0 ? (
          items.map((item) => (
            <MaterialSourceRow
              key={item.id}
              item={item}
              cited={citedItemIds?.includes(item.id)}
              onPreview={onPreview}
              onRemove={onRemove}
            />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-border/80 bg-white/70 px-2 py-3 text-center text-[11px] text-muted-foreground">
            {emptyText || '暂无引用素材'}
          </div>
        )}
      </div>}
    </div>
  );
}

interface MaterialSectionDef {
  title: string;
  groupId?: MaterialGroupId;
  cats?: string[];
  category: string;
}

const SECTIONS: MaterialSectionDef[] = [
  { title: '参考知识', groupId: 'knowledge', category: '参考知识' },
  { title: '品牌策略', groupId: 'strategy', category: '品牌策略' },
  { title: '任务提案', groupId: 'brief', category: 'Brief' },
];

const PROMO_SECTIONS: MaterialSectionDef[] = [
  { title: '品牌策略', groupId: 'strategy', category: '品牌策略' },
  { title: '任务提案', groupId: 'brief', category: 'Brief' },
  { title: '参考知识', groupId: 'knowledge', category: '参考知识' },
  { title: '参考文献', groupId: 'literature', category: '参考文献' },
];

const CASE_SECTIONS: MaterialSectionDef[] = [
  { title: '病例素材', cats: ['病例素材'], category: '病例素材' },
  { title: '参考知识', groupId: 'knowledge', category: '参考知识' },
  { title: '点评示例', cats: ['点评示例'], category: '点评示例' },
];

const POSTER_SECTIONS: MaterialSectionDef[] = [
  { title: '视觉参考', cats: ['视觉参考'], category: '视觉参考' },
];

const VIDEO_SECTIONS: MaterialSectionDef[] = [
  { title: '品牌策略', groupId: 'strategy', category: '品牌策略' },
  { title: '视频参考资料', cats: ['视频参考资料'], category: '视频参考资料' },
  { title: '视觉参考', cats: ['视觉参考'], category: '视觉参考' },
];

const EVIDENCE_SECTIONS: MaterialSectionDef[] = [
  { title: '目标解读材料', cats: ['目标解读材料'], category: '目标解读材料' },
  { title: '其他参考知识', groupId: 'knowledge', cats: ['其他参考知识'], category: '其他参考知识' },
];

const INSIGHT_SECTIONS: MaterialSectionDef[] = [
  { title: '参考知识', groupId: 'knowledge', category: '参考知识' },
  { title: '品牌策略', groupId: 'strategy', category: '品牌策略' },
];

function sectionsForVariant(variant: ContextMaterialsPanelProps['variant']): MaterialSectionDef[] {
  if (variant === 'case') return CASE_SECTIONS;
  if (variant === 'poster') return POSTER_SECTIONS;
  if (variant === 'video') return VIDEO_SECTIONS;
  if (variant === 'evidence') return EVIDENCE_SECTIONS;
  if (variant === 'insight') return INSIGHT_SECTIONS;
  if (variant === 'promo') return PROMO_SECTIONS;
  return SECTIONS;
}

function unifiedAddCategory(variant: ContextMaterialsPanelProps['variant']): string {
  if (variant === 'poster') return '视觉参考';
  if (variant === 'video') return '视频参考资料';
  if (variant === 'evidence') return '目标解读材料';
  return '参考知识';
}

function sectionItems(section: MaterialSectionDef, referencedMaterials: LibraryItem[]): LibraryItem[] {
  const byGroup = section.groupId ? filterMaterialsByGroup(referencedMaterials, section.groupId) : [];
  const byCats = section.cats
    ? referencedMaterials.filter((item) => section.cats?.includes(item.cat))
    : [];
  if (section.groupId && section.cats) {
    const seen = new Set<number>();
    return [...byGroup, ...byCats].filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }
  return section.groupId ? byGroup : byCats;
}

export function ContextMaterialsPanel({
  library,
  variant = 'default',
  citedItemIds,
  onOpenPicker,
  onPreview,
  onRemove,
}: ContextMaterialsPanelProps) {
  const referencedMaterials = library.filter((item) => item.referenced ?? item.def);
  const sections = sectionsForVariant(variant);

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="context-materials-unified-add"
        onClick={() => onOpenPicker(unifiedAddCategory(variant))}
        aria-label="添加材料"
      >
        <span className="context-materials-unified-add-icon">
          <Plus className="h-4 w-4" strokeWidth={2.4} />
        </span>
        <span>添加材料</span>
      </button>
      {sections.map((section) => {
        const items = sectionItems(section, referencedMaterials);
        const isLiterature = section.category === '参考文献' || section.groupId === 'literature';
        return (
          <AssetSection
            key={section.title}
            title={section.title}
            badge={items.length}
            items={items}
            category={section.category}
            citedItemIds={citedItemIds}
            onPreview={onPreview}
            onRemove={onRemove}
            collapsible
            hint={
              isLiterature && items.length > LITERATURE_CONTEXT_HINT_THRESHOLD ? (
                <p className="context-literature-limit-hint">{LITERATURE_CONTEXT_HINT}</p>
              ) : undefined
            }
          />
        );
      })}
    </div>
  );
}
