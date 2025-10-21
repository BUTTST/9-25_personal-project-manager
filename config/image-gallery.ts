export interface GalleryImage {
  id: string;
  title: string;
  description?: string;
  src: string;
  thumbnail?: string;
}

export const imageGallery: GalleryImage[] = [
  {
    id: '9-21-facebook-post-formatter',
    title: '臉書貼文排版格式化工具',
    src: '/前端截圖/9-21-臉書貼文排版格式化工具.png',
  },
  {
    id: '7-24-paddle-payment',
    title: 'Paddle 金流系統建置',
    src: '/前端截圖/7-24 (Paddle 金流系統建置).png',
  },
  {
    id: '5-25-cash-management-top',
    title: '現金管理計算工具（上）',
    src: '/前端截圖/5-25 現金管理計算工具(上).png',
  },
  {
    id: '5-25-cash-management-middle',
    title: '現金管理計算工具（中）',
    src: '/前端截圖/5-25 現金管理計算工具(中).png',
  },
  {
    id: '5-25-cash-management-bottom',
    title: '現金管理計算工具（下）',
    src: '/前端截圖/5-25 現金管理計算工具(下).png',
  },
  {
    id: '8-14-whisper-summary',
    title: 'Whisper 語音轉譯服務（總結）',
    src: '/前端截圖/8-14-Whisper 語音轉譯服務(總結).png',
  },
  {
    id: '8-14-whisper-output',
    title: 'Whisper 語音轉譯服務（輸出）',
    src: '/前端截圖/8-14-Whisper 語音轉譯服務(輸出).png',
  },
  {
    id: '9-28-mathlive-matrix',
    title: 'LaTeX Keyboard Mathlive（矩陣）',
    src: '/前端截圖/9-28_latex-keyboard_mathlive(矩陣).png',
  },
  {
    id: '9-28-mathlive-proof-tree',
    title: 'LaTeX Keyboard Mathlive（證明樹）',
    src: '/前端截圖/9-28_latex-keyboard_mathlive(證明樹)).png',
  },
  {
    id: '10-15-youtube-extractor',
    title: 'Youtube Info Extractor Tool',
    src: '/前端截圖/10-15-youtube-info-extractor-tool (縮圖).png',
  },
  {
    id: '9-24-icon-auto-sizes',
    title: 'Icon Auto Creator（尺寸預設）',
    src: '/前端截圖/9-24-icon-auto-creator(選擇圖標尺寸預設).png',
  },
  {
    id: '9-24-icon-auto-github',
    title: 'Icon Auto Creator（GitHub 倉庫標題與敘述）',
    src: '/前端截圖/9-24-icon-auto-creator(GitHub 倉庫標題與敘述).png',
  },
];

export function getGalleryImageById(id: string) {
  return imageGallery.find((image) => image.id === id) || null;
}
