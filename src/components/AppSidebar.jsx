import { useLang } from '../lib/LanguageContext';
import { t } from '../lib/i18n';
import { SIDEBAR_ITEMS } from '../lib/iconMaps';
import BrandLogo from './BrandLogo';

export default function AppSidebar({ page, setPage }) {
  const { lang } = useLang();

  return (
    <aside className="flex w-[220px] shrink-0 flex-col bg-sidebar text-white min-h-screen">
      <div className="border-b border-white/10 px-5 py-5">
        <button
          type="button"
          onClick={() => setPage('home')}
          className="flex w-full items-center gap-3 text-left transition hover:opacity-90"
        >
          <BrandLogo size="md" variant="dark" />
          <div>
            <p className="text-sm font-bold tracking-tight">{t(lang, 'nav_brand')}</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
              {t(lang, 'nav_ops_label')}
            </p>
          </div>
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {SIDEBAR_ITEMS.map((item, idx) => {
          const active = page === item.page;
          const Icon = item.Icon;
          return (
            <button
              key={`${item.key}-${idx}`}
              type="button"
              onClick={() => setPage(item.page)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-white/12 text-white'
                  : 'text-white/60 hover:bg-white/8 hover:text-white'
              }`}
            >
              <Icon size={18} strokeWidth={1.75} className="shrink-0 opacity-90" />
              {t(lang, item.key)}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
