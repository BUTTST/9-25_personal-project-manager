/**
 * Supabase Storage 操作庫
 * 處理圖片上傳、刪除、重命名等操作
 * 
 * 架構說明：
 * - Storage：存儲實際圖片檔案（檔名使用 ASCII）
 * - image_metadata 表：存儲檔名映射關係（支援中文顯示名稱）
 */

import { supabaseAdmin, getStoragePublicUrl } from './supabase';

const BUCKET_NAME = 'project-images';

/**
 * 生成檔名的簡短 hash（用於識別原始檔名）
 */
function generateFilenameHash(filename: string): string {
  let hash = 0;
  for (let i = 0; i < filename.length; i++) {
    const char = filename.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 6);
}

/**
 * 上傳圖片到 Supabase Storage
 * 
 * 智能處理檔名衝突：
 * 1. 檢查原始檔名是否已存在（避免重複上傳相同圖片）
 * 2. 清理檔名後如果衝突，自動添加序號
 */
export async function uploadImage(
  file: File,
  filename?: string
): Promise<{ 
  success: boolean; 
  url?: string; 
  originalFilename?: string;
  storedFilename?: string;
  error?: string;
}> {
  if (!supabaseAdmin) {
    return { success: false, error: 'Supabase admin 客戶端不可用' };
  }

  try {
    // 使用提供的檔名或原始檔名
    const uploadFilename = filename || file.name;
    
    // 生成原始檔名的 hash（用於檢測重複上傳）
    const filenameHash = generateFilenameHash(uploadFilename);
    
    // 確保檔名安全（只允許 ASCII 字符）
    // Supabase Storage 不接受中文或特殊字符
    // 移除中文字符，只保留英文、數字、連字號、底線、點和括號
    let safeFilename = uploadFilename
      .replace(/[\u4e00-\u9fa5]/g, '') // 移除中文
      .replace(/[^a-zA-Z0-9._()-]/g, '-') // 其他非法字符替換為連字號
      .replace(/^-+|-+$/g, '') // 移除開頭和結尾的連字號
      .replace(/-{2,}/g, '-'); // 多個連字號合併為一個
    
    // 如果檔名處理後為空或只有副檔名，使用時間戳
    if (!safeFilename || safeFilename.startsWith('.')) {
      const timestamp = Date.now();
      const ext = file.name.split('.').pop() || 'jpg';
      safeFilename = `image-${timestamp}.${ext}`;
    }

    // 取得現有檔案列表，檢查是否有衝突
    const { data: existingFiles, error: listError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1000 });

    if (listError) {
      return { success: false, error: `無法檢查現有檔案：${listError.message}` };
    }

    // 檢查 1：原始檔名是否已存在（通過 hash 識別）
    const existingFileWithSameOriginal = existingFiles?.find(f => 
      f.name.includes(`-${filenameHash}.`)
    );

    if (existingFileWithSameOriginal) {
      return { 
        success: false, 
        error: `圖片「${uploadFilename}」已存在於系統中（存儲為：${existingFileWithSameOriginal.name}）` 
      };
    }

    // 檢查 2：清理後的檔名是否衝突，如果衝突則添加序號
    const nameParts = safeFilename.split('.');
    const ext = nameParts.pop() || 'png';
    const baseName = nameParts.join('.');
    
    // 建立帶 hash 的檔名：{baseName}-{hash}.{ext}
    let finalFilename = `${baseName}-${filenameHash}.${ext}`;
    let counter = 1;

    // 如果檔名仍然衝突（極少見，但理論上可能），添加數字序號
    while (existingFiles?.some(f => f.name === finalFilename)) {
      finalFilename = `${baseName}-${filenameHash}-${counter}.${ext}`;
      counter++;
    }

    // 上傳檔案到 Storage
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(finalFilename, file, {
        cacheControl: '3600',
        upsert: false, // 不覆蓋現有檔案
        contentType: file.type,
      });

    if (error) {
      // 檢查是否是檔案已存在（理論上不應該發生，因為我們已經檢查過）
      if (error.message.includes('duplicate') || error.message.includes('already exists')) {
        return { 
          success: false, 
          error: `檔案「${finalFilename}」已存在於儲存空間中` 
        };
      }
      return { success: false, error: `上傳失敗：${error.message}` };
    }

    // ⭐ 同步寫入資料庫：保存檔名映射關係
    const { error: dbError } = await supabaseAdmin
      .from('image_metadata')
      .insert({
        stored_filename: finalFilename,
        original_filename: uploadFilename, // 原始中文檔名
        file_size: file.size,
        content_type: file.type,
        file_hash: filenameHash,
      });

    if (dbError) {
      console.error('⚠️ 寫入資料庫失敗:', dbError);
      // 不影響上傳結果，但記錄警告
      // 如果需要嚴格保證數據一致性，可以在這裡刪除已上傳的檔案
    }

    const publicUrl = getStoragePublicUrl(data.path);
    return { 
      success: true, 
      url: publicUrl,
      originalFilename: uploadFilename,  // 原始檔名（可能包含中文）
      storedFilename: finalFilename      // 存儲的檔名（ASCII + hash）
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: `上傳發生錯誤：${error.message}` 
    };
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
 * 列出所有圖片（從資料庫讀取中文檔名）
 * ⭐ 關鍵改進：直接從 image_metadata 表讀取顯示名稱
 */
export async function listImages(): Promise<{
  success: boolean;
  files?: Array<{
    name: string;
    originalFilename?: string;
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
    // ⭐ 直接從資料庫讀取所有圖片的元數據（包含中文檔名）
    const { data: metadataList, error: dbError } = await supabaseAdmin
      .from('image_metadata')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('從資料庫讀取圖片列表失敗:', dbError);
      return { success: false, error: `資料庫查詢失敗: ${dbError.message}` };
    }

    // 轉換為 API 回應格式
    const files = (metadataList || []).map((metadata) => ({
      name: metadata.stored_filename,
      originalFilename: metadata.original_filename, // ✨ 中文檔名
      url: getStoragePublicUrl(metadata.stored_filename),
      size: metadata.file_size || 0,
      created_at: metadata.created_at,
      updated_at: metadata.updated_at,
    }));

    return { success: true, files };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 刪除圖片（同步刪除 Storage 和資料庫記錄）
 */
export async function deleteImage(
  filename: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) {
    return { success: false, error: 'Supabase admin client not available' };
  }

  try {
    // 1. 刪除 Storage 中的檔案
    const { error: storageError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([filename]);

    if (storageError) {
      return { success: false, error: storageError.message };
    }

    // 2. ⭐ 同步刪除資料庫記錄
    const { error: dbError } = await supabaseAdmin
      .from('image_metadata')
      .delete()
      .eq('stored_filename', filename);

    if (dbError) {
      console.error('⚠️ 刪除資料庫記錄失敗:', dbError);
      // 不影響結果，但記錄警告
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 批量刪除圖片（同步刪除 Storage 和資料庫記錄）
 */
export async function deleteMultipleImages(
  filenames: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) {
    return { success: false, error: 'Supabase admin client not available' };
  }

  try {
    // 1. 刪除 Storage 中的檔案
    const { error: storageError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove(filenames);

    if (storageError) {
      return { success: false, error: storageError.message };
    }

    // 2. ⭐ 同步刪除資料庫記錄
    const { error: dbError } = await supabaseAdmin
      .from('image_metadata')
      .delete()
      .in('stored_filename', filenames);

    if (dbError) {
      console.error('⚠️ 批量刪除資料庫記錄失敗:', dbError);
      // 不影響結果，但記錄警告
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 更新圖片的顯示名稱（僅更新資料庫中的 original_filename）
 * 實際存儲檔名不變，不影響 URL 和專案引用
 * 
 * 適用場景：管理員想改變顯示的中文檔名，但不想影響現有引用
 */
export async function updateImageDisplayName(
  storedFilename: string,
  newDisplayName: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) {
    return { success: false, error: 'Supabase admin 客戶端不可用' };
  }

  try {
    // ⭐ 直接更新資料庫中的顯示名稱
    const { error: updateError } = await supabaseAdmin
      .from('image_metadata')
      .update({ 
        original_filename: newDisplayName,
        updated_at: new Date().toISOString(),
      })
      .eq('stored_filename', storedFilename);

    if (updateError) {
      return { success: false, error: `更新資料庫失敗: ${updateError.message}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 完整重命名圖片（包括存儲檔名和顯示名稱）
 * 會改變 URL，需要同時更新所有專案引用
 * 
 * 適用場景：需要改變實際存儲的檔名（較少使用）
 */
export async function renameImage(
  oldFilename: string,
  newFilename: string
): Promise<{ 
  success: boolean; 
  newUrl?: string; 
  newStoredFilename?: string;
  newOriginalFilename?: string;
  error?: string;
}> {
  if (!supabaseAdmin) {
    return { success: false, error: 'Supabase admin client not available' };
  }

  try {
    // 1. 從資料庫獲取舊檔案的資訊
    const { data: oldMetadata, error: selectError } = await supabaseAdmin
      .from('image_metadata')
      .select('*')
      .eq('stored_filename', oldFilename)
      .single();

    if (selectError) {
      console.warn('⚠️ 無法從資料庫讀取檔案資訊:', selectError);
    }

    // 2. 下載舊檔案
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(oldFilename);

    if (downloadError) {
      return { success: false, error: `下載失敗: ${downloadError.message}` };
    }

    // 3. 清理新檔名並生成存儲檔名（與上傳邏輯一致）
    const filenameHash = generateFilenameHash(newFilename);
    let safeFilename = newFilename
      .replace(/[\u4e00-\u9fa5]/g, '') // 移除中文
      .replace(/[^a-zA-Z0-9._()-]/g, '-') // 其他非法字符替換為連字號
      .replace(/^-+|-+$/g, '') // 移除開頭和結尾的連字號
      .replace(/-{2,}/g, '-'); // 多個連字號合併為一個
    
    // 如果檔名處理後為空或只有副檔名，使用時間戳
    if (!safeFilename || safeFilename.startsWith('.')) {
      const timestamp = Date.now();
      const ext = newFilename.split('.').pop() || 'png';
      safeFilename = `image-${timestamp}.${ext}`;
    }

    const nameParts = safeFilename.split('.');
    const ext = nameParts.pop() || 'png';
    const baseName = nameParts.join('.');
    const finalFilename = `${baseName}-${filenameHash}.${ext}`;

    // 4. 上傳為新檔名到 Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(finalFilename, fileData, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: `上傳失敗: ${uploadError.message}` };
    }

    // 5. ⭐ 更新資料庫：刪除舊記錄，插入新記錄
    // 刪除舊記錄
    await supabaseAdmin
      .from('image_metadata')
      .delete()
      .eq('stored_filename', oldFilename);

    // 插入新記錄
    const { error: dbError } = await supabaseAdmin
      .from('image_metadata')
      .insert({
        stored_filename: finalFilename,
        original_filename: newFilename,
        file_size: oldMetadata?.file_size || 0,
        content_type: oldMetadata?.content_type || null,
        file_hash: filenameHash,
      });

    if (dbError) {
      console.error('⚠️ 寫入資料庫失敗:', dbError);
    }

    // 6. 刪除 Storage 中的舊檔案
    const { error: deleteError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([oldFilename]);

    if (deleteError) {
      // 如果刪除失敗，記錄警告但不影響結果
      console.warn(`警告：舊檔案刪除失敗 (${oldFilename}):`, deleteError);
    }

    const newUrl = getStoragePublicUrl(finalFilename);
    return { 
      success: true, 
      newUrl,
      newStoredFilename: finalFilename,
      newOriginalFilename: newFilename
    };
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
    // 構建 Supabase Storage 的完整 URL
    const imageUrl = getStoragePublicUrl(filename);
    
    // 查詢所有專案，檢查 image_previews 中是否包含此圖片 URL
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('id, date_and_file_name, image_previews');

    if (error) {
      return { success: false, error: error.message };
    }

    // 手動過濾包含此圖片的專案
    const references = (projects || [])
      .filter((project: any) => {
        const previews = project.image_previews || [];
        return previews.some((preview: any) => preview.src === imageUrl);
      })
      .map((project: any) => ({
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
    // 構建舊的和新的 Supabase Storage URL
    const oldImageUrl = getStoragePublicUrl(oldFilename);
    const newImageUrl = getStoragePublicUrl(newFilename);
    
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
        if (preview.src === oldImageUrl) {
          return {
            ...preview,
            src: newImageUrl,
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

