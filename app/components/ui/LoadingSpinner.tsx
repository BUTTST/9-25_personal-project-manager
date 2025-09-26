'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-6 w-6';
      case 'lg':
        return 'h-16 w-16';
      default:
        return 'h-10 w-10';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div
        className={`${getSizeClasses()} animate-spin rounded-full border-2 border-muted border-t-primary-600`}
      >
        <span className="sr-only">載入中...</span>
      </div>
      {text && (
        <p className={`${getTextSize()} text-muted-foreground font-medium`}>
          {text}
        </p>
      )}
    </div>
  );
}
