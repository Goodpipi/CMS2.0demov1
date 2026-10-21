import { useEffect, useState } from 'react';
import { getLang, setLang, subscribeLang, type Lang } from '@/lib/i18n';

export function useLang(): Lang {
  const [lang, setLangState] = useState<Lang>(getLang);
  useEffect(() => subscribeLang(setLangState), []);
  return lang;
}

export function LanguageToggle() {
  const lang = useLang();
  return (
    <div className="lang-toggle glass-button" role="radiogroup" aria-label="Language" data-i18n-skip>
      {(['zh', 'en'] as const).map((value) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={lang === value}
          className={`lang-toggle-option ${lang === value ? 'is-active' : ''}`}
          onClick={() => setLang(value)}
        >
          {value === 'zh' ? '中文' : 'EN'}
        </button>
      ))}
    </div>
  );
}
