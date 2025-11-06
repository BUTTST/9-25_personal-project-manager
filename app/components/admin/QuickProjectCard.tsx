'use client';

import { useState } from 'react';
import { Project, categoryDisplayNames, statusDisplayNames } from '@/types';
import { getRememberedPassword } from '@/lib/auth';
import {
  StarIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Link from 'next/link';

interface QuickProjectCardProps {
  project: Project;
  onUpdate: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

export function QuickProjectCard({ project, onUpdate, onDelete }: QuickProjectCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleFeatured = async () => {
    setIsUpdating(true);
    const updatedProject = { ...project, featured: !project.featured };
    
    try {
      const password = getRememberedPassword();
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password || '',
        },
        body: JSON.stringify({ featured: updatedProject.featured }),
      });
      
      if (response.ok) {
        onUpdate(updatedProject);
      }
    } catch (error) {
      console.error('Failed to update featured status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleHidden = async () => {
    setIsUpdating(true);
    const updatedProject = { ...project, hidden: !project.hidden };
    
    try {
      const password = getRememberedPassword();
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password || '',
        },
        body: JSON.stringify({ hidden: updatedProject.hidden }),
      });
      
      if (response.ok) {
        onUpdate(updatedProject);
      }
    } catch (error) {
      console.error('Failed to update hidden status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`確定要刪除「${project.dateAndFileName}」嗎？此操作無法復原。`)) {
      return;
    }

    try {
      const password = getRememberedPassword();
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-password': password || '',
        },
      });
      
      if (response.ok) {
        onDelete(project.id);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const getCategoryColor = (category: Project['category']) => {
    switch (category) {
      case 'important': return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200';
      case 'secondary': return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200';
      case 'practice': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200';
      case 'single-doc': return 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-200';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200 relative group">
      {/* 精選標記 */}
      {project.featured && (
        <div className="absolute -top-2 -right-2">
          <StarIconSolid className="h-5 w-5 text-yellow-400" />
        </div>
      )}

      {/* 標題 */}
      <h4 className="font-semibold text-foreground text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
        {project.dateAndFileName}
      </h4>

      {/* 類別和狀態 */}
      <div className="flex gap-2 mb-3">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(project.category)}`}>
          {categoryDisplayNames[project.category]}
        </span>
        <span className="text-xs px-2 py-1 rounded-full font-medium bg-muted text-muted-foreground">
          {statusDisplayNames[project.status]}
        </span>
      </div>

      {/* 操作按鈕 */}
      <div className="flex gap-2 pt-3 border-t border-border">
        <button
          onClick={handleToggleFeatured}
          disabled={isUpdating}
          className={`flex-1 p-2 rounded transition-colors ${
            project.featured
              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300'
              : 'bg-muted text-muted-foreground hover:bg-yellow-50 dark:hover:bg-yellow-500/10'
          }`}
          title={project.featured ? '取消精選' : '設為精選'}
        >
          <StarIcon className="h-4 w-4 mx-auto" />
        </button>

        <button
          onClick={handleToggleHidden}
          disabled={isUpdating}
          className={`flex-1 p-2 rounded transition-colors ${
            project.hidden
              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-300'
              : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-500/20 dark:text-green-300'
          }`}
          title={project.hidden ? '顯示' : '隱藏'}
        >
          {project.hidden ? <EyeSlashIcon className="h-4 w-4 mx-auto" /> : <EyeIcon className="h-4 w-4 mx-auto" />}
        </button>

        <Link
          href={`/admin/edit/${project.id}`}
          className="flex-1 p-2 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-300 transition-colors"
          title="編輯"
        >
          <PencilSquareIcon className="h-4 w-4 mx-auto" />
        </Link>

        <button
          onClick={handleDelete}
          className="flex-1 p-2 rounded bg-muted text-muted-foreground hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-500/20 dark:hover:text-red-300 transition-colors"
          title="刪除"
        >
          <TrashIcon className="h-4 w-4 mx-auto" />
        </button>
      </div>
    </div>
  );
}

