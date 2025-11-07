# ⚙️ Vercel 部署的項目如何才具備 SEO，如何配置

> ⏱️ 閱讀時間：5 分鐘  
> 🎯 目標：完整的 SEO 配置清單，讓你的網站能被 Google 搜到

---

## ❌ 常見誤解

### 很多人以為...

```
❌ 錯誤觀念：
「我用 Vercel 部署了網站，就自動有 SEO 了」

✅ 事實：
Vercel 只提供「房子」（主機空間）
但 Google 還不知道你的「地址」

你需要：
  1. 告訴 Google 你在哪（提交網站）
  2. 掛上清楚的招牌（Meta Tags）
  3. 提供地圖（Sitemap）
  4. 寫好內容（關鍵字優化）
```

---

## 📋 完整配置清單

### 🎯 核心概念

```
讓網站被 Google 搜到需要 3 個步驟:

步驟 1: 讓 Google「找到」你
  → 提交網站給 Google Search Console
  → 生成 Sitemap.xml

步驟 2: 讓 Google「理解」你
  → 設定 Meta Tags（標題、描述）
  → 設定 Robots.txt
  → 優化圖片和連結

步驟 3: 讓 Google「推薦」你
  → 提供優質內容
  → 獲得反向連結
  → 持續更新
```

---

## 🔴 Priority 1：必做配置（沒有就完全沒 SEO）

### 1️⃣ Meta Tags（每個頁面都要有）

```yaml
是什麼？
  → 網頁的「標題」和「簡介」
  → 出現在 Google 搜尋結果上
  → 影響點擊率

必須設定的 3 個：
  ├─ <title>      # 標題（最重要！）
  ├─ <meta name="description">  # 描述
  └─ <meta name="keywords">     # 關鍵字（可選）
```

#### 📄 Next.js 14 設定方式（App Router）

**位置**：`app/page.tsx`（每個頁面都要設定）

```typescript
// ✅ 正確範例
export const metadata = {
  title: '專案管理工具 | 免費線上協作平台',
  description: '提供免費的專案管理工具，支援團隊協作、任務追蹤、甘特圖，適合新創團隊使用。',
  keywords: ['專案管理', '協作工具', '免費工具', '團隊管理'],
}

// ❌ 錯誤範例
export const metadata = {
  title: '我的網站',  // 太籠統
  description: '',    // 空白
}
```

#### 📐 撰寫規則

```yaml
標題 (title):
  長度: 50-60 個字元
  格式: 主標題 | 副標題 | 品牌名
  範例: 
    ✅ 專案管理工具 | 免費線上協作平台 | MyApp
    ❌ 首頁

描述 (description):
  長度: 150-160 個字元
  內容: 說明這頁面是什麼、能解決什麼問題
  範例:
    ✅ 提供免費的專案管理工具，支援團隊協作、
       任務追蹤、甘特圖，適合新創團隊使用。
    ❌ 這是我的網站

關鍵字 (keywords):
  數量: 5-10 個
  選擇: 和頁面內容相關的詞
  範例: 專案管理、協作工具、免費工具
```

---

### 2️⃣ Sitemap.xml（網站地圖）

```yaml
是什麼？
  → 告訴 Google 你有哪些頁面
  → 像一份「目錄清單」
  → 加速 Google 收錄

格式：
  網址/sitemap.xml
  範例: https://yoursite.com/sitemap.xml
```

#### 📄 Next.js 14 生成方式

**位置**：`app/sitemap.ts`（新增此檔案）

```typescript
// 動態生成 Sitemap
export default async function sitemap() {
  // 1. 靜態頁面
  const routes = ['', '/about', '/contact'].map((route) => ({
    url: `https://yoursite.com${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly',
    priority: 1,
  }))

  // 2. 動態頁面（從資料庫抓）
  const projects = await getProjects() // 從 Supabase 抓專案列表
  const projectRoutes = projects.map((project) => ({
    url: `https://yoursite.com/projects/${project.id}`,
    lastModified: project.updated_at,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...routes, ...projectRoutes]
}
```

#### ✅ 檢查方式

訪問 `https://你的網址/sitemap.xml`，應該看到 XML 格式的頁面列表

---

### 3️⃣ Robots.txt（爬蟲規則）

```yaml
是什麼？
  → 告訴 Google 哪些頁面可以爬、哪些不行
  → 避免敏感頁面被收錄（如管理後台）

格式：
  網址/robots.txt
  範例: https://yoursite.com/robots.txt
```

#### 📄 Next.js 14 生成方式

**位置**：`app/robots.ts`（新增此檔案）

```typescript
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',  // 所有爬蟲
        allow: '/',      // 允許爬首頁
        disallow: [
          '/admin/',     // 禁止爬管理後台
          '/api/',       // 禁止爬 API
        ],
      },
    ],
    sitemap: 'https://yoursite.com/sitemap.xml',  // Sitemap 位置
  }
}
```

---

### 4️⃣ Google Search Console 註冊

```yaml
是什麼？
  → Google 提供的官方工具
  → 手動「告訴」Google 你的網站存在
  → 追蹤搜尋表現

位置：
  https://search.google.com/search-console
```

#### 📝 註冊步驟（詳細版在下一篇）

```
步驟 1: 前往 Google Search Console
步驟 2: 新增資源（輸入你的網址）
步驟 3: 驗證網站所有權
  → Vercel 用戶：選擇「HTML 檔案驗證」最簡單
  → 或使用「HTML 標籤驗證」
步驟 4: 提交 Sitemap
  → 輸入 sitemap.xml
步驟 5: 等待 Google 索引（3-7 天）
```

---

## 🟡 Priority 2：重要配置（大幅提升 SEO）

### 5️⃣ Open Graph Tags（社群分享優化）

```yaml
用途：
  → 分享到 Facebook/Twitter 時的預覽圖和文字
  → 增加分享的點擊率

效果：
  ❌ 沒設定：只顯示網址
  ✅ 有設定：有標題、圖片、描述
```

#### 📄 設定方式

```typescript
// app/page.tsx
export const metadata = {
  title: '專案管理工具',
  description: '免費的專案管理平台',
  
  // Open Graph
  openGraph: {
    title: '專案管理工具 | 免費線上協作',
    description: '提供團隊協作、任務追蹤功能',
    url: 'https://yoursite.com',
    siteName: 'MyApp',
    images: [
      {
        url: 'https://yoursite.com/og-image.jpg',  // 預覽圖
        width: 1200,
        height: 630,
      },
    ],
    type: 'website',
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: '專案管理工具',
    description: '免費的專案管理平台',
    images: ['https://yoursite.com/og-image.jpg'],
  },
}
```

---

### 6️⃣ 圖片優化

```yaml
為什麼重要？
  → 圖片也能被 Google 搜到
  → 加快網站載入速度
  → Google 很重視速度

必做 3 件事：
  ├─ 加 alt 屬性（替代文字）
  ├─ 壓縮圖片
  └─ 使用 Next.js Image 元件
```

#### 📄 Next.js Image 使用

```typescript
// ❌ 錯誤（直接用 <img>）
<img src="/screenshot.png" />

// ✅ 正確（用 Next.js Image）
import Image from 'next/image'

<Image 
  src="/screenshot.png"
  alt="專案管理平台介面截圖 - 顯示任務列表和甘特圖"
  width={800}
  height={600}
  priority  // 首頁主圖設為優先載入
/>
```

#### 📐 Alt 屬性撰寫規則

```yaml
alt 文字要具體描述圖片內容：

❌ 不好：
  alt="圖片"
  alt="screenshot"
  alt=""

✅ 好：
  alt="專案管理平台介面 - 任務看板視圖"
  alt="團隊成員在使用協作工具進行會議"
  alt="甘特圖顯示專案時程和里程碑"
```

---

### 7️⃣ 內部連結

```yaml
是什麼？
  → 你的網頁之間互相連結
  → 幫助 Google 爬蟲找到所有頁面

做法：
  ├─ 首頁連到各個功能頁
  ├─ 文章之間互相引用
  └─ 每個頁面都能從首頁到達
```

#### 範例結構

```
首頁 (/)
  ├─ 連到「功能介紹」(/features)
  ├─ 連到「使用教學」(/guide)
  ├─ 連到「案例分享」(/cases)
  └─ 連到「關於我們」(/about)

每個頁面:
  └─ Footer 有完整導航連結
```

---

### 8️⃣ 語意化 HTML

```yaml
用途：
  → 讓 Google 更容易理解你的內容結構

做法：
  ✅ 用正確的 HTML 標籤
  ❌ 不要全部都用 <div>
```

#### 範例

```html
<!-- ❌ 不好 -->
<div class="title">文章標題</div>
<div class="content">內容...</div>

<!-- ✅ 好 -->
<article>
  <h1>文章標題</h1>
  <p>第一段內容...</p>
  <p>第二段內容...</p>
  <section>
    <h2>小標題</h2>
    <p>段落內容...</p>
  </section>
</article>
```

---

## 🟢 Priority 3：進階配置（錦上添花）

### 9️⃣ Schema.org 結構化資料

告訴 Google 更詳細的資訊，可能出現「複合式搜尋結果」（有星星、評分）。
範例：文章（發布日期、作者）、產品（價格、評分）、活動（時間、地點）

### 🔟 Canonical URL

避免重複內容懲罰，告訴 Google 哪個是「正版」網址。
當同一內容有多個網址時使用。

### 1️⃣1️⃣ 多語系支持

如果有多語言版本，設定 hreflang 標籤告訴 Google 不同語言的對應頁面。

---

## ✅ 配置完成檢核表

### 逐項檢查（打勾代表完成）

```
□ 1. 每個頁面都有 title 和 description
□ 2. 生成了 sitemap.xml（可訪問）
□ 3. 設定了 robots.txt（可訪問）
□ 4. 註冊了 Google Search Console
□ 5. 提交了 Sitemap 到 Search Console
□ 6. 設定了 Open Graph 標籤
□ 7. 所有圖片都有 alt 屬性
□ 8. 使用 Next.js Image 元件
□ 9. 內部連結結構完整
□ 10. 使用語意化 HTML 標籤
```

---

## 🔧 實際操作範例（專案管理平台）

### 首頁 Meta Tags 設定

```typescript
// app/page.tsx
export const metadata = {
  title: '個人專案管理平台 | 追蹤你的所有專案',
  description: '管理個人專案、追蹤進度、記錄開發歷程。支援專案分類、狀態管理、圖片預覽等功能。',
  keywords: ['專案管理', '個人工具', '開發追蹤'],
  
  openGraph: {
    title: '個人專案管理平台',
    description: '追蹤你的所有專案，記錄開發歷程',
    url: 'https://9-25-personal-project-manager.vercel.app',
    images: ['/og-image.png'],
  },
}
```

### Sitemap 設定

```typescript
// app/sitemap.ts
export default async function sitemap() {
  const baseUrl = 'https://9-25-personal-project-manager.vercel.app'
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/admin`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]
}
```

### Robots.txt 設定

```typescript
// app/robots.ts
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: 'https://9-25-personal-project-manager.vercel.app/sitemap.xml',
  }
}
```

---

## 🧪 驗證工具

### 檢查配置是否正確

**Google 官方工具：**
- **PageSpeed Insights** - https://pagespeed.web.dev/ - 檢查載入速度
- **Mobile-Friendly Test** - https://search.google.com/test/mobile-friendly - 檢查手機版
- **Rich Results Test** - https://search.google.com/test/rich-results - 檢查結構化資料

**手動檢查：**
訪問這些網址應該都能正常顯示：
- `https://yoursite.com/sitemap.xml`
- `https://yoursite.com/robots.txt`

---

## ⚠️ 常見錯誤

**❌ 錯誤 1：只設定首頁的 Meta Tags**
- 每個頁面都要有獨立的 title 和 description

**❌ 錯誤 2：Sitemap 沒有動態更新**
- 不要寫死網址，要從資料庫動態生成

**❌ 錯誤 3：忘記提交給 Google**
- 配置完成後，一定要註冊 Search Console 並提交 Sitemap

**❌ 錯誤 4：圖片沒有 alt 屬性**
- 所有圖片都要有具體描述的 alt 文字

**❌ 錯誤 5：robots.txt 阻擋全部**
- 不要設定 `Disallow: /`，要正確設定允許和禁止的路徑

---

## 💡 重點回顧

```yaml
SEO 配置的核心：

必做（Priority 1）:
  1. Meta Tags（每頁都要）
  2. Sitemap.xml
  3. Robots.txt
  4. Google Search Console

重要（Priority 2）:
  5. Open Graph
  6. 圖片優化
  7. 內部連結
  8. 語意化 HTML

進階（Priority 3）:
  9. Schema.org
  10. Canonical URL
  11. 多語系

預估時間:
  第一次設定: 2-3 小時
  後續維護: 每月 30 分鐘
```

---

## 🚀 下一步

配置完成後，接下來要：

👉 **下一篇：[03_Google-Search-Console設定.md](03_Google-Search-Console設定.md)**
   - 手把手教你註冊和設定
   - 驗證網站所有權
   - 提交 Sitemap 給 Google
   - 追蹤搜尋表現

---

**更新日期**：2024-11-07  
**適用對象**：Vercel + Next.js 使用者  
**難度等級**：⭐⭐⭐ 中階（需要實際操作）

