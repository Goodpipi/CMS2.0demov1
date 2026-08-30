import { CONTENT_BRANDS, type ContentBrand } from '@/lib/brands';
import { cn } from '@/app/components/ui/utils';

interface BrandSwitcherProps {
  value: ContentBrand;
  onChange: (brand: ContentBrand) => void;
  className?: string;
  size?: 'header' | 'page';
}

export function BrandSwitcher({ value, onChange, className, size = 'header' }: BrandSwitcherProps) {
  const compact = size === 'header';
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('text-muted-foreground', compact ? 'text-[12px]' : 'text-[12.5px]')}>
        当前品牌
      </span>
      <select
        className={cn(
          'rounded-lg border border-border/70 bg-glass font-medium text-foreground shadow-soft outline-none transition hover:border-primary/40 focus:border-[#54B9F9]/50 focus:ring-4 focus:ring-[#54B9F9]/10',
          compact ? 'px-3 py-1.5 text-[12px]' : 'rounded-xl px-3 py-2.5 text-[12.5px]'
        )}
        value={value}
        onChange={(event) => onChange(event.target.value as ContentBrand)}
        aria-label="切换品牌"
      >
        {CONTENT_BRANDS.map((brand) => (
          <option key={brand} value={brand}>
            {brand}
          </option>
        ))}
      </select>
    </div>
  );
}
