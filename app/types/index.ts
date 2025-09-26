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
