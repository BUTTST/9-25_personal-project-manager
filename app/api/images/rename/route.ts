/**
 * 圖片重命名 API
 * POST: 重命名圖片並更新所有引用
 * 
 * 支持兩種重命名模式：
 * - display-only: 只更新顯示名稱（推薦，不影響 URL）
 * - full: 完整重命名（包括存儲檔名，需更新專案引用）
 */

import { NextRequest, NextResponse } from 'next/server';
import { renameImage, updateImageDisplayName, checkImageReferences, updateImageReferences } from '@/lib/storage';

// 驗證管理員權限
function verifyAdmin(request: NextRequest): boolean {
  const adminPassword = request.headers.get('x-admin-password');
  return adminPassword === process.env.ADMIN_PASSWORD;
}

/**
 * POST /api/images/rename
 * Body: { 
 *   oldFilename: string, 
 *   newFilename: string, 
 *   updateReferences?: boolean,
 *   renameMode?: 'display-only' | 'full'  // 預設 'display-only'
 * }
 */
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      oldFilename, 
      newFilename, 
      updateReferences = true,
      renameMode = 'display-only' // 預設只更新顯示名稱
    } = body;

    if (!oldFilename || !newFilename) {
      return NextResponse.json(
        { error: 'oldFilename and newFilename are required' },
        { status: 400 }
      );
    }

    // 1. 檢查圖片引用（用於統計資訊）
    const refResult = await checkImageReferences(oldFilename);
    
    if (!refResult.success) {
      return NextResponse.json({ error: refResult.error }, { status: 500 });
    }

    const references = refResult.references || [];
    let updatedProjects = 0;
    let newStoredFilename = oldFilename;
    let newUrl = null;

    // 2. 根據模式執行不同的重命名邏輯
    if (renameMode === 'display-only') {
      // ⭐ 模式 A：只更新顯示名稱（推薦）
      const result = await updateImageDisplayName(oldFilename, newFilename);
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      // 存儲檔名和 URL 不變，不需要更新專案引用
      newStoredFilename = oldFilename;
      
    } else if (renameMode === 'full') {
      // 模式 B：完整重命名（包括存儲檔名）
      const renameResult = await renameImage(oldFilename, newFilename);

      if (!renameResult.success) {
        return NextResponse.json({ error: renameResult.error }, { status: 400 });
      }

      newStoredFilename = renameResult.newStoredFilename || oldFilename;
      newUrl = renameResult.newUrl;

      // 需要更新專案引用（因為 URL 改變了）
      if (updateReferences && references.length > 0) {
        const projectIds = references.map((ref) => ref.id);
        const updateResult = await updateImageReferences(
          oldFilename,
          newStoredFilename,
          projectIds
        );

        if (updateResult.success) {
          updatedProjects = updateResult.updatedCount || 0;
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid renameMode. Use "display-only" or "full".' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      mode: renameMode,
      newFilename: newStoredFilename,
      newDisplayName: newFilename,
      newUrl: newUrl,
      referencesFound: references.length,
      projectsUpdated: updatedProjects,
      affectedProjects: references.length > 0 ? references : undefined,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

