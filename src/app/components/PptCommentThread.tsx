import type { PptReviewComment } from '@/types/review';

interface PptCommentThreadProps {
  comment: PptReviewComment;
  metaTitle: string;
  metaSubtitle?: string;
  replyDraft: string;
  onReplyDraftChange: (value: string) => void;
  onReply: () => void;
  replyPlaceholder: string;
  showReplyComposer: boolean;
  /** creator = 创作者右侧；reviewer = 审阅者批注栏 */
  variant?: 'creator' | 'reviewer';
}

export function PptCommentThread({
  comment,
  metaTitle,
  metaSubtitle,
  replyDraft,
  onReplyDraftChange,
  onReply,
  replyPlaceholder,
  showReplyComposer,
  variant = 'creator',
}: PptCommentThreadProps) {
  const threadClass =
    variant === 'creator' ? 'creator-comment-thread' : 'reviewer-ppt-comment';
  const replyClass =
    variant === 'creator' ? 'creator-comment-reply' : 'reviewer-ppt-comment-reply';
  const composeClass =
    variant === 'creator' ? 'creator-comment-compose' : 'reviewer-comment-reply-compose';

  return (
    <article className={threadClass}>
      {variant === 'creator' ? (
        <div className="creator-comment-meta">
          <strong>{metaTitle}</strong>
          {metaSubtitle ? <span>{metaSubtitle}</span> : null}
        </div>
      ) : (
        <strong>{metaTitle}</strong>
      )}
      {variant === 'creator' ? <p>{comment.content}</p> : <span>{comment.content}</span>}
      {(comment.replies || []).map((reply) => (
        <div
          key={reply.id}
          className={`${replyClass} ${
            reply.authorRole === 'ops' ? 'reply-ops' : 'reply-reviewer'
          }`}
        >
          <strong>{reply.authorName} 回复</strong>
          <span>{reply.content}</span>
        </div>
      ))}
      {showReplyComposer && (
        <div className={composeClass}>
          <textarea
            value={replyDraft}
            onChange={(event) => onReplyDraftChange(event.target.value)}
            placeholder={replyPlaceholder}
          />
          <button
            type="button"
            className="btn primary"
            disabled={!replyDraft.trim()}
            onClick={onReply}
          >
            回复
          </button>
        </div>
      )}
    </article>
  );
}
