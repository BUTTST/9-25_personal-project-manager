/**
 * Diagnostics API - Supabase 版本
 * GET: 系統診斷資訊
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/diagnose
 * 獲取系統診斷資訊
 */
export async function GET(request: NextRequest) {
  try {
    const password = request.headers.get('x-admin-password');

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin client not available' }, { status: 500 });
    }

    // 獲取診斷資訊
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      database: {
        status: 'unknown',
        tables: [],
        migrations: [],
      },
      storage: {
        status: 'unknown',
        buckets: [],
      },
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAdminPassword: !!process.env.ADMIN_PASSWORD,
      },
    };

    // 檢查資料表
    try {
      const { data: projects, error: projectsError } = await supabaseAdmin
        .from('projects')
        .select('id', { count: 'exact', head: true });

      const { data: passwords, error: passwordsError } = await supabaseAdmin
        .from('passwords')
        .select('id', { count: 'exact', head: true });

      const { data: settings, error: settingsError } = await supabaseAdmin
        .from('settings')
        .select('key', { count: 'exact', head: true });

      diagnostics.database.status = 'connected';
      diagnostics.database.tables = [
        { name: 'projects', status: projectsError ? 'error' : 'ok', error: projectsError?.message },
        { name: 'passwords', status: passwordsError ? 'error' : 'ok', error: passwordsError?.message },
        { name: 'settings', status: settingsError ? 'error' : 'ok', error: settingsError?.message },
      ];
    } catch (error: any) {
      diagnostics.database.status = 'error';
      diagnostics.database.error = error.message;
    }

    // 檢查 Storage
    try {
      const { data: files, error } = await supabaseAdmin.storage
        .from('screenshots')
        .list('', { limit: 1 });

      diagnostics.storage.status = error ? 'error' : 'connected';
      diagnostics.storage.buckets = [
        { name: 'screenshots', status: error ? 'error' : 'ok', error: error?.message },
      ];
    } catch (error: any) {
      diagnostics.storage.status = 'error';
      diagnostics.storage.error = error.message;
    }

    return NextResponse.json(diagnostics);
  } catch (error) {
    console.error('Failed to run diagnostics:', error);
    return NextResponse.json(
      { error: '診斷失敗', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
