import { useState, useEffect } from 'react';
import { LogOut, MapPin, Phone, Mail, User, Shield, Home } from 'lucide-react';
import { useLang } from '../lib/LanguageContext';
import { t } from '../lib/i18n';
import { useAuth } from '../lib/AuthContext';
import { getAlerts } from '../lib/alertStore';
import LanguageSelector from '../components/LanguageSelector';
import useLiveGeolocation from '../hooks/useLiveGeolocation';

const SAVED_KEY = 'rescuenet_saved_shelters';

export default function ProfilePage({ setPage }) {
  const { lang, setLang } = useLang();
  const { user, logout, updateProfile } = useAuth();
  const { coords, sourceLabel } = useLiveGeolocation(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saved, setSaved] = useState([]);
  const [history, setHistory] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    try {
      setSaved(JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'));
    } catch {
      setSaved([]);
    }
    setHistory(getAlerts().filter((a) => a.reporterEmail === user?.email).slice(0, 10));
  }, [user]);

  const handleSave = () => {
    updateProfile({ name, phone });
    setMsg(t(lang, 'profile_updated'));
    setTimeout(() => setMsg(''), 3000);
  };

  const handleLogout = () => {
    logout();
    setPage('login');
  };

  if (!user) {
    return (
      <div className="rn-card text-center">
        <p className="text-muted">{t(lang, 'auth_login_title')}</p>
        <button type="button" onClick={() => setPage('login')} className="rn-btn-primary mt-4">
          {t(lang, 'nav_login')}
        </button>
      </div>
    );
  }

  return (
    <div className="rn-fade-in mx-auto max-w-2xl space-y-6 pb-24 md:pb-6">
      <header>
        <h1 className="text-2xl font-bold text-primary">{t(lang, 'profile_title')}</h1>
        <p className="text-sm text-muted">{t(lang, 'profile_subtitle')}</p>
      </header>

      <div className="rn-card">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary/15 ring-4 ring-white shadow-soft">
            {user.photo ? (
              <img src={user.photo} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <User size={40} className="text-secondary" />
            )}
          </div>
          <div className="flex-1 space-y-3 w-full">
            <div>
              <label className="text-xs font-semibold uppercase text-muted">{t(lang, 'profile_name')}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="rn-input mt-1" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold uppercase text-muted">
                  <Mail size={12} /> {t(lang, 'profile_email')}
                </label>
                <p className="mt-1 text-sm font-medium text-primary">{user.email}</p>
              </div>
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold uppercase text-muted">
                  <Phone size={12} /> {t(lang, 'profile_phone')}
                </label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="rn-input mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-secondary" />
              <span className="text-sm font-semibold text-primary capitalize">
                {t(lang, user.role === 'coordinator' ? 'role_coordinator' : 'role_citizen')}
              </span>
            </div>
          </div>
        </div>
        {msg && <p className="mt-3 text-sm text-secondary">{msg}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={handleSave} className="rn-btn-secondary text-sm">
            {t(lang, 'profile_save')}
          </button>
          <button type="button" onClick={handleLogout} className="rn-btn-outline inline-flex items-center gap-2 text-sm text-red-600 border-red-500/30">
            <LogOut size={16} />
            {t(lang, 'profile_logout')}
          </button>
        </div>
      </div>

      <div className="rn-card">
        <h3 className="flex items-center gap-2 text-sm font-bold text-primary">
          <MapPin size={16} className="text-secondary" />
          {t(lang, 'profile_location')}
        </h3>
        <p className="mt-2 font-mono text-sm text-muted">
          {coords.lat != null
            ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
            : t(lang, 'common_loading')}
        </p>
        <p className="text-xs text-muted mt-1">{sourceLabel}</p>
      </div>

      <div className="rn-card">
        <h3 className="text-sm font-bold text-primary">{t(lang, 'profile_language')}</h3>
        <div className="mt-3">
          <LanguageSelector />
        </div>
      </div>

      <div className="rn-card">
        <h3 className="text-sm font-bold text-primary">{t(lang, 'profile_history')}</h3>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{t(lang, 'profile_no_history')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {history.map((a) => (
              <li key={a.id} className="rounded-xl border border-primary/8 bg-slate-muted px-3 py-2 text-sm">
                <span className="font-semibold text-primary">{a.type}</span>
                <span className="text-muted"> · {a.time}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rn-card">
        <h3 className="flex items-center gap-2 text-sm font-bold text-primary">
          <Home size={16} />
          {t(lang, 'profile_shelters')}
        </h3>
        {saved.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{t(lang, 'profile_no_shelters')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {saved.map((s) => (
              <li key={s.id} className="text-sm text-primary">{s.name}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function saveShelterToProfile(facility) {
  try {
    const list = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
    if (!list.find((s) => s.id === facility.id)) {
      list.push({ id: facility.id, name: facility.name, address: facility.address });
      localStorage.setItem(SAVED_KEY, JSON.stringify(list.slice(0, 20)));
    }
  } catch {
    /* ignore */
  }
}
