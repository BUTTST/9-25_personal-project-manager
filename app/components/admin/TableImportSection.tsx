'use client';

import { useState } from 'react';
import { Project, PasswordEntry } from '@/types';
import { generateId } from '@/lib/auth';
import { useToast } from '@/components/ui/ToastProvider';
import { 
  DocumentArrowUpIcon,
  TableCellsIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface TableImportSectionProps {
  onImportComplete: (projects: Project[], passwords: PasswordEntry[]) => void;
}

interface ParsedProject {
  dateAndFileName: string;
  description: string;
  github?: string;
  vercel?: string;
  path?: string;
  statusNote?: string;
}

interface ParsedPassword {
  platform: string;
  account: string;
  password: string;
}

export function TableImportSection({ onImportComplete }: TableImportSectionProps) {
  const [tableText, setTableText] = useState('');
  const [passwordText, setPasswordText] = useState('');
  const [previewProjects, setPreviewProjects] = useState<ParsedProject[]>([]);
  const [previewPasswords, setPreviewPasswords] = useState<ParsedPassword[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { showToast } = useToast();

  const parseProjectTable = (text: string): ParsedProject[] => {
    const lines = text.trim().split('\n');
    const projects: ParsedProject[] = [];
    
    for (const line of lines) {
      if (!line.trim() || line.includes('|---') || line.includes('日期＋檔案名稱')) continue;
      
      const columns = line.split('|').map(col => col.trim()).filter(Boolean);
      if (columns.length >= 6) {
        const [dateFileName, description, github, vercel, path, statusNote] = columns;
        
        projects.push({
          dateAndFileName: dateFileName,
          description: description,
          github: github && github !== 'undefined' && !github.includes('無') ? github : '',
          vercel: vercel && vercel !== 'undefined' && !vercel.includes('無') && !vercel.includes('未部屬') ? vercel : '',
          path: path && path !== 'undefined' ? path : '',
          statusNote: statusNote && statusNote !== 'undefined' ? statusNote : ''
        });
      }
    }
    
    return projects;
  };

  const parsePasswordTable = (text: string): ParsedPassword[] => {
    const lines = text.trim().split('\n');
    const passwords: ParsedPassword[] = [];
    
    for (const line of lines) {
      if (!line.trim() || line.includes('|---') || line.includes('平台')) continue;
      
      const columns = line.split('|').map(col => col.trim()).filter(Boolean);
      if (columns.length >= 3) {
        const [platform, account, password] = columns;
        
        if (platform && account && password) {
          passwords.push({
            platform,
            account,
            password
          });
        }
      }
    }
    
    return passwords;
  };

  const getCategoryFromDescription = (description: string): Project['category'] => {
    if (description.includes('［重要］')) return 'important';
    if (description.includes('［次］')) return 'secondary';
    if (description.includes('［子實踐］')) return 'practice';
    if (description.includes('［已完成］')) return 'completed';
    if (description.includes('［已捨棄］') || description.includes('［已捨棄］')) return 'abandoned';
    return 'secondary';
  };

  const handlePreview = () => {
    try {
      const projects = parseProjectTable(tableText);
      const passwords = parsePasswordTable(passwordText);
      
      setPreviewProjects(projects);
      setPreviewPasswords(passwords);
      
      if (projects.length === 0 && passwords.length === 0) {
        showToast('warning', '未檢測到有效資料', '請檢查表格格式');
      } else {
        showToast('success', '解析成功', `檢測到 ${projects.length} 個專案和 ${passwords.length} 個密碼`);
      }
    } catch (error) {
      showToast('error', '解析失敗', error instanceof Error ? error.message : '表格格式錯誤');
    }
  };

  const handleImport = async () => {
    if (previewProjects.length === 0 && previewPasswords.length === 0) {
      showToast('error', '沒有資料可導入', '請先預覽解析結果');
      return;
    }

    setLoading(true);
    try {
      // 轉換專案數據
      const projects: Project[] = previewProjects.map(proj => ({
        id: generateId(),
        dateAndFileName: proj.dateAndFileName,
        description: proj.description,
        category: getCategoryFromDescription(proj.description),
        github: proj.github || undefined,
        vercel: proj.vercel || undefined,
        path: proj.path || undefined,
        statusNote: proj.statusNote || undefined,
        publicNote: '', // 預設空值
        developerNote: '', // 預設空值
        visibility: {
          dateAndFileName: true,
          description: true,
          category: true,
          github: !!proj.github,
          vercel: !!proj.vercel,
          path: !!proj.path,
          statusNote: !!proj.statusNote,
          publicNote: true,
          developerNote: false
        },
        featured: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));

      // 轉換密碼數據
      const passwords: PasswordEntry[] = previewPasswords.map(pwd => ({
        id: generateId(),
        platform: pwd.platform,
        account: pwd.account,
        password: pwd.password,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));

      onImportComplete(projects, passwords);
      
      // 清除表單
      setTableText('');
      setPasswordText('');
      setPreviewProjects([]);
      setPreviewPasswords([]);
      
      showToast('success', '導入成功', `已導入 ${projects.length} 個專案和 ${passwords.length} 個密碼`);
    } catch (error) {
      showToast('error', '導入失敗', error instanceof Error ? error.message : '未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <TableCellsIcon className="h-5 w-5 text-blue-500" />
        <h2 className="text-lg font-semibold text-gray-900">表格數據導入</h2>
      </div>

      {/* 專案表格輸入 */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            專案表格數據
          </label>
          <textarea
            value={tableText}
            onChange={(e) => setTableText(e.target.value)}
            className="w-full h-40 p-3 border border-gray-300 rounded-lg font-mono text-sm"
            placeholder="請貼上專案表格數據...
例如：
| 日期＋檔案名稱 | 說明 | GitHub | vercel | 路徑 | 狀態備註 |
| 7-30 V6_確認vercel授權-9 | ［重要］核心whisper專案 | https://github.com/... | https://vercel.com/... | E:\個人項目 | |"
          />
        </div>
      </div>

      {/* 密碼表格輸入 */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            密碼表格數據
          </label>
          <textarea
            value={passwordText}
            onChange={(e) => setPasswordText(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-sm"
            placeholder="請貼上密碼表格數據...
例如：
| 平台 | 帳號 | 密碼 |
| Paddle | billy051015@gmail.com | n9una8YZrw1JKGnLsviX |"
          />
        </div>
      </div>

      {/* 操作按鈕 */}
      <div className="flex space-x-3">
        <button
          onClick={handlePreview}
          className="btn-secondary flex items-center space-x-2"
        >
          <DocumentArrowUpIcon className="h-4 w-4" />
          <span>預覽解析</span>
        </button>
        
        {(previewProjects.length > 0 || previewPasswords.length > 0) && (
          <button
            onClick={handleImport}
            disabled={loading}
            className="btn-primary flex items-center space-x-2 relative"
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </div>
            )}
            <span className={loading ? 'invisible' : 'flex items-center space-x-2'}>
              <CheckCircleIcon className="h-4 w-4" />
              <span>確認導入</span>
            </span>
          </button>
        )}
      </div>

      {/* 預覽結果 */}
      {(previewProjects.length > 0 || previewPasswords.length > 0) && (
        <div className="mt-6 space-y-4">
          <h3 className="text-md font-medium text-gray-900">預覽結果</h3>
          
          {previewProjects.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-800">專案數據 ({previewProjects.length} 項)</span>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {previewProjects.map((project, index) => (
                  <div key={index} className="text-sm text-green-700 py-1">
                    {project.dateAndFileName} - {project.description}
                  </div>
                ))}
              </div>
            </div>
          )}

          {previewPasswords.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                <span className="font-medium text-blue-800">密碼數據 ({previewPasswords.length} 項)</span>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {previewPasswords.map((password, index) => (
                  <div key={index} className="text-sm text-blue-700 py-1">
                    {password.platform} - {password.account}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
        <strong>使用說明：</strong>
        <ul className="mt-1 space-y-1">
          <li>• 請貼上 Markdown 格式的表格數據</li>
          <li>• 專案表格應包含：日期檔名、說明、GitHub、Vercel、路徑、狀態備註等欄位</li>
          <li>• 密碼表格應包含：平台、帳號、密碼等欄位</li>
          <li>• 支援自動識別專案類別（［重要］、［次］、［子實踐］等）</li>
        </ul>
      </div>
    </div>
  );
}
