import { NextRequest, NextResponse } from 'next/server';
import { list, head } from '@vercel/blob';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic'; // 確保每次都獲取最新資訊

async function getSha256Hash(text: string): Promise<string> {
  const hash = createHash('sha256');
  hash.update(text);
  return hash.digest('hex');
}

export async function GET(request: NextRequest) {
  try {
    const password = request.headers.get('x-admin-password');
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }

    const { blobs } = await list();
    const projectDataBlob = blobs.find(b => b.pathname === 'project-data.json');

    let headInfo = null;
    let contentHash = null;
    let blobContentText = null;
    let isValidJson = false;
    let projectCount = 0;
    let passwordCount = 0;

    if (projectDataBlob) {
      try {
        // 使用 head() 獲取精確的 metadata
        headInfo = await head(projectDataBlob.url);
        
        // 獲取內容並計算 hash
        const response = await fetch(projectDataBlob.url, { cache: 'no-store' });
        if (response.ok) {
          blobContentText = await response.text();
          contentHash = await getSha256Hash(blobContentText);
          
          // 驗證內容
          try {
            const jsonContent = JSON.parse(blobContentText);
            isValidJson = true;
            projectCount = jsonContent.projects?.length || 0;
            passwordCount = jsonContent.passwords?.length || 0;
          } catch (jsonError) {
            isValidJson = false;
          }
        }
      } catch (e) {
        console.error('讀取 Blob 詳細資訊時出錯:', e);
      }
    }

    const diagnosticInfo = {
      timestamp: new Date().toISOString(),
      blobDetails: {
        pathname: projectDataBlob?.pathname || 'N/A',
        url: projectDataBlob?.url || 'N/A',
        size: headInfo?.size || 0,
        uploadedAt: headInfo?.uploadedAt || null,
        contentType: headInfo?.contentType || 'N/A',
        contentHash: contentHash || 'N/A',
      },
      contentSummary: {
        isValidJson,
        projectCount,
        passwordCount,
        contentSize: blobContentText?.length || 0,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        vercelUrl: process.env.VERCEL_URL,
        vercelGitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA,
        hasAdminPassword: !!process.env.ADMIN_PASSWORD,
        hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
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
