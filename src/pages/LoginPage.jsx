import { useState } from 'react';
import { User, Users } from 'lucide-react';
import { useLang } from '../lib/LanguageContext';
import { t } from '../lib/i18n';
import { useAuth, getDefaultPageForRole } from '../lib/AuthContext';
import BrandLogo from '../components/BrandLogo';
import LanguageSelector from '../components/LanguageSelector';

export default function LoginPage({ setPage }) {
  const { lang } = useLang();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('citizen');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError(t(lang, 'auth_error_required'));
      return;
    }
    setLoading(true);
    try {
      const session = await login(email, password, role);
      setPage(getDefaultPageForRole(session.role));
    } catch (err) {
      if (err.message === 'invalid') setError(t(lang, 'auth_error_invalid'));
      else if (err.message === 'role') setError(t(lang, 'auth_error_role'));
      else if (err.message === 'required') setError(t(lang, 'auth_error_required'));
      else setError(t(lang, 'auth_error_invalid'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rn-fade-in mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo variant="light" />
          <div>
            <h1 className="text-xl font-bold text-primary">{t(lang, 'auth_login_title')}</h1>
            <p className="text-sm text-muted">{t(lang, 'auth_login_subtitle')}</p>
          </div>
        </div>
        <LanguageSelector compact />
      </div>

      <div className="rn-card">
        <div className="mb-6 grid grid-cols-2 gap-2">
          {[
            { id: 'citizen', key: 'auth_citizen', Icon: User },
            { id: 'coordinator', key: 'auth_coordinator', Icon: Users },
          ].map(({ id, key, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setRole(id)}
              className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition ${
                role === id
                  ? 'border-secondary bg-secondary/15 text-primary'
                  : 'border-primary/10 bg-slate-muted text-muted'
              }`}
            >
              <Icon size={18} />
              {t(lang, key)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              {t(lang, 'auth_email')}
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rn-input"
              placeholder="citizen@rescuenet.in"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              {t(lang, 'auth_password')}
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rn-input"
            />
          </div>
          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
          <button type="submit" disabled={loading} className="rn-btn-primary w-full py-3">
            {loading ? t(lang, 'auth_signing_in') : t(lang, 'auth_sign_in')}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-muted leading-relaxed">{t(lang, 'auth_demo_hint')}</p>
      </div>

      <button
        type="button"
        onClick={() => setPage('home')}
        className="mt-4 text-center text-sm text-secondary hover:text-primary"
      >
        ← {t(lang, 'nav_home')}
      </button>
    </div>
  );
}
