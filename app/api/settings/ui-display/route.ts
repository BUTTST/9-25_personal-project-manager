import { NextRequest, NextResponse } from 'next/server';
import { readProjectData, writeProjectData } from '@/lib/blob-storage';
import { UIDisplaySettings } from '@/types';

/**
 * 更新 UI 顯示設定
 */
export async function PUT(request: NextRequest) {
  try {
    // 驗證管理員權限
    const password = request.headers.get('x-admin-password');
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }
    
    // 解析請求資料
    const newSettings: UIDisplaySettings = await request.json();
    
    // 驗證資料格式
    if (!newSettings.filters || !Array.isArray(newSettings.filters)) {
      return NextResponse.json({ error: '篩選器設定格式錯誤' }, { status: 400 });
    }
    
    if (!newSettings.statistics || !Array.isArray(newSettings.statistics)) {
      return NextResponse.json({ error: '統計設定格式錯誤' }, { status: 400 });
    }
    
    // 讀取現有資料
    const data = await readProjectData();
    
    // 更新 UI 設定
    data.settings.uiDisplay = newSettings;
    
    // 寫入資料
    await writeProjectData(data);
    
    return NextResponse.json({ 
      success: true, 
      settings: newSettings,
      message: 'UI 設定已成功儲存'
    });
  } catch (error) {
    console.error('儲存 UI 設定失敗:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: '儲存失敗，請稍後再試',
        details: message,
        translatedMessage: `⚠️ 儲存 UI 設定失敗：${message}`,
      },
      { status: 500 }
    );
  }
}

/**
 * 獲取 UI 顯示設定
 */
export async function GET(request: NextRequest) {
  try {
    const data = await readProjectData();
    return NextResponse.json({
      success: true,
      settings: data.settings.uiDisplay
    });
  } catch (error) {
    console.error('讀取 UI 設定失敗:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: '讀取失敗',
        details: message,
        translatedMessage: `⚠️ 讀取 UI 設定失敗：${message}`,
      },
      { status: 503 }
    );
  }
}

