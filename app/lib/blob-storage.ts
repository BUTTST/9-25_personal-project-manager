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
    const response = await fetch(`https://vercel-blob.storage/${BLOB_FILENAME}`);
    if (!response.ok) {
      throw new Error('Failed to fetch project data');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.log('No existing data found, using default:', error);
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

  const blob = await put(BLOB_FILENAME, JSON.stringify(updatedData, null, 2), {
    access: 'public',
    addRandomSuffix: false
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
