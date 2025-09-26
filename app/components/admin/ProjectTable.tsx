'use client';

import { useState } from 'react';
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
  const { showToast } = useToast();

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
          'x-admin-password': localStorage.getItem('remembered_password') || ''
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
          'x-admin-password': localStorage.getItem('remembered_password') || ''
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
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">專案列表</h2>
        <div className="text-sm text-gray-500">
          總共 {projects.length} 個專案
        </div>
      </div>
      
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">暂無專案</div>
          <Link href="/admin/new" className="btn-primary">
            新增第一個專案
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  專案
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  類別
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  連結
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  更新時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedProjects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => handleFeaturedToggle(project)}
                        className={`flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors ${
                          project.featured ? 'text-yellow-500' : 'text-gray-300'
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
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {project.dateAndFileName}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {project.description}
                        </div>
                        {project.developerNote && (
                          <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded mt-1">
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
                    <div className="flex items-center space-x-2">
                      {project.github && (
                        <Link
                          href={project.github}
                          target="_blank"
                          className="text-gray-400 hover:text-gray-600"
                          title="GitHub"
                        >
                          <CodeBracketIcon className="h-4 w-4" />
                        </Link>
                      )}
                      {project.vercel && (
                        <Link
                          href={project.vercel}
                          target="_blank"
                          className="text-gray-400 hover:text-gray-600"
                          title="Vercel"
                        >
                          <GlobeAltIcon className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center text-xs text-gray-500">
                        {project.visibility.description ? (
                          <EyeIcon className="h-3 w-3 text-green-500" />
                        ) : (
                          <EyeSlashIcon className="h-3 w-3 text-gray-400" />
                        )}
                        <span className="ml-1">
                          {Object.values(project.visibility).filter(Boolean).length}/
                          {Object.keys(project.visibility).length}
                        </span>
                      </div>
                    </div>
                    {project.statusNote && (
                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {project.statusNote}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-gray-500">
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
                            className="text-xs text-red-600 hover:text-red-700 px-2 py-1 bg-red-50 rounded"
                          >
                            確認
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-xs text-gray-600 hover:text-gray-700 px-2 py-1 bg-gray-50 rounded"
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
