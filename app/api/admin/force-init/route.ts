import { NextRequest, NextResponse } from 'next/server';
import { writeProjectData } from '@/lib/blob-storage';
import { sampleProjectData } from '@/lib/sample-data';

export async function POST(request: NextRequest) {
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
}
