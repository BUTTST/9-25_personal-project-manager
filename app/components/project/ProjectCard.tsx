'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Project, CategoryDisplayName, ProjectVisibility } from '@/types';
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

const GitHubIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path
      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
    ></path>
  </svg>
);

const VercelIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 116 100"
    fill="currentColor"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path
      d="M57.5 0L115 100H0L57.5 0z"
    ></path>
  </svg>
);

interface ProjectCardProps {
  project: Project;
  isAdmin: boolean;
  isEditMode?: boolean; // Add isEditMode prop
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

export function ProjectCard({ project, isAdmin, isEditMode, showToggleControls, onUpdate }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localProject, setLocalProject] = useState(project);

  const handleVisibilityToggle = async (field: keyof ProjectVisibility) => {
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

  const handleFieldChange = (field: keyof Project, value: any) => {
    if (!isAdmin) return;
    const updatedProject = {
      ...localProject,
      [field]: value,
      updatedAt: Date.now()
    };
    setLocalProject(updatedProject);
    onUpdate?.(updatedProject);

    try {
      fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });
    } catch (error) {
      console.error(`Failed to update project ${field}:`, error);
      setLocalProject(localProject);
      onUpdate?.(localProject);
    }
  };

  const handleVisibilityChange = (field: keyof ProjectVisibility, value: boolean) => {
    if (!isAdmin) return;
    const updatedVisibility = { ...localProject.visibility, [field]: value };
    handleFieldChange('visibility', updatedVisibility);
  };

  const handleLinkEdit = (field: 'github' | 'vercel', newUrl: string) => {
    if (!isAdmin || !isEditMode) return;
    handleFieldChange(field, newUrl);
  };

  const renderEditableLink = (field: 'github' | 'vercel', url: string | undefined) => {
    if (isAdmin && isEditMode) {
      return (
        <input
          type="text"
          value={url || ''}
          onChange={(e) => handleLinkEdit(field, e.target.value)}
          onBlur={() => {
            // This assumes handleFieldChange already saves the data
          }}
          className="input input-sm w-full"
          placeholder={`${field} URL`}
        />
      );
    }
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline truncate">
        {url}
      </a>
    );
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
    <div className="card-hover group relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

      {/* 精選標記 */}
      {localProject.featured && (
        <div className="absolute top-3 right-3 z-10">
          <StarIconSolid className="h-5 w-5 text-yellow-400 drop-shadow" />
        </div>
      )}
      
      {/* 管理員控制列 */}
      {isAdmin && (
        <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center space-x-2 bg-card/80 backdrop-blur px-2 py-1 rounded-full shadow-sm">
            <button
              onClick={handleFeaturedToggle}
              className={`p-1 rounded-full transition-colors ${
                localProject.featured ? 'text-yellow-400 hover:bg-yellow-400/10' : 'text-muted-foreground hover:bg-muted'
              }`}
              title={localProject.featured ? '取消精選' : '設為精選'}
            >
              <StarIcon className="h-4 w-4" />
            </button>
            <Link
              href={`/admin/edit/${localProject.id}`}
              className="p-1 rounded-full text-muted-foreground hover:text-primary-500 hover:bg-muted transition-colors"
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
                <h3 className="text-lg font-semibold text-foreground line-clamp-2 tracking-tight">
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
              <span className="text-sm font-medium text-muted-foreground">說明</span>
              {isAdmin && showToggleControls && (
                <ToggleControl
                  checked={localProject.visibility.description}
                  onChange={() => handleVisibilityToggle('description')}
                  size="sm"
                />
              )}
            </div>
            {isAdmin && isEditMode ? (
              <textarea
                value={localProject.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                className="textarea w-full"
                rows={4}
              />
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {localProject.description}
              </p>
            )}
          </div>
        )}

        {/* 連結區域 */}
        <div className="space-y-2">
          {localProject.visibility.github && localProject.github && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-muted-foreground text-sm">
                <GitHubIcon />
                {renderEditableLink('github', localProject.github)}
              </div>
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
              <div className="flex items-center space-x-2 text-muted-foreground text-sm">
                <VercelIcon />
                {renderEditableLink('vercel', localProject.vercel)}
              </div>
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
              <div className="flex items-center space-x-2 text-muted-foreground text-sm">
                <FolderOpenIcon className="h-4 w-4" />
                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
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
              <span className="text-sm font-medium text-muted-foreground">狀態</span>
              {isAdmin && showToggleControls && (
                <ToggleControl
                  checked={localProject.visibility.statusNote}
                  onChange={() => handleVisibilityToggle('statusNote')}
                  size="sm"
                />
              )}
            </div>
            <p className="text-muted-foreground text-sm bg-muted/60 p-2 rounded">
              {localProject.statusNote}
            </p>
          </div>
        )}

        {/* 一般註解 */}
        {localProject.visibility.publicNote && localProject.publicNote && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">註解</span>
              {isAdmin && showToggleControls && (
                <ToggleControl
                  checked={localProject.visibility.publicNote}
                  onChange={() => handleVisibilityToggle('publicNote')}
                  size="sm"
                />
              )}
            </div>
            <p className="text-muted-foreground text-sm">
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
            <p className="text-orange-700 dark:text-orange-200 text-sm bg-orange-50 dark:bg-orange-500/10 p-2 rounded border border-orange-200 dark:border-orange-500/30">
              {localProject.developerNote}
            </p>
          </div>
        )}

        {/* 更新時間 */}
        <div className="pt-2 border-t border-border/80">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
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
