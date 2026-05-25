import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'resqnet_session';

const COORDINATOR_ACCOUNT = {
  email: 'coord@resqnet.gov',
  password: 'coord123',
  role: 'coordinator',
  name: 'Priya Sharma',
  phone: '+91-11-2397-0101',
  photo: null,
};

const AuthContext = createContext(null);

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const session = raw ? JSON.parse(raw) : null;
    return session?.role === 'coordinator' ? session : null;
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

  const login = useCallback(async (email, password) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password) {
      throw new Error('required');
    }
    if (
      normalized !== COORDINATOR_ACCOUNT.email ||
      password !== COORDINATOR_ACCOUNT.password
    ) {
      throw new Error('invalid');
    }
    const session = {
      email: COORDINATOR_ACCOUNT.email,
      name: COORDINATOR_ACCOUNT.name,
      phone: COORDINATOR_ACCOUNT.phone,
      role: 'coordinator',
      photo: COORDINATOR_ACCOUNT.photo,
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

  const isCoordinator = user?.role === 'coordinator';

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        login,
        logout,
        updateProfile,
        isAuthenticated: isCoordinator,
        isCoordinator,
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
  return role === 'coordinator' ? 'alerts' : 'dashboard';
}
