'use client';

import { useState } from 'react';
import { ProjectData } from '@/types';
import { ToggleControl } from '@/components/ui/ToggleControl';
import { useToast } from '@/components/ui/ToastProvider';
import { 
  CogIcon,
  EyeIcon,
  EyeSlashIcon,
  SwatchIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface SettingsSectionProps {
  settings: ProjectData['settings'];
  projectData: ProjectData;
  onUpdate: (settings: ProjectData['settings']) => void;
}

export function SettingsSection({ settings, projectData, onUpdate }: SettingsSectionProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const { showToast } = useToast();

  const handleSettingChange = <K extends keyof ProjectData['settings']>(
    key: K,
    value: ProjectData['settings'][K]
  ) => {
    const updatedSettings = {
      ...localSettings,
      [key]: value
    };
    
    setLocalSettings(updatedSettings);
    onUpdate(updatedSettings);
    
    // TODO: 同步到伺服器
    showToast('success', '設定已更新');
  };

  const handleDefaultVisibilityChange = (field: string, value: boolean) => {
    const updatedDefaults = {
      ...localSettings.defaultProjectVisibility,
      [field]: value
    };
    
    handleSettingChange('defaultProjectVisibility', updatedDefaults);
  };

  const handleExportData = () => {
    try {
      // 創建匯出數據
      const exportData = {
        projects: projectData.projects || [],
        passwords: projectData.passwords || [],
        settings: projectData.settings,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      // 創建並下載 JSON 檔案
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `project-showcase-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      showToast('success', '資料匯出成功', '備份檔案已下載');
    } catch (error) {
      showToast('error', '匯出失敗', error instanceof Error ? error.message : '未知錯誤');
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const importData = JSON.parse(text);
        
        // 驗證數據格式
        if (!importData.projects || !Array.isArray(importData.projects)) {
          throw new Error('無效的數據格式');
        }

        // 這裡需要調用父組件的更新函數
        showToast('info', '導入功能開發中', '請使用表格導入功能');
      } catch (error) {
        showToast('error', '導入失敗', error instanceof Error ? error.message : '檔案格式錯誤');
      }
    };
    
    input.click();
  };

  const handleClearCache = () => {
    localStorage.clear();
    showToast('success', '快取已清除', '請重新整理頁面');
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center space-x-2 mb-6">
        <CogIcon className="h-5 w-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-900">系統設定</h2>
      </div>

      {/* 顯示控制設定 */}
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-medium text-gray-900 mb-4">顯示設定</h3>
          <div className="space-y-4">
            <ToggleControl
              checked={localSettings.showToggleControls}
              onChange={(checked) => handleSettingChange('showToggleControls', checked)}
              label="顯示開關控制項"
              description="是否在專案卡片上顯示可見性開關按鈕"
            />
            
            <ToggleControl
              checked={localSettings.rememberPassword}
              onChange={(checked) => handleSettingChange('rememberPassword', checked)}
              label="記住密碼"
              description="登入時自動記住管理員密碼"
            />
          </div>
        </div>

        {/* 主題設定 */}
        <div>
          <h3 className="text-base font-medium text-gray-900 mb-4">主題設定</h3>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">主題模式：</label>
            <select
              value={localSettings.theme}
              onChange={(e) => handleSettingChange('theme', e.target.value as 'light' | 'dark' | 'auto')}
              className="input w-auto"
            >
              <option value="light">淺色模式</option>
              <option value="dark">深色模式</option>
              <option value="auto">跟隨系統</option>
            </select>
          </div>
        </div>

        {/* 預設可見性設定 */}
        <div>
          <h3 className="text-base font-medium text-gray-900 mb-4">新專案預設可見性</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries({
              dateAndFileName: '日期和檔名',
              description: '說明',
              category: '類別',
              github: 'GitHub 連結',
              vercel: 'Vercel 連結',
              path: '路徑',
              statusNote: '狀態備註',
              publicNote: '一般註解',
              developerNote: '開發者註解'
            }).map(([key, label]) => (
              <ToggleControl
                key={key}
                checked={localSettings.defaultProjectVisibility[key as keyof typeof localSettings.defaultProjectVisibility] ?? true}
                onChange={(checked) => handleDefaultVisibilityChange(key, checked)}
                label={label}
                size="sm"
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            設定新專案建立時的預設可見性狀態
          </p>
        </div>
      </div>

      {/* 資料管理 */}
      <div className="border-t pt-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">資料管理</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleExportData}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            <span>匯出資料</span>
          </button>
          
          <button
            onClick={handleImportData}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <DocumentArrowUpIcon className="h-4 w-4" />
            <span>匯入資料</span>
          </button>
          
          <button
            onClick={handleClearCache}
            className="btn-danger flex items-center justify-center space-x-2"
          >
            <TrashIcon className="h-4 w-4" />
            <span>清除快取</span>
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          資料匯出/匯入功能將在後續版本提供
        </p>
      </div>

      {/* 系統資訊 */}
      <div className="border-t pt-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">系統資訊</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-medium text-gray-700">系統版本：</dt>
              <dd className="text-gray-600">v1.0.0</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">部署平台：</dt>
              <dd className="text-gray-600">Vercel</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">儲存方式：</dt>
              <dd className="text-gray-600">Vercel Blob</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">本地儲存：</dt>
              <dd className="text-gray-600">
                {localSettings.rememberPassword ? '已啟用' : '已禁用'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
