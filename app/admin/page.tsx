'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProjectData, Project } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ProjectTable } from '@/components/admin/ProjectTable';
import { SettingsSection } from '@/components/admin/SettingsSection';
import { TableImportSection } from '@/components/admin/TableImportSection';
import {
  PlusIcon,
  CogIcon,
  ChartBarIcon,
  SparklesIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { ToggleControl } from '@/components/ui/ToggleControl';
import { HeaderThemeToggle } from '@/components/ui/HeaderThemeToggle';
import { DiagnosticsPanel } from '@/components/admin/DiagnosticsPanel';

export default function AdminPage() {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'import' | 'settings' | 'diagnostics'>('projects');
  
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }
    loadData();
  }, [isAdmin, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const adminPassword = typeof window !== 'undefined' ? localStorage.getItem('remembered_password') || '' : '';
      
      // 前端緩存破壞：添加時間戳參數和 HTTP 標頭
      const response = await fetch(`/api/projects?admin=true&t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'x-admin-password': adminPassword,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('無法載入資料');
      }
      
      const data = await response.json();
      setProjectData(data);
    } catch (error) {
      showToast('error', '載入失敗', error instanceof Error ? error.message : '未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    if (!projectData) return;
    
    setProjectData({
      ...projectData,
      projects: projectData.projects.map(p => 
        p.id === updatedProject.id ? updatedProject : p
      )
    });
  };

  const handleProjectDelete = (projectId: string) => {
    if (!projectData) return;
    
    setProjectData({
      ...projectData,
      projects: projectData.projects.filter(p => p.id !== projectId)
    });
  };

  const handleSettingsUpdate = (updatedSettings: ProjectData['settings']) => {
    if (!projectData) return;
    
    setProjectData({
      ...projectData,
      settings: updatedSettings
    });
  };


  const handleImportComplete = async (newProjects: Project[]) => {
    if (!projectData) return;

    const updatedData = {
      ...projectData,
      projects: [...projectData.projects, ...newProjects]
    };

    setProjectData(updatedData);
    
    try {
      const adminPassword = typeof window !== 'undefined' ? localStorage.getItem('remembered_password') || '' : '';

      for (const project of newProjects) {
        await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': adminPassword,
          },
          body: JSON.stringify(project),
        });
      }

      showToast('success', '數據同步完成', '所有資料已保存到雲端');
    } catch (error) {
      showToast('warning', '部分同步失敗', '請檢查網路連線');
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="載入管理後台..." />
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-2">載入失敗</div>
          <button onClick={loadData} className="btn-primary">
            重新載入
          </button>
        </div>
      </div>
    );
  }

  const stats = {
    total: projectData.projects.length,
    important: projectData.projects.filter((p) => p.category === 'important').length,
    completed: projectData.projects.filter((p) => p.status === 'completed').length,
    public: projectData.projects.filter((p) => p.visibility.description).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary-50/20 dark:to-primary-500/5 text-foreground">
      {/* 標題列 */}
      <div className="bg-card/80 backdrop-blur-lg shadow-lg border-b border-border/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                <CogIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary-600 dark:to-primary-400 bg-clip-text text-transparent">
                  管理後台
                </h1>
                <p className="text-sm text-muted-foreground">專案管理系統</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link 
                href="/" 
                className="btn-secondary shadow-sm hover:shadow-md transition-shadow"
              >
                返回首頁
              </Link>
              <Link 
                href="/admin/new" 
                className="btn-primary flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <PlusIcon className="h-4 w-4" />
                <span>新增專案</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 統計卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {/* 總專案數 */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <ChartBarIcon className="h-8 w-8 text-white/90" />
                  <div className="text-4xl font-black text-white drop-shadow-lg">{stats.total}</div>
                </div>
                <div className="text-sm font-semibold text-white/90 uppercase tracking-wide">總專案</div>
              </div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            {/* 重要專案 */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <SparklesIcon className="h-8 w-8 text-white/90" />
                  <div className="text-4xl font-black text-white drop-shadow-lg">{stats.important}</div>
                </div>
                <div className="text-sm font-semibold text-white/90 uppercase tracking-wide">重要專案</div>
              </div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            {/* 已完成 */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <CheckCircleIcon className="h-8 w-8 text-white/90" />
                  <div className="text-4xl font-black text-white drop-shadow-lg">{stats.completed}</div>
                </div>
                <div className="text-sm font-semibold text-white/90 uppercase tracking-wide">已完成</div>
              </div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            {/* 公開專案 */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <CheckCircleIcon className="h-8 w-8 text-white/90" />
                  <div className="text-4xl font-black text-white drop-shadow-lg">{stats.public}</div>
                </div>
                <div className="text-sm font-semibold text-white/90 uppercase tracking-wide">公開專案</div>
              </div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            </div>
          </div>


          {/* 選項卡列 */}
          <div className="mb-6">
            {/* 新的 Tab 設計 */}
            <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-2 border border-border/50 shadow-lg">
              <div className="flex space-x-2 relative">
                {/* 滑動指示器 */}
                <div
                  className="absolute bottom-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300 ease-out"
                  style={{
                    left:
                      activeTab === 'projects'
                        ? '0%'
                        : activeTab === 'import'
                          ? '33.33%'
                          : activeTab === 'settings'
                            ? '66.66%'
                            : '100%',
                    width: '33.33%',
                    transform: activeTab === 'diagnostics' ? 'translateX(-66.66%)' : 'translateX(0)',
                  }}
                />
                
                {/* Tab 按鈕 */}
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 ${
                    activeTab === 'projects'
                      ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  專案管理
                </button>
                
                <button
                  onClick={() => setActiveTab('import')}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 ${
                    activeTab === 'import'
                      ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  批量導入
                </button>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 ${
                    activeTab === 'settings'
                      ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  系統設定
                </button>
                
                <button
                  onClick={() => setActiveTab('diagnostics')}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 ${
                    activeTab === 'diagnostics'
                      ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  系統診斷
                </button>
              </div>
            </div>
          </div>

          {/* 內容區域 */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-xl border border-border/50 overflow-hidden animate-fade-in">
            {activeTab === 'projects' && (
              <ProjectTable
                projects={projectData.projects}
                showToggleControls={projectData.settings.showToggleControls}
                onUpdate={handleProjectUpdate}
                onDelete={handleProjectDelete}
              />
            )}
            
            {activeTab === 'import' && (
              <TableImportSection
                onImportComplete={handleImportComplete}
              />
            )}
            
            {activeTab === 'settings' && (
              <SettingsSection
                settings={projectData.settings}
                projectData={projectData}
                onUpdate={handleSettingsUpdate}
              />
            )}
            {activeTab === 'diagnostics' && (
              <DiagnosticsPanel />
            )}
          </div>
      </div>
    </div>
  );
}
