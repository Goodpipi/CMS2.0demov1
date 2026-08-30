import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, LogOut } from 'lucide-react';
import type { UserRole } from '@/types/review';
import {
  ACCOUNT_PROFILES,
  formatTokenCount,
  getTokenUsage,
  type TokenUsage,
} from '@/lib/userAccount';

interface UserAccountMenuProps {
  role: UserRole;
  onLogout: () => void;
  onOpenChange?: (open: boolean) => void;
}

export function UserAccountMenu({ role, onLogout, onOpenChange }: UserAccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [usage, setUsage] = useState<TokenUsage>(() => getTokenUsage(role));
  const [coords, setCoords] = useState({ top: 0, right: 16 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const account = ACCOUNT_PROFILES[role];

  useEffect(() => {
    if (open) setUsage(getTokenUsage(role));
  }, [open, role]);

  useEffect(() => {
    document.body.classList.toggle('account-menu-open', open);
    onOpenChange?.(open);
    return () => {
      document.body.classList.remove('account-menu-open');
      onOpenChange?.(false);
    };
  }, [open, onOpenChange]);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setCoords({
        top: Math.round(rect.bottom + 8),
        right: Math.round(Math.max(12, window.innerWidth - rect.right)),
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="user-account-menu">
      <button
        ref={triggerRef}
        type="button"
        className={`user-account-trigger ${open ? 'open' : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="user-account-avatar" aria-hidden>
          {account.name.slice(-1)}
        </span>
        <span className="user-account-trigger-copy">
          <strong>{account.name}</strong>
          <span>{account.dept}</span>
        </span>
        <ChevronDown className="user-account-caret h-3.5 w-3.5" strokeWidth={2.2} />
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            className="user-account-panel"
            role="dialog"
            aria-label="个人信息"
            style={{
              position: 'fixed',
              top: coords.top,
              right: coords.right,
              zIndex: 80,
              width: 292,
              padding: 12,
              background: '#ffffff',
              border: '1px solid #d7e4ef',
              borderRadius: 18,
              boxShadow: '0 18px 44px -16px rgba(26, 62, 94, 0.32)',
            }}
          >
            <div className="user-account-profile">
              <span className="user-account-avatar is-lg" aria-hidden>
                {account.name.slice(-1)}
              </span>
              <div>
                <strong>{account.name}</strong>
                <p>
                  {account.title} · {account.dept}
                </p>
                <p>{account.email}</p>
                <p>CWID {account.cwid}</p>
              </div>
            </div>

            <div className="user-account-token">
              <div className="user-account-token-head">
                <span>Token 使用情况</span>
                <em>{usage.periodLabel}</em>
              </div>
              <div className="user-account-token-nums">
                <strong>{formatTokenCount(usage.used)}</strong>
                <span>/ {formatTokenCount(usage.quota)}</span>
              </div>
              <div
                className="user-account-token-bar"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(usage.percent * 100)}
                aria-label="本月 Token 已用量"
              >
                <i style={{ width: `${Math.min(100, Math.max(4, usage.percent * 100))}%` }} />
              </div>
              <div className="user-account-token-meta">
                剩余 {formatTokenCount(usage.remaining)} · 已用 {Math.round(usage.percent * 100)}%
              </div>
              <ul className="user-account-token-models">
                {usage.models.map((model) => (
                  <li key={model.name}>
                    <span>{model.name}</span>
                    <strong>{formatTokenCount(model.used)}</strong>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              className="user-account-logout"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={2.3} />
              登出
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
