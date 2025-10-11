<!-- ba8eabc1-0a47-4c74-8b87-75004dfe19a6 297d8059-8727-40e2-834a-1a0cd52752d9 -->
# 首頁UI自訂系統實作計畫

## 1. 擴展資料型別定義

**檔案：** `app/types/index.ts`

新增以下介面定義：

```typescript
// UI 顯示設定介面
export interface UIDisplaySettings {
  filters: FilterConfig[];      // 篩選器配置
  statistics: StatisticConfig[]; // 統計區塊配置
}

export interface FilterConfig {
  id: string;                    // 唯一識別碼（如：'all', 'important'）
  enabled: boolean;              // 是否啟用顯示
  order: number;                 // 排序順序
  label?: string;                // 自訂標籤（選用）
}

export interface StatisticConfig {
  id: string;                    // 唯一識別碼
  type: StatisticType;           // 統計類型
  enabled: boolean;              // 是否啟用顯示
  order: number;                 // 排序順序
  label?: string;                // 自訂標籤
}

export type StatisticType = 
  | 'totalProjects'    // 總專案數
  | 'publicProjects'   // 公開專案數
  | 'displayedCount'   // 顯示中
  | 'importantCount'   // 重要專案
  | 'completedCount'   // 已完成
  | 'inProgressCount'  // 進行中（important + secondary + practice）
  | 'readyStatus'      // 準備就緒
  | 'abandonedCount';  // 已捨棄
```

在 `AppSettings` 介面中新增：

```typescript
export interface AppSettings {
  // ... 現有欄位 ...
  uiDisplay?: UIDisplaySettings;  // UI 顯示設定
}
```

---

## 2. 建立預設 UI 設定

**檔案：** `app/lib/blob-storage.ts`

在 `defaultProjectData` 中新增預設 UI 設定：

```typescript
export const defaultProjectData: ProjectData = {
  // ... 現有欄位 ...
  settings: {
    // ... 現有設定 ...
    uiDisplay: {
      filters: [
        { id: 'all', enabled: true, order: 0 },
        { id: 'important', enabled: true, order: 1 },
        { id: 'secondary', enabled: true, order: 2 },
        { id: 'practice', enabled: true, order: 3 },
        { id: 'completed', enabled: true, order: 4 },
        { id: 'abandoned', enabled: true, order: 5 }
      ],
      statistics: [
        { id: 'stat-total', type: 'totalProjects', enabled: true, order: 0, label: '總專案數' },
        { id: 'stat-display', type: 'displayedCount', enabled: true, order: 1, label: '顯示中' }
      ]
    }
  }
};
```

---

## 3. 建立統計計算工具函數

**新檔案：** `app/lib/statistics.ts`

```typescript
import { Project, StatisticType, StatisticConfig } from '@/types';

export function calculateStatistic(
  type: StatisticType,
  allProjects: Project[],
  filteredProjects: Project[],
  isAdmin: boolean,
  isPreviewMode: boolean
): string | number {
  const visibleProjects = (isAdmin && !isPreviewMode) ? allProjects : allProjects.filter(p => 
    p.visibility.description && p.category !== 'abandoned'
  );

  switch (type) {
    case 'totalProjects':
      return (isAdmin && !isPreviewMode) ? allProjects.length : visibleProjects.length;
    
    case 'publicProjects':
      return visibleProjects.length;
    
    case 'displayedCount':
      return filteredProjects.length;
    
    case 'importantCount':
      return visibleProjects.filter(p => p.category === 'important').length;
    
    case 'completedCount':
      return visibleProjects.filter(p => p.category === 'completed').length;
    
    case 'inProgressCount':
      return visibleProjects.filter(p => 
        ['important', 'secondary', 'practice'].includes(p.category)
      ).length;
    
    case 'readyStatus':
      return '✓';
    
    case 'abandonedCount':
      return allProjects.filter(p => p.category === 'abandoned').length;
    
    default:
      return 0;
  }
}

export function getStatisticColor(type: StatisticType): {
  gradient: string;
  border: string;
  icon: string;
} {
  const colorMap = {
    totalProjects: { gradient: 'from-blue-50 to-blue-100/50 dark:from-blue-500/10', border: 'border-blue-200/50 dark:border-blue-500/30', icon: 'text-blue-600 dark:text-blue-400' },
    publicProjects: { gradient: 'from-cyan-50 to-cyan-100/50 dark:from-cyan-500/10', border: 'border-cyan-200/50 dark:border-cyan-500/30', icon: 'text-cyan-600 dark:text-cyan-400' },
    displayedCount: { gradient: 'from-purple-50 to-purple-100/50 dark:from-purple-500/10', border: 'border-purple-200/50 dark:border-purple-500/30', icon: 'text-purple-600 dark:text-purple-400' },
    importantCount: { gradient: 'from-red-50 to-red-100/50 dark:from-red-500/10', border: 'border-red-200/50 dark:border-red-500/30', icon: 'text-red-600 dark:text-red-400' },
    completedCount: { gradient: 'from-green-50 to-green-100/50 dark:from-green-500/10', border: 'border-green-200/50 dark:border-green-500/30', icon: 'text-green-600 dark:text-green-400' },
    inProgressCount: { gradient: 'from-orange-50 to-orange-100/50 dark:from-orange-500/10', border: 'border-orange-200/50 dark:border-orange-500/30', icon: 'text-orange-600 dark:text-orange-400' },
    readyStatus: { gradient: 'from-green-50 to-green-100/50 dark:from-green-500/10', border: 'border-green-200/50 dark:border-green-500/30', icon: 'text-green-600 dark:text-green-400' },
    abandonedCount: { gradient: 'from-gray-50 to-gray-100/50 dark:from-gray-500/10', border: 'border-gray-200/50 dark:border-gray-500/30', icon: 'text-gray-600 dark:text-gray-400' }
  };
  return colorMap[type] || colorMap.totalProjects;
}
```

---

## 4. 建立 UI 設定管理組件

**新檔案：** `app/components/ui/UISettingsPanel.tsx`

實作設定面板組件，包括：

- 拖移排序功能（使用 HTML5 Drag & Drop API）
- 篩選器啟用/停用切換
- 統計項目啟用/停用切換（限制 2-8 個）
- 面板尺寸調整工具
- 儲存按鈕（呼叫 API 保存設定）

參考 `layout-preview.html` 中的實作邏輯，使用 Heroicons 替換表情符號。

---

## 5. 建立動態統計區塊組件

**新檔案：** `app/components/ui/StatisticsGrid.tsx`

```typescript
'use client';

import { StatisticConfig } from '@/types';
import { calculateStatistic, getStatisticColor } from '@/lib/statistics';
import { ChartBarIcon } from '@heroicons/react/24/outline';

interface StatisticsGridProps {
  configs: StatisticConfig[];
  allProjects: Project[];
  filteredProjects: Project[];
  isAdmin: boolean;
  isPreviewMode: boolean;
}

export function StatisticsGrid({ configs, ... }: StatisticsGridProps) {
  const enabledStats = configs.filter(c => c.enabled).sort((a, b) => a.order - b.order);
  const count = enabledStats.length;
  
  // 根據數量決定布局（2列橫向擴展）
  const gridClass = 'grid grid-rows-2 gap-0';
  
  return (
    <div className={gridClass} style={{ 
      gridAutoFlow: 'column', 
      gridAutoColumns: 'minmax(90px, 1fr)' 
    }}>
      {enabledStats.map((config, index) => {
        const value = calculateStatistic(config.type, ...);
        const colors = getStatisticColor(config.type);
        const isFirstRow = index % 2 === 0;
        const needsBorder = ...; // 計算邊框邏輯
        
        return (
          <div key={config.id} className={`bg-gradient-to-br ${colors.gradient} ...`}>
            <ChartBarIcon className={colors.icon} />
            <span>{value}</span>
            <p>{config.label}</p>
          </div>
        );
      })}
    </div>
  );
}
```

---

## 6. 更新首頁實作

**檔案：** `app/page.tsx`

### 6.1 匯入新組件和函數

```typescript
import { UISettingsPanel } from '@/components/ui/UISettingsPanel';
import { StatisticsGrid } from '@/components/ui/StatisticsGrid';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
```

### 6.2 新增狀態管理

```typescript
const [showSettingsPanel, setShowSettingsPanel] = useState(false);
const [uiSettings, setUiSettings] = useState<UIDisplaySettings | null>(null);
```

### 6.3 從 API 載入設定

在 `loadProjects` 函數中：

```typescript
const data = await response.json();
setProjectData(data);
setUiSettings(data.settings.uiDisplay || defaultUISettings);
```

### 6.4 替換篩選器區塊

將靜態的 `CategoryFilter` 替換為動態渲染：

```typescript
{/* 動態分類篩選 */}
<div className="flex flex-wrap gap-2 items-center">
  {uiSettings?.filters
    .filter(f => f.enabled)
    .sort((a, b) => a.order - b.order)
    .map(filterConfig => (
      <FilterButton key={filterConfig.id} config={filterConfig} ... />
    ))
  }
  
  {/* 設定按鈕（僅管理員可見）*/}
  {isAdmin && !isPreviewMode && (
    <button onClick={() => setShowSettingsPanel(true)} className="...">
      <Cog6ToothIcon className="h-5 w-5" />
    </button>
  )}
</div>
```

### 6.5 替換統計區塊

將原本的靜態統計卡片替換為：

```typescript
{projectData && uiSettings && (
  <div className="mb-8">
    <StatisticsGrid 
      configs={uiSettings.statistics}
      allProjects={projectData.projects}
      filteredProjects={filteredProjects}
      isAdmin={isAdmin}
      isPreviewMode={isPreviewMode}
    />
  </div>
)}
```

### 6.6 新增設定面板

```typescript
{isAdmin && !isPreviewMode && showSettingsPanel && (
  <UISettingsPanel 
    settings={uiSettings}
    onClose={() => setShowSettingsPanel(false)}
    onSave={handleSaveSettings}
  />
)}
```

---

## 7. 建立設定儲存 API

**新檔案：** `app/api/settings/ui-display/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { readProjectData, writeProjectData } from '@/lib/blob-storage';
import { UIDisplaySettings } from '@/types';

export async function PUT(request: NextRequest) {
  try {
    const password = request.headers.get('x-admin-password');
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }
    
    const newSettings: UIDisplaySettings = await request.json();
    const data = await readProjectData();
    
    data.settings.uiDisplay = newSettings;
    await writeProjectData(data);
    
    return NextResponse.json({ success: true, settings: newSettings });
  } catch (error) {
    return NextResponse.json({ error: '儲存失敗' }, { status: 500 });
  }
}
```

---

## 8. 更新樣式與動畫

**檔案：** `app/globals.css`

新增拖移相關樣式和統計區塊的橫向擴展樣式。

---

## 9. 更新 README

**檔案：** `README.md`

在「功能特色」章節中新增：

- 可自訂首頁篩選器和統計區塊
- 拖移排序功能
- 動態統計資料計算

---

## 10. Git 提交準備

完成所有實作後：

1. 執行 `git status --short` 檢視變更
2. 執行 `git add .` 將所有變更加入暫存
3. 準備推送訊息：
```
feat: 實作首頁UI自訂系統

- 新增可拖移排序的篩選器和統計區塊
- 支援動態統計資料計算（8種統計類型）
- 設定持久化存儲於 Vercel Blob
- 設定面板僅管理員可見，訪客可見調整後效果
- 使用 Heroicons 保持精美的視覺設計
- 統計區塊採用 2 列橫向擴展布局（最多 8 個）

主要變更：
- types/index.ts: 新增 UIDisplaySettings 相關型別定義
- lib/statistics.ts: 統計計算工具函數
- lib/blob-storage.ts: 新增預設 UI 設定
- components/ui/UISettingsPanel.tsx: 設定面板組件
- components/ui/StatisticsGrid.tsx: 動態統計區塊組件
- page.tsx: 整合新 UI 系統
- api/settings/ui-display/route.ts: 設定儲存 API
```

### To-dos

- [ ] 更新 README 文檔和截圖