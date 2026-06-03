import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ChatSession, SessionStatus } from '@/types/session';
import type { ChatProject } from '@/types/project';
import {
  createProject,
  deleteProject,
  loadAllProjects,
  renameProject,
  touchProject,
} from '@/lib/chatProjects';
import { moveSessionToProject } from '@/lib/chatSessions';
import { ChevronLeft, ChevronRight, FolderPlus, MessageSquare, MoreHorizontal, Search } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

function sessionToneClasses(status: SessionStatus): string {
  switch (status) {
    case 'in_progress':
    case 'team':
      return 'from-[#D8466A] to-[#7762B8]';
    case 'submitted':
      return 'from-[#4A9EE0] to-[#7762B8]';
    default:
      return 'from-[#4A9EE0] to-[#3B7FBF]';
  }
}

function lovableStatusClass(status: SessionStatus): string {
  switch (status) {
    case 'in_progress':
    case 'team':
      return 'border-accent/30 bg-accent/15 text-accent-foreground';
    case 'submitted':
      return 'border-primary/20 bg-primary/10 text-primary';
    default:
      return 'border-border bg-secondary text-secondary-foreground';
  }
}

interface HomeHistorySidebarProps {
  open: boolean;
  sessions: ChatSession[];
  activeProjectId: string | null;
  currentSessionId: string | null;
  sessionSearch: string;
  onSessionSearchChange: (value: string) => void;
  onCollapse: () => void;
  onExpand: () => void;
  onOpenSession: (id: string) => void;
  onDeleteSession: (id: string, title: string) => void;
  onActiveProjectChange: (projectId: string | null) => void;
  onProjectsChange: () => void;
  onSessionsChange: () => void;
  deriveSessionSubtitle: (session: ChatSession) => string;
  deriveSessionStatus: (session: ChatSession) => SessionStatus;
  sessionStatusLabel: (status: SessionStatus) => string;
  sessionStatusBadgeClass: (status: SessionStatus) => string;
  formatSessionTime: (ts: number) => string;
}

function HistorySection({
  title,
  badge,
  headerActions,
  children,
}: {
  title: ReactNode;
  badge?: number;
  headerActions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="glass-card-subtle rounded-2xl p-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[12px] font-semibold text-foreground">
          {title}
          {badge !== undefined && badge > 0 && (
            <span className="grid h-4 min-w-[16px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#4A9EE0] to-[#D8466A] px-1 text-[10px] font-bold text-white shadow-[0_2px_6px_-1px_rgba(59,127,191,0.5)]">
              {badge}
            </span>
          )}
        </div>
        {headerActions}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SessionSourceRow({
  session,
  isActive,
  deriveSessionSubtitle,
  deriveSessionStatus,
  sessionStatusLabel,
  formatSessionTime,
  projects,
  onOpen,
  onDelete,
  onMoveToProject,
}: {
  session: ChatSession;
  isActive: boolean;
  deriveSessionSubtitle: (session: ChatSession) => string;
  deriveSessionStatus: (session: ChatSession) => SessionStatus;
  sessionStatusLabel: (status: SessionStatus) => string;
  formatSessionTime: (ts: number) => string;
  projects: ChatProject[];
  onOpen: () => void;
  onDelete: () => void;
  onMoveToProject: (projectId: string | null) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const status = deriveSessionStatus(session);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  return (
    <div className="group relative">
      <button
        type="button"
        className={cn(
          'flex w-full items-start gap-2 rounded-xl border p-2 text-left transition',
          isActive
            ? 'border-border/60 bg-background/80 shadow-soft'
            : 'border-transparent hover:border-border/60 hover:bg-background/80 hover:shadow-soft'
        )}
        onClick={onOpen}
      >
        <span
          className={cn(
            'grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br shadow-[0_3px_8px_-2px_rgba(59,127,191,0.4)] ring-1 ring-white/40',
            sessionToneClasses(status)
          )}
        >
          <MessageSquare className="h-3.5 w-3.5 text-white" strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-medium text-foreground">{session.title}</div>
          <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
            {deriveSessionSubtitle(session)}
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span
              className={cn(
                'inline-flex rounded-full border px-1.5 py-0 text-[9.5px] font-medium leading-5',
                lovableStatusClass(status)
              )}
            >
              {sessionStatusLabel(status)}
            </span>
            <span className="shrink-0 text-[10px] text-muted-foreground/80">
              {formatSessionTime(session.updatedAt)}
            </span>
          </div>
        </div>
        <ChevronRight className="mt-1 h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-60" />
      </button>
      <div className="home-history-item-actions absolute right-1 top-1" ref={menuRef}>
        <button
          type="button"
          className="home-history-item-menu-btn inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
          title="更多操作"
          aria-label="更多操作"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
        {menuOpen && (
          <div className="home-history-menu" onClick={(e) => e.stopPropagation()}>
            <div className="home-history-menu-label">移至项目</div>
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`home-history-menu-item ${session.projectId === p.id ? 'is-current' : ''}`}
                onClick={() => {
                  onMoveToProject(p.id);
                  setMenuOpen(false);
                }}
              >
                {p.name}
                {session.projectId === p.id ? ' ✓' : ''}
              </button>
            ))}
            {projects.length === 0 && (
              <div className="home-history-menu-empty">暂无项目，请先新建</div>
            )}
            {session.projectId && (
              <button
                type="button"
                className="home-history-menu-item home-history-menu-item-muted"
                onClick={() => {
                  onMoveToProject(null);
                  setMenuOpen(false);
                }}
              >
                移出项目
              </button>
            )}
            <div className="home-history-menu-divider" />
            <button
              type="button"
              className="home-history-menu-item home-history-menu-item-danger"
              onClick={() => {
                onDelete();
                setMenuOpen(false);
              }}
            >
              删除对话
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function HomeHistorySidebar({
  open,
  sessions,
  activeProjectId,
  currentSessionId,
  sessionSearch,
  onSessionSearchChange,
  onCollapse,
  onExpand,
  onOpenSession,
  onDeleteSession,
  onActiveProjectChange,
  onProjectsChange,
  onSessionsChange,
  deriveSessionSubtitle,
  deriveSessionStatus,
  sessionStatusLabel,
  formatSessionTime,
}: HomeHistorySidebarProps) {
  const [projects, setProjects] = useState<ChatProject[]>(() => loadAllProjects());
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [creatingProject, setCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const refreshProjects = () => {
    setProjects(loadAllProjects());
    onProjectsChange();
  };

  const q = sessionSearch.trim().toLowerCase();
  const filterSession = (s: ChatSession) => {
    if (!q) return true;
    return (
      s.title.toLowerCase().includes(q) ||
      deriveSessionSubtitle(s).toLowerCase().includes(q)
    );
  };

  const filteredSessions = useMemo(
    () => sessions.filter(filterSession),
    [sessions, q, deriveSessionSubtitle]
  );

  const sessionsByProject = useMemo(() => {
    const map = new Map<string, ChatSession[]>();
    for (const p of projects) map.set(p.id, []);
    const ungrouped: ChatSession[] = [];
    for (const s of filteredSessions) {
      if (s.projectId && map.has(s.projectId)) {
        map.get(s.projectId)!.push(s);
      } else {
        ungrouped.push(s);
      }
    }
    return { map, ungrouped };
  }, [filteredSessions, projects]);

  const isSearching = q.length > 0;

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const isExp = prev[projectId] !== false;
      return { ...prev, [projectId]: isExp ? false : true };
    });
    onActiveProjectChange(projectId);
  };

  const isProjectExpanded = (projectId: string) => expandedProjects[projectId] !== false;

  const handleCreateProject = () => {
    const name = newProjectName.trim();
    if (!name) return;
    const project = createProject(name);
    setExpandedProjects((prev) => ({ ...prev, [project.id]: true }));
    onActiveProjectChange(project.id);
    setNewProjectName('');
    setCreatingProject(false);
    refreshProjects();
  };

  const handleRenameProject = (projectId: string) => {
    const updated = renameProject(projectId, renameValue);
    if (updated) {
      setRenamingProjectId(null);
      setRenameValue('');
      refreshProjects();
    }
  };

  const handleDeleteProject = (projectId: string) => {
    deleteProject(projectId);
    if (activeProjectId === projectId) onActiveProjectChange(null);
    refreshProjects();
    onSessionsChange();
  };

  const handleMoveSession = (sessionId: string, projectId: string | null) => {
    moveSessionToProject(sessionId, projectId);
    if (projectId) {
      touchProject(projectId);
      setExpandedProjects((prev) => ({ ...prev, [projectId]: true }));
      refreshProjects();
    }
    onSessionsChange();
  };

  const renderSession = (session: ChatSession) => (
    <SessionSourceRow
      key={session.id}
      session={session}
      isActive={session.id === currentSessionId}
      deriveSessionSubtitle={deriveSessionSubtitle}
      deriveSessionStatus={deriveSessionStatus}
      sessionStatusLabel={sessionStatusLabel}
      formatSessionTime={formatSessionTime}
      projects={projects}
      onOpen={() => onOpenSession(session.id)}
      onDelete={() => onDeleteSession(session.id, session.title)}
      onMoveToProject={(projectId) => handleMoveSession(session.id, projectId)}
    />
  );

  const sidebarShell = cn(
    'wpanel context context-sidebar home-history-sidebar shrink-0 self-stretch transition-[width] duration-500 ease-out',
    open ? 'open w-[20rem] animate-fade-up' : 'collapsed w-14'
  );

  if (!open) {
    return (
      <aside className={sidebarShell}>
        <button
          type="button"
          className="context-sidebar-expand-tab"
          onClick={onExpand}
          title="展开历史对话"
          aria-label="展开历史对话"
        >
          <MessageSquare className="h-[18px] w-[18px]" strokeWidth={2} />
          <span className="context-sidebar-expand-label">历史</span>
          {sessions.length > 0 && (
            <span className="home-history-expand-dot" aria-hidden />
          )}
        </button>
      </aside>
    );
  }

  return (
    <aside className={sidebarShell}>
      <div className="context-sidebar-head home-history-context-head">
        <div className="context-sidebar-head-row">
          <div className="context-sidebar-head-title">
            <span className="context-sidebar-head-icon" aria-hidden>
              <MessageSquare className="h-4 w-4" strokeWidth={2} />
            </span>
            <h3 className="section-title context-sidebar-title">历史对话</h3>
            {sessions.length > 0 && (
              <span className="grid h-4 min-w-[16px] place-items-center rounded-full bg-gradient-to-br from-[#4A9EE0] to-[#D8466A] px-1 text-[10px] font-bold text-white shadow-[0_2px_6px_-1px_rgba(59,127,191,0.5)]">
                {sessions.length}
              </span>
            )}
          </div>
          <button
            type="button"
            className="context-sidebar-collapse-btn"
            onClick={onCollapse}
            title="收起历史对话"
            aria-label="收起历史对话"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>

        <button
          type="button"
          className="btn-hero-3d group relative mt-3 mb-3 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 py-2.5 text-sm font-medium"
          onClick={() => {
            setCreatingProject(true);
            setNewProjectName('');
          }}
        >
          <FolderPlus className="h-4 w-4" />
          新建项目
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
        </button>

        {creatingProject && (
          <div className="mb-3 space-y-2 rounded-xl border border-border/50 bg-background/50 p-2.5">
            <input
              className="w-full rounded-lg border border-border/60 bg-white/80 px-3 py-2 text-xs outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              placeholder="项目名称"
              value={newProjectName}
              autoFocus
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateProject();
                if (e.key === 'Escape') setCreatingProject(false);
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-medium transition hover:border-primary/40"
                onClick={() => setCreatingProject(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn-hero-3d rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
              >
                创建
              </button>
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full rounded-xl glass-input py-2 pl-9 pr-3 text-xs outline-none transition focus:ring-4 focus:ring-primary/10"
            placeholder="搜索对话标题或内容"
            value={sessionSearch}
            onChange={(e) => onSessionSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="context-scroll">
        <div className="space-y-3">
          {isSearching ? (
            <HistorySection title="搜索结果" badge={filteredSessions.length}>
              {filteredSessions.length > 0 ? (
                filteredSessions.map(renderSession)
              ) : (
                <div className="px-2 py-3 text-center text-[11px] text-muted-foreground">未找到匹配的对话</div>
              )}
            </HistorySection>
          ) : (
            <>
              {projects.map((project) => {
                const projectSessions = sessionsByProject.map.get(project.id) || [];
                const expanded = isProjectExpanded(project.id);
                const isActive = activeProjectId === project.id;
                return (
                  <HistorySection
                    key={project.id}
                    badge={projectSessions.length}
                    title={
                      <button
                        type="button"
                        className={cn(
                          'flex min-w-0 flex-1 items-center gap-1.5 text-left',
                          isActive && 'text-primary'
                        )}
                        onClick={() => toggleProject(project.id)}
                        aria-expanded={expanded}
                      >
                        <svg
                          className={cn('h-3 w-3 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-90')}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                        {renamingProjectId === project.id ? (
                          <input
                            className="input min-w-0 flex-1 rounded-md px-1.5 py-0.5 text-[12px]"
                            value={renameValue}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameProject(project.id);
                              if (e.key === 'Escape') setRenamingProjectId(null);
                            }}
                            onBlur={() => handleRenameProject(project.id)}
                          />
                        ) : (
                          <span className="truncate">{project.name}</span>
                        )}
                      </button>
                    }
                    headerActions={
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                          title="重命名项目"
                          onClick={() => {
                            setRenamingProjectId(project.id);
                            setRenameValue(project.name);
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                          title="删除项目"
                          onClick={() => handleDeleteProject(project.id)}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                          </svg>
                        </button>
                      </div>
                    }
                  >
                    {expanded ? (
                      projectSessions.length > 0 ? (
                        projectSessions.map(renderSession)
                      ) : (
                        <div className="px-2 py-3 text-center text-[11px] text-muted-foreground">
                          将对话移入此项目，或在此项目下新建对话
                        </div>
                      )
                    ) : null}
                  </HistorySection>
                );
              })}

              {(projects.length > 0 || sessionsByProject.ungrouped.length > 0 || sessions.length === 0) && (
                <HistorySection
                  title={projects.length > 0 ? '未分组对话' : '全部对话'}
                  badge={sessionsByProject.ungrouped.length}
                >
                  {sessionsByProject.ungrouped.length > 0 ? (
                    sessionsByProject.ungrouped.map(renderSession)
                  ) : projects.length === 0 && sessions.length === 0 ? (
                    <div className="px-2 py-6 text-center text-[11px] text-muted-foreground">
                      <MessageSquare className="mx-auto mb-2 h-6 w-6 opacity-40" strokeWidth={1.5} />
                      <p>暂无历史对话</p>
                      <span className="mt-1 block text-[10px] opacity-80">在右侧输入灵感，开始第一次创作</span>
                    </div>
                  ) : (
                    <div className="px-2 py-3 text-center text-[11px] text-muted-foreground">暂无未分组对话</div>
                  )}
                </HistorySection>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
