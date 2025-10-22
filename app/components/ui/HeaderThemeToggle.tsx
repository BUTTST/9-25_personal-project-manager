'use client';

import { useMemo } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/components/ui/ThemeProvider';

export function HeaderThemeToggle() {
  const { theme, systemTheme, setTheme } = useTheme();

  const applied = useMemo(() => (theme === 'system' ? systemTheme : theme), [theme, systemTheme]);

  const toggleTheme = () => {
    setTheme(applied === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-muted transition-colors"
      title={applied === 'light' ? '切換到深色模式' : '切換到淺色模式'}
    >
      {applied === 'light' ? (
        <MoonIcon className="h-5 w-5 text-muted-foreground" />
      ) : (
        <SunIcon className="h-5 w-5 text-yellow-500" />
      )}
    </button>
  );
}