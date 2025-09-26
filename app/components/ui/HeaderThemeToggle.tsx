'use client';

import { useEffect, useMemo, useState } from 'react';
import { MoonIcon, SunIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/components/ui/ThemeProvider';

interface ThemeOption {
  value: 'light' | 'dark' | 'system';
  label: string;
  icon: React.ReactNode;
}

export function HeaderThemeToggle() {
  const { theme, systemTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const currentTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('[data-theme-toggle]')) {
        setOpen(false);
      }
    };

    if (open) {
      window.addEventListener('click', handleClick);
    }

    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, [open]);

  const themeOptions: ThemeOption[] = useMemo(() => [
    {
      value: 'light',
      label: '淺色模式',
      icon: <SunIcon className="h-4 w-4" />,
    },
    {
      value: 'dark',
      label: '深色模式',
      icon: <MoonIcon className="h-4 w-4" />,
    },
    {
      value: 'system',
      label: '跟隨系統',
      icon: <ComputerDesktopIcon className="h-4 w-4" />,
    },
  ], []);

  const renderIcon = () => {
    switch (currentTheme) {
      case 'dark':
        return <MoonIcon className="h-5 w-5" />;
      case 'light':
        return <SunIcon className="h-5 w-5" />;
      default:
        return <ComputerDesktopIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="relative" data-theme-toggle>
      <button
        className="flex items-center space-x-2 px-3 py-2 rounded-md bg-muted text-foreground hover:bg-muted/80 transition-colors"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {renderIcon()}
        <span className="text-sm font-medium hidden lg:block">
          {theme === 'system' ? '跟隨系統' : theme === 'dark' ? '深色模式' : '淺色模式'}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-card border border-border z-40 animate-fade-in">
          <ul className="py-2" role="listbox">
            {themeOptions.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  className={`w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-muted/60 transition-colors ${
                    theme === option.value ? 'text-primary-600 dark:text-primary-400' : 'text-foreground'
                  }`}
                  onClick={() => {
                    setTheme(option.value);
                    setOpen(false);
                  }}
                  role="option"
                  aria-selected={theme === option.value}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

