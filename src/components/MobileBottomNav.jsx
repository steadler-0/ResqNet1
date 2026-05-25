import { Bell, CircleAlert, LayoutGrid, Map, User, Users } from 'lucide-react';
import { useLang } from '../lib/LanguageContext';
import { t } from '../lib/i18n';
import { useAuth } from '../lib/AuthContext';

const CITIZEN_NAV = [
  { page: 'dashboard', key: 'nav_dashboard', Icon: LayoutGrid },
  { page: 'map', key: 'nav_map', Icon: Map },
  { page: 'sos', key: 'nav_sos_send', Icon: CircleAlert, accent: true },
  { page: 'profile', key: 'nav_profile', Icon: User },
];

const COORD_NAV = [
  { page: 'alerts', key: 'nav_alerts', Icon: Bell },
  { page: 'dashboard', key: 'nav_dashboard', Icon: LayoutGrid },
  { page: 'map', key: 'nav_map', Icon: Map },
  { page: 'coordinator', key: 'nav_coordinator', Icon: Users },
  { page: 'profile', key: 'nav_profile', Icon: User },
];

export default function MobileBottomNav({ page, setPage }) {
  const { lang } = useLang();
  const { isCoordinator } = useAuth();
  const items = isCoordinator ? COORD_NAV : CITIZEN_NAV;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-primary/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden">
      <div className="flex items-stretch justify-around px-1 py-1">
        {items.map(({ page: id, key, Icon, accent }) => {
          const active = page === id;
          return (
            <button
              key={`${id}-${key}`}
              type="button"
              onClick={() => setPage(id)}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 transition ${
                accent
                  ? active
                    ? 'text-white'
                    : 'text-primary'
                  : active
                    ? 'text-secondary'
                    : 'text-muted'
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                  accent
                    ? active
                      ? 'bg-red-500 text-white'
                      : 'bg-accent text-primary'
                    : active
                      ? 'bg-secondary/15'
                      : ''
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.25 : 1.75} />
              </span>
              <span className="truncate text-[9px] font-semibold uppercase tracking-wide">
                {t(lang, key).split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
