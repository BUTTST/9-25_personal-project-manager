import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';

const BLOB_FILENAME = 'project-data.json';

export async function GET(request: NextRequest) {
  try {
    // 列出所有Blob文件，尋找我們的數據文件
    const { blobs } = await list();
    
    // 尋找project-data.json文件
    const dataBlob = blobs.find(blob => blob.pathname === BLOB_FILENAME);
    
    if (!dataBlob) {
      console.log('No project data blob found');
      return NextResponse.json(
        { error: 'No data found' }, 
        { status: 404 }
      );
    }

    // 使用正確的URL讀取Blob內容
    const response = await fetch(dataBlob.url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${response.statusText}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to read blob data:', error);
    return NextResponse.json(
      { error: 'Failed to read data' },
      { status: 500 }
    );
  }
}

