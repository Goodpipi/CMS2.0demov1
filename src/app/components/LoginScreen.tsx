import { BrandLogo } from '@/app/components/BrandLogo';
import { ACCOUNT_PROFILES } from '@/lib/userAccount';
import type { UserRole } from '@/types/review';

const LOGIN_ACCOUNTS: UserRole[] = ['ops', 'medical', 'marketing'];

interface LoginScreenProps {
  onLogin: (role: UserRole) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <section className="screen login-screen active">
      <div className="login-shell">
        <BrandLogo />
        <header className="login-head">
          <h2>登录 Bayidea</h2>
          <p>选择账号进入工作台，可随时在右上角查看 Token 用量或登出。</p>
        </header>
        <div className="login-account-grid">
          {LOGIN_ACCOUNTS.map((role) => {
            const account = ACCOUNT_PROFILES[role];
            return (
              <button
                key={role}
                type="button"
                className="login-account-card"
                onClick={() => onLogin(role)}
              >
                <span className="user-account-avatar is-lg" aria-hidden>
                  {account.name.slice(-1)}
                </span>
                <strong>{account.name}</strong>
                <span>
                  {account.title} · {account.dept}
                </span>
                <em>{account.email} · CWID {account.cwid}</em>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
