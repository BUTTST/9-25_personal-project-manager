/**
 * 圖片重命名 API
 * POST: 重命名圖片並更新所有引用
 */

import { NextRequest, NextResponse } from 'next/server';
import { renameImage, checkImageReferences, updateImageReferences } from '@/app/lib/storage';

// 驗證管理員權限
function verifyAdmin(request: NextRequest): boolean {
  const adminPassword = request.headers.get('x-admin-password');
  return adminPassword === process.env.ADMIN_PASSWORD;
}

/**
 * POST /api/images/rename
 * Body: { oldFilename: string, newFilename: string, updateReferences: boolean }
 */
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { oldFilename, newFilename, updateReferences = true } = body;

    if (!oldFilename || !newFilename) {
      return NextResponse.json(
        { error: 'oldFilename and newFilename are required' },
        { status: 400 }
      );
    }

    // 1. 檢查圖片引用
    const refResult = await checkImageReferences(oldFilename);
    
    if (!refResult.success) {
      return NextResponse.json({ error: refResult.error }, { status: 500 });
    }

    const references = refResult.references || [];

    // 2. 重命名圖片
    const renameResult = await renameImage(oldFilename, newFilename);

    if (!renameResult.success) {
      return NextResponse.json({ error: renameResult.error }, { status: 400 });
    }

    // 3. 如果需要更新引用
    let updatedProjects = 0;
    if (updateReferences && references.length > 0) {
      const projectIds = references.map((ref) => ref.id);
      const updateResult = await updateImageReferences(
        oldFilename,
        newFilename,
        projectIds
      );

      if (updateResult.success) {
        updatedProjects = updateResult.updatedCount || 0;
      }
    }

    return NextResponse.json({
      success: true,
      newUrl: renameResult.newUrl,
      referencesFound: references.length,
      projectsUpdated: updatedProjects,
      affectedProjects: references,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

