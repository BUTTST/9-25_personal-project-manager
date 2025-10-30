/**
 * 圖片庫元件
 * 顯示、編輯、刪除圖片
 */

'use client';

import { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, MagnifyingGlassIcon, Squares2X2Icon, QueueListIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface ImageFile {
  name: string;
  originalFilename?: string;  // 原始檔名（可能含中文）
  url: string;
  size: number;
  created_at: string;
  updated_at: string;
}

interface ImageGalleryProps {
  adminPassword: string;
  onRefresh?: boolean;
}

type ViewMode = 'grid' | 'list-single' | 'list-double';

export default function ImageGallery({ adminPassword, onRefresh }: ImageGalleryProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [newFilename, setNewFilename] = useState('');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [previewTimer, setPreviewTimer] = useState<NodeJS.Timeout | null>(null);

  // 載入圖片列表
  const loadImages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/images', {
        headers: {
          'x-admin-password': adminPassword,
        },
      });

      const data = await response.json();
      if (response.ok && data.files) {
        setImages(data.files);
      }
    } catch (error) {
      console.error('載入圖片失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, [onRefresh]);

  // 搜尋過濾 - 同時搜索原始檔名和存儲檔名
  const filteredImages = images.filter((img) =>
    (img.originalFilename || img.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    img.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 開始編輯檔名 - 使用原始檔名作為初始值
  const startEditing = (filename: string) => {
    setEditingImage(filename);
    const image = images.find(img => img.name === filename);
    setNewFilename(image?.originalFilename || filename);
  };

  // 全選/取消全選
  const toggleSelectAll = () => {
    if (selectedImages.size === filteredImages.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(filteredImages.map(img => img.name)));
    }
  };

  // 保存新檔名
  const saveRename = async (oldFilename: string) => {
    const image = images.find(img => img.name === oldFilename);
    const currentDisplayName = image?.originalFilename || oldFilename;
    
    if (!newFilename || newFilename === currentDisplayName) {
      setEditingImage(null);
      return;
    }

    try {
      const response = await fetch('/api/images/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify({
          oldFilename,
          newFilename,
          renameMode: 'display-only', // ⭐ 預設只更新顯示名稱（支援中文）
          updateReferences: false, // 不需要更新引用（URL 不變）
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(
          `✅ 重命名成功！\n\n` +
          `新顯示名稱：${newFilename}\n` +
          `存儲檔名：${oldFilename}（不變）`
        );
        loadImages();
        setEditingImage(null);
      } else {
        alert(`❌ 重命名失敗：${data.error}`);
      }
    } catch (error: any) {
      alert(`錯誤：${error.message}`);
    }
  };

  // 刪除圖片
  const deleteImage = async (filename: string) => {
    // 先檢查引用
    const checkResponse = await fetch('/api/images/check-references', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': adminPassword,
      },
      body: JSON.stringify({ filename }),
    });

    const checkData = await checkResponse.json();

    if (checkData.referencesCount > 0) {
      const projectNames = checkData.references
        .map((ref: any) => `  • ${ref.name}`)
        .join('\n');
      
      const confirmed = confirm(
        `⚠️ 此圖片被 ${checkData.referencesCount} 個專案使用：\n\n${projectNames}\n\n確定要刪除嗎？`
      );

      if (!confirmed) return;
    } else {
      const confirmed = confirm(`確定要刪除 "${filename}"？`);
      if (!confirmed) return;
    }

    // 執行刪除
    try {
      const response = await fetch('/api/images/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify({
          filename,
          force: true,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('圖片已刪除');
        loadImages();
      } else {
        alert(`刪除失敗：${data.error}`);
      }
    } catch (error: any) {
      alert(`錯誤：${error.message}`);
    }
  };

  // 批量刪除
  const deleteBatch = async () => {
    if (selectedImages.size === 0) return;

    const confirmed = confirm(
      `確定要刪除 ${selectedImages.size} 個圖片？\n\n⚠️ 如果圖片被專案使用，刪除可能導致專案圖片無法顯示。`
    );

    if (!confirmed) return;

    try {
      const response = await fetch('/api/images/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify({
          filenames: Array.from(selectedImages),
          force: true,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`已刪除 ${data.deletedCount} 個圖片`);
        setSelectedImages(new Set());
        loadImages();
      } else {
        alert(`刪除失敗：${data.error}`);
      }
    } catch (error: any) {
      alert(`錯誤：${error.message}`);
    }
  };

  // 切換選擇
  const toggleSelect = (filename: string) => {
    setSelectedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(filename)) {
        newSet.delete(filename);
      } else {
        newSet.add(filename);
      }
      return newSet;
    });
  };

  // 處理按住放大預覽
  const handleMouseDown = (imageUrl: string) => {
    // 設置500ms延遲，只有按住才觸發預覽
    const timer = setTimeout(() => {
      setPreviewImage(imageUrl);
      setIsPreviewActive(true);
    }, 500);
    
    setPreviewTimer(timer);
  };

  const handleMouseUp = () => {
    // 清除定時器
    if (previewTimer) {
      clearTimeout(previewTimer);
      setPreviewTimer(null);
    }
    
    // 如果預覽已激活，則關閉預覽
    if (isPreviewActive) {
      setPreviewImage(null);
      setIsPreviewActive(false);
    }
  };

  const handleMouseLeave = () => {
    // 如果預覽還未激活（還在等待），則取消
    if (previewTimer && !isPreviewActive) {
      clearTimeout(previewTimer);
      setPreviewTimer(null);
    }
    // 注意：如果預覽已激活，不做任何事（等待用戶在Modal上釋放滑鼠）
  };

  if (loading) {
    return <div className="text-center py-12">載入中...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 搜尋、全選和批量操作 */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋圖片..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* 視圖切換 */}
          <div className="flex items-center border rounded-lg dark:border-gray-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-l-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              title="網格視圖"
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list-single')}
              className={`p-2 border-x dark:border-gray-700 ${viewMode === 'list-single' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              title="單排清單"
            >
              <QueueListIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list-double')}
              className={`p-2 rounded-r-lg ${viewMode === 'list-double' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              title="雙排清單"
            >
              <div className="flex gap-0.5">
                <QueueListIcon className="w-4 h-5" />
                <QueueListIcon className="w-4 h-5" />
              </div>
            </button>
          </div>

          {/* 全選按鈕 */}
          <button
            onClick={toggleSelectAll}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 text-sm"
          >
            {selectedImages.size === filteredImages.length && filteredImages.length > 0 ? '取消全選' : '全選'}
          </button>

          {/* 批量刪除 */}
          {selectedImages.size > 0 && (
            <button
              onClick={deleteBatch}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              刪除 {selectedImages.size} 個
            </button>
          )}
        </div>
      </div>

      {/* 圖片顯示區域 */}
      {filteredImages.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchTerm ? '沒有符合搜尋的圖片' : '尚無圖片'}
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
            : viewMode === 'list-single'
            ? 'flex flex-col gap-4'
            : 'grid grid-cols-1 md:grid-cols-2 gap-4'
        }>
          {filteredImages.map((image) => {
            const displayName = image.originalFilename || image.name;
            const isListView = viewMode !== 'grid';
            
            return (
              <div
                key={image.name}
                className={`group relative border rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${
                  isListView ? 'flex items-center' : ''
                }`}
              >
                {/* 選擇框 */}
                <input
                  type="checkbox"
                  checked={selectedImages.has(image.name)}
                  onChange={() => toggleSelect(image.name)}
                  className={`absolute ${isListView ? 'top-4 left-4' : 'top-2 left-2'} z-10 w-5 h-5 cursor-pointer`}
                />

                {/* 圖片預覽 */}
                <div 
                  className={`bg-gray-100 dark:bg-gray-800 relative ${
                    isListView ? 'w-48 h-48 flex-shrink-0' : 'aspect-square'
                  }`}
                  onMouseDown={() => handleMouseDown(image.url)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                  title="按住滑鼠 0.5 秒放大預覽"
                >
                  <img
                    src={image.url}
                    alt={displayName}
                    className="w-full h-full object-cover cursor-pointer"
                  />
                </div>

                {/* 圖片資訊 */}
                <div className={`p-3 bg-white dark:bg-gray-700 ${isListView ? 'flex-1' : ''}`}>
                  {editingImage === image.name ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newFilename}
                        onChange={(e) => setNewFilename(e.target.value)}
                        className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-800"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveRename(image.name)}
                          className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingImage(null)}
                          className="flex-1 px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p
                        className="text-sm font-medium truncate mb-1 cursor-pointer hover:text-blue-600"
                        title={displayName}
                      >
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(image.size / 1024).toFixed(1)} KB
                      </p>
                      {image.originalFilename && image.originalFilename !== image.name && (
                        <p className="text-xs text-gray-400 truncate mt-1" title={image.name}>
                          存儲: {image.name}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* 操作按鈕 */}
                {editingImage !== image.name && (
                  <div className={`absolute ${isListView ? 'top-4 right-4' : 'top-2 right-2'} opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}>
                    <button
                      onClick={() => startEditing(image.name)}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg"
                      title="重命名"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteImage(image.name)}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg"
                      title="刪除"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 統計資訊 */}
      <div className="text-sm text-gray-500 text-center">
        共 {images.length} 個圖片
        {searchTerm && filteredImages.length !== images.length && (
          <span> • 顯示 {filteredImages.length} 個</span>
        )}
      </div>

      {/* 圖片放大預覽 Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={previewImage}
            alt="預覽"
            className="max-w-full max-h-full object-contain"
          />
          <div className="absolute top-4 right-4 text-white text-sm bg-black bg-opacity-50 px-3 py-2 rounded">
            放開滑鼠以關閉預覽
          </div>
        </div>
      )}
    </div>
  );
}

