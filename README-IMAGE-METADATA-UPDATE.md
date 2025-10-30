# 🎯 圖片中文檔名支援更新 - 快速指南

> ⚠️ **重要更新**：本次更新需要在 Supabase 創建新的資料表並執行數據遷移腳本

## 📦 更新內容

新增 `image_metadata` 資料庫表，徹底解決圖片中文檔名支援問題。

### 核心改進

- ✅ 上傳時完整保存中文檔名
- ✅ 編輯時支援修改為中文檔名  
- ✅ 所有地方（圖片庫、新增專案、編輯專案）都正確顯示中文檔名
- ✅ 效能更好（從資料庫讀取，不需要逐個檔案獲取 metadata）

## 🚀 部署步驟（必須執行）

### 1️⃣ 創建資料表

在 [Supabase Dashboard](https://app.supabase.com/) 執行：

```bash
# 檔案位置：supabase/migrations/001_create_image_metadata.sql
```

進入 SQL Editor，複製貼上該檔案內容並執行。

### 2️⃣ 遷移現有圖片數據

```bash
# 確保環境變數正確（.env.local）
node scripts/migrate-image-metadata.js
```

這會將現有圖片的資訊遷移到新表，**如果您已有上傳的圖片，必須執行此步驟**。

### 3️⃣ 部署代碼

```bash
git add .
git commit -m "feat: 使用資料庫表實現圖片中文檔名完整支援"
git push
```

Vercel 會自動部署。

## ✅ 驗證方法

1. 進入「管理後台」→「圖片管理」
2. 上傳一張含中文檔名的圖片（例如：`測試圖片.png`）
3. 確認顯示為「測試圖片.png」（而非 ASCII 檔名）
4. 進入「新增專案」→「選擇圖片」
5. 確認看到中文檔名 ✨

## 📊 技術細節

### 新增檔案

- `supabase/migrations/001_create_image_metadata.sql` - 資料表創建 SQL
- `scripts/migrate-image-metadata.js` - 數據遷移腳本
- `docs/開發者內容/圖片中文檔名支援-部署指南.md` - 詳細部署指南

### 修改檔案

- `app/lib/storage.ts` - 所有圖片操作函數（上傳、列表、編輯、刪除）

### 資料庫表結構

```sql
CREATE TABLE image_metadata (
  stored_filename TEXT PRIMARY KEY,      -- 存儲檔名（ASCII）
  original_filename TEXT NOT NULL,       -- 顯示檔名（中文）
  file_size BIGINT DEFAULT 0,
  content_type TEXT,
  file_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔄 數據流程圖

```
上傳「螢幕擷取畫面.png」
  ↓
Storage: 2025-10-30-103634-ggn7y0.png
  ↓
Database: { 
  stored_filename: "2025-10-30-103634-ggn7y0.png",
  original_filename: "螢幕擷取畫面.png" 
}
  ↓
顯示: 螢幕擷取畫面.png ✨
```

## 📚 詳細文件

- [完整部署指南](./docs/開發者內容/圖片中文檔名支援-部署指南.md)
- [實現說明](./docs/開發者內容/圖片中文檔名支援實現說明.md)

## 🆘 遇到問題？

### 顯示仍是 ASCII 檔名

1. 確認資料表已創建
2. 執行遷移腳本
3. 清除瀏覽器緩存

### 遷移腳本失敗

1. 檢查 `.env.local` 環境變數
2. 確認資料表已創建
3. 檢查 Supabase 連線

---

**更新日期**: 2025-10-30  
**版本**: v2.0  
**作者**: AI Assistant

