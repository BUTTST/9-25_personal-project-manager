'use client';

import { useState, useEffect } from 'react';
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
import { XMarkIcon, EyeIcon, EyeSlashIcon, PlusIcon, TrashIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { imageGallery } from '@/config/image-gallery';

interface EditProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProject: Project) => void;
}

export function EditProjectModal({ project, isOpen, onClose, onSave }: EditProjectModalProps) {
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
        path: project.path || '',
        statusNote: project.statusNote || '',
        publicNote: project.publicNote || '',
        developerNote: project.developerNote || '',
        imagePreviews: project.imagePreviews || [],
        imagePreviewMode: project.imagePreviewMode,
        customInfoSections: project.customInfoSections || [],
      });
      setVisibility(ensureProjectVisibility(project.visibility));
    }
  }, [isOpen, project]);

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
                <button
                  type="button"
                  onClick={toggleAllVisibility}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all hover:scale-105 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300 hover:shadow-md"
                  title={Object.values(visibility).every(v => v) ? "隱藏全部項目" : "顯示全部項目"}
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
                      <option value="important">［重要］</option>
                      <option value="secondary">［次］</option>
                      <option value="practice">［子實踐］</option>
                      <option value="single-doc">［單檔專案］</option>
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
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <div className="w-1 h-5 bg-purple-500 rounded-full"></div>
                圖片預覽
              </h3>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  已選擇 {formData.imagePreviews.length} 張圖片
                </span>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <input
                      type="radio"
                      value="single"
                      checked={formData.imagePreviewMode === 'single'}
                      onChange={(e) => handleInputChange('imagePreviewMode', e.target.value)}
                    />
                    單張切換
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
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

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {imageGallery.map((image) => {
                  const selected = formData.imagePreviews.some((img) => img.id === image.id);
                  return (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => handleImageToggle(image.id)}
                      className={`relative rounded-lg border p-3 text-left text-sm transition-all ${
                        selected
                          ? 'border-primary-400 bg-primary-50 dark:border-primary-500 dark:bg-primary-500/10'
                          : 'border-border hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <PhotoIcon className={`h-6 w-6 ${selected ? 'text-primary-500' : 'text-muted-foreground'}`} />
                        <div className="flex-1">
                          <div className="font-medium text-foreground line-clamp-1">{image.title}</div>
                          <div className="text-xs text-muted-foreground">{image.description || image.id}</div>
                        </div>
                      </div>
                      {selected && (
                        <span className="absolute right-2 top-2 rounded-full bg-primary-500 px-2 py-0.5 text-[10px] font-medium text-white">
                          選用中
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 註解資訊 */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <div className="w-1 h-5 bg-green-500 rounded-full"></div>
                註解資訊
              </h3>
              
              <div className="space-y-4">
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

