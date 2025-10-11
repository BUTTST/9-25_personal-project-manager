import { put, head, PutBlobResult, list } from '@vercel/blob';
import { ProjectData, Project, PasswordEntry, AppSettings } from '@/types';
import { isEmptyData, validateDataIntegrity, createBackupData } from './data-safety';

const BLOB_FILENAME = 'project-data.json';

// 預設資料
export const defaultProjectData: ProjectData = {
  projects: [],
  passwords: [],
  settings: {
    showToggleControls: true,
    defaultProjectVisibility: {
      dateAndFileName: true,
      description: true,
      category: true,
      github: true,
      vercel: true,
      path: false,
      statusNote: true,
      publicNote: true,
      developerNote: false
    },
    rememberPassword: true,
    theme: 'light',
    uiDisplay: {
      filters: [
        { id: 'all', enabled: true, order: 0, label: '全部' },
        { id: 'important', enabled: true, order: 1, label: '重要' },
        { id: 'secondary', enabled: true, order: 2, label: '次要' },
        { id: 'practice', enabled: true, order: 3, label: '實踐' },
        { id: 'completed', enabled: true, order: 4, label: '完成' },
        { id: 'abandoned', enabled: true, order: 5, label: '捨棄' }
      ],
      statistics: [
        { id: 'stat-total', type: 'totalProjects', enabled: true, order: 0, label: '總專案數' },
        { id: 'stat-display', type: 'displayedCount', enabled: true, order: 1, label: '顯示中' },
        { id: 'stat-public', type: 'publicProjects', enabled: false, order: 2, label: '公開專案' },
        { id: 'stat-important', type: 'importantCount', enabled: false, order: 3, label: '重要專案' },
        { id: 'stat-completed', type: 'completedCount', enabled: false, order: 4, label: '已完成' },
        { id: 'stat-inprogress', type: 'inProgressCount', enabled: false, order: 5, label: '進行中' },
        { id: 'stat-ready', type: 'readyStatus', enabled: false, order: 6, label: '準備就緒' },
        { id: 'stat-abandoned', type: 'abandonedCount', enabled: false, order: 7, label: '已捨棄' }
      ]
    }
  },
  metadata: {
    lastUpdated: Date.now(),
    version: '1.0.0',
    totalProjects: 0,
    publicProjects: 0
  }
};

// 從Blob讀取資料 - 直接使用SDK避免循環依賴
export async function readProjectData(): Promise<ProjectData> {
  try {
    console.log('🔍 嘗試讀取Blob數據...');
    
    // 直接使用Vercel Blob SDK列出文件
    const { blobs } = await list();
    console.log('📁 找到Blob文件:', blobs.map(b => b.pathname));
    
    // 尋找我們的數據文件
    const dataBlob = blobs.find(blob => blob.pathname === BLOB_FILENAME);
    
    if (!dataBlob) {
      console.log('📄 未找到project-data.json，使用默認數據');
      return defaultProjectData;
    }

    console.log('✅ 找到數據文件，正在讀取:', dataBlob.url);
    
    // 使用正確的URL讀取Blob內容
    const response = await fetch(dataBlob.url);
    
    if (!response.ok) {
      console.error('❌ Blob讀取失敗:', response.status, response.statusText);
      return defaultProjectData;
    }

    const data = await response.json();
    
    // 驗證數據完整性
    if (!validateProjectData(data)) {
      console.error('❌ 數據格式驗證失敗');
      return defaultProjectData;
    }
    
    console.log('🎉 成功讀取數據:', {
      projects: data.projects.length,
      passwords: data.passwords.length,
      lastUpdated: new Date(data.metadata.lastUpdated).toLocaleString()
    });
    
    return data;
  } catch (error) {
    console.error('💥 讀取Blob數據時發生錯誤:', error);
    console.log('🔄 使用默認數據作為備用方案');
    return defaultProjectData;
  }
}

// 安全的數據寫入 - 多層保護防止數據丟失
export async function writeProjectData(data: ProjectData, forceWrite = false): Promise<PutBlobResult> {
  console.log('💾 開始安全數據寫入流程...');
  
  // 第一層：數據完整性驗證
  const { isValid, errors } = validateDataIntegrity(data);
  if (!isValid && !forceWrite) {
    console.error('❌ 數據完整性驗證失敗:', errors);
    throw new Error(`數據驗證失敗: ${errors.join(', ')}`);
  }

  // 第二層：空數據保護
  if (!forceWrite && isEmptyData(data)) {
    console.error('🚨 警告：嘗試寫入空數據！');
    
    // 讀取現有數據進行比較
    try {
      const existingData = await readExistingDataForComparison();
      if (existingData && !isEmptyData(existingData)) {
        console.error('🛑 數據保護：阻止空數據覆蓋現有數據');
        throw new Error('SAFETY_LOCK: 阻止空數據覆蓋現有數據。如需強制寫入，請使用forceWrite=true');
      }
    } catch (readError) {
      if (!readError.message?.includes('SAFETY_LOCK')) {
        console.warn('⚠️ 無法讀取現有數據，但仍阻止空數據寫入');
        throw new Error('SAFETY_LOCK: 無法驗證現有數據狀態，拒絕寫入空數據');
      }
      throw readError;
    }
  }

  // 第三層：創建備份標記
  const updatedData = {
    ...data,
    metadata: {
      ...data.metadata,
      lastUpdated: Date.now(),
      writeTimestamp: Date.now(),
      safetyCheck: forceWrite ? 'FORCED' : 'VERIFIED',
      totalProjects: data.projects.length,
      publicProjects: data.projects.filter(p => 
        p.visibility.description && 
        p.category !== 'abandoned'
      ).length
    }
  };

  // 執行寫入
  console.log('💿 執行Blob寫入...');
  const blob = await put(BLOB_FILENAME, JSON.stringify(updatedData, null, 2), {
    access: 'public',
    addRandomSuffix: false
  });

  console.log('🎉 數據安全寫入完成:', {
    projects: updatedData.projects.length,
    passwords: updatedData.passwords.length,
    blobUrl: blob.url,
    safetyCheck: updatedData.metadata.safetyCheck,
    timestamp: new Date().toISOString()
  });

  return blob;
}

// 僅用於比較的數據讀取（避免循環依賴）
async function readExistingDataForComparison(): Promise<ProjectData | null> {
  try {
    const { blobs } = await list();
    const dataBlob = blobs.find(blob => blob.pathname === BLOB_FILENAME);
    
    if (!dataBlob) {
      return null;
    }

    const response = await fetch(dataBlob.url);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return validateProjectData(data) ? data : null;
  } catch (error) {
    console.error('比較數據讀取失敗:', error);
    return null;
  }
}

// 只取公開專案（訪客模式）
export function getPublicProjects(projects: Project[]): Project[] {
  return projects
    .filter(project => 
      project.visibility.description && 
      project.category !== 'abandoned'
    )
    .map(project => ({
      ...project,
      developerNote: '', // 移除開發者註解
      passwords: [] as PasswordEntry[] // 移除密碼訊息
    }));
}

// 驗證資料格式
export function validateProjectData(data: any): data is ProjectData {
  return (
    data &&
    Array.isArray(data.projects) &&
    Array.isArray(data.passwords) &&
    data.settings &&
    data.metadata
  );
}
