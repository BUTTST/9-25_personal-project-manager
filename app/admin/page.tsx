'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProjectData, Project, PasswordEntry } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ProjectTable } from '@/components/admin/ProjectTable';
import { PasswordSection } from '@/components/admin/PasswordSection';
import { SettingsSection } from '@/components/admin/SettingsSection';
import { TableImportSection } from '@/components/admin/TableImportSection';
import { 
  PlusIcon, 
  CogIcon, 
  ChartBarIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

export default function AdminPage() {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'passwords' | 'import' | 'settings'>('projects');
  const [showPasswords, setShowPasswords] = useState(false);
  
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
      const response = await fetch('/api/projects?admin=true', {
        headers: {
          'x-admin-password': adminPassword
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

  const handlePasswordUpdate = (updatedPasswords: PasswordEntry[]) => {
    if (!projectData) return;
    
    setProjectData({
      ...projectData,
      passwords: updatedPasswords
    });
  };

  const handleSettingsUpdate = (updatedSettings: ProjectData['settings']) => {
    if (!projectData) return;
    
    setProjectData({
      ...projectData,
      settings: updatedSettings
    });
  };

  const handleImportComplete = async (newProjects: Project[], newPasswords: PasswordEntry[]) => {
    if (!projectData) return;

    const updatedData = {
      ...projectData,
      projects: [...projectData.projects, ...newProjects],
      passwords: [...projectData.passwords, ...newPasswords]
    };

    setProjectData(updatedData);
    
    // 同步到伺服器
    try {
      const adminPassword = typeof window !== 'undefined' ? localStorage.getItem('remembered_password') || '' : '';
      
      // 批量新增專案
      for (const project of newProjects) {
        await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': adminPassword
          },
          body: JSON.stringify(project)
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
    important: projectData.projects.filter(p => p.category === 'important').length,
    completed: projectData.projects.filter(p => p.category === 'completed').length,
    public: projectData.projects.filter(p => p.visibility.description).length,
    passwords: projectData.passwords.length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 標題列 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">管理後台</h1>
              <p className="text-gray-600">專案管理系統</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="btn-secondary">
                返回首頁
              </Link>
              <Link href="/admin/new" className="btn-primary flex items-center space-x-2">
                <PlusIcon className="h-4 w-4" />
                <span>新增專案</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="card text-center">
            <div className="text-2xl font-bold text-primary-600">{stats.total}</div>
            <div className="text-sm text-gray-600">總專案</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-red-600">{stats.important}</div>
            <div className="text-sm text-gray-600">重要專案</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">已完成</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.public}</div>
            <div className="text-sm text-gray-600">公開專案</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.passwords}</div>
            <div className="text-sm text-gray-600">存储密碼</div>
          </div>
        </div>

        {/* 選項卡列 */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('projects')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'projects'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              專案管理
            </button>
            <button
              onClick={() => setActiveTab('passwords')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'passwords'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>密碼管理</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPasswords(!showPasswords);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                {showPasswords ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'import'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              批量導入
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              系統設定
            </button>
          </nav>
        </div>

        {/* 內容區域 */}
        <div className="bg-white rounded-lg shadow-sm">
          {activeTab === 'projects' && (
            <ProjectTable
              projects={projectData.projects}
              showToggleControls={projectData.settings.showToggleControls}
              onUpdate={handleProjectUpdate}
              onDelete={handleProjectDelete}
            />
          )}
          
          {activeTab === 'passwords' && (
            <PasswordSection
              passwords={projectData.passwords}
              showPasswords={showPasswords}
              onUpdate={handlePasswordUpdate}
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
        </div>
      </div>
    </div>
  );
}
