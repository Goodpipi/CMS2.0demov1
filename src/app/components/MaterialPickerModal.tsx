import { useEffect, useRef, useState } from 'react';
import { readFileForPreview, buildPreviewFieldsFromTitle } from '@/lib/materialContent';
import type { LibraryItem, MaterialContentType } from '@/types/library';
import {
  BRAND_ASSETS,
  BrandPreview,
  TEMPLATE_ASSETS,
  TemplatePreview,
  type BrandAsset,
  type TemplateAsset,
} from '@/app/components/AssetLibraryPage';
import { MaterialContentPreview } from '@/app/components/MaterialContentPreview';

export interface PickedMaterial {
  existingId?: number;
  title: string;
  meta: string;
  cat: string;
  cms: boolean;
  fileName?: string;
  contentType?: MaterialContentType;
  contentText?: string;
  contentUrl?: string;
  mimeType?: string;
  validUntil?: string;
}
interface MaterialPickerModalProps {
  open: boolean;
  defaultCat?: string;
  initialTab?: 'upload' | 'cms';
  categories: string[];
  mode?: 'manage' | 'reference';
  knowledgeItems?: LibraryItem[];
  onClose: () => void;
  onConfirm: (item: PickedMaterial) => void;
}

const MOCK_CMS_POOL = [
  { title: 'Approved Claims Library v2026.04', cat: '参考知识', status: 'Approved', validUntil: '2027-04-30' },
  { title: '小红书肾脏健康热点观察 2026-05', cat: '热点洞察', status: 'Approved', validUntil: '2026-11-30' },
  { title: '公众渠道疾病教育合规手册', cat: '合规手册', status: 'Approved', validUntil: '2027-06-30' },
  { title: 'Bayer Blue-Green Visual Kit 2026', cat: '品牌元素', status: 'Approved', validUntil: '2026-12-31' },
  { title: '2026 品牌沟通 Briefing', cat: 'Brief', status: 'Approved', validUntil: '2026-12-31' },
  { title: '心肾品牌策略要点 2026', cat: '品牌策略', status: 'Approved', validUntil: '2026-12-31' },
  { title: '慢性肾病风险认知患者教育手册', cat: '参考知识', status: 'Approved', validUntil: '2027-03-31' },
  { title: '小红书高互动标题样本集', cat: '热点洞察', status: 'Draft', validUntil: '2026-09-30' },
  { title: 'HCP 拜访核心信息卡', cat: '参考知识', status: 'Approved', validUntil: '2027-01-31' },
];

function ReferencePickerRow({
  title,
  subtitle,
  badge,
  onPreview,
  onAdd,
}: {
  title: string;
  subtitle: string;
  badge: string;
  onPreview: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="cms-result-row reference-picker-row">
      <button type="button" className="reference-picker-main" onClick={onPreview}>
        <strong>{title}</strong>
        <span className="small">{subtitle}</span>
      </button>
      <span className="badge">{badge}</span>
      <div className="reference-picker-actions">
        <button type="button" className="btn soft" onClick={onPreview}>预览</button>
        <button type="button" className="btn primary" onClick={onAdd}>添加</button>
      </div>
    </div>
  );
}

export function MaterialPickerModal({
  open,
  defaultCat = '参考知识',
  initialTab = 'upload',
  categories,
  mode = 'manage',
  knowledgeItems = [],
  onClose,
  onConfirm,
}: MaterialPickerModalProps) {
  const [tab, setTab] = useState<'upload' | 'cms'>(initialTab);
  const [cat, setCat] = useState(defaultCat);
  const [cmsQuery, setCmsQuery] = useState('');
  const [cmsLoading, setCmsLoading] = useState(false);
  const [cmsResults, setCmsResults] = useState<typeof MOCK_CMS_POOL>([]);
  const [referencePreview, setReferencePreview] = useState<
    | { kind: 'knowledge'; item: LibraryItem }
    | { kind: 'template'; item: TemplateAsset }
    | { kind: 'brand'; item: BrandAsset }
    | null
  >(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const searchCms = (query = cmsQuery) => {
    setCmsLoading(true);
    setTimeout(() => {
      const q = query.trim().toLowerCase();
      const list = MOCK_CMS_POOL.filter(
        (x) =>
          !q ||
          x.title.toLowerCase().includes(q) ||
          x.cat.toLowerCase().includes(q) ||
          x.status.toLowerCase().includes(q)
      );
      setCmsResults(list.length ? list : MOCK_CMS_POOL.slice(0, 4));
      setCmsLoading(false);
    }, 480);
  };

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setCat(defaultCat);
      setReferencePreview(null);
      if (initialTab === 'cms') searchCms('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open 时同步初始 tab
  }, [open, initialTab, defaultCat]);

  if (!open) return null;

  const referenceKind: 'template' | 'brand' | 'knowledge' =
    defaultCat === '模板' ? 'template' : defaultCat === '品牌元素' ? 'brand' : 'knowledge';

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = await readFileForPreview(file);
    const targetCat = mode === 'reference' ? defaultCat || '参考知识' : cat;
    onConfirm({
      title: mode === 'reference' ? file.name : `${targetCat}｜${file.name}`,
      meta: `本地上传 · ${(file.size / 1024).toFixed(0)}KB · 已解析`,
      cat: targetCat,
      cms: false,
      fileName: file.name,
      ...preview,
    });
    e.target.value = '';
    onClose();
  };

  const pickCms = (item: (typeof MOCK_CMS_POOL)[0]) => {
    onConfirm({
      title: item.title,
      meta: `CMS · ${item.status} · 已关联到任务`,
      cat: mode === 'reference' ? item.cat : item.cat,
      cms: true,
      validUntil: item.validUntil,
      ...buildPreviewFieldsFromTitle(item.title, true),
    });
    onClose();
  };

  const pickKnowledge = (item: LibraryItem) => {
    onConfirm({
      existingId: item.id,
      title: item.title,
      meta: item.meta,
      cat: item.cat,
      cms: item.cms,
      fileName: item.fileName,
      contentType: item.contentType,
      contentText: item.contentText,
      contentUrl: item.contentUrl,
      mimeType: item.mimeType,
      validUntil: item.validUntil,
    });
    onClose();
  };

  const pickTemplate = (item: TemplateAsset) => {
    const kindLabel = item.kind === 'ppt' ? 'PPT 模板' : '图片模板';
    onConfirm({
      title: item.title,
      meta: `${kindLabel} · ${item.ratio} · ${item.tag}`,
      cat: '模板',
      cms: false,
      contentType: item.previewUrl ? 'image' : 'text',
      contentUrl: item.previewUrl,
      contentText: item.previewUrl ? undefined : `${item.title}\n\n${item.description}\n\n规格：${item.ratio}`,
    });
    onClose();
  };

  const pickBrand = (item: BrandAsset) => {
    onConfirm({
      title: item.title,
      meta: `品牌元素 · ${item.category} · ${item.format}`,
      cat: '品牌元素',
      cms: false,
      contentType: item.previewUrl ? 'image' : 'text',
      contentUrl: item.previewUrl,
      contentText: item.previewUrl ? undefined : `${item.title}\n\n${item.description}\n\n格式：${item.format}`,
    });
    onClose();
  };

  const previewCms = (item: (typeof MOCK_CMS_POOL)[0]) => {
    const fields = buildPreviewFieldsFromTitle(item.title, true);
    setReferencePreview({
      kind: 'knowledge',
      item: {
        id: Date.now(),
        title: item.title,
        meta: `CMS · ${item.status} · 有效期至 ${item.validUntil}`,
        cat: '参考知识',
        cms: true,
        def: false,
        addedAt: Date.now(),
        validUntil: item.validUntil,
        ...fields,
      },
    });
  };

  return (
    <div
      className="modal-bg show material-picker-bg"
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains('material-picker-bg')) onClose();
      }}
    >
      <div className="modal material-picker-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{mode === 'reference' ? '添加引用素材' : '添加素材'}</h3>
        {mode !== 'reference' && (
        <div className="picker-tabs">
          <button
            type="button"
            className={`picker-tab ${tab === 'upload' ? 'active' : ''}`}
            onClick={() => setTab('upload')}
          >
            本地上传
          </button>
          <button
            type="button"
            className={`picker-tab ${tab === 'cms' ? 'active' : ''}`}
            onClick={() => {
              setTab('cms');
              if (!cmsResults.length) searchCms();
            }}
          >
            搜索 CMS
          </button>
        </div>
        )}

        {mode === 'manage' && (
        <label className="props-field" style={{ marginTop: 12 }}>
          <span>素材分类</span>
          <select className="select" value={cat} onChange={(e) => setCat(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        )}

        <input
          ref={fileRef}
          type="file"
          hidden
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.svg,.txt,.md"
          onChange={onFileChange}
        />

        {mode === 'manage' && tab === 'upload' && (
          <div className="picker-upload-zone" onClick={() => fileRef.current?.click()}>
            <strong>点击选择本地文件</strong>
            <div className="small">支持 PDF、Office、图片、文本等</div>
          </div>
        )}

        {mode === 'reference' && referencePreview?.kind === 'knowledge' && (
          <div className="reference-preview-panel">
            <div className="reference-preview-head">
              <div>
                <strong>{referencePreview.item.title}</strong>
                <div className="small">素材预览</div>
              </div>
              <button type="button" className="btn soft" onClick={() => setReferencePreview(null)}>
                关闭预览
              </button>
            </div>
            <MaterialContentPreview item={referencePreview.item} />
          </div>
        )}

        {tab === 'cms' && (
          <div className="picker-cms">
            <div className="cms-status">
              <span className="dot" />
              CMS 已连接 · Vault: China-Marketing
            </div>
            <div className="filters" style={{ marginTop: 10 }}>
              <input
                className="input"
                style={{ flex: 1 }}
                placeholder="搜索素材名称、标签、审批状态"
                value={cmsQuery}
                onChange={(e) => setCmsQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCms()}
              />
              <button type="button" className="btn primary" onClick={searchCms}>
                搜索
              </button>
            </div>
            {cmsLoading ? (
              <div className="small" style={{ padding: 16, textAlign: 'center' }}>
                正在检索 CMS…
              </div>
            ) : (
              <div className="cms-result-list">
                {(cmsResults.length ? cmsResults : MOCK_CMS_POOL).map((item, i) =>
                  mode === 'reference' ? (
                    <ReferencePickerRow
                      key={i}
                      title={item.title}
                      subtitle={`${item.cat} · 有效期至 ${item.validUntil}`}
                      badge={item.status}
                      onPreview={() => previewCms(item)}
                      onAdd={() => pickCms(item)}
                    />
                  ) : (
                    <button
                      key={i}
                      type="button"
                      className="cms-result-row"
                      onClick={() => pickCms(item)}
                    >
                      <div>
                        <strong>{item.title}</strong>
                        <div className="small">{item.cat} · 有效期至 {item.validUntil}</div>
                      </div>
                      <span className={`badge ${item.status === 'Approved' ? 'green' : 'warn'}`}>
                        {item.status}
                      </span>
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {mode === 'reference' && tab !== 'cms' && (
          <div className="cms-result-list reference-material-list">
            {referenceKind === 'knowledge' &&
              knowledgeItems.map((item) => (
                <ReferencePickerRow
                  key={item.id}
                  title={item.title}
                  subtitle={item.meta}
                  badge={item.cms ? 'CMS' : '个人知识收藏'}
                  onPreview={() => setReferencePreview({ kind: 'knowledge', item })}
                  onAdd={() => pickKnowledge(item)}
                />
              ))}
            {referenceKind === 'template' &&
              TEMPLATE_ASSETS.map((item) => (
                <ReferencePickerRow
                  key={item.id}
                  title={item.title}
                  subtitle={item.description}
                  badge={item.kind === 'ppt' ? 'PPT' : '图片'}
                  onPreview={() => setReferencePreview({ kind: 'template', item })}
                  onAdd={() => pickTemplate(item)}
                />
              ))}
            {referenceKind === 'brand' &&
              BRAND_ASSETS.map((item) => (
                <ReferencePickerRow
                  key={item.id}
                  title={item.title}
                  subtitle={item.description}
                  badge={item.category}
                  onPreview={() => setReferencePreview({ kind: 'brand', item })}
                  onAdd={() => pickBrand(item)}
                />
              ))}
            {((referenceKind === 'knowledge' && knowledgeItems.length === 0) ||
              (referenceKind === 'template' && TEMPLATE_ASSETS.length === 0) ||
              (referenceKind === 'brand' && BRAND_ASSETS.length === 0)) && (
              <div className="small reference-material-empty">暂无可引用素材</div>
            )}
          </div>
        )}

        <div className="quick-row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={onClose}>
            取消
          </button>
          {mode === 'reference' && (
            <>
              <button type="button" className="btn soft" onClick={() => fileRef.current?.click()}>
                手动上传
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  setTab('cms');
                  searchCms();
                }}
              >
                CMS 搜索
              </button>
            </>
          )}
        </div>
      </div>
      {mode === 'reference' && referencePreview && referencePreview.kind !== 'knowledge' && (
        <div
          className="reference-asset-preview-bg"
          onClick={(event) => {
            if (event.target === event.currentTarget) setReferencePreview(null);
          }}
        >
          <div className="reference-asset-preview-modal" onClick={(event) => event.stopPropagation()}>
            <div className="reference-asset-preview-head">
              <div>
                <h3>{referencePreview.item.title}</h3>
                <div className="small">
                  {referencePreview.kind === 'template'
                    ? `${referencePreview.item.ratio} · ${referencePreview.item.tag}`
                    : `${referencePreview.item.category} · ${referencePreview.item.format}`}
                </div>
              </div>
              <button type="button" className="btn soft" onClick={() => setReferencePreview(null)}>
                关闭
              </button>
            </div>
            <div className="reference-asset-preview-content">
              {referencePreview.kind === 'template' ? (
                <TemplatePreview asset={referencePreview.item} />
              ) : (
                <div className="reference-brand-preview">
                  <BrandPreview asset={referencePreview.item} />
                </div>
              )}
            </div>
            <p className="reference-asset-preview-description">{referencePreview.item.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
