import { NextRequest, NextResponse } from 'next/server';
import { readProjectData, writeProjectData } from '@/lib/blob-storage';
import { Project, ensureProjectVisibility, migrateLegacyCategoryToStatus, defaultImagePreviewMode } from '@/types';

export async function POST(request: NextRequest) {
  const password = request.headers.get('x-admin-password');

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
  }

  try {
    const reorderData = await request.json();

    if (!Array.isArray(reorderData)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const data = await readProjectData();
    const migratedProjects: Project[] = data.projects.map(project => ({
      ...project,
      status: project.status || migrateLegacyCategoryToStatus(project.category),
      visibility: ensureProjectVisibility(project.visibility),
      imagePreviews: project.imagePreviews ?? [],
      imagePreviewMode: project.imagePreviewMode || defaultImagePreviewMode,
      customInfoSections: project.customInfoSections ?? [],
      documentMeta: project.documentMeta ?? null,
    }));

    const projectMap = new Map(migratedProjects.map(p => [p.id, p]));

    reorderData.forEach(({ id, sortOrder }) => {
      const project = projectMap.get(id);
      if (project) {
        project.sortOrder = sortOrder;
      }
    });

    const nextProjects = Array.from(projectMap.values()).sort((a, b) => a.sortOrder - b.sortOrder);

    await writeProjectData({
      ...data,
      projects: nextProjects,
      metadata: {
        ...data.metadata,
        lastUpdated: Date.now(),
        totalProjects: nextProjects.length,
        publicProjects: nextProjects.filter(
          (p) => p.visibility.publicNote && p.status !== 'discarded'
        ).length,
      },
    });

    return NextResponse.json({ message: 'Reorder successful' });
  } catch (error) {
    console.error('Failed to reorder projects:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
