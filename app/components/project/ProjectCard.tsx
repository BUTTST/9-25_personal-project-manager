'use client';

import { useState, useEffect } from 'react';
import {
  Project,
  ProjectVisibility,
  categoryDisplayNames,
  statusDisplayNames,
  ensureProjectVisibility,
} from '@/types';
import { ToggleControl } from '@/components/ui/ToggleControl';
import { Tooltip } from '@/components/ui/Tooltip';
import { EditProjectModal } from '@/components/admin/EditProjectModal';
import { getRememberedPassword } from '@/lib/auth';
import {
  GlobeAltIcon,
  CodeBracketIcon,
  FolderOpenIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilSquareIcon,
  DocumentTextIcon,
  PhotoIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { ImagePreviewGallery } from './ImagePreviewGallery';
import { CustomInfoSectionView } from './CustomInfoSectionView';

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
  showToggleControls: boolean;
  onUpdate?: (updatedProject: Project) => void;
  imageCollapsedOverride?: boolean;
}

export function ProjectCard({ project, isAdmin, showToggleControls, onUpdate, imageCollapsedOverride }: ProjectCardProps) {
  const [localProject, setLocalProject] = useState({
    ...project,
    visibility: ensureProjectVisibility(project.visibility),
  });
  const [isGalleryCollapsed, setIsGalleryCollapsed] = useState(imageCollapsedOverride ?? false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    setLocalProject({
      ...project,
      visibility: ensureProjectVisibility(project.visibility),
    });
  }, [project]);

  useEffect(() => {
    if (typeof imageCollapsedOverride === 'boolean') {
      setIsGalleryCollapsed(imageCollapsedOverride);
    }
  }, [imageCollapsedOverride]);

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
    const password = getRememberedPassword();
    
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password || '',
        },
        body: JSON.stringify({ visibility: updatedProject.visibility }),
      });
      
      if (!response.ok) {
        console.error('Failed to update project visibility:', await response.text());
        // 回滾更改
        setLocalProject(project);
        onUpdate?.(project);
      }
    } catch (error) {
      console.error('Failed to update project visibility:', error);
      // 回滾更改
      setLocalProject(project);
      onUpdate?.(project);
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
    
    const password = getRememberedPassword();
    
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password || '',
        },
        body: JSON.stringify({ featured: updatedProject.featured }),
      });
      
      if (!response.ok) {
        console.error('Failed to update project featured status:', await response.text());
        setLocalProject(localProject);
        onUpdate?.(localProject);
      }
    } catch (error) {
      console.error('Failed to update project featured status:', error);
      setLocalProject(localProject);
      onUpdate?.(localProject);
    }
  };

  const handleHiddenToggle = async () => {
    if (!isAdmin) return;
    
    const updatedProject = {
      ...localProject,
      hidden: !localProject.hidden,
      updatedAt: Date.now()
    };
    
    setLocalProject(updatedProject);
    onUpdate?.(updatedProject);
    
    const password = getRememberedPassword();
    
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password || '',
        },
        body: JSON.stringify({ hidden: updatedProject.hidden }),
      });
      
      if (!response.ok) {
        console.error('Failed to update project hidden status:', await response.text());
        setLocalProject(localProject);
        onUpdate?.(localProject);
      }
    } catch (error) {
      console.error('Failed to update project hidden status:', error);
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

    const password = getRememberedPassword();

    try {
      fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password || '',
        },
        body: JSON.stringify({ [field]: value }),
      }).then(response => {
        if (!response.ok) {
          console.error(`Failed to update project ${field}:`, response.statusText);
          setLocalProject(localProject);
          onUpdate?.(localProject);
        }
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

  const handleLinkEdit = (field: 'github' | 'vercel' | 'deployment', newUrl: string) => {
    if (!isAdmin) return;
    handleFieldChange(field, newUrl);
  };

  const handleSaveFromModal = (updatedProject: Project) => {
    setLocalProject(updatedProject);
    onUpdate?.(updatedProject);
  };

  const renderEditableLink = (field: 'github' | 'vercel' | 'deployment', url: string | undefined) => {
    if (!url) return null;
    
    return (
      <Tooltip content={url} position="top" maxWidth="max-w-md">
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline block overflow-hidden text-ellipsis whitespace-nowrap transition-colors"
        >
          {url}
        </a>
      </Tooltip>
    );
  };

  const getCategoryBadgeClass = (category: Project['category']) => {
    switch (category) {
      case 'important': return 'badge-important';
      case 'secondary': return 'badge-secondary';
      case 'practice': return 'badge-practice';
      case 'single-doc': return 'badge-single-doc';
      default: return 'badge';
    }
  };

  const getStatusBadgeClass = (status: Project['status']) => {
    switch (status) {
      case 'in-progress':
        return 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300';
      case 'on-hold':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
      case 'long-term':
        return 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300';
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
      case 'discarded':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300';
      default:
        return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
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
    <>
      <div className="card-hover group relative overflow-hidden transition-all duration-300 hover:scale-[1.02]">
        {/* 頂部漸變條 */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* 精選標記 */}
        {localProject.featured && (
          <div className="absolute top-4 right-4 z-10">
            <div className="relative">
              <StarIconSolid className="h-6 w-6 text-yellow-400 drop-shadow-lg animate-pulse-slow" />
              <div className="absolute inset-0 h-6 w-6 bg-yellow-400/30 rounded-full blur-md"></div>
            </div>
          </div>
        )}
        
        {/* 管理員控制列 */}
        {isAdmin && (
          <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="flex items-center space-x-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={handleFeaturedToggle}
                className={`p-1.5 rounded-full transition-all duration-200 ${
                  localProject.featured 
                    ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 hover:bg-yellow-100 dark:hover:bg-yellow-500/20' 
                    : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/10'
                }`}
                title={localProject.featured ? '取消精選' : '設為精選'}
              >
                <StarIcon className="h-4 w-4" />
              </button>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
              <button
                onClick={handleHiddenToggle}
                className={`p-1.5 rounded-full transition-all duration-200 ${
                  localProject.hidden 
                    ? 'text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20' 
                    : 'text-green-500 bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20'
                }`}
                title={localProject.hidden ? '顯示項目' : '隱藏項目'}
              >
                {localProject.hidden ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="p-1.5 rounded-full text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all duration-200"
                title="編輯專案"
              >
                <PencilSquareIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

      {/* 專案內容 */}
      <div className="space-y-5">
        {/* 標題和類別區 */}
        <div className="space-y-3">
          {/* 標題 - 管理員總是看得到，訪客依照可見性 */}
          {(isAdmin || localProject.visibility.dateAndFileName) && (
            <div className="flex items-start justify-between gap-3">
              <h3 className={`text-lg font-bold line-clamp-2 tracking-tight flex-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors ${
                !localProject.visibility.dateAndFileName && isAdmin ? 'text-muted-foreground/50 line-through' : 'text-foreground'
              }`}>
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
          
          {/* 類別和狀態 - 管理員總是看得到，訪客依照可見性 */}
          {(isAdmin || localProject.visibility.category) && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {(isAdmin || localProject.visibility.category) && (
                  <span
                    className={`${getCategoryBadgeClass(localProject.category)} text-xs font-semibold px-3 py-1.5 ${
                      !localProject.visibility.category && isAdmin ? 'opacity-40 line-through' : ''
                    }`}
                  >
                    {categoryDisplayNames[localProject.category]}
                  </span>
                )}
                {(isAdmin || localProject.visibility.status) && (
                  <span
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                      getStatusBadgeClass(localProject.status)
                    } ${
                      !localProject.visibility.status && isAdmin ? 'opacity-40 line-through' : ''
                    }`}
                  >
                    {statusDisplayNames[localProject.status] || localProject.status}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {localProject.imagePreviews.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsGalleryCollapsed(!isGalleryCollapsed)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary-400 hover:text-primary-500"
                  >
                    {isGalleryCollapsed ? (
                      <PhotoIcon className="h-4 w-4" />
                    ) : (
                      <ArrowsPointingOutIcon className="h-4 w-4" />
                    )}
                    <span>{isGalleryCollapsed ? '展開圖片' : '收折圖片'}</span>
                  </button>
                )}
                {isAdmin && showToggleControls && (
                  <div className="flex items-center gap-2">
                    {(isAdmin || localProject.visibility.category) && (
                      <ToggleControl
                        checked={localProject.visibility.category}
                        onChange={() => handleVisibilityToggle('category')}
                        size="sm"
                      />
                    )}
                    {(isAdmin || localProject.visibility.status) && (
                      <ToggleControl
                        checked={localProject.visibility.status}
                        onChange={() => handleVisibilityToggle('status')}
                        size="sm"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 圖片預覽 */}
        {(isAdmin || localProject.visibility.imagePreviews) && (
          <div
            className={`rounded-xl border border-border/60 bg-muted/20 p-4 transition-opacity ${
              !localProject.visibility.imagePreviews && isAdmin ? 'opacity-40' : ''
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <PhotoIcon className="h-4 w-4" />
                圖片預覽
              </div>
              {isAdmin && showToggleControls && (
                <ToggleControl
                  checked={localProject.visibility.imagePreviews}
                  onChange={() => handleVisibilityToggle('imagePreviews')}
                  size="sm"
                />
              )}
            </div>
            <ImagePreviewGallery
              images={localProject.imagePreviews}
              mode={localProject.imagePreviewMode}
              collapsed={isGalleryCollapsed || !localProject.visibility.imagePreviews}
            />
          </div>
        )}

        {/* 說明區塊 */}
        {(isAdmin || localProject.visibility.description) && (
          <div className={`bg-muted/30 dark:bg-muted/20 rounded-lg p-4 border border-border/50 ${
            !localProject.visibility.description && isAdmin ? 'opacity-40' : ''
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">說明</span>
              {isAdmin && showToggleControls && (
                <ToggleControl
                  checked={localProject.visibility.description}
                  onChange={() => handleVisibilityToggle('description')}
                  size="sm"
                />
              )}
            </div>
            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
              !localProject.visibility.description && isAdmin ? 'text-muted-foreground/50 line-through' : 'text-foreground/80'
            }`}>
              {localProject.description}
            </p>
          </div>
        )}

        {/* 連結區域 - 管理員或有可見連結時顯示 */}
        {(isAdmin || (localProject.visibility.github && localProject.github) || 
          (localProject.visibility.vercel && localProject.vercel) || 
          (localProject.visibility.deployment && localProject.deployment) ||
          (localProject.visibility.path && localProject.path) ||
          (localProject.visibility.vercel && localProject.documentMeta?.filePath)) && 
          (localProject.github || localProject.vercel || localProject.deployment || localProject.path || localProject.documentMeta?.filePath) && (
          <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-500/5 dark:to-purple-500/5 rounded-lg p-4 border border-blue-200/30 dark:border-blue-500/20 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                <GlobeAltIcon className="h-3.5 w-3.5" />
                連結
              </span>
            </div>
            
            {(isAdmin || localProject.visibility.github) && localProject.github && (
              <div className={`flex items-center justify-between gap-3 ${
                !localProject.visibility.github && isAdmin ? 'opacity-40' : ''
              }`}>
                <div className="flex items-center space-x-2.5 text-sm min-w-0 flex-1 overflow-hidden">
                  <div className="flex-shrink-0">
                    <GitHubIcon />
                  </div>
                  <div className={`min-w-0 flex-1 overflow-hidden ${
                    !localProject.visibility.github && isAdmin ? 'line-through' : ''
                  }`}>
                    {renderEditableLink('github', localProject.github)}
                  </div>
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
            
            {(isAdmin || localProject.visibility.vercel) && (localProject.vercel || localProject.documentMeta?.filePath) && (
              <div className={`flex items-center justify-between gap-3 ${
                !localProject.visibility.vercel && isAdmin ? 'opacity-40' : ''
              }`}>
                <div className="flex items-center space-x-2.5 text-sm min-w-0 flex-1 overflow-hidden">
                  <div className="flex-shrink-0">
                    <VercelIcon />
                  </div>
                  <div className={`min-w-0 flex-1 overflow-hidden ${
                    !localProject.visibility.vercel && isAdmin ? 'line-through' : ''
                  }`}>
                    {localProject.documentMeta?.filePath && !localProject.vercel ? (
                      <a 
                        href={localProject.documentMeta.filePath} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline truncate block transition-colors"
                      >
                        {localProject.documentMeta.title || '查看文件'}
                      </a>
                    ) : (
                      renderEditableLink('vercel', localProject.vercel || '')
                    )}
                  </div>
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
            
            {(isAdmin || localProject.visibility.deployment) && localProject.deployment && (
              <div className={`flex items-center justify-between gap-3 ${
                !localProject.visibility.deployment && isAdmin ? 'opacity-40' : ''
              }`}>
                <div className="flex items-center space-x-2.5 text-sm min-w-0 flex-1 overflow-hidden">
                  <div className="flex-shrink-0">
                    <GlobeAltIcon className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className={`min-w-0 flex-1 overflow-hidden ${
                    !localProject.visibility.deployment && isAdmin ? 'line-through' : ''
                  }`}>
                    {renderEditableLink('deployment', localProject.deployment)}
                  </div>
                </div>
                {isAdmin && showToggleControls && (
                  <ToggleControl
                    checked={localProject.visibility.deployment}
                    onChange={() => handleVisibilityToggle('deployment')}
                    size="sm"
                  />
                )}
              </div>
            )}
            
            {(isAdmin || localProject.visibility.path) && localProject.path && (
              <div className={`flex items-center justify-between gap-3 ${
                !localProject.visibility.path && isAdmin ? 'opacity-40' : ''
              }`}>
                <div className="flex items-center space-x-2.5 text-sm min-w-0 flex-1">
                  <FolderOpenIcon className="h-4 w-4 flex-shrink-0 text-gray-500" />
                  <Tooltip content={localProject.path} position="top">
                    <span className={`font-mono text-xs bg-white/60 dark:bg-gray-800/60 px-2.5 py-1.5 rounded border border-gray-300/50 dark:border-gray-600/50 truncate block ${
                      !localProject.visibility.path && isAdmin ? 'line-through' : ''
                    }`}>
                      {localProject.path}
                    </span>
                  </Tooltip>
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
        )}

        {/* 狀態備註區塊 */}
        {(isAdmin || localProject.visibility.statusNote) && localProject.statusNote && (
          <div className={`bg-amber-50/50 dark:bg-amber-500/5 rounded-lg p-4 border border-amber-200/50 dark:border-amber-500/20 ${
            !localProject.visibility.statusNote && isAdmin ? 'opacity-40' : ''
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
                狀態
              </span>
              {isAdmin && showToggleControls && (
                <ToggleControl
                  checked={localProject.visibility.statusNote}
                  onChange={() => handleVisibilityToggle('statusNote')}
                  size="sm"
                />
              )}
            </div>
            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
              !localProject.visibility.statusNote && isAdmin 
                ? 'text-amber-900/40 dark:text-amber-100/40 line-through' 
                : 'text-amber-900/80 dark:text-amber-100/80'
            }`}>
              {localProject.statusNote}
            </p>
          </div>
        )}

        {/* 一般註解區塊 */}
        {(isAdmin || localProject.visibility.publicNote) && localProject.publicNote && (
          <div className={`bg-green-50/50 dark:bg-green-500/5 rounded-lg p-4 border border-green-200/50 dark:border-green-500/20 ${
            !localProject.visibility.publicNote && isAdmin ? 'opacity-40' : ''
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider flex items-center gap-1.5">
                <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
                註解
              </span>
              {isAdmin && showToggleControls && (
                <ToggleControl
                  checked={localProject.visibility.publicNote}
                  onChange={() => handleVisibilityToggle('publicNote')}
                  size="sm"
                />
              )}
            </div>
            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
              !localProject.visibility.publicNote && isAdmin 
                ? 'text-green-900/40 dark:text-green-100/40 line-through' 
                : 'text-green-900/80 dark:text-green-100/80'
            }`}>
              {localProject.publicNote}
            </p>
          </div>
        )}

        {/* 自訂資訊區塊 */}
        {(isAdmin || localProject.visibility.customInfoSections) && localProject.customInfoSections.length > 0 && (
          <div
            className={`rounded-lg border border-primary-200/60 bg-primary-50/40 p-4 dark:border-primary-500/30 dark:bg-primary-500/10 ${
              !localProject.visibility.customInfoSections && isAdmin ? 'opacity-40' : ''
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                自訂資訊
              </span>
              {isAdmin && showToggleControls && (
                <ToggleControl
                  checked={localProject.visibility.customInfoSections}
                  onChange={() => handleVisibilityToggle('customInfoSections')}
                  size="sm"
                />
              )}
            </div>
            <CustomInfoSectionView sections={localProject.customInfoSections} />
          </div>
        )}

        {/* 開發者註解區塊（僅管理員可見） */}
        {isAdmin && (isAdmin || localProject.visibility.developerNote) && localProject.developerNote && (
          <div className={`bg-gradient-to-br from-orange-50 to-red-50/50 dark:from-orange-500/10 dark:to-red-500/5 rounded-lg p-4 border-2 border-orange-300/50 dark:border-orange-500/30 shadow-sm ${
            !localProject.visibility.developerNote && isAdmin ? 'opacity-40' : ''
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider flex items-center gap-1.5">
                  <EyeSlashIcon className="h-3.5 w-3.5" />
                  開發者註解
                </span>
                <span className="text-[10px] bg-orange-200/50 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full font-medium">
                  僅管理員
                </span>
              </div>
              {showToggleControls && (
                <ToggleControl
                  checked={localProject.visibility.developerNote}
                  onChange={() => handleVisibilityToggle('developerNote')}
                  size="sm"
                />
              )}
            </div>
            <p className={`text-sm leading-relaxed font-medium whitespace-pre-wrap ${
              !localProject.visibility.developerNote && isAdmin 
                ? 'text-orange-900/40 dark:text-orange-100/40 line-through' 
                : 'text-orange-900 dark:text-orange-100'
            }`}>
              {localProject.developerNote}
            </p>
          </div>
        )}

        {/* 單檔文件資訊 */}
        {localProject.documentMeta && (
          <div className="bg-primary-50/50 dark:bg-primary-500/10 rounded-lg p-4 border border-primary-200/50 dark:border-primary-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wider flex items-center gap-1.5">
                <DocumentTextIcon className="h-3.5 w-3.5" />
                單檔文件資訊
              </span>
              {localProject.documentMeta.fileSize && (
                <span className="text-[11px] text-primary-600 dark:text-primary-300 bg-white/60 dark:bg-gray-800/60 px-2 py-0.5 rounded-full border border-primary-200/50 dark:border-primary-500/30">
                  {localProject.documentMeta.fileSize}
                </span>
              )}
            </div>
            {localProject.documentMeta.description && (
              <p className="text-sm text-primary-800 dark:text-primary-200 mb-2 whitespace-pre-wrap">
                {localProject.documentMeta.description}
              </p>
            )}
            {localProject.documentMeta.tags && localProject.documentMeta.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {localProject.documentMeta.tags.map(tag => (
                  <span key={tag} className="text-xs font-medium text-primary-600 dark:text-primary-300 bg-primary-100/80 dark:bg-primary-500/20 px-2 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 更新時間和統計 */}
        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
              <span>更新於 {formatDate(localProject.updatedAt)}</span>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full">
                <EyeIcon className="h-3 w-3" />
                <span className="font-medium">
                  {Object.entries(localProject.visibility).filter(([, value]) => value).length}/
                  {Object.keys(localProject.visibility).length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* 編輯 Modal */}
    {isAdmin && (
      <EditProjectModal
        project={localProject}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveFromModal}
      />
    )}
  </>
  );
}
