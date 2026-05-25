import { ArrowRight } from 'lucide-react';
import { useLang } from '../lib/LanguageContext';
import { t } from '../lib/i18n';

export default function HomePage({ setPage }) {
  const { lang } = useLang();

  return (
    <section className="page-transition mx-auto max-w-6xl flex-1 px-4 py-12 md:px-8 md:py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        {t(lang, 'landing_eyebrow')}
      </p>
      <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight text-primary sm:text-4xl md:text-5xl">
        {t(lang, 'landing_title')}
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
        {t(lang, 'landing_subtitle')}
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => setPage('sos')}
          className="rn-btn-accent inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base"
        >
          {t(lang, 'landing_sos')}
        </button>
        <button
          type="button"
          onClick={() => setPage('map')}
          className="rn-btn-outline inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base"
        >
          {t(lang, 'landing_map')}
          <ArrowRight size={18} strokeWidth={2} />
        </button>
      </div>
    </section>
  );
}
