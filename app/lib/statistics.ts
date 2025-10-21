import { Project, StatisticType } from '@/types';

/**
 * 計算統計數值
 * @param type 統計類型
 * @param allProjects 所有專案
 * @param filteredProjects 篩選後的專案
 * @param isAdmin 是否為管理員
 * @param isPreviewMode 是否為預覽模式
 * @returns 統計數值（數字或字串）
 */
export function calculateStatistic(
  type: StatisticType,
  allProjects: Project[],
  filteredProjects: Project[],
  isAdmin: boolean,
  isPreviewMode: boolean
): string | number {
  // 根據角色決定可見專案
  const visibleProjects = (isAdmin && !isPreviewMode) 
    ? allProjects 
    : allProjects.filter(p => 
        p.visibility.description && 
        p.category !== 'abandoned'
      );

  switch (type) {
    case 'totalProjects':
      return (isAdmin && !isPreviewMode) ? allProjects.length : visibleProjects.length;
    
    case 'publicProjects':
      return visibleProjects.length;
    
    case 'displayedCount':
      return filteredProjects.length;
    
    case 'importantCount':
      return visibleProjects.filter(p => p.category === 'important').length;
    
    case 'completedCount':
      return visibleProjects.filter(p => p.category === 'completed').length;
    
    case 'inProgressCount':
      return visibleProjects.filter(p => 
        ['important', 'secondary', 'practice'].includes(p.category)
      ).length;
    
    case 'readyStatus':
      return '✓';
    
    case 'abandonedCount':
      return (isAdmin && !isPreviewMode) 
        ? allProjects.filter(p => p.category === 'abandoned').length 
        : 0;
    case 'singleDocCount':
      return (isAdmin && !isPreviewMode)
        ? allProjects.filter(p => p.category === 'single-doc').length
        : visibleProjects.filter(p => p.category === 'single-doc').length;
    
    default:
      return 0;
  }
}

/**
 * 獲取統計項目的顏色配置
 * @param type 統計類型
 * @returns 包含漸變、邊框和圖標顏色的物件
 */
export function getStatisticColor(type: StatisticType): {
  gradient: string;
  border: string;
  icon: string;
} {
  const colorMap: Record<StatisticType, {
    gradient: string;
    border: string;
    icon: string;
  }> = {
    totalProjects: { 
      gradient: 'from-blue-50 to-blue-100/50 dark:from-blue-500/10 dark:to-blue-500/5', 
      border: 'border-blue-200/50 dark:border-blue-500/30', 
      icon: 'text-blue-600 dark:text-blue-400' 
    },
    publicProjects: { 
      gradient: 'from-cyan-50 to-cyan-100/50 dark:from-cyan-500/10 dark:to-cyan-500/5', 
      border: 'border-cyan-200/50 dark:border-cyan-500/30', 
      icon: 'text-cyan-600 dark:text-cyan-400' 
    },
    displayedCount: { 
      gradient: 'from-purple-50 to-purple-100/50 dark:from-purple-500/10 dark:to-purple-500/5', 
      border: 'border-purple-200/50 dark:border-purple-500/30', 
      icon: 'text-purple-600 dark:text-purple-400' 
    },
    importantCount: { 
      gradient: 'from-red-50 to-red-100/50 dark:from-red-500/10 dark:to-red-500/5', 
      border: 'border-red-200/50 dark:border-red-500/30', 
      icon: 'text-red-600 dark:text-red-400' 
    },
    completedCount: { 
      gradient: 'from-green-50 to-green-100/50 dark:from-green-500/10 dark:to-green-500/5', 
      border: 'border-green-200/50 dark:border-green-500/30', 
      icon: 'text-green-600 dark:text-green-400' 
    },
    inProgressCount: { 
      gradient: 'from-orange-50 to-orange-100/50 dark:from-orange-500/10 dark:to-orange-500/5', 
      border: 'border-orange-200/50 dark:border-orange-500/30', 
      icon: 'text-orange-600 dark:text-orange-400' 
    },
    readyStatus: { 
      gradient: 'from-green-50 to-green-100/50 dark:from-green-500/10 dark:to-green-500/5', 
      border: 'border-green-200/50 dark:border-green-500/30', 
      icon: 'text-green-600 dark:text-green-400' 
    },
    abandonedCount: { 
      gradient: 'from-gray-50 to-gray-100/50 dark:from-gray-500/10 dark:to-gray-500/5', 
      border: 'border-gray-200/50 dark:border-gray-500/30', 
      icon: 'text-gray-600 dark:text-gray-400' 
    },
    singleDocCount: {
      gradient: 'from-purple-50 to-purple-100/50 dark:from-purple-500/10 dark:to-purple-500/5',
      border: 'border-purple-200/50 dark:border-purple-500/30',
      icon: 'text-purple-600 dark:text-purple-400'
    }
  };

  return colorMap[type] || colorMap.totalProjects;
}

/**
 * 獲取統計項目的圖標名稱（用於 Heroicons）
 * @param type 統計類型
 * @returns 圖標類型字串
 */
export function getStatisticIconType(type: StatisticType): string {
  const iconMap: Record<StatisticType, string> = {
    totalProjects: 'chart-bar',
    publicProjects: 'eye',
    displayedCount: 'funnel',
    importantCount: 'sparkles',
    completedCount: 'check-circle',
    inProgressCount: 'clock',
    readyStatus: 'check',
    abandonedCount: 'archive-box',
    singleDocCount: 'document-text'
  };
  
  return iconMap[type] || 'chart-bar';
}

