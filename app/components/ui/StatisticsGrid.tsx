'use client';

import { StatisticConfig, Project } from '@/types';
import { calculateStatistic, getStatisticColor, getStatisticIconType } from '@/lib/statistics';
import {
  ChartBarIcon,
  EyeIcon,
  FunnelIcon,
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon,
  CheckIcon,
  ArchiveBoxIcon,
  DocumentTextIcon,
  PauseCircleIcon,
  WrenchScrewdriverIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface StatisticsGridProps {
  configs: StatisticConfig[];
  allProjects: Project[];
  filteredProjects: Project[];
  isAdmin: boolean;
  isPreviewMode: boolean;
}

const iconMap = {
  'chart-bar': ChartBarIcon,
  eye: EyeIcon,
  funnel: FunnelIcon,
  sparkles: SparklesIcon,
  'check-circle': CheckCircleIcon,
  clock: ClockIcon,
  check: CheckIcon,
  'archive-box': ArchiveBoxIcon,
  'document-text': DocumentTextIcon,
  'pause-circle': PauseCircleIcon,
  'wrench-screwdriver': WrenchScrewdriverIcon,
  'x-circle': XCircleIcon,
};

function getIconComponent(type: string) {
  return iconMap[type as keyof typeof iconMap] || ChartBarIcon;
}

export function StatisticsGrid({
  configs,
  allProjects,
  filteredProjects,
  isAdmin,
  isPreviewMode,
}: StatisticsGridProps) {
  const enabledStats = configs
    .filter((c) => c.enabled)
    .sort((a, b) => a.order - b.order);

  if (enabledStats.length === 0) {
    return null;
  }

  return (
    <div
      className="grid grid-rows-2 gap-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-500/30 rounded-xl shadow-lg overflow-hidden h-full"
      style={{
        gridAutoFlow: 'column',
        gridAutoColumns: 'minmax(90px, 1fr)',
      }}
    >
      {enabledStats.map((config, index) => {
        const value = calculateStatistic(
          config.type,
          allProjects,
          filteredProjects,
          isAdmin,
          isPreviewMode,
        );
        const colors = getStatisticColor(config.type);

        const col = Math.floor(index / 2);
        const isLastCol = col === Math.ceil(enabledStats.length / 2) - 1;
        const needsRightBorder = !isLastCol;
        const isFirstRow = index % 2 === 0;
        const hasPair = index + 1 < enabledStats.length;
        const needsBottomBorder = isFirstRow && hasPair;

        const iconType = getStatisticIconType(config.type);
        const IconComponent = getIconComponent(iconType);

        return (
          <div
            key={config.id}
            className={`
              bg-gradient-to-br ${colors.gradient}
              rounded-sm p-4
              ${needsRightBorder ? 'border-r border-blue-500/20' : ''}
              ${needsBottomBorder ? 'border-b border-blue-500/20' : ''}
              hover:shadow-md transition-shadow
              flex flex-col items-center justify-center
            `}
          >
            <div className="flex items-center justify-between mb-2 w-full">
              <div className={`p-2 bg-opacity-10 rounded-lg ${colors.icon.replace('text-', 'bg-')}`}>
                <IconComponent className={`h-5 w-5 ${colors.icon}`} />
              </div>
              <span className={`text-3xl font-bold ${colors.icon}`}>
                {value}
              </span>
            </div>
            <p className={`text-sm font-medium ${colors.icon.replace('600', '900/70').replace('400', '100/70')}`}>
              {config.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

