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
  const [imageFilter, setImageFilter] = useState<'all' | 'selected' | 'unselected'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('imageFilter') as 'all' | 'selected' | 'unselected') || 'all';
    }
    return 'all';
  });
  const [visibility, setVisibility] = useState(formData.visibility);
  
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
      // 自動將沒有內容的欄位設為隱藏
      const autoVisibility = {
        ...visibility,
        github: !!formData.github?.trim() && visibility.github,
        vercel: !!formData.vercel?.trim() && visibility.vercel,
        deployment: !!formData.deployment?.trim() && visibility.deployment,
        path: !!formData.path?.trim() && visibility.path,
        statusNote: !!formData.statusNote?.trim() && visibility.statusNote,
        publicNote: !!formData.publicNote?.trim() && visibility.publicNote,
        developerNote: !!formData.developerNote?.trim() && visibility.developerNote,
      };

      const submitData = {
        ...formData,
        visibility: autoVisibility,
      };

      const adminPassword = typeof window !== 'undefined' ? localStorage.getItem('remembered_password') || '' : '';
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify(submitData)
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
    setVisibility((prev) => ({
      ...prev,
      [field]: value,
    }));
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

  const handleImageFilterChange = (filter: 'all' | 'selected' | 'unselected') => {
    setImageFilter(filter);
    if (typeof window !== 'undefined') {
      localStorage.setItem('imageFilter', filter);
    }
  };

  const getFilteredImages = () => {
    return imageGallery.filter((image) => {
      const selected = formData.imagePreviews.some((img) => img.id === image.id);
      if (imageFilter === 'selected') return selected;
      if (imageFilter === 'unselected') return !selected;
      return true;
    });
  };

  const getImageOrder = (imageId: string): number => {
    const index = formData.imagePreviews.findIndex((img) => img.id === imageId);
    return index !== -1 ? index + 1 : 0;
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary-50/30 dark:to-primary-500/5">
      {/* 標題列 */}
      <div className="bg-card/80 backdrop-blur-lg shadow-lg border-b border-border/50 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">新增專案</h1>
                <p className="text-sm text-muted-foreground">建立一個新的專案項目</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-card rounded-lg shadow-sm border border-border p-6 space-y-6">
          {/* 基本資訊 */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">基本資訊</h2>
            
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">
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
              <div className="flex flex-col items-center gap-1 pt-8">
                <ToggleControl
                  checked={visibility.dateAndFileName}
                  onChange={(checked) => handleVisibilityChange('dateAndFileName', checked)}
                  size="sm"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {visibility.dateAndFileName ? '可見' : '隱藏'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">
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
              <div className="flex flex-col items-center gap-1 pt-8">
                <ToggleControl
                  checked={visibility.description}
                  onChange={(checked) => handleVisibilityChange('description', checked)}
                  size="sm"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {visibility.description ? '可見' : '隱藏'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">類別</label>
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
              <div className="flex flex-col items-center gap-1 pt-8">
                <ToggleControl
                  checked={visibility.category}
                  onChange={(checked) => handleVisibilityChange('category', checked)}
                  size="sm"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {visibility.category ? '可見' : '隱藏'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">狀態</label>
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
              <div className="flex flex-col items-center gap-1 pt-8">
                <ToggleControl
                  checked={visibility.status}
                  onChange={(checked) => handleVisibilityChange('status', checked)}
                  size="sm"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {visibility.status ? '可見' : '隱藏'}
                </span>
              </div>
            </div>
          </div>

          {/* 圖片預覽 */}
          <div className="space-y-4 border-t border-border pt-6">
            <h2 className="text-lg font-medium text-foreground">圖片預覽</h2>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">已選擇 {formData.imagePreviews.length} 張圖片</span>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                  多張並列
                </label>
              </div>
            </div>

            <p className="text-xs text-muted-foreground bg-muted rounded-lg p-3 border border-border">
              💡 <strong>選擇模式說明：</strong>「單張切換」會顯示單張圖片，訪客可點擊或使用按鈕切換；「多張並列」會同時展開所有選中的圖片。
            </p>

            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-foreground">選擇圖片</h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleImageFilterChange('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    imageFilter === 'all'
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  全部 ({imageGallery.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleImageFilterChange('selected')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    imageFilter === 'selected'
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  已勾選 ({formData.imagePreviews.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleImageFilterChange('unselected')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    imageFilter === 'unselected'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  未勾選 ({imageGallery.length - formData.imagePreviews.length})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {getFilteredImages().map((image) => {
                const selected = formData.imagePreviews.some((img) => img.id === image.id);
                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => handleImageToggle(image.id)}
                    className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                      selected
                        ? 'border-primary-500 bg-primary-50 dark:border-primary-500 dark:bg-primary-500/10 ring-2 ring-primary-300 dark:ring-primary-600'
                        : 'border-gray-200 hover:border-primary-300 dark:border-gray-700 dark:hover:border-primary-600'
                    }`}
                  >
                    {/* 圖片縮圖 */}
                    <div className="relative w-full aspect-video overflow-hidden bg-muted">
                      <img
                        src={image.src}
                        alt={image.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {/* 半透明覆蓋層 */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                    </div>

                    {/* 文字信息區 */}
                    <div className="p-2 bg-card">
                      <div className="text-xs font-medium text-foreground line-clamp-2">
                        {image.title}
                      </div>
                      {image.description && (
                        <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                          {image.description}
                        </div>
                      )}
                    </div>

                    {/* 選中標記與順序 */}
                    {selected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary-500/10 backdrop-blur-sm">
                        <div className="rounded-full bg-primary-500 p-2 shadow-lg">
                          <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* 圖片順序標記 */}
                    {selected && getImageOrder(image.id) > 0 && (
                      <div className="absolute top-2 left-2 flex items-center justify-center w-6 h-6 bg-gradient-to-br from-primary-600 to-primary-500 text-white text-xs font-bold rounded-full shadow-lg border-2 border-white">
                        {getImageOrder(image.id)}
                      </div>
                    )}

                    {/* 懸停時顯示提示 */}
                    <div className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <span className="text-[10px] font-semibold text-white bg-black/70 px-2 py-1 rounded-full whitespace-nowrap">
                        點擊 {selected ? '移除' : '新增'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 連結資訊 */}
          <div className="space-y-4 border-t border-border pt-6">
            <h2 className="text-lg font-medium text-foreground">連結資訊</h2>

            <div className="flex items-start gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">GitHub 連結</label>
                <input
                  type="url"
                  value={formData.github || ''}
                  onChange={(e) => handleInputChange('github', e.target.value)}
                  className="input"
                  placeholder="https://github.com/..."
                />
              </div>
              <div className="flex flex-col items-center gap-1 pt-8">
                <ToggleControl
                  checked={visibility.github}
                  onChange={(checked) => handleVisibilityChange('github', checked)}
                  size="sm"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {visibility.github ? '可見' : '隱藏'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">Vercel 連結</label>
                <input
                  type="url"
                  value={formData.vercel || ''}
                  onChange={(e) => handleInputChange('vercel', e.target.value)}
                  className="input"
                  placeholder="https://vercel.com/..."
                />
              </div>
              <div className="flex flex-col items-center gap-1 pt-8">
                <ToggleControl
                  checked={visibility.vercel}
                  onChange={(checked) => handleVisibilityChange('vercel', checked)}
                  size="sm"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {visibility.vercel ? '可見' : '隱藏'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">部署平台</label>
                <input
                  type="url"
                  value={formData.deployment || ''}
                  onChange={(e) => handleInputChange('deployment', e.target.value)}
                  className="input"
                  placeholder="https://..."
                />
              </div>
              <div className="flex flex-col items-center gap-1 pt-8">
                <ToggleControl
                  checked={visibility.deployment}
                  onChange={(checked) => handleVisibilityChange('deployment', checked)}
                  size="sm"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {visibility.deployment ? '可見' : '隱藏'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">本地路徑</label>
                <input
                  type="text"
                  value={formData.path || ''}
                  onChange={(e) => handleInputChange('path', e.target.value)}
                  className="input"
                  placeholder="E:\\個人項目"
                />
              </div>
              <div className="flex flex-col items-center gap-1 pt-8">
                <ToggleControl
                  checked={visibility.path}
                  onChange={(checked) => handleVisibilityChange('path', checked)}
                  size="sm"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {visibility.path ? '可見' : '隱藏'}
                </span>
              </div>
            </div>
          </div>

          {/* 單檔文件資訊 - 只在選擇 single-doc 時顯示 */}
          {formData.category === 'single-doc' && (
            <div className="space-y-4 border-t border-border pt-6">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-medium text-foreground">📄 單檔文件資訊</h2>
                <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200 px-2 py-1 rounded-full">單檔項目專用</span>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 rounded-lg p-4">
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  💡 <strong>提示：</strong>單檔項目需要指定 HTML 檔案的路徑。請確保檔案已放入 <code className="bg-purple-200 px-1 rounded">public/單檔-獨立頁面/</code> 資料夾。
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  檔案路徑 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.documentMeta?.filePath || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    documentMeta: {
                      ...prev.documentMeta,
                      filePath: e.target.value,
                      title: prev.documentMeta?.title || '',
                      description: prev.documentMeta?.description || '',
                      openBehavior: prev.documentMeta?.openBehavior || 'new-tab',
                      tags: prev.documentMeta?.tags || []
                    }
                  }))}
                  className="input"
                  placeholder="/單檔-獨立頁面/檔名.html"
                  required={formData.category === 'single-doc'}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  範例：/單檔-獨立頁面/React學習筆記.html
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  顯示標題 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.documentMeta?.title || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    documentMeta: {
                      ...prev.documentMeta,
                      filePath: prev.documentMeta?.filePath || '',
                      title: e.target.value,
                      description: prev.documentMeta?.description || '',
                      openBehavior: prev.documentMeta?.openBehavior || 'new-tab',
                      tags: prev.documentMeta?.tags || []
                    }
                  }))}
                  className="input"
                  placeholder="會顯示在專案卡片上的標題"
                  required={formData.category === 'single-doc'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">說明文字</label>
                <textarea
                  value={formData.documentMeta?.description || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    documentMeta: {
                      ...prev.documentMeta,
                      filePath: prev.documentMeta?.filePath || '',
                      title: prev.documentMeta?.title || '',
                      description: e.target.value,
                      openBehavior: prev.documentMeta?.openBehavior || 'new-tab',
                      tags: prev.documentMeta?.tags || []
                    }
                  }))}
                  className="textarea"
                  placeholder="簡短描述文件內容..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">開啟方式</label>
                  <select
                    value={formData.documentMeta?.openBehavior || 'new-tab'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      documentMeta: {
                        ...prev.documentMeta,
                        filePath: prev.documentMeta?.filePath || '',
                        title: prev.documentMeta?.title || '',
                        description: prev.documentMeta?.description || '',
                        openBehavior: e.target.value as 'current-tab' | 'new-tab' | 'modal',
                        tags: prev.documentMeta?.tags || []
                      }
                    }))}
                    className="input"
                  >
                    <option value="new-tab">新分頁開啟</option>
                    <option value="current-tab">當前分頁開啟</option>
                    <option value="modal">彈窗模式（未實作）</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">檔案大小（選填）</label>
                  <input
                    type="text"
                    value={formData.documentMeta?.fileSize || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      documentMeta: {
                        ...prev.documentMeta,
                        filePath: prev.documentMeta?.filePath || '',
                        title: prev.documentMeta?.title || '',
                        description: prev.documentMeta?.description || '',
                        openBehavior: prev.documentMeta?.openBehavior || 'new-tab',
                        fileSize: e.target.value,
                        tags: prev.documentMeta?.tags || []
                      }
                    }))}
                    className="input"
                    placeholder="例：54 KB"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">標籤</label>
                <input
                  type="text"
                  value={formData.documentMeta?.tags?.join(', ') || ''}
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                    setFormData(prev => ({
                      ...prev,
                      documentMeta: {
                        ...prev.documentMeta,
                        filePath: prev.documentMeta?.filePath || '',
                        title: prev.documentMeta?.title || '',
                        description: prev.documentMeta?.description || '',
                        openBehavior: prev.documentMeta?.openBehavior || 'new-tab',
                        tags
                      }
                    }));
                  }}
                  className="input"
                  placeholder="標籤1, 標籤2, 標籤3"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  用逗號分隔多個標籤
                </p>
              </div>
            </div>
          )}

          {/* 註解資訊 */}
          <div className="space-y-4 border-t border-border pt-6">
            <h2 className="text-lg font-medium text-foreground">註解資訊</h2>

            <div className="flex items-start gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">
                  一般註解
                  <span className="text-sm text-muted-foreground ml-2">(訪客可見)</span>
                </label>
                <textarea
                  value={formData.publicNote || ''}
                  onChange={(e) => handleInputChange('publicNote', e.target.value)}
                  className="textarea"
                  placeholder="對訪客展示的註解..."
                  rows={2}
                />
              </div>
              <div className="flex flex-col items-center gap-1 pt-8">
                <ToggleControl
                  checked={visibility.publicNote}
                  onChange={(checked) => handleVisibilityChange('publicNote', checked)}
                  size="sm"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {visibility.publicNote ? '可見' : '隱藏'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">狀態備註</label>
                <textarea
                  value={formData.statusNote || ''}
                  onChange={(e) => handleInputChange('statusNote', e.target.value)}
                  className="textarea"
                  placeholder="專案的當前狀態..."
                  rows={2}
                />
              </div>
              <div className="flex flex-col items-center gap-1 pt-8">
                <ToggleControl
                  checked={visibility.statusNote}
                  onChange={(checked) => handleVisibilityChange('statusNote', checked)}
                  size="sm"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {visibility.statusNote ? '可見' : '隱藏'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-orange-600 mb-2">
                  開發者註解
                  <span className="text-sm text-orange-500 ml-2">(僅管理員可見)</span>
                </label>
                <textarea
                  value={formData.developerNote || ''}
                  onChange={(e) => handleInputChange('developerNote', e.target.value)}
                  className="textarea bg-orange-50 border-orange-200 focus:ring-orange-500 focus:border-orange-500 dark:bg-orange-500/10 dark:border-orange-500/30"
                  placeholder="開發相關的內部註解..."
                  rows={2}
                />
              </div>
              <div className="flex flex-col items-center gap-1 pt-8">
                <ToggleControl
                  checked={visibility.developerNote}
                  onChange={(checked) => handleVisibilityChange('developerNote', checked)}
                  size="sm"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {visibility.developerNote ? '可見' : '隱藏'}
                </span>
              </div>
            </div>
          </div>

          {/* 自訂資訊區塊 */}
          <div className="space-y-4 border-t border-border pt-6">
            <h2 className="text-lg font-medium text-foreground">自訂資訊區塊</h2>

            <div className="space-y-3">
              {formData.customInfoSections.map((section, index) => (
                <div key={section.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">區塊 {index + 1}</h4>
                    <div className="flex items-center gap-2">
                      <ToggleControl
                        checked={section.visible}
                        onChange={(checked) => handleSectionChange(index, 'visible', checked)}
                        size="sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(index)}
                        className="text-muted-foreground hover:text-red-500"
                        title="移除區塊"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground">標題</label>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                        className="input mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground">類型</label>
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
                    <label className="block text-xs font-medium text-muted-foreground">內容</label>
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

            <div className="rounded-lg border border-dashed border-border p-4">
              <h4 className="text-sm font-semibold text-foreground">新增區塊</h4>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">標題</label>
                  <input
                    type="text"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">類型</label>
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
                <label className="block text-xs font-medium text-muted-foreground">內容</label>
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

          {/* 顯示控制設定 */}
          <div className="space-y-4 border-t border-border pt-6">
            <h2 className="text-lg font-medium text-foreground">顯示控制設定</h2>
            <p className="text-sm text-muted-foreground">控制各欄位在訪客頁面的顯示狀態（沒有內容的欄位在新增時會自動隱藏）</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="text-sm font-medium text-foreground">日期和檔名</div>
                <ToggleControl
                  checked={visibility.dateAndFileName}
                  onChange={(checked) => handleVisibilityChange('dateAndFileName', checked)}
                  size="sm"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="text-sm font-medium text-foreground">說明</div>
                <ToggleControl
                  checked={visibility.description}
                  onChange={(checked) => handleVisibilityChange('description', checked)}
                  size="sm"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="text-sm font-medium text-foreground">類別</div>
                <ToggleControl
                  checked={visibility.category}
                  onChange={(checked) => handleVisibilityChange('category', checked)}
                  size="sm"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="text-sm font-medium text-foreground">狀態</div>
                <ToggleControl
                  checked={visibility.status}
                  onChange={(checked) => handleVisibilityChange('status', checked)}
                  size="sm"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="text-sm font-medium text-foreground">GitHub 連結</div>
                <ToggleControl
                  checked={visibility.github}
                  onChange={(checked) => handleVisibilityChange('github', checked)}
                  size="sm"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="text-sm font-medium text-foreground">Vercel 連結</div>
                <ToggleControl
                  checked={visibility.vercel}
                  onChange={(checked) => handleVisibilityChange('vercel', checked)}
                  size="sm"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="text-sm font-medium text-foreground">部署平台</div>
                <ToggleControl
                  checked={visibility.deployment}
                  onChange={(checked) => handleVisibilityChange('deployment', checked)}
                  size="sm"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="text-sm font-medium text-foreground">本地路徑</div>
                <ToggleControl
                  checked={visibility.path}
                  onChange={(checked) => handleVisibilityChange('path', checked)}
                  size="sm"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="text-sm font-medium text-foreground">狀態備註</div>
                <ToggleControl
                  checked={visibility.statusNote}
                  onChange={(checked) => handleVisibilityChange('statusNote', checked)}
                  size="sm"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="text-sm font-medium text-foreground">一般註解</div>
                <ToggleControl
                  checked={visibility.publicNote}
                  onChange={(checked) => handleVisibilityChange('publicNote', checked)}
                  size="sm"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="text-sm font-medium text-foreground">開發者註解</div>
                <ToggleControl
                  checked={visibility.developerNote}
                  onChange={(checked) => handleVisibilityChange('developerNote', checked)}
                  size="sm"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="text-sm font-medium text-foreground">圖片預覽</div>
                <ToggleControl
                  checked={visibility.imagePreviews}
                  onChange={(checked) => handleVisibilityChange('imagePreviews', checked)}
                  size="sm"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="text-sm font-medium text-foreground">自訂資訊區塊</div>
                <ToggleControl
                  checked={visibility.customInfoSections}
                  onChange={(checked) => handleVisibilityChange('customInfoSections', checked)}
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* 提交按鈕 */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-border">
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
