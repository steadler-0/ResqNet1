import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'resqnet_session';

const ACCOUNTS = {
  coordinator: {
    email: 'coord@resqnet.gov',
    password: 'coord123',
    role: 'coordinator',
    name: 'Priya Sharma',
    phone: '+91-11-2397-0101',
    photo: null,
  },
  responder: {
    email: 'responder@resqnet.gov',
    password: 'respond123',
    role: 'responder',
    responderId: 'r-ndrf-1',
    name: 'NDRF Unit 1',
    team: 'NDRF',
    phone: '+91-98-0000-0001',
    photo: null,
  },
};

const AuthContext = createContext(null);

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const session = raw ? JSON.parse(raw) : null;
    if (session?.role === 'coordinator' || session?.role === 'responder') return session;
    return null;
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

  const login = useCallback(async (email, password, roleHint = 'coordinator') => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password) throw new Error('required');

    const account =
      normalized === ACCOUNTS.responder.email
        ? ACCOUNTS.responder
        : normalized === ACCOUNTS.coordinator.email
          ? ACCOUNTS.coordinator
          : roleHint === 'responder'
            ? ACCOUNTS.responder
            : ACCOUNTS.coordinator;

    if (normalized !== account.email || password !== account.password) {
      throw new Error('invalid');
    }

    const session = {
      email: account.email,
      name: account.name,
      phone: account.phone,
      role: account.role,
      photo: account.photo,
      responderId: account.responderId,
      team: account.team,
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

  /** One-tap demo login for responder / coordinator testing */
  const demoLogin = useCallback(async (role = 'responder') => {
    const account = ACCOUNTS[role] || ACCOUNTS.responder;
    const session = {
      email: account.email,
      name: account.name,
      phone: account.phone,
      role: account.role,
      photo: account.photo,
      responderId: account.responderId,
      team: account.team,
      loginAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setUser(session);
    return session;
  }, []);

  const updateProfile = useCallback((patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isCoordinator = user?.role === 'coordinator';
  const isResponder = user?.role === 'responder';

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        login,
        demoLogin,
        logout,
        updateProfile,
        isAuthenticated: isCoordinator || isResponder,
        isCoordinator,
        isResponder,
      }}
    >
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
  if (role === 'coordinator') return 'alerts';
  if (role === 'responder') return 'responder';
  return 'sos';
}
