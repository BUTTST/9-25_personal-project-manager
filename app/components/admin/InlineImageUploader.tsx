/**
 * 内嵌图片上传器组件
 * 用于在新增/编辑专案页面内嵌显示，上传后自动勾选图片
 */

'use client';

import { useState, useRef } from 'react';
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface InlineImageUploaderProps {
  adminPassword: string;
  onUploadComplete: (uploadedImageIds: string[]) => void; // 返回上传成功的图片ID列表
}

interface UploadProgress {
  filename: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  storedFilename?: string; // 存储在Supabase中的文件名（图片ID）
}

export default function InlineImageUploader({ adminPassword, onUploadComplete }: InlineImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理拖拽事件
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

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  // 移除文件
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 上传文件
  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const progress: UploadProgress[] = files.map((file) => ({
      filename: file.name,
      status: 'pending',
    }));
    setUploadProgress(progress);

    const uploadedIds: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // 更新状态为上传中
      setUploadProgress((prev) =>
        prev.map((p, idx) =>
          idx === i ? { ...p, status: 'uploading' } : p
        )
      );

      // 上传到 Supabase
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
          // 上传成功
          setUploadProgress((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? { 
                    ...p, 
                    status: 'success',
                    storedFilename: result.storedFilename
                  }
                : p
            )
          );
          
          // 收集上传成功的图片ID
          if (result.storedFilename) {
            uploadedIds.push(result.storedFilename);
          }
        } else {
          // 上传失败
          setUploadProgress((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? { ...p, status: 'error', error: result.error || '上传失败' }
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
    
    // 通知父组件上传完成，传递上传成功的图片ID
    if (uploadedIds.length > 0) {
      onUploadComplete(uploadedIds);
    }

    // 3秒后清除上传进度
    setTimeout(() => {
      setUploadProgress([]);
    }, 3000);
  };

  return (
    <div className="space-y-3">
      {/* 精简的拖拽上传区域 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragging
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-border hover:border-primary-300 dark:hover:border-primary-600 bg-muted/30'
          }
        `}
      >
        <ArrowUpTrayIcon className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-foreground font-medium">
          拖拽图片到此处，或点击上传
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          上传后将自动勾选图片
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

      {/* 已选择的文件列表 */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">
              已选择 {files.length} 个文件
            </h4>
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isUploading ? '上传中...' : '开始上传'}
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-card rounded-lg border border-border"
              >
                <div className="flex items-center space-x-2">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                  <div>
                    <p className="text-xs font-medium text-foreground">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  disabled={isUploading}
                  className="text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 上传进度 */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">上传进度</h4>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {uploadProgress.map((progress, index) => (
              <div
                key={index}
                className="p-2 bg-card rounded-lg border border-border"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs truncate flex-1 text-foreground">{progress.filename}</span>
                  <span className={`text-xs ml-2 font-medium ${
                    progress.status === 'success' ? 'text-green-600' :
                    progress.status === 'error' ? 'text-red-600' :
                    progress.status === 'uploading' ? 'text-blue-600' :
                    'text-muted-foreground'
                  }`}>
                    {progress.status === 'success' && '✅ 已自动勾选'}
                    {progress.status === 'error' && `❌ ${progress.error}`}
                    {progress.status === 'uploading' && '⏳ 上传中...'}
                    {progress.status === 'pending' && '⏸️ 等待中'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

