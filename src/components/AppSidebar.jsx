import { useLang } from '../lib/LanguageContext';
import { t } from '../lib/i18n';
import { useAuth } from '../lib/AuthContext';
import { CircleAlert, Map, Radio, User } from 'lucide-react';
import { SIDEBAR_ITEMS } from '../lib/iconMaps';
import BrandLogo from './BrandLogo';

const COORDINATOR_PAGES = new Set(['alerts', 'coordinator']);
const RESPONDER_PAGES = new Set(['responder']);

export default function AppSidebar({ page, setPage }) {
  const { lang } = useLang();
  const { isCoordinator, isResponder } = useAuth();

  let items = SIDEBAR_ITEMS;
  if (isResponder) {
    items = [
      { page: 'responder', key: 'nav_responder', Icon: Radio },
      { page: 'map', key: 'nav_map', Icon: Map },
      { page: 'profile', key: 'nav_profile', Icon: User },
    ];
  } else if (!isCoordinator) {
    items = [
      { page: 'sos', key: 'nav_sos_send', Icon: CircleAlert },
      { page: 'map', key: 'nav_map', Icon: Map },
      { page: 'profile', key: 'nav_profile', Icon: User },
    ].filter((i) => i.Icon);
  }

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
        {items.map((item, idx) => {
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

      {!isCoordinator && !isResponder && (
        <div className="border-t border-white/10 p-4 space-y-2">
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#responder';
              setPage('login');
            }}
            className="w-full rounded-xl border border-accent/40 bg-accent/15 px-3 py-2 text-xs font-semibold text-accent-light transition hover:bg-accent/25"
          >
            {t(lang, 'nav_responder')}
          </button>
          <button
            type="button"
            onClick={() => setPage('login')}
            className="w-full rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10"
          >
            {t(lang, 'nav_coord_login')}
          </button>
        </div>
      )}
    </aside>
  );
}
