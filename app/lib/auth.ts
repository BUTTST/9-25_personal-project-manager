import { AuthSession } from '@/types';

const SESSION_KEY = 'admin_session';
const PASSWORD_KEY = 'remembered_password';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24小時

// 獲取當前工作階段
export function getCurrentSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) return null;
    
    const session: AuthSession = JSON.parse(sessionData);
    
    // 檢查是否過期
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error reading session:', error);
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

// 建立管理員工作階段
export function createAdminSession(): AuthSession {
  const session: AuthSession = {
    isAuthenticated: true,
    isAdmin: true,
    loginTime: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION
  };
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  
  return session;
}

// 清除工作階段
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

// 記憶密碼
export function rememberPassword(password: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PASSWORD_KEY, password);
  }
}

// 獲取記憶的密碼
export function getRememberedPassword(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PASSWORD_KEY);
}

// 清除記憶的密碼
export function clearRememberedPassword(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(PASSWORD_KEY);
  }
}

// 檢查是否為管理員
export function isAdmin(): boolean {
  const session = getCurrentSession();
  return session?.isAdmin === true;
}

// 檢查是否已登入
export function isAuthenticated(): boolean {
  const session = getCurrentSession();
  return session?.isAuthenticated === true;
}

// 產生隨機UUID
export function generateId(): string {
  return 'id-' + Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
}
