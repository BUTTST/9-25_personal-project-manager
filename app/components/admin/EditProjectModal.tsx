'use client';

import { useState, useEffect } from 'react';
import { getRememberedPassword } from '@/lib/auth';
import {
  Project,
  ProjectFormData,
  ProjectStatus,
  categoryDisplayNames,
  statusDisplayNames,
  projectStatusOrder,
  ensureProjectVisibility,
} from '@/types';
import { ToggleControl } from '@/components/ui/ToggleControl';
import { XMarkIcon, EyeIcon, EyeSlashIcon, PlusIcon, TrashIcon, PencilIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import InlineImageUploader from '@/components/admin/InlineImageUploader';

// 從 Supabase Storage 獲取的圖片類型
interface StorageImage {
  name: string;
  originalFilename?: string;
  url: string;
  size: number;
  created_at: string;
}

// 轉換為 GalleryImage 格式（兼容現有邏輯）
interface GalleryImage {
  id: string;
  title: string;
  description?: string;
  src: string;
  thumbnail?: string;
}

interface EditProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProject: Project) => void;
}

export function EditProjectModal({ project, isOpen, onClose, onSave }: EditProjectModalProps) {
  const [imageGallery, setImageGallery] = useState<GalleryImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    dateAndFileName: project.dateAndFileName,
    description: project.description,
    category: project.category,
    status: project.status,
    github: project.github || '',
    vercel: project.vercel || '',
    path: project.path || '',
    statusNote: project.statusNote || '',
    publicNote: project.publicNote || '',
    developerNote: project.developerNote || '',
    imagePreviews: project.imagePreviews || [],
    imagePreviewMode: project.imagePreviewMode,
    customInfoSections: project.customInfoSections || [],
  });
  const [visibility, setVisibility] = useState<Project['visibility']>(ensureProjectVisibility(project.visibility));
  const [saving, setSaving] = useState(false);
  const [lastVisibilityState, setLastVisibilityState] = useState<Project['visibility'] | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionContent, setNewSectionContent] = useState('');
  const [newSectionType, setNewSectionType] = useState<'text' | 'url'>('text');
  const [imageFilter, setImageFilter] = useState<'all' | 'selected' | 'unselected'>(() => {
    if (typeof window !== 'undefined') {
      const storageKey = `imageFilter_${project.id}`;
      return (localStorage.getItem(storageKey) as 'all' | 'selected' | 'unselected') || 'all';
    }
    return 'all';
  });
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [editingImageTitle, setEditingImageTitle] = useState('');
  const [showImageUploader, setShowImageUploader] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 重置表單數據
      setFormData({
        dateAndFileName: project.dateAndFileName,
        description: project.description,
        category: project.category,
        status: project.status,
        github: project.github || '',
        vercel: project.vercel || '',
        deployment: project.deployment || '',
        path: project.path || '',
        statusNote: project.statusNote || '',
        publicNote: project.publicNote || '',
        developerNote: project.developerNote || '',
        imagePreviews: project.imagePreviews || [],
        imagePreviewMode: project.imagePreviewMode,
        customInfoSections: project.customInfoSections || [],
        hidden: project.hidden ?? false,
      });
      setVisibility(ensureProjectVisibility(project.visibility));
    }
  }, [isOpen, project]);

  // 從 Supabase Storage 獲取圖片列表
  useEffect(() => {
    const fetchImages = async () => {
      if (!isOpen) return;

      try {
        setLoadingImages(true);
        const password = getRememberedPassword();
        
        if (!password) {
          console.warn('無法獲取管理員密碼，無法載入圖片');
          setLoadingImages(false);
          return;
        }

        const response = await fetch('/api/images', {
          headers: {
            'x-admin-password': password,
          },
        });

        if (!response.ok) {
          throw new Error('無法載入圖片');
        }

        const data = await response.json();
        
        // 轉換 Supabase Storage 格式為 GalleryImage 格式
        const galleryImages: GalleryImage[] = (data.files || []).map((file: StorageImage) => ({
          id: file.name,
          title: (file.originalFilename || file.name).replace(/\.[^/.]+$/, ''), // 使用原始檔名（含中文），移除副檔名
          src: file.url,
        }));

        setImageGallery(galleryImages);
      } catch (error) {
        console.error('載入圖片失敗:', error);
      } finally {
        setLoadingImages(false);
      }
    };

    fetchImages();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.dateAndFileName.trim() || !formData.description.trim()) {
      alert('專案名稱和說明為必填欄位');
      return;
    }

    setSaving(true);
    try {
      const adminPassword = typeof window !== 'undefined' ? localStorage.getItem('remembered_password') || '' : '';
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({
          ...formData,
          visibility,
          updatedAt: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error('更新專案失敗');
      }

      const updatedProject = await response.json();
      onSave(updatedProject);
      onClose();
    } catch (error) {
      alert('更新失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ProjectFormData, value: string | boolean) => {
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

  const handleImageToggle = (imageId: string) => {
    setFormData((prev) => {
      // 智能匹配：支持 ID、src 路径或文件名匹配
      const exists = prev.imagePreviews.some((img) => 
        img.id === imageId || 
        img.src === imageId || 
        img.src.includes(imageId)
      );
      
      if (exists) {
        return {
          ...prev,
          imagePreviews: prev.imagePreviews.filter((img) => 
            img.id !== imageId && 
            img.src !== imageId && 
            !img.src.includes(imageId)
          ),
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
      const storageKey = `imageFilter_${project.id}`;
      localStorage.setItem(storageKey, filter);
    }
  };

  const getFilteredImages = () => {
    return imageGallery.filter((image) => {
      // 智能匹配：同时检查 ID、src 路径和文件名
      const selected = formData.imagePreviews.some((img) => {
        // 精确匹配 ID
        if (img.id === image.id) return true;
        // 匹配完整 URL
        if (img.src === image.src) return true;
        // 检查 src 是否包含 image.id（文件名）
        if (img.src.includes(image.id)) return true;
        // 检查 image.src 是否包含 img.id（反向匹配）
        if (image.src.includes(img.id)) return true;
        return false;
      });
      
      if (imageFilter === 'selected') return selected;
      if (imageFilter === 'unselected') return !selected;
      return true;
    });
  };

  const getImageOrder = (imageId: string): number => {
    const index = formData.imagePreviews.findIndex((img) => img.id === imageId);
    return index !== -1 ? index + 1 : 0;
  };

  const handleSectionToggle = (index: number, field: keyof ProjectFormData['customInfoSections'][number], value: string | boolean) => {
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

  const handleRemoveSection = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      customInfoSections: prev.customInfoSections.filter((_, i) => i !== index),
    }));
  };

  const handleVisibilityChange = (field: keyof Project['visibility'], value: boolean) => {
    setVisibility(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 快速切換所有可見性
  const toggleAllVisibility = () => {
    const allVisible = Object.values(visibility).every(v => v);
    
    if (allVisible) {
      // 全部可見 -> 全部隱藏（但記住當前狀態）
      setLastVisibilityState(visibility);
      const allHidden = Object.keys(visibility).reduce((acc, key) => {
        acc[key as keyof Project['visibility']] = false;
        return acc;
      }, {} as Project['visibility']);
      setVisibility(allHidden);
    } else {
      // 不是全部可見 -> 恢復上次狀態或全部顯示
      if (lastVisibilityState) {
        setVisibility(lastVisibilityState);
        setLastVisibilityState(null);
      } else {
        const allVisible = Object.keys(visibility).reduce((acc, key) => {
          acc[key as keyof Project['visibility']] = true;
          return acc;
        }, {} as Project['visibility']);
        setVisibility(allVisible);
      }
    }
  };

  // 处理图片上传完成
  const handleImageUploadComplete = async (uploadedImageIds: string[]) => {
    // 刷新图片列表
    try {
      const password = getRememberedPassword();
      if (!password) return;

      const response = await fetch('/api/images', {
        headers: {
          'x-admin-password': password,
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      const galleryImages: GalleryImage[] = (data.files || []).map((file: StorageImage) => ({
        id: file.name,
        title: (file.originalFilename || file.name).replace(/\.[^/.]+$/, ''),
        src: file.url,
      }));

      setImageGallery(galleryImages);

      // 自动勾选新上传的图片
      uploadedImageIds.forEach(imageId => {
        const image = galleryImages.find(img => img.id === imageId);
        if (image && !formData.imagePreviews.some(img => img.id === imageId)) {
          setFormData((prev) => ({
            ...prev,
            imagePreviews: [...prev.imagePreviews, { ...image }],
          }));
        }
      });

      // 成功后隐藏上传区域
      setShowImageUploader(false);
      alert(`成功上传 ${uploadedImageIds.length} 张图片并自动勾选`);
    } catch (error) {
      console.error('刷新图片列表失败:', error);
    }
  };

  // 双击开始编辑图片名称
  const handleImageDoubleClick = (image: GalleryImage) => {
    setEditingImageId(image.id);
    setEditingImageTitle(image.title);
  };

  // 保存图片名称
  const handleSaveImageTitle = async (imageId: string) => {
    if (!editingImageTitle.trim() || editingImageTitle === imageGallery.find(img => img.id === imageId)?.title) {
      setEditingImageId(null);
      return;
    }

    try {
      const password = getRememberedPassword();
      if (!password) {
        alert('无法获取管理员密码');
        return;
      }

      const response = await fetch('/api/images/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          oldFilename: imageId,
          newFilename: editingImageTitle,
          updateReferences: true,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`图片已重命名，已更新 ${data.projectsUpdated} 个专案的引用`);
        
        // 刷新图片列表
        const imgResponse = await fetch('/api/images', {
          headers: {
            'x-admin-password': password,
          },
        });

        if (imgResponse.ok) {
          const imgData = await imgResponse.json();
          const galleryImages: GalleryImage[] = (imgData.files || []).map((file: StorageImage) => ({
            id: file.name,
            title: (file.originalFilename || file.name).replace(/\.[^/.]+$/, ''),
            src: file.url,
          }));
          setImageGallery(galleryImages);

          // 更新已选中图片的信息
          setFormData((prev) => ({
            ...prev,
            imagePreviews: prev.imagePreviews.map(img => {
              const updated = galleryImages.find(g => g.id === img.id);
              return updated ? { ...updated } : img;
            }),
          }));
        }

        setEditingImageId(null);
      } else {
        alert('重命名失败: ' + (data.error || '未知错误'));
      }
    } catch (error: any) {
      alert('重命名失败: ' + error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal 內容 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-card rounded-2xl shadow-2xl animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">編輯專案</h2>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Form Content - 可滾動 */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* 基本資訊 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary-500 rounded-full"></div>
                  基本資訊
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleInputChange('hidden', !formData.hidden)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all hover:scale-105 ${
                      formData.hidden
                        ? 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                        : 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                    } hover:shadow-md`}
                    title={formData.hidden ? "訪客無法看到此項目（各區域顯隱設定不變）" : "訪客可以看到此項目"}
                  >
                    {formData.hidden ? (
                      <>
                        <EyeSlashIcon className="h-4 w-4" />
                        <span>隱藏項目</span>
                      </>
                    ) : (
                      <>
                        <EyeIcon className="h-4 w-4" />
                        <span>顯示項目</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={toggleAllVisibility}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all hover:scale-105 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300 hover:shadow-md"
                    title={Object.values(visibility).every(v => v) ? "隱藏全部區域" : "顯示全部區域"}
                  >
                    {Object.values(visibility).every(v => v) ? (
                      <>
                        <EyeSlashIcon className="h-4 w-4" />
                        <span>全部隱藏</span>
                      </>
                    ) : (
                      <>
                        <EyeIcon className="h-4 w-4" />
                        <span>全部顯示</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* 專案名稱 */}
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      專案名稱 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.dateAndFileName}
                      onChange={(e) => handleInputChange('dateAndFileName', e.target.value)}
                      className="input"
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

                {/* 說明 */}
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-2">
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

                {/* 類別 */}
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
            </div>

            {/* 連結資訊 */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                連結資訊
              </h3>
              
              <div className="space-y-4">
                {/* GitHub */}
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

                {/* Vercel */}
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-2">Vercel 連結</label>
                    <input
                      type="url"
                      value={formData.vercel || ''}
                      onChange={(e) => handleInputChange('vercel', e.target.value)}
                      className="input"
                      placeholder="https://vercel.app/..."
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

                {/* 部署平台 */}
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

                {/* 本地路徑 */}
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-2">本地路徑</label>
                    <input
                      type="text"
                      value={formData.path || ''}
                      onChange={(e) => handleInputChange('path', e.target.value)}
                      className="input"
                      placeholder="E:\Projects\..."
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
            </div>

            {/* 圖片設定 */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <div className="w-1 h-5 bg-purple-500 rounded-full"></div>
                  圖片預覽
                </h3>
                <button
                  type="button"
                  onClick={() => setShowImageUploader(!showImageUploader)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all hover:scale-105 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:shadow-md"
                >
                  <ArrowUpTrayIcon className="h-4 w-4" />
                  {showImageUploader ? '关闭上传' : '上传图片'}
                </button>
              </div>

              {/* 图片上传区域（可折叠） */}
              {showImageUploader && (
                <div className="bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-900/20 dark:to-purple-800/10 border border-purple-200 dark:border-purple-700/50 rounded-xl p-4">
                  <InlineImageUploader
                    adminPassword={getRememberedPassword() || ''}
                    onUploadComplete={handleImageUploadComplete}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  已選擇 {formData.imagePreviews.length} 張圖片
                </span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <input
                        type="radio"
                        value="single"
                        checked={formData.imagePreviewMode === 'single'}
                        onChange={(e) => handleInputChange('imagePreviewMode', e.target.value)}
                        className="form-radio"
                      />
                      單張切換
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <input
                        type="radio"
                        value="grid"
                        checked={formData.imagePreviewMode === 'grid'}
                        onChange={(e) => handleInputChange('imagePreviewMode', e.target.value)}
                        className="form-radio"
                      />
                      多張並列
                    </label>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 border border-muted/60">
                💡 <strong>選擇模式說明：</strong>「單張切換」會顯示單張圖片，訪客可點擊或使用按鈕切換；「多張並列」會同時展開所有選中的圖片。
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
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
                            ? 'border-primary-400 bg-primary-50/30 dark:border-primary-500 dark:bg-primary-500/10 ring-2 ring-primary-300 dark:ring-primary-600'
                            : 'border-border hover:border-primary-300 dark:hover:border-primary-600'
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
                        <div className="p-2 bg-card" onClick={(e) => e.stopPropagation()}>
                          {editingImageId === image.id ? (
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={editingImageTitle}
                                onChange={(e) => setEditingImageTitle(e.target.value)}
                                onBlur={() => handleSaveImageTitle(image.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveImageTitle(image.id);
                                  } else if (e.key === 'Escape') {
                                    setEditingImageId(null);
                                  }
                                }}
                                className="w-full px-1.5 py-0.5 text-xs border rounded dark:bg-gray-800"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                              <p className="text-[9px] text-muted-foreground">
                                按 Enter 保存，Esc 取消
                              </p>
                            </div>
                          ) : (
                            <div
                              className="text-xs font-medium text-foreground line-clamp-2 cursor-text hover:text-primary-600 transition-colors"
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                handleImageDoubleClick(image);
                              }}
                              title="双击编辑名称"
                            >
                              {image.title}
                              <PencilIcon className="inline-block w-3 h-3 ml-1 opacity-0 group-hover:opacity-50 transition-opacity" />
                            </div>
                          )}
                          {image.description && !editingImageId && (
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
            </div>

            {/* 註解資訊 */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <div className="w-1 h-5 bg-green-500 rounded-full"></div>
                註解資訊
              </h3>
              
              <div className="space-y-4">
                {/* 一般註解 */}
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      一般註解 <span className="text-xs text-muted-foreground">(訪客可見)</span>
                    </label>
                    <textarea
                      value={formData.publicNote || ''}
                      onChange={(e) => handleInputChange('publicNote', e.target.value)}
                      className="textarea"
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

                {/* 狀態備註 */}
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-2">狀態備註</label>
                    <textarea
                      value={formData.statusNote || ''}
                      onChange={(e) => handleInputChange('statusNote', e.target.value)}
                      className="textarea"
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

                {/* 開發者註解 */}
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">
                      開發者註解 <span className="text-xs text-orange-500">(僅管理員可見)</span>
                    </label>
                    <textarea
                      value={formData.developerNote || ''}
                      onChange={(e) => handleInputChange('developerNote', e.target.value)}
                      className="textarea bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30"
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
            </div>

            {/* 自訂資訊區塊 */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <div className="w-1 h-5 bg-cyan-500 rounded-full"></div>
                自訂資訊區塊
              </h3>

              <div className="space-y-3">
                {formData.customInfoSections.map((section, index) => (
                  <div key={section.id} className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">區塊 {index + 1}</h4>
                      <div className="flex items-center gap-2">
                        <ToggleControl
                          checked={section.visible}
                          onChange={(checked) => handleSectionToggle(index, 'visible', checked)}
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
                        <label className="text-xs font-medium text-muted-foreground">標題</label>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => handleSectionToggle(index, 'title', e.target.value)}
                          className="input mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">類型</label>
                        <select
                          value={section.type}
                          onChange={(e) => handleSectionToggle(index, 'type', e.target.value as 'text' | 'url')}
                          className="input mt-1"
                        >
                          <option value="text">文本</option>
                          <option value="url">網址</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="text-xs font-medium text-muted-foreground">內容</label>
                      <textarea
                        value={section.content}
                        onChange={(e) => handleSectionToggle(index, 'content', e.target.value)}
                        className="textarea mt-1"
                        rows={section.type === 'url' ? 2 : 3}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-dashed border-border/60 p-4">
                <h4 className="text-sm font-semibold text-foreground">新增區塊</h4>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">標題</label>
                    <input
                      type="text"
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      className="input mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">類型</label>
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
                  <label className="text-xs font-medium text-muted-foreground">內容</label>
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

            {/* 可見性統計 */}
            <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-200/50 dark:border-blue-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <EyeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-bold text-blue-900 dark:text-blue-100">可見性統計</span>
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                {Object.values(visibility).filter(Boolean).length} / {Object.keys(visibility).length} 個欄位對訪客可見
              </div>
            </div>
          </form>

          {/* Footer - 固定在底部 */}
          <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-6"
              disabled={saving}
            >
              取消
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="btn-primary px-6 relative"
              disabled={saving}
            >
              {saving && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </div>
              )}
              <span className={saving ? 'invisible' : ''}>💾 儲存更改</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

