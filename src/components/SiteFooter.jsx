import { Mail, Phone, Shield } from 'lucide-react';
import { useLang } from '../lib/LanguageContext';
import { t } from '../lib/i18n';
import BrandLogo from './BrandLogo';

export default function SiteFooter({ setPage }) {
  const { lang } = useLang();

  const links = [
    { key: 'nav_sos_send', page: 'sos' },
    { key: 'nav_map', page: 'map' },
    { key: 'nav_alerts', page: 'alerts' },
    { key: 'nav_sos_send', page: 'sos' },
    { key: 'footer_about', page: 'home' },
  ];

  return (
    <footer className="mt-auto border-t border-primary/10 bg-primary text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-2 lg:grid-cols-4 md:px-8">
        <div>
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" variant="dark" />
            <span className="font-bold">{t(lang, 'nav_brand')}</span>
          </div>
          <p className="mt-3 text-sm text-white/70 leading-relaxed">{t(lang, 'footer_about_text')}</p>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-accent">{t(lang, 'footer_contact')}</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <Phone size={14} className="text-accent shrink-0" />
              <span>{t(lang, 'footer_helpline')}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={14} className="shrink-0" />
              {t(lang, 'footer_contact_number')}
            </li>
            <li className="flex items-center gap-2">
              <Mail size={14} className="shrink-0" />
              {t(lang, 'footer_email_id')}
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-accent">{t(lang, 'footer_quick_links')}</h4>
          <ul className="mt-3 space-y-2">
            {links.map((l) => (
              <li key={l.key}>
                <button
                  type="button"
                  onClick={() => setPage?.(l.page)}
                  className="text-sm text-white/80 transition hover:text-accent"
                >
                  {t(lang, l.key)}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-accent">{t(lang, 'footer_social')}</h4>
          <div className="mt-3 flex gap-3">
            {['Twitter', 'Facebook', 'YouTube'].map((s) => (
              <a
                key={s}
                href="#"
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/80 transition hover:border-accent hover:text-accent"
                onClick={(e) => e.preventDefault()}
              >
                {s}
              </a>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-white/50">
            <Shield size={12} />
            {t(lang, 'footer_rights')}
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {t(lang, 'nav_brand')} · {t(lang, 'nav_tagline')}
      </div>
    </footer>
  );
}
