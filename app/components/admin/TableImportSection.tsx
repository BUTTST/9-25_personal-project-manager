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
    const lines = text.split('\n');
    const rowStrings: string[] = [];
    let currentRow: string | null = null;

    for (const rawLine of lines) {
      const trimmedLine = rawLine.trimEnd();
      if (!trimmedLine.trim()) continue;

      if (trimmedLine.trimStart().startsWith('|')) {
        if (currentRow) {
          rowStrings.push(currentRow);
        }
        currentRow = trimmedLine;
      } else if (currentRow) {
        currentRow += ` ${trimmedLine}`;
      }
    }

    if (currentRow) {
      rowStrings.push(currentRow);
    }

    const projects: ParsedProject[] = [];

    const extractUrl = (value: string): string => {
      const trimmed = value?.trim?.() ?? '';
      if (!trimmed || trimmed === 'undefined') return '';
      if (trimmed.includes('無') || trimmed.includes('未部屬')) return '';

      const boldMatch = trimmed.match(/\*\*\[.*?\]\*\*\((.*?)\)/);
      if (boldMatch) return boldMatch[1];

      const markdownMatch = trimmed.match(/\[.*?\]\((.*?)\)/);
      if (markdownMatch) return markdownMatch[1];

      return trimmed;
    };

    for (const row of rowStrings) {
      if (!row.includes('|')) continue;
      if (row.includes('|---') || row.includes('日期＋檔案名稱')) continue;

      const rawColumns = row.split('|');

      if (rawColumns[0] === '') rawColumns.shift();
      if (rawColumns.length && rawColumns[rawColumns.length - 1].trim() === '') {
        rawColumns.pop();
      }

      const columns = rawColumns.map(col => col.trim());

      // 跳過分隔符行（包含多個 --- 的行）
      const isSeparatorRow = columns.some(col => col.includes('---')) ||
                            columns.every(col => col === '' || col === '---' || !col);
      if (isSeparatorRow) continue;

      if (columns.every(col => !col)) continue;

      while (columns.length < 6) {
        columns.push('');
      }

      const [
        dateFileName = '',
        description = '',
        github = '',
        vercel = '',
        path = '',
        statusNote = '',
        ...extraColumns
      ] = columns;

      if (!description.trim()) continue;

      const combinedStatusNote = [statusNote, ...extraColumns]
        .filter(Boolean)
        .join(' ');

      projects.push({
        dateAndFileName: dateFileName.trim(),
        description: description.trim(),
        github: extractUrl(github),
        vercel: extractUrl(vercel),
        path: path && path !== 'undefined' ? path.trim() : '',
        statusNote: combinedStatusNote && combinedStatusNote !== 'undefined' ? combinedStatusNote.trim() : ''
      });
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
      console.error('解析錯誤:', error);
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
    <div className="p-6 space-y-6 text-foreground">
      <div className="flex items-center space-x-2 mb-4">
        <TableCellsIcon className="h-5 w-5 text-primary-500" />
        <h2 className="text-lg font-semibold">表格數據導入</h2>
      </div>

      {/* 專案表格輸入 */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            專案表格數據
          </label>
          <textarea
            value={tableText}
            onChange={(e) => setTableText(e.target.value)}
            className="w-full h-40 p-3 border border-border rounded-lg bg-card font-mono text-sm text-foreground placeholder:text-muted-foreground"
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
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            密碼表格數據
          </label>
          <textarea
            value={passwordText}
            onChange={(e) => setPasswordText(e.target.value)}
            className="w-full h-32 p-3 border border-border rounded-lg bg-card font-mono text-sm text-foreground placeholder:text-muted-foreground"
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
          <h3 className="text-md font-medium">預覽結果</h3>
          
          {previewProjects.length > 0 && (
            <div className="bg-green-50 dark:bg-green-500/10 p-4 rounded-lg border border-green-200/60 dark:border-green-500/30">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-800 dark:text-green-200">專案數據 ({previewProjects.length} 項)</span>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {previewProjects.map((project, index) => (
                  <div key={index} className="text-sm text-green-700 dark:text-green-200/90 py-1">
                    {project.dateAndFileName} - {project.description}
                  </div>
                ))}
              </div>
            </div>
          )}

          {previewPasswords.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-lg border border-blue-200/60 dark:border-blue-500/30">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                <span className="font-medium text-blue-800 dark:text-blue-200">密碼數據 ({previewPasswords.length} 項)</span>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {previewPasswords.map((password, index) => (
                  <div key={index} className="text-sm text-blue-700 dark:text-blue-200/90 py-1">
                    {password.platform} - {password.account}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-muted-foreground bg-muted p-3 rounded border border-border/60">
        <strong className="text-foreground">使用說明：</strong>
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
