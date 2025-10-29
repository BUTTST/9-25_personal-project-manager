/**
 * UI Display Settings API - Supabase 版本
 * GET: 獲取 UI 顯示設定
 * PUT: 更新 UI 顯示設定
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/app/lib/supabase';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

/**
 * GET /api/settings/ui-display
 * 獲取 UI 顯示設定（公開）
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'ui_display')
      .single();

    if (error) {
      console.error('Failed to fetch ui_display settings:', error);
      return NextResponse.json(
        { filters: [], statistics: [] },
        { status: 200 }
      );
    }

    return NextResponse.json(data?.value || { filters: [], statistics: [] });
  } catch (error) {
    console.error('Failed to get ui_display:', error);
    return NextResponse.json({ filters: [], statistics: [] });
  }
}

/**
 * PUT /api/settings/ui-display
 * 更新 UI 顯示設定（需管理員權限）
 */
export async function PUT(request: NextRequest) {
  try {
    const password = request.headers.get('x-admin-password');

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin client not available' }, { status: 500 });
    }

    const newValue = await request.json();

    // 驗證資料格式
    if (!newValue.filters || !Array.isArray(newValue.filters)) {
      return NextResponse.json({ error: 'filters 必須是陣列' }, { status: 400 });
    }

    if (!newValue.statistics || !Array.isArray(newValue.statistics)) {
      return NextResponse.json({ error: 'statistics 必須是陣列' }, { status: 400 });
    }

    // 更新資料庫
    const { data, error } = await supabaseAdmin
      .from('settings')
      .update({ value: newValue })
      .eq('key', 'ui_display')
      .select()
      .single();

    if (error) {
      console.error('Failed to update ui_display:', error);
      return NextResponse.json({ error: '更新設定失敗', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, value: data.value });
  } catch (error) {
    console.error('Failed to update ui_display:', error);
    return NextResponse.json(
      { error: '更新設定失敗', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
