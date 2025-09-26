const content = `| 日期＋檔案名稱 | 說明 | GitHub | vercel | 路徑 | 狀態備註 |
| --- | --- | --- | --- | --- | --- |
| 7-30 V6_確認vercel授權-9
保持最新yt-dlp | ［重要］核心whisper專案 | [**8-14_Whisper__vercel-RunPod-GitHub-**](https://github.com/BUTTST/8-14_Whisper__vercel-RunPod-GitHub-) | [8-14-whisper-vercel-run-pod-git-hub](https://vercel.com/titans-projects-0ee27614/8-14-whisper-vercel-run-pod-git-hub) | E:\個人項目 |  |
| 7-24 抓取實測 計畫模式 | ［重要］金流系統 | [**7-24-CashCalculator_PlanningMode**](https://github.com/BUTTST/7-24-CashCalculator_PlanningMode) | [7-24-cash-calculator-planning-mode](https://vercel.com/titans-projects-0ee27614/7-24-cash-calculator-planning-mode) | E:\個人項目 | KV資料庫又被停用了
但目前欠缺沙盒驗證 |
|  |  |  |  |  |  |
|  | ［ 次］想法採集器 | [**9-12_Idea-Collector**](https://github.com/BUTTST/9-12_Idea-Collector) | [9-12-idea-collector](https://vercel.com/titans-projects-0ee27614/9-12-idea-collector) |  |  |
|  | ［ 次］現金分配管理工具 | [**5-25_CashManagementCalculator](https://github.com/BUTTST/5-25_CashManagementCalculator)**  | [5-25-cash-management-calculator](https://vercel.com/titans-projects-0ee27614/5-25-cash-management-calculator) |  |  |
|  | ［ 次］預覽樣式合集 | [**9-10-ui-components**](https://github.com/BUTTST/9-10-ui-components) | 未部屬 |  |  |
|  |  |  |  |  |  |
| 9-3_rapidapi API 音訊下載
_抓取後Gemini轉譯 | ［子實踐］更換音訊來源供應商 | https://colab.research.google.com/drive/1cJJrVQRqaK4lNO-zncFYdF6G7adIRmxJ?authuser=1 |  | E:\個人項目 |  |
| 8-23 應用圖標（icon） | ［子實踐］圖標實踐 | [**8-23_pwa-icons-maskable**](https://github.com/BUTTST/8-23_pwa-icons-maskable) |  | E:\個人項目 |  |
| 9-6_Colab 批次 Batch
呼叫 LLM API | ［子實踐］實踐 Batch
呼叫批次 API | https://colab.research.google.com/drive/1ITD8s0bGjTkoCalnht5rLzft4BERVT4P?authuser=1 |  | E:\個人項目\其他嘗試 |  |
|  |  |  |  |  |  |
| 7-18 翻譯colab 倒出效果 | ［已完成］
Colab 查詢 Gemini API 模型
視覺化排版列表 | 這是Colab項目 |  | E:\個人項目 |  |
| 7-28_測試 mp3音訊檔_Gemini_API | [ 已完成 ]
測試 yt-dlp  | [**7-28_youtubeMp3-to-geminiApi**](https://github.com/BUTTST/7-28_youtubeMp3-to-geminiApi-) |  | E:\個人項目 |  |
|  |  |  |  |  |  |
| 7-30 Colab多項目＋
專題whisper合併 | [已捨棄]
之前的嘗試合併 | [**8-1_Colab-MultiProject_WhisperProject**](https://github.com/BUTTST/8-1_Colab-MultiProject_WhisperProject) |  | E:\個人項目 |  |
| 7-27 轉錄工具合併 | [已捨棄]
之前的嘗試合併 | 無 |  | E:\個人項目 |  |
|  |  |  |  |  |  |
`;

function parseProjectTable(text) {
  const lines = text.split('\n');
  const rowStrings = [];
  let currentRow = null;

  console.log('=== DEBUG: Raw input lines ===');
  lines.forEach((line, i) => {
    console.log(`Line ${i}: "${line}"`);
  });

  for (const rawLine of lines) {
    const trimmedLine = rawLine.trimEnd();
    if (!trimmedLine.trim()) continue;

    if (trimmedLine.trimStart().startsWith('|')) {
      if (currentRow) {
        rowStrings.push(currentRow);
        console.log(`Added row: "${currentRow}"`);
      }
      currentRow = trimmedLine;
    } else if (currentRow) {
      currentRow += ` ${trimmedLine}`;
      console.log(`Extended row: "${currentRow}"`);
    }
  }

  if (currentRow) {
    rowStrings.push(currentRow);
    console.log(`Added final row: "${currentRow}"`);
  }

  console.log('\n=== DEBUG: Final row strings ===');
  rowStrings.forEach((row, i) => {
    console.log(`Row ${i}: "${row}"`);
  });

  const extractUrl = (value) => {
    const trimmed = value ? value.trim() : '';
    if (!trimmed || trimmed === 'undefined') return '';
    if (trimmed.includes('無') || trimmed.includes('未部屬')) return '';

    const boldMatch = trimmed.match(/\*\*\[.*?\]\*\*\((.*?)\)/);
    if (boldMatch) return boldMatch[1];

    const markdownMatch = trimmed.match(/\[.*?\]\((.*?)\)/);
    if (markdownMatch) return markdownMatch[1];

    return trimmed;
  };

  const projects = [];

  console.log('\n=== DEBUG: Processing rows ===');
  for (let i = 0; i < rowStrings.length; i++) {
    const row = rowStrings[i];
    console.log(`\nProcessing row ${i}: "${row}"`);

    if (!row.includes('|')) {
      console.log('Skipping: no pipe characters');
      continue;
    }
    if (row.includes('|---') || row.includes('日期＋檔案名稱')) {
      console.log('Skipping: header or separator');
      continue;
    }

    const rawColumns = row.split('|');
    console.log('Raw columns after split:', rawColumns);

    if (rawColumns[0] === '') {
      rawColumns.shift();
      console.log('Shifted first empty column');
    }
    if (rawColumns.length && rawColumns[rawColumns.length - 1].trim() === '') {
      rawColumns.pop();
      console.log('Popped last empty column');
    }

    const columns = rawColumns.map(col => col.trim());
    console.log('Final columns:', columns);

    if (columns.every(col => !col)) {
      console.log('Skipping: all columns empty');
      continue;
    }

    while (columns.length < 6) {
      columns.push('');
    }

    const [
      dateFileName = '',
      description = '',
      github = '',
      vercel = '',
      path = '',
      statusNote = '',
      ...extraColumns
    ] = columns;

    console.log('Extracted fields:');
    console.log('- dateFileName:', `"${dateFileName}"`);
    console.log('- description:', `"${description}"`);
    console.log('- github:', `"${github}"`);
    console.log('- vercel:', `"${vercel}"`);
    console.log('- path:', `"${path}"`);
    console.log('- statusNote:', `"${statusNote}"`);

    if (!description.trim()) {
      console.log('Skipping: no description');
      continue;
    }

    const combinedStatusNote = [statusNote, ...extraColumns]
      .filter(Boolean)
      .join(' ');

    const project = {
      dateAndFileName: dateFileName.trim(),
      description: description.trim(),
      github: extractUrl(github),
      vercel: extractUrl(vercel),
      path: path && path !== 'undefined' ? path.trim() : '',
      statusNote: combinedStatusNote && combinedStatusNote !== 'undefined' ? combinedStatusNote.trim() : ''
    };

    console.log('Created project:', project);
    projects.push(project);
  }

  console.log('\n=== FINAL RESULT ===');
  console.log(`Total projects found: ${projects.length}`);
  projects.forEach((project, i) => {
    console.log(`Project ${i + 1}:`, project);
  });

  return projects;
}

console.log('Starting parse...');
const result = parseProjectTable(content);
console.log('\nFinal projects count:', result.length);
