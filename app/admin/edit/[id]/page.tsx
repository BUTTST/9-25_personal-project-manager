'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { EditProjectModal } from '@/components/admin/EditProjectModal';
import { Project } from '@/types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function EditProjectPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }
    if (projectId) {
      loadProject();
    }
  }, [isAdmin, projectId, router]);

  useEffect(() => {
    if (project) {
      setIsModalOpen(true);
    }
  }, [project]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const adminPassword = typeof window !== 'undefined' ? localStorage.getItem('remembered_password') || '' : '';
      
      // 前端緩存破壞：添加時間戳參數和 HTTP 標頭
      const response = await fetch(`/api/projects/${projectId}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'x-admin-password': adminPassword,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error('無法載入專案資料');
      }

      const projectData = await response.json();
      setProject(projectData);
    } catch (error) {
      showToast('error', '載入失敗', error instanceof Error ? error.message : '未知錯誤');
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (updatedProject: Project) => {
    setProject(updatedProject);
    showToast('success', '專案已更新');
  };

  const handleClose = () => {
    setIsModalOpen(false);
    // 延遲導航以確保動畫完成
    setTimeout(() => {
      router.push('/admin');
    }, 200);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 頂部導覽 */}
      <div className="bg-card border-b border-border sticky top-0 z-40 backdrop-blur-sm bg-card/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="font-medium">返回管理後台</span>
            </button>
          </div>
        </div>
      </div>

      {/* 編輯 Modal */}
      {project && (
        <EditProjectModal
          project={project}
          isOpen={isModalOpen}
          onClose={handleClose}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
