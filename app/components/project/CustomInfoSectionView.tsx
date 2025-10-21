import Link from 'next/link';
import { CustomInfoSection } from '@/types';
import { LinkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface CustomInfoSectionViewProps {
  sections: CustomInfoSection[];
}

export function CustomInfoSectionView({ sections }: CustomInfoSectionViewProps) {
  const visibleSections = sections?.filter((section) => section.visible) ?? [];

  if (visibleSections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {visibleSections.map((section) => (
        <div
          key={section.id}
          className="rounded-xl border border-border/60 bg-muted/30 p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
            {section.type === 'url' ? (
              <LinkIcon className="h-4 w-4 text-primary-500" />
            ) : (
              <InformationCircleIcon className="h-4 w-4 text-primary-500" />
            )}
            <span>{section.title || '自訂資訊'}</span>
          </div>
          <div className="mt-2 text-sm text-foreground/70">
            {section.type === 'url' ? (
              <Link
                href={section.content}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-500 hover:underline"
              >
                {section.content}
              </Link>
            ) : (
              <span className="whitespace-pre-wrap leading-relaxed">
                {section.content}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
