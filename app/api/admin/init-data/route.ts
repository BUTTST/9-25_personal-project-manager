import { NextRequest, NextResponse } from 'next/server';
import { writeProjectData } from '@/lib/blob-storage';
import { sampleProjectData } from '@/lib/sample-data';

export async function POST(request: NextRequest) {
  try {
    const password = request.headers.get('x-admin-password');
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }

    // 初始化範例數據到Blob
    const result = await writeProjectData(sampleProjectData);
    
    return NextResponse.json({
      message: '範例數據初始化成功',
      blobUrl: result.url,
      projects: sampleProjectData.projects.length,
      passwords: sampleProjectData.passwords.length
    });
  } catch (error) {
    console.error('Failed to initialize data:', error);
    return NextResponse.json(
      { error: '初始化失敗' },
      { status: 500 }
    );
  }
}

