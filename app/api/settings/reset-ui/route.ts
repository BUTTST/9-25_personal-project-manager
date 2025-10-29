/**
 * Reset UI Settings API - Supabase 版本
 * POST: 重置 UI 設定為預設值
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

const DEFAULT_UI_DISPLAY = {
  filters: [],
  statistics: [],
};

/**
 * POST /api/settings/reset-ui
 * 重置 UI 顯示設定
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

    // 重置為預設值
    const { error } = await supabaseAdmin
      .from('settings')
      .update({ value: DEFAULT_UI_DISPLAY })
      .eq('key', 'ui_display');

    if (error) {
      console.error('Failed to reset ui_display:', error);
      return NextResponse.json({ error: '重置設定失敗', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'UI 設定已重置為預設值',
      value: DEFAULT_UI_DISPLAY,
    });
  } catch (error) {
    console.error('Failed to reset ui_display:', error);
    return NextResponse.json(
      { error: '重置設定失敗', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
