import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ChevronLeft,
  Image as ImageIcon,
  Layers3,
  LibraryBig,
  Palette,
  Presentation,
  Search,
  Shapes,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import { cn } from '@/app/components/ui/utils';
import { BrandSwitcher } from '@/app/components/BrandSwitcher';
import { matchesBrand, type ContentBrand } from '@/lib/brands';
import {
  EDITOR_PAGE_ASSET_GROUPS,
  type EditorAssetGroup,
} from '@/lib/editorPageAssets';

type AssetTab = 'templates' | 'brand';
export type TemplateKind = 'ppt' | 'image';

export interface TemplateAsset {
  id: string;
  kind: TemplateKind;
  title: string;
  description: string;
  ratio: string;
  accent: string;
  accentSoft: string;
  tag: string;
  previewUrl?: string;
  slideUrls?: string[];
  brand?: ContentBrand;
}

const TEMPLATE_FILTERS: { id: TemplateKind; label: string; Icon: typeof Presentation }[] = [
  { id: 'ppt', label: 'PPT 模板', Icon: Presentation },
  { id: 'image', label: '图片模板', Icon: ImageIcon },
];

export const TEMPLATE_ASSETS: TemplateAsset[] = [
  { id: 'ppt-eylea-namd', kind: 'ppt', title: 'EYLEA nAMD Meta分析', description: '抗 VEGF 治疗初治 nAMD 的系统评价与 meta 分析学术版式', ratio: '16:9 · 3 页', accent: '#1b7a3c', accentSoft: '#e8f6ec', tag: 'EYLEA', previewUrl: '/ppt-templates/eylea-namd-01.png', slideUrls: ['/ppt-templates/eylea-namd-01.png', '/ppt-templates/eylea-namd-02.png', '/ppt-templates/eylea-namd-03.png'] },
  { id: 'ppt-her2-nsclc', kind: 'ppt', title: 'HER2突变NSCLC医学汇报', description: '塞伐艾替尼治疗 HER2 突变非小细胞肺癌的医学事务汇报版式', ratio: '16:9 · 3 页', accent: '#1a4b8c', accentSoft: '#e4eefc', tag: '肿瘤', previewUrl: '/ppt-templates/her2-nsclc-01.png', slideUrls: ['/ppt-templates/her2-nsclc-01.png', '/ppt-templates/her2-nsclc-02.png', '/ppt-templates/her2-nsclc-03.png'] },
  { id: 'ppt-pad-xarelto', kind: 'ppt', title: 'PAD抗栓指南进展', description: '从指南变迁看 PAD 抗栓治疗进展的学术沟通版式', ratio: '16:9 · 3 页', accent: '#4b2c7f', accentSoft: '#efe8f8', tag: '拜瑞妥', previewUrl: '/ppt-templates/pad-xarelto-01.png', slideUrls: ['/ppt-templates/pad-xarelto-01.png', '/ppt-templates/pad-xarelto-02.png', '/ppt-templates/pad-xarelto-03.png'] },
  { id: 'img-radimetrics', kind: 'image', title: 'Radimetrics™ 智能化剂量管理平台', description: '从 CT 到核药的辐射剂量管理海报，适合产品介绍与学术沟通', ratio: '3:4 · 竖版海报', accent: '#5b4db8', accentSoft: '#eef3ff', tag: '产品', previewUrl: '/image-templates/radimetrics.png' },
  { id: 'img-confidence', kind: 'image', title: 'CONFIDENCE周周谈', description: '非奈利酮与 SGLT-2i 同步起始联合治疗的机制解析长图', ratio: '9:16 · 学术长图', accent: '#c62828', accentSoft: '#fff5f5', tag: '学术', previewUrl: '/image-templates/confidence-talk.png' },
  { id: 'img-afib', kind: 'image', title: '房颤卒中预防科普', description: '关注心房颤动、预防脑卒中的竖版患者教育长图', ratio: '9:16 · 科普长图', accent: '#8e24aa', accentSoft: '#f6eef8', tag: '科普', previewUrl: '/image-templates/afib-stroke.png' },
];

const BRAND_SOURCE = 'https://idnet.bayer.com/en/bayer-cross-new';

const BRAND_FILTER_ICONS: Record<EditorAssetGroup, typeof Palette> = {
  logo: Palette,
  official: ImageIcon,
  other: Shapes,
};

const BRAND_FILTERS = EDITOR_PAGE_ASSET_GROUPS.map((group) => ({
  id: group.id,
  label: group.title,
  Icon: BRAND_FILTER_ICONS[group.id],
}));

export interface BrandAsset {
  id: string;
  title: string;
  description: string;
  format: string;
  category: string;
  group: EditorAssetGroup;
  previewUrl?: string;
  brand?: ContentBrand;
}

export const BRAND_ASSETS: BrandAsset[] = EDITOR_PAGE_ASSET_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.meta,
    format: item.meta,
    category: group.title,
    group: group.id,
    previewUrl: item.href,
  }))
);

export function TemplatePreview({ asset }: { asset: TemplateAsset }) {
  if (asset.previewUrl) {
    return (
      <div className="asset-preview relative aspect-[16/9] overflow-hidden rounded-xl bg-[#f4f7fb] shadow-sm">
        <img
          src={asset.previewUrl}
          alt={asset.title}
          className={asset.kind === 'image' ? 'h-full w-full object-contain' : 'h-full w-full object-cover'}
        />
      </div>
    );
  }
  if (asset.kind === 'ppt') {
    return (
      <div className="asset-preview relative aspect-[16/9] overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="absolute inset-y-0 left-0 w-[22%]" style={{ background: asset.accent }} />
        <div className="absolute left-[8%] top-[12%] h-8 w-8 rounded-full border-4 border-white/80" />
        <div className="absolute left-[29%] top-[24%] h-2.5 w-[42%] rounded-full" style={{ background: asset.accent }} />
        <div className="absolute left-[29%] top-[38%] h-1.5 w-[58%] rounded-full bg-slate-300" />
        <div className="absolute left-[29%] top-[49%] h-1.5 w-[46%] rounded-full bg-slate-200" />
        <div className="absolute bottom-[16%] left-[29%] flex gap-2">
          {[0, 1, 2].map((item) => (
            <span key={item} className="h-5 w-9 rounded-md" style={{ background: asset.accentSoft }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="asset-preview relative aspect-[16/9] overflow-hidden rounded-xl" style={{ background: asset.accentSoft }}>
      <div className="absolute -right-6 -top-9 h-32 w-32 rounded-full opacity-80" style={{ background: asset.accent }} />
      <div className="absolute -bottom-14 right-12 h-28 w-40 rotate-[-14deg] rounded-[50%]" style={{ background: `${asset.accent}33` }} />
      <div className="absolute left-5 top-5 rounded-full bg-white/90 px-2.5 py-1 text-[8px] font-bold" style={{ color: asset.accent }}>BAYER HEALTH</div>
      <div className="absolute bottom-8 left-5 h-2.5 w-[43%] rounded-full" style={{ background: asset.accent }} />
      <div className="absolute bottom-4 left-5 h-1.5 w-[58%] rounded-full bg-slate-400/35" />
    </div>
  );
}

function TemplatePreviewModal({
  asset,
  onClose,
}: {
  asset: TemplateAsset;
  onClose: () => void;
}) {
  const slides = asset.slideUrls?.length ? asset.slideUrls : asset.previewUrl ? [asset.previewUrl] : [];

  return (
    <div
      className="modal-bg show asset-library-preview-bg"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal asset-library-preview-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-library-preview-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="asset-library-preview-head">
          <div>
            <h3 id="asset-library-preview-title">{asset.title}</h3>
            <p>
              {asset.ratio} · {asset.tag}
            </p>
          </div>
          <button type="button" className="literature-picker-close" onClick={onClose} aria-label="关闭预览">
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
        <div className="asset-library-preview-body">
          {slides.length > 0 ? (
            <div className={asset.kind === 'image' ? 'asset-library-preview-poster' : 'asset-library-preview-slides'}>
              {slides.map((src, index) => (
                <figure key={src}>
                  <img src={src} alt={`${asset.title}${slides.length > 1 ? ` 第 ${index + 1} 页` : ''}`} />
                  {slides.length > 1 && <figcaption>第 {index + 1} 页</figcaption>}
                </figure>
              ))}
            </div>
          ) : (
            <TemplatePreview asset={asset} />
          )}
        </div>
        <p className="asset-library-preview-desc">{asset.description}</p>
      </div>
    </div>
  );
}

export function BrandPreview({ asset }: { asset: BrandAsset }) {
  if (asset.previewUrl) {
    return <img src={asset.previewUrl} alt={asset.title} className="h-full w-full object-contain p-4" />;
  }
  return (
    <div className="grid h-full w-full place-items-center text-[11px] text-muted-foreground">
      {asset.category}
    </div>
  );
}

interface AssetLibraryPageProps {
  brand: ContentBrand;
  onBrandChange: (brand: ContentBrand) => void;
  onNotify: (message: string) => void;
  onBack: () => void;
}

export function AssetLibraryPage({ brand, onBrandChange, onNotify, onBack }: AssetLibraryPageProps) {
  const [activeTab, setActiveTab] = useState<AssetTab>('templates');
  const [templateKind, setTemplateKind] = useState<TemplateKind>('ppt');
  const [brandGroup, setBrandGroup] = useState<EditorAssetGroup>('logo');
  const [query, setQuery] = useState('');
  const [templateAssets, setTemplateAssets] = useState<TemplateAsset[]>(() => TEMPLATE_ASSETS);
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>(() => BRAND_ASSETS);
  const [previewAsset, setPreviewAsset] = useState<TemplateAsset | null>(null);
  const templateUploadRef = useRef<HTMLInputElement>(null);
  const brandUploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!previewAsset) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewAsset(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previewAsset]);

  const visibleTemplates = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return templateAssets.filter(
      (asset) =>
        asset.kind === templateKind &&
        matchesBrand(asset.brand, brand) &&
        (!keyword ||
          asset.title.toLowerCase().includes(keyword) ||
          asset.description.toLowerCase().includes(keyword) ||
          asset.tag.toLowerCase().includes(keyword) ||
          (asset.brand || '').includes(keyword))
    );
  }, [query, templateAssets, templateKind, brand]);

  const visibleBrandAssets = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return brandAssets.filter(
      (asset) =>
        asset.group === brandGroup &&
        matchesBrand(asset.brand, brand) &&
        (!keyword ||
          asset.title.toLowerCase().includes(keyword) ||
          asset.description.toLowerCase().includes(keyword) ||
          asset.category.toLowerCase().includes(keyword) ||
          (asset.brand || '').includes(keyword))
    );
  }, [brandAssets, brandGroup, query, brand]);

  const templateCount = templateAssets.filter((asset) => matchesBrand(asset.brand, brand)).length;
  const brandCount = brandAssets.filter((asset) => matchesBrand(asset.brand, brand)).length;

  const uploadTemplate = (file: File) => {
    const title = file.name.replace(/\.[^.]+$/, '');
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    const uploaded: TemplateAsset = {
      id: `template-${Date.now()}`,
      kind: templateKind,
      title,
      description: `本地上传 · ${(file.size / 1024).toFixed(0)}KB`,
      ratio: templateKind === 'ppt' ? 'PPT 文件' : '图片文件',
      accent: '#54B9F9',
      accentSoft: '#eaf4ff',
      tag: '上传',
      previewUrl,
      brand,
    };
    setTemplateAssets((prev) => [uploaded, ...prev]);
    onNotify(`模板「${title}」上传成功`);
  };

  const uploadBrandAsset = (file: File) => {
    const title = file.name.replace(/\.[^.]+$/, '');
    const extension = file.name.split('.').pop()?.toUpperCase() || 'FILE';
    const uploaded: BrandAsset = {
      id: `brand-${Date.now()}`,
      title,
      description: `本地上传 · ${(file.size / 1024).toFixed(0)}KB`,
      format: extension,
      category: '其他素材',
      group: 'other',
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      brand,
    };
    setBrandAssets((prev) => [uploaded, ...prev]);
    onNotify(`品牌元素「${title}」上传成功`);
  };

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
              <LibraryBig className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-[28px] font-semibold tracking-tight text-foreground">视觉素材库</h2>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">正在查看「{brand}」的模板与视觉元素，通用素材会一并显示</p>
            </div>
          </div>
        </div>
        <div className="flex w-full max-w-2xl flex-wrap items-center justify-end gap-2">
          <BrandSwitcher value={brand} onChange={onBrandChange} size="page" />
          <div className="relative min-w-[180px] flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索模板、Logo 或图标"
              className="glass-input w-full rounded-xl border border-border/70 py-2.5 pl-10 pr-3 text-[13px] outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <button
            type="button"
            className="btn-hero-3d inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[12px] font-semibold"
            onClick={() => (activeTab === 'templates' ? templateUploadRef : brandUploadRef).current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            上传{activeTab === 'templates' ? '模板' : '品牌元素'}
          </button>
          <input
            ref={templateUploadRef}
            type="file"
            hidden
            accept=".ppt,.pptx,.pdf,.doc,.docx,.html,.md,.txt,.png,.jpg,.jpeg,.webp,.svg"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadTemplate(file);
              event.target.value = '';
            }}
          />
          <input
            ref={brandUploadRef}
            type="file"
            hidden
            accept=".png,.jpg,.jpeg,.webp,.svg,.ai,.eps,.zip,.json,.ase"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadBrandAsset(file);
              event.target.value = '';
            }}
          />
        </div>
      </div>

      <div className="mb-5 flex gap-1 rounded-2xl border border-border/70 bg-white/70 p-1.5 shadow-sm">
        {([
          { id: 'templates' as const, label: '模板', Icon: Layers3, count: templateCount },
          { id: 'brand' as const, label: '品牌元素', Icon: Palette, count: brandCount },
        ]).map(({ id, label, Icon, count }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setActiveTab(id);
              setQuery('');
            }}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition',
              activeTab === id
                ? 'bg-hero-gradient text-white shadow-glow'
                : 'text-muted-foreground hover:bg-white hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            <span className={cn('rounded-full px-2 py-0.5 text-[10px]', activeTab === id ? 'bg-white/16 text-white' : 'bg-secondary text-muted-foreground')}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {activeTab === 'templates' ? (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="creator-right-tabs is-inline" role="tablist" aria-label="模板分类">
              {TEMPLATE_FILTERS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={templateKind === id}
                  className={templateKind === id ? 'active' : ''}
                  onClick={() => setTemplateKind(id)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <span className="text-[11.5px] text-muted-foreground">{visibleTemplates.length} 个可用模板</span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {visibleTemplates.map((asset) => (
              <article
                key={asset.id}
                className="group cursor-pointer rounded-2xl glass-card p-3 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow"
                role="button"
                tabIndex={0}
                onClick={() => setPreviewAsset(asset)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setPreviewAsset(asset);
                  }
                }}
              >
                <div className="asset-library-card-preview">
                  <TemplatePreview asset={asset} />
                  <span className="asset-library-card-preview-hint">点击预览</span>
                </div>
                <div className="px-1 pb-1 pt-3">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="rounded-md px-2 py-0.5 text-[9.5px] font-semibold" style={{ color: asset.accent, background: asset.accentSoft }}>{asset.tag}</span>
                    <span className="text-[10px] text-muted-foreground">{asset.ratio}</span>
                  </div>
                  <h3 className="text-[13.5px] font-semibold text-foreground">{asset.title}</h3>
                  <p className="mt-1 min-h-9 text-[11px] leading-[1.55] text-muted-foreground">{asset.description}</p>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="creator-right-tabs is-inline" role="tablist" aria-label="品牌元素分类">
              {BRAND_FILTERS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={brandGroup === id}
                  className={brandGroup === id ? 'active' : ''}
                  onClick={() => setBrandGroup(id)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <span className="text-[11.5px] text-muted-foreground">{visibleBrandAssets.length} 个可用元素</span>
          </div>

          <div className="glass-card-subtle mb-5 flex flex-col gap-3 rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-[12.5px] font-semibold text-foreground">品牌元素来源与使用规范</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">元素依据 Bayer Identity Net 公开规范整理。正式发布前，请从官方 ImageBank 下载授权母版并确认商标使用权限。</p>
              </div>
            </div>
            <a href={BRAND_SOURCE} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1.5 text-[11.5px] font-semibold text-primary hover:underline">
              查看官方规范
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {visibleBrandAssets.map((asset) => (
              <article key={asset.id} className="group overflow-hidden rounded-2xl glass-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow">
                <div className="grid aspect-[16/9] place-items-center overflow-hidden bg-[#f4f8fa]">
                  <BrandPreview asset={asset} />
                </div>
                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[9.5px] font-semibold text-primary">{asset.category}</span>
                    <span className="text-[10px] text-muted-foreground">{asset.format}</span>
                  </div>
                  <h3 className="text-[13.5px] font-semibold text-foreground">{asset.title}</h3>
                  <p className="mt-1 min-h-9 text-[11px] leading-[1.55] text-muted-foreground">{asset.description}</p>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {previewAsset && <TemplatePreviewModal asset={previewAsset} onClose={() => setPreviewAsset(null)} />}

      {((activeTab === 'templates' && visibleTemplates.length === 0) ||
        (activeTab === 'brand' && visibleBrandAssets.length === 0)) && (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-white/60 px-6 py-12 text-center">
          <Search className="mx-auto h-7 w-7 text-muted-foreground/60" />
          <p className="mt-3 text-[13px] font-semibold text-foreground">没有找到匹配的素材</p>
          <button type="button" onClick={() => setQuery('')} className="mt-2 text-[11.5px] font-medium text-primary hover:underline">
            清除搜索条件
          </button>
        </div>
      )}
    </div>
  );
}
