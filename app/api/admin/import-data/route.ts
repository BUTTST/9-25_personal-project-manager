/**
 * Import Data API - Supabase 版本
 * POST: 批量匯入專案資料
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { Project } from '@/app/types';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/import-data
 * Body: { projects: Project[] }
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

    const { projects } = await request.json();

    if (!Array.isArray(projects)) {
      return NextResponse.json({ error: 'projects 必須是陣列' }, { status: 400 });
    }

    // 轉換為資料庫格式
    const dbProjects = projects.map((p: Project) => ({
      id: p.id,
      date_and_file_name: p.dateAndFileName,
      description: p.description,
      category: p.category,
      status: p.status,
      github: p.github || null,
      vercel: p.vercel || null,
      deployment: p.deployment || null,
      path: p.path || null,
      status_note: p.statusNote || null,
      public_note: p.publicNote || null,
      developer_note: p.developerNote || null,
      visibility: p.visibility,
      image_previews: p.imagePreviews || [],
      image_preview_mode: p.imagePreviewMode || 'grid',
      custom_info_sections: p.customInfoSections || [],
      document_meta: p.documentMeta || null,
      featured: p.featured || false,
      hidden: p.hidden || false,
      sort_order: p.sortOrder || 0,
      created_at: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      updated_at: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
    }));

    // 批量插入（使用 upsert 以支援更新）
    const { data, error } = await supabaseAdmin
      .from('projects')
      .upsert(dbProjects, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('Failed to import projects:', error);
      return NextResponse.json({ error: '匯入失敗', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '資料匯入成功',
      importedCount: data?.length || 0,
    });
  } catch (error) {
    console.error('Failed to import data:', error);
    return NextResponse.json(
      { error: '匯入失敗', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
