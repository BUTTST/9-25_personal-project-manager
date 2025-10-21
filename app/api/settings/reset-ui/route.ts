import { NextRequest, NextResponse } from 'next/server';
import { readProjectData, writeProjectData, defaultProjectData } from '@/lib/blob-storage';

export async function POST(request: NextRequest) {
  const password = request.headers.get('x-admin-password');

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
  }

  try {
    const data = await readProjectData();

    // 重置 UI 設定為默認配置
    const updatedData = {
      ...data,
      settings: {
        ...data.settings,
        uiDisplay: {
          filters: [...defaultProjectData.settings.uiDisplay.filters],
          statistics: [...defaultProjectData.settings.uiDisplay.statistics],
        },
      },
    };

    await writeProjectData(updatedData);

    return NextResponse.json({
      message: 'UI 設定已重置為默認值',
      uiDisplay: updatedData.settings.uiDisplay,
    });
  } catch (error) {
    console.error('Failed to reset UI settings:', error);
    return NextResponse.json(
      { error: '重置失敗', details: error instanceof Error ? error.message : '未知錯誤' },
      { status: 500 }
    );
  }
}

