'use client';

import { Project, CategoryDisplayName } from '@/types';
import { 
  SparklesIcon, 
  FlagIcon, 
  BeakerIcon, 
  CheckCircleIcon, 
  ArchiveBoxIcon,
  Squares2X2Icon 
} from '@heroicons/react/24/outline';

interface CategoryFilterProps {
  value: string;
  onChange: (category: string) => void;
}

const categoryOptions: { 
  value: string; 
  label: string; 
  color: string; 
  bgColor: string;
  borderColor: string;
  icon: any;
}[] = [
  { 
    value: 'all', 
    label: '全部', 
    color: 'text-gray-700 dark:text-gray-300', 
    bgColor: 'bg-gray-100 dark:bg-gray-700/50',
    borderColor: 'border-gray-300 dark:border-gray-600',
    icon: Squares2X2Icon
  },
  { 
    value: 'important', 
    label: '重要', 
    color: 'text-red-700 dark:text-red-300', 
    bgColor: 'bg-red-100 dark:bg-red-500/20',
    borderColor: 'border-red-300 dark:border-red-500/50',
    icon: SparklesIcon
  },
  { 
    value: 'secondary', 
    label: '次要', 
    color: 'text-blue-700 dark:text-blue-300', 
    bgColor: 'bg-blue-100 dark:bg-blue-500/20',
    borderColor: 'border-blue-300 dark:border-blue-500/50',
    icon: FlagIcon
  },
  { 
    value: 'practice', 
    label: '實踐', 
    color: 'text-yellow-700 dark:text-yellow-300', 
    bgColor: 'bg-yellow-100 dark:bg-yellow-500/20',
    borderColor: 'border-yellow-300 dark:border-yellow-500/50',
    icon: BeakerIcon
  },
  { 
    value: 'completed', 
    label: '完成', 
    color: 'text-green-700 dark:text-green-300', 
    bgColor: 'bg-green-100 dark:bg-green-500/20',
    borderColor: 'border-green-300 dark:border-green-500/50',
    icon: CheckCircleIcon
  },
  { 
    value: 'abandoned', 
    label: '捨棄', 
    color: 'text-gray-600 dark:text-gray-400', 
    bgColor: 'bg-gray-100 dark:bg-gray-600/20',
    borderColor: 'border-gray-300 dark:border-gray-500/50',
    icon: ArchiveBoxIcon
  }
];

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categoryOptions.map((option) => {
        const Icon = option.icon;
        const isActive = value === option.value;
        
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              group relative inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
              border transition-all duration-200
              ${isActive 
                ? `${option.color} ${option.bgColor} ${option.borderColor} shadow-sm scale-105` 
                : 'text-muted-foreground bg-card border-border hover:border-primary-300 dark:hover:border-primary-600 hover:bg-muted/50'
              }
            `}
          >
            {/* 選中指示器 */}
            {isActive && (
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse-slow"></div>
            )}
            
            {/* 圖標 */}
            <Icon className={`h-4 w-4 relative z-10 ${isActive ? 'animate-bounce-slow' : 'group-hover:scale-110 transition-transform'}`} />
            
            {/* 文字 */}
            <span className="relative z-10">{option.label}</span>
            
            {/* 選中徽章 */}
            {isActive && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
            )}
          </button>
        );
      })}
    </div>
  );
}
