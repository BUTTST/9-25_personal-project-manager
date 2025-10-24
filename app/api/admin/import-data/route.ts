import { NextRequest, NextResponse } from 'next/server';
import { writeProjectData, validateProjectData } from '@/lib/blob-storage';
import { ProjectData } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * 完全覆蓋式資料匯入 API
 * 用於從備份檔案恢復系統資料
 */
export async function POST(request: NextRequest) {
  try {
    // 驗證管理員權限
    const password = request.headers.get('x-admin-password');
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }

    const body = await request.json();
    const { data, forceOverwrite } = body;

    // 驗證是否有強制覆蓋標記
    if (!forceOverwrite) {
      return NextResponse.json(
        { error: '此 API 僅支援強制覆蓋模式，請確認操作' },
        { status: 400 }
      );
    }

    // 驗證匯入的資料格式
    if (!validateProjectData(data)) {
      return NextResponse.json(
        { error: '無效的資料格式：資料結構不符合要求' },
        { status: 400 }
      );
    }

    // 記錄操作日誌
    console.log('🔄 管理員執行完全覆蓋式匯入:', {
      timestamp: new Date().toISOString(),
      projectCount: data.projects?.length || 0,
      passwordCount: data.passwords?.length || 0,
      forceOverwrite: true,
    });

    // 執行完全覆蓋寫入
    await writeProjectData(
      {
        ...data,
        metadata: {
          ...data.metadata,
          lastUpdated: Date.now(),
          totalProjects: data.projects?.length || 0,
          publicProjects: data.projects?.filter((p: any) => 
            p.visibility?.description && p.status !== 'discarded'
          ).length || 0,
          writeTimestamp: Date.now(),
          safetyCheck: 'FORCED',
          importReason: 'Admin full data restore from backup',
        },
      },
      true // forceWrite = true
    );

    console.log('✅ 資料匯入成功完成');

    return NextResponse.json({
      success: true,
      message: '資料已成功覆蓋',
      projectCount: data.projects?.length || 0,
      passwordCount: data.passwords?.length || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ 資料匯入失敗:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: '資料匯入失敗',
        details: message,
      },
      { status: 500 }
    );
  }
}

