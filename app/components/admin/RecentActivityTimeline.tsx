'use client';

import { Project, categoryDisplayNames, statusDisplayNames } from '@/types';
import { ClockIcon } from '@heroicons/react/24/outline';

interface RecentActivityTimelineProps {
  projects: Project[];
}

export function RecentActivityTimeline({ projects }: RecentActivityTimelineProps) {
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '剛剛';
    if (minutes < 60) return `${minutes} 分鐘前`;
    if (hours < 24) return `${hours} 小時前`;
    if (days < 7) return `${days} 天前`;
    return new Date(timestamp).toLocaleDateString('zh-TW');
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        暫無活動記錄
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
      {projects.map((project, index) => (
        <div key={project.id} className="flex gap-3 items-start">
          {/* 時間線 */}
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-primary-500"></div>
            {index < projects.length - 1 && (
              <div className="w-0.5 h-full min-h-[40px] bg-border"></div>
            )}
          </div>

          {/* 內容 */}
          <div className="flex-1 pb-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground line-clamp-1">
                  {project.dateAndFileName}
                </p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {categoryDisplayNames[project.category]}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {statusDisplayNames[project.status]}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <ClockIcon className="h-3 w-3" />
                <span>{formatRelativeTime(project.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

