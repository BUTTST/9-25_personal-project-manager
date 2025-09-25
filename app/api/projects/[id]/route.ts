import { NextRequest, NextResponse } from 'next/server';
import { readProjectData, writeProjectData } from '@/lib/blob-storage';
import { Project } from '@/types';

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
    
    // 非管理員且非公開專案
    if (!isAdmin && (!project.visibility.description || project.category === 'abandoned')) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 403 });
    }
    
    // 移除敏感資訊
    if (!isAdmin) {
      project.developerNote = '';
    }
    
    return NextResponse.json(project);
  } catch (error) {
    console.error('Failed to get project:', error);
    return NextResponse.json(
      { error: '無法獲取專案資料' },
      { status: 500 }
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
    
    const projectIndex = data.projects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return NextResponse.json({ error: '專案不存在' }, { status: 404 });
    }
    
    // 更新專案
    data.projects[projectIndex] = {
      ...data.projects[projectIndex],
      ...updates,
      id, // 保護ID不被更改
      updatedAt: Date.now()
    };
    
    await writeProjectData(data);
    
    return NextResponse.json(data.projects[projectIndex]);
  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json(
      { error: '更新專案失敗' },
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
    
    const projectIndex = data.projects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return NextResponse.json({ error: '專案不存在' }, { status: 404 });
    }
    
    const deletedProject = data.projects[projectIndex];
    data.projects.splice(projectIndex, 1);
    
    await writeProjectData(data);
    
    return NextResponse.json({ 
      message: '專案刪除成功', 
      deletedProject 
    });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json(
      { error: '刪除專案失敗' },
      { status: 500 }
    );
  }
}
