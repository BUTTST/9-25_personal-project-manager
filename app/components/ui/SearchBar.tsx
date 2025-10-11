'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = '搜尋...', className = '' }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={`relative ${className}`}>
      {/* 搜尋圖標 */}
      <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-200 ${
        isFocused || value ? 'text-primary-500' : 'text-muted-foreground'
      }`}>
        <MagnifyingGlassIcon className={`h-5 w-5 transition-transform duration-200 ${
          isFocused ? 'scale-110' : ''
        }`} />
      </div>
      
      {/* 搜尋動畫線條 */}
      {isFocused && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 animate-fade-in"></div>
      )}
      
      {/* 輸入框 */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full pl-12 pr-12 py-3 border rounded-lg transition-all duration-200 
          bg-card text-foreground placeholder:text-muted-foreground
          ${isFocused 
            ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-md' 
            : 'border-border hover:border-primary-300 dark:hover:border-primary-600'
          }
          focus:outline-none
        `}
        placeholder={placeholder}
      />
      
      {/* 清除按鈕 */}
      {value && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-red-500 transition-all duration-200 hover:scale-110"
          type="button"
          title="清除搜尋"
        >
          <div className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors">
            <XMarkIcon className="h-4 w-4" />
          </div>
        </button>
      )}
      
      {/* 搜尋結果計數（如果需要可以傳入） */}
      {value && (
        <div className="absolute inset-y-0 right-12 flex items-center pr-2">
          <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full animate-fade-in">
            搜尋中
          </div>
        </div>
      )}
    </div>
  );
}
