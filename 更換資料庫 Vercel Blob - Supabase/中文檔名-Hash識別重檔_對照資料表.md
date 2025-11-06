# Supabase Storage 中文檔名支援實施筆記

> 📅 最終實施日期：2025-10-30  
> 🎯 最終方案：**PostgreSQL 資料庫表 + Hash 識別**  
> ✅ 狀態：已完成並部署

---

## 🎯 核心問題

### 問題描述
Supabase Storage **不支援中文檔名**，只接受 ASCII 字符（a-z, A-Z, 0-9, -, _, ., (, )）。

### 用戶需求
1. 上傳含中文檔名的圖片
2. 前端顯示原始中文檔名
3. 編輯時支援修改為中文檔名
4. 所有位置（圖片庫、專案選擇）都顯示中文

---

## ✅ 最終解決方案（v2.0）

### 架構設計

```
┌─────────────────────────────────────────┐
│  用戶上傳：螢幕擷取畫面.png              │
└──────────────┬──────────────────────────┘
               ↓
    ┌──────────────────┬──────────────────┐
    ↓                  ↓                  ↓
Storage 存儲      Database 存儲       前端顯示
-abc123.png       original_filename   螢幕擷取畫面
(ASCII only)      螢幕擷取畫面.png     (中文顯示)
```

### 核心組件

#### 1. 資料庫表結構

   ```sql
CREATE TABLE public.image_metadata (
  stored_filename TEXT PRIMARY KEY,       -- 存儲檔名 (ASCII)
  original_filename TEXT NOT NULL,        -- 原始檔名 (中文) ✨
  file_size BIGINT DEFAULT 0,
  content_type TEXT,
  file_hash TEXT,                         -- 防重複上傳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 關鍵索引
CREATE INDEX idx_image_metadata_original ON image_metadata(original_filename);
CREATE INDEX idx_image_metadata_created ON image_metadata(created_at DESC);
CREATE INDEX idx_image_metadata_hash ON image_metadata(file_hash);
```

#### 2. Hash 生成函數（防止檔名衝突）

```typescript
function generateFilenameHash(filename: string): string {
  let hash = 0;
  for (let i = 0; i < filename.length; i++) {
    const char = filename.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substring(0, 6);
}
```

**用途**：為每個原始檔名生成唯一 6 位識別碼，避免清理後檔名衝突。

#### 3. 檔名清理規則

```typescript
// 步驟 1：生成 hash
const filenameHash = generateFilenameHash(uploadFilename);

// 步驟 2：清理檔名
let safeFilename = uploadFilename
  .replace(/[\u4e00-\u9fa5]/g, '')           // 移除中文
  .replace(/[^a-zA-Z0-9._()-]/g, '-')       // 非法字符 → 連字號
  .replace(/^-+|-+$/g, '')                  // 移除首尾連字號
  .replace(/-{2,}/g, '-');                  // 合併多個連字號

// 步驟 3：組合最終檔名
const nameParts = safeFilename.split('.');
const ext = nameParts.pop() || 'png';
const baseName = nameParts.join('.');
const finalFilename = `${baseName}-${filenameHash}.${ext}`;
```

**轉換範例**：
```
螢幕擷取畫面 2025-10-30.png  →  2025-10-30-a3f9c2.png
10-16_SME(設定).png         →  10-16_SME()-b7d4e1.png
```

---

## 💻 關鍵代碼實現

### 上傳時同步寫入

```typescript
export async function uploadImage(file: File, filename?: string) {
  const uploadFilename = filename || file.name;
  const filenameHash = generateFilenameHash(uploadFilename);

  // 清理檔名...
  const finalFilename = `${baseName}-${filenameHash}.${ext}`;

  // 1. 檢查重複（通過 hash）
  const { data: existingFiles } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .list('', { limit: 1000 });

  const duplicate = existingFiles?.find(f => f.name.includes(`-${filenameHash}.`));
  if (duplicate) {
    return { 
      success: false, 
      error: `圖片「${uploadFilename}」已存在（${duplicate.name}）`
    };
  }
  
  // 2. 上傳到 Storage
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(finalFilename, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });
  
  if (error) return { success: false, error: error.message };
  
  // 3. ⭐ 同步寫入資料庫（關鍵！）
  await supabaseAdmin
    .from('image_metadata')
    .insert({
      stored_filename: finalFilename,
      original_filename: uploadFilename,  // 保存中文檔名
      file_size: file.size,
      content_type: file.type,
      file_hash: filenameHash,
    });
  
  return { 
    success: true, 
    url: getStoragePublicUrl(finalFilename),
    originalFilename: uploadFilename,
    storedFilename: finalFilename
  };
}
```

### 列表時從資料庫讀取（核心改進）

```typescript
export async function listImages() {
  // ⭐ 直接從資料庫讀取（不再依賴 Storage metadata）
  const { data: metadataList, error } = await supabaseAdmin
    .from('image_metadata')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    return { success: false, error: `資料庫查詢失敗: ${error.message}` };
  }
  
  const files = (metadataList || []).map((metadata) => ({
    name: metadata.stored_filename,
    originalFilename: metadata.original_filename, // ✨ 中文檔名
    url: getStoragePublicUrl(metadata.stored_filename),
    size: metadata.file_size,
    created_at: metadata.created_at,
    updated_at: metadata.updated_at,
  }));
  
  return { success: true, files };
}
```

**為什麼不用 Storage metadata？**
- Storage 的 `.list()` API **不返回**自定義 metadata
- 需要為每個檔案單獨調用 API（100 張圖 = 100 次請求）
- 資料庫方案：1 次查詢獲取所有數據，效能提升 **100 倍**

### 編輯檔名

```typescript
export async function updateImageDisplayName(
  storedFilename: string,
  newDisplayName: string
) {
  // ⭐ 直接更新資料庫（不需重新上傳檔案）
  const { error } = await supabaseAdmin
    .from('image_metadata')
    .update({ 
      original_filename: newDisplayName,  // 更新中文檔名
      updated_at: new Date().toISOString(),
    })
    .eq('stored_filename', storedFilename);
  
  return error ? { success: false, error: error.message } : { success: true };
}
```

### 刪除時同步清理

```typescript
export async function deleteImage(filename: string) {
  // 1. 刪除 Storage
  await supabaseAdmin.storage.from(BUCKET_NAME).remove([filename]);
  
  // 2. ⭐ 同步刪除資料庫記錄
  await supabaseAdmin
    .from('image_metadata')
    .delete()
    .eq('stored_filename', filename);
  
  return { success: true };
}
```

---

## 🔧 部署與遷移

### 步驟 1：創建資料表

在 Supabase Dashboard 執行：
```bash
# 檔案：supabase/migrations/001_create_image_metadata.sql
```

### 步驟 2：遷移現有圖片

```bash
npm run migrate-images
```

**遷移腳本關鍵邏輯**：
```javascript
// 讀取 Storage 中的所有檔案
const { data: files } = await supabase.storage.from(BUCKET_NAME).list('');

for (const file of files) {
  // 嘗試從 Storage metadata 獲取原始檔名
  const info = await fetch(`${supabaseUrl}/storage/v1/object/info/authenticated/${BUCKET_NAME}/${file.name}`, {
    headers: { 'Authorization': `Bearer ${serviceKey}` }
  }).then(r => r.json());
  
  const originalFilename = info.metadata?.originalFilename || file.name;
  
  // 插入資料庫
  await supabase.from('image_metadata').insert({
    stored_filename: file.name,
    original_filename: originalFilename,
    file_size: file.metadata?.size || 0,
    content_type: file.metadata?.mimetype || null,
    created_at: file.created_at,
  });
}
```

---

## ⚠️ 常見問題與除錯

### 問題 1：圖片庫仍顯示 ASCII 檔名

**症狀**：顯示 `2025-10-30-a3f9c2.png` 而非 `螢幕擷取畫面.png`

**原因**：
1. 資料庫表未創建
2. 遷移腳本未執行
3. 前端使用 `file.name` 而非 `file.originalFilename`

**解決**：
```typescript
// ❌ 錯誤
const title = file.name.replace(/\.[^/.]+$/, '');

// ✅ 正確
const title = (file.originalFilename || file.name).replace(/\.[^/.]+$/, '');
```

### 問題 2：上傳後資料庫無記錄

**症狀**：Storage 有檔案，但 `image_metadata` 表為空

**可能原因**：
1. `SUPABASE_SERVICE_ROLE_KEY` 未設定
2. RLS 政策阻擋寫入

**除錯步驟**：
```bash
# 1. 檢查環境變數
echo $SUPABASE_SERVICE_ROLE_KEY

# 2. 查看後端日誌（Vercel Dashboard → Functions → Logs）
# 搜尋 "⚠️ 寫入資料庫失敗"

# 3. 測試資料庫連接
SELECT * FROM image_metadata;
```

**修復**：確認 RLS 政策允許 service_role 寫入：
```sql
-- 檢查 RLS
SELECT * FROM pg_policies WHERE tablename = 'image_metadata';

-- service_role 會自動繞過 RLS，無需額外設定
```

### 問題 3：編輯檔名失敗

**症狀**：點擊保存後無反應或報錯

**檢查清單**：
1. API 是否返回 `renameMode: 'display-only'`
2. 前端是否傳送 `storedFilename`（而非 `originalFilename`）
3. 資料庫中是否有對應記錄

**除錯代碼**：
```typescript
// 前端 ImageGallery.tsx
const saveRename = async (oldFilename: string) => {
  console.log('編輯檔名:', { oldFilename, newFilename });
  
  const response = await fetch('/api/images/rename', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPassword },
    body: JSON.stringify({
      oldFilename,        // ⚠️ 必須是 stored_filename
      newFilename,        // 新的顯示名稱
      renameMode: 'display-only',
    }),
  });
  
  const data = await response.json();
  console.log('編輯結果:', data);
};
```

### 問題 4：檔名衝突（多個中文檔名清理後相同）

**症狀**：上傳失敗，提示 "The resource already exists"

**範例**：
```
10-16_SME(設定).png → 10-16_SME().png  ✅
10-16_SME(報表).png → 10-16_SME().png  ❌ 已存在！
```

**解決**：Hash 識別系統已解決，確認代碼包含：
```typescript
const filenameHash = generateFilenameHash(uploadFilename);
const finalFilename = `${baseName}-${filenameHash}.${ext}`;
```

### 問題 5：重複上傳檢測失效

**症狀**：相同圖片可以重複上傳

**檢查**：
```typescript
// 確認檢測邏輯存在
const duplicate = existingFiles?.find(f => f.name.includes(`-${filenameHash}.`));
if (duplicate) {
  return { success: false, error: `圖片已存在` };
}
```

---

## 📊 方案演進對比（快速參考）

| 版本 | 時間 | 核心技術 | 解決問題 | 實際狀態 |
|------|------|---------|---------|---------|
| v1.0 | 2025-10-29 上午 | 雙檔名（API 返回） | 試圖支援中文上傳 | ❌ **半成品**（無法顯示） |
| v1.1 | 2025-10-29 下午 | + Hash 識別 | **檔名衝突** | ✅ **成功**（Hash 部分） |
| v1.2 | 2025-10-29 晚間 | + Storage Metadata | 試圖支援中文顯示 | ❌ **失敗**（list() 無法讀取） |
| **v2.0** | **2025-10-30** | **+ Database 表** | **完整中文支援** | ✅ **完全成功** |

### 關鍵演進說明

**問題 1：檔名衝突**
- ✅ **v1.1 Hash 識別**完全解決
- 多個中文檔名清理後可能相同（如 `SME(設定).png` 和 `SME(報表).png` 都變成 `SME().png`）
- Hash 為每個原始檔名生成唯一識別碼，避免衝突

**問題 2：中文顯示支援**
- ❌ **v1.0-v1.2 都是半成品/失敗**
  - v1.0：只在 API 返回中包含原始檔名，但前端無處可用
  - v1.2：嘗試用 Storage metadata，但 list() API 不返回自定義 metadata
- ✅ **v2.0 Database 表方案**才真正完整解決
  - 所有位置顯示中文檔名
  - 查詢效能提升 100 倍
  - 編輯檔名無需重新上傳
  - PostgreSQL 保證數據一致性

---

## 🎯 核心學習要點

### 1. Supabase Storage 限制
- **不支援中文檔名**（只接受 ASCII）
- `.list()` API **不返回**自定義 metadata（v1.2 失敗的根本原因）
- 獲取 metadata 需要單獨調用 API（性能差且不實用）

### 2. 兩個核心問題與解決方案

**問題 A：檔名衝突**
- **解決方案**：Hash 識別（v1.1）✅
- 為每個原始檔名生成 6 位唯一識別碼
- 確保不同中文檔名不會在清理後衝突

**問題 B：中文顯示**
- **失敗嘗試**：
  - v1.0：雙檔名 API 返回 → 前端無處使用 ❌
  - v1.2：Storage metadata → list() 無法讀取 ❌
- **成功方案**：Database 表（v2.0）✅
  - PostgreSQL 存儲檔名映射
  - 單次查詢獲取所有資料
  - 完整 CRUD 支援

### 3. 為何 v1.0-v1.2 都失敗？

```typescript
// ❌ v1.0 失敗原因：API 返回但前端用不到
const result = await uploadImage(file);
// result.originalFilename 存在，但圖片列表時無法獲取

// ❌ v1.2 失敗原因：Storage 的 list() 不返回自定義 metadata
const { data } = await storage.list();  // 只返回系統 metadata
console.log(data[0].metadata.originalFilename);  // undefined ❌

// 要獲取需要逐個調用（100 張圖 = 100 次請求）
for (const file of data) {
  const info = await fetch(`/storage/v1/object/info/${file.name}`);  // 太慢！
}

// ✅ v2.0 成功方案：Database 一次查詢全部
const { data } = await supabase
  .from('image_metadata')
  .select('*');  // 1 次查詢，包含所有中文檔名 ✅
```

### 4. 前端整合要點（v2.0 後才能用）

```typescript
// ⭐ v2.0 Database 方案後，前端才能真正使用 originalFilename
interface ImageFile {
  name: string;              // 存儲檔名（ASCII）
  originalFilename: string;  // 顯示檔名（中文）✨ v2.0 後才有效
  url: string;
}

// 顯示時優先使用 originalFilename
const displayName = file.originalFilename || file.name;

// ⚠️ v1.0-v1.2 的問題：
// - v1.0：上傳時有 originalFilename，但列表時取不到
// - v1.2：metadata 存了但 list() 讀不出來
// - v2.0：從 Database 直接讀取，完全解決 ✅
```

---

## 📝 檢查清單（部署時使用）

### 部署前
- [ ] Supabase 資料表已創建（`image_metadata`）
- [ ] 索引已創建（3 個）
- [ ] RLS 政策已設定
- [ ] 環境變數已配置（`SUPABASE_SERVICE_ROLE_KEY`）

### 部署後
- [ ] 執行遷移腳本（`npm run migrate-images`）
- [ ] 測試上傳中文檔名圖片
- [ ] 測試圖片庫顯示中文
- [ ] 測試專案選擇頁面顯示中文
- [ ] 測試編輯檔名為中文
- [ ] 測試刪除圖片（Storage + Database 同步刪除）

### 驗證查詢

```sql
-- 檢查資料表
SELECT * FROM image_metadata ORDER BY created_at DESC LIMIT 10;

-- 檢查中文檔名
SELECT original_filename, stored_filename FROM image_metadata 
WHERE original_filename ~ '[\u4e00-\u9fa5]';

-- 檢查重複 hash
SELECT file_hash, COUNT(*) FROM image_metadata 
GROUP BY file_hash HAVING COUNT(*) > 1;
```

---

## 🔗 相關檔案

**資料庫**：
- `supabase/migrations/001_create_image_metadata.sql` - 建表 SQL
- `scripts/migrate-image-metadata.js` - 數據遷移腳本

**後端**：
- `app/lib/storage.ts` - 核心邏輯（上傳、列表、編輯、刪除）
- `app/api/images/route.ts` - 上傳 API
- `app/api/images/rename/route.ts` - 重命名 API

**前端**：
- `app/components/admin/ImageGallery.tsx` - 圖片庫顯示
- `app/admin/new/page.tsx` - 新增專案（圖片選擇）
- `app/components/admin/EditProjectModal.tsx` - 編輯專案（圖片選擇）

**文檔**：
- `docs/開發者內容/圖片中文檔名支援-部署指南.md` - 詳細部署指南
- `README-IMAGE-METADATA-UPDATE.md` - 快速更新指南

---

**最後更新**：2025-10-30  
**版本**：v2.0（資料庫表方案）  
**狀態**：✅ 生產就緒
