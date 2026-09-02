import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Download, ExternalLink, Plus, Search, Star, Upload, X } from 'lucide-react';
import { readFileForPreview } from '@/lib/materialContent';
import {
  inferLiteratureScope,
  literatureScopeLabel,
  LITERATURE_SCOPE_OPTIONS,
  searchLiteratureByScopes,
  type LiteratureArticle,
  type LiteratureScope,
} from '@/lib/literatureMocks';
import { isMaterialUsable } from '@/lib/libraryUtils';
import type { LibraryItem } from '@/types/library';
import type { PickedMaterial } from '@/app/components/MaterialPickerModal';
import { cn } from '@/app/components/ui/utils';

type SearchHit =
  | { key: string; kind: 'article'; article: LiteratureArticle }
  | { key: string; kind: 'knowledge'; item: LibraryItem; premium: boolean };

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
const LITERATURE_PAGE_SIZE = 30;

function knowledgeScope(item: LibraryItem): LiteratureScope {
  return item.cms ? 'cms' : 'personal';
}

function isKnowledgePremium(item: LibraryItem): boolean {
  return item.cms && /approved|优质/i.test(`${item.title} ${item.meta}`);
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
  const [scopes, setScopes] = useState<LiteratureScope[]>(ALL_SCOPES);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [appliedQuery, setAppliedQuery] = useState('');
  const [appliedScopes, setAppliedScopes] = useState<LiteratureScope[]>(ALL_SCOPES);
  const [searching, setSearching] = useState(false);
  const [visibleCount, setVisibleCount] = useState(LITERATURE_PAGE_SIZE);
  const fileRef = useRef<HTMLInputElement>(null);
  const scopeRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setScopes(ALL_SCOPES);
    setAppliedQuery('');
    setAppliedScopes(ALL_SCOPES);
    setScopeOpen(false);
    setVisibleCount(LITERATURE_PAGE_SIZE);
  }, [open]);

  useEffect(() => {
    setVisibleCount(LITERATURE_PAGE_SIZE);
    listRef.current?.scrollTo({ top: 0 });
  }, [appliedQuery, appliedScopes]);

  useEffect(() => {
    if (!scopeOpen) return;
    const onDoc = (event: MouseEvent) => {
      if (scopeRef.current && !scopeRef.current.contains(event.target as Node)) {
        setScopeOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [scopeOpen]);

  const hasSearched = Boolean(appliedQuery.trim());
  const results = useMemo(() => {
    const q = appliedQuery.trim().toLowerCase();
    if (!q) return [];
    const articles = searchLiteratureByScopes(appliedQuery, appliedScopes);
    const articleTitles = new Set(articles.map((item) => item.title));
    const knowledgeHits: SearchHit[] = knowledgeItems
      .filter((item) => item.cat === uploadCat && isMaterialUsable(item))
      .filter((item) => !(item.referenced ?? item.def))
      .filter((item) => appliedScopes.includes(knowledgeScope(item)))
      .filter((item) => matchesQuery(`${item.title} ${item.meta} ${item.contentText ?? ''}`, q))
      .filter((item) => !articleTitles.has(item.title))
      .map((item) => ({
        key: `knowledge-${item.id}`,
        kind: 'knowledge' as const,
        item,
        premium: isKnowledgePremium(item),
      }));

    const articleHits: SearchHit[] = articles.map((article) => ({
      key: article.id,
      kind: 'article' as const,
      article,
    }));

    const merged = [...articleHits, ...knowledgeHits];
    const scopeRank = (hit: SearchHit) => {
      const scope = hit.kind === 'article' ? inferLiteratureScope(hit.article) : knowledgeScope(hit.item);
      const premium =
        hit.kind === 'article' ? Boolean(hit.article.premium && scope === 'cms') : hit.premium;
      if (premium) return 0;
      if (scope === 'cms') return 1;
      if (scope === 'personal') return 2;
      return 3;
    };
    return merged.sort((a, b) => scopeRank(a) - scopeRank(b));
  }, [appliedQuery, appliedScopes, knowledgeItems, uploadCat]);
  const visibleResults = results.slice(0, visibleCount);
  const hasMore = visibleCount < results.length;

  if (!open) return null;

  const runSearch = () => {
    const nextQuery = query.trim();
    if (!nextQuery) {
      setAppliedQuery('');
      return;
    }
    setSearching(true);
    setScopeOpen(false);
    window.setTimeout(() => {
      setAppliedQuery(nextQuery);
      setAppliedScopes(scopes.length ? scopes : []);
      setSearching(false);
    }, 220);
  };

  const toggleScope = (id: LiteratureScope) => {
    setScopes((prev) => (prev.includes(id) ? prev.filter((scope) => scope !== id) : [...prev, id]));
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const preview = await readFileForPreview(file);
    onUpload({
      title: file.name,
      meta: `本地上传 · ${(file.size / 1024).toFixed(0)}KB · 已解析`,
      cat: uploadCat,
      cms: false,
      fileName: file.name,
      ...preview,
    });
    event.target.value = '';
    onClose();
  };

  const addedKnowledgeIds = new Set(
    knowledgeItems.filter((item) => item.referenced ?? item.def).map((item) => item.id)
  );

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
            <p>从 CMS、个人知识收藏与外部知识库检索医学文献</p>
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

          <div className="literature-scope-wrap" ref={scopeRef}>
            <button
              type="button"
              className="literature-scope-trigger"
              aria-expanded={scopeOpen}
              aria-haspopup="listbox"
              onClick={() => setScopeOpen((openNow) => !openNow)}
            >
              <span>{literatureScopeLabel(scopes)}</span>
              {scopes.length > 0 && <em>{scopes.length}</em>}
              <ChevronDown className={cn('h-3.5 w-3.5', scopeOpen && 'rotate-180')} />
            </button>
            {scopeOpen && (
              <div className="literature-scope-menu" role="listbox" aria-multiselectable>
                {LITERATURE_SCOPE_OPTIONS.map((option) => {
                  const checked = scopes.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="option"
                      aria-selected={checked}
                      className={cn('literature-scope-option', checked && 'is-checked')}
                      onClick={() => toggleScope(option.id)}
                    >
                      <span className="literature-scope-check">{checked ? <Check className="h-3 w-3" /> : null}</span>
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button type="button" className="btn primary literature-search-btn" disabled={searching} onClick={runSearch}>
            {searching ? '检索中…' : '确认搜索'}
          </button>
        </div>

        <div className="literature-picker-list" ref={listRef}>
          {searching ? (
            <div className="literature-picker-empty">正在检索文献…</div>
          ) : !hasSearched ? (
            <div className="literature-picker-empty">请输入关键词后点击「确认搜索」，例如「医学」。</div>
          ) : results.length === 0 ? (
            <div className="literature-picker-empty">当前范围暂无匹配文献，可调整关键词或搜索范围。</div>
          ) : (
            <>
              {visibleResults.map((hit) =>
                hit.kind === 'article' ? (
                  <LiteratureResultCard
                    key={hit.key}
                    article={hit.article}
                    added={addedLiteratureIds.includes(hit.article.id)}
                    onAdd={() => onAddLiterature(hit.article)}
                  />
                ) : (
                  <KnowledgeResultCard
                    key={hit.key}
                    item={hit.item}
                    premium={hit.premium}
                    added={addedKnowledgeIds.has(hit.item.id)}
                    onAdd={() => onAddKnowledge(hit.item)}
                  />
                )
              )}
              {hasMore && (
                <button
                  type="button"
                  className="btn soft literature-more-btn"
                  onClick={() => setVisibleCount((count) => count + LITERATURE_PAGE_SIZE)}
                >
                  查看更多文献
                </button>
              )}
            </>
          )}
        </div>

        <div className="literature-picker-foot">
          <span>
            {hasSearched
              ? `已展示 ${visibleResults.length} / 共 ${results.length} 条结果 · 范围：${literatureScopeLabel(appliedScopes)}`
              : '输入关键词后确认搜索'}
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
    </div>
  );
}

function LiteratureResultCard({
  article,
  added,
  onAdd,
}: {
  article: LiteratureArticle;
  added: boolean;
  onAdd: () => void;
}) {
  const scope = inferLiteratureScope(article);
  const premium = Boolean(article.premium && scope === 'cms');
  const sourceLabel = scope === 'personal' ? '个人知识收藏' : article.source;
  const meta = `${article.journalAbbr || article.publisher} · ${article.year}`;
  const canAdd = article.access === 'free';
  const hasOutboundLink = Boolean(article.sourceUrl) && !article.sourceUrl.startsWith('#');

  return (
    <article className={cn('literature-card literature-picker-card', premium && 'is-premium')}>
      <div className="literature-card-top">
        <div className="literature-card-meta">
          <span className={cn('literature-source-tag', scope === 'external' && 'is-external')}>{sourceLabel}</span>
          {premium && (
            <span className="literature-premium-tag">
              <Star className="h-3 w-3" strokeWidth={2.4} />
              优质素材
            </span>
          )}
          <span className="literature-journal">{meta}</span>
        </div>
        <div className="literature-actions">
          {canAdd ? (
            <>
              {(hasOutboundLink || scope === 'cms') && (
              <a className="btn soft literature-link-btn" href={article.sourceUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.2} />
                查看原文链接
              </a>
              )}
              <button
                type="button"
                className={cn('btn literature-add-btn', added ? 'soft' : 'green')}
                disabled={added}
                onClick={onAdd}
              >
                {added ? (
                  <>
                    <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                    已添加
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
                    添加到当前任务
                  </>
                )}
              </button>
            </>
          ) : (
            <a className="btn soft literature-link-btn" href={article.sourceUrl} target="_blank" rel="noreferrer">
              <Download className="h-3.5 w-3.5" strokeWidth={2.2} />
              前往原链接下载
            </a>
          )}
        </div>
      </div>
      <h5>{article.title}</h5>
      <p className="literature-abstract">{article.abstract}</p>
    </article>
  );
}

function KnowledgeResultCard({
  item,
  premium,
  added,
  onAdd,
}: {
  item: LibraryItem;
  premium: boolean;
  added: boolean;
  onAdd: () => void;
}) {
  const sourceLabel = item.cms ? 'CMS' : '个人知识收藏';
  return (
    <article className={cn('literature-card literature-picker-card', premium && 'is-premium')}>
      <div className="literature-card-top">
        <div className="literature-card-meta">
          <span className="literature-source-tag">{sourceLabel}</span>
          {premium && (
            <span className="literature-premium-tag">
              <Star className="h-3 w-3" strokeWidth={2.4} />
              优质素材
            </span>
          )}
          <span className="literature-journal">{item.meta}</span>
        </div>
        <div className="literature-actions">
          <button
            type="button"
            className={cn('btn literature-add-btn', added ? 'soft' : 'green')}
            disabled={added}
            onClick={onAdd}
          >
            {added ? (
              <>
                <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                已添加
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
                添加到当前任务
              </>
            )}
          </button>
        </div>
      </div>
      <h5>{item.title}</h5>
      <p className="literature-abstract">{item.contentText || item.meta}</p>
    </article>
  );
}
