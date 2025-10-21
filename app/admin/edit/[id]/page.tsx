'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { ToggleControl } from '@/components/ui/ToggleControl';
import {
  Project,
  ProjectFormData,
  ProjectStatus,
  defaultProjectStatus,
  defaultImagePreviewMode,
  ensureProjectVisibility,
} from '@/types';
import { ArrowLeftIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function EditProjectPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    dateAndFileName: '',
    description: '',
    category: 'secondary',
    status: defaultProjectStatus,
    github: '',
    vercel: '',
    path: '',
    statusNote: '',
    publicNote: '',
    developerNote: '',
    imagePreviews: [],
    imagePreviewMode: defaultImagePreviewMode,
    customInfoSections: [],
    documentMeta: null,
  });
  const [visibility, setVisibility] = useState<Project['visibility']>(ensureProjectVisibility());
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
        status: projectData.status,
        github: projectData.github || '',
        vercel: projectData.vercel || '',
        path: projectData.path || '',
        statusNote: projectData.statusNote || '',
        publicNote: projectData.publicNote || '',
        developerNote: projectData.developerNote || '',
        imagePreviews: projectData.imagePreviews || [],
        imagePreviewMode: projectData.imagePreviewMode || defaultImagePreviewMode,
        customInfoSections: projectData.customInfoSections || [],
        documentMeta: projectData.documentMeta ?? null,
      });
      setVisibility(ensureProjectVisibility(projectData.visibility));
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
          visibility,
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

  const handleStatusChange = (status: ProjectStatus) => {
    setFormData(prev => ({
      ...prev,
      status,
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary-50/20 dark:to-primary-500/5">
      {/* 標題列 */}
      <div className="bg-card/80 backdrop-blur-lg shadow-lg border-b border-border/50 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted/80 transition-all duration-200 hover:scale-105"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary-600 dark:to-primary-400 bg-clip-text text-transparent">
                  編輯專案
                </h1>
                <p className="text-sm text-muted-foreground">修改專案資訊和可見性設定</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本資訊卡片 */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg border border-border/50 p-7 animate-slide-up">
            <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
              <div className="w-1 h-6 bg-primary-500 rounded-full"></div>
              基本資訊
            </h2>
            
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
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg border border-border/50 p-7 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
              連結資訊
            </h2>
            
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
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-lg border border-border/50 p-7 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
              <div className="w-1 h-6 bg-green-500 rounded-full"></div>
              註解資訊
            </h2>
            
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
          <div className="bg-gradient-to-br from-card/50 to-blue-50/30 dark:to-blue-500/5 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-200/50 dark:border-blue-500/30 p-7 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                <EyeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-foreground">顯示控制設定</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
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
                <div key={key} className="flex items-center justify-between p-4 bg-white/60 dark:bg-gray-800/40 hover:bg-white/80 dark:hover:bg-gray-800/60 rounded-xl border border-border/50 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 hover:shadow-md">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {visibility[key as keyof Project['visibility']] ? '✓ 對訪客可見' : '🔒 僅管理員可見'}
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

            <div className="mt-6 p-5 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-500/20 dark:to-indigo-500/20 border-2 border-blue-300/50 dark:border-blue-500/40 rounded-xl shadow-inner">
              <div className="flex items-center space-x-2 mb-3">
                <EyeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-bold text-blue-900 dark:text-blue-100">可見性統計</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    {Object.values(visibility).filter(Boolean).length}
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">可見欄位</div>
                </div>
                <div className="text-blue-400 dark:text-blue-500 text-2xl font-bold">/</div>
                <div className="flex-1 bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {Object.keys(visibility).length}
                  </div>
                  <div className="text-xs text-indigo-700 dark:text-indigo-300">總欄位</div>
                </div>
              </div>
            </div>
          </div>

          {/* 提交按鈕 */}
          <div className="flex justify-end space-x-4 pt-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="btn-secondary px-8 py-3 text-base shadow-md hover:shadow-lg transition-all"
              disabled={saving}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary relative px-8 py-3 text-base shadow-lg hover:shadow-xl transition-all hover:scale-105"
              disabled={saving}
            >
              {saving && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                </div>
              )}
              <span className={saving ? 'invisible' : ''}>💾 儲存更改</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}