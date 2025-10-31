'use client';

import { useState, useEffect } from 'react';
import { ProjectData, Project, UIDisplaySettings, normalizeProjectStatus, ensureProjectVisibility } from '@/types';
import { ProjectCard } from '@/components/project/ProjectCard';
import { DynamicCategoryFilter } from '@/components/ui/DynamicCategoryFilter';
import { MobileCategorySelect } from '@/components/ui/MobileCategorySelect';
import { StatisticsGrid } from '@/components/ui/StatisticsGrid';
import { UISettingsPanel } from '@/components/ui/UISettingsPanel';
import { SearchBar } from '@/components/ui/SearchBar';
import { Header } from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/components/auth/AuthProvider';
import { getRememberedPassword } from '@/lib/auth';
import {
  EyeIcon,
  EyeSlashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  PhotoIcon,
  Squares2X2Icon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

// 默認 UI 設定
const defaultUIDisplaySettings: UIDisplaySettings = {
  filters: [
    { id: 'all', enabled: true, order: 0, label: '全部' },
    { id: 'important', enabled: true, order: 1, label: '重要' },
    { id: 'secondary', enabled: true, order: 2, label: '次要' },
    { id: 'single-doc', enabled: true, order: 3, label: '單檔專案' },
    { id: 'practice', enabled: true, order: 4, label: '實踐' },
    { id: 'completed', enabled: true, order: 5, label: '完成' },
    { id: 'abandoned', enabled: true, order: 6, label: '捨棄' }
  ],
  statistics: [
    { id: 'stat-total', type: 'totalProjects', enabled: true, order: 0, label: '總專案數' },
    { id: 'stat-display', type: 'displayedCount', enabled: true, order: 1, label: '顯示中' },
    { id: 'stat-single-doc', type: 'singleDocCount', enabled: true, order: 2, label: '單檔文件' }
  ]
};

// 獲取公開專案（訪客模式）
function getPublicProjects(projects: Project[]): Project[] {
  return projects
    .filter(project =>
      !project.hidden &&
      project.visibility.description &&
      project.status !== 'discarded'
    )
    .map(project => ({
      ...project,
      developerNote: '',
    }));
}

export default function HomePage() {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [areImagesCollapsed, setAreImagesCollapsed] = useState<boolean>(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [uiSettings, setUiSettings] = useState<UIDisplaySettings | null>(null);
  const [isQuickEditMode, setIsQuickEditMode] = useState(false);
  
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (projectData) {
      filterProjects();
    }
  }, [projectData, searchQuery, selectedFilter, isAdmin, isPreviewMode]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      
      // 首先嘗試自動初始化（僅在首次部署時）
      try {
        await fetch('/api/initialize');
      } catch (initError) {
        console.warn('自動初始化跳過或失敗:', initError);
      }
      
      // 前端緩存破壞：添加時間戳參數和 HTTP 標頭
      const response = await fetch(`/api/projects?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error('無法載入專案資料');
      }
      const data: ProjectData = await response.json();
      setProjectData(data);
      
      // 載入 UI 設定
      setUiSettings(data.settings.uiDisplay || defaultUIDisplaySettings);
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

  // 手動保存（使用已登入的密碼）
  const handleSaveSettings = async (newSettings: UIDisplaySettings) => {
    try {
      // 使用記憶的密碼
      const password = getRememberedPassword();
      if (!password) {
        alert('❌ 無法獲取管理員密碼，請重新登入');
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
    
    const normalizedProjects = projectData.projects.map((project) => ({
      ...project,
      status: normalizeProjectStatus(project.status, project.category),
      visibility: ensureProjectVisibility(project.visibility),
    }));

    let projects = isAdmin && !isPreviewMode ? normalizedProjects : getPublicProjects(normalizedProjects);

    if (selectedFilter !== 'all') {
      if (selectedFilter.startsWith('status-')) {
        const statusKey = selectedFilter.replace('status-', '') as Project['status'];
        projects = projects.filter((project) => project.status === statusKey);
      } else {
        projects = projects.filter((project) => project.category === selectedFilter);
      }
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
      const categoryOrder = ['important', 'secondary', 'practice', 'single-doc', 'completed', 'abandoned'];
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
      
      {/* 懸浮的管理員操作按鈕組 */}
      {isAdmin && (
        <div className="fixed top-20 right-6 z-50 flex flex-col gap-3 animate-slide-left">
          {/* 預覽訪客視角按鈕 */}
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

          {/* 快速編輯模式按鈕 */}
          {!isPreviewMode && (
            <button 
              onClick={() => setIsQuickEditMode(!isQuickEditMode)} 
              className={`
                flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm
                transition-all duration-200 shadow-2xl hover:scale-105
                ${isQuickEditMode 
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800' 
                  : 'bg-card text-foreground border-2 border-border hover:border-green-400 dark:hover:border-green-500 backdrop-blur-sm'
                }
              `}
              title={isQuickEditMode ? '關閉快速編輯模式' : '開啟快速編輯模式（可調整可見性控制）'}
            >
              <PencilSquareIcon className="h-5 w-5" />
              <span className="hidden sm:inline">{isQuickEditMode ? '快速編輯中' : '快速編輯'}</span>
            </button>
          )}
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

        {/* 快速編輯模式提示 */}
        {isAdmin && !isPreviewMode && isQuickEditMode && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 border-2 border-green-300 dark:border-green-500/40 rounded-xl p-5 shadow-lg animate-slide-up">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="relative">
                  <PencilSquareIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <div className="absolute inset-0 bg-green-400 rounded-full blur-md opacity-30 animate-pulse"></div>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-green-900 dark:text-green-100 mb-1">
                  快速編輯模式
                </h4>
                <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">
                  您可以快速調整每個專案的可見性控制。所有變更將即時儲存。精選、隱藏、編輯按鈕始終可用。
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
          <div className="mb-8">
            {/* 搜尋框 - 手機版獨立顯示 */}
            <div className="mb-4 bg-gradient-to-br from-card via-card to-primary-50/30 dark:to-primary-500/5 rounded-xl shadow-md border border-border/50 p-4 backdrop-blur-sm">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="搜尋專案名稱、說明或備註..."
              />
            </div>

            {/* 篩選與統計區塊 - 響應式佈局 */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* 左側：篩選區域 */}
              <div className="flex-1 bg-gradient-to-br from-card via-card to-primary-50/30 dark:to-primary-500/5 rounded-xl shadow-md border border-border/50 p-4 backdrop-blur-sm">
                {/* 桌面版：顯示所有篩選按鈕 */}
                <div className="hidden md:flex flex-wrap gap-2 items-center">
                  {uiSettings && (
                    <DynamicCategoryFilter
                      configs={uiSettings.filters}
                      value={selectedFilter}
                      onChange={setSelectedFilter}
                    />
                  )}

                  {filteredProjects.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAreImagesCollapsed(!areImagesCollapsed)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary-400 hover:text-primary-500"
                    >
                      <PhotoIcon className="h-4 w-4" />
                      <span>{areImagesCollapsed ? '展開全部圖片' : '收折全部圖片'}</span>
                    </button>
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

                {/* 手機版：簡化篩選 */}
                <div className="md:hidden flex flex-col gap-3">
                  {/* 下拉選單與齒輪並排 */}
                  <div className="flex gap-2">
                    {uiSettings && (
                      <div className="flex-1">
                        <MobileCategorySelect
                          configs={uiSettings.filters}
                          value={selectedFilter}
                          onChange={setSelectedFilter}
                          currentLabel={uiSettings.filters.find(f => f.id === selectedFilter)?.label || '分類'}
                        />
                      </div>
                    )}
                    
                    {isAdmin && !isPreviewMode && (
                      <button
                        onClick={() => setShowSettingsPanel(true)}
                        className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium border transition-all duration-200 text-muted-foreground bg-card border-border hover:border-primary-300 dark:hover:border-primary-600 hover:bg-muted/50"
                        title="顯示設定"
                      >
                        <Cog6ToothIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  {/* 圖片收折按鈕 */}
                  {filteredProjects.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAreImagesCollapsed(!areImagesCollapsed)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary-400 hover:text-primary-500"
                    >
                      <PhotoIcon className="h-4 w-4" />
                      <span>{areImagesCollapsed ? '展開全部圖片' : '收折全部圖片'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 右側：統計區塊 */}
              {projectData && uiSettings && (
                <div className="w-full md:w-auto">
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
          </div>

          {/* 專案列表 */}
          {filteredProjects.length === 0 ? (
            <EmptyState
              title={searchQuery || selectedFilter !== 'all' ? '無符合條件的專案' : '暫無專案'}
              description={searchQuery || selectedFilter !== 'all' ? '試試調整搜尋條件或篩選器' : '目前還沒有任何專案'}
              icon={searchQuery || selectedFilter !== 'all' ? 'search' : 'inbox'}
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
                      project={{ ...project, imagePreviews: project.imagePreviews }}
                      isAdmin={isAdmin && !isPreviewMode}
                      showToggleControls={isQuickEditMode}
                      imageCollapsedOverride={areImagesCollapsed}
                      onUpdate={(updatedProject) => {
                        if (!projectData) return;
                        setProjectData({
                          ...projectData,
                          projects: projectData.projects.map((p) =>
                            p.id === updatedProject.id ? updatedProject : p
                          ),
                        });
                      }}
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
