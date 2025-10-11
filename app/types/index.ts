export interface Project {
  id: string;
  dateAndFileName: string; // 日期＋檔案名稱
  description: string; // 說明
  category: 'important' | 'secondary' | 'practice' | 'completed' | 'abandoned'; // ［重要］［次］［子實踐］［已完成］［已捨棄］
  github?: string; // GitHub 連結
  vercel?: string; // Vercel 連結
  path?: string; // 路徑
  statusNote?: string; // 狀態備註
  publicNote?: string; // 一般註解（訪客可見）
  developerNote?: string; // 開發者註解（僅管理員可見）
  visibility: {
    dateAndFileName: boolean;
    description: boolean;
    category: boolean;
    github: boolean;
    vercel: boolean;
    path: boolean;
    statusNote: boolean;
    publicNote: boolean;
    developerNote: boolean;
  };
  featured: boolean; // 是否為精選項目
  createdAt: number;
  updatedAt: number;
  sortOrder: number; // 新增排序欄位
}

export type ProjectVisibility = Project['visibility'];

export interface PasswordEntry {
  id: string;
  platform: string; // 平台
  account: string; // 帳號
  password: string; // 密碼
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  showToggleControls: boolean; // 是否顯示開關控制項
  defaultProjectVisibility: Partial<Project['visibility']>;
  rememberPassword: boolean;
  theme: 'light' | 'dark' | 'auto';
  uiDisplay?: UIDisplaySettings;  // UI 顯示設定
}

export interface ProjectData {
  projects: Project[];
  passwords: PasswordEntry[];
  settings: AppSettings;
  metadata: {
    lastUpdated: number;
    version: string;
    totalProjects: number;
    publicProjects: number;
    writeTimestamp?: number;
    safetyCheck?: 'VERIFIED' | 'FORCED';
    backupTimestamp?: number;
    backupReason?: string;
  };
}

export interface AuthSession {
  isAuthenticated: boolean;
  isAdmin: boolean;
  loginTime: number;
  expiresAt: number;
}

export type CategoryDisplayName = {
  important: '［重要］';
  secondary: '［次］';
  practice: '［子實踐］';
  completed: '［已完成］';
  abandoned: '［已捨棄］';
};

export interface ProjectFormData {
  dateAndFileName: string;
  description: string;
  category: Project['category'];
  github?: string;
  vercel?: string;
  path?: string;
  statusNote?: string;
  publicNote?: string;
  developerNote?: string;
  sortOrder?: number; // 新增排序欄位
}

export interface PasswordFormData {
  platform: string;
  account: string;
  password: string;
}

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
