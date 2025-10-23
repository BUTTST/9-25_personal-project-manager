import { NextRequest, NextResponse } from 'next/server';
import { readProjectData, writeProjectData, getPublicProjects, validateProjectData } from '@/lib/blob-storage';
import { generateId } from '@/lib/auth';
import { Project, ProjectFormData, defaultProjectStatus, defaultImagePreviewMode, ensureProjectVisibility, migrateLegacyCategoryToStatus } from '@/types';

// 禁用 Next.js 緩存，確保每次請求都獲取最新數據
export const revalidate = 0;
export const dynamic = 'force-dynamic';

// 獲取專案列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';
    const password = request.headers.get('x-admin-password');
    
    // 若為管理員模式，驗證密碼
    if (isAdmin) {
      if (!password || password !== process.env.ADMIN_PASSWORD) {
        return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
      }
    }
    
    const data = await readProjectData();

    const migratedProjects = data.projects.map((project) => {
      const normalizedProject: Project = {
        ...project,
        status: project.status || migrateLegacyCategoryToStatus(project.category),
        visibility: ensureProjectVisibility(project.visibility),
        imagePreviews: project.imagePreviews ?? [],
        imagePreviewMode: project.imagePreviewMode || defaultImagePreviewMode,
        customInfoSections: project.customInfoSections ?? [],
        documentMeta: project.documentMeta ?? null,
      };
      return normalizedProject;
    });

    const enrichedData = {
      ...data,
      projects: migratedProjects,
    };
    
    if (isAdmin) {
      return NextResponse.json(enrichedData);
    } else {
      return NextResponse.json({
        ...enrichedData,
        projects: getPublicProjects(enrichedData.projects),
      });
    }
  } catch (error) {
    console.error('Failed to read projects:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: '無法載入專案資料',
        details: message,
        translatedMessage: `⚠️ 無法載入專案資料：${message}`,
      },
      { status: 503 }
    );
  }
}

// 新增專案
export async function POST(request: NextRequest) {
  try {
    const password = request.headers.get('x-admin-password');
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }
    
    const formData: ProjectFormData = await request.json();
    
    // 驗證必要欄位
    if (!formData.dateAndFileName || !formData.description) {
      return NextResponse.json(
        { error: '專案名稱和說明為必填欄位' },
        { status: 400 }
      );
    }
    
    const data = await readProjectData();

    const migratedProjects: Project[] = data.projects.map((project) => {
      const normalizedProject: Project = {
        ...project,
        status: project.status || migrateLegacyCategoryToStatus(project.category),
        visibility: ensureProjectVisibility(project.visibility),
        imagePreviews: project.imagePreviews ?? [],
        imagePreviewMode: project.imagePreviewMode || defaultImagePreviewMode,
        customInfoSections: project.customInfoSections ?? [],
        documentMeta: project.documentMeta ?? null,
      };
      return normalizedProject;
    });

    const nextData = {
      ...data,
      projects: migratedProjects,
    };

    const newProject: Project = {
      id: generateId(),
      dateAndFileName: formData.dateAndFileName.trim(),
      description: formData.description.trim(),
      category: formData.category || 'secondary',
      status: formData.status || migrateLegacyCategoryToStatus(formData.category || 'secondary'),
      github: formData.github?.trim(),
      vercel: formData.vercel?.trim(),
      deployment: formData.deployment?.trim(),
      path: formData.path?.trim(),
      statusNote: formData.statusNote?.trim(),
      publicNote: formData.publicNote?.trim(),
      developerNote: formData.developerNote?.trim(),
      visibility: ensureProjectVisibility({
        github: !!formData.github?.trim(),
        vercel: !!formData.vercel?.trim(),
        deployment: !!formData.deployment?.trim(),
        path: !!formData.path?.trim(),
        statusNote: !!formData.statusNote?.trim(),
        publicNote: !!formData.publicNote?.trim(),
        developerNote: !!formData.developerNote?.trim(),
      }),
      imagePreviews: formData.imagePreviews ?? [],
      imagePreviewMode: formData.imagePreviewMode || defaultImagePreviewMode,
      customInfoSections: formData.customInfoSections ?? [],
      featured: false,
      documentMeta: formData.documentMeta ?? null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sortOrder: migratedProjects.length,
    };

    nextData.projects.push(newProject);

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

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: '新增專案失敗',
        details: message,
        translatedMessage: `⚠️ 新增專案失敗：${message}`,
      },
      { status: 500 }
    );
  }
}
