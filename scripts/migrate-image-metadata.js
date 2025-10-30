/**
 * 圖片元數據遷移腳本
 * 
 * 用途：將現有圖片的 metadata 遷移到資料庫表 image_metadata
 * 執行時機：在部署新代碼前執行一次
 * 
 * 使用方法：
 * 1. 確保 .env.local 中有正確的 Supabase 連線資訊
 * 2. 運行：node scripts/migrate-image-metadata.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 錯誤：缺少 Supabase 環境變數');
  console.log('請確認 .env.local 包含：');
  console.log('  - NEXT_PUBLIC_SUPABASE_URL');
  console.log('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BUCKET_NAME = 'project-images';

async function migrateImageMetadata() {
  console.log('🚀 開始遷移圖片元數據...\n');

  try {
    // 1. 獲取 Storage 中的所有圖片
    console.log('📂 步驟 1：讀取 Supabase Storage 中的圖片列表...');
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1000 });

    if (listError) {
      throw new Error(`讀取圖片列表失敗: ${listError.message}`);
    }

    console.log(`   找到 ${files.length} 個圖片檔案\n`);

    // 2. 檢查資料庫中已有的記錄
    console.log('🔍 步驟 2：檢查資料庫中已有的記錄...');
    const { data: existingRecords, error: selectError } = await supabase
      .from('image_metadata')
      .select('stored_filename');

    if (selectError) {
      throw new Error(`讀取資料庫失敗: ${selectError.message}`);
    }

    const existingFilenames = new Set(
      (existingRecords || []).map(r => r.stored_filename)
    );
    console.log(`   資料庫中已有 ${existingFilenames.size} 筆記錄\n`);

    // 3. 準備要插入的記錄（排除已存在的）
    console.log('📝 步驟 3：準備遷移數據...');
    const recordsToInsert = [];

    for (const file of files) {
      if (existingFilenames.has(file.name)) {
        console.log(`   ⏭️  跳過（已存在）: ${file.name}`);
        continue;
      }

      // 嘗試從 metadata 獲取原始檔名（如果有的話）
      let originalFilename = file.name;
      
      try {
        // 使用 REST API 獲取完整的檔案資訊（包括 metadata）
        const infoUrl = `${supabaseUrl}/storage/v1/object/info/authenticated/${BUCKET_NAME}/${file.name}`;
        const response = await fetch(infoUrl, {
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
        });

        if (response.ok) {
          const info = await response.json();
          if (info.metadata?.originalFilename) {
            originalFilename = info.metadata.originalFilename;
            console.log(`   ✨ 找到中文檔名: ${file.name} → ${originalFilename}`);
          }
        }
      } catch (error) {
        console.warn(`   ⚠️  無法獲取 ${file.name} 的 metadata:`, error.message);
      }

      recordsToInsert.push({
        stored_filename: file.name,
        original_filename: originalFilename,
        file_size: file.metadata?.size || 0,
        content_type: file.metadata?.mimetype || null,
        created_at: file.created_at,
        updated_at: file.updated_at,
      });
    }

    console.log(`\n   準備插入 ${recordsToInsert.length} 筆新記錄\n`);

    // 4. 批量插入記錄
    if (recordsToInsert.length > 0) {
      console.log('💾 步驟 4：寫入資料庫...');
      
      // 分批插入（每次 100 筆）
      const batchSize = 100;
      let insertedCount = 0;

      for (let i = 0; i < recordsToInsert.length; i += batchSize) {
        const batch = recordsToInsert.slice(i, i + batchSize);
        
        const { error: insertError } = await supabase
          .from('image_metadata')
          .insert(batch);

        if (insertError) {
          console.error(`   ❌ 插入失敗（批次 ${Math.floor(i / batchSize) + 1}）:`, insertError.message);
          // 繼續處理剩餘批次
          continue;
        }

        insertedCount += batch.length;
        console.log(`   ✅ 已插入 ${insertedCount}/${recordsToInsert.length} 筆記錄`);
      }

      console.log(`\n✅ 遷移完成！共插入 ${insertedCount} 筆記錄`);
    } else {
      console.log('✅ 所有圖片記錄都已存在，無需遷移');
    }

    // 5. 驗證結果
    console.log('\n📊 步驟 5：驗證遷移結果...');
    const { data: finalRecords, error: finalError } = await supabase
      .from('image_metadata')
      .select('stored_filename, original_filename')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!finalError && finalRecords) {
      console.log('\n   最新的 5 筆記錄：');
      finalRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.original_filename}`);
        if (record.original_filename !== record.stored_filename) {
          console.log(`      → 存儲為: ${record.stored_filename}`);
        }
      });
    }

    console.log('\n🎉 遷移腳本執行成功！\n');

  } catch (error) {
    console.error('\n❌ 遷移失敗:', error);
    process.exit(1);
  }
}

// 執行遷移
migrateImageMetadata();

