'use client';

import { useState, useEffect } from 'react';
import { ProjectData, Project } from '@/types';
import { ProjectCard } from '@/components/project/ProjectCard';
import { CategoryFilter } from '@/components/project/CategoryFilter';
import { SearchBar } from '@/components/ui/SearchBar';
import { Header } from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { getPublicProjects } from '@/lib/blob-storage';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  EyeIcon, 
  EyeSlashIcon,
  ChartBarIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
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
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤');
    } finally {
      setLoading(false);
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 管理員控制列 */}
        {isAdmin && (
          <div className="flex justify-end items-center space-x-3 mb-6">
            <button 
              onClick={() => setIsPreviewMode(!isPreviewMode)} 
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
                transition-all duration-200
                ${isPreviewMode 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700' 
                  : 'bg-card text-foreground border-2 border-border hover:border-blue-400 dark:hover:border-blue-500'
                }
              `}
            >
              {isPreviewMode ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              <span>{isPreviewMode ? '結束預覽' : '預覽訪客視角'}</span>
            </button>
          </div>
        )}
        
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
          {/* 搜尋和篩選區域 */}
          <div className="mb-8">
            {/* 卡片包裹 */}
            <div className="bg-gradient-to-br from-card via-card to-primary-50/30 dark:to-primary-500/5 rounded-2xl shadow-lg border border-border/50 p-6 backdrop-blur-sm">
              {/* 標題 */}
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 bg-primary-100 dark:bg-primary-500/20 rounded-lg">
                  <MagnifyingGlassIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-lg font-bold text-foreground">探索專案</h2>
              </div>

              {/* 搜尋欄 */}
              <div className="mb-5">
                <SearchBar 
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="搜尋專案名稱、說明或備註..."
                />
              </div>

              {/* 分類篩選 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FunnelIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">分類篩選</span>
                </div>
                <CategoryFilter 
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                />
              </div>
            </div>
          </div>

          {/* 統計資訊卡片 */}
          {projectData && (
            <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 總專案數 */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-500/10 dark:to-blue-500/5 rounded-xl p-5 border border-blue-200/50 dark:border-blue-500/30 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <ChartBarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {isAdmin && !isPreviewMode ? projectData.metadata.totalProjects : projectData.metadata.publicProjects}
                  </span>
                </div>
                <p className="text-sm font-medium text-blue-900/70 dark:text-blue-100/70">
                  {isAdmin && !isPreviewMode ? '總專案數' : '公開專案'}
                </p>
              </div>

              {/* 篩選結果 */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-500/10 dark:to-purple-500/5 rounded-xl p-5 border border-purple-200/50 dark:border-purple-500/30 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <FunnelIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {filteredProjects.length}
                  </span>
                </div>
                <p className="text-sm font-medium text-purple-900/70 dark:text-purple-100/70">
                  {searchQuery || selectedCategory !== 'all' ? '篩選結果' : '顯示中'}
                </p>
              </div>

              {/* 搜尋狀態 */}
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-500/10 dark:to-green-500/5 rounded-xl p-5 border border-green-200/50 dark:border-green-500/30 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <MagnifyingGlassIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {searchQuery ? '搜尋中' : '✓'}
                  </span>
                </div>
                <p className="text-sm font-medium text-green-900/70 dark:text-green-100/70">
                  {searchQuery ? '已啟用搜尋' : '準備就緒'}
                </p>
              </div>
            </div>
          )}

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
    </div>
  );
}
