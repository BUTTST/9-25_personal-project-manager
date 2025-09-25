'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthSession } from '@/types';
import { getCurrentSession, createAdminSession, clearSession, isAdmin as checkIsAdmin, isAuthenticated as checkIsAuthenticated } from '@/lib/auth';

interface AuthContextType {
  session: AuthSession | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  refreshSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初始化時檢查是否有現有的工作階段
    const currentSession = getCurrentSession();
    setSession(currentSession);
    setLoading(false);
  }, []);

  const login = async (password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const newSession = createAdminSession();
        setSession(newSession);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    clearSession();
    setSession(null);
  };

  const refreshSession = () => {
    const currentSession = getCurrentSession();
    setSession(currentSession);
  };

  const value: AuthContextType = {
    session,
    isAdmin: checkIsAdmin(),
    isAuthenticated: checkIsAuthenticated(),
    login,
    logout,
    refreshSession,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
