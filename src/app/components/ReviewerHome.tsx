import { useState } from 'react';
import type { ChatSession } from '@/types/session';
import type { ReviewTask } from '@/types/review';
import { ROLE_PROFILES } from '@/types/review';
import { formatSessionTime, deriveSessionSubtitle, sessionEntryLabel, sessionEntrySource } from '@/lib/chatSessions';
import { collectTaskStatusLabel } from '@/lib/reviewTasks';
import { TEAM_CONTENT_LABELS } from '@/app/components/teamReviewUtils';
import { ArrowRight, Presentation } from 'lucide-react';

interface ReviewerHomeProps {
  tasks: ReviewTask[];
  generateSessions: ChatSession[];
  deptLabel: string;
  onOpenTask: (taskId: string) => void;
  onOpenSession: (sessionId: string) => void;
}

export function ReviewerHome({
  tasks,
  generateSessions,
  deptLabel: _deptLabel,
  onOpenTask,
  onOpenSession,
}: ReviewerHomeProps) {
  const [tab, setTab] = useState<'generate' | 'collect'>('collect');
  const items = tab === 'collect' ? tasks : generateSessions;

  return (
    <div className="reviewer-home">
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, margin: '0 0 12px', color: 'var(--blue)' }}>
          历史任务
        </h1>
      </div>

      <div className="home-history-tabs reviewer-home-tabs" role="tablist" aria-label="历史任务类型">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'generate'}
          className={`home-history-tab ${tab === 'generate' ? 'active' : ''}`}
          onClick={() => setTab('generate')}
        >
          内容生成
          <span>{generateSessions.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'collect'}
          className={`home-history-tab ${tab === 'collect' ? 'active' : ''}`}
          onClick={() => setTab('collect')}
        >
          意见收集
          <span>{tasks.length}</span>
        </button>
      </div>

      {items.length === 0 ? (
        <div className="detail-card" style={{ textAlign: 'center', padding: 40 }}>
          {tab === 'collect' ? (
            <>
              <h4>暂无意见收集任务</h4>
              <div className="small">运营提交团队意见收集后，任务会出现在此列表。</div>
            </>
          ) : (
            <>
              <h4>暂无内容生成任务</h4>
              <div className="small">内容运营创建任务后，可在此查看相关内容。</div>
            </>
          )}
        </div>
      ) : tab === 'collect' ? (
        <div className="review-task-list">
          {tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              className="review-task-card content-tile"
              onClick={() => onOpenTask(task.id)}
            >
              <div className="review-task-card-head">
                <strong>{task.title}</strong>
                <span className={task.status === 'completed' ? 'badge green' : task.status === 'in_progress' ? 'badge warn' : 'badge'}>
                  {collectTaskStatusLabel(task.status)}
                </span>
              </div>
              <div className="small" style={{ marginTop: 8 }}>
                类型：{TEAM_CONTENT_LABELS[task.contentType]} · 分配人：{task.assignerName} ·{' '}
                {ROLE_PROFILES[task.assigneeRole].dept} · 截止：
                {task.deadline.replace('T', ' ')}
              </div>
              <div className="small" style={{ marginTop: 4, color: 'var(--muted)' }}>
                更新于 {formatSessionTime(task.updatedAt)}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="home-task-grid home-inspire-history-list reviewer-generate-list">
          {generateSessions.map((session) => (
            <article key={session.id} className="home-task-card group">
              <button
                type="button"
                className="home-task-card-main"
                onClick={() => onOpenSession(session.id)}
              >
                <span className="home-task-card-icon">
                  <Presentation className="h-4 w-4 text-white" strokeWidth={2.4} />
                </span>
                <span className="home-task-card-copy">
                  <span className="home-task-card-title-row">
                    <strong>{session.title}</strong>
                    <em className={`home-task-entry-tag is-${sessionEntrySource(session)}`}>
                      {sessionEntryLabel(session)}
                    </em>
                  </span>
                  <span className="home-task-card-meta">
                    {deriveSessionSubtitle(session)} · {formatSessionTime(session.updatedAt)}
                  </span>
                </span>
                <ArrowRight className="home-task-card-arrow h-4 w-4" />
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
