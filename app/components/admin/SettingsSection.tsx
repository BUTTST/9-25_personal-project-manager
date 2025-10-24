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
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
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
      link.download = `${new Date().toISOString().split('T')[0]}._專案管理平台_backup.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      showToast('success', '資料匯出成功', '備份檔案已下載');
    } catch (error) {
      showToast('error', '匯出失敗', error instanceof Error ? error.message : '未知錯誤');
    }
  };

  const handleImportData = async () => {
    // 第一步：顯示確認對話框，要求輸入特定文字
    const confirmText = '我確定要完全覆蓋資料庫';
    
    // 創建確認對話框
    const userInput = prompt(
      `⚠️ 警告：此操作將完全覆蓋所有現有資料！\n\n` +
      `為確保您了解風險，請輸入以下文字：\n"${confirmText}"\n\n` +
      `（請完整輸入，包含標點符號）`
    );
    
    // 檢查輸入是否正確
    if (userInput !== confirmText) {
      if (userInput !== null) {
        // 用戶有輸入但不正確
        showToast('error', '驗證失敗', '輸入的文字不正確，操作已取消');
      }
      // 用戶點擊取消或輸入不正確，直接返回
      return;
    }
    
    // 第二步：驗證通過，顯示檔案選擇器
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        showToast('info', '正在讀取檔案...');
        
        const text = await file.text();
        const importData = JSON.parse(text);
        
        // 驗證數據格式
        if (!importData.projects || !Array.isArray(importData.projects)) {
          throw new Error('無效的數據格式：缺少 projects 陣列');
        }
        
        if (!importData.settings) {
          throw new Error('無效的數據格式：缺少 settings 物件');
        }
        
        // 顯示即將覆蓋的資料統計
        const currentProjectCount = projectData.projects?.length || 0;
        const importProjectCount = importData.projects.length;
        
        const finalConfirm = confirm(
          `📊 資料統計：\n\n` +
          `目前專案數：${currentProjectCount}\n` +
          `匯入專案數：${importProjectCount}\n` +
          `密碼數量：${importData.passwords?.length || 0}\n\n` +
          `確定要完全覆蓋現有資料嗎？`
        );
        
        if (!finalConfirm) {
          showToast('info', '操作已取消');
          return;
        }
        
        // 第三步：執行完全覆蓋
        const adminPassword = typeof window !== 'undefined' ? localStorage.getItem('remembered_password') || '' : '';
        
        showToast('info', '正在覆蓋資料...');
        
        // 調用 API 進行完全覆蓋
        const response = await fetch('/api/admin/import-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': adminPassword,
          },
          body: JSON.stringify({
            data: importData,
            forceOverwrite: true,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '匯入失敗');
        }
        
        const result = await response.json();
        showToast('success', '資料匯入成功', `已匯入 ${result.projectCount} 個專案`);
        
        // 重新載入頁面以顯示新數據
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        
      } catch (error) {
        console.error('匯入錯誤:', error);
        showToast('error', '匯入失敗', error instanceof Error ? error.message : '檔案格式錯誤或網路問題');
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

  const handleInitializeSampleData = async () => {
    try {
      const adminPassword = typeof window !== 'undefined' ? localStorage.getItem('remembered_password') || '' : '';
      const response = await fetch('/api/admin/init-data', {
        method: 'POST',
        headers: {
          'x-admin-password': adminPassword
        }
      });

      if (!response.ok) {
        throw new Error('初始化失敗');
      }

      const result = await response.json();
      showToast('success', '範例數據已恢復', `已創建 ${result.projects} 個專案和 ${result.passwords} 個密碼`);
      
      // 重新載入頁面以顯示新數據
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      showToast('error', '數據恢復失敗', error instanceof Error ? error.message : '未知錯誤');
    }
  };

  const handleForceInitialize = async () => {
    if (!confirm('⚠️ 警告：這將強制覆蓋所有現有數據！您確定要繼續嗎？')) {
      return;
    }

    try {
      const adminPassword = typeof window !== 'undefined' ? localStorage.getItem('remembered_password') || '' : '';
      const response = await fetch('/api/admin/force-init', {
        method: 'POST',
        headers: {
          'x-admin-password': adminPassword
        }
      });

      if (!response.ok) {
        throw new Error('強制初始化失敗');
      }

      const result = await response.json();
      showToast('success', '強制重置完成', result.message);
      
      // 重新載入頁面以顯示新數據
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      showToast('error', '強制重置失敗', error instanceof Error ? error.message : '未知錯誤');
    }
  };

  const handleDiagnose = async () => {
    try {
      const adminPassword = typeof window !== 'undefined' ? localStorage.getItem('remembered_password') || '' : '';
      
      // 前端緩存破壞：添加時間戳參數和 HTTP 標頭
      const response = await fetch(`/api/admin/diagnose?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'x-admin-password': adminPassword,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error('診斷失敗');
      }

      const result = await response.json();
      setDiagnosticInfo(result);
      setShowDiagnostic(true);
      showToast('success', '系統診斷完成');
    } catch (error) {
      showToast('error', '診斷失敗', error instanceof Error ? error.message : '未知錯誤');
    }
  };

  return (
    <div className="p-6 space-y-8 text-foreground">
      <div className="flex items-center space-x-2 mb-6">
        <CogIcon className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">系統設定</h2>
      </div>

      {/* 顯示控制設定 */}
      <div className="space-y-6">
         <div>
           <h3 className="text-base font-medium mb-4">使用者體驗設定</h3>
           <div className="space-y-4">
             <ToggleControl
               checked={localSettings.rememberPassword}
               onChange={(checked) => handleSettingChange('rememberPassword', checked)}
               label="記住密碼"
               description="登入時自動記住管理員密碼"
             />
           </div>
           <p className="text-sm text-muted-foreground mt-2">
             💡 提示：專案的顯示開關控制項已移至各專案的編輯頁面
           </p>
         </div>

        {/* 預設可見性設定 */}
        <div>
          <h3 className="text-base font-medium mb-4">新專案預設可見性</h3>
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
          <p className="text-sm text-muted-foreground mt-2">
            設定新專案建立時的預設可見性狀態
          </p>
        </div>
      </div>

       {/* 資料管理 */}
       <div className="border-t border-border pt-6">
         <h3 className="text-base font-medium text-foreground mb-4">資料管理</h3>
         
         {/* 數據恢復與診斷區域 */}
         <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-4 mb-4">
           <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">🛡️ 數據保護與恢復</h4>
           <p className="text-xs text-red-700 dark:text-red-300 mb-3">
             如果遇到數據丟失問題，請按順序嘗試以下解決方案：
           </p>
           <div className="space-y-2">
             <button
               onClick={handleInitializeSampleData}
               className="w-full text-left text-xs bg-yellow-100 dark:bg-yellow-500/20 hover:bg-yellow-200 dark:hover:bg-yellow-500/30 text-yellow-800 dark:text-yellow-200 px-3 py-2 rounded border border-yellow-300"
             >
               📋 步驟1：安全恢復範例數據
             </button>
             <button
               onClick={handleForceInitialize}
               className="w-full text-left text-xs bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-800 dark:text-red-200 px-3 py-2 rounded border border-red-300"
             >
               ⚠️ 步驟2：強制重置所有數據（危險操作）
             </button>
             <button
               onClick={handleDiagnose}
               className="w-full text-left text-xs bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/30 text-blue-800 dark:text-blue-200 px-3 py-2 rounded border border-blue-300"
             >
               🔍 步驟3：系統診斷（查看詳細狀態）
             </button>
           </div>
           <p className="text-xs text-red-600 dark:text-red-400 mt-2">
             💡 建議：定期使用「匯出資料」功能備份您的數據
           </p>
         </div>

         {/* 診斷結果顯示 */}
         {showDiagnostic && diagnosticInfo && (
           <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
             <div className="flex items-center justify-between mb-3">
               <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">🔍 系統診斷報告</h4>
               <button
                 onClick={() => setShowDiagnostic(false)}
                 className="text-gray-400 hover:text-gray-600 text-xs"
               >
                 關閉
               </button>
             </div>
             
             <div className="space-y-3 text-xs font-mono">
               <div>
                 <strong className="text-gray-700 dark:text-gray-300">📊 Blob存儲狀態：</strong>
                 <div className="ml-4 mt-1 space-y-1">
                   <div>總Blob文件數: {diagnosticInfo.blobStorage?.totalBlobs || 0}</div>
                   <div>專案數據文件: {diagnosticInfo.blobStorage?.hasProjectData ? '✅ 存在' : '❌ 不存在'}</div>
                   {diagnosticInfo.blobStorage?.hasProjectData && (
                     <>
                       <div>文件大小: {diagnosticInfo.blobStorage.contentSize} bytes</div>
                       <div>JSON格式: {diagnosticInfo.blobStorage.isValidJson ? '✅ 有效' : '❌ 無效'}</div>
                       <div>專案數量: {diagnosticInfo.blobStorage.projectCount}</div>
                       <div>密碼數量: {diagnosticInfo.blobStorage.passwordCount}</div>
                     </>
                   )}
                 </div>
               </div>
               
               <div>
                 <strong className="text-gray-700 dark:text-gray-300">🔧 環境狀態：</strong>
                 <div className="ml-4 mt-1 space-y-1">
                   <div>管理員密碼: {diagnosticInfo.environment?.hasAdminPassword ? '✅ 已設定' : '❌ 未設定'}</div>
                   <div>運行環境: {diagnosticInfo.environment?.vercelEnv || diagnosticInfo.environment?.nodeEnv || '未知'}</div>
                 </div>
               </div>

               <div>
                 <strong className="text-gray-700 dark:text-gray-300">📁 所有Blob文件：</strong>
                 <div className="ml-4 mt-1 max-h-32 overflow-y-auto">
                   {diagnosticInfo.allBlobs?.map((blob: any, index: number) => (
                     <div key={index} className="text-xs">
                       • {blob.pathname} ({blob.size} bytes, {new Date(blob.uploadedAt).toLocaleString()})
                     </div>
                   ))}
                 </div>
               </div>
             </div>
             
             <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
               <p className="text-xs text-gray-600 dark:text-gray-400">
                 診斷時間: {new Date(diagnosticInfo.timestamp).toLocaleString()}
               </p>
             </div>
           </div>
         )}
         
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
         <p className="text-sm text-muted-foreground mt-2">
           匯出功能可用，批量導入請使用「批量導入」選項卡
         </p>
       </div>

      {/* 系統資訊 */}
      <div className="border-t border-border pt-6">
        <h3 className="text-base font-medium text-foreground mb-4">系統資訊</h3>
        <div className="bg-muted rounded-lg p-4">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">系統版本：</dt>
              <dd className="text-foreground">v1.0.0</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">部署平台：</dt>
              <dd className="text-foreground">Vercel</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">儲存方式：</dt>
              <dd className="text-foreground">Vercel Blob</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">本地儲存：</dt>
              <dd className="text-foreground">
                {localSettings.rememberPassword ? '已啟用' : '已禁用'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
