# 📦 專案展示平台

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com)
[![Next.js](https://img.shields.io/badge/Built%20with-Next.js-000000?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Styled%20with-Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)

<div align="center">

| 線上應用 |  Vercel 主控 |  GitHub |
|:---:|:---:|:---:|
| [立即體驗](https://9-25-personal-project-manager.vercel.app/) | [管理部署](https://vercel.com/titans-projects-0ee27614/9-25-personal-project-manager) | [查看原始碼](https://github.com/BUTTST/9-25_personal-project-manager) |

</div>

---

> 個人的專案管理和展示平台，支援訪客瀏覽和管理員線上編輯。



## ✨ 特色功能

### 🌍 訪客功能
- **專案展示**：現代化卡片式介面，視覺層次清晰
- **智能搜尋**：即時搜尋，支援按名稱、說明、標籤搜尋
- **視覺化分類篩選**：直觀的 tag 按鈕組，帶圖標和動畫
- **動態統計區塊**：即時顯示專案統計資訊（2-8個項目，2列橫向擴展布局）
- **響應式設計**：完美適配桌面和行動裝置
- **深色/淺色模式**：自動切換主題支援

### 🔧 管理員功能
- **線上編輯**：直接在網頁上新增、編輯、刪除專案
- **密碼管理**：安全儲存和管理平台帳號密碼
- **權限控制**：精細的專案可見性設定，實時預覽
- **註解分離**：支援一般註解和開發者註解（含視覺區分）
- **預覽模式**：以訪客身份預覽頁面效果
- **UI 自訂系統** ⭐ NEW：
  - 可拖移排序的分類篩選器和統計區塊
  - 動態統計資料計算（8種統計類型可選）
  - 設定持久化存儲於 Vercel Blob
  - 自訂面板尺寸調整工具
  - 訪客可見管理員設定後的顯示效果
- **一鍵部署**：支援 Vercel 一鍵部署

### 🎨 設計特色
- **現代化 UI**：漸變、陰影、動畫等現代設計元素
- **區塊化設計**：每個內容區域都有明確的視覺邊界
- **網址智能顯示**：長網址自動省略，Tooltip 顯示完整內容
- **豐富動畫**：淡入、滑動、縮放等過渡動畫
- **視覺反饋**：Hover、Focus 狀態都有清晰的視覺反饋

### 🔐 安全特性
- **密碼記憶**：本地安全儲存管理員密碼
- **身份驗證**：簡單而安全的密碼驗證
- **權限分離**：訪客與管理員完全分離

## 📱 截圖預覽

### 訪客模式
*簡潔優雅的專案展示介面*

### 管理員後台
*功能完善的專案管理系統*

## 🚀 快速開始

### 前置要求
- Node.js 18+
- npm 或 yarn
- Vercel 帳號（用於部署）

### 本地開發

```bash
# 複製專案
git clone <your-repo-url>
cd project-showcase-platform

# 安裝依賴
npm install

# 生成專案圖標
npm run generate-icons

# 啟動開發伺服器
npm run dev
```

網站將在 [http://localhost:3000](http://localhost:3000) 啟動。

### 線上部署

請參閱 [**部署指南**](./DEPLOYMENT_GUIDE.md) 獲取詳細的部署說明。

## 📚 技術架構

### 核心技術
- **前端框架**：[Next.js 14](https://nextjs.org/) • App Router
- **程式語言**：[TypeScript](https://typescriptlang.org/)
- **樣式系統**：[Tailwind CSS](https://tailwindcss.com/)
- **圖示庫**：[Heroicons](https://heroicons.com/)

### 雲端服務
- **部署平台**：[Vercel](https://vercel.com/)
- **資料儲存**：[Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- **API 路由**：Next.js API Routes (Serverless)

### 檔案結構
```
project-showcase-platform/
├── app/                    # Next.js App Router
│   ├── api/                # API 路由
│   ├── components/         # React 組件
│   ├── lib/                # 工具函數
│   └── types/              # TypeScript 類型定義
├── public/                # 靜態資源
│   └── icons/              # 應用圖標
├── scripts/               # 建置腳本
└── docs/                  # 文檔
```

## 📝 使用指南

### 管理員登入

1. 點擊首頁右上角的「管理員登入」
2. 輸入部署時設定的 `ADMIN_PASSWORD`
3. 勾選「記住密碼」以避免重複輸入

### 新增專案

1. 登入管理員後台
2. 點擊「新增專案」按鈕
3. 填寫專案資訊：
   - **日期和檔名**：專案名稱
   - **說明**：專案簡介
   - **類別**：選擇重要性等級
   - **GitHub/Vercel 連結**：可選
   - **註解**：一般和開發者註解
4. 設定可見性選項
5. 點擊「儲存」

### 管理顯示控制

在管理員後台中，您可以精細控制每個專案的可見性：

- **可見欄位**：日期、說明、類別、連結等
- **註解分離**：一般註解（訪客可見）和開發者註解（僅管理員）
- **全局開關**：控制是否顯示開關控制項

### UI 自訂設定（新功能）⭐

在首頁的篩選器旁，管理員可以看到一個齒輪按鈕，點擊後可以：

1. **自訂分類篩選器**：
   - 啟用/停用任意篩選項目
   - 拖移排序改變顯示順序
   - 訪客將立即看到調整後的效果

2. **自訂統計區塊**：
   - 8種統計類型可選：總專案數、公開專案、顯示中、重要專案、已完成、進行中、準備就緒、已捨棄
   - 最少選擇2個，最多選擇8個統計項目
   - 拖移排序改變顯示順序
   - 採用2列橫向擴展布局，自動適應選擇數量

3. **面板尺寸調整**：
   - 點擊設定面板標題欄的「尺寸設定」按鈕
   - 調整面板寬度（50%-95%）、高度（30vh-90vh）、頂部距離（5%-50%）
   - 即時預覽調整效果

4. **持久化儲存**：
   - 所有設定自動儲存至 Vercel Blob
   - 訪客和管理員都能看到統一的顯示效果

### 密碼管理

在「密碼管理」選項卡中：
1. 點擊「新增密碼」
2. 填寫平台、帳號和密碼
3. 使用隱藏/顯示開關保護敏感資訊

⚠️ **注意：** 密碼區域僅管理員可見，訪客無法存取。

## 🔧 自定義設定

### 体驗設定
- **顯示開關控制項**：選擇是否在專案卡片上顯示開關
- **記住密碼**：控制是否自動記住管理員密碼

### 預設可見性
設定新專案的預設可見性狀態，包括：
- 日期和檔名
- 說明和類別
- 外部連結
- 各種註解類型

## 📊 效能優化

### 已實施優化
- **應用程式快取**：使用 Next.js 內建快取
- **CSS 動畫**：硬件加速的 CSS 過渡和動畫
- **延遲載入**：關鍵組件延遲載入
- **漸進式渲染**：卡片列表使用延遲動畫，改善感知性能

### 效能指標
- **首次內容繪製時間 (FCP)**：< 2s
- **最大內容繪製時間 (LCP)**：< 3s
- **累積布局偏移 (CLS)**：< 0.1
- **流暢動畫**：60fps 流暢動畫體驗

## 🔒 安全特性

### 身份驗證
- 簡單的密碼驗證系統
- 本地安全儲存（可選）
- 工作階段過期管理

### 權限控制
- 訪客與管理員完全分離
- API 端點權限檢查
- 敏感資訊隱藏保護

### 資料保護
- 環境變數加密
- HTTPS 強制傳輸
- 密碼區域完全隱藏

## 📝 API 文檔

### 公開 API
```http
GET /api/projects
# 獲取公開專案列表
```

### 管理員 API
```http
# 獲取所有專案（需要驗證）
GET /api/projects?admin=true
Headers: x-admin-password: <your-password>

# 新增專案
POST /api/projects
Headers: x-admin-password: <your-password>

# 更新專案
PATCH /api/projects/:id
Headers: x-admin-password: <your-password>

# 刪除專案
DELETE /api/projects/:id
Headers: x-admin-password: <your-password>
```

## 🐛 問題回報

如果您遇到問題或有功能建議，請：

1. 檢查 [Issues](https://github.com/your-repo/issues) 是否已有相關問題
2. 建立新的 Issue 並提供詳細資訊：
   - 作業系統和瀏覽器版本
   - 錯誤訊息或截圖
   - 重現步驟

## 📝 許可證

本專案採用 MIT 許可證。詳細資訊請參閱 [LICENSE](./LICENSE) 文件。

## 🎨 UI/UX 介面與使用者體驗 大幅強化 (v1.1)  2025/10/11

### 已完成的重大改進
- [x] **全新視覺設計系統**：現代化的漸變、陰影和動畫效果
- [x] **專案卡片重新設計**：
  - 明確的視覺區塊分隔（標題區、描述區、連結區、註解區）
  - 網址自動省略號和 Tooltip 顯示完整網址
  - 彩色區塊背景和漸變邊框
  - 改善的 hover 動畫和過渡效果
- [x] **智能分類篩選器**：從傳統下拉選單改為視覺化 tag 按鈕組
- [x] **搜尋體驗升級**：動畫效果、焦點狀態視覺反饋
- [x] **統計資訊視覺化**：漸變卡片、圖標和動畫
- [x] **管理後台美化**：
  - 漸變統計卡片設計
  - 現代化 Tab 導航系統
  - 改善的表單設計和可見性控制
- [x] **空狀態優化**：有趣的插圖和動畫效果
- [x] **全局動畫系統**：淡入、滑動、縮放等豐富動畫
- [x] **響應式優化**：更好的手機和平板體驗

### 新增組件
- [x] **Tooltip 組件**：智能定位，支援四個方向
- [x] **改善的 EmptyState**：更吸引人的空狀態顯示
- [x] **LoadingSpinner**：更精美的載入動畫


<div align="center">
  <p>由 ❤️ 精心製作的個人專案展示平台</p>
  <p>⭐ 如果這個專案對您有幫助，請考慮給一個 Star！</p>
</div>

