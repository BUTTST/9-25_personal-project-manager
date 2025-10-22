const fs = require('fs').promises;
const path = require('path');

/**
 * 自動掃描 public/前端截圖/ 目錄，生成 config/image-gallery.ts
 * 
 * 功能：
 * - 掃描所有 .png 圖片文件
 * - 從文件名自動提取標題
 * - 生成 TypeScript 配置文件
 * - 保持文件名排序（最新的在前）
 */

async function generateImageGallery() {
  const screenshotDir = path.join(__dirname, '../public/前端截圖');
  
  try {
    console.log('🖼️  開始掃描圖片目錄...');
    console.log(`📁 目錄位置: ${screenshotDir}`);
    
    // 確認目錄存在
    try {
      await fs.access(screenshotDir);
    } catch (error) {
      console.error('❌ 圖片目錄不存在！');
      console.error(`   請確認目錄存在: ${screenshotDir}`);
      process.exit(1);
    }
    
    // 讀取目錄中的所有文件
    const files = await fs.readdir(screenshotDir);
    const imageFiles = files.filter(f => 
      f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.webp')
    );
    
    if (imageFiles.length === 0) {
      console.warn('⚠️  未找到任何圖片文件（支援 .png, .jpg, .jpeg, .webp）');
      console.log('   建議先添加一些圖片到 public/前端截圖/ 目錄');
    } else {
      console.log(`✅ 找到 ${imageFiles.length} 張圖片`);
    }
    
    // 按文件名排序（降序，最新的在前）
    imageFiles.sort((a, b) => b.localeCompare(a));
    
    // 生成圖片配置
    const images = imageFiles.map((file) => {
      // 從文件名提取標題
      const nameWithoutExt = file.replace(/\.(png|jpg|jpeg|webp)$/i, '');
      
      // 移除日期前綴（例如：10-15- 或 2025-10-15-）
      let title = nameWithoutExt
        .replace(/^\d{1,4}-\d{1,2}-\d{1,2}[-_]?/g, '') // 移除完整日期
        .replace(/^\d{1,2}-\d{1,2}[-_]/g, ''); // 移除月-日前綴
      
      // 美化標題
      title = title
        .replace(/_/g, ' ') // 下劃線轉空格
        .replace(/\s+/g, ' ') // 多個空格合併
        .replace(/\(([^)]+)\)/g, '（$1）') // 英文括號轉中文括號
        .trim();
      
      // 生成唯一 ID（使用文件名，保持穩定性）
      const id = nameWithoutExt
        .toLowerCase()
        .replace(/[()（）\s]/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '');
      
      return {
        id,
        title,
        src: `/前端截圖/${file}`,
      };
    });
    
    // 生成 TypeScript 代碼
    const code = `export interface GalleryImage {
  id: string;
  title: string;
  description?: string;
  src: string;
  thumbnail?: string;
}

/**
 * ⚠️ 此文件由 scripts/generate-image-gallery.js 自動生成
 * 
 * 自動生成時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
 * 圖片來源目錄：public/前端截圖/
 * 圖片數量：${images.length}
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
${images.map(img => `  {
    id: '${img.id}',
    title: '${img.title}',
    src: '${img.src}',
  }`).join(',\n')}
];

export function getGalleryImageById(id: string) {
  return imageGallery.find((image) => image.id === id) || null;
}
`;
    
    // 寫入文件
    const outputPath = path.join(__dirname, '../config/image-gallery.ts');
    await fs.writeFile(outputPath, code);
    
    console.log('');
    console.log('✅ 圖片配置文件已生成！');
    console.log(`   📄 文件位置: ${outputPath}`);
    console.log(`   📊 圖片數量: ${images.length}`);
    
    if (images.length > 0) {
      console.log('');
      console.log('📋 圖片清單：');
      images.forEach((img, index) => {
        console.log(`   ${(index + 1).toString().padStart(2, ' ')}. ${img.title}`);
      });
    }
    
    console.log('');
    console.log('🎉 完成！圖片現在可以在管理後台的編輯界面中選擇了。');
    
  } catch (error) {
    console.error('');
    console.error('❌ 生成失敗:', error.message);
    console.error('');
    console.error('詳細錯誤：', error);
    process.exit(1);
  }
}

// 執行生成
generateImageGallery();

