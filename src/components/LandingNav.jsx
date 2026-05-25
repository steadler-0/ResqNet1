import { useLang } from '../lib/LanguageContext';
import { t } from '../lib/i18n';
import BrandLogo from './BrandLogo';
import LanguageSelector from './LanguageSelector';

const LANDING_LINKS = [
  { id: 'dashboard', key: 'nav_dashboard' },
  { id: 'map', key: 'nav_map' },
  { id: 'sos', key: 'nav_sos_send' },
  { id: 'map', key: 'nav_resources' },
];

export default function LandingNav({ setPage }) {
  const { lang } = useLang();

  return (
    <header className="sticky top-0 z-50 border-b border-primary/8 bg-slate-bg/95 backdrop-blur-md safe-top">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8 md:py-4">
        <button
          type="button"
          onClick={() => setPage('home')}
          className="flex items-center gap-2.5 transition hover:opacity-85"
        >
          <BrandLogo size="md" variant="light" />
          <span className="text-base font-bold text-primary md:text-lg">{t(lang, 'nav_brand')}</span>
        </button>

        <nav className="hidden items-center gap-6 lg:flex">
          {LANDING_LINKS.map((item, idx) => (
            <button
              key={`${item.key}-${idx}`}
              type="button"
              onClick={() => setPage(item.id)}
              className="text-sm font-medium text-muted transition hover:text-primary"
            >
              {t(lang, item.key)}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSelector compact />
          <button
            type="button"
            onClick={() => setPage('login')}
            className="hidden rounded-full border border-primary/15 bg-white px-4 py-1.5 text-sm font-medium text-primary sm:inline-flex"
          >
            {t(lang, 'nav_coord_login')}
          </button>
          <button
            type="button"
            onClick={() => setPage('dashboard')}
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white shadow-soft"
          >
            {t(lang, 'nav_dashboard')}
          </button>
        </div>
      </div>
    </header>
  );
}
