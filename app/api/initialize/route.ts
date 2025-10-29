import { NextRequest, NextResponse } from 'next/server';
// ⚠️ 此文件已廢棄 - 已遷移至 Supabase
// import { readProjectData, writeProjectData } from '@/lib/blob-storage'; // 已移除
// import { sampleProjectData } from '@/lib/sample-data';
// import { isEmptyData } from '@/lib/data-safety';

// 自動初始化端點 - 已停用（已遷移至 Supabase）
export async function GET(request: NextRequest) {
  // 核心問題：此端點會在讀取失敗時觸發強制覆寫，風險極高。
  // 我們將其停用，改為手動、安全的初始化方式。
  // ⚠️ 已遷移至 Supabase，請使用 /api/admin/init-data（如果需要）
  return NextResponse.json({
    message: '此自動初始化端點已被停用。專案已遷移至 Supabase，請使用管理後台進行數據管理。',
    action: 'deprecated',
    migration: 'Vercel Blob → Supabase',
    timestamp: new Date().toISOString()
  });

  /* 原有的危險邏輯
  try {
    console.log('🔍 檢查是否需要初始化數據...');
    
    // 讀取現有數據
    const existingData = await readProjectData();
    
    // 檢查是否為空數據（首次部署）
    if (isEmptyData(existingData)) {
      console.log('📄 檢測到空數據，開始自動初始化...');
      
      // 初始化範例數據
      await writeProjectData(sampleProjectData, true);
      
      return NextResponse.json({
        message: '自動初始化完成',
        action: 'initialized',
        projects: sampleProjectData.projects.length,
        passwords: sampleProjectData.passwords.length,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      message: '數據已存在，無需初始化',
      action: 'skipped',
      projects: existingData.projects.length,
      passwords: existingData.passwords.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('自動初始化失敗:', error);
    return NextResponse.json(
      { 
        error: '自動初始化失敗',
        details: error instanceof Error ? error.message : '未知錯誤',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
  */
}
