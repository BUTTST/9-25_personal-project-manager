import { NextRequest, NextResponse } from 'next/server';
import { list, put } from '@vercel/blob';
import { isAdminRequest } from '@/lib/auth';
import { Project } from '@/types';

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const reorderData = await request.json();

    if (!Array.isArray(reorderData)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const { blobs } = await list({ prefix: 'projects.json' });
    if (blobs.length === 0) {
      return NextResponse.json({ error: 'Data file not found' }, { status: 404 });
    }
    const blob = blobs[0];
    const response = await fetch(blob.url);
    const data = await response.json();
    const projects: Project[] = data.projects || [];

    // Create a map for quick lookup
    const projectMap = new Map(projects.map(p => [p.id, p]));

    // Update sortOrder
    reorderData.forEach(({ id, sortOrder }) => {
      const project = projectMap.get(id);
      if (project) {
        project.sortOrder = sortOrder;
      }
    });

    const updatedData = { ...data, projects: Array.from(projectMap.values()) };

    await put('projects.json', JSON.stringify(updatedData, null, 2), {
      access: 'public',
      contentType: 'application/json',
    });

    return NextResponse.json({ message: 'Reorder successful' });
  } catch (error) {
    console.error('Failed to reorder projects:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
