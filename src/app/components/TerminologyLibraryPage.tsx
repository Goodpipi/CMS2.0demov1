import { useMemo, useRef, useState } from 'react';
import {
  BookMarked,
  Check,
  Download,
  FileDown,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { TerminologyDraft, TerminologyEntry } from '@/types/terminology';
import {
  deleteTerminologyEntry,
  loadTerminologyEntries,
  mergeTerminologyEntries,
  upsertTerminologyEntry,
} from '@/lib/terminologyStore';
import {
  downloadTerminologyTemplate,
  exportTerminologyCsv,
  importTerminologyFromFile,
} from '@/lib/terminologyCsv';

interface TerminologyLibraryPageProps {
  onNotify: (message: string) => void;
}

const EMPTY_DRAFT: TerminologyDraft = {
  source: '',
  target: '',
  sourceLang: 'zh',
  targetLang: 'en',
  domain: '',
  note: '',
};

export function TerminologyLibraryPage({ onNotify }: TerminologyLibraryPageProps) {
  const [entries, setEntries] = useState<TerminologyEntry[]>(() => loadTerminologyEntries());
  const [query, setQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('全部');
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<TerminologyDraft>(EMPTY_DRAFT);
  const [importOpen, setImportOpen] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2>(1);
  const [templateDownloaded, setTemplateDownloaded] = useState(false);
  const [pendingFileName, setPendingFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);

  const domains = useMemo(() => {
    const set = new Set(entries.map((item) => item.domain).filter(Boolean));
    return ['全部', ...[...set].sort((a, b) => a.localeCompare(b, 'zh'))];
  }, [entries]);

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return entries.filter((item) => {
      if (domainFilter !== '全部' && item.domain !== domainFilter) return false;
      if (!keyword) return true;
      return (
        item.source.toLowerCase().includes(keyword) ||
        item.target.toLowerCase().includes(keyword) ||
        item.domain.toLowerCase().includes(keyword) ||
        item.note.toLowerCase().includes(keyword)
      );
    });
  }, [entries, query, domainFilter]);

  const openCreate = () => {
    setDraft(EMPTY_DRAFT);
    setEditorOpen(true);
  };

  const openEdit = (entry: TerminologyEntry) => {
    setDraft({
      id: entry.id,
      source: entry.source,
      target: entry.target,
      sourceLang: entry.sourceLang,
      targetLang: entry.targetLang,
      domain: entry.domain,
      note: entry.note,
    });
    setEditorOpen(true);
  };

  const openImportWizard = () => {
    setImportStep(1);
    setTemplateDownloaded(false);
    setPendingFileName('');
    setImportOpen(true);
  };

  const closeImportWizard = () => {
    setImportOpen(false);
    setImportStep(1);
    setTemplateDownloaded(false);
    setPendingFileName('');
    setImporting(false);
  };

  const saveDraft = () => {
    if (!draft.source.trim() || !draft.target.trim()) {
      onNotify('请填写源术语和标准译文');
      return;
    }
    const next = upsertTerminologyEntry(draft, entries);
    setEntries(next);
    setEditorOpen(false);
    setDraft(EMPTY_DRAFT);
    onNotify(draft.id ? '术语已更新' : '术语已添加');
  };

  const removeEntry = (entry: TerminologyEntry) => {
    setEntries(deleteTerminologyEntry(entry.id, entries));
    onNotify(`已删除「${entry.source}」`);
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    setPendingFileName(file.name);
    try {
      const drafts = await importTerminologyFromFile(file);
      const { entries: next, added, updated } = mergeTerminologyEntries(drafts, entries);
      setEntries(next);
      onNotify(`导入完成：新增 ${added} 条，更新 ${updated} 条`);
      closeImportWizard();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : '导入失败');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="page relative z-10 px-6 pb-8 lg:px-10">
      <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="sparkle-surface grid h-11 w-11 place-items-center rounded-2xl bg-hero-gradient text-white shadow-glow">
              <BookMarked className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-[28px] font-semibold tracking-tight text-foreground">
                专业术语库
              </h2>
              <p className="mt-0.5 max-w-xl text-[12.5px] text-muted-foreground">
                预制标准译法，供 PPT 翻译等场景注入 AI，避免模型自由发挥导致术语不准。
              </p>
            </div>
          </div>
          <div className="text-[12px] text-muted-foreground">
            共 <strong className="text-foreground">{entries.length}</strong> 条术语
            {visible.length !== entries.length ? ` · 当前显示 ${visible.length} 条` : ''}
          </div>
        </div>

        <div className="flex w-full max-w-3xl flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索源术语、译文、领域或备注"
                className="glass-input w-full rounded-xl border border-border/70 py-2.5 pl-10 pr-3 text-[13px] outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <select
              value={domainFilter}
              onChange={(event) => setDomainFilter(event.target.value)}
              className="glass-input rounded-xl border border-border/70 px-3 py-2.5 text-[12.5px] outline-none"
              aria-label="按领域筛选"
            >
              {domains.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn soft inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold"
              onClick={openImportWizard}
            >
              <Download className="h-3.5 w-3.5" />
              下载导入
            </button>
            <button
              type="button"
              className="btn soft inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold"
              onClick={() => {
                if (!entries.length) {
                  onNotify('暂无术语可导出');
                  return;
                }
                exportTerminologyCsv(entries);
                onNotify('术语库已导出为 CSV');
              }}
            >
              <FileDown className="h-3.5 w-3.5" />
              导出全部
            </button>
            <button
              type="button"
              className="btn-hero-3d inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-semibold"
              onClick={openCreate}
            >
              <Plus className="h-3.5 w-3.5" />
              新增术语
            </button>
            <input
              ref={uploadRef}
              type="file"
              hidden
              accept=".csv,text/csv,.txt"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleImport(file);
                event.target.value = '';
              }}
            />
          </div>
        </div>
      </div>

      <div className="terminology-table-wrap glass-card overflow-hidden rounded-2xl border border-border/70">
        <table className="terminology-table">
          <thead>
            <tr>
              <th>源术语</th>
              <th>标准译文</th>
              <th>语言</th>
              <th>领域</th>
              <th>备注</th>
              <th className="terminology-actions-col">操作</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="terminology-empty">
                  {entries.length === 0
                    ? '还没有术语。可点击「下载导入」按模板填写后上传，或直接「新增术语」。'
                    : '没有匹配的术语，试试调整搜索或领域筛选。'}
                </td>
              </tr>
            ) : (
              visible.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <strong>{entry.source}</strong>
                  </td>
                  <td>{entry.target}</td>
                  <td className="terminology-lang">
                    {entry.sourceLang} → {entry.targetLang}
                  </td>
                  <td>
                    {entry.domain ? (
                      <span className="terminology-domain">{entry.domain}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="terminology-note">{entry.note || '—'}</td>
                  <td>
                    <div className="terminology-row-actions">
                      <button
                        type="button"
                        className="icon-btn"
                        title="编辑"
                        aria-label={`编辑 ${entry.source}`}
                        onClick={() => openEdit(entry)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        title="删除"
                        aria-label={`删除 ${entry.source}`}
                        onClick={() => removeEntry(entry)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {importOpen && (
        <div
          className="modal-bg show"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeImportWizard();
          }}
        >
          <div
            className="modal terminology-import-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="terminology-import-title"
          >
            <div className="modal-head">
              <h3 id="terminology-import-title">下载导入术语</h3>
              <button
                type="button"
                className="icon-btn"
                aria-label="关闭"
                onClick={closeImportWizard}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="terminology-import-steps" aria-label="导入步骤">
              <div className={`terminology-import-step ${importStep === 1 ? 'active' : 'done'}`}>
                <span className="terminology-import-step-index">
                  {importStep > 1 ? <Check className="h-3.5 w-3.5" /> : '1'}
                </span>
                <span>下载模板</span>
              </div>
              <div className="terminology-import-step-line" />
              <div className={`terminology-import-step ${importStep === 2 ? 'active' : ''}`}>
                <span className="terminology-import-step-index">2</span>
                <span>上传已填写文件</span>
              </div>
            </div>

            {importStep === 1 ? (
              <div className="terminology-import-panel">
                <strong>第一步：下载导入模板</strong>
                <p>
                  下载 CSV 模板后，按列填写「源术语 / 标准译文 / 源语言 / 目标语言 / 领域 / 备注」，保存后再进入下一步上传。
                </p>
                <button
                  type="button"
                  className="btn primary inline-flex items-center gap-1.5"
                  onClick={() => {
                    downloadTerminologyTemplate();
                    setTemplateDownloaded(true);
                    onNotify('模板已下载，请填写后进入下一步上传');
                  }}
                >
                  <FileDown className="h-3.5 w-3.5" />
                  下载 CSV 模板
                </button>
                {templateDownloaded && (
                  <div className="terminology-import-hint">
                    <Check className="h-3.5 w-3.5" />
                    模板已下载，填写完成后可进入下一步
                  </div>
                )}
                <div className="quick-row" style={{ marginTop: 16 }}>
                  <button type="button" className="btn primary" onClick={() => setImportStep(2)}>
                    下一步：上传文件
                  </button>
                  <button type="button" className="btn" onClick={closeImportWizard}>
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="terminology-import-panel">
                <strong>第二步：上传已填写的文件</strong>
                <p>
                  选择你填写完成的 CSV 文件。相同「源语言 + 目标语言 + 源术语」会更新译文，其余条目将新增。
                </p>
                <button
                  type="button"
                  className="btn primary inline-flex items-center gap-1.5"
                  disabled={importing}
                  onClick={() => uploadRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {importing ? '导入中…' : '选择并上传文件'}
                </button>
                {pendingFileName && (
                  <div className="terminology-import-hint">已选择：{pendingFileName}</div>
                )}
                <div className="quick-row" style={{ marginTop: 16 }}>
                  <button type="button" className="btn" onClick={() => setImportStep(1)}>
                    上一步
                  </button>
                  <button type="button" className="btn" onClick={closeImportWizard}>
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {editorOpen && (
        <div
          className="modal-bg show"
          onClick={(event) => {
            if (event.target === event.currentTarget) setEditorOpen(false);
          }}
        >
          <div className="modal terminology-editor-modal" role="dialog" aria-modal="true">
            <div className="modal-head">
              <h3>{draft.id ? '编辑术语' : '新增术语'}</h3>
              <button
                type="button"
                className="icon-btn"
                aria-label="关闭"
                onClick={() => setEditorOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="terminology-editor-form">
              <label>
                <span>源术语</span>
                <input
                  value={draft.source}
                  onChange={(event) => setDraft((prev) => ({ ...prev, source: event.target.value }))}
                  placeholder="例如：慢性肾脏病"
                />
              </label>
              <label>
                <span>标准译文</span>
                <input
                  value={draft.target}
                  onChange={(event) => setDraft((prev) => ({ ...prev, target: event.target.value }))}
                  placeholder="例如：Chronic Kidney Disease (CKD)"
                />
              </label>
              <div className="terminology-editor-row">
                <label>
                  <span>源语言</span>
                  <input
                    value={draft.sourceLang}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, sourceLang: event.target.value }))
                    }
                    placeholder="zh"
                  />
                </label>
                <label>
                  <span>目标语言</span>
                  <input
                    value={draft.targetLang}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, targetLang: event.target.value }))
                    }
                    placeholder="en"
                  />
                </label>
              </div>
              <label>
                <span>领域</span>
                <input
                  value={draft.domain}
                  onChange={(event) => setDraft((prev) => ({ ...prev, domain: event.target.value }))}
                  placeholder="例如：肾病 / 合规 / 传播"
                />
              </label>
              <label>
                <span>备注</span>
                <textarea
                  value={draft.note}
                  onChange={(event) => setDraft((prev) => ({ ...prev, note: event.target.value }))}
                  placeholder="使用场景、禁用译法、缩写要求等"
                  rows={3}
                />
              </label>
            </div>
            <div className="quick-row" style={{ marginTop: 14 }}>
              <button type="button" className="btn primary" onClick={saveDraft}>
                保存
              </button>
              <button type="button" className="btn" onClick={() => setEditorOpen(false)}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
