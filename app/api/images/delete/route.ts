/**
 * 圖片刪除 API
 * POST: 刪除圖片（檢查引用）
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteImage, deleteMultipleImages, checkImageReferences } from '@/lib/storage';

// 驗證管理員權限
function verifyAdmin(request: NextRequest): boolean {
  const adminPassword = request.headers.get('x-admin-password');
  return adminPassword === process.env.ADMIN_PASSWORD;
}

/**
 * POST /api/images/delete
 * Body: { filename: string } | { filenames: string[], force: boolean }
 */
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { filename, filenames, force = false } = body;

    // 單檔刪除
    if (filename) {
      // 檢查引用
      const refResult = await checkImageReferences(filename);
      
      if (!refResult.success) {
        return NextResponse.json({ error: refResult.error }, { status: 500 });
      }

      const references = refResult.references || [];

      if (references.length > 0 && !force) {
        return NextResponse.json(
          {
            error: 'Image is in use',
            references,
            message: `此圖片被 ${references.length} 個專案使用`,
          },
          { status: 400 }
        );
      }

      const result = await deleteImage(filename);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: '圖片已刪除',
        hadReferences: references.length > 0,
      });
    }

    // 批量刪除
    if (filenames && Array.isArray(filenames)) {
      // 檢查所有檔案的引用
      const allReferences: any[] = [];
      
      for (const file of filenames) {
        const refResult = await checkImageReferences(file);
        if (refResult.success && refResult.references && refResult.references.length > 0) {
          allReferences.push({
            filename: file,
            references: refResult.references,
          });
        }
      }

      if (allReferences.length > 0 && !force) {
        return NextResponse.json(
          {
            error: 'Some images are in use',
            filesInUse: allReferences,
            message: `有 ${allReferences.length} 個圖片正在使用中`,
          },
          { status: 400 }
        );
      }

      const result = await deleteMultipleImages(filenames);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `已刪除 ${filenames.length} 個圖片`,
        deletedCount: filenames.length,
      });
    }

    return NextResponse.json(
      { error: 'filename or filenames required' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

