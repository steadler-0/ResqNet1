import { Search, X } from 'lucide-react';
import { useLang } from '../lib/LanguageContext';
import { t } from '../lib/i18n';

/**
 * Search field with magnifier and clear (X) control.
 * @param {object} props
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 * @param {() => void} props.onClear — clears query and related results
 * @param {string} props.placeholder
 * @param {boolean} [props.searching]
 * @param {string} [props.className] — extra classes on the input
 * @param {string} [props.inputClassName] — full input class override
 */
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
  const showClear = hasText;

  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  const inputClasses =
    inputClassName ||
    `w-full rounded-2xl border border-primary/8 bg-white py-3 pl-11 text-sm text-primary shadow-soft placeholder:text-muted focus:border-secondary/40 focus:outline-none focus:ring-2 focus:ring-secondary/15 ${hasText ? 'pr-20' : searching ? 'pr-12' : 'pr-4'} ${className}`;

  return (
    <div className="relative">
      <Search
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        strokeWidth={2}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClasses}
        aria-label={placeholder}
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {searching && (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-secondary border-t-transparent"
            aria-hidden
          />
        )}
        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-slate-muted hover:text-primary"
            aria-label={t(lang, 'search_clear')}
          >
            <X size={16} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}
