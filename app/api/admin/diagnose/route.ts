import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET(request: NextRequest) {
  try {
    const password = request.headers.get('x-admin-password');
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }

    // 診斷Blob存儲狀態
    const { blobs } = await list();
    const projectDataBlob = blobs.find(blob => blob.pathname === 'project-data.json');

    let blobContent = null;
    let contentSize = 0;
    let isValidJson = false;
    let projectCount = 0;
    let passwordCount = 0;

    if (projectDataBlob) {
      try {
        const response = await fetch(projectDataBlob.url);
        if (response.ok) {
          const text = await response.text();
          contentSize = text.length;
          
          try {
            blobContent = JSON.parse(text);
            isValidJson = true;
            projectCount = blobContent.projects?.length || 0;
            passwordCount = blobContent.passwords?.length || 0;
          } catch (jsonError) {
            isValidJson = false;
          }
        }
      } catch (fetchError) {
        console.error('Failed to fetch blob content:', fetchError);
      }
    }

    const diagnosticInfo = {
      timestamp: new Date().toISOString(),
      blobStorage: {
        totalBlobs: blobs.length,
        hasProjectData: !!projectDataBlob,
        projectDataUrl: projectDataBlob?.url || null,
        contentSize,
        isValidJson,
        projectCount,
        passwordCount
      },
      environment: {
        hasAdminPassword: !!process.env.ADMIN_PASSWORD,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV
      },
      allBlobs: blobs.map(blob => ({
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt
      }))
    };

    return NextResponse.json(diagnosticInfo);
  } catch (error) {
    console.error('Diagnostic failed:', error);
    return NextResponse.json(
      { 
        error: '診斷失敗',
        details: error instanceof Error ? error.message : '未知錯誤',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
