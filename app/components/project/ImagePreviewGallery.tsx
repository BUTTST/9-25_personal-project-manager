'use client';

import Image from 'next/image';
import { useState, useMemo } from 'react';
import { ImagePreview, ImagePreviewDisplayMode } from '@/types';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface ImagePreviewGalleryProps {
  images: ImagePreview[];
  mode: ImagePreviewDisplayMode;
  collapsed: boolean;
  onSelectImage?: (image: ImagePreview) => void;
}

export function ImagePreviewGallery({ images, mode, collapsed, onSelectImage }: ImagePreviewGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const visibleImages = useMemo(() => images.filter((img) => !!img?.src), [images]);

  if (collapsed) {
    return null;
  }

  if (visibleImages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        尚未配置圖片預覽。
      </div>
    );
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + visibleImages.length) % visibleImages.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % visibleImages.length);
  };

  const handleImageClick = () => {
    if (visibleImages.length > 1) {
      handleNext();
    }
  };

  // 單張切換模式
  if (mode === 'single') {
    const currentImage = visibleImages[currentIndex];

    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleImageClick}
          className="group relative w-full overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-muted/60 to-muted/30 shadow-inner transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          title={visibleImages.length > 1 ? '點擊或按右鍵切換下一張' : ''}
        >
          <Image
            src={currentImage.thumbnail || currentImage.src}
            alt={currentImage.title || '專案圖片'}
            width={800}
            height={450}
            className="h-auto w-full object-cover"
            priority={false}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-black/0 px-4 py-3 text-left">
            <div className="text-sm font-semibold text-white">
              {currentImage.title || '專案圖片'}
            </div>
            {currentImage.description && (
              <div className="text-xs text-white/80 line-clamp-1 whitespace-pre-wrap">
                {currentImage.description}
              </div>
            )}
          </div>

          {/* 圖片計數 */}
          <div className="absolute top-3 right-3 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">
            {currentIndex + 1} / {visibleImages.length}
          </div>

          {/* 導航箭頭 - 只在有多張圖片時顯示 */}
          {visibleImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 backdrop-blur-sm p-2 text-white hover:bg-black/60 transition-all active:scale-90"
                title="上一張"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 backdrop-blur-sm p-2 text-white hover:bg-black/60 transition-all active:scale-90"
                title="下一張"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </>
          )}
        </button>

        {/* 導航提示 */}
        {visibleImages.length > 1 && (
          <div className="text-xs text-muted-foreground text-center bg-muted/30 rounded-lg py-2 px-3">
            💡 提示：點擊圖片或使用左右箭頭按鈕切換圖片
          </div>
        )}
      </div>
    );
  }

  // 多張同時展開模式（grid）
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visibleImages.map((image) => (
          <button
            key={image.id}
            type="button"
            onClick={() => onSelectImage?.(image)}
            className="group relative overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Image
              src={image.thumbnail || image.src}
              alt={image.title || '專案圖片'}
              width={600}
              height={340}
              className="h-auto w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-black/0 px-4 py-3 text-left">
              <div className="text-sm font-semibold text-white">
                {image.title || '專案圖片'}
              </div>
              {image.description && (
                <div className="text-xs text-white/80 line-clamp-2 whitespace-pre-wrap">
                  {image.description}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
