import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Upload, X } from 'lucide-react';
import { readFileForPreview } from '@/lib/materialContent';
import {
  inferLiteratureScope,
  LITERATURE_SCOPE_OPTIONS,
  searchLiteratureByScopes,
  type LiteratureArticle,
  type LiteratureScope,
} from '@/lib/literatureMocks';
import { isMaterialUsable } from '@/lib/libraryUtils';
import type { LibraryItem } from '@/types/library';
import type { PickedMaterial } from '@/app/components/MaterialPickerModal';
import {
  KnowledgeResultCard,
  LiteraturePreviewModal,
  LiteratureResultCard,
  LiteratureThirdPartyHint,
} from '@/app/components/literatureUi';

type SearchHit =
  | { key: string; kind: 'article'; article: LiteratureArticle }
  | { key: string; kind: 'knowledge'; item: LibraryItem };

interface LiteraturePickerModalProps {
  open: boolean;
  knowledgeItems?: LibraryItem[];
  addedLiteratureIds: string[];
  uploadCat?: string;
  onClose: () => void;
  onAddLiterature: (article: LiteratureArticle) => void;
  onAddKnowledge: (item: LibraryItem) => void;
  onUpload: (item: PickedMaterial) => void;
}

const ALL_SCOPES = LITERATURE_SCOPE_OPTIONS.map((option) => option.id);

function knowledgeScope(item: LibraryItem): LiteratureScope {
  return item.cms ? 'cms' : 'personal';
}

function matchesQuery(text: string, query: string): boolean {
  if (!query) return true;
  return text.toLowerCase().includes(query);
}

export function LiteraturePickerModal({
  open,
  knowledgeItems = [],
  addedLiteratureIds,
  uploadCat = '参考知识',
  onClose,
  onAddLiterature,
  onAddKnowledge,
  onUpload,
}: LiteraturePickerModalProps) {
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [preview, setPreview] = useState<SearchHit | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setAppliedQuery('');
    setPreview(null);
  }, [open]);

  const results = useMemo(() => {
    const q = appliedQuery.trim().toLowerCase();
    const articles = searchLiteratureByScopes(appliedQuery, ALL_SCOPES);
    const articleTitles = new Set(articles.map((item) => item.title));
    const knowledgeHits: SearchHit[] = knowledgeItems
      .filter((item) => item.cat === uploadCat && isMaterialUsable(item))
      .filter((item) => !(item.referenced ?? item.def))
      .filter((item) => matchesQuery(`${item.title} ${item.meta} ${item.contentText ?? ''}`, q))
      .filter((item) => !articleTitles.has(item.title))
      .map((item) => ({
        key: `knowledge-${item.id}`,
        kind: 'knowledge' as const,
        item,
      }));

    const articleHits: SearchHit[] = articles.map((article) => ({
      key: article.id,
      kind: 'article' as const,
      article,
    }));

    return [...articleHits, ...knowledgeHits];
  }, [appliedQuery, knowledgeItems, uploadCat]);

  const columns = useMemo(
    () =>
      LITERATURE_SCOPE_OPTIONS.map((option) => ({
        ...option,
        hits: results.filter((hit) =>
          hit.kind === 'article'
            ? inferLiteratureScope(hit.article) === option.id
            : knowledgeScope(hit.item) === option.id
        ),
      })),
    [results]
  );

  if (!open) return null;

  const runSearch = () => {
    const nextQuery = query.trim();
    setSearching(true);
    window.setTimeout(() => {
      setAppliedQuery(nextQuery);
      setSearching(false);
    }, 220);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const previewFile = await readFileForPreview(file);
    onUpload({
      title: file.name,
      meta: `本地上传 · ${(file.size / 1024).toFixed(0)}KB · 已解析`,
      cat: uploadCat,
      cms: false,
      fileName: file.name,
      ...previewFile,
    });
    event.target.value = '';
    onClose();
  };

  const addedKnowledgeIds = new Set(
    knowledgeItems.filter((item) => item.referenced ?? item.def).map((item) => item.id)
  );

  const previewArticle = preview?.kind === 'article' ? preview.article : null;
  const previewItem = preview?.kind === 'knowledge' ? preview.item : null;
  const previewAdded = previewArticle
    ? addedLiteratureIds.includes(previewArticle.id)
    : previewItem
      ? addedKnowledgeIds.has(previewItem.id)
      : false;

  return (
    <div
      className="modal-bg show material-picker-bg literature-picker-bg"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal literature-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="literature-picker-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="literature-picker-head">
          <div>
            <h3 id="literature-picker-title">添加材料</h3>
            <LiteratureThirdPartyHint />
          </div>
          <button type="button" className="literature-picker-close" onClick={onClose} aria-label="关闭">
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>

        <div className="literature-picker-toolbar">
          <div className="literature-picker-search">
            <Search className="literature-picker-search-icon" />
            <input
              className="glass-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && runSearch()}
              placeholder="输入关键词，如疾病、药物、期刊…"
              aria-label="文献关键词"
            />
          </div>
          <button type="button" className="btn primary literature-search-btn" disabled={searching} onClick={runSearch}>
            {searching ? '检索中…' : '确认搜索'}
          </button>
        </div>

        <div className="literature-picker-columns" aria-busy={searching}>
          {searching ? (
            <div className="literature-picker-empty literature-picker-empty-span">正在检索文献…</div>
          ) : (
            columns.map((column) => (
              <section key={column.id} className="literature-picker-column">
                <header className="literature-picker-column-head">
                  <h4>{column.label}</h4>
                  <em>{column.hits.length}</em>
                </header>
                <div className="literature-picker-column-list">
                  {column.hits.length === 0 ? (
                    <div className="literature-picker-empty">该来源暂无匹配文献</div>
                  ) : (
                    column.hits.map((hit) =>
                      hit.kind === 'article' ? (
                        <LiteratureResultCard
                          key={hit.key}
                          article={hit.article}
                          added={addedLiteratureIds.includes(hit.article.id)}
                          compact
                          onAdd={() => onAddLiterature(hit.article)}
                          onPreview={() => setPreview(hit)}
                        />
                      ) : (
                        <KnowledgeResultCard
                          key={hit.key}
                          item={hit.item}
                          added={addedKnowledgeIds.has(hit.item.id)}
                          compact
                          onAdd={() => onAddKnowledge(hit.item)}
                          onPreview={() => setPreview(hit)}
                        />
                      )
                    )
                  )}
                </div>
              </section>
            ))
          )}
        </div>

        <div className="literature-picker-foot">
          <span>
            {`共 ${results.length} 条 · ${columns.map((column) => `${column.label} ${column.hits.length}`).join(' · ')}`}
          </span>
          <button type="button" className="btn soft literature-upload-btn" onClick={() => fileRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" strokeWidth={2.2} />
            手动上传
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          hidden
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.svg,.txt,.md"
          onChange={handleUpload}
        />
      </div>

      {(previewArticle || previewItem) && (
        <LiteraturePreviewModal
          article={previewArticle}
          item={previewItem}
          added={previewAdded}
          onAdd={
            previewArticle
              ? () => onAddLiterature(previewArticle)
              : previewItem
                ? () => onAddKnowledge(previewItem)
                : undefined
          }
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
