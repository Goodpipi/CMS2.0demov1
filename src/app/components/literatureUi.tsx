import { Check, Download, ExternalLink, Plus, X } from 'lucide-react';
import type { LibraryItem } from '@/types/library';
import {
  buildLiteratureFullText,
  inferLiteratureScope,
  literatureCitationMeta,
  literatureSourceLabel,
  type LiteratureArticle,
  type LiteratureScope,
} from '@/lib/literatureMocks';
import { cn } from '@/app/components/ui/utils';

export function LiteratureThirdPartyHint({ className }: { className?: string }) {
  return (
    <div className={cn('small literature-more-hint', className)}>
      如需检索更多文献，请访问
      <a href="https://www.cnki.net/" target="_blank" rel="noreferrer">
        CNKI
      </a>
      ，
      <a href="https://med.wanfangdata.com.cn/" target="_blank" rel="noreferrer">
        万方医学
      </a>
      等三方知识库。
    </div>
  );
}

export function LiteratureSourceTag({
  scope,
  label,
}: {
  scope: LiteratureScope;
  label: string;
}) {
  return (
    <span
      className={cn(
        'literature-source-tag',
        scope === 'deep' && 'is-deep',
        scope === 'personal' && 'is-personal',
        scope === 'external' && 'is-external'
      )}
    >
      {label}
    </span>
  );
}

export function LiteraturePreviewModal({
  article,
  item,
  added,
  onAdd,
  onClose,
}: {
  article?: LiteratureArticle | null;
  item?: LibraryItem | null;
  added?: boolean;
  onAdd?: () => void;
  onClose: () => void;
}) {
  const title = article?.title || item?.title;
  if (!title) return null;
  const scope = article ? inferLiteratureScope(article) : item?.cms ? 'cms' : 'personal';
  const sourceLabel = article
    ? literatureSourceLabel(article)
    : item?.cms
      ? 'CMS'
      : '个人知识收藏';
  const meta = article ? literatureCitationMeta(article, { includeJournal: true }) : item?.meta || '';
  const body = article ? buildLiteratureFullText(article) : item?.contentText || item?.meta || '';
  const canAdd = Boolean(onAdd) && (article ? article.access === 'free' : true);

  return (
    <div
      className="modal-bg show literature-preview-bg"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal literature-preview-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="literature-preview-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="literature-preview-head">
          <div>
            <div className="literature-card-meta">
              <LiteratureSourceTag scope={scope} label={sourceLabel} />
              {meta ? <span className="literature-journal">{meta}</span> : null}
            </div>
            <h3 id="literature-preview-title">{title}</h3>
          </div>
          <button type="button" className="literature-picker-close" onClick={onClose} aria-label="关闭">
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </header>
        <div className="literature-preview-body">
          <pre className="literature-preview-document">{body}</pre>
        </div>
        <footer className="literature-preview-foot">
          <span className="small">全文预览</span>
          <div className="literature-actions">
            {canAdd ? (
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
            ) : null}
            <button type="button" className="btn soft" onClick={onClose}>
              关闭
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function LiteratureResultCard({
  article,
  added,
  compact = false,
  onAdd,
  onPreview,
}: {
  article: LiteratureArticle;
  added: boolean;
  compact?: boolean;
  onAdd: () => void;
  onPreview: () => void;
}) {
  const scope = inferLiteratureScope(article);
  const sourceLabel = literatureSourceLabel(article);
  const meta = literatureCitationMeta(article);
  const canAdd = article.access === 'free';
  const hasOutboundLink = Boolean(article.sourceUrl) && !article.sourceUrl.startsWith('#');

  return (
    <article className={cn('literature-card literature-picker-card', compact && 'is-compact')}>
      <div className="literature-card-top">
        <div className="literature-card-meta">
          <LiteratureSourceTag scope={scope} label={sourceLabel} />
          <span className="literature-journal">{meta}</span>
        </div>
        {!compact && (
          <LiteratureCardActions
            canAdd={canAdd}
            added={added}
            hasOutboundLink={hasOutboundLink}
            showCmsLink={scope === 'cms'}
            sourceUrl={article.sourceUrl}
            onAdd={onAdd}
          />
        )}
      </div>
      {canAdd ? (
        <button type="button" className="literature-title-btn" onClick={onPreview}>
          {article.title}
        </button>
      ) : (
        <h5>{article.title}</h5>
      )}
      {!compact && <p className="literature-abstract">{article.abstract}</p>}
      {compact && (
        <LiteratureCardActions
          canAdd={canAdd}
          added={added}
          hasOutboundLink={false}
          showCmsLink={false}
          sourceUrl={article.sourceUrl}
          onAdd={onAdd}
        />
      )}
    </article>
  );
}

export function KnowledgeResultCard({
  item,
  added,
  compact = false,
  onAdd,
  onPreview,
}: {
  item: LibraryItem;
  added: boolean;
  compact?: boolean;
  onAdd: () => void;
  onPreview: () => void;
}) {
  const scope: LiteratureScope = item.cms ? 'cms' : 'personal';
  const sourceLabel = item.cms ? 'CMS' : '个人知识收藏';
  return (
    <article className={cn('literature-card literature-picker-card', compact && 'is-compact')}>
      <div className="literature-card-top">
        <div className="literature-card-meta">
          <LiteratureSourceTag scope={scope} label={sourceLabel} />
          <span className="literature-journal">{item.meta}</span>
        </div>
        {!compact && <AddToTaskButton added={added} onAdd={onAdd} />}
      </div>
      <button type="button" className="literature-title-btn" onClick={onPreview}>
        {item.title}
      </button>
      {!compact && <p className="literature-abstract">{item.contentText || item.meta}</p>}
      {compact && <AddToTaskButton added={added} onAdd={onAdd} />}
    </article>
  );
}

function AddToTaskButton({ added, onAdd }: { added: boolean; onAdd: () => void }) {
  return (
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
  );
}

function LiteratureCardActions({
  canAdd,
  added,
  hasOutboundLink,
  showCmsLink,
  sourceUrl,
  onAdd,
}: {
  canAdd: boolean;
  added: boolean;
  hasOutboundLink: boolean;
  showCmsLink: boolean;
  sourceUrl: string;
  onAdd: () => void;
}) {
  if (!canAdd) {
    return (
      <div className="literature-actions">
        <a className="btn soft literature-link-btn" href={sourceUrl} target="_blank" rel="noreferrer">
          <Download className="h-3.5 w-3.5" strokeWidth={2.2} />
          前往原链接下载
        </a>
      </div>
    );
  }

  return (
    <div className="literature-actions">
      {(hasOutboundLink || showCmsLink) && (
        <a className="btn soft literature-link-btn" href={sourceUrl} target="_blank" rel="noreferrer">
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.2} />
          查看原文链接
        </a>
      )}
      <AddToTaskButton added={added} onAdd={onAdd} />
    </div>
  );
}
