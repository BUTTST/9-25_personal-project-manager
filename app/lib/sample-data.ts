import { ProjectData, Project } from '@/types';
import { generateId } from './auth';

// 基於用戶提供的表格建立範例資料
export const sampleProjects: Project[] = [
  {
    id: generateId(),
    dateAndFileName: '7-30 V6_確認vercel授權-9 保持最新yt-dlp',
    description: '［重要］核心whisper專案',
    category: 'important',
    github: 'https://github.com/BUTTST/8-14_Whisper__vercel-RunPod-GitHub-',
    vercel: 'https://vercel.com/titans-projects-0ee27614/8-14-whisper-vercel-run-pod-git-hub',
    path: 'E:\\u500b人項目',
    statusNote: '',
    publicNote: '核心whisper專案，這是我最重要的專案之一',
    developerNote: '需要注意授權問題，定期更新yt-dlp',
    visibility: {
      dateAndFileName: true,
      description: true,
      category: true,
      github: true,
      vercel: true,
      path: false, // 路徑不對外放示示
      statusNote: true,
      publicNote: true,
      developerNote: true
    },
    featured: true,
    createdAt: new Date('2024-07-30').getTime(),
    updatedAt: Date.now()
  },
  {
    id: generateId(),
    dateAndFileName: '7-24 抓取實測 計劃模式',
    description: '［重要］金流系統',
    category: 'important',
    github: 'https://github.com/BUTTST/7-24-CashCalculator_PlanningMode',
    vercel: 'https://vercel.com/titans-projects-0ee27614/7-24-cash-calculator-planning-mode',
    path: 'E:\\u500b人項目',
    statusNote: 'KV資料庫又被停用了，但目前欠缺沙盒驗證',
    publicNote: '金流系統管理工具',
    developerNote: '需要連接真實的支付服務進行測試',
    visibility: {
      dateAndFileName: true,
      description: true,
      category: true,
      github: true,
      vercel: true,
      path: false,
      statusNote: true,
      publicNote: true,
      developerNote: true
    },
    featured: false,
    createdAt: new Date('2024-07-24').getTime(),
    updatedAt: Date.now()
  },
  {
    id: generateId(),
    dateAndFileName: '9-12_Idea-Collector',
    description: '［次］想法採集器',
    category: 'secondary',
    github: 'https://github.com/BUTTST/9-12_Idea-Collector',
    vercel: 'https://vercel.com/titans-projects-0ee27614/9-12-idea-collector',
    path: '',
    statusNote: '',
    publicNote: '一個用來收集和管理想法的工具',
    developerNote: '簡單的CRUD應用',
    visibility: {
      dateAndFileName: true,
      description: true,
      category: true,
      github: true,
      vercel: true,
      path: false,
      statusNote: true,
      publicNote: true,
      developerNote: false // 這個對訪客隱藏
    },
    featured: false,
    createdAt: new Date('2024-09-12').getTime(),
    updatedAt: Date.now()
  },
  {
    id: generateId(),
    dateAndFileName: '9-10-ui-components',
    description: '［次］預覽樣式合集',
    category: 'secondary',
    github: 'https://github.com/BUTTST/9-10-ui-components',
    vercel: '',
    path: '',
    statusNote: '未部署',
    publicNote: 'UI組件的範例和樣式指南',
    developerNote: '可以部署到Vercel上',
    visibility: {
      dateAndFileName: true,
      description: true,
      category: true,
      github: true,
      vercel: false, // 沒有vercel連結時隱藏
      path: false,
      statusNote: true,
      publicNote: true,
      developerNote: false
    },
    featured: false,
    createdAt: new Date('2024-09-10').getTime(),
    updatedAt: Date.now()
  },
  {
    id: generateId(),
    dateAndFileName: '8-23 應用圖標（icon）',
    description: '［子實踐］圖標實踐',
    category: 'practice',
    github: 'https://github.com/BUTTST/8-23_pwa-icons-maskable',
    vercel: '',
    path: 'E:\\u500b人項目',
    statusNote: '',
    publicNote: 'PWA圖標的實作和研究',
    developerNote: '學習怎麼製作符合規範的應用圖標',
    visibility: {
      dateAndFileName: true,
      description: true,
      category: true,
      github: true,
      vercel: false,
      path: false,
      statusNote: true,
      publicNote: true,
      developerNote: false
    },
    featured: false,
    createdAt: new Date('2024-08-23').getTime(),
    updatedAt: Date.now()
  },
  {
    id: generateId(),
    dateAndFileName: '7-18 翻譯colab 倒出效果',
    description: '［已完成］ Colab 查詢 Gemini API 模型 視覺化排版列表',
    category: 'completed',
    github: '',
    vercel: '',
    path: 'E:\\u500b人項目',
    statusNote: '這是Colab項目',
    publicNote: '使用Colab進行Gemini API的測試和視覺化',
    developerNote: 'Colab範例，不需要部署',
    visibility: {
      dateAndFileName: true,
      description: true,
      category: true,
      github: false, // 沒有GitHub連結
      vercel: false, // 沒有Vercel連結
      path: false,
      statusNote: true,
      publicNote: true,
      developerNote: false
    },
    featured: false,
    createdAt: new Date('2024-07-18').getTime(),
    updatedAt: Date.now()
  },
  {
    id: generateId(),
    dateAndFileName: '7-30 Colab多項目＋ 專題whisper合併',
    description: '［已捨棄］ 之前的嘗試合併',
    category: 'abandoned',
    github: 'https://github.com/BUTTST/8-1_Colab-MultiProject_WhisperProject',
    vercel: '',
    path: 'E:\\u500b人項目',
    statusNote: '',
    publicNote: '',
    developerNote: '早期的嘗試，後來找到更好的方案',
    visibility: {
      dateAndFileName: true,
      description: true,
      category: true,
      github: true,
      vercel: false,
      path: false,
      statusNote: false, // 捨棄的項目不顯示狀態
      publicNote: false, // 捨棄的項目不顯示公開註解
      developerNote: false
    },
    featured: false,
    createdAt: new Date('2024-07-30').getTime(),
    updatedAt: Date.now()
  }
];

// 範例密碼資料（基於用戶表格）
export const samplePasswords = [
  {
    id: generateId(),
    platform: 'Paddle',
    account: 'billy051015@gmail.com',
    password: 'n9una8YZrw1JKGnLsviX',
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: generateId(),
    platform: 'Paddle sandbox',
    account: 'billy051015@gmail.com', 
    password: 'n9una8YZrw1JKGnLsviX',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

export const sampleProjectData: ProjectData = {
  projects: sampleProjects,
  passwords: samplePasswords,
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
    totalProjects: sampleProjects.length,
    publicProjects: sampleProjects.filter(p => 
      p.visibility.description && 
      p.category !== 'abandoned'
    ).length
  }
};
