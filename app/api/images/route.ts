/**
 * 圖片管理 API
 * GET: 列出所有圖片
 * POST: 上傳圖片
 */

import { NextRequest, NextResponse } from 'next/server';
import { listImages, uploadImage } from '@/app/lib/storage';

// 驗證管理員權限
function verifyAdmin(request: NextRequest): boolean {
  const adminPassword = request.headers.get('x-admin-password');
  return adminPassword === process.env.ADMIN_PASSWORD;
}

/**
 * GET /api/images
 * 列出所有圖片
 */
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await listImages();
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ files: result.files });
}

/**
 * POST /api/images
 * 上傳圖片
 */
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const customFilename = formData.get('filename') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const result = await uploadImage(file, customFilename || undefined);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      filename: customFilename || file.name,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

