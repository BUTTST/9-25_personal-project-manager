/**
 * Diagnostics API - Supabase 版本
 * GET: 系統診斷資訊
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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
        projectCount: 0,
        imageMetadataCount: 0,
      },
      storage: {
        status: 'unknown',
        buckets: [],
        imageCount: 0,
        totalSize: 0,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'unknown',
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAdminPassword: !!process.env.ADMIN_PASSWORD,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured',
      },
    };

    // 檢查資料表
    try {
      // 檢查 projects 表
      const { count: projectCount, error: projectsError } = await supabaseAdmin
        .from('projects')
        .select('id', { count: 'exact', head: true });

      // 檢查 settings 表
      const { count: settingsCount, error: settingsError } = await supabaseAdmin
        .from('settings')
        .select('key', { count: 'exact', head: true });

      // 檢查 image_metadata 表
      const { count: imageMetadataCount, error: imageMetadataError } = await supabaseAdmin
        .from('image_metadata')
        .select('id', { count: 'exact', head: true });

      diagnostics.database.status = 'connected';
      diagnostics.database.projectCount = projectCount || 0;
      diagnostics.database.imageMetadataCount = imageMetadataCount || 0;
      diagnostics.database.tables = [
        { name: 'projects', status: projectsError ? 'error' : 'ok', count: projectCount || 0, error: projectsError?.message },
        { name: 'settings', status: settingsError ? 'error' : 'ok', count: settingsCount || 0, error: settingsError?.message },
        { name: 'image_metadata', status: imageMetadataError ? 'error' : 'ok', count: imageMetadataCount || 0, error: imageMetadataError?.message },
      ];
    } catch (error: any) {
      diagnostics.database.status = 'error';
      diagnostics.database.error = error.message;
    }

    // 檢查 Storage
    try {
      const { data: files, error } = await supabaseAdmin.storage
        .from('project-images')
        .list('', { limit: 1000 });

      if (error) {
        diagnostics.storage.status = 'error';
        diagnostics.storage.error = error.message;
      } else {
        diagnostics.storage.status = 'connected';
        diagnostics.storage.imageCount = files?.length || 0;
        diagnostics.storage.totalSize = files?.reduce((sum, f) => sum + (f.metadata?.size || 0), 0) || 0;
      }
      
      diagnostics.storage.buckets = [
        { name: 'project-images', status: error ? 'error' : 'ok', fileCount: files?.length || 0, error: error?.message },
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
