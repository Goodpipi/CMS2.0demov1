import { useMemo, useState } from 'react';
import { BookMarked, ChevronLeft, Search } from 'lucide-react';
import { loadTerminologyEntries, bilingualSides } from '@/lib/terminologyStore';

interface TerminologyLibraryPageProps {
  onNotify?: (message: string) => void;
  onBack: () => void;
}

export function TerminologyLibraryPage({ onBack }: TerminologyLibraryPageProps) {
  const [entries] = useState(() => loadTerminologyEntries());
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return entries;
    return entries.filter((item) => {
      const { en, zh } = bilingualSides(item);
      return (
        en.toLowerCase().includes(keyword) ||
        zh.toLowerCase().includes(keyword) ||
        item.source.toLowerCase().includes(keyword) ||
        item.target.toLowerCase().includes(keyword)
      );
    });
  }, [entries, query]);

  return (
    <div className="page relative z-10 px-6 pb-8 lg:px-10">
      <button
        type="button"
        className="mb-4 inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition hover:text-primary"
        onClick={onBack}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        返回首页
      </button>
      <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="sparkle-surface grid h-11 w-11 place-items-center rounded-2xl bg-hero-gradient text-white shadow-glow">
              <BookMarked className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-[28px] font-semibold tracking-tight text-foreground">
                专业术语库
              </h2>
              <p className="mt-0.5 max-w-xl text-[12.5px] text-muted-foreground">
                预制中英文对照译法，供 PPT 翻译等场景注入 AI，避免模型自由发挥导致术语不准。
              </p>
            </div>
          </div>
          <div className="text-[12px] text-muted-foreground">
            共 <strong className="text-foreground">{entries.length}</strong> 条术语
            {visible.length !== entries.length ? ` · 当前显示 ${visible.length} 条` : ''}
          </div>
        </div>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索英文或中文术语"
            className="glass-input w-full rounded-xl border border-border/70 py-2.5 pl-10 pr-3 text-[13px] outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          />
        </div>
      </div>

      <div className="terminology-table-wrap glass-card overflow-hidden rounded-2xl border border-border/70">
        <table className="terminology-table">
          <thead>
            <tr>
              <th>英文</th>
              <th>中文</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={2} className="terminology-empty">
                  {entries.length === 0 ? '暂无术语。' : '没有匹配的术语，试试调整搜索关键词。'}
                </td>
              </tr>
            ) : (
              visible.map((entry) => {
                const { en, zh } = bilingualSides(entry);
                return (
                  <tr key={entry.id}>
                    <td>
                      <strong className="terminology-en">{en}</strong>
                    </td>
                    <td className="terminology-zh">{zh}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
