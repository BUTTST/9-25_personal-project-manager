/**
 * 【本地腳本】批量添加專案工具（增量式 + 自動去重）
 * 
 * 📌 功能：
 * 1. 從「本地腳本-專案數據範本.json」讀取專案數據
 * 2. 自動獲取現有專案列表
 * 3. 基於 dateAndFileName 進行去重
 * 4. 只上傳真正新的專案（不會覆蓋現有資料）
 * 5. 顯示詳細進度和結果
 * 
 * ⚠️ 使用前請先配置：
 * - API_URL: 你的 Vercel 部署域名
 * - ADMIN_PASSWORD: 管理員密碼
 */

const fs = require('fs');
const path = require('path');

// ===== 配置區（使用前請修改） =====
const CONFIG = {
  // 你的部署域名（生產環境）
  API_URL: 'https://你的域名.vercel.app/api/projects',
  
  // 或使用本地開發環境
  // API_URL: 'http://localhost:3000/api/projects',
  
  // 管理員密碼（請替換為你的實際密碼）
  ADMIN_PASSWORD: '你的管理員密碼',
  
  // 數據檔案路徑
  DATA_FILE: path.join(__dirname, '本地腳本-專案數據範本.json'),
};

// ===== 顏色輸出工具 =====
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// ===== 主要函數 =====

/**
 * 獲取現有專案列表
 */
async function fetchExistingProjects() {
  try {
    log('blue', '\n📡 正在獲取現有專案列表...');
    
    const response = await fetch(`${CONFIG.API_URL}?admin=true`, {
      headers: {
        'x-admin-password': CONFIG.ADMIN_PASSWORD,
      },
    });

    if (!response.ok) {
      throw new Error(`API 請求失敗: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    log('green', `✓ 成功獲取 ${data.projects.length} 個現有專案\n`);
    
    return data.projects;
  } catch (error) {
    log('red', `✗ 獲取現有專案失敗: ${error.message}`);
    throw error;
  }
}

/**
 * 讀取要添加的專案數據
 */
function loadProjectsData() {
  try {
    log('blue', '📂 正在讀取專案數據檔案...');
    
    if (!fs.existsSync(CONFIG.DATA_FILE)) {
      throw new Error(`找不到數據檔案: ${CONFIG.DATA_FILE}`);
    }

    const fileContent = fs.readFileSync(CONFIG.DATA_FILE, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.projects || !Array.isArray(data.projects)) {
      throw new Error('數據格式錯誤: 缺少 projects 陣列');
    }

    log('green', `✓ 成功讀取 ${data.projects.length} 個專案\n`);
    
    return data.projects;
  } catch (error) {
    log('red', `✗ 讀取數據檔案失敗: ${error.message}`);
    throw error;
  }
}

/**
 * 過濾出新專案（去重）
 */
function filterNewProjects(existingProjects, newProjects) {
  log('blue', '🔍 正在進行去重檢查...\n');
  
  const existingNames = new Set(
    existingProjects.map(p => p.dateAndFileName.trim())
  );
  
  const filtered = {
    new: [],
    duplicate: [],
  };

  newProjects.forEach(project => {
    const name = project.dateAndFileName.trim();
    
    if (existingNames.has(name)) {
      filtered.duplicate.push(project);
      log('yellow', `  ⊘ 跳過重複: ${name}`);
    } else {
      filtered.new.push(project);
      log('green', `  ✓ 新專案: ${name}`);
    }
  });

  console.log('');
  log('cyan', `📊 統計結果:`);
  log('green', `  • 新專案: ${filtered.new.length} 個`);
  log('yellow', `  • 重複跳過: ${filtered.duplicate.length} 個`);
  console.log('');

  return filtered;
}

/**
 * 上傳單個專案
 */
async function uploadProject(project) {
  const response = await fetch(CONFIG.API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': CONFIG.ADMIN_PASSWORD,
    },
    body: JSON.stringify(project),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '上傳失敗');
  }

  return await response.json();
}

/**
 * 批量上傳專案
 */
async function batchUploadProjects(projects) {
  if (projects.length === 0) {
    log('yellow', '⚠️  沒有新專案需要上傳');
    return { success: 0, failed: 0 };
  }

  log('blue', `\n🚀 開始上傳 ${projects.length} 個新專案...\n`);

  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const progress = `[${i + 1}/${projects.length}]`;

    try {
      await uploadProject(project);
      log('green', `${progress} ✓ 成功: ${project.dateAndFileName}`);
      results.success++;
      
      // 稍微延遲，避免請求過快
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      log('red', `${progress} ✗ 失敗: ${project.dateAndFileName} - ${error.message}`);
      results.failed++;
      results.errors.push({
        project: project.dateAndFileName,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * 主函數
 */
async function main() {
  console.log('');
  log('cyan', '═══════════════════════════════════════════════════════');
  log('cyan', '  批量添加專案工具 v1.0');
  log('cyan', '  增量式 + 自動去重');
  log('cyan', '═══════════════════════════════════════════════════════');
  console.log('');

  try {
    // 步驟 1: 獲取現有專案
    const existingProjects = await fetchExistingProjects();

    // 步驟 2: 讀取要添加的專案
    const newProjectsData = loadProjectsData();

    // 步驟 3: 去重
    const { new: newProjects, duplicate: duplicates } = filterNewProjects(
      existingProjects,
      newProjectsData
    );

    // 如果沒有新專案，提前結束
    if (newProjects.length === 0) {
      log('yellow', '\n✓ 所有專案都已存在，無需上傳');
      return;
    }

    // 步驟 4: 確認上傳
    log('yellow', `⚠️  即將上傳 ${newProjects.length} 個新專案`);
    log('blue', '   按 Ctrl+C 取消，或等待 3 秒後自動開始...\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 步驟 5: 批量上傳
    const results = await batchUploadProjects(newProjects);

    // 步驟 6: 顯示最終結果
    console.log('');
    log('cyan', '═══════════════════════════════════════════════════════');
    log('cyan', '  上傳完成');
    log('cyan', '═══════════════════════════════════════════════════════');
    log('green', `✓ 成功: ${results.success} 個`);
    if (results.failed > 0) {
      log('red', `✗ 失敗: ${results.failed} 個`);
      console.log('');
      log('red', '失敗的專案:');
      results.errors.forEach(err => {
        log('red', `  • ${err.project}: ${err.error}`);
      });
    }
    log('yellow', `⊘ 跳過重複: ${duplicates.length} 個`);
    console.log('');

    if (results.failed === 0) {
      log('green', '🎉 所有專案已成功添加！');
    } else {
      log('yellow', '⚠️  部分專案上傳失敗，請檢查錯誤訊息');
    }

  } catch (error) {
    console.log('');
    log('red', '═══════════════════════════════════════════════════════');
    log('red', '  執行失敗');
    log('red', '═══════════════════════════════════════════════════════');
    log('red', `錯誤: ${error.message}`);
    console.log('');
    process.exit(1);
  }
}

// ===== 執行 =====
main();

