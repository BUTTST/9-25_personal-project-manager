'use client';

import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = '搜尋...', className = '' }: SearchBarProps) {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={`relative ${className}`}>
      {/* 搜尋圖標 */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground" />
      </div>
      
      {/* 輸入框 */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input pl-10 pr-10"
        placeholder={placeholder}
      />
      
      {/* 清除按鈕 */}
      {value && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
          type="button"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
