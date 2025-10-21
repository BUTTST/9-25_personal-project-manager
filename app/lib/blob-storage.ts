import { put, head, PutBlobResult, list } from '@vercel/blob';
import {
  ProjectData,
  Project,
  AppSettings,
  PasswordEntry,
  defaultProjectStatus,
  defaultImagePreviewMode,
  ensureProjectVisibility,
  migrateLegacyCategoryToStatus,
  normalizeCustomInfoSections,
  normalizeImagePreviews,
  normalizeProjectStatus,
  normalizeProjectCategory,
} from '@/types';
import { isEmptyData, validateDataIntegrity, createBackupData } from './data-safety';

type ProjectDataErrorCode =
  | 'LOCAL_BACKUP_MODE_ENABLED'
  | 'BLOB_LIST_FAILED'
  | 'BLOB_FETCH_FAILED'
  | 'BLOB_PARSE_FAILED'
  | 'BLOB_SCHEMA_INVALID';

export class ProjectDataError extends Error {
  code: ProjectDataErrorCode;
  cause?: unknown;

  constructor(code: ProjectDataErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'ProjectDataError';
    this.code = code;
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

const isLocalBackupForced = process.env.NEXT_PUBLIC_USE_LOCAL_BACKUP === 'true';

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
      status: true,
      github: true,
      vercel: true,
      path: false,
      statusNote: true,
      publicNote: true,
      developerNote: false,
      imagePreviews: true,
      customInfoSections: true,
    },
    rememberPassword: true,
    theme: 'light',
    defaultStatus: defaultProjectStatus,
    defaultImagePreviewMode: defaultImagePreviewMode,
    uiDisplay: {
      filters: [
        { id: 'all', enabled: true, order: 0, label: '全部' },
        { id: 'important', enabled: true, order: 1, label: '重要' },
        { id: 'secondary', enabled: true, order: 2, label: '次要' },
        { id: 'practice', enabled: true, order: 3, label: '實踐' },
        { id: 'single-doc', enabled: true, order: 4, label: '單檔專案' },
        { id: 'status-in-progress', enabled: true, order: 5, label: '進行中' },
        { id: 'status-on-hold', enabled: true, order: 6, label: '暫緩' },
        { id: 'status-long-term', enabled: false, order: 7, label: '長期維護' },
        { id: 'status-completed', enabled: true, order: 8, label: '已完成' },
        { id: 'status-discarded', enabled: true, order: 9, label: '捨棄' },
      ],
      statistics: [
        { id: 'stat-total', type: 'totalProjects', enabled: true, order: 0, label: '總專案數' },
        { id: 'stat-display', type: 'displayedCount', enabled: true, order: 1, label: '顯示中' },
        { id: 'stat-single-doc', type: 'singleDocCount', enabled: true, order: 2, label: '單檔文件' },
        { id: 'stat-public', type: 'publicProjects', enabled: false, order: 3, label: '公開專案' },
        { id: 'stat-important', type: 'importantCount', enabled: false, order: 4, label: '重要專案' },
        { id: 'stat-completed', type: 'completedCount', enabled: false, order: 5, label: '已完成' },
        { id: 'stat-inprogress', type: 'inProgressCount', enabled: false, order: 6, label: '進行中' },
        { id: 'stat-ready', type: 'readyStatus', enabled: false, order: 7, label: '準備就緒' },
        { id: 'stat-abandoned', type: 'abandonedCount', enabled: false, order: 8, label: '已捨棄' },
        { id: 'stat-status-onhold', type: 'statusOnHold', enabled: false, order: 9, label: '暫緩' },
        { id: 'stat-status-longterm', type: 'statusLongTerm', enabled: false, order: 10, label: '長期維護' },
        { id: 'stat-status-completed', type: 'statusCompleted', enabled: false, order: 11, label: '完成' },
        { id: 'stat-status-discarded', type: 'statusDiscarded', enabled: false, order: 12, label: '捨棄' },
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
  if (isLocalBackupForced) {
    throw new ProjectDataError(
      'LOCAL_BACKUP_MODE_ENABLED',
      'NEXT_PUBLIC_USE_LOCAL_BACKUP is true. Detected local-backup mode, blocking remote read to protect production data.'
    );
  }

  console.log('🔍 嘗試讀取Blob數據...');

  let blobs;
  try {
    const listResult = await list();
    blobs = listResult.blobs;
    console.log('📁 找到Blob文件:', blobs.map((b) => b.pathname));
  } catch (error) {
    // 本地開發環境：如果沒有 BLOB_READ_WRITE_TOKEN，優雅降級到預設數據
    console.warn('⚠️ 無法連接到 Vercel Blob（這在本地開發是正常的）:', error);
    console.log('📄 使用預設空數據進行本地開發');
    return enrichProjectData(defaultProjectData);
  }

  const dataBlob = blobs.find((blob) => blob.pathname === BLOB_FILENAME);

  if (!dataBlob) {
    console.log('📄 未找到project-data.json，使用默認數據');
    return enrichProjectData(defaultProjectData);
  }

  console.log('✅ 找到數據文件，正在讀取:', dataBlob.url);

  let response;
  try {
    response = await fetch(dataBlob.url);
  } catch (error) {
    throw new ProjectDataError('BLOB_FETCH_FAILED', 'Failed to fetch blob content from Vercel Blob storage.', { cause: error });
  }

  if (!response.ok) {
    throw new ProjectDataError(
      'BLOB_FETCH_FAILED',
      `Failed to fetch blob content from Vercel Blob storage. HTTP ${response.status} ${response.statusText}.`
    );
  }

  let data: ProjectData;
  try {
    data = (await response.json()) as ProjectData;
  } catch (error) {
    throw new ProjectDataError('BLOB_PARSE_FAILED', 'Failed to parse blob JSON content.', { cause: error });
  }

  if (!validateProjectData(data)) {
    throw new ProjectDataError('BLOB_SCHEMA_INVALID', 'Blob content structure is invalid and cannot be trusted.');
  }

  console.log('🎉 成功讀取數據:', {
    projects: data.projects.length,
    passwords: data.passwords.length,
    lastUpdated: new Date(data.metadata.lastUpdated).toLocaleString(),
  });

  return enrichProjectData(data);
}

function enrichProjectData(data: ProjectData): ProjectData {
  const documentCategory = 'single-doc';
  const settings = data.settings || ({} as AppSettings);
  const uiDisplay = settings.uiDisplay || { filters: [], statistics: [] };
  
  // 如果 filters 或 statistics 為空，使用默認配置
  const filters = uiDisplay.filters.length > 0 ? [...uiDisplay.filters] : [...defaultProjectData.settings.uiDisplay.filters];
  const statistics = uiDisplay.statistics.length > 0 ? [...uiDisplay.statistics] : [...defaultProjectData.settings.uiDisplay.statistics];

  const projects = data.projects.map((project) => {
    const normalizedCategory = normalizeProjectCategory(project.category);
    return {
      ...project,
      category: normalizedCategory,
      status: normalizeProjectStatus(project.status, normalizedCategory),
      visibility: ensureProjectVisibility(project.visibility),
      imagePreviews: normalizeImagePreviews(project.imagePreviews),
      imagePreviewMode: project.imagePreviewMode || settings.defaultImagePreviewMode || defaultImagePreviewMode,
      customInfoSections: normalizeCustomInfoSections(project.customInfoSections),
      documentMeta: project.documentMeta || null,
    } as Project;
  });

  if (!filters.some(filter => filter.id === documentCategory)) {
    filters.push({
      id: documentCategory,
      enabled: true,
      order: filters.length,
      label: '單檔專案'
    });
  }

  if (!statistics.some(stat => stat.type === 'singleDocCount')) {
    statistics.push({
      id: 'stat-single-doc',
      type: 'singleDocCount',
      enabled: true,
      order: statistics.length,
      label: '單檔文件'
    });
  }

  return {
    ...data,
    projects,
    settings: {
      ...settings,
      defaultStatus: settings.defaultStatus || defaultProjectStatus,
      defaultImagePreviewMode: settings.defaultImagePreviewMode || defaultImagePreviewMode,
      uiDisplay: {
        filters: filters.map((filter, index) => ({ ...filter, order: index })),
        statistics: statistics.map((stat, index) => ({ ...stat, order: index }))
      }
    }
  };
}

// 安全的數據寫入 - 多層保護防止數據丟失
export async function writeProjectData(data: ProjectData, forceWrite = false): Promise<PutBlobResult> {
  if (isLocalBackupForced) {
    throw new ProjectDataError(
      'LOCAL_BACKUP_MODE_ENABLED',
      'NEXT_PUBLIC_USE_LOCAL_BACKUP is true. Blocking write operations to avoid overwriting production data with local backup.'
    );
  }

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
        p.status !== 'discarded'
      ).length
    }
  };

  // 執行寫入
  console.log('💿 執行Blob寫入...');
  try {
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
  } catch (error) {
    // 本地開發環境：無法寫入 Blob，返回模擬結果
    console.warn('⚠️ 無法寫入到 Vercel Blob（這在本地開發是正常的）:', error);
    console.log('📄 本地開發模式：數據變更僅在記憶體中');
    
    // 返回模擬的 Blob 結果
    return {
      url: 'http://localhost:3000/mock-blob',
      pathname: BLOB_FILENAME,
      contentType: 'application/json',
      contentDisposition: 'inline; filename="project-data.json"',
      uploadedAt: new Date()
    } as PutBlobResult;
  }
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
    .map((project) => ({
      ...project,
      visibility: ensureProjectVisibility(project.visibility),
      imagePreviews: normalizeImagePreviews(project.imagePreviews),
      customInfoSections: normalizeCustomInfoSections(project.customInfoSections),
      documentMeta: project.documentMeta || null,
    }))
    .filter(project =>
      project.visibility.description &&
      project.status !== 'discarded'
    )
    .map(project => ({
      ...project,
      developerNote: '',
      passwords: [] as PasswordEntry[],
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
