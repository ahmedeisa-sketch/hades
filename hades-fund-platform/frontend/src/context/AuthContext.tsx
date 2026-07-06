import { createContext, useContext, useState, ReactNode } from 'react';
import * as authApi from '../api/auth';

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem('hades_user');
    return raw ? JSON.parse(raw) : null;
  });

  async function signIn(email: string, password: string) {
    const result = await authApi.login(email, password);
    localStorage.setItem('hades_access_token', result.accessToken);
    localStorage.setItem('hades_refresh_token', result.refreshToken);
    localStorage.setItem('hades_user', JSON.stringify(result.user));
    setUser(result.user);
  }

  async function signOut() {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('hades_access_token');
      localStorage.removeItem('hades_refresh_token');
      localStorage.removeItem('hades_user');
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
