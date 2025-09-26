'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { ProjectFormData } from '@/types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NewProjectPage() {
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
  const [loading, setLoading] = useState(false);
  
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }
  }, [isAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.dateAndFileName.trim() || !formData.description.trim()) {
      showToast('error', '專案名稱和說明為必填欄位');
      return;
    }

    setLoading(true);
    try {
      const adminPassword = typeof window !== 'undefined' ? localStorage.getItem('remembered_password') || '' : '';
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('新增專案失敗');
      }

      showToast('success', '專案新增成功');
      router.push('/admin');
    } catch (error) {
      showToast('error', '新增失敗', error instanceof Error ? error.message : '未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isAdmin) {
    return null;
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
                <h1 className="text-2xl font-bold text-gray-900">新增專案</h1>
                <p className="text-gray-600">建立一個新的專案項目</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* 基本資訊 */}
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
                placeholder="例：7-30 V6_確認vercel授權-9"
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
                placeholder="專案的詳細描述..."
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

          {/* 連結資訊 */}
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
                  placeholder="https://github.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vercel 連結</label>
                <input
                  type="url"
                  value={formData.vercel || ''}
                  onChange={(e) => handleInputChange('vercel', e.target.value)}
                  className="input"
                  placeholder="https://vercel.com/..."
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
                placeholder="E:\\個人項目"
              />
            </div>
          </div>

          {/* 註解資訊 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">註解資訊</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">狀態備註</label>
              <textarea
                value={formData.statusNote || ''}
                onChange={(e) => handleInputChange('statusNote', e.target.value)}
                className="textarea"
                placeholder="專案的當前狀態..."
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
                placeholder="對訪客展示的註解..."
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
                placeholder="開發相關的內部註解..."
                rows={2}
              />
            </div>
          </div>

          {/* 提交按鈕 */}
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
              <span className={loading ? 'invisible' : ''}>新增專案</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
