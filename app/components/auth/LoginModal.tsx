'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { getRememberedPassword, rememberPassword, clearRememberedPassword } from '@/lib/auth';
import { useToast } from '@/components/ui/ToastProvider';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface LoginModalProps {
  onClose: () => void;
}

export function LoginModal({ onClose }: LoginModalProps) {
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    // 載入記憶的密碼
    const remembered = getRememberedPassword();
    if (remembered) {
      setPassword(remembered);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      showToast('error', '請輸入密碼');
      return;
    }

    setLoading(true);
    try {
      const success = await login(password);
      if (success) {
        if (rememberMe) {
          rememberPassword(password);
        } else {
          clearRememberedPassword();
        }
        showToast('success', '登入成功');
        onClose();
      } else {
        showToast('error', '密碼錯誤');
        setPassword('');
      }
    } catch (error) {
      showToast('error', '登入失敗', '請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-slide-up">
        {/* 標題列 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">管理員登入</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* 表單內容 */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              管理員密碼
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-10"
                placeholder="請輸入密碼"
                autoFocus
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                disabled={loading}
              />
              <span className="ml-2 text-sm text-gray-600">記住密碼</span>
            </label>
            <p className="mt-1 text-xs text-gray-500">
              密碼將储存在本機瀏覽器中，下次無需重新輸入
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 relative"
              disabled={loading || !password.trim()}
            >
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </div>
              )}
              <span className={loading ? 'invisible' : ''}>登入</span>
            </button>
          </div>
        </form>

        {/* 提示訊息 */}
        <div className="px-6 pb-6 text-xs text-gray-500">
          <p>提示：登入後您將可以管理專案和查看所有隐藏內容</p>
        </div>
      </div>
    </div>
  );
}
