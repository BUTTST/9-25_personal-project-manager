'use client';

import { useState, useEffect } from 'react';
import { UIDisplaySettings, FilterConfig, StatisticConfig } from '@/types';
import { 
  XMarkIcon, 
  Cog6ToothIcon,
  Bars3Icon,
  PencilIcon,
  TrashIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';

interface UISettingsPanelProps {
  settings: UIDisplaySettings;
  onClose: () => void;
  onQuickUpdate: (settings: UIDisplaySettings) => void;
  onSave: (settings: UIDisplaySettings) => Promise<void>;
}

export function UISettingsPanel({ settings, onClose, onQuickUpdate, onSave }: UISettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState<UIDisplaySettings>(settings);
  const [showSizeSettings, setShowSizeSettings] = useState(false);
  const [panelWidth, setPanelWidth] = useState(80);
  const [panelHeight, setPanelHeight] = useState(45);
  const [panelTop, setPanelTop] = useState(50);
  const [saving, setSaving] = useState(false);
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null);

  // 拖移排序邏輯
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const target = e.currentTarget as HTMLElement;
    setDraggedElement(target);
    setTimeout(() => {
      target.style.opacity = '0.4';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if (draggedElement) {
      draggedElement.style.opacity = '1';
      setDraggedElement(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const getDragAfterElement = (container: HTMLElement, y: number): HTMLElement | null => {
    const draggableElements = [...container.querySelectorAll('[draggable="true"]:not([style*="opacity: 0.4"])')] as HTMLElement[];
    
    return draggableElements.reduce<{offset: number, element: HTMLElement | null}>((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
  };

  const handleContainerDragOver = (e: React.DragEvent<HTMLDivElement>, type: 'filter' | 'stat') => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    const container = type === 'filter' 
      ? target.closest('#filtersList') as HTMLElement
      : target.closest('#statsList') as HTMLElement;
    
    if (!container || !draggedElement) return;
    
    const afterElement = getDragAfterElement(container, e.clientY);
    if (afterElement == null) {
      container.appendChild(draggedElement);
    } else {
      container.insertBefore(draggedElement, afterElement);
    }
  };

  const handleContainerDrop = (e: React.DragEvent<HTMLDivElement>, type: 'filter' | 'stat') => {
    e.preventDefault();
    if (!draggedElement) return;

    // 更新順序
    const container = type === 'filter'
      ? document.getElementById('filtersList')
      : document.getElementById('statsList');
    
    if (!container) return;

    const items = [...container.querySelectorAll('[draggable="true"]')];
    
    if (type === 'filter') {
      const newFilters = items.map((item, index) => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        const filterId = checkbox?.getAttribute('data-filter-id');
        const filter = localSettings.filters.find(f => f.id === filterId);
        return filter ? { ...filter, order: index } : null;
      }).filter(Boolean) as FilterConfig[];
      
      const newSettings = { ...localSettings, filters: newFilters };
      setLocalSettings(newSettings);
      // 立即通知父組件更新（即時預覽）
      onQuickUpdate(newSettings);
    } else {
      const newStats = items.map((item, index) => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        const statId = checkbox?.getAttribute('data-stat-id');
        const stat = localSettings.statistics.find(s => s.id === statId);
        return stat ? { ...stat, order: index } : null;
      }).filter(Boolean) as StatisticConfig[];
      
      const newSettings = { ...localSettings, statistics: newStats };
      setLocalSettings(newSettings);
      // 立即通知父組件更新（即時預覽）
      onQuickUpdate(newSettings);
    }
  };

  const handleFilterToggle = (id: string) => {
    const newSettings = {
      ...localSettings,
      filters: localSettings.filters.map(f =>
        f.id === id ? { ...f, enabled: !f.enabled } : f
      )
    };
    setLocalSettings(newSettings);
    // 立即通知父組件更新（即時預覽）
    onQuickUpdate(newSettings);
  };

  const handleStatToggle = (id: string) => {
    const enabledCount = localSettings.statistics.filter(s => s.enabled).length;
    const stat = localSettings.statistics.find(s => s.id === id);
    
    if (stat?.enabled && enabledCount <= 2) {
      alert('至少需要選擇2個統計項目！');
      return;
    }
    
    if (!stat?.enabled && enabledCount >= 8) {
      alert('最多只能選擇8個統計項目！');
      return;
    }
    
    const newSettings = {
      ...localSettings,
      statistics: localSettings.statistics.map(s =>
        s.id === id ? { ...s, enabled: !s.enabled } : s
      )
    };
    setLocalSettings(newSettings);
    // 立即通知父組件更新（即時預覽）
    onQuickUpdate(newSettings);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(localSettings);
      // 成功後關閉面板
      onClose();
    } catch (error) {
      // 錯誤已在父組件處理，這裡只需記錄
      console.error('儲存設定失敗:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!confirm('確定要恢復預設設定嗎？這將清除您的自訂配置。')) {
      return;
    }

    setSaving(true);
    try {
      const adminPassword = typeof window !== 'undefined' ? localStorage.getItem('remembered_password') || '' : '';
      const response = await fetch('/api/settings/reset-ui', {
        method: 'POST',
        headers: {
          'x-admin-password': adminPassword,
        },
      });

      if (!response.ok) {
        throw new Error('恢復預設設定失敗');
      }

      const result = await response.json();
      
      // 更新本地設定並通知父組件
      setLocalSettings(result.uiDisplay);
      onQuickUpdate(result.uiDisplay);
      
      alert('✅ 已成功恢復預設設定！');
      
      // 重新載入頁面以確保所有變更生效
      window.location.reload();
    } catch (error) {
      console.error('恢復預設設定失敗:', error);
      alert('❌ 恢復預設設定失敗：' + (error instanceof Error ? error.message : '未知錯誤'));
    } finally {
      setSaving(false);
    }
  };

  const resetPanelSize = () => {
    setPanelWidth(80);
    setPanelHeight(45);
    setPanelTop(50);
  };

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* 設定面板 */}
      <div 
        className="fixed left-1/2 -translate-x-1/2 z-50 animate-slide-down"
        style={{ 
          width: `${panelWidth}%`,
          height: `${panelHeight}vh`,
          top: `${panelTop}%`,
          transform: 'translateX(-50%)'
        }}
      >
        <div className="bg-slate-900/95 backdrop-blur-xl border-2 border-blue-500/50 rounded-2xl shadow-2xl overflow-hidden h-full flex flex-col">
          {/* 面板頭部 */}
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-blue-500/30 px-4 py-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cog6ToothIcon className="h-4 w-4 text-blue-400" />
              顯示設定
            </h3>
            <div className="flex items-center gap-2">
              {/* 尺寸設定按鈕 */}
              <button
                onClick={() => setShowSizeSettings(!showSizeSettings)}
                className="text-gray-400 hover:text-yellow-400 transition-colors p-1 hover:bg-white/10 rounded"
                title="尺寸設定"
              >
                <ArrowsPointingOutIcon className="h-4 w-4" />
              </button>
              {/* 關閉按鈕 */}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* 尺寸設定面板 */}
          {showSizeSettings && (
            <div className="bg-slate-800/90 border-b border-yellow-500/30 p-3">
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-gray-300 flex justify-between">
                    <span>寬度</span>
                    <span className="text-blue-400 font-mono">{panelWidth}%</span>
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={panelWidth}
                    step="5"
                    onChange={(e) => setPanelWidth(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-gray-300 flex justify-between">
                    <span>高度</span>
                    <span className="text-green-400 font-mono">{panelHeight}vh</span>
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="90"
                    value={panelHeight}
                    step="5"
                    onChange={(e) => setPanelHeight(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-gray-300 flex justify-between">
                    <span>頂部距離</span>
                    <span className="text-purple-400 font-mono">{panelTop}%</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={panelTop}
                    step="5"
                    onChange={(e) => setPanelTop(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <button
                  onClick={resetPanelSize}
                  className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                >
                  重置預設
                </button>
                <div className="text-xs text-gray-400">
                  <span className="text-white font-mono">
                    W:{panelWidth}% H:{panelHeight}vh T:{panelTop}%
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* 面板內容 */}
          <div className="grid grid-cols-2 gap-6 p-6 overflow-y-auto flex-1">
            {/* 左區：分類篩選設定 */}
            <div className="space-y-4">
              <h4 className="text-white font-bold flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                </svg>
                分類篩選器
              </h4>
              
              <div 
                id="filtersList"
                onDragOver={(e) => handleContainerDragOver(e, 'filter')}
                onDrop={(e) => handleContainerDrop(e, 'filter')}
                className="space-y-2 bg-slate-800/50 rounded-lg p-3 max-h-64 overflow-y-auto"
              >
                {localSettings.filters.sort((a, b) => a.order - b.order).map((filter) => (
                  <div
                    key={filter.id}
                    draggable
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    className="flex items-center justify-between p-2 hover:bg-slate-700/50 rounded group cursor-move"
                  >
                    <label className="flex items-center gap-2 text-white cursor-pointer flex-1">
                      <Bars3Icon className="h-4 w-4 text-gray-500" />
                      <input
                        type="checkbox"
                        checked={filter.enabled}
                        onChange={() => handleFilterToggle(filter.id)}
                        data-filter-id={filter.id}
                        className="w-4 h-4 rounded"
                      />
                      <span>{filter.label}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 右區：統計資訊設定 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <svg className="h-5 w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  統計資訊
                </h4>
                <div className="text-xs text-yellow-400">
                  最多8個 | 2列橫向擴展
                </div>
              </div>
              
              <div 
                id="statsList"
                onDragOver={(e) => handleContainerDragOver(e, 'stat')}
                onDrop={(e) => handleContainerDrop(e, 'stat')}
                className="space-y-2 bg-slate-800/50 rounded-lg p-3 max-h-64 overflow-y-auto"
              >
                {localSettings.statistics.sort((a, b) => a.order - b.order).map((stat) => (
                  <div
                    key={stat.id}
                    draggable
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    className="flex items-center justify-between p-2 hover:bg-slate-700/50 rounded group cursor-move"
                  >
                    <label className="flex items-center gap-2 text-white cursor-pointer flex-1">
                      <Bars3Icon className="h-4 w-4 text-gray-500" />
                      <input
                        type="checkbox"
                        checked={stat.enabled}
                        onChange={() => handleStatToggle(stat.id)}
                        data-stat-id={stat.id}
                        className="w-4 h-4 rounded"
                      />
                      <span>{stat.label}</span>
                    </label>
                  </div>
                ))}
                
                <div className="text-xs text-gray-400 text-center pt-2 border-t border-slate-700">
                  已選擇 {localSettings.statistics.filter(s => s.enabled).length} 個統計項目（最少2個，最多8個）
                </div>
              </div>
            </div>
          </div>
          
          {/* 底部按鈕 */}
          <div className="border-t border-blue-500/30 p-4 bg-slate-800/50 flex justify-between gap-3">
            <button
              onClick={handleResetToDefault}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-yellow-300 hover:text-yellow-100 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/50 hover:border-yellow-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 恢復預設
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {saving ? '儲存中...' : '💾 儲存設定'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

