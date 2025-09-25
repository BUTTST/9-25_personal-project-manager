const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// 圖標尺寸配置
const iconSizes = [
  { size: 16, name: 'project-showcase-icon-16.png' },
  { size: 32, name: 'project-showcase-icon-32.png' },
  { size: 48, name: 'project-showcase-icon-48.png' },
  { size: 128, name: 'project-showcase-icon-128.png' },
  { size: 256, name: 'project-showcase-icon-256.png' },
  { size: 512, name: 'project-showcase-icon-512.png' }
];

const sourceIconPath = path.join(__dirname, '../public/icons/project-showcase-icon.svg');
const outputDir = path.join(__dirname, '../public/icons/');

async function generateIcons() {
  try {
    console.log('🎨 開始生成專案圖標...');
    
    // 確保輸出目錄存在
    await fs.mkdir(outputDir, { recursive: true });
    
    // 讀取 SVG 文件
    const svgBuffer = await fs.readFile(sourceIconPath);
    
    // 為每個尺寸生成 PNG
    for (const { size, name } of iconSizes) {
      const outputPath = path.join(outputDir, name);
      
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ quality: 95 })
        .toFile(outputPath);
        
      console.log(`✅ 已生成: ${name} (${size}x${size})`);
    }
    
    // 更新 manifest.json
    await updateManifest();
    
    console.log('🎉 所有圖標生成完成！');
    
  } catch (error) {
    console.error('❌ 圖標生成失敗:', error);
    process.exit(1);
  }
}

async function updateManifest() {
  const manifestPath = path.join(__dirname, '../public/manifest.json');
  
  const manifest = {
    name: '專案展示平台',
    short_name: 'ProjectShowcase',
    description: '個人專案管理和展示平台',
    start_url: '/',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: '#3b82f6',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/project-showcase-icon-16.png',
        sizes: '16x16',
        type: 'image/png'
      },
      {
        src: '/icons/project-showcase-icon-32.png',
        sizes: '32x32',
        type: 'image/png'
      },
      {
        src: '/icons/project-showcase-icon-48.png',
        sizes: '48x48',
        type: 'image/png'
      },
      {
        src: '/icons/project-showcase-icon-128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icons/project-showcase-icon-256.png',
        sizes: '256x256',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icons/project-showcase-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  };
  
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ manifest.json 已更新');
}

// 執行生成
generateIcons();
