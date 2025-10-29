/**
 * 檢查圖片引用 API
 * POST: 檢查圖片是否被專案使用
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkImageReferences } from '@/lib/storage';

// 驗證管理員權限
function verifyAdmin(request: NextRequest): boolean {
  const adminPassword = request.headers.get('x-admin-password');
  return adminPassword === process.env.ADMIN_PASSWORD;
}

/**
 * POST /api/images/check-references
 * Body: { filename: string }
 */
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { filename } = body;

    if (!filename) {
      return NextResponse.json({ error: 'filename is required' }, { status: 400 });
    }

    const result = await checkImageReferences(filename);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      filename,
      referencesCount: result.references?.length || 0,
      references: result.references || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

