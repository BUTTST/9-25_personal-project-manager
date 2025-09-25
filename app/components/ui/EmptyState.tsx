'use client';

import { FolderIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: 'folder' | 'search' | 'custom';
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
    switch (icon) {
      case 'search':
        return <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />;
      case 'folder':
        return <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="text-center py-12">
      <div className="mb-4">
        {getIcon()}
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary"
        >
          {action.label}
        </button>
      )}
      
      {children}
    </div>
  );
}
