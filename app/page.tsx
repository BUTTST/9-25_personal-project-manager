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

export default function HomePage() {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (projectData) {
      filterProjects();
    }
  }, [projectData, searchQuery, selectedCategory, isAdmin]);

  const loadProjects = async () => {
    try {
      setLoading(true);
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
    
    let projects = isAdmin ? projectData.projects : getPublicProjects(projectData.projects);
    
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
        (isAdmin && project.developerNote?.toLowerCase().includes(query))
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
        {/* 搜尋和篩選區域 */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar 
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="搜尋專案名稱、說明或備註..."
              />
            </div>
            <div className="sm:w-64">
              <CategoryFilter 
                value={selectedCategory}
                onChange={setSelectedCategory}
              />
            </div>
          </div>
        </div>

        {/* 統計資訊 */}
        {projectData && (
          <div className="mb-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>總共 {projectData.metadata.totalProjects} 個專案</span>
            {!isAdmin && (
              <span>公開 {projectData.metadata.publicProjects} 個</span>
            )}
            {filteredProjects.length !== (isAdmin ? projectData.metadata.totalProjects : projectData.metadata.publicProjects) && (
              <span>篩選結果 {filteredProjects.length} 個</span>
            )}
          </div>
        )}

        {/* 專案列表 */}
        {filteredProjects.length === 0 ? (
          <EmptyState 
            title={searchQuery || selectedCategory !== 'all' ? '無符合條件的專案' : '暂無專案'}
            description={searchQuery || selectedCategory !== 'all' ? '試試調整搜尋條件或篩選器' : '目前還沒有任何專案'}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                isAdmin={isAdmin}
                showToggleControls={projectData?.settings.showToggleControls ?? true}
              />
            ))}
          </div>
        )}
        )}
      </div>
    </div>
  );
}
