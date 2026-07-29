import { useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Layers3,
  Leaf,
  LibraryBig,
  Microscope,
  Palette,
  Presentation,
  Search,
  Shapes,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  Upload,
} from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

type AssetTab = 'templates' | 'brand';
export type TemplateKind = 'ppt' | 'image' | 'rich-text';

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
}

const TEMPLATE_FILTERS: { id: TemplateKind; label: string; Icon: typeof Presentation }[] = [
  { id: 'ppt', label: 'PPT 模板', Icon: Presentation },
  { id: 'image', label: '图片模板', Icon: ImageIcon },
  { id: 'rich-text', label: '富文本模板', Icon: FileText },
];

export const TEMPLATE_ASSETS: TemplateAsset[] = [
  { id: 'ppt-medical', kind: 'ppt', title: '医学价值沟通', description: '适用于 HCP 拜访、科室会与医学沟通', ratio: '16:9 · 24 页', accent: '#0b66b3', accentSoft: '#dcefff', tag: 'HCP' },
  { id: 'ppt-patient', kind: 'ppt', title: '患者教育课堂', description: '低认知负担的疾病教育与患者宣教版式', ratio: '16:9 · 18 页', accent: '#4b9b41', accentSoft: '#e8f5e5', tag: '患者教育' },
  { id: 'ppt-congress', kind: 'ppt', title: '学术会议速递', description: '研究背景、数据解读与临床启示结构', ratio: '16:9 · 22 页', accent: '#005b8e', accentSoft: '#e0f1f7', tag: 'Congress' },
  { id: 'ppt-training', kind: 'ppt', title: '品牌内部培训', description: '用于销售培训、知识传递与案例复盘', ratio: '16:9 · 30 页', accent: '#583b8e', accentSoft: '#eee9f7', tag: '培训' },
  { id: 'img-social', kind: 'image', title: '社交媒体科普卡', description: '适配小红书与公众号的竖版知识卡', ratio: '3:4 · 1242×1660', accent: '#e54b66', accentSoft: '#fff0f3', tag: '社交媒体' },
  { id: 'img-poster', kind: 'image', title: '疾病教育海报', description: '清晰分层的线下活动与数字海报模板', ratio: '4:5 · 1080×1350', accent: '#0b66b3', accentSoft: '#e6f2fb', tag: '海报' },
  { id: 'img-data', kind: 'image', title: '临床数据图卡', description: '突出关键数据、结论与来源的证据图卡', ratio: '1:1 · 1080×1080', accent: '#00a67d', accentSoft: '#e4f7f1', tag: '数据' },
  { id: 'img-care', kind: 'image', title: '患者关怀长图', description: '用于症状管理与就医建议的长图版式', ratio: '9:16 · 1080×1920', accent: '#4698a8', accentSoft: '#e7f4f6', tag: '关怀' },
  { id: 'rt-wechat', kind: 'rich-text', title: '公众号疾病科普', description: '标题、导语、正文、引用与免责声明完整结构', ratio: '富文本 · 6 模块', accent: '#1677b8', accentSoft: '#e6f1f8', tag: '公众号' },
  { id: 'rt-hcp', kind: 'rich-text', title: 'HCP 学术速递', description: '研究摘要、结果解读和临床观点版式', ratio: '富文本 · 8 模块', accent: '#315795', accentSoft: '#e9eef6', tag: '学术' },
  { id: 'rt-faq', kind: 'rich-text', title: '患者常见问题 FAQ', description: '问答、风险提示与就医行动建议结构', ratio: '富文本 · 10 问', accent: '#4b9b41', accentSoft: '#ebf6e8', tag: 'FAQ' },
  { id: 'rt-event', kind: 'rich-text', title: '活动回顾与纪要', description: '会议亮点、专家观点与资料下载模块', ratio: '富文本 · 7 模块', accent: '#734b99', accentSoft: '#f0ebf5', tag: '活动' },
];

const BRAND_SOURCE = 'https://idnet.bayer.com/en/bayer-cross-new';
const BAYER_LOGO =
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Logo_Bayer.svg';

export interface BrandAsset {
  id: string;
  title: string;
  description: string;
  format: string;
  category: string;
  preview: 'logo' | 'reverse-logo' | 'wordmark' | 'colors' | 'code' | 'medical-icons' | 'crop-icons' | 'trust';
  previewUrl?: string;
}

export const BRAND_ASSETS: BrandAsset[] = [
  { id: 'bayer-cross', title: 'Bayer Cross 正色标志', description: '适用于白色或极浅色背景的主标志', format: 'SVG · PNG', category: 'Logo', preview: 'logo' },
  { id: 'bayer-reverse', title: 'Bayer Cross 反白标志', description: '适用于深色背景，需遵循最小留白规范', format: 'SVG · PNG', category: 'Logo', preview: 'reverse-logo' },
  { id: 'bayer-wordmark', title: 'Bayer Cross + Logotype', description: '用于受限空间、赞助墙与联合署名场景', format: 'SVG · EPS', category: 'Logo', preview: 'wordmark' },
  { id: 'bayer-colors', title: '拜耳核心色板', description: '科学蓝、生命绿及辅助中性色的数字色值', format: 'ASE · JSON', category: 'Color', preview: 'colors' },
  { id: 'crop-code', title: 'Crop Science Code', description: '用于作物科学传播的斜向色带视觉系统', format: 'SVG · AI', category: 'Graphic', preview: 'code' },
  { id: 'medical-icons', title: '医学传播图标组', description: '心脏、肾脏、药物与医疗服务常用图标', format: '24 SVG', category: 'Icon', preview: 'medical-icons' },
  { id: 'crop-icons', title: '作物科学图标组', description: '作物、生长、田间与可持续主题图标', format: '20 SVG', category: 'Icon', preview: 'crop-icons' },
  { id: 'trust-marks', title: '可信与合规标识组', description: '审批、保护、证据与可追溯性图标', format: '16 SVG', category: 'Icon', preview: 'trust' },
];

export function TemplatePreview({ asset }: { asset: TemplateAsset }) {
  if (asset.previewUrl) {
    return (
      <div className="asset-preview relative aspect-[16/9] overflow-hidden rounded-xl bg-white shadow-sm">
        <img src={asset.previewUrl} alt={asset.title} className="h-full w-full object-cover" />
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

  if (asset.kind === 'image') {
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

  return (
    <div className="asset-preview relative aspect-[16/9] overflow-hidden rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-6 w-6 rounded-lg" style={{ background: asset.accent }} />
        <span className="h-2 w-[38%] rounded-full bg-slate-800/80" />
      </div>
      {[72, 90, 64].map((width, index) => (
        <div key={width} className="mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: asset.accent }} />
          <span className="h-1.5 rounded-full bg-slate-300" style={{ width: `${width}%` }} />
          {index === 0 && <span className="sr-only">正文段落</span>}
        </div>
      ))}
      <div className="absolute bottom-3 left-4 right-4 h-5 rounded-md" style={{ background: asset.accentSoft }} />
    </div>
  );
}

export function BrandPreview({ asset }: { asset: BrandAsset }) {
  const kind = asset.preview;
  if (asset.previewUrl) {
    return <img src={asset.previewUrl} alt={asset.title} className="h-full w-full object-contain p-5" />;
  }
  if (kind === 'logo') {
    return <img src={BAYER_LOGO} alt="Bayer Cross" className="h-28 w-28 object-contain" />;
  }
  if (kind === 'reverse-logo') {
    return (
      <div className="grid h-full w-full place-items-center bg-[#103c8f]">
        <img src={BAYER_LOGO} alt="Bayer Cross 反白应用示意" className="h-24 w-24 rounded-full bg-white p-1 object-contain" />
      </div>
    );
  }
  if (kind === 'wordmark') {
    return (
      <div className="flex items-center gap-4">
        <img src={BAYER_LOGO} alt="" className="h-20 w-20 object-contain" />
        <span className="text-3xl font-semibold tracking-[-0.04em] text-[#103c8f]">Bayer</span>
      </div>
    );
  }
  if (kind === 'colors') {
    return (
      <div className="flex h-full w-full">
        <span className="flex-1 bg-[#103c8f]" />
        <span className="flex-1 bg-[#00617f]" />
        <span className="flex-1 bg-[#00a651]" />
        <span className="flex-1 bg-[#66b821]" />
        <span className="flex-1 bg-[#e7f1f6]" />
      </div>
    );
  }
  if (kind === 'code') {
    return (
      <div className="relative h-full w-full overflow-hidden bg-[#092e49]">
        {['#00a651', '#66b821', '#00a0c6', '#1d71b8', '#8c65a8'].map((color, index) => (
          <span key={color} className="absolute h-[180%] w-9 -rotate-[24deg]" style={{ background: color, left: `${18 + index * 14}%`, top: '-38%' }} />
        ))}
        <span className="absolute bottom-3 left-4 rounded bg-white px-2 py-1 text-[8px] font-bold text-[#103c8f]">CROP SCIENCE CODE</span>
      </div>
    );
  }

  const icons =
    kind === 'medical-icons'
      ? [Stethoscope, Microscope, Sparkles]
      : kind === 'crop-icons'
        ? [Leaf, Layers3, Sparkles]
        : [ShieldCheck, CheckCircle2, Shapes];

  return (
    <div className="flex items-center justify-center gap-4">
      {icons.map((Icon, index) => (
        <span key={index} className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <Icon className="h-6 w-6 text-[#0b66b3]" strokeWidth={1.8} />
        </span>
      ))}
    </div>
  );
}

interface AssetLibraryPageProps {
  onNotify: (message: string) => void;
}

export function AssetLibraryPage({ onNotify }: AssetLibraryPageProps) {
  const [activeTab, setActiveTab] = useState<AssetTab>('templates');
  const [templateKind, setTemplateKind] = useState<TemplateKind>('ppt');
  const [query, setQuery] = useState('');
  const [templateAssets, setTemplateAssets] = useState<TemplateAsset[]>(() => TEMPLATE_ASSETS);
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>(() => BRAND_ASSETS);
  const templateUploadRef = useRef<HTMLInputElement>(null);
  const brandUploadRef = useRef<HTMLInputElement>(null);

  const visibleTemplates = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return templateAssets.filter(
      (asset) =>
        asset.kind === templateKind &&
        (!keyword ||
          asset.title.toLowerCase().includes(keyword) ||
          asset.description.toLowerCase().includes(keyword) ||
          asset.tag.toLowerCase().includes(keyword))
    );
  }, [query, templateAssets, templateKind]);

  const visibleBrandAssets = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return brandAssets.filter(
      (asset) =>
        !keyword ||
        asset.title.toLowerCase().includes(keyword) ||
        asset.description.toLowerCase().includes(keyword) ||
        asset.category.toLowerCase().includes(keyword)
    );
  }, [brandAssets, query]);

  const uploadTemplate = (file: File) => {
    const title = file.name.replace(/\.[^.]+$/, '');
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    const uploaded: TemplateAsset = {
      id: `template-${Date.now()}`,
      kind: templateKind,
      title,
      description: `本地上传 · ${(file.size / 1024).toFixed(0)}KB`,
      ratio: templateKind === 'ppt' ? 'PPT 文件' : templateKind === 'image' ? '图片文件' : '富文本文件',
      accent: '#4A9EE0',
      accentSoft: '#eaf4ff',
      tag: '上传',
      previewUrl,
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
      category: file.type.startsWith('image/') ? 'Image' : 'Brand',
      preview: 'trust',
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    };
    setBrandAssets((prev) => [uploaded, ...prev]);
    onNotify(`品牌元素「${title}」上传成功`);
  };

  const deleteTemplate = (asset: TemplateAsset) => {
    if (asset.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(asset.previewUrl);
    setTemplateAssets((prev) => prev.filter((item) => item.id !== asset.id));
    onNotify(`已删除模板「${asset.title}」`);
  };

  const deleteBrandAsset = (asset: BrandAsset) => {
    if (asset.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(asset.previewUrl);
    setBrandAssets((prev) => prev.filter((item) => item.id !== asset.id));
    onNotify(`已删除品牌元素「${asset.title}」`);
  };

  return (
    <div className="page relative z-10 px-6 pb-8 lg:px-10">
      <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="sparkle-surface grid h-11 w-11 place-items-center rounded-2xl bg-hero-gradient text-white shadow-glow">
              <LibraryBig className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-[28px] font-semibold tracking-tight text-foreground">素材库</h2>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">统一管理创作模板与品牌视觉元素</p>
            </div>
          </div>
        </div>
        <div className="flex w-full max-w-lg items-center gap-2">
          <div className="relative min-w-0 flex-1">
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
          { id: 'templates' as const, label: '模板', Icon: Layers3, count: templateAssets.length },
          { id: 'brand' as const, label: '品牌元素', Icon: Palette, count: brandAssets.length },
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
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="模板分类">
              {TEMPLATE_FILTERS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={templateKind === id}
                  onClick={() => setTemplateKind(id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[12px] font-medium transition',
                    templateKind === id
                      ? 'border-primary/35 bg-primary/10 text-primary'
                      : 'border-border/70 bg-white/65 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  )}
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
              <article key={asset.id} className="group rounded-2xl glass-card p-3 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow">
                <TemplatePreview asset={asset} />
                <div className="px-1 pb-1 pt-3">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="rounded-md px-2 py-0.5 text-[9.5px] font-semibold" style={{ color: asset.accent, background: asset.accentSoft }}>{asset.tag}</span>
                    <span className="text-[10px] text-muted-foreground">{asset.ratio}</span>
                  </div>
                  <h3 className="text-[13.5px] font-semibold text-foreground">{asset.title}</h3>
                  <p className="mt-1 min-h-9 text-[11px] leading-[1.55] text-muted-foreground">{asset.description}</p>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => deleteTemplate(asset)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border/70 bg-white/75 text-muted-foreground transition hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                      title="删除模板"
                      aria-label={`删除模板 ${asset.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <>
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
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => deleteBrandAsset(asset)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border/70 bg-white/75 text-muted-foreground transition hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                      title="删除品牌元素"
                      aria-label={`删除品牌元素 ${asset.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

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
