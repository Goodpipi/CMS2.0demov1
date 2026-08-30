import type { UserRole } from '@/types/review';

export interface AccountProfile {
  role: UserRole;
  name: string;
  dept: string;
  title: string;
  email: string;
  cwid: string;
  tokenQuota: number;
  tokenSeedUsed: number;
}

export const ACCOUNT_PROFILES: Record<UserRole, AccountProfile> = {
  ops: {
    role: 'ops',
    name: '小张',
    dept: '内容运营',
    title: '内容运营专员',
    email: 'zhang.ops@bayer.com',
    cwid: 'EDBGK',
    tokenQuota: 500000,
    tokenSeedUsed: 186420,
  },
  medical: {
    role: 'medical',
    name: '小王',
    dept: '医学部',
    title: '医学审阅专员',
    email: 'wang.med@bayer.com',
    cwid: 'VWKMD',
    tokenQuota: 200000,
    tokenSeedUsed: 42860,
  },
  marketing: {
    role: 'marketing',
    name: '小李',
    dept: '市场部',
    title: '市场传播经理',
    email: 'li.mkt@bayer.com',
    cwid: 'LMPKT',
    tokenQuota: 200000,
    tokenSeedUsed: 58320,
  },
};

export interface TokenUsage {
  used: number;
  quota: number;
  remaining: number;
  percent: number;
  periodLabel: string;
  models: { name: string; used: number }[];
}

const AUTH_KEY = 'acp_signed_in_v1';
const TOKEN_KEY = 'acp_token_usage_v1';

export function isSignedIn(): boolean {
  try {
    return localStorage.getItem(AUTH_KEY) !== '0';
  } catch {
    return true;
  }
}

export function setSignedIn(value: boolean): void {
  localStorage.setItem(AUTH_KEY, value ? '1' : '0');
}

function loadExtraUsed(): Partial<Record<UserRole, number>> {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<Record<UserRole, number>>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getTokenUsage(role: UserRole): TokenUsage {
  const profile = ACCOUNT_PROFILES[role];
  const extra = Math.max(0, Number(loadExtraUsed()[role] || 0));
  const used = Math.min(profile.tokenQuota, profile.tokenSeedUsed + extra);
  const remaining = Math.max(0, profile.tokenQuota - used);
  const gpt = Math.round(used * 0.47);
  return {
    used,
    quota: profile.tokenQuota,
    remaining,
    percent: profile.tokenQuota > 0 ? used / profile.tokenQuota : 0,
    periodLabel: '2026年8月',
    models: [
      { name: 'GPT-5.5', used: gpt },
      { name: 'DeepSeek-V3.1', used: used - gpt },
    ],
  };
}

export function addTokenUsage(role: UserRole, amount: number): TokenUsage {
  const extra = loadExtraUsed();
  extra[role] = Math.max(0, Number(extra[role] || 0)) + Math.max(0, Math.round(amount));
  localStorage.setItem(TOKEN_KEY, JSON.stringify(extra));
  return getTokenUsage(role);
}

export function formatTokenCount(value: number): string {
  return value.toLocaleString('zh-CN');
}
