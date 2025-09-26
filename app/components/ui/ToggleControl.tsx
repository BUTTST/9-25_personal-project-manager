'use client';

interface ToggleControlProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  label?: string;
  description?: string;
}

export function ToggleControl({ 
  checked, 
  onChange, 
  size = 'md', 
  disabled = false, 
  label,
  description 
}: ToggleControlProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          toggle: 'h-4 w-7',
          handle: 'h-3 w-3',
          translate: 'translate-x-3'
        };
      case 'lg':
        return {
          toggle: 'h-7 w-12',
          handle: 'h-6 w-6',
          translate: 'translate-x-5'
        };
      default: // md
        return {
          toggle: 'h-6 w-11',
          handle: 'h-5 w-5',
          translate: 'translate-x-5'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const toggleComponent = (
    <button
      type="button"
      className={`
        ${sizeClasses.toggle}
        relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${checked ? 'bg-primary-600' : 'bg-muted'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={checked}
      aria-label={label || `開關 ${checked ? '開啟' : '關閉'}`}
    >
      <span
        className={`
          ${sizeClasses.handle}
          pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
          ${checked ? sizeClasses.translate : 'translate-x-0'}
        `}
      />
    </button>
  );

  if (label || description) {
    return (
      <div className={`flex items-start ${size === 'sm' ? 'space-x-2' : 'space-x-3'}`}>
        <div className="flex-shrink-0 mt-0.5">
          {toggleComponent}
        </div>
        <div className="flex-1 min-w-0">
          {label && (
            <div className={`font-medium text-gray-900 ${
              size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-base' : 'text-sm'
            }`}>
              {label}
            </div>
          )}
          {description && (
            <div className={`text-gray-500 ${
              size === 'sm' ? 'text-xs' : 'text-sm'
            }`}>
              {description}
            </div>
          )}
        </div>
      </div>
    );
  }

  return toggleComponent;
}
