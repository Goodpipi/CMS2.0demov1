import { useEffect, useState } from 'react';
import type { CopyRevision, UserRole } from '@/types/review';
import { AUTHOR_COLORS, ROLE_PROFILES } from '@/types/review';

interface CopyRevisionDisplayProps {
  baseText: string;
  revisions: CopyRevision[];
  editable?: boolean;
  editText?: string;
  role?: UserRole;
  onSave?: (text: string) => void;
}

function legendRoles(revision: CopyRevision): UserRole[] {
  if (revision.contributorRoles?.length) return revision.contributorRoles;
  return [revision.authorRole];
}

export function CopyRevisionDisplay({
  baseText,
  revisions,
  editable = false,
  editText = '',
  role = 'medical',
  onSave,
}: CopyRevisionDisplayProps) {
  const [draft, setDraft] = useState(editText);
  const profile = ROLE_PROFILES[role];

  useEffect(() => {
    setDraft(editText);
  }, [editText]);

  const hasRevisions = revisions.length > 0;
  const revision = hasRevisions ? revisions[revisions.length - 1] : null;
  const roles = revision ? legendRoles(revision) : editable ? [role] : [];
  const colors = revision ? AUTHOR_COLORS[revision.authorRole] : AUTHOR_COLORS[role];

  return (
    <div className="detail-card copy-revision-panel">
      <h4>文案修改记录</h4>
      <div className="small" style={{ marginBottom: 10 }}>
        {editable ? (
          <>
            当前身份：<strong>{profile.name}（{profile.dept}）</strong>
            。在下方「修订对比」中直接修改正文，保存后增删将相对原文显示。
          </>
        ) : hasRevisions ? (
          '相对原文的增删对比（已合并全部审阅修改）'
        ) : (
          '暂无审阅者提交的修改记录。'
        )}
      </div>

      {roles.length > 0 && (
        <div className="copy-revision-legend">
          {roles.map((r) => {
            const p = ROLE_PROFILES[r];
            return (
              <span key={r} className="copy-revision-legend-item">
                <span
                  className="copy-revision-dot"
                  style={{ background: AUTHOR_COLORS[r].add }}
                />
                {p.name}-{p.dept}
              </span>
            );
          })}
        </div>
      )}

      <div className="copy-revision-workspace">
        {(hasRevisions || editable) && (
          <div className="copy-revision-block">
            <div className="small copy-revision-block-label">
              <strong>修订对比</strong>
              {revision ? (
                <> · {new Date(revision.createdAt).toLocaleString()}</>
              ) : editable ? (
                <> · 可直接编辑</>
              ) : null}
            </div>

            {editable ? (
              <>
                <textarea
                  className="copy-revision-diff copy-revision-inline-edit"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={12}
                  spellCheck={false}
                  aria-label="修订对比正文"
                />
                <div className="quick-row copy-revision-save-row">
                  <button type="button" className="btn primary" onClick={() => onSave?.(draft)}>
                    保存修改
                  </button>
                </div>
              </>
            ) : revision ? (
              <div className="copy-revision-diff">
                {revision.segments.map((seg, i) => {
                  if (seg.kind === 'equal') {
                    return <span key={i}>{seg.text}</span>;
                  }
                  if (seg.kind === 'add') {
                    return (
                      <span key={i} className="copy-diff-add" style={{ color: colors.add }}>
                        {seg.text}
                      </span>
                    );
                  }
                  return (
                    <span
                      key={i}
                      className="copy-diff-del"
                      style={{ color: colors.del, textDecoration: 'line-through' }}
                    >
                      {seg.text}
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {(hasRevisions || editable) && (
        <details className="small" style={{ marginTop: 8 }}>
          <summary>查看修改前原文</summary>
          <p style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{baseText}</p>
        </details>
      )}
    </div>
  );
}
