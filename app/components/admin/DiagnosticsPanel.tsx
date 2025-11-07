'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/ToastProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  ServerIcon, 
  DocumentTextIcon,
  HashtagIcon,
  CloudIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

type DiagnosticData = {
  timestamp: string;
  database: {
    status: string;
    tables: Array<{
      name: string;
      status: string;
      count?: number;
      error?: string;
    }>;
    projectCount: number;
    imageMetadataCount: number;
    error?: string;
  };
  storage: {
    status: string;
    buckets: Array<{
      name: string;
      status: string;
      fileCount?: number;
      error?: string;
    }>;
    imageCount: number;
    totalSize: number;
    error?: string;
  };
  environment: {
    nodeEnv: string;
    hasSupabaseUrl: boolean;
    hasAnonKey: boolean;
    hasServiceKey: boolean;
    hasAdminPassword: boolean;
    supabaseUrl: string;
  };
};

const DiagnosticCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-card rounded-lg shadow-sm border border-border p-6">
    <div className="flex items-center mb-4">
      {icon}
      <h3 className="text-lg font-semibold ml-3">{title}</h3>
    </div>
    <div className="space-y-3 text-sm">{children}</div>
  </div>
);

const InfoRow = ({ label, value, isStatus = false }: { label: string; value: React.ReactNode; isStatus?: boolean }) => (
  <div className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
    <span className="text-muted-foreground">{label}</span>
    {isStatus ? value : <span className="font-mono text-foreground break-all">{String(value)}</span>}
  </div>
);

const StatusIndicator = ({ value }: { value: boolean }) => (
  value 
    ? <span className="flex items-center text-green-600"><CheckCircleIcon className="h-5 w-5 mr-1" /> 正常</span>
    : <span className="flex items-center text-red-600"><XCircleIcon className="h-5 w-5 mr-1" /> 異常</span>
);

export function DiagnosticsPanel() {
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const adminPassword = localStorage.getItem('remembered_password') || '';
        
        // 前端緩存破壞：添加時間戳參數和 HTTP 標頭
        const response = await fetch(`/api/admin/diagnose?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 
            'x-admin-password': adminPassword,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '未知錯誤';
        setError(`無法載入診斷資訊: ${errorMessage}`);
        showToast('error', '載入失敗', errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showToast]);

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner text="正在讀取系統診斷資訊..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4" />
        <p>{error}</p>
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-center text-muted-foreground">沒有可用的診斷資訊。</div>;
  }

  return (
    <div className="p-6 bg-background space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        <DiagnosticCard title="Supabase 資料庫狀態" icon={<ServerIcon className="h-6 w-6 text-primary-600" />}>
          <InfoRow label="連線狀態" value={<StatusIndicator value={data.database.status === 'connected'} />} isStatus />
          <InfoRow label="專案數量" value={data.database.projectCount} />
          <InfoRow label="圖片元數據數量" value={data.database.imageMetadataCount} />
          {data.database.error && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
              錯誤: {data.database.error}
            </div>
          )}
        </DiagnosticCard>

        <DiagnosticCard title="Supabase Storage 狀態" icon={<CloudIcon className="h-6 w-6 text-primary-600" />}>
          <InfoRow label="連線狀態" value={<StatusIndicator value={data.storage.status === 'connected'} />} isStatus />
          <InfoRow label="圖片數量" value={data.storage.imageCount} />
          <InfoRow label="總大小 (Bytes)" value={data.storage.totalSize.toLocaleString()} />
          {data.storage.error && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
              錯誤: {data.storage.error}
            </div>
          )}
        </DiagnosticCard>

        <DiagnosticCard title="環境配置" icon={<DocumentTextIcon className="h-6 w-6 text-primary-600" />}>
          <InfoRow label="Node 環境" value={data.environment.nodeEnv} />
          <InfoRow label="Supabase URL 已設定" value={<StatusIndicator value={data.environment.hasSupabaseUrl} />} isStatus />
          <InfoRow label="Anon Key 已設定" value={<StatusIndicator value={data.environment.hasAnonKey} />} isStatus />
          <InfoRow label="Service Key 已設定" value={<StatusIndicator value={data.environment.hasServiceKey} />} isStatus />
          <InfoRow label="管理密碼已設定" value={<StatusIndicator value={data.environment.hasAdminPassword} />} isStatus />
          <InfoRow label="診斷時間" value={new Date(data.timestamp).toLocaleString()} />
        </DiagnosticCard>

      </div>
      
      <DiagnosticCard title="資料表詳情" icon={<HashtagIcon className="h-6 w-6 text-primary-600" />}>
        <div className="max-h-60 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="p-2">表名稱</th>
                <th className="p-2">狀態</th>
                <th className="p-2 text-right">記錄數</th>
                <th className="p-2">錯誤訊息</th>
              </tr>
            </thead>
            <tbody>
              {data.database.tables.map(table => (
                <tr key={table.name} className="border-t border-border">
                  <td className="p-2 font-mono">{table.name}</td>
                  <td className="p-2">
                    <StatusIndicator value={table.status === 'ok'} />
                  </td>
                  <td className="p-2 font-mono text-right">{table.count || 0}</td>
                  <td className="p-2 text-xs text-red-600 dark:text-red-400">{table.error || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DiagnosticCard>

      <DiagnosticCard title="Storage Buckets" icon={<CloudIcon className="h-6 w-6 text-primary-600" />}>
        <div className="max-h-60 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="p-2">Bucket 名稱</th>
                <th className="p-2">狀態</th>
                <th className="p-2 text-right">檔案數</th>
                <th className="p-2">錯誤訊息</th>
              </tr>
            </thead>
            <tbody>
              {data.storage.buckets.map(bucket => (
                <tr key={bucket.name} className="border-t border-border">
                  <td className="p-2 font-mono">{bucket.name}</td>
                  <td className="p-2">
                    <StatusIndicator value={bucket.status === 'ok'} />
                  </td>
                  <td className="p-2 font-mono text-right">{bucket.fileCount || 0}</td>
                  <td className="p-2 text-xs text-red-600 dark:text-red-400">{bucket.error || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DiagnosticCard>
    </div>
  );
}
