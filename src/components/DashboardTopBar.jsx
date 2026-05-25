import { Search } from 'lucide-react';
import { useLang } from '../lib/LanguageContext';
import { t } from '../lib/i18n';
import LanguageSelector from './LanguageSelector';

export default function DashboardTopBar({
  searchQuery,
  setSearchQuery,
  searching,
  searchResults,
  searchOpen,
  setSearchOpen,
  onSelectResult,
}) {
  const { lang } = useLang();

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-primary/8 bg-slate-bg px-4 py-3 md:px-6 md:py-4 safe-top">
      <div className="relative min-w-0 flex-1 max-w-xl">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          strokeWidth={2}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
          onFocus={() => setSearchOpen(true)}
          placeholder={t(lang, 'nav_search_dashboard')}
          className="w-full rounded-2xl border border-primary/8 bg-white py-3 pl-11 pr-4 text-sm text-primary shadow-soft placeholder:text-muted focus:border-secondary/40 focus:outline-none focus:ring-2 focus:ring-secondary/15"
        />
        {searching && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted">
            {t(lang, 'search_searching')}
          </span>
        )}
        {searchOpen && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-primary/10 bg-white shadow-[0_8px_32px_rgba(30,41,59,0.12)]">
            {searchResults.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelectResult(f)}
                className="w-full border-b border-primary/5 px-4 py-3 text-left text-sm transition last:border-0 hover:bg-slate-muted"
              >
                <p className="font-semibold text-primary">{f.name}</p>
                <p className="text-xs text-muted">{f.address}</p>
              </button>
            ))}
          </div>
        )}
      </div>
      <LanguageSelector compact />
    </div>
  );
}
