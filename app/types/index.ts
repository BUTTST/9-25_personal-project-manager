export type ProjectCategory =
  | 'important'
  | 'secondary'
  | 'practice'
  | 'single-doc'
  | 'completed'
  | 'abandoned';

export type ProjectStatus =
  | 'in-progress'
  | 'on-hold'
  | 'long-term'
  | 'completed'
  | 'discarded';

export interface ImagePreview {
  id: string;
  title: string;
  description?: string;
  src: string;
  thumbnail?: string;
}

export type ImagePreviewDisplayMode = 'single' | 'grid';

export interface CustomInfoSection {
  id: string;
  title: string;
  type: 'text' | 'url';
  content: string;
  visible: boolean;
}

export interface DocumentMeta {
  filePath: string;
  title: string;
  description?: string;
  fileSize?: string;
  openBehavior?: 'current-tab' | 'new-tab' | 'modal';
  tags?: string[];
}

export interface Project {
  id: string;
  dateAndFileName: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  github?: string;
  vercel?: string;
  deployment?: string;
  path?: string;
  statusNote?: string;
  publicNote?: string;
  developerNote?: string;
  documentMeta?: DocumentMeta | null;
  visibility: {
    dateAndFileName: boolean;
    description: boolean;
    category: boolean;
    status: boolean;
    github: boolean;
    vercel: boolean;
    deployment: boolean;
    path: boolean;
    statusNote: boolean;
    publicNote: boolean;
    developerNote: boolean;
    imagePreviews: boolean;
    customInfoSections: boolean;
  };
  imagePreviews: ImagePreview[];
  imagePreviewMode: ImagePreviewDisplayMode;
  featured: boolean;
  hidden: boolean; // 隐藏整个项目，但保留各区域的 visibility 设置
  customInfoSections: CustomInfoSection[];
  createdAt: number;
  updatedAt: number;
  sortOrder: number;
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
  showToggleControls: boolean;
  defaultProjectVisibility: Partial<Project['visibility']>;
  rememberPassword: boolean;
  theme: 'light' | 'dark' | 'auto';
  uiDisplay?: UIDisplaySettings;
  defaultStatus?: ProjectStatus;
  defaultImagePreviewMode?: ImagePreviewDisplayMode;
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
  secondary: '［次要］';
  practice: '［子實踐］';
  'single-doc': '［單檔項目］';
  completed: '［已完成］';
  abandoned: '［已捨棄］';
};

export const categoryDisplayNames: CategoryDisplayName = {
  important: '［重要］',
  secondary: '［次要］',
  practice: '［子實踐］',
  'single-doc': '［單檔項目］',
  completed: '［已完成］',
  abandoned: '［已捨棄］',
};

export type StatusDisplayName = {
  'in-progress': '進行中';
  'on-hold': '暫緩';
  'long-term': '長期維護';
  completed: '已完成';
  discarded: '捨棄';
};

export const statusDisplayNames: StatusDisplayName = {
  'in-progress': '進行中',
  'on-hold': '暫緩',
  'long-term': '長期維護',
  completed: '已完成',
  discarded: '捨棄',
};

export const projectStatusOrder: ProjectStatus[] = [
  'in-progress',
  'on-hold',
  'long-term',
  'completed',
  'discarded',
];

export interface ProjectFormData {
  dateAndFileName: string;
  description: string;
  category: Project['category'];
  status: Project['status'];
  github?: string;
  vercel?: string;
  deployment?: string;
  path?: string;
  statusNote?: string;
  publicNote?: string;
  developerNote?: string;
  documentMeta?: DocumentMeta | null;
  imagePreviews: ImagePreview[];
  imagePreviewMode: ImagePreviewDisplayMode;
  customInfoSections: CustomInfoSection[];
  visibility?: ProjectVisibility;
  hidden?: boolean;
  sortOrder?: number;
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
  | 'totalProjects'
  | 'publicProjects'
  | 'displayedCount'
  | 'importantCount'
  | 'completedCount'
  | 'inProgressCount'
  | 'readyStatus'
  | 'abandonedCount'
  | 'singleDocCount'
  | 'statusOnHold'
  | 'statusLongTerm'
  | 'statusCompleted'
  | 'statusDiscarded';

export function getDefaultVisibility(): Project['visibility'] {
  return {
    dateAndFileName: true,
    description: true,
    category: true,
    status: true,
    github: true,
    vercel: true,
    deployment: true,
    path: false,
    statusNote: true,
    publicNote: true,
    developerNote: false,
    imagePreviews: true,
    customInfoSections: true,
  };
}

export const defaultCustomInfoSection = (): CustomInfoSection => ({
  id: '',
  title: '',
  type: 'text',
  content: '',
  visible: true,
});

export const defaultProjectStatus: ProjectStatus = 'in-progress';
export const defaultImagePreviewMode: ImagePreviewDisplayMode = 'grid';

export function migrateLegacyCategoryToStatus(category: ProjectCategory | string): ProjectStatus {
  switch (category) {
    case 'important':
    case 'secondary':
    case 'practice':
      return 'in-progress';
    case 'single-doc':
      return 'completed';
    case 'completed':
      return 'completed';
    case 'abandoned':
      return 'discarded';
    default:
      return defaultProjectStatus;
  }
}

export function ensureProjectVisibility(visibility?: Partial<Project['visibility']>): Project['visibility'] {
  return {
    ...getDefaultVisibility(),
    ...visibility,
  };
}

export function normalizeProjectStatus(status?: string, category?: ProjectCategory | string): ProjectStatus {
  if (!status) {
    return migrateLegacyCategoryToStatus(category || 'secondary');
  }
  switch (status) {
    case 'in-progress':
    case 'on-hold':
    case 'long-term':
    case 'completed':
    case 'discarded':
      return status;
    default:
      return migrateLegacyCategoryToStatus(category || 'secondary');
  }
}

export function normalizeProjectCategory(category?: string): ProjectCategory {
  switch (category) {
    case 'important':
      return 'important';
    case 'practice':
    case '[重要]子實踐':
      return 'practice';
    case 'single-doc':
      return 'single-doc';
    case 'secondary':
    case '次要項目':
    case '次要':
      return 'secondary';
    case 'completed':
      return 'completed';
    case 'abandoned':
      return 'abandoned';
    case 'completed':
    case 'abandoned':
    default:
      return 'secondary';
  }
}

export function normalizeCustomInfoSections(sections?: CustomInfoSection[]): CustomInfoSection[] {
  if (!Array.isArray(sections)) return [];
  return sections.map((section, index) => ({
    id: section.id || `section-${index}`,
    title: section.title || '自訂資訊',
    type: section.type === 'url' ? 'url' : 'text',
    content: section.content || '',
    visible: section.visible !== false,
  }));
}

export function normalizeImagePreviews(images?: ImagePreview[]): ImagePreview[] {
  if (!Array.isArray(images)) return [];
  return images
    .filter((image) => !!image && !!image.src)
    .map((image, index) => ({
      id: image.id || `image-${index}`,
      title: image.title || '',
      description: image.description,
      src: image.src,
      thumbnail: image.thumbnail,
    }));
}
