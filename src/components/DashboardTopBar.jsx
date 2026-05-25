import { useLang } from '../lib/LanguageContext';
import { t } from '../lib/i18n';
import LanguageSelector from './LanguageSelector';
import SearchInput from './SearchInput';

export default function DashboardTopBar({
  searchQuery,
  setSearchQuery,
  searching,
  searchResults,
  searchOpen,
  setSearchOpen,
  onSelectResult,
  onClearSearch,
}) {
  const { lang } = useLang();

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-primary/8 bg-slate-bg px-4 py-3 md:px-6 md:py-4 safe-top">
      <div className="relative min-w-0 flex-1 max-w-xl">
        <SearchInput
          value={searchQuery}
          onChange={(v) => {
            setSearchQuery(v);
            if (v) setSearchOpen(true);
          }}
          onClear={onClearSearch}
          placeholder={t(lang, 'nav_search_dashboard')}
          searching={searching}
        />
        {searchOpen && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-primary/10 bg-white shadow-[0_8px_32px_rgba(30,41,59,0.12)]">
            {searchResults.map((f) => (
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
        {searchOpen && searchQuery.trim() && !searching && searchResults.length === 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-xl border border-primary/10 bg-white px-4 py-3 text-center text-sm text-muted shadow-soft">
            {t(lang, 'search_no_results')}
          </div>
        )}
      </div>
      <LanguageSelector compact />
    </div>
  );
}
