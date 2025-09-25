'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Project, CategoryDisplayName } from '@/types';
import { ToggleControl } from '@/components/ui/ToggleControl';
import { 
  GlobeAltIcon, 
  CodeBracketIcon, 
  FolderOpenIcon, 
  ChatBubbleLeftRightIcon,
  StarIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface ProjectCardProps {
  project: Project;
  isAdmin: boolean;
  showToggleControls: boolean;
  onUpdate?: (updatedProject: Project) => void;
}

const categoryDisplayNames: CategoryDisplayName = {
  important: '［重要］',
  secondary: '［次］',
  practice: '［子實踐］',
  completed: '［已完成］',
  abandoned: '［已捨棄］'
};

export function ProjectCard({ project, isAdmin, showToggleControls, onUpdate }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localProject, setLocalProject] = useState(project);

  const handleVisibilityToggle = async (field: keyof Project['visibility']) => {
    if (!isAdmin) return;
    
    const updatedProject = {
      ...localProject,
      visibility: {
        ...localProject.visibility,
        [field]: !localProject.visibility[field]
      },
      updatedAt: Date.now()
    };
    
    setLocalProject(updatedProject);
    onUpdate?.(updatedProject);
    
    // 同步到伺服器
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visibility: updatedProject.visibility }),
      });
    } catch (error) {
      console.error('Failed to update project visibility:', error);
      // 回滾更改
      setLocalProject(localProject);
      onUpdate?.(localProject);
    }
  };

  const handleFeaturedToggle = async () => {
    if (!isAdmin) return;
    
    const updatedProject = {
      ...localProject,
      featured: !localProject.featured,
      updatedAt: Date.now()
    };
    
    setLocalProject(updatedProject);
    onUpdate?.(updatedProject);
    
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ featured: updatedProject.featured }),
      });
    } catch (error) {
      console.error('Failed to update project featured status:', error);
      setLocalProject(localProject);
      onUpdate?.(localProject);
    }
  };

  const getCategoryBadgeClass = (category: Project['category']) => {
    switch (category) {
      case 'important': return 'badge-important';
      case 'secondary': return 'badge-secondary';
      case 'practice': return 'badge-practice';
      case 'completed': return 'badge-completed';
      case 'abandoned': return 'badge-abandoned';
      default: return 'badge';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="card-hover group relative">
      {/* 精選標記 */}
      {localProject.featured && (
        <div className="absolute top-2 right-2 z-10">
          <StarIconSolid className="h-5 w-5 text-yellow-500" />
        </div>
      )}
      
      {/* 管理員控制列 */}
      {isAdmin && (
        <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleFeaturedToggle}
              className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${
                localProject.featured ? 'text-yellow-500' : 'text-gray-400'
              }`}
              title={localProject.featured ? '取消精選' : '設為精選'}
            >
              <StarIcon className="h-4 w-4" />
            </button>
            <Link
              href={`/admin/edit/${localProject.id}`}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition-colors"
              title="編輯專案"
            >
              <CodeBracketIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* 專案內容 */}
      <div className="space-y-4">
        {/* 標題和類別 */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {localProject.visibility.dateAndFileName && (
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {localProject.dateAndFileName}
                </h3>
                {isAdmin && showToggleControls && (
                  <ToggleControl
                    checked={localProject.visibility.dateAndFileName}
                    onChange={() => handleVisibilityToggle('dateAndFileName')}
                    size="sm"
                  />
                )}
              </div>
            )}
            
            {localProject.visibility.category && (
              <div className="flex items-center justify-between mb-2">
                <span className={getCategoryBadgeClass(localProject.category)}>
                  {categoryDisplayNames[localProject.category]}
                </span>
                {isAdmin && showToggleControls && (
                  <ToggleControl
                    checked={localProject.visibility.category}
                    onChange={() => handleVisibilityToggle('category')}
                    size="sm"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* 說明 */}
        {localProject.visibility.description && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">說明</span>
              {isAdmin && showToggleControls && (
                <ToggleControl
                  checked={localProject.visibility.description}
                  onChange={() => handleVisibilityToggle('description')}
                  size="sm"
                />
              )}
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {localProject.description}
            </p>
          </div>
        )}

        {/* 連結區域 */}
        <div className="space-y-2">
          {localProject.visibility.github && localProject.github && (
            <div className="flex items-center justify-between">
              <Link
                href={localProject.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors text-sm"
              >
                <CodeBracketIcon className="h-4 w-4" />
                <span>查看GitHub</span>
              </Link>
              {isAdmin && showToggleControls && (
                <ToggleControl
                  checked={localProject.visibility.github}
                  onChange={() => handleVisibilityToggle('github')}
                  size="sm"
                />
              )}
            </div>
          )}
          
          {localProject.visibility.vercel && localProject.vercel && (
            <div className="flex items-center justify-between">
              <Link
                href={localProject.vercel}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors text-sm"
              >
                <GlobeAltIcon className="h-4 w-4" />
                <span>線上預覽</span>
              </Link>
              {isAdmin && showToggleControls && (
                <ToggleControl
                  checked={localProject.visibility.vercel}
                  onChange={() => handleVisibilityToggle('vercel')}
                  size="sm"
                />
              )}
            </div>
          )}
          
          {localProject.visibility.path && localProject.path && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-gray-600 text-sm">
                <FolderOpenIcon className="h-4 w-4" />
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {localProject.path}
                </span>
              </div>
              {isAdmin && showToggleControls && (
                <ToggleControl
                  checked={localProject.visibility.path}
                  onChange={() => handleVisibilityToggle('path')}
                  size="sm"
                />
              )}
            </div>
          )}
        </div>

        {/* 狀態備註 */}
        {localProject.visibility.statusNote && localProject.statusNote && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">狀態</span>
              {isAdmin && showToggleControls && (
                <ToggleControl
                  checked={localProject.visibility.statusNote}
                  onChange={() => handleVisibilityToggle('statusNote')}
                  size="sm"
                />
              )}
            </div>
            <p className="text-gray-600 text-sm bg-gray-50 p-2 rounded">
              {localProject.statusNote}
            </p>
          </div>
        )}

        {/* 一般註解 */}
        {localProject.visibility.publicNote && localProject.publicNote && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">註解</span>
              {isAdmin && showToggleControls && (
                <ToggleControl
                  checked={localProject.visibility.publicNote}
                  onChange={() => handleVisibilityToggle('publicNote')}
                  size="sm"
                />
              )}
            </div>
            <p className="text-gray-600 text-sm">
              {localProject.publicNote}
            </p>
          </div>
        )}

        {/* 開發者註解（僅管理員可見） */}
        {isAdmin && localProject.visibility.developerNote && localProject.developerNote && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-orange-600">開發者註解</span>
                <EyeSlashIcon className="h-4 w-4 text-orange-500" />
              </div>
              {showToggleControls && (
                <ToggleControl
                  checked={localProject.visibility.developerNote}
                  onChange={() => handleVisibilityToggle('developerNote')}
                  size="sm"
                />
              )}
            </div>
            <p className="text-orange-700 text-sm bg-orange-50 p-2 rounded border border-orange-200">
              {localProject.developerNote}
            </p>
          </div>
        )}

        {/* 更新時間 */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>更新於 {formatDate(localProject.updatedAt)}</span>
            {isAdmin && (
              <div className="flex items-center space-x-1">
                <EyeIcon className="h-3 w-3" />
                <span>
                  {Object.values(localProject.visibility).filter(Boolean).length}/
                  {Object.keys(localProject.visibility).length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
