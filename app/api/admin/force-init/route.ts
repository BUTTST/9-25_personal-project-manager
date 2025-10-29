import { NextRequest, NextResponse } from 'next/server';
// ⚠️ 此文件已廢棄 - 已遷移至 Supabase
// import { writeProjectData } from '@/lib/blob-storage'; // 已移除
// import { sampleProjectData } from '@/lib/sample-data';

export async function POST(request: NextRequest) {
  // ⚠️ 此端點已廢棄 - 專案已遷移至 Supabase
  // Vercel Blob 強制初始化功能已不再使用
  
  return NextResponse.json({
    error: '此端點已廢棄',
    message: '專案已遷移至 Supabase，Vercel Blob 強制初始化功能已移除',
    migration: 'Vercel Blob → Supabase',
    recommendation: '請使用 Supabase 管理後台直接管理數據',
    timestamp: new Date().toISOString()
  }, { status: 410 }); // 410 Gone - 資源已永久移除
  
  /* 原有的 Vercel Blob 強制初始化邏輯
  try {
    const password = request.headers.get('x-admin-password');
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }

    // 強制初始化範例數據到Blob（忽略安全檢查）
    const result = await writeProjectData(sampleProjectData, true);
    
    return NextResponse.json({
      message: '強制初始化成功！您的專案數據已恢復。',
      blobUrl: result.url,
      projects: sampleProjectData.projects.length,
      passwords: sampleProjectData.passwords.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to force initialize data:', error);
    return NextResponse.json(
      { error: '強制初始化失敗：' + (error instanceof Error ? error.message : '未知錯誤') },
      { status: 500 }
    );
  }
  */
}
