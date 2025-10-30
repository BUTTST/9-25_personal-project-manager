-- =====================================================
-- 圖片元數據表：存儲中文檔名映射
-- =====================================================
-- 創建日期：2025-10-30
-- 用途：解決 Supabase Storage metadata 無法通過 list() 讀取的問題
-- 
-- 此表維護存儲檔名（ASCII）與顯示檔名（中文）的映射關係

-- 創建 image_metadata 表
CREATE TABLE IF NOT EXISTS public.image_metadata (
  -- 存儲檔名（主鍵，與 Storage 中的實際檔名一致）
  stored_filename TEXT PRIMARY KEY,
  
  -- 原始檔名（用戶看到的顯示名稱，可包含中文）
  original_filename TEXT NOT NULL,
  
  -- 檔案大小（bytes）
  file_size BIGINT DEFAULT 0,
  
  -- MIME 類型
  content_type TEXT,
  
  -- 檔案 hash（用於防止重複上傳）
  file_hash TEXT,
  
  -- 創建時間
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 更新時間（當顯示名稱被修改時）
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_image_metadata_original 
  ON public.image_metadata(original_filename);

CREATE INDEX IF NOT EXISTS idx_image_metadata_created 
  ON public.image_metadata(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_image_metadata_hash 
  ON public.image_metadata(file_hash) 
  WHERE file_hash IS NOT NULL;

-- 自動更新 updated_at 觸發器
CREATE OR REPLACE FUNCTION update_image_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_image_metadata_updated_at
  BEFORE UPDATE ON public.image_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_image_metadata_updated_at();

-- Row Level Security (RLS) 政策
ALTER TABLE public.image_metadata ENABLE ROW LEVEL SECURITY;

-- 允許所有人讀取（用於前端顯示）
CREATE POLICY "Allow public read access" 
  ON public.image_metadata 
  FOR SELECT 
  USING (true);

-- 只允許 service_role 進行寫入操作（透過後端 API）
-- 注意：這個政策在使用 supabaseAdmin (service_role) 時會被繞過

-- 添加註釋
COMMENT ON TABLE public.image_metadata IS '圖片元數據表：存儲存儲檔名與顯示檔名的映射關係，支援中文檔名';
COMMENT ON COLUMN public.image_metadata.stored_filename IS '實際存儲在 Supabase Storage 中的檔名（ASCII）';
COMMENT ON COLUMN public.image_metadata.original_filename IS '用戶看到的顯示檔名（可包含中文）';
COMMENT ON COLUMN public.image_metadata.file_hash IS '檔案 hash，用於識別重複上傳的圖片';

