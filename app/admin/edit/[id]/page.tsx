'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { ToggleControl } from '@/components/ui/ToggleControl';
import { Project, ProjectFormData } from '@/types';
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function EditProjectPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    dateAndFileName: '',
    description: '',
    category: 'secondary',
    github: '',
    vercel: '',
    path: '',
    statusNote: '',
    publicNote: '',
    developerNote: ''
  });
  const [visibility, setVisibility] = useState<Project['visibility']>({
    dateAndFileName: true,
    description: true,
    category: true,
    github: true,
    vercel: true,
    path: false,
    statusNote: true,
    publicNote: true,
    developerNote: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }
    if (projectId) {
      loadProject();
    }
  }, [isAdmin, projectId, router]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const adminPassword = typeof window !== 'undefined' ? localStorage.getItem('remembered_password') || '' : '';
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          'x-admin-password': adminPassword
        }
      });

      if (!response.ok) {
        throw new Error('無法載入專案資料');
      }

      const projectData = await response.json();
      setProject(projectData);
      setFormData({
        dateAndFileName: projectData.dateAndFileName,
        description: projectData.description,
        category: projectData.category,
        github: projectData.github || '',
        vercel: projectData.vercel || '',
        path: projectData.path || '',
        statusNote: projectData.statusNote || '',
        publicNote: projectData.publicNote || '',
        developerNote: projectData.developerNote || ''
      });
      setVisibility(projectData.visibility);
    } catch (error) {
      showToast('error', '載入失敗', error instanceof Error ? error.message : '未知錯誤');
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.dateAndFileName.trim() || !formData.description.trim()) {
      showToast('error', '專案名稱和說明為必填欄位');
      return;
    }

    setSaving(true);
    try {
      const adminPassword = typeof window !== 'undefined' ? localStorage.getItem('remembered_password') || '' : '';
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({
          ...formData,
          visibility
        })
      });

      if (!response.ok) {
        throw new Error('更新專案失敗');
      }

      showToast('success', '專案更新成功');
      router.push('/admin');
    } catch (error) {
      showToast('error', '更新失敗', error instanceof Error ? error.message : '未知錯誤');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVisibilityChange = (field: keyof Project['visibility'], value: boolean) => {
    setVisibility(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 標題列 */}
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
                <p className="text-gray-600">修改專案資訊和可見性設定</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 基本資訊卡片 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">基本資訊</h2>
            
            <div className="space-y-4">
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
          </div>

          {/* 連結資訊卡片 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">連結資訊</h2>
            
            <div className="space-y-4">
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
          </div>

          {/* 註解資訊卡片 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">註解資訊</h2>
            
            <div className="space-y-4">
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
                  className="textarea bg-orange-50 border-orange-200"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* 可見性控制卡片 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-2 mb-4">
              <EyeIcon className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-medium text-gray-900">顯示控制設定</h2>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              控制此專案各個欄位對訪客的可見性。關閉的欄位只有管理員可以看到。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries({
                dateAndFileName: '日期和檔名',
                description: '說明',
                category: '類別',
                github: 'GitHub 連結',
                vercel: 'Vercel 連結',
                path: '本地路徑',
                statusNote: '狀態備註',
                publicNote: '一般註解',
                developerNote: '開發者註解'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{label}</div>
                    <div className="text-xs text-gray-500">
                      {visibility[key as keyof Project['visibility']] ? '對訪客可見' : '僅管理員可見'}
                    </div>
                  </div>
                  <ToggleControl
                    checked={visibility[key as keyof Project['visibility']]}
                    onChange={(checked) => handleVisibilityChange(key as keyof Project['visibility'], checked)}
                    size="sm"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <EyeIcon className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-800">可見性統計</span>
              </div>
              <div className="text-xs text-blue-700">
                {Object.values(visibility).filter(Boolean).length} / {Object.keys(visibility).length} 個欄位對訪客可見
              </div>
            </div>
          </div>

          {/* 提交按鈕 */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="btn-secondary"
              disabled={saving}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary relative"
              disabled={saving}
            >
              {saving && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </div>
              )}
              <span className={saving ? 'invisible' : ''}>儲存更改</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}