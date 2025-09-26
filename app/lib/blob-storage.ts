import { put, head, PutBlobResult } from '@vercel/blob';
import { ProjectData, Project, PasswordEntry, AppSettings } from '@/types';

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
    theme: 'light'
  },
  metadata: {
    lastUpdated: Date.now(),
    version: '1.0.0',
    totalProjects: 0,
    publicProjects: 0
  }
};

// 從Blob讀取資料
export async function readProjectData(): Promise<ProjectData> {
  try {
    // 首先嘗試從環境變數或API獲取現有的Blob
    const response = await fetch('/api/blob/read', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (validateProjectData(data)) {
        return data;
      }
    }
    
    // 如果沒有現有數據，才使用默認數據，但不自動保存
    console.log('No existing data found, using default data');
    return defaultProjectData;
  } catch (error) {
    console.error('Error reading project data:', error);
    // 返回默認數據，但不保存，避免覆蓋現有數據
    return defaultProjectData;
  }
}

// 將資料寫入Blob
export async function writeProjectData(data: ProjectData): Promise<PutBlobResult> {
  const updatedData = {
    ...data,
    metadata: {
      ...data.metadata,
      lastUpdated: Date.now(),
      totalProjects: data.projects.length,
      publicProjects: data.projects.filter(p => 
        p.visibility.description && 
        p.category !== 'abandoned'
      ).length
    }
  };

  // 添加數據驗證，避免寫入空數據
  if (data.projects.length === 0 && data.passwords.length === 0) {
    console.warn('Attempting to save empty data, checking if this is intentional...');
  }

  const blob = await put(BLOB_FILENAME, JSON.stringify(updatedData, null, 2), {
    access: 'public',
    addRandomSuffix: false
  });

  console.log('Data successfully saved to Blob:', {
    projects: updatedData.projects.length,
    passwords: updatedData.passwords.length,
    blobUrl: blob.url
  });

  return blob;
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
