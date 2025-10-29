/**
 * 圖片上傳器元件
 * 支援拖拽上傳、多檔案選擇、上傳進度顯示
 */

'use client';

import { useState, useRef } from 'react';
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ImageUploaderProps {
  onUploadComplete?: () => void;
  adminPassword: string;
}

interface UploadProgress {
  filename: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
}

export default function ImageUploader({ onUploadComplete, adminPassword }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 處理拖拽事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/')
    );

    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  // 處理檔案選擇
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  // 移除檔案
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 上傳檔案
  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const progress: UploadProgress[] = files.map((file) => ({
      filename: file.name,
      status: 'pending',
    }));
    setUploadProgress(progress);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // 更新狀態為上傳中
      setUploadProgress((prev) =>
        prev.map((p, idx) =>
          idx === i ? { ...p, status: 'uploading' } : p
        )
      );

      // 上傳到 Supabase
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/images', {
          method: 'POST',
          headers: {
            'x-admin-password': adminPassword,
          },
          body: formData,
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // 上傳成功
          setUploadProgress((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? { ...p, status: 'success', url: result.url }
                : p
            )
          );
        } else {
          // 上傳失敗
          setUploadProgress((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? { ...p, status: 'error', error: result.error || '上傳失敗' }
                : p
            )
          );
        }
      } catch (error: any) {
        setUploadProgress((prev) =>
          prev.map((p, idx) =>
            idx === i
              ? { ...p, status: 'error', error: error.message }
              : p
          )
        );
      }
    }

    setIsUploading(false);
    setFiles([]);
    
    // 通知父元件上傳完成
    if (onUploadComplete) {
      onUploadComplete();
    }
  };

  return (
    <div className="space-y-4">
      {/* 拖拽上傳區域 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
          }
        `}
      >
        <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          拖拽圖片到此處，或點擊選擇檔案
        </p>
        <p className="mt-1 text-xs text-gray-500">
          支援 JPG、PNG、GIF、WEBP 格式
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* 已選擇的檔案列表 */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              已選擇 {files.length} 個檔案
            </h3>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isUploading ? '上傳中...' : '開始上傳'}
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  disabled={isUploading}
                  className="text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 上傳進度 */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">上傳進度</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uploadProgress.map((progress, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border"
              >
                <span className="text-sm truncate flex-1">{progress.filename}</span>
                <span className={`text-xs ml-2 ${
                  progress.status === 'success' ? 'text-green-600' :
                  progress.status === 'error' ? 'text-red-600' :
                  progress.status === 'uploading' ? 'text-blue-600' :
                  'text-gray-500'
                }`}>
                  {progress.status === 'success' && '✅ 成功'}
                  {progress.status === 'error' && `❌ ${progress.error}`}
                  {progress.status === 'uploading' && '⏳ 上傳中...'}
                  {progress.status === 'pending' && '⏸️ 等待中'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

