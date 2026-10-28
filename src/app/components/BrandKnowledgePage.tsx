import { useEffect, useMemo, useState } from 'react';
import {
  BookMarked,
  BookOpen,
  Check,
  ChevronLeft,
  Lightbulb,
  Search,
  Star,
  Target,
  X,
} from 'lucide-react';
import { cn } from '@/app/components/ui/utils';
import {
  BRAND_KB_BRANDS,
  BRAND_KB_ITEMS,
  BRAND_KB_SLIDES,
  type BrandKbBrand,
  type BrandKbCategory,
  type BrandKbItem,
} from '@/lib/brandKnowledgeMocks';

const CATEGORIES: { id: BrandKbCategory; label: string; Icon: typeof Target }[] = [
  { id: 'strategy', label: '品牌策略', Icon: Target },
  { id: 'literature', label: '常用文献', Icon: BookOpen },
  { id: 'knowledge', label: '常用知识参考', Icon: Lightbulb },
];

function matchesQuery(item: BrandKbItem, keyword: string): boolean {
  if (!keyword) return true;
  return [item.title, item.summary, item.meta, item.format, ...item.tags].some((text) =>
    text.toLowerCase().includes(keyword)
  );
}

function VisualPreview({ item, brand }: { item: BrandKbItem; brand: BrandKbBrand }) {
  if (item.previewUrl) {
    return (
      <img
        src={item.previewUrl}
        alt={item.title}
        className="h-full w-full object-cover"
      />
    );
  }
  return (
    <div className="relative h-full w-full bg-white">
      <div className="absolute inset-x-0 top-0 h-[14%]" style={{ background: brand.accent }} />
      <div className="absolute left-[7%] top-[24%] h-2.5 w-[52%] rounded-full" style={{ background: brand.accent }} />
      <div className="absolute left-[7%] top-[40%] h-[42%] w-[40%] rounded-lg" style={{ background: brand.accentSoft }} />
      <div className="absolute left-[52%] top-[42%] h-1.5 w-[38%] rounded-full bg-slate-300" />
      <div className="absolute left-[52%] top-[54%] h-1.5 w-[32%] rounded-full bg-slate-200" />
      <div className="absolute left-[52%] top-[66%] h-1.5 w-[36%] rounded-full bg-slate-200" />
    </div>
  );
}

function ItemCard({
  item,
  brand,
  onOpen,
}: {
  item: BrandKbItem;
  brand: BrandKbBrand;
  onOpen: () => void;
}) {
  const category = CATEGORIES.find((c) => c.id === item.category)!;
  const Icon = category.Icon;
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      className="brand-kb-card group flex cursor-pointer flex-col overflow-hidden rounded-2xl glass-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow"
    >
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
            style={{ background: brand.accentSoft, color: brand.accent }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 truncate text-[10.5px] text-muted-foreground">{item.meta}</span>
        </div>
        <h3 className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-foreground">{item.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-[1.6] text-muted-foreground">{item.summary}</p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold"
              style={{ background: brand.accentSoft, color: brand.accent }}
            >
              {tag}
            </span>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground">{item.format}</span>
        </div>
      </div>
    </article>
  );
}

function ItemPreviewModal({
  item,
  brand,
  onClose,
  onCollect,
}: {
  item: BrandKbItem;
  brand: BrandKbBrand;
  onClose: () => void;
  onCollect: () => void;
}) {
  const category = CATEGORIES.find((c) => c.id === item.category)!;
  return (
    <div
      className="modal-bg show"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal brand-kb-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="brand-kb-preview-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="rounded-md px-2 py-0.5 font-semibold" style={{ background: brand.accentSoft, color: brand.accent }}>
                {category.label}
              </span>
              <span>{brand.name}</span>
              <span>·</span>
              <span>{item.format}</span>
            </div>
            <h3 id="brand-kb-preview-title" className="text-[17px] font-semibold leading-snug text-foreground">
              {item.title}
            </h3>
          </div>
          <button type="button" className="literature-picker-close" onClick={onClose} aria-label="关闭预览">
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
        <dl className="mt-4 grid gap-3 text-[12.5px]">
          <div>
            <dt className="mb-1 text-[11px] font-semibold text-muted-foreground">内容摘要</dt>
            <dd className="leading-relaxed text-foreground">{item.summary}</dd>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="mb-1 text-[11px] font-semibold text-muted-foreground">来源</dt>
              <dd className="text-foreground">{item.meta}</dd>
            </div>
            <div>
              <dt className="mb-1 text-[11px] font-semibold text-muted-foreground">最近更新</dt>
              <dd className="text-foreground">{item.updatedAt}</dd>
            </div>
          </div>
        </dl>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn soft rounded-xl px-4 py-2 text-[12px] font-medium" onClick={onClose}>
            关闭
          </button>
          <button
            type="button"
            className="btn-hero-3d inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold"
            onClick={onCollect}
          >
            <Star className="h-3.5 w-3.5" />
            收藏到个人知识
          </button>
        </div>
      </div>
    </div>
  );
}

interface BrandKnowledgePageProps {
  onNotify: (message: string) => void;
  onBack: () => void;
}

export function BrandKnowledgePage({ onNotify, onBack }: BrandKnowledgePageProps) {
  const [brandId, setBrandId] = useState(BRAND_KB_BRANDS[0].id);
  const [category, setCategory] = useState<BrandKbCategory>('strategy');
  const [query, setQuery] = useState('');
  const [previewItem, setPreviewItem] = useState<BrandKbItem | null>(null);

  const brand = BRAND_KB_BRANDS.find((b) => b.id === brandId) ?? BRAND_KB_BRANDS[0];
  const keyword = query.trim().toLowerCase();

  useEffect(() => {
    if (!previewItem) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewItem(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previewItem]);

  const categoryCounts = useMemo(() => {
    const counts = { strategy: 0, literature: 0, knowledge: 0 };
    for (const item of BRAND_KB_ITEMS) {
      if (item.brandId === brandId) counts[item.category] += 1;
    }
    return counts;
  }, [brandId]);

  const visibleItems = useMemo(
    () =>
      BRAND_KB_ITEMS.filter(
        (item) => item.brandId === brandId && item.category === category && matchesQuery(item, keyword)
      ),
    [brandId, category, keyword]
  );

  return (
    <div className="page relative z-10 px-6 pb-8 lg:px-10">
      <button
        type="button"
        className="mb-4 inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition hover:text-primary"
        onClick={onBack}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        返回首页
      </button>
      <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="sparkle-surface grid h-11 w-11 place-items-center rounded-2xl bg-hero-gradient text-white shadow-glow">
              <BookMarked className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-[28px] font-semibold tracking-tight text-foreground">品牌知识库</h2>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                {`正在查看「${brand.name}」的品牌策略、文献与知识参考`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex w-full max-w-2xl flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[12.5px] text-muted-foreground">当前品牌</span>
            <select
              className="brand-kb-brand-select rounded-xl border border-border/70 bg-glass px-3 py-2.5 text-[12.5px] font-medium text-foreground shadow-soft outline-none transition hover:border-primary/40 focus:border-[#54B9F9]/50 focus:ring-4 focus:ring-[#54B9F9]/10"
              value={brandId}
              onChange={(event) => setBrandId(event.target.value)}
              aria-label="切换品牌"
            >
              {BRAND_KB_BRANDS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="relative min-w-[180px] flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索标题、来源、标签…"
              className="glass-input w-full rounded-xl border border-border/70 py-2.5 pl-10 pr-3 text-[13px] outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </div>
      </div>

      <div className="mb-5 flex gap-1 rounded-2xl border border-border/70 bg-white/70 p-1.5 shadow-sm">
        {CATEGORIES.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setCategory(id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition',
              category === id
                ? 'bg-hero-gradient text-white shadow-glow'
                : 'text-muted-foreground hover:bg-white hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            <span className={cn('rounded-full px-2 py-0.5 text-[10px]', category === id ? 'bg-white/16 text-white' : 'bg-secondary text-muted-foreground')}>
              {categoryCounts[id]}
            </span>
          </button>
        ))}
      </div>

      {visibleItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {visibleItems.map((item) => (
            <ItemCard key={item.id} item={item} brand={brand} onOpen={() => setPreviewItem(item)} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-white/60 px-6 py-12 text-center">
          <Search className="mx-auto h-7 w-7 text-muted-foreground/60" />
          <p className="mt-3 text-[13px] font-semibold text-foreground">没有找到匹配的内容</p>
          <button type="button" onClick={() => setQuery('')} className="mt-2 text-[11.5px] font-medium text-primary hover:underline">
            清除搜索条件
          </button>
        </div>
      )}

      {previewItem && (
        <ItemPreviewModal
          item={previewItem}
          brand={BRAND_KB_BRANDS.find((b) => b.id === previewItem.brandId) ?? brand}
          onClose={() => setPreviewItem(null)}
          onCollect={() => {
            onNotify(`已收藏「${previewItem.title}」到个人知识收藏`);
            setPreviewItem(null);
          }}
        />
      )}
    </div>
  );
}

export function StockSlidePickerModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (items: BrandKbItem[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelectedIds([]);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const keyword = query.trim().toLowerCase();
  const visible = useMemo(
    () => BRAND_KB_SLIDES.filter((item) => matchesQuery(item, keyword)),
    [keyword]
  );

  if (!open) return null;

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div
      className="modal-bg show stock-slide-picker-bg"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal stock-slide-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-slide-picker-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="stock-slide-picker-head">
          <div>
            <h3 id="stock-slide-picker-title">插入常用幻灯</h3>
            <p>来自品牌素材库的全部常用单页幻灯，可多选后插入到当前位置。</p>
          </div>
          <button type="button" className="literature-picker-close" onClick={onClose} aria-label="关闭">
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
        <div className="stock-slide-picker-toolbar">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索标题、来源、标签…"
              className="glass-input w-full rounded-xl border border-border/70 py-2 pl-9 pr-3 text-[13px] outline-none"
            />
          </div>
        </div>
        <div className="stock-slide-picker-grid">
          {visible.map((item) => {
            const brand = BRAND_KB_BRANDS.find((entry) => entry.id === item.brandId);
            const selected = selectedIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={cn('stock-slide-picker-card', selected && 'is-selected')}
                aria-pressed={selected}
                onClick={() => toggle(item.id)}
              >
                <span className={cn('stock-slide-picker-check', selected && 'is-on')}>
                  {selected ? <Check className="h-3 w-3" strokeWidth={2.6} /> : null}
                </span>
                <span className="stock-slide-picker-thumb">
                  {brand ? <VisualPreview item={item} brand={brand} /> : null}
                </span>
                <span className="stock-slide-picker-meta">
                  <span className="stock-slide-picker-brand">{brand?.name}</span>
                  <strong>{item.title}</strong>
                </span>
              </button>
            );
          })}
          {visible.length === 0 && (
            <div className="stock-slide-picker-empty">没有找到匹配的常用幻灯</div>
          )}
        </div>
        <div className="stock-slide-picker-foot">
          <span>{selectedIds.length > 0 ? `已选 ${selectedIds.length} 页` : '未选择'}</span>
          <div className="flex gap-2">
            <button type="button" className="btn soft rounded-xl px-4 py-2 text-[12px] font-medium" onClick={onClose}>
              取消
            </button>
            <button
              type="button"
              className="btn-hero-3d rounded-xl px-4 py-2 text-[12px] font-semibold"
              disabled={selectedIds.length === 0}
              onClick={() => {
                onConfirm(BRAND_KB_SLIDES.filter((item) => selectedIds.includes(item.id)));
              }}
            >
              确认插入
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
