# 改建 Supabase 遇到的各種錯誤與解決方法

> 📅 記錄日期：2025-10-29  
> 🎯 目的：記錄從 Vercel Blob 遷移到 Supabase 過程中遇到的實際問題與解決方案

---

## 🔴 錯誤 1：模組導入路徑錯誤（構建失敗）

### ❌ 錯誤訊息
```
Module not found: Can't resolve '@/app/lib/supabase'
Module not found: Can't resolve '@/app/lib/storage'
Module not found: Can't resolve '@/app/components/admin/ImageUploader'
Module not found: Can't resolve '@/app/components/admin/ImageGallery'
```

### 🔍 問題原因
- 13 個 API 路由和組件文件使用了錯誤的導入路徑
- 使用 `@/app/lib/*` 而非 `@/lib/*`
- 使用 `@/app/components/*` 而非 `@/components/*`
- 不符合 `tsconfig.json` 中定義的路徑別名

### ✅ 解決方案
批量修正所有導入路徑：

```typescript
// 修改前（錯誤）
import { supabaseAdmin } from '@/app/lib/supabase';
import { Project } from '@/app/types';
import ImageUploader from '@/app/components/admin/ImageUploader';

// 修改後（正確）
import { supabaseAdmin } from '@/lib/supabase';
import { Project } from '@/types';
import ImageUploader from '@/components/admin/ImageUploader';
```

**影響文件**：13 個文件
- `app/api/admin/diagnose/route.ts`
- `app/api/admin/import-data/route.ts`
- `app/api/images/check-references/route.ts`
- `app/api/images/delete/route.ts`
- `app/api/images/rename/route.ts`
- `app/api/images/route.ts`
- `app/api/projects/[id]/route.ts`
- `app/api/projects/reorder/route.ts`
- `app/api/projects/route.ts`
- `app/api/settings/reset-ui/route.ts`
- `app/api/settings/ui-display/route.ts`
- `app/admin/images/page.tsx`
- `app/lib/supabase.ts`（Storage URL 函式）

---

## 🔴 錯誤 2：環境變數處理邏輯過於嚴格

### ❌ 錯誤訊息
```typescript
⨯ Error: Missing Supabase environment variables
   at eval (app/lib/supabase.ts:20:10)
```

### 🔍 問題原因
- 初始修改的環境變數檢查邏輯只在構建時寬容
- 開發環境仍會拋出錯誤，導致無法啟動
- `.env.local` 文件未創建或環境變數未及時載入

### ✅ 解決方案

**1. 改善環境變數檢查邏輯**

```typescript
// app/lib/supabase.ts

// 修改前（過於嚴格）
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.VERCEL;

if (!supabaseUrl || !supabaseAnonKey) {
  if (isBuildTime) {
    console.warn('⚠️  Using dummy values');
  } else {
    throw new Error('Missing...'); // ❌ 開發環境也拋錯
  }
}

// 修改後（更寬容）
const isDevelopment = process.env.NODE_ENV === 'development';
const isVercel = !!process.env.VERCEL;
const isBuildTime = process.env.NODE_ENV === 'production' && !isVercel;

if (!supabaseUrl || !supabaseAnonKey) {
  // 開發環境或本地構建：警告但允許繼續
  if (isDevelopment || isBuildTime) {
    console.warn('⚠️  Supabase environment variables not found. Using placeholder values.');
    if (isDevelopment) {
      console.warn('📝 請確認 .env.local 文件包含：');
      console.warn('   - NEXT_PUBLIC_SUPABASE_URL');
      console.warn('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
      console.warn('   - SUPABASE_SERVICE_ROLE_KEY');
    }
  } else {
    // 只在 Vercel 生產環境嚴格要求
    throw new Error('Missing Supabase environment variables');
  }
}
```

**2. 創建 `.env.local` 文件**

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://cfsseikonkwfwkhsiavm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 管理員密碼
ADMIN_PASSWORD=your-secure-admin-password
```

---

## 🔴 錯誤 3：Storage Bucket 名稱不匹配

### ❌ 錯誤訊息
```
Bucket not found
```

### 🔍 問題原因
- 代碼中使用的 bucket 名稱：`screenshots`
- Supabase 中實際創建的 bucket：`project-images`
- 名稱不一致導致無法上傳圖片

### ✅ 解決方案

**修改代碼中的 bucket 名稱**

```typescript
// app/lib/storage.ts
// 修改前
const BUCKET_NAME = 'screenshots';

// 修改後
const BUCKET_NAME = 'project-images';
```

```typescript
// app/lib/supabase.ts
// 修改前
export function getStoragePublicUrl(path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/screenshots/${path}`;
}

// 修改後
export function getStoragePublicUrl(path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/project-images/${path}`;
}
```

**備註**：Supabase Storage Bucket 配置
- Bucket 名稱：`project-images`
- 類型：Public（允許公開讀取）
- 政策已設置：
  - Public Access (SELECT)
  - Admin Upload (INSERT)
  - Admin Update (UPDATE)
  - Admin Delete (DELETE)

---

## 📋 問題總結與經驗

### 🎯 關鍵經驗

1. **路徑別名要統一**
   - 檢查 `tsconfig.json` 中的路徑配置
   - 所有導入必須使用相同的別名規則
   - 使用 grep 全域搜尋確認無遺漏

2. **環境變數處理要分環境**
   - 開發環境：寬容處理，使用佔位符
   - 本地構建：寬容處理，便於測試
   - 生產環境：嚴格驗證，確保安全

3. **配置命名要對應**
   - 代碼中的配置名稱必須與實際服務配置一致
   - Storage bucket、資料表名稱等都要檢查
   - 使用常數集中管理配置名稱

### ✅ 最終狀態

**本地開發環境**
```
✓ Ready in 2.8s
- Environments: .env.local
✓ 開發服務器正常運行
```

**構建測試**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (14/14)
✓ Finalizing page optimization
```

**功能驗證**
- ✅ 專案資料讀取正常
- ✅ 圖片上傳功能正常
- ✅ 管理後台運作正常
- ✅ Supabase Storage 連接成功

---

## 🚀 部署建議

### Vercel 環境變數檢查清單

部署前確認以下環境變數已在 Vercel 設置：

```
✓ NEXT_PUBLIC_SUPABASE_URL
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
✓ SUPABASE_SERVICE_ROLE_KEY
✓ ADMIN_PASSWORD
```

### 部署後驗證步驟

1. ✅ 檢查構建日誌（無錯誤）
2. ✅ 訪問首頁（專案列表正常）
3. ✅ 登入管理後台（驗證 API 連接）
4. ✅ 測試圖片上傳（Storage 功能）
5. ✅ 檢查 Supabase 日誌（無異常）

---

## 📝 相關文件

- [00_遷移總覽與流程清單.md](./00_遷移總覽與流程清單.md)
- [01_創建Supabase專案.md](./01_創建Supabase專案.md)
- [02_手動建立Storage.md](./02_手動建立Storage.md)
- [04_程式碼改造指南.md](./04_程式碼改造指南.md)

---

**文件維護**：記錄實際遇到的問題，便於未來參考和排查類似錯誤。

