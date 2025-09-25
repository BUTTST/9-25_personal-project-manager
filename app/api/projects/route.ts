import { NextRequest, NextResponse } from 'next/server';
import { readProjectData, writeProjectData, getPublicProjects, validateProjectData } from '@/lib/blob-storage';
import { generateId } from '@/lib/auth';
import { Project, ProjectFormData } from '@/types';

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
    
    if (isAdmin) {
      // 管理員可看所有資料
      return NextResponse.json(data);
    } else {
      // 訪客只能看公開專案
      return NextResponse.json({
        ...data,
        projects: getPublicProjects(data.projects),
        passwords: [] // 訪客永遠不能看到密碼
      });
    }
  } catch (error) {
    console.error('Failed to read projects:', error);
    return NextResponse.json(
      { error: '無法載入專案資料' },
      { status: 500 }
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
    
    const newProject: Project = {
      id: generateId(),
      dateAndFileName: formData.dateAndFileName.trim(),
      description: formData.description.trim(),
      category: formData.category || 'secondary',
      github: formData.github?.trim(),
      vercel: formData.vercel?.trim(),
      path: formData.path?.trim(),
      statusNote: formData.statusNote?.trim(),
      publicNote: formData.publicNote?.trim(),
      developerNote: formData.developerNote?.trim(),
      visibility: {
        dateAndFileName: true,
        description: true,
        category: true,
        github: !!formData.github?.trim(),
        vercel: !!formData.vercel?.trim(),
        path: !!formData.path?.trim(),
        statusNote: !!formData.statusNote?.trim(),
        publicNote: !!formData.publicNote?.trim(),
        developerNote: !!formData.developerNote?.trim()
      },
      featured: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    data.projects.push(newProject);
    
    await writeProjectData(data);
    
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      { error: '新增專案失敗' },
      { status: 500 }
    );
  }
}
