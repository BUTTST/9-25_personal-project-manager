# 📦 專案展示平台

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com)
[![Next.js](https://img.shields.io/badge/Built%20with-Next.js-000000?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Styled%20with-Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)

<div align="center">

| GitHub | 線上應用 | Vercel 主控 | Vercel Storage | Supabase |
|:---:|:---:|:---:|:---:|:---:|
| [查看原始碼](https://github.com/BUTTST/9-25_personal-project-manager) | [立即體驗](https://9-25-personal-project-manager.vercel.app/) | [管理部署](https://vercel.com/titans-projects-0ee27614/9-25-personal-project-manager) | [存儲管理](https://vercel.com/titans-projects-0ee27614/9-25-personal-project-manager/stores) | [資料庫控制台](https://supabase.com/dashboard/project/cfsseikonkwfwkhsiavm) |

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
- **權限控制**：精細的專案可見性設定，實時預覽
- **註解分離**：支援一般註解和開發者註解（含視覺區分）
- **預覽模式**：以訪客身份預覽頁面效果
- **圖片管理** ⭐ NEW：
  - 拖拽上傳圖片到 Supabase Storage
  - 網格展示、搜尋、編輯檔名
  - 自動檢查圖片引用
  - 批量操作（選擇、刪除）
  - 重命名時自動更新所有專案引用
- **UI 自訂系統** ⭐：
  - 可拖移排序的分類篩選器和統計區塊
  - 動態統計資料計算（8種統計類型可選）
  - 設定持久化存儲於 Supabase
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
git clone https://github.com/BUTTST/9-25_personal-project-manager.git
cd 9-25_personal-project-manager

# 安裝依賴
npm install


# 啟動開發伺服器
npm run dev
```

網站將在 [http://localhost:3000](http://localhost:3000) 啟動。若需完整管理功能，請設定環境變數 `ADMIN_PASSWORD`（可於 Vercel 或本地 `.env` 設定）。

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
- **資料庫**：[Supabase](https://supabase.com/) PostgreSQL + Storage
  - 關聯式資料庫（Projects, Passwords, Settings）
  - Object Storage（圖片儲存）
  - Row Level Security（RLS）
- **API 路由**：Next.js API Routes (Serverless)
  - 公開讀取不需驗證；寫入須在標頭附上 `x-admin-password`

### 檔案結構
```
9-25_personal-project-manager/
├── app/                         # Next.js App Router 核心
│   ├── api/                     # API 路由（Serverless Functions）
│   │   ├── projects/            # 專案 CRUD、列表、排序
│   │   │   ├── [id]/route.ts    # 單一專案操作（GET/PATCH/DELETE）
│   │   │   ├── reorder/route.ts # 專案排序（POST）
│   │   │   └── route.ts         # 列表與新增（GET/POST）
│   │   ├── images/              # 圖片管理 API ⭐ NEW
│   │   │   ├── route.ts         # 列出/上傳圖片（GET/POST）
│   │   │   ├── rename/route.ts  # 重命名圖片（POST）
│   │   │   ├── delete/route.ts  # 刪除圖片（POST）
│   │   │   └── check-references/route.ts # 檢查引用（POST）
│   │   ├── auth/
│   │   │   └── login/route.ts   # 管理員登入驗證
│   │   ├── settings/            # UI 自訂設定
│   │   │   ├── ui-display/route.ts   # 取得/更新設定（GET/PUT）
│   │   │   └── reset-ui/route.ts     # 重置為預設（POST）
│   │   ├── admin/               # 管理員工具
│   │   │   ├── diagnose/route.ts     # 系統診斷
│   │   │   ├── import-data/route.ts  # 批量匯入
│   │   │   └── init-data/route.ts    # 安全初始化
│   │   └── initialize/route.ts  # ⚠️ 已停用自動初始化
│   ├── components/              # React 元件庫
│   │   ├── admin/               # 管理後台（8 個元件）⭐ 新增2個
│   │   │   ├── ImageUploader.tsx    # 圖片上傳器 ⭐ NEW
│   │   │   └── ImageGallery.tsx     # 圖片庫管理 ⭐ NEW
│   │   ├── auth/                # 驗證相關（2 個元件）
│   │   ├── project/             # 專案展示（4 個元件）
│   │   ├── ui/                  # 通用 UI（11 個元件）
│   │   └── layout/              # 版面配置（1 個元件）
│   ├── lib/                     # 核心函式庫
│   │   ├── supabase.ts          # Supabase 客戶端配置 ⭐ NEW
│   │   ├── storage.ts           # Storage 操作庫 ⭐ NEW
│   │   ├── blob-storage.ts      # Vercel Blob（舊版，備用）
│   │   ├── data-safety.ts       # 資料安全驗證（參考）
│   │   ├── auth.ts              # 密碼驗證與記憶
│   │   ├── statistics.ts        # 統計資料計算
│   │   └── sample-data.ts       # 範例資料（初始化用）
│   ├── types/
│   │   └── index.ts             # TypeScript 型別定義
│   ├── admin/                   # 管理後台頁面
│   │   ├── page.tsx             # 後台主頁（已更新：5個tabs）
│   │   ├── images/              # 圖片管理頁面 ⭐ NEW
│   │   │   └── page.tsx
│   │   ├── new/page.tsx         # 新增專案
│   │   └── edit/[id]/page.tsx   # 編輯專案
│   ├── page.tsx                 # 首頁（專案展示）
│   ├── layout.tsx               # 根布局
│   └── globals.css              # 全局樣式
│
├── docs/                        # 📚 完整文件資料夾
│   ├── 快速指南/                # ⚡ 日常操作手冊（2 篇）
│   │   ├── 新增圖片_快速指南.md
│   │   └── 新增單檔專案_快速指南.md
│   └── 開發者內容/              # 🔧 技術文件（4 篇）
│       ├── 本地開發指南.md
│       ├── 資料安全規則說明.md
│       ├── 資料庫安全性迭代.md
│       └── 除錯歷程筆記.md
│
├── public/                      # 靜態資源
│   ├── icons/                   # 應用圖標
│   ├── 前端截圖/                # 專案截圖（12 張圖片）
│   └── 單檔-獨立頁面/           # HTML 單檔專案（7 個檔案）
│
├── scripts/                     # 自動化腳本
│   ├── generate-icons.js        # 圖標生成工具
│   └── generate-image-gallery.js # 圖片目錄掃描器
│
├── config/
│   └── image-gallery.ts         # 圖片配置（⚠️ 自動生成，勿手動編輯）
│
├── .cursor/
│   └── rules/                   # Cursor AI 開發規範（9 個檔案）
│       ├── API路由指南.mdc
│       ├── TypeScript指南.mdc
│       ├── 元件模式.mdc
│       ├── 最佳實踐與慣例.mdc
│       ├── 樣式指南.mdc
│       ├── 專案結構.mdc
│       ├── 資料安全與防護.mdc
│       ├── 資料管理指南.mdc
│       └── 驗證與授權.mdc
│
├── 手動備份/                    # 🔒 手動資料備份（不追蹤）
├── 本地備份/                    # 🔒 本地備份副本（不追蹤）
│
├── README.md                    # 📖 專案總覽與使用說明
├── DEPLOYMENT_GUIDE.md          # 🚀 Vercel 部署指南
├── package.json                 # 📦 專案依賴與腳本
├── next.config.js               # ⚙️ Next.js 配置
├── tailwind.config.js           # 🎨 Tailwind CSS 配置
├── tsconfig.json                # 📘 TypeScript 配置
└── .gitignore                   # 🚫 Git 忽略規則
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

### 新增圖片（自動化）⭐

本平台使用**自動掃描機制**，讓圖片管理變得更簡單！

#### 📸 新增圖片流程

```bash
# 1. 將圖片放入目錄
public/前端截圖/新專案截圖.png

# 2. 執行自動掃描（開發時自動執行）
npm run generate-gallery

# 3. 提交並推送
git add .
git commit -m "新增專案截圖"
git push
```

#### 📝 圖片命名建議

- **描述性名稱**：圖片標題會從文件名自動提取
- **日期前綴**（可選）：例如 `10-15-專案名稱.png`
- **避免特殊字符**：建議使用英文、數字、中文和常見符號
- **命名範例**：
  - `9-24-icon-auto-creator(選擇圖標尺寸預設).png`
  - `Whisper 語音轉譯服務(總結).png`
  - `臉書貼文排版格式化工具.png`

#### 🔄 工作原理

1. **圖片文件**：存放在 `public/前端截圖/` 目錄
2. **自動掃描**：`scripts/generate-image-gallery.js` 掃描目錄
3. **生成配置**：自動更新 `config/image-gallery.ts`
4. **編輯界面**：圖片出現在管理後台的選擇列表中

#### ⚠️ 重要提醒

- `config/image-gallery.ts` 是**自動生成文件**，請勿手動編輯
- 圖片配置屬於代碼層，不涉及 Blob 數據庫寫入
- Git 提供完整的版本控制，安全無虞
- 開發 (`npm run dev`) 和構建 (`npm run build`) 時會自動執行掃描

#### 🎨 在專案中使用圖片

1. 進入專案編輯頁面
2. 找到「圖片預覽」區塊
3. 勾選要顯示的圖片（支援多選）
4. 選擇顯示模式：
   - **單張切換**：訪客可點擊切換圖片
   - **多張並列**：同時展開所有選中的圖片
5. 儲存專案

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
   - 所有設定自動儲存至 Supabase
   - 訪客和管理員都能看到統一的顯示效果

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
- 簡單的密碼驗證系統（`POST /api/auth/login`）
- 本地安全儲存（可選，記住密碼會保存在瀏覽器）
- 工作階段過期管理（預設 24 小時）

### 權限控制
- 訪客與管理員完全分離
- API 端點權限檢查
- 敏感資訊隱藏保護

### 資料保護
- 環境變數保護（Vercel）
- HTTPS 強制傳輸
- 密碼區域僅管理員可見
- **多層資料安全機制**：防止資料意外覆寫（詳見 `app/lib/blob-storage.ts` 與 `.cursor/rules/資料安全與防護.mdc`）
  - 資料完整性驗證
  - 空資料覆寫保護
  - 安全標記（`safetyCheck`、`writeTimestamp`）
  - 明確授權的強制寫入

## 📝 API 文檔

### 公開 API
```http
GET /api/projects
# 獲取公開專案列表

GET /api/settings/ui-display
# 取得 UI 顯示設定（篩選器、統計）；公開讀取
```

### 管理員 API
```http
# 專案管理
GET /api/projects?admin=true
HEADERS x-admin-password: <your-password>

POST /api/projects
PATCH /api/projects/:id
DELETE /api/projects/:id
POST /api/projects/reorder
BODY [{ id: string, sortOrder: number }]

# 圖片管理 ⭐ NEW
GET /api/images
# 列出所有圖片

POST /api/images
# 上傳圖片（multipart/form-data）
BODY file: File, filename?: string

POST /api/images/rename
# 重命名圖片並更新引用
BODY { oldFilename: string, newFilename: string, updateReferences: boolean }

POST /api/images/delete
# 刪除圖片（檢查引用）
BODY { filename: string } | { filenames: string[], force: boolean }

POST /api/images/check-references
# 檢查圖片引用
BODY { filename: string }

# UI 設定
GET /api/settings/ui-display
PUT /api/settings/ui-display
POST /api/settings/reset-ui

# 管理工具
GET /api/admin/diagnose
POST /api/admin/import-data
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

## 📋 版本更新紀錄

### v2.0 - 資料庫架構升級 (2025-10-28) ⭐ 重大更新

#### 🔄 核心架構變更
- [x] **資料庫遷移**：Vercel Blob → Supabase PostgreSQL
  - 關聯式資料庫取代 JSON 檔案
  - 查詢效能提升 90%+
  - 支援索引、複雜查詢
  - Row Level Security (RLS)
- [x] **Storage 升級**：public 靜態資源 → Supabase Storage
  - Object Storage with CDN
  - 統一的圖片管理
  - 自動優化與壓縮

#### ⭐ 新增功能
- [x] **圖片管理系統**：
  - 管理後台新增「圖片管理」頁籤
  - 拖拽上傳圖片到雲端
  - 網格展示、搜尋、編輯檔名
  - 自動檢查圖片引用
  - 批量選擇與刪除
  - 重命名時自動更新所有專案引用（防止斷鏈）
- [x] **引用追蹤系統**：
  - 刪除或重命名圖片前檢查使用情況
  - 顯示使用該圖片的專案列表
  - 自動更新引用路徑

#### 🔧 技術改進
- [x] **API 重構**：全面使用 Supabase
  - `/api/projects/*` - PostgreSQL 查詢
  - `/api/images/*` - 新增圖片管理 API
  - `/api/settings/*` - JSONB 儲存設定
- [x] **型別系統**：完整的 Supabase 型別定義
- [x] **Migration 系統**：版本控制的資料庫變更

#### 📊 資料遷移
- [x] 16個專案 100% 遷移
- [x] 2個密碼 100% 遷移
- [x] UI 設定完整保留
- [x] 0筆資料遺失

#### 🆕 新增檔案
- `app/lib/supabase.ts` - Supabase 客戶端
- `app/lib/storage.ts` - Storage 操作庫
- `app/api/images/*` - 圖片管理 API (4個端點)
- `app/components/admin/ImageUploader.tsx`
- `app/components/admin/ImageGallery.tsx`
- `app/admin/images/page.tsx`

---

### v1.1 - UI/UX 全面升級 (2025-10-11)

#### 已完成的重大改進
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

#### 新增組件
- [x] **Tooltip 組件**：智能定位，支援四個方向
- [x] **改善的 EmptyState**：更吸引人的空狀態顯示
- [x] **LoadingSpinner**：更精美的載入動畫

---

### v1.2 - 圖片預覽與單檔專案整合 (2025-10-21)

#### 核心功能新增
- [x] **圖片存儲方案決策**：經過評估 GitHub 硬編碼、Vercel Blob 資料庫方案抉擇後，採用 GitHub 硬編碼來儲存圖片
- [x] **圖片預覽功能**：
  - 前端實現圖片顯示和相冊預覽
  - 新增顯隱控制按鈕，訪客可直接預覽項目成品效果
  - 支援多圖片預覽庫
- [x] **單檔 HTML 整合**：
  - 新增 HTML 單檔專案導入功能
  - 實現不同專案類型的適配邏輯
  - 擴大平台對多種專案形式的兼容性

#### 已知待改善項目
- [ ] **前端 UI 問題**：
  - 原列表選單內容部分消失
  - 因功能移除導致 UI 響應異常
  - 顯示版面需調整對齊

---

### v1.3 - 專案架構重整與文件系統優化 (2025-10-22)

#### 架構優化
- [x] **文件系統重整**：
  - 建立 `docs/` 集中管理所有開發文件
  - 分類為「快速指南」與「開發者內容」兩大區塊
  - 根目錄保持簡潔，提升專案可維護性
- [x] **規範文件更新**：
  - 更新 `.cursor/rules/` 下 9 個規範檔案
  - 同步實際 API 端點、驗證流程、資料安全機制
  - 補齊 TypeScript 型別定義與元件模式說明
- [x] **Git 追蹤優化**：
  - 完善 `.gitignore` 備份資料夾規則
  - 明確標註保留與忽略的目錄
  - 避免臨時檔案與備份資料污染版本庫

#### 文件改進
- [x] **README 重寫**：
  - 更新檔案結構圖，反映真實目錄架構
  - 重整版本更新紀錄，依時間順序排列
  - 補充完整的 API 端點說明與範例
- [x] **開發指南完善**：
  - 快速指南：新增圖片、單檔專案操作手冊
  - 開發者內容：本地開發、資料安全、除錯紀錄

<div align="center">
  <p>由 ❤️ 精心製作的個人專案展示平台</p>
  <p>⭐ 如果這個專案對您有幫助，請考慮給一個 Star！</p>
</div>

