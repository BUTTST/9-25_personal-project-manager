/**
 * Projects Reorder API - Supabase 版本
 * POST: 批量更新專案排序
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

/**
 * POST /api/projects/reorder
 * Body: [{ id: string, sortOrder: number }]
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

    const reorderData: Array<{ id: string; sortOrder: number }> = await request.json();

    if (!Array.isArray(reorderData)) {
      return NextResponse.json({ error: '無效的資料格式' }, { status: 400 });
    }

    // 批量更新（逐一更新，因為 Supabase 不支援批量 UPDATE 不同值）
    const updatePromises = reorderData.map((item) =>
      supabaseAdmin
        .from('projects')
        .update({ sort_order: item.sortOrder })
        .eq('id', item.id)
    );

    const results = await Promise.all(updatePromises);

    // 檢查是否有錯誤
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error('Failed to reorder some projects:', errors);
      return NextResponse.json(
        { error: '部分專案排序失敗', details: errors.map((e) => e.error?.message) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '排序已更新',
      updatedCount: reorderData.length,
    });
  } catch (error) {
    console.error('Failed to reorder projects:', error);
    return NextResponse.json(
      { error: '排序更新失敗', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
