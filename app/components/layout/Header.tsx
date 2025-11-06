'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/auth/AuthProvider';
import { LoginModal } from '@/components/auth/LoginModal';
import { HeaderThemeToggle } from '@/components/ui/HeaderThemeToggle';
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserIcon, 
  CogIcon, 
  ArrowRightOnRectangleIcon, 
  PlusIcon 
} from '@heroicons/react/24/outline';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAdmin, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo 和標題 */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm overflow-hidden">
                  <Image
                    src="/icons/project-showcase-platform-icon-48.png"
                    alt="專案展示平台"
                    width={36}
                    height={36}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">專案展示平台</h1>
                  <p className="text-xs text-muted-foreground">個人專案管理系統</p>
                </div>
              </Link>
            </div>

            {/* 桌面導航 */}
            <nav className="hidden md:flex items-center space-x-4">
              <Link 
                href="/" 
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary-600 transition-colors"
              >
                首頁
              </Link>
              
              {isAdmin && (
                <>
                  <Link 
                    href="/admin" 
                    className="px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 text-muted-foreground hover:text-primary-600"
                  >
                    <CogIcon className="h-4 w-4" />
                    <span>管理</span>
                  </Link>
                  <Link 
                    href="/admin/new" 
                    className="btn-primary flex items-center space-x-1"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>新增</span>
                  </Link>
                </>
              )}
              
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 text-muted-foreground hover:text-red-500"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  <span>登出</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 bg-muted text-foreground hover:bg-muted/80"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>管理員登入</span>
                </button>
              )}

              <HeaderThemeToggle />
            </nav>

            {/* 手機選單按鈕 */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              >
                <span className="sr-only">開啟選單</span>
                {isMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 手機選單 */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-card border-t border-border">
              <Link
                href="/"
                className="text-foreground hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                首頁
              </Link>
              
              {isAdmin && (
                <>
                  <Link
                    href="/admin"
                    className="text-foreground hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    管理後台
                  </Link>
                  <Link
                    href="/admin/new"
                    className="text-foreground hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    新增專案
                  </Link>
                </>
              )}
              
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-600 block w-full text-left px-3 py-2 rounded-md text-base font-medium"
                >
                  登出
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowLoginModal(true);
                    setIsMenuOpen(false);
                  }}
                  className="bg-muted text-foreground hover:bg-muted/80 block w-full text-left px-3 py-2 rounded-md text-base font-medium"
                >
                  管理員登入
                </button>
              )}

              <div className="border-t border-border pt-2 mt-2">
                <HeaderThemeToggle />
              </div>
            </div>
          </div>
        )}
      </header>
      
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </>
  );
}
