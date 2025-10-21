'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/ToastProvider';
import {
  ProjectFormData,
  ProjectStatus,
  categoryDisplayNames,
  statusDisplayNames,
  projectStatusOrder,
  defaultImagePreviewMode,
  ensureProjectVisibility,
} from '@/types';
import { imageGallery } from '@/config/image-gallery';
import { ArrowLeftIcon, PhotoIcon, PlusIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { ToggleControl } from '@/components/ui/ToggleControl';

export default function NewProjectPage() {
  const [formData, setFormData] = useState<ProjectFormData>({
    dateAndFileName: '',
    description: '',
    category: 'secondary',
    status: 'in-progress',
    github: '',
    vercel: '',
    path: '',
    statusNote: '',
    publicNote: '',
    developerNote: '',
    imagePreviews: [],
    imagePreviewMode: defaultImagePreviewMode,
    customInfoSections: [],
    visibility: ensureProjectVisibility(),
  });
  const [loading, setLoading] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionContent, setNewSectionContent] = useState('');
  const [newSectionType, setNewSectionType] = useState<'text' | 'url'>('text');
  
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

  const handleStatusChange = (status: ProjectStatus) => {
    setFormData((prev) => ({
      ...prev,
      status,
    }));
  };

  const handleVisibilityChange = (field: keyof ProjectFormData['visibility'], value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      visibility: {
        ...prev.visibility,
        [field]: value,
      },
    }));
  };

  const handleImageToggle = (imageId: string) => {
    setFormData((prev) => {
      const exists = prev.imagePreviews.some((img) => img.id === imageId);
      if (exists) {
        return {
          ...prev,
          imagePreviews: prev.imagePreviews.filter((img) => img.id !== imageId),
        };
      }
      const galleryImage = imageGallery.find((img) => img.id === imageId);
      if (!galleryImage) return prev;
      return {
        ...prev,
        imagePreviews: [...prev.imagePreviews, { ...galleryImage }],
      };
    });
  };

  const handleAddSection = () => {
    if (!newSectionTitle.trim() || !newSectionContent.trim()) return;
    setFormData((prev) => ({
      ...prev,
      customInfoSections: [
        ...prev.customInfoSections,
        {
          id: `section-${Date.now()}`,
          title: newSectionTitle,
          type: newSectionType,
          content: newSectionContent,
          visible: true,
        },
      ],
    }));
    setNewSectionTitle('');
    setNewSectionContent('');
    setNewSectionType('text');
  };

  const handleSectionChange = (index: number, field: keyof ProjectFormData['customInfoSections'][number], value: string | boolean) => {
    setFormData((prev) => {
      const updatedSections = [...prev.customInfoSections];
      updatedSections[index] = {
        ...updatedSections[index],
        [field]: value,
      };
      return {
        ...prev,
        customInfoSections: updatedSections,
      };
    });
  };

  const handleRemoveSection = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      customInfoSections: prev.customInfoSections.filter((_, i) => i !== index),
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
                <option value="important">{categoryDisplayNames.important}</option>
                <option value="secondary">{categoryDisplayNames.secondary}</option>
                <option value="practice">{categoryDisplayNames.practice}</option>
                <option value="single-doc">{categoryDisplayNames['single-doc']}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">狀態</label>
              <select
                value={formData.status}
                onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                className="input"
              >
                {projectStatusOrder.map((statusKey) => (
                  <option key={statusKey} value={statusKey}>
                    {statusDisplayNames[statusKey]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 圖片預覽 */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900">圖片預覽</h2>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">已選擇 {formData.imagePreviews.length} 張圖片</span>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    value="single"
                    checked={formData.imagePreviewMode === 'single'}
                    onChange={(e) => handleInputChange('imagePreviewMode', e.target.value)}
                  />
                  單張切換
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    value="grid"
                    checked={formData.imagePreviewMode === 'grid'}
                    onChange={(e) => handleInputChange('imagePreviewMode', e.target.value)}
                  />
                  多張同時展開
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {imageGallery.map((image) => {
                const selected = formData.imagePreviews.some((img) => img.id === image.id);
                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => handleImageToggle(image.id)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${
                      selected
                        ? 'border-primary-500 bg-primary-50 text-primary-600'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <PhotoIcon className={`h-5 w-5 ${selected ? 'text-primary-500' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">{image.title}</div>
                      <div className="text-xs text-gray-500">{image.description || image.id}</div>
                    </div>
                    {selected && <span className="text-xs font-medium text-primary-500">已選</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 連結資訊 */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
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
          <div className="space-y-4 border-t border-gray-200 pt-6">
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

          {/* 自訂資訊區塊 */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900">自訂資訊區塊</h2>

            <div className="space-y-3">
              {formData.customInfoSections.map((section, index) => (
                <div key={section.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-800">區塊 {index + 1}</h4>
                    <div className="flex items-center gap-2">
                      <ToggleControl
                        checked={section.visible}
                        onChange={(checked) => handleSectionChange(index, 'visible', checked)}
                        size="sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(index)}
                        className="text-gray-400 hover:text-red-500"
                        title="移除區塊"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">標題</label>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                        className="input mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">類型</label>
                      <select
                        value={section.type}
                        onChange={(e) => handleSectionChange(index, 'type', e.target.value)}
                        className="input mt-1"
                      >
                        <option value="text">文本</option>
                        <option value="url">網址</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600">內容</label>
                    <textarea
                      value={section.content}
                      onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
                      className="textarea mt-1"
                      rows={section.type === 'url' ? 2 : 3}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-dashed border-gray-300 p-4">
              <h4 className="text-sm font-semibold text-gray-800">新增區塊</h4>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600">標題</label>
                  <input
                    type="text"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">類型</label>
                  <select
                    value={newSectionType}
                    onChange={(e) => setNewSectionType(e.target.value as 'text' | 'url')}
                    className="input mt-1"
                  >
                    <option value="text">文本</option>
                    <option value="url">網址</option>
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-600">內容</label>
                <textarea
                  value={newSectionContent}
                  onChange={(e) => setNewSectionContent(e.target.value)}
                  className="textarea mt-1"
                  rows={newSectionType === 'url' ? 2 : 3}
                />
              </div>
              <button
                type="button"
                onClick={handleAddSection}
                className="mt-3 inline-flex items-center gap-1 rounded-md bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-primary-600"
              >
                <PlusIcon className="h-4 w-4" />
                新增區塊
              </button>
            </div>
          </div>

          {/* 訪客可見設定 */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900">訪客可見設定</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(formData.visibility).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <div className="text-sm font-medium text-gray-700">
                    {key}
                  </div>
                  <ToggleControl
                    checked={value}
                    onChange={(checked) => handleVisibilityChange(key as keyof ProjectFormData['visibility'], checked)}
                    size="sm"
                  />
                </div>
              ))}
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
