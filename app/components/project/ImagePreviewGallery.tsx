import Image from 'next/image';
import { useMemo } from 'react';
import { ImagePreview, ImagePreviewDisplayMode } from '@/types';

interface ImagePreviewGalleryProps {
  images: ImagePreview[];
  mode: ImagePreviewDisplayMode;
  collapsed: boolean;
  onSelectImage?: (image: ImagePreview) => void;
}

export function ImagePreviewGallery({ images, mode, collapsed, onSelectImage }: ImagePreviewGalleryProps) {
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

  if (mode === 'single') {
    const [firstImage] = visibleImages;

    return (
      <button
        type="button"
        onClick={() => onSelectImage?.(firstImage)}
        className="group relative w-full overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-muted/60 to-muted/30 shadow-inner transition-transform hover:scale-[1.01]"
      >
        <Image
          src={firstImage.thumbnail || firstImage.src}
          alt={firstImage.title || '專案圖片'}
          width={800}
          height={450}
          className="h-auto w-full object-cover"
          priority={false}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-black/0 px-4 py-3 text-left">
          <div className="text-sm font-semibold text-white">
            {firstImage.title || '專案圖片'}
          </div>
          {firstImage.description && (
            <div className="text-xs text-white/80 line-clamp-2">
              {firstImage.description}
            </div>
          )}
        </div>
        {visibleImages.length > 1 && (
          <div className="absolute top-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
            還有 {visibleImages.length - 1} 張
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {visibleImages.map((image) => (
        <button
          type="button"
          key={image.id}
          onClick={() => onSelectImage?.(image)}
          className="group relative overflow-hidden rounded-xl border border-border/60 bg-card transition-transform hover:scale-[1.01]"
        >
          <Image
            src={image.thumbnail || image.src}
            alt={image.title || '專案圖片'}
            width={600}
            height={340}
            className="h-auto w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-black/0 px-4 py-3 text-left">
            <div className="text-sm font-semibold text-white">
              {image.title || '專案圖片'}
            </div>
            {image.description && (
              <div className="text-xs text-white/80 line-clamp-2">
                {image.description}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
