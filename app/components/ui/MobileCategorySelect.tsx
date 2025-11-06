'use client';

import { useState, useRef, useEffect } from 'react';
import { FilterConfig } from '@/types';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import {
  SparklesIcon,
  FlagIcon,
  BeakerIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  Squares2X2Icon,
  PauseCircleIcon,
  PlayCircleIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface MobileCategorySelectProps {
  configs: FilterConfig[];
  value: string;
  onChange: (category: string) => void;
  currentLabel: string;
}

// 篩選器圖標映射
const filterIcons: Record<string, any> = {
  all: Squares2X2Icon,
  important: SparklesIcon,
  secondary: FlagIcon,
  practice: BeakerIcon,
  'single-doc': DocumentTextIcon,
  completed: CheckCircleIcon,
  abandoned: ArchiveBoxIcon,
  'status-in-progress': PlayCircleIcon,
  'status-on-hold': PauseCircleIcon,
  'status-long-term': WrenchScrewdriverIcon,
  'status-completed': CheckCircleIcon,
  'status-discarded': XCircleIcon,
};

// 篩選器顏色映射
const filterColors: Record<string, string> = {
  all: 'text-gray-700 dark:text-gray-300',
  important: 'text-red-700 dark:text-red-300',
  secondary: 'text-blue-700 dark:text-blue-300',
  practice: 'text-yellow-700 dark:text-yellow-300',
  'single-doc': 'text-purple-700 dark:text-purple-300',
  completed: 'text-green-700 dark:text-green-300',
  abandoned: 'text-gray-700 dark:text-gray-300',
};

export function MobileCategorySelect({ configs, value, onChange, currentLabel }: MobileCategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 點擊外部關閉下拉選單
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const enabledFilters = configs
    .filter(c => c.enabled)
    .sort((a, b) => a.order - b.order);

  const currentIcon = filterIcons[value] || Squares2X2Icon;
  const CurrentIcon = currentIcon;
  const currentColor = filterColors[value] || filterColors['all'];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 下拉觸發按鈕 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium
          border border-border bg-card hover:bg-muted/50 transition-all duration-200
          ${isOpen ? 'ring-2 ring-primary-500/20' : ''}
        `}
      >
        <div className="flex items-center gap-2">
          <CurrentIcon className={`h-4 w-4 ${currentColor}`} />
          <span className="text-foreground">{currentLabel}</span>
        </div>
        <ChevronDownIcon className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 下拉選單 */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden animate-slide-down">
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {enabledFilters.map((filterConfig) => {
              const Icon = filterIcons[filterConfig.id] || Squares2X2Icon;
              const color = filterColors[filterConfig.id] || filterColors['all'];
              const isActive = value === filterConfig.id;
              
              return (
                <button
                  key={filterConfig.id}
                  onClick={() => {
                    onChange(filterConfig.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-sm font-medium
                    transition-colors duration-200
                    ${isActive 
                      ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300' 
                      : 'hover:bg-muted/50 text-foreground'
                    }
                  `}
                >
                  <Icon className={`h-4 w-4 ${isActive ? color : 'text-muted-foreground'}`} />
                  <span className="flex-1 text-left">{filterConfig.label}</span>
                  {isActive && (
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

