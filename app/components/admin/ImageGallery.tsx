/**
 * 圖片庫元件
 * 顯示、編輯、刪除圖片
 */

'use client';

import { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface ImageFile {
  name: string;
  url: string;
  size: number;
  created_at: string;
  updated_at: string;
}

interface ImageGalleryProps {
  adminPassword: string;
  onRefresh?: boolean;
}

export default function ImageGallery({ adminPassword, onRefresh }: ImageGalleryProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [newFilename, setNewFilename] = useState('');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

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

  // 搜尋過濾
  const filteredImages = images.filter((img) =>
    img.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 開始編輯檔名
  const startEditing = (filename: string) => {
    setEditingImage(filename);
    setNewFilename(filename);
  };

  // 保存新檔名
  const saveRename = async (oldFilename: string) => {
    if (!newFilename || newFilename === oldFilename) {
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
          updateReferences: true,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(
          `重命名成功！\n` +
          `新檔名：${newFilename}\n` +
          `已更新 ${data.projectsUpdated} 個專案的引用`
        );
        loadImages();
        setEditingImage(null);
      } else {
        alert(`重命名失敗：${data.error}`);
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

  if (loading) {
    return <div className="text-center py-12">載入中...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 搜尋和批量操作 */}
      <div className="flex items-center justify-between gap-4">
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

        {selectedImages.size > 0 && (
          <button
            onClick={deleteBatch}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            刪除選中的 {selectedImages.size} 個
          </button>
        )}
      </div>

      {/* 圖片網格 */}
      {filteredImages.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchTerm ? '沒有符合搜尋的圖片' : '尚無圖片'}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredImages.map((image) => (
            <div
              key={image.name}
              className="group relative border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* 選擇框 */}
              <input
                type="checkbox"
                checked={selectedImages.has(image.name)}
                onChange={() => toggleSelect(image.name)}
                className="absolute top-2 left-2 z-10 w-5 h-5 cursor-pointer"
              />

              {/* 圖片預覽 */}
              <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 圖片資訊 */}
              <div className="p-3 bg-white dark:bg-gray-700">
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
                      title={image.name}
                    >
                      {image.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(image.size / 1024).toFixed(1)} KB
                    </p>
                  </>
                )}
              </div>

              {/* 操作按鈕 */}
              {editingImage !== image.name && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
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
          ))}
        </div>
      )}

      {/* 統計資訊 */}
      <div className="text-sm text-gray-500 text-center">
        共 {images.length} 個圖片
        {searchTerm && filteredImages.length !== images.length && (
          <span> • 顯示 {filteredImages.length} 個</span>
        )}
      </div>
    </div>
  );
}

