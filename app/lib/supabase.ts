/**
 * Supabase Client 配置
 * 提供前端和後端的 Supabase 客戶端
 */

import { createClient } from '@supabase/supabase-js';

// 環境變數驗證
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * 前端 Client（使用 anon key）
 * 用於客戶端操作，受 RLS 限制
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 後端 Admin Client（使用 service role key）
 * 用於伺服器端操作，繞過 RLS
 * ⚠️ 僅在 API routes 中使用
 */
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

if (!supabaseAdmin) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not found. Admin operations will be limited.');
}

/**
 * Storage URL 輔助函式
 * 生成 Supabase Storage 的公開 URL
 */
export function getStoragePublicUrl(path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/screenshots/${path}`;
}

/**
 * 型別定義
 */
export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          date_and_file_name: string;
          description: string;
          category: string;
          status: string;
          github: string | null;
          vercel: string | null;
          deployment: string | null;
          path: string | null;
          status_note: string | null;
          public_note: string | null;
          developer_note: string | null;
          visibility: Record<string, boolean>;
          image_previews: Array<{
            id: string;
            title: string;
            src: string;
          }>;
          image_preview_mode: string;
          custom_info_sections: Array<any>;
          document_meta: Record<string, any> | null;
          featured: boolean;
          hidden: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
      };
      passwords: {
        Row: {
          id: string;
          platform: string;
          account: string;
          password: string;
          created_at: string;
          updated_at: string;
        };
      };
      settings: {
        Row: {
          key: string;
          value: Record<string, any>;
          updated_at: string;
        };
      };
    };
  };
};

