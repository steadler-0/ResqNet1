import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'rescuenet_session';

const DEMO_USERS = {
  'citizen@rescuenet.in': {
    password: 'citizen123',
    role: 'citizen',
    name: 'Arjun Mehta',
    email: 'citizen@rescuenet.in',
    phone: '+91-98765-43210',
    photo: null,
  },
  'coord@rescuenet.gov': {
    password: 'coord123',
    role: 'coordinator',
    name: 'Priya Sharma',
    email: 'coord@rescuenet.gov',
    phone: '+91-11-2397-0101',
    photo: null,
  },
};

const AuthContext = createContext(null);

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(loadSession());
    setReady(true);
  }, []);

  const login = useCallback(async (email, password, role) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password) {
      throw new Error('required');
    }
    const account = DEMO_USERS[normalized];
    if (!account || account.password !== password) {
      throw new Error('invalid');
    }
    if (role && account.role !== role) {
      throw new Error('role');
    }
    const session = {
      email: normalized,
      name: account.name,
      phone: account.phone,
      role: account.role,
      photo: account.photo,
      loginAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setUser(session);
    return session;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const updateProfile = useCallback((patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, logout, updateProfile, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getDefaultPageForRole(role) {
  return role === 'coordinator' ? 'alerts' : 'dashboard';
}
