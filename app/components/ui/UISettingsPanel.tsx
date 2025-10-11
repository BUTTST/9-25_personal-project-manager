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
  onSave: (settings: UIDisplaySettings) => Promise<void>;
}

export function UISettingsPanel({ settings, onClose, onSave }: UISettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState<UIDisplaySettings>(settings);
  const [showSizeSettings, setShowSizeSettings] = useState(false);
  const [panelWidth, setPanelWidth] = useState(80);
  const [panelHeight, setPanelHeight] = useState(45);
  const [panelTop, setPanelTop] = useState(50);
  const [saving, setSaving] = useState(false);
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null);

  // 拖移排序邏輯
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number, type: 'filter' | 'stat') => {
    const target = e.currentTarget;
    setDraggedElement(target);
    setTimeout(() => {
      target.style.opacity = '0.4';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>, type: 'filter' | 'stat') => {
    if (draggedElement) {
      draggedElement.style.opacity = '1';
      setDraggedElement(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number, type: 'filter' | 'stat') => {
    e.preventDefault();
    
    if (!draggedElement) return;

    const dragIndex = parseInt(draggedElement.dataset.index || '0');
    
    if (dragIndex === dropIndex) return;

    if (type === 'filter') {
      const newFilters = [...localSettings.filters];
      const [draggedItem] = newFilters.splice(dragIndex, 1);
      newFilters.splice(dropIndex, 0, draggedItem);
      
      // 更新 order
      newFilters.forEach((filter, index) => {
        filter.order = index;
      });
      
      setLocalSettings({ ...localSettings, filters: newFilters });
    } else {
      const newStats = [...localSettings.statistics];
      const [draggedItem] = newStats.splice(dragIndex, 1);
      newStats.splice(dropIndex, 0, draggedItem);
      
      // 更新 order
      newStats.forEach((stat, index) => {
        stat.order = index;
      });
      
      setLocalSettings({ ...localSettings, statistics: newStats });
    }
  };

  const handleFilterToggle = (id: string) => {
    setLocalSettings({
      ...localSettings,
      filters: localSettings.filters.map(f =>
        f.id === id ? { ...f, enabled: !f.enabled } : f
      )
    });
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
    
    setLocalSettings({
      ...localSettings,
      statistics: localSettings.statistics.map(s =>
        s.id === id ? { ...s, enabled: !s.enabled } : s
      )
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(localSettings);
      onClose();
    } catch (error) {
      console.error('儲存設定失敗:', error);
      alert('儲存失敗，請稍後再試');
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
              
              <div className="space-y-2 bg-slate-800/50 rounded-lg p-3 max-h-64 overflow-y-auto">
                {localSettings.filters.map((filter, index) => (
                  <div
                    key={filter.id}
                    data-index={index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index, 'filter')}
                    onDragEnd={(e) => handleDragEnd(e, 'filter')}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index, 'filter')}
                    className="flex items-center justify-between p-2 hover:bg-slate-700/50 rounded group cursor-move"
                  >
                    <label className="flex items-center gap-2 text-white cursor-pointer flex-1">
                      <Bars3Icon className="h-4 w-4 text-gray-500" />
                      <input
                        type="checkbox"
                        checked={filter.enabled}
                        onChange={() => handleFilterToggle(filter.id)}
                        className="w-4 h-4 rounded"
                      />
                      <span>{filter.label}</span>
                    </label>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-blue-400 hover:text-blue-300 p-1" title="編輯">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button className="text-red-400 hover:text-red-300 p-1" title="刪除">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
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
              
              <div className="space-y-2 bg-slate-800/50 rounded-lg p-3 max-h-64 overflow-y-auto">
                {localSettings.statistics.map((stat, index) => (
                  <div
                    key={stat.id}
                    data-index={index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index, 'stat')}
                    onDragEnd={(e) => handleDragEnd(e, 'stat')}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index, 'stat')}
                    className="flex items-center justify-between p-2 hover:bg-slate-700/50 rounded group cursor-move"
                  >
                    <label className="flex items-center gap-2 text-white cursor-pointer flex-1">
                      <Bars3Icon className="h-4 w-4 text-gray-500" />
                      <input
                        type="checkbox"
                        checked={stat.enabled}
                        onChange={() => handleStatToggle(stat.id)}
                        className="w-4 h-4 rounded"
                      />
                      <span>{stat.label}</span>
                    </label>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-blue-400 hover:text-blue-300 p-1" title="編輯">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button className="text-red-400 hover:text-red-300 p-1" title="刪除">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="text-xs text-gray-400 text-center pt-2 border-t border-slate-700">
                  已選擇 {localSettings.statistics.filter(s => s.enabled).length} 個統計項目（最多8個）
                </div>
              </div>
            </div>
          </div>
          
          {/* 底部按鈕 */}
          <div className="border-t border-blue-500/30 p-4 bg-slate-800/50 flex justify-end gap-3">
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
              {saving ? '儲存中...' : '儲存設定'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

