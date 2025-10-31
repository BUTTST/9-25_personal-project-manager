'use client';

import { Project } from '@/types';
import { QuickProjectCard } from './QuickProjectCard';
import { RecentActivityTimeline } from './RecentActivityTimeline';

interface DashboardViewProps {
  projects: Project[];
  onUpdate: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

export function DashboardView({ projects, onUpdate, onDelete }: DashboardViewProps) {
  // 按更新時間排序
  const recentProjects = [...projects]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 12);

  // 精選項目
  const featuredProjects = projects.filter(p => p.featured);

  // 隱藏項目
  const hiddenProjects = projects.filter(p => p.hidden);

  return (
    <div className="p-6 space-y-6">
      {/* 快速統計 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-500/10 dark:to-blue-500/5 rounded-lg p-4 border border-blue-200 dark:border-blue-500/30">
          <div className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">最近更新</div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{recentProjects.length}</div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-500/10 dark:to-yellow-500/5 rounded-lg p-4 border border-yellow-200 dark:border-yellow-500/30">
          <div className="text-sm text-yellow-700 dark:text-yellow-300 font-medium mb-1">精選項目</div>
          <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{featuredProjects.length}</div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-500/10 dark:to-gray-500/5 rounded-lg p-4 border border-gray-200 dark:border-gray-500/30">
          <div className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">隱藏項目</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{hiddenProjects.length}</div>
        </div>
      </div>

      {/* 最近活動 */}
      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4">最近活動</h3>
        <RecentActivityTimeline projects={recentProjects} />
      </div>

      {/* 快速操作卡片 */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">最近更新的專案</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {recentProjects.map((project) => (
            <QuickProjectCard
              key={project.id}
              project={project}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

