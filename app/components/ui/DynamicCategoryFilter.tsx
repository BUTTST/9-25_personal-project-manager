'use client';

import { FilterConfig } from '@/types';
import { 
  SparklesIcon, 
  FlagIcon, 
  BeakerIcon, 
  CheckCircleIcon, 
  ArchiveBoxIcon,
  Squares2X2Icon,
  FireIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface DynamicCategoryFilterProps {
  configs: FilterConfig[];
  value: string;
  onChange: (category: string) => void;
}

// 篩選器圖標映射
const filterIcons: Record<string, any> = {
  'all': Squares2X2Icon,
  'important': SparklesIcon,
  'secondary': FlagIcon,
  'practice': BeakerIcon,
  'completed': CheckCircleIcon,
  'abandoned': ArchiveBoxIcon,
  'single-doc': DocumentTextIcon,
  'hot': FireIcon,
  'paused': PauseCircleIcon,
  'in-progress': PlayCircleIcon,
  'draft': DocumentTextIcon
};

// 篩選器顏色映射
const filterColors: Record<string, {
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  'all': { 
    color: 'text-gray-700 dark:text-gray-300', 
    bgColor: 'bg-gray-100 dark:bg-gray-700/50',
    borderColor: 'border-gray-300 dark:border-gray-600'
  },
  'important': { 
    color: 'text-red-700 dark:text-red-300', 
    bgColor: 'bg-red-100 dark:bg-red-500/20',
    borderColor: 'border-red-300 dark:border-red-500/50'
  },
  'secondary': { 
    color: 'text-blue-700 dark:text-blue-300', 
    bgColor: 'bg-blue-100 dark:bg-blue-500/20',
    borderColor: 'border-blue-300 dark:border-blue-500/50'
  },
  'practice': { 
    color: 'text-yellow-700 dark:text-yellow-300', 
    bgColor: 'bg-yellow-100 dark:bg-yellow-500/20',
    borderColor: 'border-yellow-300 dark:border-yellow-500/50'
  },
  'completed': { 
    color: 'text-green-700 dark:text-green-300', 
    bgColor: 'bg-green-100 dark:bg-green-500/20',
    borderColor: 'border-green-300 dark:border-green-500/50'
  },
  'abandoned': { 
    color: 'text-gray-600 dark:text-gray-400', 
    bgColor: 'bg-gray-100 dark:bg-gray-600/20',
    borderColor: 'border-gray-300 dark:border-gray-500/50'
  },
  'single-doc': {
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-500/20',
    borderColor: 'border-purple-300 dark:border-purple-500/50'
  },
  'hot': { 
    color: 'text-orange-700 dark:text-orange-300', 
    bgColor: 'bg-orange-100 dark:bg-orange-500/20',
    borderColor: 'border-orange-300 dark:border-orange-500/50'
  },
  'paused': { 
    color: 'text-indigo-700 dark:text-indigo-300', 
    bgColor: 'bg-indigo-100 dark:bg-indigo-500/20',
    borderColor: 'border-indigo-300 dark:border-indigo-500/50'
  },
  'in-progress': { 
    color: 'text-teal-700 dark:text-teal-300', 
    bgColor: 'bg-teal-100 dark:bg-teal-500/20',
    borderColor: 'border-teal-300 dark:border-teal-500/50'
  },
  'draft': { 
    color: 'text-slate-700 dark:text-slate-300', 
    bgColor: 'bg-slate-100 dark:bg-slate-500/20',
    borderColor: 'border-slate-300 dark:border-slate-500/50'
  }
};

export function DynamicCategoryFilter({ configs, value, onChange }: DynamicCategoryFilterProps) {
  // 只顯示啟用的篩選器，並按順序排序
  const enabledFilters = configs
    .filter(c => c.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-wrap gap-2">
      {enabledFilters.map((filterConfig) => {
        const Icon = filterIcons[filterConfig.id] || Squares2X2Icon;
        const colors = filterColors[filterConfig.id] || filterColors['all'];
        const isActive = value === filterConfig.id;
        
        return (
          <button
            key={filterConfig.id}
            onClick={() => onChange(filterConfig.id)}
            className={`
              group relative inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
              border transition-all duration-200
              ${isActive 
                ? `${colors.color} ${colors.bgColor} ${colors.borderColor} shadow-sm scale-105` 
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
            <span className="relative z-10">{filterConfig.label}</span>
            
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

