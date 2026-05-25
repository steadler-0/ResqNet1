import { useState, useEffect } from 'react';
import { Users, Radio } from 'lucide-react';
import { useLang } from '../lib/LanguageContext';
import { t } from '../lib/i18n';
import { useAuth, getDefaultPageForRole } from '../lib/AuthContext';
import BrandLogo from '../components/BrandLogo';
import LanguageSelector from '../components/LanguageSelector';

export default function LoginPage({ setPage, initialRole = 'coordinator' }) {
  const { lang } = useLang();
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(initialRole === 'responder' ? 'responder' : 'coordinator');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fillDemo = (which) => {
    if (which === 'responder') {
      setRole('responder');
      setEmail('responder@resqnet.gov');
      setPassword('respond123');
    } else {
      setRole('coordinator');
      setEmail('coord@resqnet.gov');
      setPassword('coord123');
    }
  };

  useEffect(() => {
    if (initialRole === 'responder') fillDemo('responder');
    else if (initialRole === 'coordinator') fillDemo('coordinator');
  }, [initialRole]);

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
            <h1 className="text-xl font-bold text-primary">{t(lang, 'auth_coord_login_title')}</h1>
            <p className="text-sm text-muted">{t(lang, 'auth_login_roles')}</p>
          </div>
        </div>
        <LanguageSelector compact />
      </div>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => fillDemo('coordinator')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
            role === 'coordinator'
              ? 'border-secondary bg-secondary/15 text-primary'
              : 'border-primary/10 text-muted'
          }`}
        >
          <Users size={16} /> {t(lang, 'auth_coordinator')}
        </button>
        <button
          type="button"
          onClick={() => fillDemo('responder')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
            role === 'responder'
              ? 'border-accent bg-accent/15 text-primary'
              : 'border-primary/10 text-muted'
          }`}
        >
          <Radio size={16} /> {t(lang, 'auth_responder')}
        </button>
      </div>

      <div className="rn-card">
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
              placeholder={role === 'responder' ? 'responder@resqnet.gov' : 'coord@resqnet.gov'}
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
          {role === 'responder' && (
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  const session = await demoLogin('responder');
                  setPage(getDefaultPageForRole(session.role));
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full rounded-xl border-2 border-accent bg-accent/15 py-3 text-sm font-bold text-primary transition hover:bg-accent/25"
            >
              {t(lang, 'auth_open_responder_demo')}
            </button>
          )}
        </form>

        <p className="mt-4 text-center text-[11px] text-muted leading-relaxed">
          {t(lang, 'auth_coord_creds')}
          <br />
          {t(lang, 'auth_responder_creds')}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setPage('home')}
        className="mt-4 w-full text-center text-sm text-secondary hover:text-primary"
      >
        ← {t(lang, 'nav_home')}
      </button>
    </div>
  );
}
