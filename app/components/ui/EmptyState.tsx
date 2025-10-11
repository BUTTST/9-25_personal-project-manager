'use client';

import { FolderIcon, MagnifyingGlassIcon, InboxIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: 'folder' | 'search' | 'inbox' | 'custom';
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: React.ReactNode;
}

export function EmptyState({ 
  title, 
  description, 
  icon = 'folder', 
  action, 
  children 
}: EmptyStateProps) {
  const getIcon = () => {
    const iconClass = "mx-auto h-20 w-20";
    switch (icon) {
      case 'search':
        return (
          <div className="relative">
            <MagnifyingGlassIcon className={`${iconClass} text-blue-400 dark:text-blue-500`} />
            <div className="absolute inset-0 mx-auto h-20 w-20 bg-blue-400/20 rounded-full blur-2xl animate-pulse-slow"></div>
          </div>
        );
      case 'folder':
        return (
          <div className="relative">
            <FolderIcon className={`${iconClass} text-amber-400 dark:text-amber-500`} />
            <div className="absolute inset-0 mx-auto h-20 w-20 bg-amber-400/20 rounded-full blur-2xl animate-pulse-slow"></div>
          </div>
        );
      case 'inbox':
        return (
          <div className="relative">
            <InboxIcon className={`${iconClass} text-gray-400 dark:text-gray-500`} />
            <div className="absolute inset-0 mx-auto h-20 w-20 bg-gray-400/20 rounded-full blur-2xl animate-pulse-slow"></div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="text-center py-16 px-4">
      {/* 背景漸變 */}
      <div className="relative max-w-md mx-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 dark:from-primary-500/5 dark:via-purple-500/5 dark:to-pink-500/5 rounded-3xl blur-3xl opacity-60"></div>
        
        <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-xl">
          {/* 圖標 */}
          <div className="mb-6 animate-fade-in">
            {getIcon()}
          </div>
          
          {/* 標題 */}
          <h3 className="text-xl font-bold text-foreground mb-3 animate-slide-up">
            {title}
          </h3>
          
          {/* 描述 */}
          {description && (
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '100ms' }}>
              {description}
            </p>
          )}
          
          {/* 動作按鈕 */}
          {action && (
            <button
              onClick={action.onClick}
              className="btn-primary shadow-lg hover:shadow-xl transition-shadow animate-slide-up"
              style={{ animationDelay: '200ms' }}
            >
              {action.label}
            </button>
          )}
          
          {/* 自定義內容 */}
          {children && (
            <div className="mt-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
              {children}
            </div>
          )}
          
          {/* 裝飾元素 */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary-400/10 rounded-full blur-2xl animate-pulse-slow"></div>
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>
    </div>
  );
}
