import { NextRequest, NextResponse } from 'next/server';
import { readProjectData, writeProjectData } from '@/lib/blob-storage';
import { sampleProjectData } from '@/lib/sample-data';
import { isEmptyData } from '@/lib/data-safety';

// 自動初始化端點 - 僅在首次部署時運行
export async function GET(request: NextRequest) {
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
}
