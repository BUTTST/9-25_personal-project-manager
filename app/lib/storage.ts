/**
 * Supabase Storage 操作庫
 * 處理圖片上傳、刪除、重命名等操作
 */

import { supabaseAdmin, getStoragePublicUrl } from './supabase';

const BUCKET_NAME = 'screenshots';

/**
 * 上傳圖片到 Supabase Storage
 */
export async function uploadImage(
  file: File,
  filename?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!supabaseAdmin) {
    return { success: false, error: 'Supabase admin client not available' };
  }

  try {
    // 使用提供的檔名或原始檔名
    const uploadFilename = filename || file.name;
    
    // 確保檔名安全（移除特殊字符）
    const safeFilename = uploadFilename.replace(/[^a-zA-Z0-9\u4e00-\u9fa5._()-]/g, '-');

    // 上傳檔案
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(safeFilename, file, {
        cacheControl: '3600',
        upsert: false, // 不覆蓋現有檔案
      });

    if (error) {
      // 檢查是否是檔案已存在
      if (error.message.includes('duplicate')) {
        return { success: false, error: `檔案 "${safeFilename}" 已存在` };
      }
      return { success: false, error: error.message };
    }

    const publicUrl = getStoragePublicUrl(data.path);
    return { success: true, url: publicUrl };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 批量上傳圖片
 */
export async function uploadMultipleImages(
  files: File[]
): Promise<Array<{ filename: string; success: boolean; url?: string; error?: string }>> {
  const results = [];
  
  for (const file of files) {
    const result = await uploadImage(file);
    results.push({
      filename: file.name,
      ...result,
    });
  }
  
  return results;
}

/**
 * 列出所有圖片
 */
export async function listImages(): Promise<{
  success: boolean;
  files?: Array<{
    name: string;
    url: string;
    size: number;
    created_at: string;
    updated_at: string;
  }>;
  error?: string;
}> {
  if (!supabaseAdmin) {
    return { success: false, error: 'Supabase admin client not available' };
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      return { success: false, error: error.message };
    }

    const files = data.map((file) => ({
      name: file.name,
      url: getStoragePublicUrl(file.name),
      size: file.metadata?.size || 0,
      created_at: file.created_at,
      updated_at: file.updated_at,
    }));

    return { success: true, files };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 刪除圖片
 */
export async function deleteImage(
  filename: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) {
    return { success: false, error: 'Supabase admin client not available' };
  }

  try {
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([filename]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 批量刪除圖片
 */
export async function deleteMultipleImages(
  filenames: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) {
    return { success: false, error: 'Supabase admin client not available' };
  }

  try {
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove(filenames);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 重命名圖片（透過下載-上傳-刪除）
 * Supabase Storage 不支援直接重命名，需要複製後刪除
 */
export async function renameImage(
  oldFilename: string,
  newFilename: string
): Promise<{ success: boolean; newUrl?: string; error?: string }> {
  if (!supabaseAdmin) {
    return { success: false, error: 'Supabase admin client not available' };
  }

  try {
    // 1. 下載舊檔案
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(oldFilename);

    if (downloadError) {
      return { success: false, error: `下載失敗: ${downloadError.message}` };
    }

    // 2. 上傳為新檔名
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(newFilename, fileData, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: `上傳失敗: ${uploadError.message}` };
    }

    // 3. 刪除舊檔案
    const { error: deleteError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([oldFilename]);

    if (deleteError) {
      // 如果刪除失敗，記錄警告但不影響結果
      console.warn(`警告：舊檔案刪除失敗 (${oldFilename}):`, deleteError);
    }

    const newUrl = getStoragePublicUrl(newFilename);
    return { success: true, newUrl };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 檢查圖片是否被專案引用
 */
export async function checkImageReferences(
  filename: string
): Promise<{
  success: boolean;
  references?: Array<{ id: string; name: string }>;
  error?: string;
}> {
  if (!supabaseAdmin) {
    return { success: false, error: 'Supabase admin client not available' };
  }

  try {
    // 查詢所有包含此圖片路徑的專案
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('id, date_and_file_name, image_previews')
      .contains('image_previews', [{ src: `/前端截圖/${filename}` }]);

    if (error) {
      return { success: false, error: error.message };
    }

    const references = (data || []).map((project: any) => ({
      id: project.id,
      name: project.date_and_file_name,
    }));

    return { success: true, references };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 更新專案中的圖片引用
 * 當圖片被重命名時，自動更新所有引用該圖片的專案
 */
export async function updateImageReferences(
  oldFilename: string,
  newFilename: string,
  projectIds: string[]
): Promise<{ success: boolean; updatedCount?: number; error?: string }> {
  if (!supabaseAdmin) {
    return { success: false, error: 'Supabase admin client not available' };
  }

  try {
    let updatedCount = 0;

    for (const projectId of projectIds) {
      // 獲取專案資料
      const { data: project, error: fetchError } = await supabaseAdmin
        .from('projects')
        .select('image_previews')
        .eq('id', projectId)
        .single();

      if (fetchError || !project) {
        console.error(`無法獲取專案 ${projectId}:`, fetchError);
        continue;
      }

      // 更新圖片路徑
      const updatedPreviews = (project.image_previews as any[]).map((preview) => {
        if (preview.src === `/前端截圖/${oldFilename}`) {
          return {
            ...preview,
            src: `/前端截圖/${newFilename}`,
          };
        }
        return preview;
      });

      // 保存更新
      const { error: updateError } = await supabaseAdmin
        .from('projects')
        .update({ image_previews: updatedPreviews })
        .eq('id', projectId);

      if (updateError) {
        console.error(`更新專案 ${projectId} 失敗:`, updateError);
        continue;
      }

      updatedCount++;
    }

    return { success: true, updatedCount };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

