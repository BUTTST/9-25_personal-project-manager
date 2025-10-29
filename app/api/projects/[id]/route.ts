/**
 * Single Project API - Supabase 版本
 * GET: 獲取單一專案
 * PATCH: 更新專案
 * DELETE: 刪除專案
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/app/lib/supabase';
import { ensureProjectVisibility, migrateLegacyCategoryToStatus, defaultImagePreviewMode } from '@/app/types';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/projects/[id]
 * 獲取單一專案
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const password = request.headers.get('x-admin-password');
    const isAdmin = password === process.env.ADMIN_PASSWORD;

    const client = isAdmin && supabaseAdmin ? supabaseAdmin : supabase;

    const { data: project, error } = await client
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: '專案不存在' }, { status: 404 });
    }

    // 轉換為前端格式
    const formattedProject = {
      id: project.id,
      dateAndFileName: project.date_and_file_name,
      description: project.description,
      category: project.category,
      status: project.status,
      github: project.github || '',
      vercel: project.vercel || '',
      deployment: project.deployment || '',
      path: project.path || '',
      statusNote: project.status_note || '',
      publicNote: project.public_note || '',
      developerNote: isAdmin ? (project.developer_note || '') : '',
      visibility: project.visibility,
      imagePreviews: project.image_previews || [],
      imagePreviewMode: project.image_preview_mode || 'grid',
      customInfoSections: project.custom_info_sections || [],
      documentMeta: project.document_meta,
      featured: project.featured,
      hidden: project.hidden,
      sortOrder: project.sort_order,
      createdAt: new Date(project.created_at).getTime(),
      updatedAt: new Date(project.updated_at).getTime(),
    };

    // 非管理員：檢查可見性
    if (!isAdmin && (!formattedProject.visibility.description || formattedProject.hidden)) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 403 });
    }

    return NextResponse.json(formattedProject);
  } catch (error) {
    console.error('Failed to get project:', error);
    return NextResponse.json(
      { error: '無法獲取專案資料', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 503 }
    );
  }
}

/**
 * PATCH /api/projects/[id]
 * 更新專案
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const password = request.headers.get('x-admin-password');

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin client not available' }, { status: 500 });
    }

    const updates = await request.json();

    // 轉換為資料庫格式
    const dbUpdates: any = {};
    
    if (updates.dateAndFileName !== undefined) dbUpdates.date_and_file_name = updates.dateAndFileName;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.github !== undefined) dbUpdates.github = updates.github || null;
    if (updates.vercel !== undefined) dbUpdates.vercel = updates.vercel || null;
    if (updates.deployment !== undefined) dbUpdates.deployment = updates.deployment || null;
    if (updates.path !== undefined) dbUpdates.path = updates.path || null;
    if (updates.statusNote !== undefined) dbUpdates.status_note = updates.statusNote || null;
    if (updates.publicNote !== undefined) dbUpdates.public_note = updates.publicNote || null;
    if (updates.developerNote !== undefined) dbUpdates.developer_note = updates.developerNote || null;
    if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;
    if (updates.imagePreviews !== undefined) dbUpdates.image_previews = updates.imagePreviews;
    if (updates.imagePreviewMode !== undefined) dbUpdates.image_preview_mode = updates.imagePreviewMode;
    if (updates.customInfoSections !== undefined) dbUpdates.custom_info_sections = updates.customInfoSections;
    if (updates.documentMeta !== undefined) dbUpdates.document_meta = updates.documentMeta;
    if (updates.featured !== undefined) dbUpdates.featured = updates.featured;
    if (updates.hidden !== undefined) dbUpdates.hidden = updates.hidden;
    if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

    // 更新資料庫
    const { data: updatedProject, error } = await supabaseAdmin
      .from('projects')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update project:', error);
      return NextResponse.json({ error: '更新專案失敗', details: error.message }, { status: 500 });
    }

    if (!updatedProject) {
      return NextResponse.json({ error: '專案不存在' }, { status: 404 });
    }

    // 轉換回前端格式
    const responseProject = {
      id: updatedProject.id,
      dateAndFileName: updatedProject.date_and_file_name,
      description: updatedProject.description,
      category: updatedProject.category,
      status: updatedProject.status,
      github: updatedProject.github || '',
      vercel: updatedProject.vercel || '',
      deployment: updatedProject.deployment || '',
      path: updatedProject.path || '',
      statusNote: updatedProject.status_note || '',
      publicNote: updatedProject.public_note || '',
      developerNote: updatedProject.developer_note || '',
      visibility: updatedProject.visibility,
      imagePreviews: updatedProject.image_previews,
      imagePreviewMode: updatedProject.image_preview_mode,
      customInfoSections: updatedProject.custom_info_sections,
      documentMeta: updatedProject.document_meta,
      featured: updatedProject.featured,
      hidden: updatedProject.hidden,
      sortOrder: updatedProject.sort_order,
      createdAt: new Date(updatedProject.created_at).getTime(),
      updatedAt: new Date(updatedProject.updated_at).getTime(),
    };

    return NextResponse.json(responseProject);
  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json(
      { error: '更新專案失敗', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * 刪除專案
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const password = request.headers.get('x-admin-password');

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin client not available' }, { status: 500 });
    }

    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete project:', error);
      return NextResponse.json({ error: '刪除專案失敗', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '專案已刪除' });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json(
      { error: '刪除專案失敗', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
