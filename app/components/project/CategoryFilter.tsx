'use client';

import { Project, CategoryDisplayName } from '@/types';

interface CategoryFilterProps {
  value: string;
  onChange: (category: string) => void;
}

const categoryOptions: { value: string; label: string; color: string }[] = [
  { value: 'all', label: '全部', color: 'text-gray-600' },
  { value: 'important', label: '［重要］', color: 'text-red-600' },
  { value: 'secondary', label: '［次］', color: 'text-blue-600' },
  { value: 'practice', label: '［子實踐］', color: 'text-yellow-600' },
  { value: 'completed', label: '［已完成］', color: 'text-green-600' },
  { value: 'abandoned', label: '［已捨棄］', color: 'text-gray-500' }
];

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input appearance-none pr-10 cursor-pointer"
      >
        {categoryOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {/* 自定義箭頭 */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
        <svg
          className="h-4 w-4 fill-current"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
    </div>
  );
}
