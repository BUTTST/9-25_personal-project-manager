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
  blobDetails: {
    pathname: string;
    url: string;
    size: number;
    uploadedAt: string | null;
    contentType: string;
    contentHash: string;
  };
  contentSummary: {
    isValidJson: boolean;
    projectCount: number;
    passwordCount: number;
    contentSize: number;
  };
  environment: {
    nodeEnv: string;
    vercelEnv: string;
    vercelUrl: string;
    vercelGitCommitSha: string;
    hasAdminPassword: boolean;
    hasBlobToken: boolean;
  };
  allBlobs: {
    pathname: string;
    size: number;
    uploadedAt: string;
  }[];
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
        
        <DiagnosticCard title="Vercel Blob 核心狀態" icon={<CloudIcon className="h-6 w-6 text-primary-600" />}>
          <InfoRow label="檔案路徑" value={data.blobDetails.pathname} />
          <InfoRow label="檔案大小 (Bytes)" value={data.blobDetails.size.toLocaleString()} />
          <InfoRow label="內容大小 (Bytes)" value={data.contentSummary.contentSize.toLocaleString()} />
          <InfoRow label="最後上傳時間" value={data.blobDetails.uploadedAt ? new Date(data.blobDetails.uploadedAt).toLocaleString() : 'N/A'} />
          <InfoRow label="內容類型" value={data.blobDetails.contentType} />
        </DiagnosticCard>

        <DiagnosticCard title="資料完整性" icon={<DocumentTextIcon className="h-6 w-6 text-primary-600" />}>
          <InfoRow label="內容指紋 (SHA-256)" value={<span className="text-xs">{data.blobDetails.contentHash}</span>} />
          <InfoRow label="是有效的JSON" value={<StatusIndicator value={data.contentSummary.isValidJson} />} isStatus />
          <InfoRow label="專案數量" value={data.contentSummary.projectCount} />
          <InfoRow label="密碼數量" value={data.contentSummary.passwordCount} />
        </DiagnosticCard>

        <DiagnosticCard title="環境與部署" icon={<ServerIcon className="h-6 w-6 text-primary-600" />}>
          <InfoRow label="部署環境" value={data.environment.vercelEnv} />
          <InfoRow label="部署版本 (Commit SHA)" value={<span className="text-xs">{data.environment.vercelGitCommitSha}</span>} />
          <InfoRow label="管理密碼已設定" value={<StatusIndicator value={data.environment.hasAdminPassword} />} isStatus />
          <InfoRow label="Blob Token 已設定" value={<StatusIndicator value={data.environment.hasBlobToken} />} isStatus />
          <InfoRow label="診斷時間" value={new Date(data.timestamp).toLocaleString()} />
        </DiagnosticCard>

      </div>
      
      <DiagnosticCard title="所有 Blob 項目" icon={<HashtagIcon className="h-6 w-6 text-primary-600" />}>
        <div className="max-h-60 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="p-2">路徑</th>
                <th className="p-2 text-right">大小 (Bytes)</th>
                <th className="p-2">上傳時間</th>
              </tr>
            </thead>
            <tbody>
              {data.allBlobs.map(blob => (
                <tr key={blob.pathname} className="border-t border-border">
                  <td className="p-2 font-mono break-all">{blob.pathname}</td>
                  <td className="p-2 font-mono text-right">{blob.size.toLocaleString()}</td>
                  <td className="p-2 font-mono">{new Date(blob.uploadedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DiagnosticCard>
    </div>
  );
}
