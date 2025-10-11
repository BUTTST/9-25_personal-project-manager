'use client';

import { useState, useEffect } from 'react';
import { ProjectData, Project, UIDisplaySettings } from '@/types';
import { ProjectCard } from '@/components/project/ProjectCard';
import { DynamicCategoryFilter } from '@/components/ui/DynamicCategoryFilter';
import { StatisticsGrid } from '@/components/ui/StatisticsGrid';
import { UISettingsPanel } from '@/components/ui/UISettingsPanel';
import { SearchBar } from '@/components/ui/SearchBar';
import { Header } from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { getPublicProjects, defaultProjectData } from '@/lib/blob-storage';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  EyeIcon, 
  EyeSlashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [uiSettings, setUiSettings] = useState<UIDisplaySettings | null>(null);
  
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (projectData) {
      filterProjects();
    }
  }, [projectData, searchQuery, selectedCategory, isAdmin, isPreviewMode]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      
      // 首先嘗試自動初始化（僅在首次部署時）
      try {
        await fetch('/api/initialize');
      } catch (initError) {
        console.warn('自動初始化跳過或失敗:', initError);
      }
      
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('無法載入專案資料');
      }
      const data = await response.json();
      setProjectData(data);
      
      // 載入 UI 設定
      setUiSettings(data.settings.uiDisplay || defaultProjectData.settings.uiDisplay!);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 即時更新（無需密碼，僅更新本地狀態）
  const handleQuickUpdateSettings = (newSettings: UIDisplaySettings) => {
    setUiSettings(newSettings);
  };

  // 手動保存（需要密碼確認）
  const handleSaveSettings = async (newSettings: UIDisplaySettings) => {
    try {
      // 提示輸入密碼
      const password = prompt('請輸入管理員密碼以確認儲存變更：');
      if (!password) {
        alert('未提供密碼，取消儲存');
        return;
      }
      
      const response = await fetch('/api/settings/ui-display', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify(newSettings)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '儲存失敗');
      }
      
      // 更新本地狀態
      setUiSettings(newSettings);
      
      // 重新載入專案資料以確保同步
      await loadProjects();
      
      alert('✅ 設定已成功儲存到伺服器！');
    } catch (error) {
      console.error('儲存設定失敗:', error);
      alert(`❌ 儲存失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  const filterProjects = () => {
    if (!projectData) return;
    
    // 根據預覽模式決定顯示哪些專案
    let projects = (isAdmin && !isPreviewMode) 
      ? projectData.projects 
      : getPublicProjects(projectData.projects);
    
    // 依照類別篩選
    if (selectedCategory !== 'all') {
      projects = projects.filter(project => project.category === selectedCategory);
    }
    
    // 依照搜尋關鍵字篩選
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      projects = projects.filter(project => 
        project.dateAndFileName.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.statusNote?.toLowerCase().includes(query) ||
        project.publicNote?.toLowerCase().includes(query) ||
        (isAdmin && !isPreviewMode && project.developerNote?.toLowerCase().includes(query))
      );
    }
    
    // 依照重要性和更新時間排序
    projects.sort((a, b) => {
      // 精選項目優先
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
      }
      // 然後依照類別重要性
      const categoryOrder = ['important', 'secondary', 'practice', 'completed', 'abandoned'];
      const aIndex = categoryOrder.indexOf(a.category);
      const bIndex = categoryOrder.indexOf(b.category);
      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }
      // 最後依照更新時間
      return b.updatedAt - a.updatedAt;
    });
    
    setFilteredProjects(projects);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Header />
      
      {/* 懸浮的預覽訪客視角按鈕 */}
      {isAdmin && (
        <div className="fixed top-20 right-6 z-50 animate-slide-left">
          <button 
            onClick={() => setIsPreviewMode(!isPreviewMode)} 
            className={`
              flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm
              transition-all duration-200 shadow-2xl hover:scale-105
              ${isPreviewMode 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800' 
                : 'bg-card text-foreground border-2 border-border hover:border-blue-400 dark:hover:border-blue-500 backdrop-blur-sm'
              }
            `}
            title={isPreviewMode ? '點擊結束預覽模式' : '點擊以訪客身份預覽'}
          >
            {isPreviewMode ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            <span className="hidden sm:inline">{isPreviewMode ? '結束預覽' : '預覽訪客'}</span>
          </button>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 預覽模式提示 */}
        {isAdmin && isPreviewMode && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border-2 border-blue-300 dark:border-blue-500/40 rounded-xl p-5 shadow-lg animate-slide-up">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="relative">
                  <EyeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <div className="absolute inset-0 bg-blue-400 rounded-full blur-md opacity-30 animate-pulse"></div>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">
                  預覽模式
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  您正在以訪客身份預覽此頁面。只會顯示對訪客可見的內容，開發者註解和隱藏專案不會顯示。
                </p>
              </div>
            </div>
          </div>
        )}
        
        {loading && (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner text="專案載入中" />
          </div>
        )}

        {error && !loading && (
          <div className="my-16">
            <EmptyState
              title="載入失敗"
              description={error}
              icon="search"
              action={{ label: '重新載入', onClick: loadProjects }}
            />
          </div>
        )}

        {!loading && !error && (
        <>
          {/* 搜尋篩選與統計區塊 */}
          <div className="mb-8 flex gap-4 items-stretch">
            {/* 左側：搜尋與篩選 */}
            <div className="flex-1 flex flex-col gap-4">
              {/* 搜尋框 */}
              <div className="bg-gradient-to-br from-card via-card to-primary-50/30 dark:to-primary-500/5 rounded-xl shadow-md border border-border/50 p-4 backdrop-blur-sm flex-shrink-0">
                <SearchBar 
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="搜尋專案名稱、說明或備註..."
                />
              </div>

              {/* 篩選按鈕區域 */}
              <div className="bg-gradient-to-br from-card via-card to-primary-50/30 dark:to-primary-500/5 rounded-xl shadow-md border border-border/50 p-4 backdrop-blur-sm flex-1">
                <div className="flex flex-wrap gap-2 items-center">
                  {uiSettings && (
                    <DynamicCategoryFilter 
                      configs={uiSettings.filters}
                      value={selectedCategory}
                      onChange={setSelectedCategory}
                    />
                  )}
                  
                  {/* 設定按鈕（僅管理員可見） */}
                  {isAdmin && !isPreviewMode && (
                    <button 
                      onClick={() => setShowSettingsPanel(true)}
                      className="group relative inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 text-muted-foreground bg-card border-border hover:border-primary-300 dark:hover:border-primary-600 hover:bg-muted/50 hover:scale-110"
                      title="顯示設定"
                    >
                      <Cog6ToothIcon className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 右側：統計區塊 */}
            {projectData && uiSettings && (
              <div className="w-auto flex items-stretch">
                <StatisticsGrid 
                  configs={uiSettings.statistics}
                  allProjects={projectData.projects}
                  filteredProjects={filteredProjects}
                  isAdmin={isAdmin}
                  isPreviewMode={isPreviewMode}
                />
              </div>
            )}
          </div>

          {/* 專案列表 */}
          {filteredProjects.length === 0 ? (
            <EmptyState 
              title={searchQuery || selectedCategory !== 'all' ? '無符合條件的專案' : '暫無專案'}
              description={searchQuery || selectedCategory !== 'all' ? '試試調整搜尋條件或篩選器' : '目前還沒有任何專案'}
              icon={searchQuery || selectedCategory !== 'all' ? 'search' : 'inbox'}
            />
          ) : (
            <div>
              {/* 專案列表標題 */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  專案列表
                  <span className="ml-3 text-sm font-normal text-muted-foreground">
                    共 {filteredProjects.length} 個專案
                  </span>
                </h2>
              </div>
              
              {/* 專案網格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
                {filteredProjects.map((project, index) => (
                  <div 
                    key={project.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ProjectCard 
                      project={project} 
                      isAdmin={isAdmin && !isPreviewMode}
                      showToggleControls={projectData?.settings.showToggleControls ?? true}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
        )}
      </div>
      
      {/* UI 設定面板（僅管理員可見） */}
      {isAdmin && !isPreviewMode && showSettingsPanel && uiSettings && (
        <UISettingsPanel 
          settings={uiSettings}
          onClose={() => setShowSettingsPanel(false)}
          onQuickUpdate={handleQuickUpdateSettings}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  );
}
