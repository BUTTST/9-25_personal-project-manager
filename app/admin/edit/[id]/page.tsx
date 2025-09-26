'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { Project, ProjectFormData } from '@/types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function EditProjectPage() {
  const [formData, setFormData] = useState<ProjectFormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }

    if (id) {
      const fetchProject = async () => {
        try {
          const res = await fetch(`/api/projects/${id}`);
          if (!res.ok) {
            throw new Error('Failed to fetch project data');
          }
          const project: Project = await res.json();
          setFormData({
            dateAndFileName: project.dateAndFileName,
            description: project.description,
            category: project.category,
            github: project.github || '',
            vercel: project.vercel || '',
            path: project.path || '',
            statusNote: project.statusNote || '',
            publicNote: project.publicNote || '',
            developerNote: project.developerNote || '',
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
          showToast('error', '獲取專案資訊失敗');
        }
      };
      fetchProject();
    }
  }, [id, isAdmin, router, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    
    if (!formData.dateAndFileName.trim() || !formData.description.trim()) {
      showToast('error', '專案名稱和說明為必填欄位');
      return;
    }

    setLoading(true);
    try {
      const adminPassword = typeof window !== 'undefined' ? localStorage.getItem('remembered_password') || '' : '';
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('更新專案失敗');
      }

      showToast('success', '專案更新成功');
      router.push('/admin');
    } catch (error) {
      showToast('error', '更新失敗', error instanceof Error ? error.message : '未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  if (!isAdmin) {
    return null;
  }
  
  if (error) {
    return <div className="text-red-500 text-center p-8">{error}</div>;
  }

  if (!formData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">編輯專案</h1>
                <p className="text-gray-600 truncate">{formData.dateAndFileName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">基本資訊</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                日期和檔名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.dateAndFileName}
                onChange={(e) => handleInputChange('dateAndFileName', e.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                說明 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="textarea"
                required
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">類別</label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="input"
              >
                <option value="important">［重要］</option>
                <option value="secondary">［次］</option>
                <option value="practice">［子實踐］</option>
                <option value="completed">［已完成］</option>
                <option value="abandoned">［已捨棄］</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">連結資訊</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GitHub 連結</label>
                <input
                  type="url"
                  value={formData.github || ''}
                  onChange={(e) => handleInputChange('github', e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vercel 連結</label>
                <input
                  type="url"
                  value={formData.vercel || ''}
                  onChange={(e) => handleInputChange('vercel', e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">本地路徑</label>
              <input
                type="text"
                value={formData.path || ''}
                onChange={(e) => handleInputChange('path', e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">註解資訊</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">狀態備註</label>
              <textarea
                value={formData.statusNote || ''}
                onChange={(e) => handleInputChange('statusNote', e.target.value)}
                className="textarea"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                一般註解
                <span className="text-sm text-gray-500 ml-2">(訪客可見)</span>
              </label>
              <textarea
                value={formData.publicNote || ''}
                onChange={(e) => handleInputChange('publicNote', e.target.value)}
                className="textarea"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-orange-600 mb-2">
                開發者註解
                <span className="text-sm text-orange-500 ml-2">(僅管理員可見)</span>
              </label>
              <textarea
                value={formData.developerNote || ''}
                onChange={(e) => handleInputChange('developerNote', e.target.value)}
                className="textarea bg-orange-50 border-orange-200 focus:ring-orange-500 focus:border-orange-500"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="btn-secondary"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary relative"
              disabled={loading}
            >
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </div>
              )}
              <span className={loading ? 'invisible' : ''}>更新專案</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
