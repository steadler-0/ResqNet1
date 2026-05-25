import { useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useLang } from '../lib/LanguageContext';
import { SUPPORTED_LANGUAGES } from '../lib/i18n';

export default function LanguageSelector({ compact = false }) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const current = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-full border border-primary/12 bg-white text-sm font-medium text-primary shadow-soft transition hover:border-secondary/30 ${
          compact ? 'px-2.5 py-1.5' : 'px-3 py-2'
        }`}
        aria-label="Change language"
      >
        <Globe size={14} className="text-secondary shrink-0" />
        {!compact && <span className="max-w-[100px] truncate">{current.native}</span>}
        <ChevronDown size={14} className="opacity-60" />
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 max-h-64 w-48 overflow-y-auto rounded-xl border border-primary/10 bg-white shadow-[0_8px_32px_rgba(44,57,71,0.15)]">
            {SUPPORTED_LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => { setLang(l.code); setOpen(false); }}
                className={`w-full px-3 py-2.5 text-left text-sm transition hover:bg-slate-muted ${
                  lang === l.code ? 'bg-secondary/10 font-semibold text-primary' : 'text-muted'
                }`}
              >
                <span className="block font-medium">{l.native}</span>
                <span className="text-[10px] text-muted">{l.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
