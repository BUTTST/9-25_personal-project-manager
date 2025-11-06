/**
 * Projects API - Supabase 版本
 * GET: 獲取專案列表（公開或管理員）
 * POST: 新增專案（需管理員權限）
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { generateId } from '@/lib/auth';
import { ProjectFormData, ensureProjectVisibility, defaultImagePreviewMode, migrateLegacyCategoryToStatus } from '@/types';

// 禁用 Next.js 緩存
export const revalidate = 0;
export const dynamic = 'force-dynamic';

/**
 * GET /api/projects
 * 獲取專案列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';
    const password = request.headers.get('x-admin-password');

    // 管理員模式：驗證密碼
    if (isAdmin) {
      if (!password || password !== process.env.ADMIN_PASSWORD) {
        return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
      }

      // 使用 admin client 獲取所有專案
      if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Supabase admin client not available' }, { status: 500 });
      }

      const { data: projects, error } = await supabaseAdmin
        .from('projects')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Failed to fetch projects:', error);
        return NextResponse.json({ error: '無法載入專案資料', details: error.message }, { status: 500 });
      }

      // 獲取設定
      const { data: settingsData } = await supabaseAdmin
        .from('settings')
        .select('*');

      // 轉換設定格式
      const settings = {
        showToggleControls: settingsData?.find((s) => s.key === 'app_settings')?.value?.showToggleControls ?? true,
        rememberPassword: settingsData?.find((s) => s.key === 'app_settings')?.value?.rememberPassword ?? true,
        theme: settingsData?.find((s) => s.key === 'app_settings')?.value?.theme ?? 'light',
        defaultStatus: settingsData?.find((s) => s.key === 'app_settings')?.value?.defaultStatus ?? 'in-progress',
        defaultImagePreviewMode: settingsData?.find((s) => s.key === 'app_settings')?.value?.defaultImagePreviewMode ?? 'grid',
        uiDisplay: settingsData?.find((s) => s.key === 'ui_display')?.value ?? { filters: [], statistics: [] },
      };

      // 轉換欄位名稱（snake_case → camelCase）
      const formattedProjects = (projects || []).map((p: any) => ({
        id: p.id,
        dateAndFileName: p.date_and_file_name,
        description: p.description,
        category: p.category,
        status: p.status,
        github: p.github || '',
        vercel: p.vercel || '',
        deployment: p.deployment || '',
        path: p.path || '',
        statusNote: p.status_note || '',
        publicNote: p.public_note || '',
        developerNote: p.developer_note || '',
        visibility: p.visibility,
        imagePreviews: p.image_previews || [],
        imagePreviewMode: p.image_preview_mode || 'grid',
        customInfoSections: p.custom_info_sections || [],
        documentMeta: p.document_meta,
        featured: p.featured,
        hidden: p.hidden,
        sortOrder: p.sort_order,
        createdAt: new Date(p.created_at).getTime(),
        updatedAt: new Date(p.updated_at).getTime(),
      }));

      return NextResponse.json({
        projects: formattedProjects,
        settings,
        metadata: {
          lastUpdated: Date.now(),
          totalProjects: formattedProjects.length,
          publicProjects: formattedProjects.filter((p: any) => p.visibility.description).length,
        },
      });
    }

    // 公開模式：只返回可見專案
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('hidden', false)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch public projects:', error);
      return NextResponse.json({ error: '無法載入專案' }, { status: 500 });
    }

    // 獲取公開設定
    const { data: settingsData } = await supabase
      .from('settings')
      .select('*');

    const settings = {
      showToggleControls: settingsData?.find((s) => s.key === 'app_settings')?.value?.showToggleControls ?? true,
      uiDisplay: settingsData?.find((s) => s.key === 'ui_display')?.value ?? { filters: [], statistics: [] },
    };

    // 轉換格式並過濾公開專案
    const formattedProjects = (projects || [])
      .map((p: any) => ({
        id: p.id,
        dateAndFileName: p.date_and_file_name,
        description: p.description,
        category: p.category,
        status: p.status,
        github: p.github || '',
        vercel: p.vercel || '',
        deployment: p.deployment || '',
        path: p.path || '',
        statusNote: p.status_note || '',
        publicNote: p.public_note || '',
        developerNote: p.developer_note || '',
        visibility: p.visibility,
        imagePreviews: p.image_previews || [],
        imagePreviewMode: p.image_preview_mode || 'grid',
        customInfoSections: p.custom_info_sections || [],
        documentMeta: p.document_meta,
        featured: p.featured,
        sortOrder: p.sort_order,
        createdAt: new Date(p.created_at).getTime(),
        updatedAt: new Date(p.updated_at).getTime(),
      }))
      .filter((p: any) => p.visibility.description); // 只顯示可見的專案

    return NextResponse.json({
      projects: formattedProjects,
      settings,
    });
  } catch (error) {
    console.error('Failed to read projects:', error);
    return NextResponse.json(
      { error: '無法載入專案資料', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 503 }
    );
  }
}

/**
 * POST /api/projects
 * 新增專案
 */
export async function POST(request: NextRequest) {
  try {
    const password = request.headers.get('x-admin-password');
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin client not available' }, { status: 500 });
    }

    const formData: ProjectFormData = await request.json();

    // 驗證必要欄位
    if (!formData.dateAndFileName || !formData.description) {
      return NextResponse.json({ error: '專案名稱和說明為必填欄位' }, { status: 400 });
    }

    // 獲取當前最大 sort_order
    const { data: existingProjects } = await supabaseAdmin
      .from('projects')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = existingProjects && existingProjects.length > 0 
      ? existingProjects[0].sort_order + 1 
      : 0;

    // 轉換為資料庫格式（camelCase → snake_case）
    const newProject = {
      id: generateId(),
      date_and_file_name: formData.dateAndFileName.trim(),
      description: formData.description.trim(),
      category: formData.category || 'secondary',
      status: formData.status || migrateLegacyCategoryToStatus(formData.category || 'secondary'),
      github: formData.github?.trim() || null,
      vercel: formData.vercel?.trim() || null,
      deployment: formData.deployment?.trim() || null,
      path: formData.path?.trim() || null,
      status_note: formData.statusNote?.trim() || null,
      public_note: formData.publicNote?.trim() || null,
      developer_note: formData.developerNote?.trim() || null,
      visibility: ensureProjectVisibility({
        github: !!formData.github?.trim(),
        vercel: !!formData.vercel?.trim(),
        deployment: !!formData.deployment?.trim(),
        path: !!formData.path?.trim(),
        statusNote: !!formData.statusNote?.trim(),
        publicNote: !!formData.publicNote?.trim(),
        developerNote: !!formData.developerNote?.trim(),
      }),
      image_previews: formData.imagePreviews ?? [],
      image_preview_mode: formData.imagePreviewMode || defaultImagePreviewMode,
      custom_info_sections: formData.customInfoSections ?? [],
      document_meta: formData.documentMeta ?? null,
      featured: false,
      hidden: formData.hidden ?? false,
      sort_order: nextSortOrder,
    };

    // 插入資料庫
    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert(newProject)
      .select()
      .single();

    if (error) {
      console.error('Failed to create project:', error);
      return NextResponse.json({ error: '新增專案失敗', details: error.message }, { status: 500 });
    }

    // 轉換回前端格式
    const responseProject = {
      id: data.id,
      dateAndFileName: data.date_and_file_name,
      description: data.description,
      category: data.category,
      status: data.status,
      github: data.github || '',
      vercel: data.vercel || '',
      deployment: data.deployment || '',
      path: data.path || '',
      statusNote: data.status_note || '',
      publicNote: data.public_note || '',
      developerNote: data.developer_note || '',
      visibility: data.visibility,
      imagePreviews: data.image_previews,
      imagePreviewMode: data.image_preview_mode,
      customInfoSections: data.custom_info_sections,
      documentMeta: data.document_meta,
      featured: data.featured,
      hidden: data.hidden,
      sortOrder: data.sort_order,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
    };

    return NextResponse.json(responseProject, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      { error: '新增專案失敗', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
