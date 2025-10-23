import { NextRequest, NextResponse } from 'next/server';
import { readProjectData, writeProjectData } from '@/lib/blob-storage';
import { Project, ensureProjectVisibility, migrateLegacyCategoryToStatus, defaultImagePreviewMode } from '@/types';

// 禁用 Next.js 緩存，確保每次請求都獲取最新數據
export const revalidate = 0;
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

// 獲取單一專案
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const password = request.headers.get('x-admin-password');
    const isAdmin = password === process.env.ADMIN_PASSWORD;
    
    const data = await readProjectData();
    const project = data.projects.find(p => p.id === id);
    
    if (!project) {
      return NextResponse.json({ error: '專案不存在' }, { status: 404 });
    }

    const migratedProject: Project = {
      ...project,
      status: project.status || migrateLegacyCategoryToStatus(project.category),
      visibility: ensureProjectVisibility(project.visibility),
      imagePreviews: project.imagePreviews ?? [],
      imagePreviewMode: project.imagePreviewMode || defaultImagePreviewMode,
      customInfoSections: project.customInfoSections ?? [],
      documentMeta: project.documentMeta ?? null,
    };

    // 非管理員且非公開專案
    if (!isAdmin && (!migratedProject.visibility.description || migratedProject.status === 'discarded')) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 403 });
    }
    
    // 移除敏感資訊
    if (!isAdmin) {
      migratedProject.developerNote = '';
    }
    
    return NextResponse.json(migratedProject);
  } catch (error) {
    console.error('Failed to get project:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: '無法獲取專案資料',
        details: message,
        translatedMessage: `⚠️ 無法獲取專案資料：${message}`,
      },
      { status: 503 }
    );
  }
}

// 更新專案
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const password = request.headers.get('x-admin-password');
    
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }
    
    const updates = await request.json();
    const data = await readProjectData();

    const migratedProjects = data.projects.map(project => ({
      ...project,
      status: project.status || migrateLegacyCategoryToStatus(project.category),
      visibility: ensureProjectVisibility(project.visibility),
      imagePreviews: project.imagePreviews ?? [],
      imagePreviewMode: project.imagePreviewMode || defaultImagePreviewMode,
      customInfoSections: project.customInfoSections ?? [],
      documentMeta: project.documentMeta ?? null,
    }));

    const projectIndex = migratedProjects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return NextResponse.json({ error: '專案不存在' }, { status: 404 });
    }

    migratedProjects[projectIndex] = {
      ...migratedProjects[projectIndex],
      ...updates,
      id,
      updatedAt: Date.now(),
    };

    const nextData = {
      ...data,
      projects: migratedProjects,
    };

    await writeProjectData({
      ...nextData,
      metadata: {
        ...nextData.metadata,
        lastUpdated: Date.now(),
        totalProjects: nextData.projects.length,
        publicProjects: nextData.projects.filter(
          (p) => p.visibility.publicNote && p.status !== 'discarded'
        ).length,
      },
    });
    
    return NextResponse.json(migratedProjects[projectIndex]);
  } catch (error) {
    console.error('Failed to update project:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: '更新專案失敗',
        details: message,
        translatedMessage: `⚠️ 更新專案失敗：${message}`,
      },
      { status: 500 }
    );
  }
}

// 刪除專案
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const password = request.headers.get('x-admin-password');
    
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }
    
    const data = await readProjectData();

    const migratedProjects = data.projects.map(project => ({
      ...project,
      status: project.status || migrateLegacyCategoryToStatus(project.category),
      visibility: ensureProjectVisibility(project.visibility),
      imagePreviews: project.imagePreviews ?? [],
      imagePreviewMode: project.imagePreviewMode || defaultImagePreviewMode,
      customInfoSections: project.customInfoSections ?? [],
      documentMeta: project.documentMeta ?? null,
    }));

    const projectIndex = migratedProjects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return NextResponse.json({ error: '專案不存在' }, { status: 404 });
    }

    const deletedProject = migratedProjects[projectIndex];
    migratedProjects.splice(projectIndex, 1);

    const nextData = {
      ...data,
      projects: migratedProjects,
    };

    await writeProjectData({
      ...nextData,
      metadata: {
        ...nextData.metadata,
        lastUpdated: Date.now(),
        totalProjects: nextData.projects.length,
        publicProjects: nextData.projects.filter(
          (p) => p.visibility.publicNote && p.status !== 'discarded'
        ).length,
      },
    });
    
    return NextResponse.json({
      message: '專案刪除成功',
      deletedProject,
    });
  } catch (error) {
    console.error('Failed to delete project:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: '刪除專案失敗',
        details: message,
        translatedMessage: `⚠️ 刪除專案失敗：${message}`,
      },
      { status: 500 }
    );
  }
}
