/**
 * 圖片管理頁面
 * 路徑：/admin/images
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/app/components/admin/ImageUploader';
import ImageGallery from '@/app/components/admin/ImageGallery';

export default function ImagesPage() {
  const router = useRouter();
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // 檢查本地儲存的密碼
    const stored = localStorage.getItem('adminPassword');
    if (stored) {
      setAdminPassword(stored);
      setIsAuthenticated(true);
    } else {
      // 未登入，返回管理後台首頁
      router.push('/admin');
    }
  }, [router]);

  const handleUploadComplete = () => {
    // 上傳完成後重新載入圖片列表
    setRefreshKey((prev) => prev + 1);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">驗證中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                圖片管理
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                管理專案截圖和預覽圖片
              </p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              返回後台
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* 上傳區塊 */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4">上傳圖片</h2>
            <ImageUploader
              adminPassword={adminPassword}
              onUploadComplete={handleUploadComplete}
            />
          </section>

          {/* 圖片庫區塊 */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4">圖片庫</h2>
            <ImageGallery
              adminPassword={adminPassword}
              onRefresh={refreshKey > 0}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

