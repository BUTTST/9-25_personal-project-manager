'use client';

import { useMemo } from 'react';
import { MoonIcon, SunIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/components/ui/ThemeProvider';

interface ThemeOption {
  value: 'light' | 'dark' | 'system';
  icon: React.ReactNode;
}

export function HeaderThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themeOptions: ThemeOption[] = useMemo(() => [
    { value: 'light', icon: <SunIcon className="h-5 w-5" /> },
    { value: 'dark', icon: <MoonIcon className="h-5 w-5" /> },
    { value: 'system', icon: <ComputerDesktopIcon className="h-5 w-5" /> },
  ], []);

  const currentThemeIndex = themeOptions.findIndex(option => option.value === theme);
  const currentIcon = themeOptions[currentThemeIndex]?.icon || <ComputerDesktopIcon className="h-5 w-5" />;

  const handleToggle = () => {
    const nextThemeIndex = (currentThemeIndex + 1) % themeOptions.length;
    setTheme(themeOptions[nextThemeIndex].value);
  };

  return (
    <button
      className="flex items-center justify-center h-10 w-10 rounded-md bg-muted text-foreground hover:bg-muted/80 transition-colors"
      onClick={handleToggle}
      aria-label="Toggle theme"
    >
      {currentIcon}
    </button>
  );
}

