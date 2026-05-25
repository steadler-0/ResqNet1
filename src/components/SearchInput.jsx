import { Search, X } from 'lucide-react';
import { useLang } from '../lib/LanguageContext';
import { t } from '../lib/i18n';

export default function SearchInput({
  value,
  onChange,
  onClear,
  placeholder,
  searching = false,
  className = '',
  inputClassName,
}) {
  const { lang } = useLang();
  const hasText = Boolean(value?.trim());

  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  const inputClasses =
    inputClassName ||
    `search-input-field w-full rounded-2xl border border-primary/8 bg-white py-3 pl-11 text-sm text-primary shadow-soft placeholder:text-muted focus:border-secondary/40 focus:outline-none focus:ring-2 focus:ring-secondary/15 ${hasText ? 'pr-11' : searching ? 'pr-11' : 'pr-4'} ${className}`;

  return (
    <div className="relative">
      <Search
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        strokeWidth={2}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClasses}
        aria-label={placeholder}
        autoComplete="off"
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">
        {searching && !hasText ? (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-secondary border-t-transparent"
            aria-hidden
          />
        ) : hasText ? (
          <button
            type="button"
            onClick={handleClear}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-slate-muted hover:text-primary"
            aria-label={t(lang, 'search_clear')}
          >
            <X size={16} strokeWidth={2} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
