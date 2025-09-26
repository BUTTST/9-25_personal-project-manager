'use client';

import { useState, useEffect, DragEvent } from 'react';
import Link from 'next/link';
import { Project, CategoryDisplayName } from '@/types';
import { ToggleControl } from '@/components/ui/ToggleControl';
import { useToast } from '@/components/ui/ToastProvider';
import {
  PencilIcon,
  TrashIcon,
  CodeBracketIcon,
  GlobeAltIcon,
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


interface ProjectTableProps {
  projects: Project[];
  showToggleControls: boolean;
  onUpdate: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

const categoryDisplayNames: CategoryDisplayName = {
  important: '［重要］',
  secondary: '［次］',
  practice: '［子實踐］',
  completed: '［已完成］',
  abandoned: '［已捨棄］'
};

export function ProjectTable({ projects, showToggleControls, onUpdate, onDelete }: ProjectTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [displayProjects, setDisplayProjects] = useState<Project[]>([]);
  const [draggingProject, setDraggingProject] = useState<Project | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    // 根據 sortOrder 排序，如果沒有則使用舊的排序邏輯
    const sorted = [...projects].sort((a, b) => {
      if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
        return a.sortOrder - b.sortOrder;
      }
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
      }
      const categoryOrder = ['important', 'secondary', 'practice', 'completed', 'abandoned'];
      const aIndex = categoryOrder.indexOf(a.category);
      const bIndex = categoryOrder.indexOf(b.category);
      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }
      return b.updatedAt - a.updatedAt;
    });
    setDisplayProjects(sorted);
  }, [projects]);


  const handleFeaturedToggle = async (project: Project) => {
    const updatedProject = {
      ...project,
      featured: !project.featured,
      updatedAt: Date.now()
    };
    
    onUpdate(updatedProject);
    
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': typeof window !== 'undefined' ? localStorage.getItem('remembered_password') || '' : ''
        },
        body: JSON.stringify({ featured: updatedProject.featured }),
      });
      
      showToast('success', '更新成功');
    } catch (error) {
      console.error('Failed to update featured status:', error);
      onUpdate(project); // 回滾
      showToast('error', '更新失敗');
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-password': typeof window !== 'undefined' ? localStorage.getItem('remembered_password') || '' : ''
        }
      });
      
      if (!response.ok) {
        throw new Error('刪除失敗');
      }
      
      onDelete(projectId);
      showToast('success', '專案刪除成功');
    } catch (error) {
      showToast('error', '刪除失敗', error instanceof Error ? error.message : '未知錯誤');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleDragStart = (e: DragEvent<HTMLTableRowElement>, project: Project) => {
    setDraggingProject(project);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', project.id);
  };

  const handleDragOver = (e: DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
  };

  const handleDrop = async (e: DragEvent<HTMLTableRowElement>, targetProject: Project) => {
    e.preventDefault();
    if (!draggingProject) return;

    const draggingIndex = displayProjects.findIndex(p => p.id === draggingProject.id);
    const targetIndex = displayProjects.findIndex(p => p.id === targetProject.id);

    if (draggingIndex === -1 || targetIndex === -1) return;

    const newProjects = [...displayProjects];
    const [removed] = newProjects.splice(draggingIndex, 1);
    newProjects.splice(targetIndex, 0, removed);

    const updatedProjects = newProjects.map((p, index) => ({ ...p, sortOrder: index }));
    
    setDisplayProjects(updatedProjects);
    setDraggingProject(null);

    const orderToSave = updatedProjects.map(p => ({ id: p.id, sortOrder: p.sortOrder }));
    
    try {
      const adminPassword = typeof window !== 'undefined' ? localStorage.getItem('remembered_password') || '' : '';
      await fetch('/api/projects/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify(orderToSave),
      });
      showToast('success', '專案順序已更新');
    } catch (error) {
      showToast('error', '更新專案順序失敗');
      // Revert to the original order on failure
      setDisplayProjects(displayProjects);
    }
  };

  const handleDragEnd = () => {
    setDraggingProject(null);
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

  const sortedProjects = [...projects].sort((a, b) => {
    if (a.featured !== b.featured) {
      return a.featured ? -1 : 1;
    }
    const categoryOrder = ['important', 'secondary', 'practice', 'completed', 'abandoned'];
    const aIndex = categoryOrder.indexOf(a.category);
    const bIndex = categoryOrder.indexOf(b.category);
    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }
    return b.updatedAt - a.updatedAt;
  });

  return (
    <div className="p-6 text-foreground">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">專案列表</h2>
        <div className="text-sm text-muted-foreground">
          總共 {projects.length} 個專案
        </div>
      </div>
      
      {projects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="mb-4">暂無專案</div>
          <Link href="/admin/new" className="btn-primary">
            新增第一個專案
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  專案
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  類別
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  連結
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  更新時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {displayProjects.map((project) => (
                <tr 
                  key={project.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, project)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, project)}
                  onDragEnd={handleDragEnd}
                  className={`transition-colors hover:bg-muted/50 ${
                    draggingProject?.id === project.id ? 'opacity-50 bg-primary-100' : ''
                  }`}
                  style={{ cursor: 'grab' }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => handleFeaturedToggle(project)}
                        className={`flex-shrink-0 p-1 rounded-full transition-colors ${
                          project.featured
                            ? 'text-yellow-500 hover:bg-yellow-500/10'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                        title={project.featured ? '取消精選' : '設為精選'}
                      >
                        {project.featured ? (
                          <StarIconSolid className="h-5 w-5" />
                        ) : (
                          <StarIcon className="h-5 w-5" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {project.dateAndFileName}
                        </div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </div>
                        {project.developerNote && (
                          <div className="text-xs text-orange-600 dark:text-orange-200 bg-orange-50 dark:bg-orange-500/10 px-2 py-1 rounded mt-1">
                            開發者註解: {project.developerNote}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={getCategoryBadgeClass(project.category)}>
                      {categoryDisplayNames[project.category]}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary-500"
                          title="GitHub"
                        >
                          <GitHubIcon />
                        </a>
                      )}
                      {project.vercel && (
                        <a
                          href={project.vercel}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary-500"
                          title="Vercel"
                        >
                          <VercelIcon />
                        </a>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center text-xs text-muted-foreground">
                        {project.visibility.description ? (
                          <EyeIcon className="h-3 w-3 text-green-500" />
                        ) : (
                          <EyeSlashIcon className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className="ml-1">
                          {Object.values(project.visibility).filter(Boolean).length}/
                          {Object.keys(project.visibility).length}
                        </span>
                      </div>
                    </div>
                    {project.statusNote && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {project.statusNote}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDate(project.updatedAt)}
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/admin/edit/${project.id}`}
                        className="text-primary-600 hover:text-primary-700"
                        title="編輯"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      
                      {deleteConfirm === project.id ? (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded bg-red-50 dark:bg-red-500/20"
                          >
                            確認
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded bg-muted"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(project.id)}
                          className="text-red-600 hover:text-red-700"
                          title="刪除"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
