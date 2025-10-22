export interface GalleryImage {
  id: string;
  title: string;
  description?: string;
  src: string;
  thumbnail?: string;
}

/**
 * ⚠️ 此文件由 scripts/generate-image-gallery.js 自動生成
 * 
 * 自動生成時間：2025/10/22 上午10:36:32
 * 圖片來源目錄：public/前端截圖/
 * 圖片數量：12
 * 
 * 🚀 如何新增圖片：
 * 1. 將圖片放入 public/前端截圖/ 目錄
 * 2. 執行 npm run generate-gallery 或 npm run dev
 * 3. 此文件會自動更新
 * 
 * 📝 圖片命名建議：
 * - 使用描述性名稱（標題會從文件名提取）
 * - 可包含日期前綴（例如：10-15-專案名稱.png）
 * - 避免使用特殊字符
 * 
 * ⚠️ 請勿手動編輯此文件！
 * 如需修改生成邏輯，請編輯 scripts/generate-image-gallery.js
 */

export const imageGallery: GalleryImage[] = [
  {
    id: '9-28_latex-keyboard_mathlive-證明樹',
    title: 'latex-keyboard mathlive（證明樹）)',
    src: '/前端截圖/9-28_latex-keyboard_mathlive(證明樹)).png',
  },
  {
    id: '9-28_latex-keyboard_mathlive-矩陣',
    title: 'latex-keyboard mathlive（矩陣）',
    src: '/前端截圖/9-28_latex-keyboard_mathlive(矩陣).png',
  },
  {
    id: '9-24-icon-auto-creator-github-倉庫標題與敘述',
    title: 'icon-auto-creator（GitHub 倉庫標題與敘述）',
    src: '/前端截圖/9-24-icon-auto-creator(GitHub 倉庫標題與敘述).png',
  },
  {
    id: '9-24-icon-auto-creator-選擇圖標尺寸預設',
    title: 'icon-auto-creator（選擇圖標尺寸預設）',
    src: '/前端截圖/9-24-icon-auto-creator(選擇圖標尺寸預設).png',
  },
  {
    id: '9-21-臉書貼文排版格式化工具',
    title: '臉書貼文排版格式化工具',
    src: '/前端截圖/9-21-臉書貼文排版格式化工具.png',
  },
  {
    id: '8-14-whisper-語音轉譯服務-總結',
    title: 'Whisper 語音轉譯服務（總結）',
    src: '/前端截圖/8-14-Whisper 語音轉譯服務(總結).png',
  },
  {
    id: '8-14-whisper-語音轉譯服務-輸出',
    title: 'Whisper 語音轉譯服務（輸出）',
    src: '/前端截圖/8-14-Whisper 語音轉譯服務(輸出).png',
  },
  {
    id: '7-24-paddle-金流系統建置',
    title: '7-24 （Paddle 金流系統建置）',
    src: '/前端截圖/7-24 (Paddle 金流系統建置).png',
  },
  {
    id: '5-25-現金管理計算工具-中',
    title: '5-25 現金管理計算工具（中）',
    src: '/前端截圖/5-25 現金管理計算工具(中).png',
  },
  {
    id: '5-25-現金管理計算工具-下',
    title: '5-25 現金管理計算工具（下）',
    src: '/前端截圖/5-25 現金管理計算工具(下).png',
  },
  {
    id: '5-25-現金管理計算工具-上',
    title: '5-25 現金管理計算工具（上）',
    src: '/前端截圖/5-25 現金管理計算工具(上).png',
  },
  {
    id: '10-15-youtube-info-extractor-tool-縮圖',
    title: 'youtube-info-extractor-tool （縮圖）',
    src: '/前端截圖/10-15-youtube-info-extractor-tool (縮圖).png',
  }
];

export function getGalleryImageById(id: string) {
  return imageGallery.find((image) => image.id === id) || null;
}
